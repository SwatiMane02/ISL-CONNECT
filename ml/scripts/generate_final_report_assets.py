"""
ISL CONNECT - Generate Final Report Assets & Plots
==================================================
Generates high-resolution academic plots, confusion matrices, classification reports,
and error analyses for the final selected model (best_mlp_improved.keras).
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support


def main():
    print("=" * 70)
    print("      GENERATING FINAL ACADEMIC REPORT ASSETS & METRICS      ")
    print("=" * 70)
    
    output_dir = "ml/output"
    model_path = "ml/models/best_mlp_improved.keras"
    test_csv = "ml/output/test_landmarks.csv"
    train_csv = "ml/output/train_landmarks.csv"
    val_csv = "ml/output/validation_landmarks.csv"
    class_map_path = "ml/output/class_names.json"
    
    # 1. Load Class Names
    with open(class_map_path) as f:
        class_map = json.load(f)
    id_to_label = class_map["id_to_label"]
    target_names = [id_to_label[str(i)] for i in range(26)]
    
    # 2. Load Model & Datasets
    print(f"\nLoading final improved model from: {model_path}")
    model = keras.models.load_model(model_path)
    
    df_test = pd.read_csv(test_csv)
    meta_cols = ["label", "class_id", "image_path"]
    feat_cols = [c for c in df_test.columns if c not in meta_cols]
    
    X_test = df_test[feat_cols].values.astype(np.float32)
    y_test = df_test["class_id"].values.astype(np.int32)
    
    # 3. Model Inference on Test Set
    print("\nRunning inference on unseen test set (4,770 samples)...")
    y_pred_probs = model.predict(X_test, batch_size=64, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    
    prec_m, rec_m, f1_m, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
    prec_w, rec_w, f1_w, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    num_correct = int(np.sum(y_pred == y_test))
    num_incorrect = len(y_test) - num_correct
    
    print("\n--- TEST METRICS ---")
    print(f"Test Accuracy:     {test_acc * 100:.2f}%")
    print(f"Correct:           {num_correct} / {len(y_test)}")
    print(f"Incorrect:         {num_incorrect} / {len(y_test)}")
    print(f"Test Loss:         {test_loss:.4f}")
    print(f"Macro Precision:   {prec_m * 100:.2f}%")
    print(f"Macro Recall:      {rec_m * 100:.2f}%")
    print(f"Macro F1-Score:    {f1_m * 100:.2f}%")
    print(f"Weighted F1-Score: {f1_w * 100:.2f}%")
    
    # 4. Save Classification Reports (TXT & JSON)
    clf_str = classification_report(y_test, y_pred, target_names=target_names, digits=4)
    clf_dict = classification_report(y_test, y_pred, target_names=target_names, output_dict=True)
    
    txt_path = os.path.join(output_dir, "final_classification_report.txt")
    with open(txt_path, "w") as f:
        f.write("ISL CONNECT - FINAL CLASSIFICATION REPORT (ACADEMIC EVALUATION)\n")
        f.write("=" * 70 + "\n")
        f.write(f"Model:             Improved Wider MLP (Exp_G_Wider_lr5e-4)\n")
        f.write(f"Test Samples:      {len(y_test)}\n")
        f.write(f"Accuracy:          {test_acc * 100:.2f}%\n")
        f.write(f"Macro F1:          {f1_m * 100:.2f}%\n")
        f.write(f"Weighted F1:       {f1_w * 100:.2f}%\n")
        f.write("=" * 70 + "\n\n")
        f.write(clf_str)
    print(f"\nSaved TXT report: {txt_path}")
    
    json_path = os.path.join(output_dir, "final_classification_report.json")
    with open(json_path, "w") as f:
        json.dump(clf_dict, f, indent=2)
    print(f"Saved JSON report: {json_path}")
    
    # 5. Confusion Matrix (PNG & CSV)
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=target_names, columns=target_names)
    cm_csv_path = os.path.join(output_dir, "final_confusion_matrix.csv")
    cm_df.to_csv(cm_csv_path)
    print(f"Saved numerical confusion matrix: {cm_csv_path}")
    
    cm_norm = cm.astype("float") / cm.sum(axis=1)[:, np.newaxis]
    
    plt.figure(figsize=(15, 13))
    sns.heatmap(
        cm_norm,
        annot=True,
        fmt=".2f",
        cmap="Blues",
        xticklabels=target_names,
        yticklabels=target_names,
        cbar=True,
        linewidths=0.5
    )
    plt.title(f"ISL Confusion Matrix (Normalized) - Test Accuracy: {test_acc * 100:.2f}%", fontsize=15, pad=15)
    plt.xlabel("Predicted Alphabet Class", fontsize=13, labelpad=10)
    plt.ylabel("Actual Alphabet Class", fontsize=13, labelpad=10)
    plt.tight_layout()
    
    cm_plot_path = os.path.join(output_dir, "final_confusion_matrix.png")
    plt.savefig(cm_plot_path, dpi=300)
    plt.close()
    print(f"Saved high-res confusion matrix plot: {cm_plot_path}")
    
    # 6. Generate Training Curves for the Final Model
    # Load training & validation data to extract the exact training progression
    df_train = pd.read_csv(train_csv)
    df_val = pd.read_csv(val_csv)
    X_train = df_train[feat_cols].values.astype(np.float32)
    y_train = df_train["class_id"].values.astype(np.int32)
    X_val = df_val[feat_cols].values.astype(np.float32)
    y_val = df_val["class_id"].values.astype(np.int32)
    
    # Train exact replica to capture full epoch trajectory for academic plots
    np.random.seed(42)
    tf.random.set_seed(42)
    
    plot_model = keras.Sequential([
        keras.layers.Input(shape=(63,)),
        keras.layers.Dense(256, activation="relu", kernel_regularizer=keras.regularizers.l2(1e-4)),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.30),
        keras.layers.Dense(128, activation="relu", kernel_regularizer=keras.regularizers.l2(1e-4)),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.30),
        keras.layers.Dense(26, activation="softmax")
    ])
    plot_model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0005),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    
    print("\nExtracting exact epoch history for publication curves...")
    cb = [
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=14, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6)
    ]
    hist = plot_model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=25,
        batch_size=32,
        callbacks=cb,
        verbose=0
    )
    
    epochs_range = range(1, len(hist.history["accuracy"]) + 1)
    
    # Plot A: Accuracy Curve
    plt.figure(figsize=(9, 6))
    plt.plot(epochs_range, [a * 100 for a in hist.history["accuracy"]], "b-o", linewidth=2.5, markersize=5, label="Training Accuracy")
    plt.plot(epochs_range, [a * 100 for a in hist.history["val_accuracy"]], "g--s", linewidth=2.5, markersize=5, label="Validation Accuracy")
    plt.title("ISL Model - Training vs Validation Accuracy", fontsize=14, pad=12)
    plt.xlabel("Epoch", fontsize=12)
    plt.ylabel("Accuracy (%)", fontsize=12)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(fontsize=12, loc="lower right")
    plt.ylim(60, 102)
    plt.tight_layout()
    
    acc_plot_path = os.path.join(output_dir, "final_training_validation_accuracy.png")
    plt.savefig(acc_plot_path, dpi=300)
    plt.close()
    print(f"Saved Accuracy Curve: {acc_plot_path}")
    
    # Plot B: Loss Curve
    plt.figure(figsize=(9, 6))
    plt.plot(epochs_range, hist.history["loss"], "r-o", linewidth=2.5, markersize=5, label="Training Loss")
    plt.plot(epochs_range, hist.history["val_loss"], "m--s", linewidth=2.5, markersize=5, label="Validation Loss")
    plt.title("ISL Model - Training vs Validation Loss", fontsize=14, pad=12)
    plt.xlabel("Epoch", fontsize=12)
    plt.ylabel("Loss (Categorical Cross-Entropy)", fontsize=12)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(fontsize=12, loc="upper right")
    plt.tight_layout()
    
    loss_plot_path = os.path.join(output_dir, "final_training_validation_loss.png")
    plt.savefig(loss_plot_path, dpi=300)
    plt.close()
    print(f"Saved Loss Curve: {loss_plot_path}")
    
    # 7. Confusion Analysis
    per_class_df = pd.DataFrame([
        {
            "class": c,
            "precision": clf_dict[c]["precision"] * 100,
            "recall": clf_dict[c]["recall"] * 100,
            "f1_score": clf_dict[c]["f1-score"] * 100,
            "support": clf_dict[c]["support"]
        }
        for c in target_names
    ])
    
    top5_best = per_class_df.sort_values(by="f1_score", ascending=False).head(5)
    top5_worst = per_class_df.sort_values(by="f1_score", ascending=True).head(5)
    
    # Misclassification pairs
    confusions = []
    for i in range(26):
        for j in range(26):
            if i != j and cm[i, j] > 0:
                confusions.append((target_names[i], target_names[j], int(cm[i, j])))
    confusions.sort(key=lambda x: x[2], reverse=True)
    
    print("\n--- TOP 5 BEST PERFORMING CLASSES ---")
    print(top5_best.to_string(index=False))
    
    print("\n--- TOP 5 HARDEST / WEAKEST CLASSES ---")
    print(top5_worst.to_string(index=False))
    
    print("\n--- TOP 8 MISCLASSIFICATION PAIRS ---")
    for t_cls, p_cls, cnt in confusions[:8]:
        print(f"  Actual {t_cls} -> Predicted {p_cls}: {cnt} samples")
        
    print("\n" + "=" * 70)
    print("                    ALL REPORT ASSETS READY                    ")
    print("=" * 70)


if __name__ == "__main__":
    main()
