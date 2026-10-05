# ISL Connect - Machine Learning Pipeline

This directory contains the end-to-end Machine Learning pipeline for Indian Sign Language (ISL) recognition.

## Directory Structure

```
ml/
├── scripts/
│   └── extract_landmarks.py   # Landmark extraction & normalization pipeline
├── output/                    # Generated landmark CSVs, class mappings, reports
├── models/                    # Exported model weights, ONNX/TF.js/JSON formats
├── requirements.txt           # Python ML dependencies
└── README.md                  # ML pipeline documentation
```

---

## Landmark Extraction & Preprocessing Specification

### 1. Raw Hand Landmark Keypoints
MediaPipe Hands provides 21 3D landmarks for each hand:
- Index `0`: Wrist
- Indices `1..4`: Thumb (`THUMB_CMC`, `THUMB_MCP`, `THUMB_IP`, `THUMB_TIP`)
- Indices `5..8`: Index Finger (`INDEX_FINGER_MCP`, `INDEX_FINGER_PIP`, `INDEX_FINGER_DIP`, `INDEX_FINGER_TIP`)
- Indices `9..12`: Middle Finger (`MIDDLE_FINGER_MCP`, `MIDDLE_FINGER_PIP`, `MIDDLE_FINGER_DIP`, `MIDDLE_FINGER_TIP`)
- Indices `13..16`: Ring Finger (`RING_FINGER_MCP`, `RING_FINGER_PIP`, `RING_FINGER_DIP`, `RING_FINGER_TIP`)
- Indices `17..20`: Pinky (`PINKY_MCP`, `PINKY_PIP`, `PINKY_DIP`, `PINKY_TIP`)

Total raw features per hand: $21 \times 3 = 63$ float values ($x, y, z$).

---

### 2. Normalization Formula (Client / Browser Spec)

To ensure translation and scale invariance regardless of hand distance or position on the screen, the following exact normalization steps must be replicated identically in Python and in the frontend browser JavaScript:

#### Step 1: Wrist-Centric Translation
Using Landmark 0 (Wrist) as $(x_0, y_0, z_0)$:
$$x_i' = x_i - x_0$$
$$y_i' = y_i - y_0$$
$$z_i' = z_i - z_0 \quad \text{for } i = 0, 1, \dots, 20$$

#### Step 2: Scale Invariance (Max Euclidean Distance)
Compute the maximum Euclidean distance of any landmark from the wrist:
$$\text{scale} = \max_{i=0..20} \sqrt{(x_i')^2 + (y_i')^2 + (z_i')^2}$$

#### Step 3: Normalization
If $\text{scale} > 10^{-6}$:
$$x_i^{\text{norm}} = \frac{x_i'}{\text{scale}}, \quad y_i^{\text{norm}} = \frac{y_i'}{\text{scale}}, \quad z_i^{\text{norm}} = \frac{z_i'}{\text{scale}}$$
Else:
$$x_i^{\text{norm}} = 0, \quad y_i^{\text{norm}} = 0, \quad z_i^{\text{norm}} = 0$$

#### JavaScript Implementation Snippet for Frontend:
```javascript
function normalizeLandmarks(landmarks) {
  // landmarks is array of 21 objects: [{x, y, z}, ...]
  const wrist = landmarks[0];
  const translated = landmarks.map(lm => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: lm.z - wrist.z
  }));

  // Find max distance from wrist
  let maxDist = 0;
  for (const pt of translated) {
    const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y + pt.z * pt.z);
    if (dist > maxDist) maxDist = dist;
  }

  // Scale normalized 63-element feature vector
  const features = [];
  const scale = maxDist > 1e-6 ? maxDist : 1;
  for (const pt of translated) {
    features.push(pt.x / scale, pt.y / scale, pt.z / scale);
  }
  return features; // Exactly 63 features
}
```

---

## Dataset Format (CSV)

The output CSV files ([train_landmarks.csv](file:///Users/pritichavan/Documents/DL%20PROJECT/ml/output/train_landmarks.csv), [validation_landmarks.csv](file:///Users/pritichavan/Documents/DL%20PROJECT/ml/output/validation_landmarks.csv), [test_landmarks.csv](file:///Users/pritichavan/Documents/DL%20PROJECT/ml/output/test_landmarks.csv)) follow this column structure:

| Column | Type | Description |
|---|---|---|
| `label` | string | Class character (`A` - `Z`) |
| `class_id` | integer | Target numeric ID (`0` - `25`) |
| `image_path` | string | Relative dataset image path |
| `x1, y1, z1` | float | Normalized coordinates for Landmark 0 (Wrist is `0.0, 0.0, 0.0`) |
| `x2, y2, z2` | float | Normalized coordinates for Landmark 1 (Thumb CMC) |
| ... | float | ... |
| `x21, y21, z21`| float | Normalized coordinates for Landmark 20 (Pinky Tip) |
