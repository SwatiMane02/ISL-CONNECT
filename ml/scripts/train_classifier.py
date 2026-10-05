"""
ISL CONNECT - Model Training Script
===================================
Trains a lightweight Neural Network classifier on the 63 normalized hand landmark features.
Uses separate Training and Validation sets with EarlyStopping and ModelCheckpoint.
"""

import os
import sys
import json
import argparse
import time
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks


def load_dataset(csv_path: str):
    """Loads landmark features and class IDs from a CSV file."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at: {csv_path}")
        
    df = pd.read_csv(csv_path)
    meta_cols = ["label", "class_id", "image_path"]
    feature_cols = [c for c in df.columns if c not in meta_cols]
    
    if len(feature_cols) != 63:
        raise ValueError(f"Expected 63 feature columns, found {len(feature_cols)} in {csv_path}")
        
    X = df[feature_cols].values.astype(np.float32)
    y = df["class_id"].values.astype(np.int32)
    labels = df["label"].values
    
    return X, y, labels, feature_cols


def build_model(input_dim: int = 63, num_classes: int = 26, dropout_rate: float = 0.25) -> keras.Model:
    """
    Builds a lightweight MLP classifier suitable for browser inference.
    
    Architecture:
    Input (63) -> Dense(128, ReLU) -> Dropout -> Dense(64, ReLU) -> Dropout -> Dense(26, Softmax)
    """
    model = keras.Sequential([
        layers.Input(shape=(input_dim,), name="landmark_input"),
        layers.Dense(128, activation="relu", name="dense_128"),
        layers.BatchNormalization(name="batch_norm_1"),
        layers.Dropout(dropout_rate, name="dropout_1"),
        layers.Dense(64, activation="relu", name="dense_64"),
        layers.BatchNormalization(name="batch_norm_2"),
        layers.Dropout(dropout_rate, name="dropout_2"),
        layers.Dense(num_classes, activation="softmax", name="output_softmax")
    ], name="ISL_Landmark_Classifier")
    
    return model


def main():
    parser = argparse.ArgumentParser(description="Train ISL Landmark Classifier")
    parser.add_argument("--train-csv", type=str, default="ml/output/train_landmarks.csv")
    parser.add_argument("--val-csv", type=str, default="ml/output/validation_landmarks.csv")
    parser.add_argument("--models-dir", type=str, default="ml/models")
    parser.add_argument("--output-dir", type=str, default="ml/output")
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--dropout", type=float, default=0.25)
    
    args = parser.parse_args()
    
    os.makedirs(args.models_dir, exist_ok=True)
    os.makedirs(args.output_dir, exist_ok=True)
    
    print("=" * 60)
    print("ISL CONNECT - NEURAL NETWORK MODEL TRAINING")
    print("=" * 60)
    
    # 1. Load datasets
    print("\nLoading datasets...")
    X_train, y_train, _, _ = load_dataset(args.train_csv)
    X_val, y_val, _, _ = load_dataset(args.val_csv)
    
    print(f"Training samples:   {X_train.shape[0]} (features: {X_train.shape[1]})")
    print(f"Validation samples: {X_val.shape[0]} (features: {X_val.shape[1]})")
    
    # 2. Build model
    model = build_model(input_dim=63, num_classes=26, dropout_rate=args.dropout)
    model.summary()
    
    # 3. Compile model
    optimizer = keras.optimizers.Adam(learning_rate=args.learning_rate)
    model.compile(
        optimizer=optimizer,
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    
    # 4. Callbacks
    best_model_path = os.path.join(args.models_dir, "best_model.keras")
    checkpoint_cb = callbacks.ModelCheckpoint(
        filepath=best_model_path,
        monitor="val_accuracy",
        mode="max",
        save_best_only=True,
        verbose=1
    )
    
    early_stopping_cb = callbacks.EarlyStopping(
        monitor="val_loss",
        patience=15,
        restore_best_weights=True,
        verbose=1
    )
    
    reduce_lr_cb = callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=6,
        min_lr=1e-6,
        verbose=1
    )
    
    # 5. Train
    print(f"\nTraining for up to {args.epochs} epochs (batch size: {args.batch_size})...")
    start_time = time.time()
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=[checkpoint_cb, early_stopping_cb, reduce_lr_cb],
        verbose=1
    )
    
    elapsed_time = round(time.time() - start_time, 2)
    print(f"\nTraining completed in {elapsed_time} seconds.")
    
    # 6. Evaluate best model on Validation set
    print("\nEvaluating best saved model on validation set...")
    best_model = keras.models.load_model(best_model_path)
    val_loss, val_acc = best_model.evaluate(X_val, y_val, verbose=0)
    train_loss, train_acc = best_model.evaluate(X_train, y_train, verbose=0)
    
    print(f"Final Train Loss: {train_loss:.4f} | Train Accuracy: {train_acc * 100:.2f}%")
    print(f"Final Val Loss:   {val_loss:.4f} | Val Accuracy:   {val_acc * 100:.2f}%")
    
    # 7. Save training history
    history_dict = {
        "train_loss": [float(x) for x in history.history["loss"]],
        "train_accuracy": [float(x) for x in history.history["accuracy"]],
        "val_loss": [float(x) for x in history.history["val_loss"]],
        "val_accuracy": [float(x) for x in history.history["val_accuracy"]],
        "lr": [float(x) for x in history.history.get("learning_rate", history.history.get("lr", []))],
        "epochs_trained": len(history.history["loss"]),
        "training_time_seconds": elapsed_time,
        "best_val_accuracy": float(val_acc),
        "best_val_loss": float(val_loss)
    }
    
    history_path = os.path.join(args.output_dir, "training_history.json")
    with open(history_path, "w") as f:
        json.dump(history_dict, f, indent=2)
    print(f"Saved training history to: {history_path}")
    print(f"Best model saved to: {best_model_path}")


if __name__ == "__main__":
    main()
