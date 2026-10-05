"""
ISL CONNECT - Landmark Extraction Pipeline
==========================================

This script extracts 21 3D hand landmarks (63 features) from ISL image dataset
using MediaPipe Hands, applies wrist-relative and scale normalization,
and saves the resulting feature datasets as CSV files.

Normalization Method (Wrist-Relative & Scale-Invariant):
-------------------------------------------------------
1. Translation Normalization (Wrist-Centric):
   Reference point is landmark 0 (Wrist): (x_0, y_0, z_0)
   For each landmark i in [0, 20]:
       x_i' = x_i - x_0
       y_i' = y_i - y_0
       z_i' = z_i - z_0

2. Scale Normalization (Hand-Span / Max-Radius):
   Compute maximum Euclidean distance from the wrist across all 21 landmarks:
       scale = max_{i=0..20} sqrt((x_i')^2 + (y_i')^2 + (z_i')^2)
   If scale > 0:
       x_i_norm = x_i' / scale
       y_i_norm = y_i' / scale
       z_i_norm = z_i' / scale
   Else:
       x_i_norm = y_i_norm = z_i_norm = 0.0

   Properties:
   - Wrist is strictly at (0.0, 0.0, 0.0)
   - All coordinates are scale-invariant and bounded in [-1.0, 1.0]
   - Fully reproducible in browser inference (JavaScript).
"""

import os
import sys
import time
import json
import argparse
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np
import pandas as pd
import mediapipe as mp


def get_class_mappings() -> Tuple[Dict[str, int], Dict[int, str]]:
    """Creates deterministic alphabetical mapping for classes A-Z."""
    classes = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
    label_to_id = {label: idx for idx, label in enumerate(classes)}
    id_to_label = {idx: label for idx, label in enumerate(classes)}
    return label_to_id, id_to_label


def normalize_landmarks(raw_landmarks: List[Tuple[float, float, float]]) -> List[float]:
    """
    Applies wrist-relative translation and maximum euclidean distance scaling.
    
    Args:
        raw_landmarks: List of 21 tuples (x, y, z) from MediaPipe.
        
    Returns:
        Flattened list of 63 normalized float features [x1, y1, z1, ..., x21, y21, z21].
    """
    coords = np.array(raw_landmarks, dtype=np.float32)  # Shape: (21, 3)
    
    # 1. Wrist-relative translation (wrist is index 0)
    wrist = coords[0].copy()
    translated = coords - wrist
    
    # 2. Scale normalization based on maximum distance from wrist
    distances = np.linalg.norm(translated, axis=1)  # Euclidean distance of each landmark
    max_dist = float(np.max(distances))
    
    if max_dist > 1e-6:
        normalized = translated / max_dist
    else:
        normalized = translated
        
    return normalized.flatten().tolist()


def extract_landmarks_from_image(
    image_path: str,
    hands_detector: mp.solutions.hands.Hands
) -> Tuple[Optional[List[float]], str]:
    """
    Reads an image, processes through MediaPipe Hands, and returns normalized features.
    
    Returns:
        (features, status) where status is 'success', 'no_hand', or 'corrupted'.
    """
    try:
        image = cv2.imread(image_path)
        if image is None:
            return None, 'corrupted'
            
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands_detector.process(image_rgb)
        
        if not results.multi_hand_landmarks:
            return None, 'no_hand'
            
        # Select the primary hand (highest confidence / first detected)
        primary_hand = results.multi_hand_landmarks[0]
        raw_landmarks = [(lm.x, lm.y, lm.z) for lm in primary_hand.landmark]
        
        normalized_features = normalize_landmarks(raw_landmarks)
        return normalized_features, 'success'
        
    except Exception as e:
        return None, f'error: {str(e)}'


def get_feature_column_names() -> List[str]:
    """Generates column headers for the 63 landmark features."""
    cols = []
    for i in range(1, 22):
        cols.extend([f"x{i}", f"y{i}", f"z{i}"])
    return cols


