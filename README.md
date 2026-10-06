# ISL CONNECT — Real-Time Indian Sign Language Recognition

ISL CONNECT brings accessible, real-time Indian Sign Language (ISL) alphabet recognition (A–Z) directly to modern web browsers through client-side computer vision and deep learning.

---

## 1. Machine Learning & Vision Architecture

- **Model Artifacts Location**: `public/models/isl/` (`model.json`, `group1-shard1of1.bin`, `class_names.json`).
- **Trained Model**: `best_mlp_improved.keras` converted and exported to TensorFlow.js (`63 → 256 → 128 → 26`).
- **Input Dimension**: 21 3D hand keypoints $(x, y, z) = 63$ normalized floating-point features.
- **Preprocessing Pipeline**: Wrist-centric translation (Landmark 0 is origin $[0,0,0]$) + Scale normalization (maximum Euclidean radius scaling).
- **Output Dimension**: 26 classes representing ISL alphabet characters `A` through `Z` (Index `0` = `'A'` ... Index `25` = `'Z'`).
- **Hand Detection**: `@mediapipe/tasks-vision` single-hand Landmarker in `VIDEO` continuous tracking mode.

---

## 2. In-Browser Real-Time Inference Pipeline

```
Webcam Frame (720p @ 30 FPS)
  │
  ▼
MediaPipe Tasks Vision Hand Landmarker (Single Hand)
  │
  ├─► No Hand ──► Clears temporal history (zero TF inference executed)
  │
  ▼
21 Raw Keypoints (x, y, z)
  │
  ▼
preprocessLandmarks() (Wrist Translation + Max Radius Normalization)
  │
  ▼
63-Feature Float32Array
  │
  ▼
ISLClassifierService (TensorFlow.js Layers Model)
  │
  ▼
Softmax Confidence Gate (Confidence Threshold >= 0.75)
  │
  ▼
Temporal Consensus Smoothing (5-Frame Window, >= 3 Agreement)
  │
  ▼
Stable Recognized Sign ──► Live Text Buffer ──► SpeechSynthesis TTS Output
```

---

## 3. Core Features

- **Live Recognition (`/live`)**: Real-time sign spelling with auto-accumulating sentence buffer, backspace/space/clear controls, and browser Text-to-Speech audio output.
- **Practice Mode (`/practice`)**: Interactive gesture training testing individual target letters against live webcam feed with single-scoring locks, streak tracking, and accuracy metrics.
- **Learn ISL (`/learn`)**: 26-letter sign dictionary with posture guidance and interactive quizzes.
- **Demo Mode**: Built-in interactive simulator allowing full application testing without webcam access.

---

## 4. Development & Build

```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Run TypeScript check & production build
npm run build

# Run linter
npm run lint
```
