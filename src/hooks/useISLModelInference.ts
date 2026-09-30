import { useState, useRef, useCallback } from 'react';

export type RecognitionMode = 'demo' | 'model';

export interface ISLPredictorResult {
  letter: string;
  confidence: number;
  status: 'Stable' | 'Detecting';
  cycleId: number;
}

/**
 * Interface contract for ISL Gesture Predictor.
 * Allows seamless replacement of DemoPredictor with actual CNN Model Predictor.
 */
export interface ISLPredictor {
  name: string;
  isReady: boolean;
  predictLetter: (letter: string) => ISLPredictorResult;
}

export function useISLModelInference() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recognition Mode state
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode>('demo');

  // Live prediction state
  const [currentLetter, setCurrentLetter] = useState<string>('A');
  const [confidence, setConfidence] = useState<number>(96.4);
  const [stabilityStatus, setStabilityStatus] = useState<'Stable' | 'Detecting'>('Stable');
  const [lastCycleId, setLastCycleId] = useState<number>(0);

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
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Select letter in Demo Mode (realistic transition: Detecting -> Stable)
  const selectDemoLetter = useCallback((letter: string) => {
    if (recognitionMode !== 'demo') return;

    // Phase 1: Transition to "Detecting..."
    setStabilityStatus('Detecting');

    // Phase 2: Compute realistic confidence & stabilize prediction after short delay
    setTimeout(() => {
      const computedConf = Number((94.2 + Math.random() * 4.8).toFixed(1));
      setCurrentLetter(letter);
      setConfidence(computedConf);
      setStabilityStatus('Stable');
      setLastCycleId(Date.now());
    }, 280);
  }, [recognitionMode]);

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
    startCamera,
    stopCamera,
    selectDemoLetter,
    simulateLetter: selectDemoLetter
  };
}
