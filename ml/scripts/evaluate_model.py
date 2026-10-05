"""
ISL CONNECT - Model Evaluation Script
=====================================
Evaluates the trained model on the unseen Test dataset.
Computes test accuracy, precision, recall, f1-score, per-class metrics,
classification report, and generates a visual confusion matrix.
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score


def load_test_dataset(test_csv: str):
    """Loads test landmark features and class IDs."""
    if not os.path.exists(test_csv):
        raise FileNotFoundError(f"Test dataset not found at: {test_csv}")
        
    df = pd.read_csv(test_csv)
    meta_cols = ["label", "class_id", "image_path"]
    feature_cols = [c for c in df.columns if c not in meta_cols]
    
    X = df[feature_cols].values.astype(np.float32)
    y = df["class_id"].values.astype(np.int32)
    labels = df["label"].values
    
    return X, y, labels, df


def main():
    parser = argparse.ArgumentParser(description="Evaluate ISL Landmark Model on Test Set")
    parser.add_argument("--model-path", type=str, default="ml/models/best_model.keras")
    parser.add_argument("--test-csv", type=str, default="ml/output/test_landmarks.csv")
    parser.add_argument("--class-names-json", type=str, default="ml/output/class_names.json")
    parser.add_argument("--output-dir", type=str, default="ml/output")
    
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    print("=" * 60)
    print("ISL CONNECT - MODEL EVALUATION ON UNSEEN TEST SET")
    print("=" * 60)
    
    # 1. Load class mappings
    with open(args.class_names_json, "r") as f:
        class_map = json.load(f)
    id_to_label = class_map["id_to_label"]
    target_names = [id_to_label[str(i)] for i in range(26)]
    
    # 2. Load model
    print(f"\nLoading model from: {args.model_path}")
    model = keras.models.load_model(args.model_path)
    
    # 3. Load Test Data
    print(f"Loading test dataset from: {args.test_csv}")
    X_test, y_test, _, test_df = load_test_dataset(args.test_csv)
    print(f"Total test samples: {X_test.shape[0]}")
    
    # 4. Predict
    print("\nRunning inference on test samples...")
    y_pred_probs = model.predict(X_test, batch_size=64, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    # 5. Compute Metrics
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )
    
    print("\n" + "=" * 60)
    print("                    OVERALL TEST METRICS                    ")
    print("=" * 60)
    print(f"Test Loss:             {test_loss:.4f}")
    print(f"Test Accuracy:         {test_acc * 100:.2f}%")
    print(f"Macro Precision:       {prec_macro * 100:.2f}%")
    print(f"Macro Recall:          {rec_macro * 100:.2f}%")
    print(f"Macro F1-Score:        {f1_macro * 100:.2f}%")
    print(f"Weighted F1-Score:     {f1_weighted * 100:.2f}%")
    print("=" * 60)
    
    # 6. Classification Report
    clf_report_str = classification_report(
        y_test, y_pred, target_names=target_names, digits=4, zero_division=0
    )
    clf_report_dict = classification_report(
        y_test, y_pred, target_names=target_names, output_dict=True, zero_division=0
    )
    
    report_file_path = os.path.join(args.output_dir, "classification_report.txt")
    with open(report_file_path, "w") as f:
        f.write("ISL CONNECT - MODEL CLASSIFICATION REPORT\n")
        f.write("=" * 60 + "\n")
        f.write(f"Test Accuracy: {test_acc * 100:.2f}%\n")
        f.write(f"Macro F1-Score: {f1_macro * 100:.2f}%\n")
        f.write("=" * 60 + "\n\n")
        f.write(clf_report_str)
    print(f"\nSaved classification report to: {report_file_path}")
    print("\nPer-Class Breakdown:")
    print(clf_report_str)
    
    # 7. Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    cm_norm = cm.astype("float") / cm.sum(axis=1)[:, np.newaxis]
    
    plt.figure(figsize=(14, 12))
    sns.heatmap(
        cm_norm,
        annot=True,
        fmt=".2f",
        cmap="Blues",
        xticklabels=target_names,
        yticklabels=target_names,
        cbar=True
    )
    plt.title(f"ISL Confusion Matrix (Normalized) - Test Accuracy: {test_acc * 100:.2f}%", fontsize=14, pad=15)
    plt.xlabel("Predicted Class", fontsize=12)
    plt.ylabel("True Class", fontsize=12)
    plt.tight_layout()
    
    cm_plot_path = os.path.join(args.output_dir, "confusion_matrix.png")
    plt.savefig(cm_plot_path, dpi=200)
    plt.close()
    print(f"Saved confusion matrix plot to: {cm_plot_path}")
    
    # 8. Save Final Metrics JSON
    final_metrics = {
        "test_samples": int(X_test.shape[0]),
        "test_loss": float(test_loss),
        "test_accuracy": float(test_acc),
        "precision_macro": float(prec_macro),
        "recall_macro": float(rec_macro),
        "f1_score_macro": float(f1_macro),
        "precision_weighted": float(prec_weighted),
        "recall_weighted": float(rec_weighted),
        "f1_score_weighted": float(f1_weighted),
        "per_class": {
            target_names[i]: {
                "precision": float(clf_report_dict[target_names[i]]["precision"]),
                "recall": float(clf_report_dict[target_names[i]]["recall"]),
                "f1_score": float(clf_report_dict[target_names[i]]["f1-score"]),
                "support": int(clf_report_dict[target_names[i]]["support"])
            }
            for i in range(26)
        }
    }
    
    metrics_path = os.path.join(args.output_dir, "final_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(final_metrics, f, indent=2)
    print(f"Saved final metrics JSON to: {metrics_path}")


if __name__ == "__main__":
    main()
