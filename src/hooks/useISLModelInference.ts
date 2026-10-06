import { useState, useRef, useCallback, useEffect } from 'react';
import { islClassifier, type ISLPredictionResult } from '../services/islClassifier';
import { handDetector, type HandLandmark, type HandDetectionFrameResult } from '../services/handDetector';
import { preprocessLandmarks } from '../utils/preprocessLandmarks';

export type RecognitionMode = 'demo' | 'model';

// Configurable Constants for Temporal Stability & Filtering
export const CONFIDENCE_THRESHOLD = 0.75; // 75% minimum model confidence
export const HISTORY_WINDOW_SIZE = 5; // Window of recent frame predictions
export const REQUIRED_AGREEMENT_COUNT = 3; // Number of matching predictions required for consensus

export interface ISLPredictorResult {
  letter: string;
  confidence: number;
  status: 'Stable' | 'Detecting';
  cycleId: number;
}

export interface UseISLModelInferenceReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  cameraError: string | null;
  recognitionMode: RecognitionMode;
  setRecognitionMode: (mode: RecognitionMode) => void;
  currentLetter: string;
  confidence: number; // 0 to 100
  stabilityStatus: 'Stable' | 'Detecting';
  lastCycleId: number;
  isModelLoading: boolean;
  modelError: string | null;
  isHandDetected: boolean;
  detectedLandmarks: HandLandmark[] | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  selectDemoLetter: (letter: string) => void;
  simulateLetter: (letter: string) => void;
}

