import * as tf from '@tensorflow/tfjs';
import { preprocessLandmarks, type Landmark3D } from '../utils/preprocessLandmarks';

export interface ISLPredictionResult {
  letter: string;
  confidence: number; // 0.0 to 1.0
  classIndex: number; // 0 to 25
  probabilities?: number[];
}

export interface ClassNamesMapping {
  id_to_label: Record<string, string>;
  label_to_id: Record<string, number>;
}

/**
 * Custom L2 Regularizer class registered with TensorFlow.js
 * to ensure seamless deserialization of Keras 3 exported models.
 */
class L2Regularizer extends tf.serialization.Serializable {
  public static readonly className = 'L2';
  private l2: number;

  constructor(config?: { l2?: number }) {
    super();
    this.l2 = config?.l2 ?? 0.0;
  }

  public apply(x: tf.Tensor): tf.Tensor {
    return tf.tidy(() => tf.mul(tf.scalar(this.l2), tf.sum(tf.square(x))));
  }

  public override getConfig(): tf.serialization.ConfigDict {
    return { l2: this.l2 };
  }
}

// Register L2 regularizer with TF.js serialization system
try {
  tf.serialization.registerClass(L2Regularizer);
} catch {
  // Already registered or unavailable
}

export class ISLClassifierService {
  private static instance: ISLClassifierService | null = null;
  private model: tf.LayersModel | null = null;
  private classNames: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  private loadPromise: Promise<void> | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Singleton accessor.
   */
  public static getInstance(): ISLClassifierService {
    if (!ISLClassifierService.instance) {
      ISLClassifierService.instance = new ISLClassifierService();
    }
    return ISLClassifierService.instance;
  }

  /**
   * Check if the model is currently loaded and ready for inference.
   */
  public isLoaded(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Loads the TensorFlow.js model and class mappings from the public assets.
   * Cached: Multiple calls will reuse the same loading promise and model instance.
   */
  public async loadModel(
    modelUrl: string = '/models/isl/model.json',
    classNamesUrl: string = '/models/isl/class_names.json'
  ): Promise<void> {
    if (this.isInitialized && this.model) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        // Ensure TF.js backend is ready
        await tf.ready();

        // 1. Fetch class names mapping
        try {
          const res = await fetch(classNamesUrl);
          if (res.ok) {
            const data: ClassNamesMapping = await res.json();
            if (data.id_to_label) {
              const names: string[] = [];
              for (let i = 0; i < 26; i++) {
                names[i] = data.id_to_label[String(i)] ?? String.fromCharCode(65 + i);
              }
              this.classNames = names;
            }
          }
        } catch (e) {
          console.warn('[ISLClassifier] Could not fetch class_names.json, using default A-Z mapping:', e);
        }

        // 2. Fetch and adapt model topology for Keras 3 compatibility
        const modelRes = await fetch(modelUrl);
        if (!modelRes.ok) {
          throw new Error(`Failed to fetch model manifest from ${modelUrl} (status: ${modelRes.status})`);
        }
        const modelJson = await modelRes.json();

        // Normalize Keras 3 batch_shape -> batch_input_shape if needed by tfjs-layers
        if (modelJson.modelTopology?.config?.layers) {
          for (const layer of modelJson.modelTopology.config.layers) {
            if (layer.config?.batch_shape && !layer.config.batch_input_shape) {
              layer.config.batch_input_shape = layer.config.batch_shape;
              layer.config.batchInputShape = layer.config.batch_shape;
            }
          }
        }

        // 3. Fetch weight buffer shard
        const manifest = modelJson.weightsManifest?.[0];
        if (!manifest || !manifest.paths?.[0]) {
          throw new Error('Invalid or missing weightsManifest in model.json');
        }

        const baseUrl = modelUrl.substring(0, modelUrl.lastIndexOf('/') + 1);
        const binUrl = baseUrl + manifest.paths[0];

        const binRes = await fetch(binUrl);
        if (!binRes.ok) {
          throw new Error(`Failed to fetch binary weight shard from ${binUrl} (status: ${binRes.status})`);
        }
        const weightBuffer = await binRes.arrayBuffer();

        // 4. Construct custom IOHandler to load model into memory
        const customIO: tf.io.IOHandler = {
          load: async () => ({
            modelTopology: modelJson.modelTopology,
            weightSpecs: manifest.weights,
            weightData: weightBuffer,
            format: modelJson.format,
            generatedBy: modelJson.generatedBy,
            convertedBy: modelJson.convertedBy
          })
        };

        this.model = await tf.loadLayersModel(customIO);
        this.isInitialized = true;
      } catch (error) {
        this.model = null;
        this.isInitialized = false;
        this.loadPromise = null;
        console.error('[ISLClassifier] Failed to load model:', error);
        throw new Error(
          `Failed to load ISL model from ${modelUrl}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    })();

    return this.loadPromise;
  }

  /**
   * Run inference on a 63-element normalized feature vector.
   *
   * @param features Float32Array or Array of 63 normalized landmark floats
   * @returns ISLPredictionResult with predicted letter, confidence (0..1), and class index
   */
  public predict(features: Float32Array | number[]): ISLPredictionResult {
    if (!this.model || !this.isInitialized) {
      throw new Error('ISLClassifier: Model is not loaded. Call loadModel() before predicting.');
    }

    if (!features || features.length !== 63) {
      throw new Error(`ISLClassifier: Expected 63 input features, received ${features ? features.length : 0}`);
    }

    // Convert input to Float32Array if passed as number[]
    const floatArray = features instanceof Float32Array ? features : new Float32Array(features);

    let probabilities: Float32Array;

    // Use tf.tidy for automatic tensor memory cleanup
    try {
      probabilities = tf.tidy(() => {
        const inputTensor = tf.tensor2d(floatArray, [1, 63], 'float32');
        const outputTensor = this.model!.predict(inputTensor) as tf.Tensor;
        return outputTensor.dataSync() as Float32Array;
      });
    } catch (err) {
      console.error('[ISLClassifier] Prediction error:', err);
      throw new Error(`ISLClassifier: Prediction execution failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Find class with highest probability
    let maxIdx = 0;
    let maxProb = probabilities[0] ?? 0;

    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    const letter = this.classNames[maxIdx] ?? String.fromCharCode(65 + maxIdx);

    return {
      letter,
      confidence: Number(maxProb.toFixed(4)),
      classIndex: maxIdx,
      probabilities: Array.from(probabilities)
    };
  }

  /**
   * Helper to preprocess 21 raw landmarks and perform prediction in one call.
   *
   * @param landmarks Array of 21 3D landmarks
   * @returns ISLPredictionResult
   */
  public predictFromLandmarks(landmarks: Array<Landmark3D | { x: number; y: number; z?: number }>): ISLPredictionResult {
    const normalized = preprocessLandmarks(landmarks);
    return this.predict(normalized);
  }
}

// Export singleton instance and convenience helper methods
export const islClassifier = ISLClassifierService.getInstance();
export const loadISLModel = () => islClassifier.loadModel();
export const isISLModelLoaded = () => islClassifier.isLoaded();
export const predictISL = (features: Float32Array | number[]) => islClassifier.predict(features);
export const predictISLFromLandmarks = (landmarks: Array<Landmark3D | { x: number; y: number; z?: number }>) =>
  islClassifier.predictFromLandmarks(landmarks);
