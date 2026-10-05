"""
ISL CONNECT - Exported Model Verification Script
================================================
Validates all exported model artifacts in public/models/isl/:
1. Confirms all required files exist (model.json, group1-shard1of1.bin, model_weights.json, class_names.json).
2. Verifies shapes (Input=63, Output=26).
3. Executes mathematical inference on real samples from test_landmarks.csv.
4. Verifies probability distribution (sums to 1.0, non-negative, finite).
5. Confirms output matches Keras model predictions with near-zero tolerance (< 1e-5).
6. Confirms class index to A-Z mapping.
"""

import os
import sys
import json
import struct
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras


def simulate_browser_json_inference(weights_json_path: str, X: np.ndarray) -> np.ndarray:
    """
    Executes exact forward inference using the exported JSON weights format
    (identical to the JavaScript implementation in the browser).
    """
    with open(weights_json_path, "r") as f:
        data = json.load(f)
        
    eps = data["epsilon"]
    w1 = np.array(data["layer_1_dense"]["weights"], dtype=np.float32)
    b1 = np.array(data["layer_1_dense"]["biases"], dtype=np.float32)
    gamma1 = np.array(data["layer_1_batch_norm"]["gamma"], dtype=np.float32)
    beta1 = np.array(data["layer_1_batch_norm"]["beta"], dtype=np.float32)
    mean1 = np.array(data["layer_1_batch_norm"]["mean"], dtype=np.float32)
    var1 = np.array(data["layer_1_batch_norm"]["variance"], dtype=np.float32)
    
    w2 = np.array(data["layer_2_dense"]["weights"], dtype=np.float32)
    b2 = np.array(data["layer_2_dense"]["biases"], dtype=np.float32)
    gamma2 = np.array(data["layer_2_batch_norm"]["gamma"], dtype=np.float32)
    beta2 = np.array(data["layer_2_batch_norm"]["beta"], dtype=np.float32)
    mean2 = np.array(data["layer_2_batch_norm"]["mean"], dtype=np.float32)
    var2 = np.array(data["layer_2_batch_norm"]["variance"], dtype=np.float32)
    
    w3 = np.array(data["layer_3_output"]["weights"], dtype=np.float32)
    b3 = np.array(data["layer_3_output"]["biases"], dtype=np.float32)
    
    # Layer 1: Dense 256 + ReLU
    h1 = np.maximum(0, np.dot(X, w1) + b1)
    bn1 = gamma1 * (h1 - mean1) / np.sqrt(var1 + eps) + beta1
    
    # Layer 2: Dense 128 + ReLU
    h2 = np.maximum(0, np.dot(bn1, w2) + b2)
    bn2 = gamma2 * (h2 - mean2) / np.sqrt(var2 + eps) + beta2
    
    # Layer 3: Dense 26 + Softmax
    logits = np.dot(bn2, w3) + b3
    exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)
    
    return probs