def process_split(
    split_name: str,
    split_dir: str,
    hands_detector: mp.solutions.hands.Hands,
    label_to_id: Dict[str, int],
    test_mode: bool = False,
    test_classes: Optional[List[str]] = None,
    samples_per_class: int = 5
) -> Tuple[pd.DataFrame, Dict]:
    """
    Processes all images for a given split (Training / Validation / Testing).
    """
    print(f"\n[{split_name.upper()}] Starting processing...")
    start_time = time.time()
    
    classes_to_process = test_classes if test_mode and test_classes else sorted(os.listdir(split_dir))
    classes_to_process = [c for c in classes_to_process if os.path.isdir(os.path.join(split_dir, c)) and not c.startswith('.')]
    
    records = []
    split_stats = {
        "total_images": 0,
        "successfully_processed": 0,
        "no_hand_detections": 0,
        "corrupted_images": 0,
        "samples_per_class": {},
        "processing_time_seconds": 0.0
    }
    
    feature_cols = get_feature_column_names()
    
    for class_name in classes_to_process:
        class_dir = os.path.join(split_dir, class_name)
        if not os.path.isdir(class_dir):
            continue
            
        all_files = sorted([f for f in os.listdir(class_dir) if not f.startswith('.')])
        if test_mode:
            all_files = all_files[:samples_per_class]
            
        class_id = label_to_id.get(class_name, -1)
        class_success = 0
        
        for file_name in all_files:
            file_path = os.path.join(class_dir, file_name)
            rel_path = f"{split_name}/{class_name}/{file_name}"
            split_stats["total_images"] += 1
            
            features, status = extract_landmarks_from_image(file_path, hands_detector)
            
            if status == 'success' and features is not None:
                split_stats["successfully_processed"] += 1
                class_success += 1
                row = {
                    "label": class_name,
                    "class_id": class_id,
                    "image_path": rel_path
                }
                for col_name, val in zip(feature_cols, features):
                    row[col_name] = val
                records.append(row)
            elif status == 'no_hand':
                split_stats["no_hand_detections"] += 1
            else:
                split_stats["corrupted_images"] += 1
                
        split_stats["samples_per_class"][class_name] = class_success
        print(f"  Class {class_name}: {class_success}/{len(all_files)} detected successfully.")
        
    elapsed = round(time.time() - start_time, 2)
    split_stats["processing_time_seconds"] = elapsed
    
    columns = ["label", "class_id", "image_path"] + feature_cols
    df = pd.DataFrame(records, columns=columns)
    
    print(f"[{split_name.upper()}] Done in {elapsed}s: {split_stats['successfully_processed']}/{split_stats['total_images']} processed.")
    return df, split_stats


def main():
    parser = argparse.ArgumentParser(description="Extract Hand Landmarks for ISL Connect")
    parser.add_argument(
        "--dataset-dir",
        type=str,
        default="/Users/pritichavan/Downloads/RealSign-Indian-Sign-Language-Dataset-main/Dataset",
        help="Path to the external ISL dataset"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="/Users/pritichavan/Documents/DL PROJECT/ml/output",
        help="Path to save output CSVs and reports"
    )
    parser.add_argument(
        "--test-mode",
        action="store_true",
        help="Run on a small subset (approx 5 images per class for a few classes)"
    )
    parser.add_argument(
        "--samples-per-class",
        type=int,
        default=5,
        help="Number of samples per class when running in test mode"
    )
    parser.add_argument(
        "--min-detection-confidence",
        type=float,
        default=0.3,
        help="MediaPipe min detection confidence"
    )
    
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    label_to_id, id_to_label = get_class_mappings()
    
    # Save class mapping
    class_mapping_path = os.path.join(args.output_dir, "class_names.json")
    with open(class_mapping_path, "w") as f:
        json.dump(
            {
                "id_to_label": id_to_label,
                "label_to_id": label_to_id
            },
            f,
            indent=2
        )
    print(f"Saved class mappings to: {class_mapping_path}")
    
    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    hands_detector = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=args.min_detection_confidence
    )
    
    splits = ["Training", "Validation", "Testing"]
    test_classes = ["A", "B", "C", "D", "E"] if args.test_mode else None
    
    full_report = {
        "dataset_path": args.dataset_dir,
        "test_mode": args.test_mode,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "normalization": {
            "method": "wrist_relative_scale_normalized",
            "wrist_reference": "landmark_0",
            "scale_factor": "max_euclidean_distance_from_wrist",
            "feature_count": 63
        },
        "splits": {}
    }
    
    split_filename_map = {
        "Training": "train_landmarks.csv",
        "Validation": "validation_landmarks.csv",
        "Testing": "test_landmarks.csv"
    }
    
    for split in splits:
        split_dir = os.path.join(args.dataset_dir, split)
        if not os.path.exists(split_dir):
            print(f"Warning: Split directory {split_dir} does not exist. Skipping.")
            continue
            
        df, stats = process_split(
            split_name=split,
            split_dir=split_dir,
            hands_detector=hands_detector,
            label_to_id=label_to_id,
            test_mode=args.test_mode,
            test_classes=test_classes,
            samples_per_class=args.samples_per_class
        )
        
        full_report["splits"][split] = stats
        
        # Save CSV
        out_csv_name = f"test_subset_{split_filename_map[split]}" if args.test_mode else split_filename_map[split]
        out_csv_path = os.path.join(args.output_dir, out_csv_name)
        df.to_csv(out_csv_path, index=False)
        print(f"Saved CSV ({len(df)} rows) to: {out_csv_path}")
        
    hands_detector.close()
    
    # Save extraction report
    report_filename = "test_extraction_report.json" if args.test_mode else "extraction_report.json"
    report_path = os.path.join(args.output_dir, report_filename)
    with open(report_path, "w") as f:
        json.dump(full_report, f, indent=2)
    print(f"\nExtraction report saved to: {report_path}")


if __name__ == "__main__":
    main()