export function useISLModelInference(): UseISLModelInferenceReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recognition Mode state: 'demo' or 'model'
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode>('demo');

  // Model & Detector loading state
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Live prediction & tracking state
  const [currentLetter, setCurrentLetter] = useState<string>('A');
  const [confidence, setConfidence] = useState<number>(96.4);
  const [stabilityStatus, setStabilityStatus] = useState<'Stable' | 'Detecting'>('Stable');
  const [lastCycleId, setLastCycleId] = useState<number>(0);
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false);
  const [detectedLandmarks, setDetectedLandmarks] = useState<HandLandmark[] | null>(null);

  // Temporal smoothing refs (kept in refs to avoid render thrashing)
  const predictionHistoryRef = useRef<Array<{ letter: string; confidence: number }>>([]);
  const lastCommittedLetterRef = useRef<string | null>(null);
  const lastUiUpdateRef = useRef<number>(0);
  const loopCleanupRef = useRef<(() => void) | null>(null);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Camera start handler
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access unavailable or denied. Operating in interactive camera mode.', err);
      setCameraError('Camera stream notice: Using interactive viewfinder mode.');
      setIsCameraActive(true);
    }
  }, []);

  // Camera stop handler
  const stopCamera = useCallback(() => {
    if (loopCleanupRef.current) {
      loopCleanupRef.current();
      loopCleanupRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsHandDetected(false);
    setDetectedLandmarks(null);
  }, []);

  // Select letter in Demo Mode (simulated transition)
  const selectDemoLetter = useCallback((letter: string) => {
    if (recognitionMode !== 'demo') return;

    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current);
    }

    setStabilityStatus('Detecting');

    demoTimeoutRef.current = setTimeout(() => {
      const computedConf = Number((94.2 + Math.random() * 4.8).toFixed(1));
      setCurrentLetter(letter);
      setConfidence(computedConf);
      setStabilityStatus('Stable');
      setLastCycleId(Date.now());
    }, 280);
  }, [recognitionMode]);

  // Frame processing callback for real MediaPipe + TF.js pipeline
  const processFrame = useCallback((frameResult: HandDetectionFrameResult) => {
    const { landmarks } = frameResult;
    const now = performance.now();

    // 1. No Hand Condition
    if (!landmarks || landmarks.length !== 21) {
      predictionHistoryRef.current = [];
      lastCommittedLetterRef.current = null;

      // Throttle UI updates when no hand is present
      if (now - lastUiUpdateRef.current > 150) {
        lastUiUpdateRef.current = now;
        setIsHandDetected(false);
        setDetectedLandmarks(null);
        setStabilityStatus('Detecting');
      }
      return;
    }

    // Hand is present
    setIsHandDetected(true);
    setDetectedLandmarks(landmarks);

    // 2. Preprocess 21 raw landmarks into 63 normalized features
    let features: Float32Array;
    try {
      features = preprocessLandmarks(landmarks);
    } catch (prepErr) {
      console.warn('[useISLModelInference] Preprocessing error:', prepErr);
      return;
    }

    // 3. Forward Inference via TensorFlow.js Model Service
    let prediction: ISLPredictionResult;
    try {
      prediction = islClassifier.predict(features);
    } catch (predErr) {
      console.warn('[useISLModelInference] Prediction error:', predErr);
      return;
    }

    const { letter, confidence: rawConf } = prediction;
    const history = predictionHistoryRef.current;

    // 4. Confidence Threshold Check
    if (rawConf >= CONFIDENCE_THRESHOLD) {
      history.push({ letter, confidence: rawConf });
      if (history.length > HISTORY_WINDOW_SIZE) {
        history.shift();
      }

      // Count occurrences of each letter in the window
      const counts: Record<string, number> = {};
      let totalConf = 0;
      let matchingConfCount = 0;

      for (const item of history) {
        counts[item.letter] = (counts[item.letter] || 0) + 1;
      }

      // Find majority candidate
      let majorityLetter = letter;
      let majorityCount = 0;
      for (const [cand, cnt] of Object.entries(counts)) {
        if (cnt > majorityCount) {
          majorityCount = cnt;
          majorityLetter = cand;
        }
      }

      for (const item of history) {
        if (item.letter === majorityLetter) {
          totalConf += item.confidence;
          matchingConfCount++;
        }
      }

      const avgConfidence = matchingConfCount > 0 ? totalConf / matchingConfCount : rawConf;
      const confPercent = Number((avgConfidence * 100).toFixed(1));

      // 5. Consensus Reached -> STABLE state
      if (majorityCount >= REQUIRED_AGREEMENT_COUNT) {
        setCurrentLetter(majorityLetter);
        setConfidence(confPercent);
        setStabilityStatus('Stable');

        // Prevent repeated letter insertion while holding same gesture:
        // Only trigger lastCycleId if this is a NEW stable letter
        if (lastCommittedLetterRef.current !== majorityLetter) {
          lastCommittedLetterRef.current = majorityLetter;
          setLastCycleId(Date.now());
        }
      } else {
        // In transition / consensus building
        if (now - lastUiUpdateRef.current > 80) {
          lastUiUpdateRef.current = now;
          setCurrentLetter(letter);
          setConfidence(Number((rawConf * 100).toFixed(1)));
          setStabilityStatus('Detecting');
        }
      }
    } else {
      // Low confidence prediction (< 0.75)
      history.shift(); // decay history
      if (now - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = now;
        setCurrentLetter(letter);
        setConfidence(Number((rawConf * 100).toFixed(1)));
        setStabilityStatus('Detecting');
      }
    }
  }, []);

  // Initialize and manage Model Mode loop
  useEffect(() => {
    // If in Demo Mode, clean up any active Model Mode loops
    if (recognitionMode !== 'model') {
      if (loopCleanupRef.current) {
        loopCleanupRef.current();
        loopCleanupRef.current = null;
      }
      return;
    }

    // In Model Mode: ensure camera and services are loaded
    let isCancelled = false;

    const setupModelPipeline = async () => {
      setModelError(null);
      setIsModelLoading(true);

      try {
        // 1. Load TensorFlow.js Model
        if (!islClassifier.isLoaded()) {
          await islClassifier.loadModel();
        }

        // 2. Initialize MediaPipe HandLandmarker
        if (!handDetector.isReady()) {
          await handDetector.initialize();
        }

        if (isCancelled) return;

        setIsModelLoading(false);

        // 3. Start camera if not active
        if (!isCameraActive) {
          await startCamera();
        }

        // 4. Start detection loop on video element
        if (videoRef.current) {
          if (loopCleanupRef.current) {
            loopCleanupRef.current();
          }
          loopCleanupRef.current = handDetector.startDetectionLoop(videoRef.current, processFrame);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('[useISLModelInference] Pipeline setup error:', err);
        setIsModelLoading(false);
        setModelError(err instanceof Error ? err.message : 'Failed to initialize AI detection engine.');
      }
    };

    setupModelPipeline();

    return () => {
      isCancelled = true;
      if (loopCleanupRef.current) {
        loopCleanupRef.current();
        loopCleanupRef.current = null;
      }
      if (demoTimeoutRef.current) {
        clearTimeout(demoTimeoutRef.current);
      }
    };
  }, [recognitionMode, isCameraActive, startCamera, processFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loopCleanupRef.current) {
        loopCleanupRef.current();
        loopCleanupRef.current = null;
      }
      if (demoTimeoutRef.current) {
        clearTimeout(demoTimeoutRef.current);
      }
    };
  }, []);

  return {
    videoRef,
    isCameraActive,
    cameraError,
    recognitionMode,
    setRecognitionMode,
    currentLetter,
    confidence,
    stabilityStatus,
    lastCycleId,
    isModelLoading,
    modelError,
    isHandDetected,
    detectedLandmarks,
    startCamera,
    stopCamera,
    selectDemoLetter,
    simulateLetter: selectDemoLetter
  };
}
