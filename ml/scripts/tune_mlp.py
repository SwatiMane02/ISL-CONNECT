"""
ISL CONNECT - MLP Model Tuning & Experimentation
================================================
Systematic exploration of MLP architectures, regularization, hyperparameters,
class weights, and data augmentation for ISL hand landmark classification.

All model selection is performed strictly on the VALIDATION set.
The Test set is NEVER accessed during tuning.
"""

from typing import Tuple, Dict, List, Optional
import os
import sys
import json
import time
import argparse
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers, callbacks
from sklearn.utils.class_weight import compute_class_weight



def load_datasets(train_csv: str, val_csv: str):
    """Loads training and validation landmark features and labels."""
    df_train = pd.read_csv(train_csv)
    df_val = pd.read_csv(val_csv)
    
    meta_cols = ["label", "class_id", "image_path"]
    feat_cols = [c for c in df_train.columns if c not in meta_cols]
    
    X_train = df_train[feat_cols].values.astype(np.float32)
    y_train = df_train["class_id"].values.astype(np.int32)
    
    X_val = df_val[feat_cols].values.astype(np.float32)
    y_val = df_val["class_id"].values.astype(np.int32)
    
    return X_train, y_train, X_val, y_val, feat_cols


def augment_landmarks(X: np.ndarray, y: np.ndarray, jitter_std: float = 0.012, scale_range: tuple = (0.96, 1.04)) -> Tuple[np.ndarray, np.ndarray]:
    """
    Applies subtle, physically plausible data augmentation to training landmarks:
    1. Small random Gaussian jitter (excluding wrist landmark 0 which stays at 0,0,0).
    2. Small random scaling.
    3. Small random 3D rotations (+/- 6 degrees).
    """
    augmented_X = []
    augmented_y = []
    
    for i in range(len(X)):
        sample = X[i].reshape(21, 3).copy()
        
        # Original
        augmented_X.append(X[i])
        augmented_y.append(y[i])
        
        # Augmented version
        aug_sample = sample.copy()
        
        # 1. Jitter on non-wrist landmarks (index 1 to 20)
        noise = np.random.normal(0, jitter_std, size=(20, 3)).astype(np.float32)
        aug_sample[1:] += noise
        
        # 2. Random slight scale
        s = np.random.uniform(scale_range[0], scale_range[1])
        aug_sample *= s
        
        # 3. Small random rotation around z-axis
        angle = np.radians(np.random.uniform(-6, 6))
        cos_a, sin_a = np.cos(angle), np.sin(angle)
        rot_matrix = np.array([
            [cos_a, -sin_a, 0],
            [sin_a,  cos_a, 0],
            [0,      0,     1]
        ], dtype=np.float32)
        aug_sample = np.dot(aug_sample, rot_matrix)
        
        # Re-normalize scale to keep within [-1, 1]
        wrist = aug_sample[0].copy()
        aug_sample = aug_sample - wrist
        dists = np.linalg.norm(aug_sample, axis=1)
        max_d = float(np.max(dists))
        if max_d > 1e-6:
            aug_sample = aug_sample / max_d
            
        augmented_X.append(aug_sample.flatten())
        augmented_y.append(y[i])
        
    return np.array(augmented_X, dtype=np.float32), np.array(augmented_y, dtype=np.int32)


# ==============================================================================
# Model Architecture Builders
# ==============================================================================

