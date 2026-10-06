import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionFrameResult {
  landmarks: HandLandmark[] | null;
  handedness?: 'Left' | 'Right' | 'Unknown';
  timestamp: number;
}

export type HandDetectionCallback = (result: HandDetectionFrameResult) => void;

// Default MediaPipe Tasks Vision WASM & Model Asset URLs
const DEFAULT_WASM_LOADER_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const DEFAULT_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export class HandDetectorService {
  private static instance: HandDetectorService | null = null;
  private landmarker: HandLandmarker | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;

  // Animation frame loop tracking
  private activeAnimationId: number | null = null;
  private lastProcessedTimestamp = -1;

  private constructor() {}

  /**
   * Singleton instance accessor.
   */
  public static getInstance(): HandDetectorService {
    if (!HandDetectorService.instance) {
      HandDetectorService.instance = new HandDetectorService();
    }
    return HandDetectorService.instance;
  }

  /**
   * Checks if MediaPipe HandLandmarker is initialized and ready.
   */
  public isReady(): boolean {
    return this.isInitialized && this.landmarker !== null;
  }

  /**
   * Initializes MediaPipe Tasks Vision HandLandmarker.
   * Cached: Reuses existing initialization promise across concurrent callers.
   */
  public async initialize(
    wasmPath: string = DEFAULT_WASM_LOADER_PATH,
    modelPath: string = DEFAULT_MODEL_ASSET_PATH
  ): Promise<void> {
    if (this.isInitialized && this.landmarker) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(wasmPath);

        // Attempt GPU delegate first, fallback to CPU if GPU is unsupported
        try {
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        } catch (gpuError) {
          console.warn('[HandDetector] GPU delegate initialization failed, falling back to CPU:', gpuError);
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        }

        this.isInitialized = true;
      } catch (error) {
        this.landmarker = null;
        this.isInitialized = false;
        this.initPromise = null;
        console.error('[HandDetector] Failed to initialize MediaPipe HandLandmarker:', error);
        throw new Error(
          `Failed to initialize MediaPipe HandLandmarker: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    })();

    return this.initPromise;
  }

  /**
   * Detects 21 hand landmarks on a single video frame.
   *
   * @param video HTMLVideoElement containing active video stream
   * @param timestampMs Optional timestamp in milliseconds
   * @returns HandLandmark[] (21 landmarks) if detected, or null if no hand is detected/video not ready
   */
  public detectVideoFrame(video: HTMLVideoElement, timestampMs: number = performance.now()): HandDetectionFrameResult {
    if (!this.landmarker || !this.isInitialized) {
      return { landmarks: null, timestamp: timestampMs };
    }

    // Ensure video stream is valid and has loaded video frame data
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
      return { landmarks: null, timestamp: timestampMs };
    }

    // MediaPipe VIDEO mode requires monotonically increasing timestamps
    const frameTimestamp = timestampMs > this.lastProcessedTimestamp ? timestampMs : this.lastProcessedTimestamp + 1;
    this.lastProcessedTimestamp = frameTimestamp;

    try {
      const result = this.landmarker.detectForVideo(video, frameTimestamp);

      if (result && result.landmarks && result.landmarks.length > 0) {
        const primaryHand = result.landmarks[0];

        if (primaryHand && primaryHand.length === 21) {
          // Extract exact raw {x, y, z} keypoints (normalization handled separately in preprocessLandmarks)
          const extractedLandmarks: HandLandmark[] = primaryHand.map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z
          }));

          let handedness: 'Left' | 'Right' | 'Unknown' = 'Unknown';
          if (result.handedness && result.handedness.length > 0 && result.handedness[0].length > 0) {
            const categoryName = result.handedness[0][0].categoryName;
            if (categoryName === 'Left' || categoryName === 'Right') {
              handedness = categoryName;
            }
          }

          return {
            landmarks: extractedLandmarks,
            handedness,
            timestamp: frameTimestamp
          };
        }
      }
    } catch (err) {
      console.warn('[HandDetector] Frame detection warning:', err);
    }

    return {
      landmarks: null,
      timestamp: frameTimestamp
    };
  }

  /**
   * Starts a controlled requestAnimationFrame detection loop on a video element.
   *
   * @param video HTMLVideoElement with active camera stream
   * @param onFrame Callback invoked with each detection result
   * @returns Cleanup function to stop the detection loop
   */
  public startDetectionLoop(video: HTMLVideoElement, onFrame: HandDetectionCallback): () => void {
    let isLoopRunning = true;

    const loop = (timestamp: number) => {
      if (!isLoopRunning) return;

      if (this.isReady() && video && !video.paused && video.readyState >= 2) {
        const result = this.detectVideoFrame(video, timestamp);
        onFrame(result);
      }

      this.activeAnimationId = requestAnimationFrame(loop);
    };

    this.activeAnimationId = requestAnimationFrame(loop);

    return () => {
      isLoopRunning = false;
      if (this.activeAnimationId !== null) {
        cancelAnimationFrame(this.activeAnimationId);
        this.activeAnimationId = null;
      }
    };
  }

  /**
   * Cleans up running animation frames and disposes MediaPipe detector resources.
   */
  public dispose(): void {
    if (this.activeAnimationId !== null) {
      cancelAnimationFrame(this.activeAnimationId);
      this.activeAnimationId = null;
    }

    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        console.warn('[HandDetector] Error closing landmarker:', e);
      }
      this.landmarker = null;
    }

    this.isInitialized = false;
    this.initPromise = null;
    this.lastProcessedTimestamp = -1;
  }
}

// Export singleton instance and convenience helpers
export const handDetector = HandDetectorService.getInstance();
export const initializeHandDetector = () => handDetector.initialize();
export const isHandDetectorReady = () => handDetector.isReady();
export const detectHandFromVideo = (video: HTMLVideoElement, timestamp?: number) =>
  handDetector.detectVideoFrame(video, timestamp);
