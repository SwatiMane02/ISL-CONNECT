# ISL Connect - Model Integration Specification for Frontend / Person 3

This document defines the exact contract, data format, preprocessing pipeline, and JavaScript integration methods for running real-time ISL recognition in the browser.

---

## 1. Model Artifacts Location

All client-side model files are located in the `public/` directory and can be served directly as static assets at the path `/models/isl/`:

| File | Purpose | Size | URL Path in Browser |
|---|---|:---:|---|
| [`model.json`](file:///Users/pritichavan/Documents/DL%20PROJECT/public/models/isl/model.json) | TensorFlow.js Model Topology & Manifest | 13.5 KB | `/models/isl/model.json` |
| [`group1-shard1of1.bin`](file:///Users/pritichavan/Documents/DL%20PROJECT/public/models/isl/group1-shard1of1.bin) | TensorFlow.js Binary Weights Buffer | 216 KB | `/models/isl/group1-shard1of1.bin` |
| [`model_weights.json`](file:///Users/pritichavan/Documents/DL%20PROJECT/public/models/isl/model_weights.json) | Zero-Dependency Float32 Weights Matrix | 1.1 MB | `/models/isl/model_weights.json` |
| [`class_names.json`](file:///Users/pritichavan/Documents/DL%20PROJECT/public/models/isl/class_names.json) | Class ID $\leftrightarrow$ Alphabet Mapping | 756 B | `/models/isl/class_names.json` |

---

## 2. Input Specification

- **Input Dimension**: `1D Array` of exactly **63 floating-point numbers** (Shape: `[1, 63]`).
- **Keypoint Source**: MediaPipe Hands (`results.landmarks[0]` or `results.multiHandLandmarks[0]`).
- **Feature Order**:
  ```
  [
    x1, y1, z1,   // Landmark 0: WRIST (strictly 0.0, 0.0, 0.0 after normalization)
    x2, y2, z2,   // Landmark 1: THUMB_CMC
    x3, y3, z3,   // Landmark 2: THUMB_MCP
    x4, y4, z4,   // Landmark 3: THUMB_IP
    x5, y5, z5,   // Landmark 4: THUMB_TIP
    x6, y6, z6,   // Landmark 5: INDEX_FINGER_MCP
    x7, y7, z7,   // Landmark 6: INDEX_FINGER_PIP
    x8, y8, z8,   // Landmark 7: INDEX_FINGER_DIP
    x9, y9, z9,   // Landmark 8: INDEX_FINGER_TIP
    x10, y10, z10,// Landmark 9: MIDDLE_FINGER_MCP
    x11, y11, z11,// Landmark 10: MIDDLE_FINGER_PIP
    x12, y12, z12,// Landmark 11: MIDDLE_FINGER_DIP
    x13, y13, z13,// Landmark 12: MIDDLE_FINGER_TIP
    x14, y14, z14,// Landmark 13: RING_FINGER_MCP
    x15, y15, z15,// Landmark 14: RING_FINGER_PIP
    x16, y16, z16,// Landmark 15: RING_FINGER_DIP
    x17, y17, z17,// Landmark 16: RING_FINGER_TIP
    x18, y18, z18,// Landmark 17: PINKY_MCP
    x19, y19, z19,// Landmark 18: PINKY_PIP
    x20, y20, z20,// Landmark 19: PINKY_DIP
    x21, y21, z21 // Landmark 20: PINKY_TIP
  ]
  ```

---

## 3. Mandatory Normalization Logic (JavaScript)

> [!IMPORTANT]
> The browser **MUST** execute this exact preprocessing before feeding landmarks to the model. Do not alter this formula.

```typescript
/**
 * Normalizes 21 MediaPipe hand landmarks into a 63-element feature vector.
 * @param landmarks Array of 21 landmark objects: [{x, y, z}, ...]
 * @returns 63-element Float32Array ready for model inference
 */
export function preprocessLandmarks(landmarks: Array<{ x: number; y: number; z: number }>): Float32Array {
  if (!landmarks || landmarks.length !== 21) {
    throw new Error(`Expected 21 landmarks, received ${landmarks?.length}`);
  }

  // 1. Wrist-relative translation (Landmark 0 is Wrist)
  const wrist = landmarks[0];
  const translated = landmarks.map(lm => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: lm.z - wrist.z
  }));

  // 2. Compute maximum Euclidean distance from wrist across all 21 keypoints
  let maxDistance = 0;
  for (let i = 0; i < translated.length; i++) {
    const pt = translated[i];
    const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y + pt.z * pt.z);
    if (dist > maxDistance) {
      maxDistance = dist;
    }
  }

  // 3. Scale normalization
  const scale = maxDistance > 1e-6 ? maxDistance : 1.0;
  const features = new Float32Array(63);

  for (let i = 0; i < 21; i++) {
    features[i * 3 + 0] = translated[i].x / scale;
    features[i * 3 + 1] = translated[i].y / scale;
    features[i * 3 + 2] = translated[i].z / scale;
  }

  return features;
}
```

---

## 4. Output Specification & Class Mapping

- **Output Dimension**: `1D Array` of **26 probability values** (Shape: `[1, 26]`).
- **Values**: Softmax probabilities $\in [0.0, 1.0]$, summing to $1.0$.
- **Mapping**:

| Index | Label | Index | Label | Index | Label | Index | Label |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `0` | **A** | `7` | **H** | `14` | **O** | `21` | **V** |
| `1` | **B** | `8` | **I** | `15` | **P** | `22` | **W** |
| `2` | **C** | `9` | **J** | `16` | **Q** | `23` | **X** |
| `3` | **D** | `10`| **K** | `17` | **R** | `24` | **Y** |
| `4` | **E** | `11`| **L** | `18` | **S** | `25` | **Z** |
| `5` | **F** | `12`| **M** | `19` | **T** | | |
| `6` | **G** | `13`| **N** | `20` | **U** | | |

---

## 5. Integration Options for Person 3

### Option A: Using TensorFlow.js (`@tensorflow/tfjs`)

```typescript
import * as tf from '@tensorflow/tfjs';
import { preprocessLandmarks } from './preprocess';

export class ISLClassifier {
  private model: tf.LayersModel | null = null;
  private classNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  async loadModel() {
    // Loads /models/isl/model.json and /models/isl/group1-shard1of1.bin from public/
    this.model = await tf.loadLayersModel('/models/isl/model.json');
    console.log("ISL Model loaded successfully!");
  }

  predict(landmarks: Array<{ x: number; y: number; z: number }>) {
    if (!this.model) throw new Error("Model not loaded yet");

    const inputFeatures = preprocessLandmarks(landmarks); // Float32Array(63)
    const tensorInput = tf.tensor2d(inputFeatures, [1, 63]);

    const outputTensor = this.model.predict(tensorInput) as tf.Tensor;
    const probabilities = outputTensor.dataSync(); // Float32Array(26)

    tensorInput.dispose();
    outputTensor.dispose();

    // Find class with highest probability
    let maxIdx = 0;
    let maxProb = probabilities[0];
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    return {
      letter: this.classNames[maxIdx],
      classId: maxIdx,
      confidence: maxProb,               // 0.0 to 1.0 (e.g. 0.985)
      confidencePercent: maxProb * 100,  // 0% to 100% (e.g. 98.5%)
      probabilities: Array.from(probabilities)
    };
  }
}
```

---

### Option B: Zero-Dependency Pure JavaScript Runner (`model_weights.json`)

If `@tensorflow/tfjs` is not desired or for instantaneous < 0.1ms execution with zero npm dependencies:

```typescript
import { preprocessLandmarks } from './preprocess';

export class LightweightISLRunner {
  private weights: any = null;
  private classNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  async loadModel() {
    const res = await fetch('/models/isl/model_weights.json');
    this.weights = await res.json();
    console.log("Lightweight ISL Model loaded!");
  }

  predict(landmarks: Array<{ x: number; y: number; z: number }>) {
    if (!this.weights) throw new Error("Model weights not loaded");

    const x = preprocessLandmarks(landmarks);
    const { layer_1_dense, layer_1_batch_norm, layer_2_dense, layer_2_batch_norm, layer_3_output, epsilon } = this.weights;

    // Layer 1: Dense 256 + ReLU
    const h1 = new Float32Array(256);
    for (let j = 0; j < 256; j++) {
      let sum = layer_1_dense.biases[j];
      for (let i = 0; i < 63; i++) {
        sum += x[i] * layer_1_dense.weights[i][j];
      }
      const relu = sum > 0 ? sum : 0;
      // BatchNorm 1
      const mean = layer_1_batch_norm.mean[j];
      const variance = layer_1_batch_norm.variance[j];
      const gamma = layer_1_batch_norm.gamma[j];
      const beta = layer_1_batch_norm.beta[j];
      h1[j] = gamma * (relu - mean) / Math.sqrt(variance + epsilon) + beta;
    }

    // Layer 2: Dense 128 + ReLU
    const h2 = new Float32Array(128);
    for (let j = 0; j < 128; j++) {
      let sum = layer_2_dense.biases[j];
      for (let i = 0; i < 256; i++) {
        sum += h1[i] * layer_2_dense.weights[i][j];
      }
      const relu = sum > 0 ? sum : 0;
      // BatchNorm 2
      const mean = layer_2_batch_norm.mean[j];
      const variance = layer_2_batch_norm.variance[j];
      const gamma = layer_2_batch_norm.gamma[j];
      const beta = layer_2_batch_norm.beta[j];
      h2[j] = gamma * (relu - mean) / Math.sqrt(variance + epsilon) + beta;
    }

    // Layer 3: Dense 26 + Softmax
    const logits = new Float32Array(26);
    let maxLogit = -Infinity;
    for (let j = 0; j < 26; j++) {
      let sum = layer_3_output.biases[j];
      for (let i = 0; i < 128; i++) {
        sum += h2[i] * layer_3_output.weights[i][j];
      }
      logits[j] = sum;
      if (sum > maxLogit) maxLogit = sum;
    }

    // Softmax
    let sumExp = 0;
    const probs = new Float32Array(26);
    for (let j = 0; j < 26; j++) {
      probs[j] = Math.exp(logits[j] - maxLogit);
      sumExp += probs[j];
    }
    for (let j = 0; j < 26; j++) {
      probs[j] /= sumExp;
    }

    let bestIdx = 0;
    let bestProb = probs[0];
    for (let j = 1; j < 26; j++) {
      if (probs[j] > bestProb) {
        bestProb = probs[j];
        bestIdx = j;
      }
    }

    return {
      letter: this.classNames[bestIdx],
      classId: bestIdx,
      confidence: bestProb,
      confidencePercent: bestProb * 100,
      probabilities: Array.from(probs)
    };
  }
}
```