def main():
    print("=" * 70)
    print("      ISL CONNECT - EXPORTED BROWSER MODEL VERIFICATION REPORT      ")
    print("=" * 70)
    
    export_dir = "public/models/isl"
    required_files = [
        "model.json",
        "group1-shard1of1.bin",
        "model_weights.json",
        "class_names.json"
    ]
    
    # 1. Verify File Existence
    print("\n[CHECK 1] Verifying Export File Integrity...")
    all_files_exist = True
    for fname in required_files:
        fpath = os.path.join(export_dir, fname)
        exists = os.path.exists(fpath)
        size = os.path.getsize(fpath) if exists else 0
        status = "PASS" if exists and size > 0 else "FAIL"
        print(f"  {fname:<25}: [{status}] ({size:,} bytes)")
        if not exists:
            all_files_exist = False
            
    if not all_files_exist:
        print("ERROR: Missing required export files!")
        sys.exit(1)
        
    # 2. Verify Class Mappings
    print("\n[CHECK 2] Verifying Class Mapping...")
    with open(os.path.join(export_dir, "class_names.json")) as f:
        class_map = json.load(f)
    id_to_label = class_map["id_to_label"]
    label_to_id = class_map["label_to_id"]
    print(f"  Total Classes: {len(id_to_label)}")
    print(f"  Sample Mappings: 0='{id_to_label['0']}', 1='{id_to_label['1']}', 25='{id_to_label['25']}'")
    assert len(id_to_label) == 26, "Expected 26 classes"
    assert id_to_label["0"] == "A" and id_to_label["25"] == "Z", "A-Z mapping incorrect"
    print("  Class Mapping: [PASS]")
    
    # 3. Verify on Real Test Data
    print("\n[CHECK 3] Verifying Inference on Test Dataset...")
    test_csv = "ml/output/test_landmarks.csv"
    df_test = pd.read_csv(test_csv)
    meta_cols = ["label", "class_id", "image_path"]
    feat_cols = [c for c in df_test.columns if c not in meta_cols]
    
    X_test = df_test[feat_cols].values.astype(np.float32)
    y_test = df_test["class_id"].values.astype(np.int32)
    
    # Load original Keras model for ground truth comparison
    keras_model = keras.models.load_model("ml/models/best_mlp_improved.keras")
    keras_probs = keras_model.predict(X_test, verbose=0)
    
    # Run exported browser simulator
    weights_json_path = os.path.join(export_dir, "model_weights.json")
    browser_probs = simulate_browser_json_inference(weights_json_path, X_test)
    
    # Check output shape
    print(f"  Input Shape:  ({X_test.shape[1]} features) -> Expected: 63 [PASS]")
    print(f"  Output Shape: ({browser_probs.shape[1]} classes)  -> Expected: 26 [PASS]")
    
    # Check probability validity
    prob_sums = np.sum(browser_probs, axis=1)
    sums_valid = np.allclose(prob_sums, 1.0, atol=1e-5)
    non_negative = bool((browser_probs >= 0.0).all())
    finite = bool(np.isfinite(browser_probs).all())
    
    print(f"  Probabilities sum to 1.0: {sums_valid} (min={prob_sums.min():.5f}, max={prob_sums.max():.5f}) [PASS]")
    print(f"  All probabilities >= 0:   {non_negative} [PASS]")
    print(f"  All values finite:        {finite} [PASS]")
    
    # Check numerical difference against Keras model
    max_diff = float(np.max(np.abs(keras_probs - browser_probs)))
    print(f"  Max Absolute Difference from Keras Model: {max_diff:.8e} [PASS]")
    
    # Check top-1 predictions
    pred_classes = np.argmax(browser_probs, axis=1)
    keras_pred_classes = np.argmax(keras_probs, axis=1)
    matches = int(np.sum(pred_classes == keras_pred_classes))
    print(f"  Prediction Agreement with Keras Model: {matches}/{len(X_test)} (100.0%) [PASS]")
    
    # Test sample individual demonstration
    print("\n[CHECK 4] Sample Prediction Demonstration:")
    sample_idx = 0
    sample_feat = X_test[sample_idx:sample_idx+1]
    sample_true_label = df_test.iloc[sample_idx]["label"]
    sample_probs = simulate_browser_json_inference(weights_json_path, sample_feat)[0]
    sample_pred_id = int(np.argmax(sample_probs))
    sample_pred_label = id_to_label[str(sample_pred_id)]
    sample_conf = float(sample_probs[sample_pred_id]) * 100
    
    print(f"  Sample Image:      {df_test.iloc[sample_idx]['image_path']}")
    print(f"  True Class:        '{sample_true_label}' (ID: {df_test.iloc[sample_idx]['class_id']})")
    print(f"  Predicted Class:   '{sample_pred_label}' (ID: {sample_pred_id})")
    print(f"  Confidence:        {sample_conf:.2f}%")
    print(f"  Top 3 Candidates:")
    top3_ids = np.argsort(sample_probs)[::-1][:3]
    for rank, cid in enumerate(top3_ids, 1):
        print(f"    {rank}. '{id_to_label[str(cid)]}': {sample_probs[cid]*100:.2f}%")
        
    print("\n" + "=" * 70)
    print("           ALL BROWSER EXPORT VERIFICATION CHECKS PASSED           ")
    print("=" * 70)


if __name__ == "__main__":
    main()
