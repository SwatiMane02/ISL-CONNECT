"""
ISL CONNECT - Model Exporter for Browser Inference
==================================================
Exports the trained Keras model (best_mlp_improved.keras) to browser-ready formats:
1. TensorFlow.js Layers Model: public/models/isl/model.json + group1-shard1of1.bin
2. Zero-Dependency JSON Weights: public/models/isl/model_weights.json
3. Class Name Mapping: public/models/isl/class_names.json
"""

import os
import sys
import json
import struct
import shutil
import argparse
import numpy as np
import tensorflow as tf
from tensorflow import keras


def export_tfjs_layers_model(model: keras.Model, output_dir: str):
    """
    Exports a Keras Sequential model to the standard TensorFlow.js Layers format
    (model.json + binary shard).
    """
    os.makedirs(output_dir, exist_ok=True)
    
    weights_manifest = []
    weight_entries = []
    binary_data = bytearray()
    
    # Collect all trainable and non-trainable weights in order
    for layer in model.layers:
        weights = layer.get_weights()
        if not weights:
            continue
            
        layer_name = layer.name
        
        if isinstance(layer, keras.layers.Dense):
            kernel, bias = weights
            # Kernel
            k_name = f"{layer_name}/kernel"
            weight_entries.append({
                "name": k_name,
                "shape": list(kernel.shape),
                "dtype": "float32"
            })
            binary_data.extend(kernel.astype(np.float32).tobytes())
            
            # Bias
            b_name = f"{layer_name}/bias"
            weight_entries.append({
                "name": b_name,
                "shape": list(bias.shape),
                "dtype": "float32"
            })
            binary_data.extend(bias.astype(np.float32).tobytes())
            
        elif isinstance(layer, keras.layers.BatchNormalization):
            gamma, beta, mean, var = weights
            for name, w in [("gamma", gamma), ("beta", beta), ("moving_mean", mean), ("moving_variance", var)]:
                w_name = f"{layer_name}/{name}"
                weight_entries.append({
                    "name": w_name,
                    "shape": list(w.shape),
                    "dtype": "float32"
                })
                binary_data.extend(w.astype(np.float32).tobytes())
                
    shard_filename = "group1-shard1of1.bin"
    shard_path = os.path.join(output_dir, shard_filename)
    with open(shard_path, "wb") as f:
        f.write(binary_data)
        
    weights_manifest.append({
        "paths": [shard_filename],
        "weights": weight_entries
    })
    
    # Build model topology
    model_json_payload = {
        "format": "layers-model",
        "generatedBy": f"keras v{keras.__version__}",
        "convertedBy": "ISL-Connect Exporter v1.0",
        "modelTopology": json.loads(model.to_json()),
        "weightsManifest": weights_manifest
    }
    
    model_json_path = os.path.join(output_dir, "model.json")
    with open(model_json_path, "w") as f:
        json.dump(model_json_payload, f, indent=2)
        
    print(f"Exported TensorFlow.js model:")
    print(f"  Topology: {model_json_path} ({os.path.getsize(model_json_path)} bytes)")
    print(f"  Weights:  {shard_path} ({os.path.getsize(shard_path)} bytes)")


def export_json_weights(model: keras.Model, output_dir: str):
    """
    Exports clean JSON weights for zero-dependency browser inference.
    """
    w1, b1 = model.layers[0].get_weights()
    gamma1, beta1, mean1, var1 = model.layers[1].get_weights()
    
    w2, b2 = model.layers[3].get_weights()
    gamma2, beta2, mean2, var2 = model.layers[4].get_weights()
    
    w3, b3 = model.layers[6].get_weights()
    
    payload = {
        "model_name": "ISL_Landmark_MLP_Improved",
        "input_features": 63,
        "num_classes": 26,
        "epsilon": 1e-3,
        "layer_1_dense": {
            "weights": w1.tolist(),
            "biases": b1.tolist()
        },
        "layer_1_batch_norm": {
            "gamma": gamma1.tolist(),
            "beta": beta1.tolist(),
            "mean": mean1.tolist(),
            "variance": var1.tolist()
        },
        "layer_2_dense": {
            "weights": w2.tolist(),
            "biases": b2.tolist()
        },
        "layer_2_batch_norm": {
            "gamma": gamma2.tolist(),
            "beta": beta2.tolist(),
            "mean": mean2.tolist(),
            "variance": var2.tolist()
        },
        "layer_3_output": {
            "weights": w3.tolist(),
            "biases": b3.tolist()
        }
    }
    
    out_path = os.path.join(output_dir, "model_weights.json")
    with open(out_path, "w") as f:
        json.dump(payload, f)
    print(f"Exported standalone JSON weights: {out_path} ({os.path.getsize(out_path)} bytes)")


def main():
    parser = argparse.ArgumentParser(description="Export ISL Model to public/models/isl/")
    parser.add_argument("--model-path", type=str, default="ml/models/best_mlp_improved.keras")
    parser.add_argument("--class-names-json", type=str, default="ml/output/class_names.json")
    parser.add_argument("--output-dir", type=str, default="public/models/isl")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.model_path):
        raise FileNotFoundError(f"Model not found at: {args.model_path}")
        
    os.makedirs(args.output_dir, exist_ok=True)
    
    print("=" * 60)
    print("ISL CONNECT - EXPORTING MODEL FOR BROWSER INFERENCE")
    print("=" * 60)
    
    # 1. Load Model
    print(f"\nLoading model: {args.model_path}")
    model = keras.models.load_model(args.model_path)
    model.summary()
    
    # 2. Export TF.js Layers format
    print("\nExporting TensorFlow.js format...")
    export_tfjs_layers_model(model, args.output_dir)
    
    # 3. Export Standalone JSON Weights format
    print("\nExporting Standalone JSON Weights...")
    export_json_weights(model, args.output_dir)
    
    # 4. Copy Class Names Mapping
    out_classes_path = os.path.join(args.output_dir, "class_names.json")
    shutil.copyfile(args.class_names_json, out_classes_path)
    print(f"\nCopied class mapping to: {out_classes_path}")
    
    print("\n" + "=" * 60)
    print(f"ALL ASSETS EXPORTED TO: {args.output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