def build_baseline_mlp(dropout: float = 0.25, l2_reg: float = 0.0) -> keras.Model:
    """Experiment A: Baseline (63 -> 128 -> 64 -> 26)"""
    reg = regularizers.l2(l2_reg) if l2_reg > 0 else None
    return keras.Sequential([
        layers.Input(shape=(63,)),
        layers.Dense(128, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(64, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(26, activation="softmax")
    ])


def build_wider_mlp(dropout: float = 0.30, l2_reg: float = 1e-4) -> keras.Model:
    """Experiment C: Wider MLP (63 -> 256 -> 128 -> 26)"""
    reg = regularizers.l2(l2_reg) if l2_reg > 0 else None
    return keras.Sequential([
        layers.Input(shape=(63,)),
        layers.Dense(256, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(128, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(26, activation="softmax")
    ])


def build_deeper_mlp(dropout: float = 0.25, l2_reg: float = 1e-4) -> keras.Model:
    """Experiment D: Deeper MLP (63 -> 128 -> 64 -> 32 -> 26)"""
    reg = regularizers.l2(l2_reg) if l2_reg > 0 else None
    return keras.Sequential([
        layers.Input(shape=(63,)),
        layers.Dense(128, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(64, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(32, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(26, activation="softmax")
    ])


def build_compact_mlp(dropout: float = 0.20, l2_reg: float = 0.0) -> keras.Model:
    """Experiment E: Smaller MLP (63 -> 128 -> 32 -> 26)"""
    reg = regularizers.l2(l2_reg) if l2_reg > 0 else None
    return keras.Sequential([
        layers.Input(shape=(63,)),
        layers.Dense(128, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(32, activation="relu", kernel_regularizer=reg),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Dense(26, activation="softmax")
    ])


def build_residual_mlp(dropout: float = 0.30, l2_reg: float = 1e-4) -> keras.Model:
    """Experiment F: Residual / Skip-Connection MLP (63 -> 256 -> Residual Block (128) -> 64 -> 26)"""
    reg = regularizers.l2(l2_reg) if l2_reg > 0 else None
    
    inp = layers.Input(shape=(63,))
    x = layers.Dense(128, activation="relu", kernel_regularizer=reg)(inp)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(dropout)(x)
    
    # Residual block
    res = layers.Dense(128, activation="relu", kernel_regularizer=reg)(x)
    res = layers.BatchNormalization()(res)
    res = layers.Dropout(dropout)(res)
    res = layers.Dense(128, activation="relu", kernel_regularizer=reg)(res)
    res = layers.BatchNormalization()(res)
    
    x = layers.Add()([x, res])
    x = layers.Activation("relu")(x)
    x = layers.Dropout(dropout)(x)
    
    x = layers.Dense(64, activation="relu", kernel_regularizer=reg)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(dropout)(x)
    
    out = layers.Dense(26, activation="softmax")(x)
    return keras.Model(inputs=inp, outputs=out, name="Residual_MLP")


def run_experiment(
    exp_id: str,
    model_fn,
    model_kwargs: dict,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    lr: float = 0.001,
    batch_size: int = 32,
    epochs: int = 70,
    class_weight: dict = None,
    checkpoint_dir: str = "ml/models/checkpoints",
    notes: str = ""
) -> dict:
    """Executes a single controlled experiment."""
    os.makedirs(checkpoint_dir, exist_ok=True)
    chk_path = os.path.join(checkpoint_dir, f"{exp_id}.keras")
    
    kwargs = dict(model_kwargs)
    arch_desc = kwargs.pop("arch_desc", "MLP")
    model = model_fn(**kwargs)
    optimizer = keras.optimizers.Adam(learning_rate=lr)
    model.compile(
        optimizer=optimizer,
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    
    cb_list = [
        callbacks.ModelCheckpoint(
            filepath=chk_path,
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
            verbose=0
        ),
        callbacks.EarlyStopping(
            monitor="val_loss",
            patience=14,
            restore_best_weights=True,
            verbose=0
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=0
        )
    ]
    
    start_t = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        class_weight=class_weight,
        callbacks=cb_list,
        verbose=0
    )
    elapsed = round(time.time() - start_t, 2)
    
    # Evaluate best saved weights
    best_model = keras.models.load_model(chk_path)
    train_loss, train_acc = best_model.evaluate(X_train, y_train, verbose=0)
    val_loss, val_acc = best_model.evaluate(X_val, y_val, verbose=0)
    
    best_epoch = int(np.argmax(history.history["val_accuracy"]) + 1)
    
    result = {
        "experiment": exp_id,
        "architecture": arch_desc,
        "dropout": model_kwargs.get("dropout", 0.0),

        "l2_reg": model_kwargs.get("l2_reg", 0.0),
        "learning_rate": lr,
        "batch_size": batch_size,
        "best_epoch": best_epoch,
        "total_epochs": len(history.history["loss"]),
        "train_loss": round(float(train_loss), 4),
        "train_accuracy": round(float(train_acc) * 100, 2),
        "val_loss": round(float(val_loss), 4),
        "val_accuracy": round(float(val_acc) * 100, 2),
        "training_time_s": elapsed,
        "checkpoint_path": chk_path,
        "notes": notes
    }
    
    print(f"[{exp_id}] Train Acc: {result['train_accuracy']}% | Val Acc: {result['val_accuracy']}% | Val Loss: {result['val_loss']} | Time: {elapsed}s")
    return result


def main():
    parser = argparse.ArgumentParser(description="Tune ISL MLP Classifier")
    parser.add_argument("--train-csv", type=str, default="ml/output/train_landmarks.csv")
    parser.add_argument("--val-csv", type=str, default="ml/output/validation_landmarks.csv")
    parser.add_argument("--output-csv", type=str, default="ml/output/mlp_experiment_results.csv")
    
    args = parser.parse_args()
    
    print("=" * 80)
    print("                ISL CONNECT - SYSTEMATIC MLP EXPERIMENTS                ")
    print("=" * 80)
    
    # 1. Load data
    X_train, y_train, X_val, y_val, feat_cols = load_datasets(args.train_csv, args.val_csv)
    print(f"Train samples: {len(X_train)} | Validation samples: {len(X_val)}")
    
    # 2. Compute class weights
    classes_unique = np.unique(y_train)
    weights = compute_class_weight(class_weight="balanced", classes=classes_unique, y=y_train)
    class_weight_dict = {int(c): float(w) for c, w in zip(classes_unique, weights)}
    
    # 3. Create augmented dataset for testing augmentation
    print("Generating augmented training dataset for augmentation experiments...")
    X_train_aug, y_train_aug = augment_landmarks(X_train, y_train, jitter_std=0.012)
    print(f"Augmented Train samples: {len(X_train_aug)}")
    
    experiments = []
    
    # --------------------------------------------------------------------------
    # Group 1: Architectural Configurations (lr=0.001, batch_size=32)
    # --------------------------------------------------------------------------
    print("\n--- Running Architectural Experiments ---")
    
    # Exp A: Baseline
    exp_a = run_experiment(
        "Exp_A_Baseline",
        build_baseline_mlp,
        {"dropout": 0.25, "l2_reg": 0.0, "arch_desc": "63->128->64->26"},
        X_train, y_train, X_val, y_val,
        lr=0.001, batch_size=32,
        notes="Current Baseline"
    )
    experiments.append(exp_a)
    
    # Exp B: Regularized Baseline (Dropout 0.35 + L2 1e-4)
    exp_b = run_experiment(
        "Exp_B_Regularized",
        build_baseline_mlp,
        {"dropout": 0.35, "l2_reg": 1e-4, "arch_desc": "63->128->64->26 (Reg)"},
        X_train, y_train, X_val, y_val,
        lr=0.001, batch_size=32,
        notes="Higher Dropout (0.35) + L2 Regularization (1e-4)"
    )
    experiments.append(exp_b)
    
    # Exp C: Wider Model (63 -> 256 -> 128 -> 26)
    exp_c = run_experiment(
        "Exp_C_Wider",
        build_wider_mlp,
        {"dropout": 0.30, "l2_reg": 1e-4, "arch_desc": "63->256->128->26"},
        X_train, y_train, X_val, y_val,
        lr=0.001, batch_size=32,
        notes="Wider MLP (256-128)"
    )
    experiments.append(exp_c)
    
    # Exp D: Deeper Model (63 -> 128 -> 64 -> 32 -> 26)
    exp_d = run_experiment(
        "Exp_D_Deeper",
        build_deeper_mlp,
        {"dropout": 0.25, "l2_reg": 1e-4, "arch_desc": "63->128->64->32->26"},
        X_train, y_train, X_val, y_val,
        lr=0.001, batch_size=32,
        notes="Deeper MLP (128-64-32)"
    )
    experiments.append(exp_d)
    
    # Exp E: Compact Model (63 -> 128 -> 32 -> 26)
    exp_e = run_experiment(
        "Exp_E_Compact",
        build_compact_mlp,
        {"dropout": 0.20, "l2_reg": 0.0, "arch_desc": "63->128->32->26"},
        X_train, y_train, X_val, y_val,
        lr=0.001, batch_size=32,
        notes="Smaller Compact MLP (128-32)"
    )
    experiments.append(exp_e)
    
    # Exp F: Residual MLP
    exp_f = run_experiment(
        "Exp_F_Residual",
        build_residual_mlp,
        {"dropout": 0.30, "l2_reg": 1e-4, "arch_desc": "63->128->ResBlock(128)->64->26"},
        X_train, y_train, X_val, y_val,
        lr=0.001, batch_size=32,
        notes="Residual Skip-Connection MLP"
    )
    experiments.append(exp_f)
    
    # --------------------------------------------------------------------------
    # Group 2: Learning Rate & Batch Size Variations
    # --------------------------------------------------------------------------
    print("\n--- Running Learning Rate & Batch Size Experiments ---")
    
    # Exp G: Wider MLP with lr=0.0005, batch_size=32
    exp_g = run_experiment(
        "Exp_G_Wider_lr5e-4",
        build_wider_mlp,
        {"dropout": 0.30, "l2_reg": 1e-4, "arch_desc": "63->256->128->26"},
        X_train, y_train, X_val, y_val,
        lr=0.0005, batch_size=32,
        notes="Wider MLP with lower lr (5e-4)"
    )
    experiments.append(exp_g)
    
    # Exp H: Wider MLP with lr=0.001, batch_size=64
    exp_h = run_experiment(
        "Exp_H_Wider_bs64",
        build_wider_mlp,
        {"dropout": 0.30, "l2_reg": 1e-4, "arch_desc": "63->256->128->26"},
        X_train, y_train, X_val, y_val,
        lr=0.001, batch_size=64,
        notes="Wider MLP with batch_size=64"
    )
    experiments.append(exp_h)
    
    # --------------------------------------------------------------------------
    # Group 3: Class Weights & Data Augmentation
    # --------------------------------------------------------------------------
    print("\n--- Running Class Weights & Augmentation Experiments ---")
    
    # Exp I: Wider MLP with Class Weights
    exp_i = run_experiment(
        "Exp_I_Wider_ClassWeights",
        build_wider_mlp,
        {"dropout": 0.30, "l2_reg": 1e-4, "arch_desc": "63->256->128->26"},
        X_train, y_train, X_val, y_val,
        lr=0.0005, batch_size=32,
        class_weight=class_weight_dict,
        notes="Wider MLP + Balanced Class Weights"
    )
    experiments.append(exp_i)
    
    # Exp J: Wider MLP with Data Augmentation
    exp_j = run_experiment(
        "Exp_J_Wider_Augmented",
        build_wider_mlp,
        {"dropout": 0.30, "l2_reg": 1e-4, "arch_desc": "63->256->128->26"},
        X_train_aug, y_train_aug, X_val, y_val,
        lr=0.0005, batch_size=32,
        notes="Wider MLP + 2x Augmented Landmark Training Data"
    )
    experiments.append(exp_j)
    
    # Exp K: Residual MLP with Data Augmentation
    exp_k = run_experiment(
        "Exp_K_Residual_Augmented",
        build_residual_mlp,
        {"dropout": 0.30, "l2_reg": 1e-4, "arch_desc": "63->128->ResBlock(128)->64->26"},
        X_train_aug, y_train_aug, X_val, y_val,
        lr=0.0005, batch_size=32,
        notes="Residual MLP + 2x Augmented Landmark Training Data"
    )
    experiments.append(exp_k)
    
    # 4. Save results to CSV
    df_results = pd.DataFrame(experiments)
    df_results = df_results.sort_values(by="val_accuracy", ascending=False)
    df_results.to_csv(args.output_csv, index=False)
    print(f"\nSaved experiment results table to: {args.output_csv}")
    
    print("\n" + "=" * 80)
    print("                     ALL EXPERIMENT RESULTS (RANKED BY VAL ACC)                 ")
    print("=" * 80)
    print(df_results[["experiment", "architecture", "dropout", "learning_rate", "batch_size", "train_accuracy", "val_accuracy", "val_loss", "notes"]].to_string(index=False))
    
    # Select best model based strictly on validation accuracy
    best_exp = df_results.iloc[0]
    print("\n" + "=" * 80)
    print(f"SELECTED BEST MODEL: {best_exp['experiment']}")
    print(f"Validation Accuracy: {best_exp['val_accuracy']}% (Validation Loss: {best_exp['val_loss']})")
    print(f"Checkpoint Path:     {best_exp['checkpoint_path']}")
    print("=" * 80)


if __name__ == "__main__":
    main()
