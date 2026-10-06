export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Normalizes 21 3D hand landmarks into a 63-element feature vector.
 *
 * Normalization Algorithm (identically matching the Python ML pipeline):
 * 1. Landmark 0 (wrist) serves as the origin/reference point: (x_0, y_0, z_0).
 * 2. Translate all 21 landmarks relative to wrist:
 *      x'_i = x_i - x_0
 *      y'_i = y_i - y_0
 *      z'_i = z_i - z_0
 * 3. Compute scale as the maximum Euclidean distance from the wrist across all 21 landmarks:
 *      scale = max_{i=0..20} sqrt((x'_i)^2 + (y'_i)^2 + (z'_i)^2)
 * 4. If scale > 1e-6, divide all coordinates by scale; otherwise set to 0.0.
 *
 * @param landmarks Array of exactly 21 landmark objects with x, y, z coordinates
 * @returns Float32Array of length 63: [x0, y0, z0, x1, y1, z1, ..., x20, y20, z20]
 */
export function preprocessLandmarks(landmarks: Array<{ x: number; y: number; z?: number }>): Float32Array {
  if (!landmarks || landmarks.length !== 21) {
    throw new Error(`Expected 21 landmarks, but received ${landmarks ? landmarks.length : 0}`);
  }

  // 1. Landmark 0 (wrist) is the reference origin
  const wristX = landmarks[0].x;
  const wristY = landmarks[0].y;
  const wristZ = landmarks[0].z ?? 0;

  // 2. Wrist-relative translation
  const translatedX = new Float32Array(21);
  const translatedY = new Float32Array(21);
  const translatedZ = new Float32Array(21);

  for (let i = 0; i < 21; i++) {
    translatedX[i] = landmarks[i].x - wristX;
    translatedY[i] = landmarks[i].y - wristY;
    translatedZ[i] = (landmarks[i].z ?? 0) - wristZ;
  }

  // 3. Compute maximum Euclidean distance from wrist
  let maxDistance = 0;
  for (let i = 0; i < 21; i++) {
    const dist = Math.sqrt(
      translatedX[i] * translatedX[i] +
      translatedY[i] * translatedY[i] +
      translatedZ[i] * translatedZ[i]
    );
    if (dist > maxDistance) {
      maxDistance = dist;
    }
  }

  // 4. Scale normalization
  const features = new Float32Array(63);
  const scale = maxDistance > 1e-6 ? maxDistance : 0;

  if (scale > 0) {
    for (let i = 0; i < 21; i++) {
      features[i * 3 + 0] = translatedX[i] / scale;
      features[i * 3 + 1] = translatedY[i] / scale;
      features[i * 3 + 2] = translatedZ[i] / scale;
    }
  } else {
    // If scale is <= 1e-6, all normalized coordinates are 0.0 (Float32Array defaults to 0)
    features.fill(0);
  }

  return features;
}
