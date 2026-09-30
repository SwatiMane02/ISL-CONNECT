import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, Info, Play, Square, Cpu, Layers, Volume2, VolumeX, RotateCcw, CornerDownLeft, AlertCircle } from 'lucide-react';
import { useISLModelInference } from '../../hooks/useISLModelInference';
import { ISL_ALPHABET } from '../../data/islAlphabet';

export const LiveRecognitionPage: React.FC = () => {
  const {
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
    selectDemoLetter
  } = useISLModelInference();

  const [messageBuffer, setMessageBuffer] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const processedCycleRef = useRef<number>(0);

  // Automatically append letter to buffer when prediction stabilizes in a NEW cycle
  useEffect(() => {
    if (stabilityStatus === 'Stable' && lastCycleId > 0 && lastCycleId !== processedCycleRef.current) {
      processedCycleRef.current = lastCycleId;
      setMessageBuffer(prev => prev + currentLetter);
    }
  }, [stabilityStatus, lastCycleId, currentLetter]);

  // Buffer Action Handlers
  const handleAddSpace = () => {
    setMessageBuffer(prev => prev + ' ');
  };

  const handleBackspace = () => {
    setMessageBuffer(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setMessageBuffer('');
  };

  // Robust Text-to-Speech handler
  const handleSpeak = () => {
    // 1. Guard against empty text or active speech playback
    if (!messageBuffer.trim() || isSpeaking) return;

    setTtsError(null);

    // 2. Check browser SpeechSynthesis availability
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Cancel any existing queue

        const utterance = new SpeechSynthesisUtterance(messageBuffer);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.warn('Speech synthesis error:', event);
          setIsSpeaking(false);
          setTtsError('Audio playback interrupted. Please try again.');
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('SpeechSynthesis exception:', err);
        setIsSpeaking(false);
        setTtsError('Text-to-speech engine is currently unavailable.');
      }
    } else {
      // 3. Fallback for browsers without SpeechSynthesis support
      setTtsError('Speech synthesis is not supported by your current browser.');
    }
  };

  const activeSignData = ISL_ALPHABET.find(item => item.letter === currentLetter) || ISL_ALPHABET[0];

  return (
    <div className="py-10 md:py-16 bg-[#FAF8F5] min-h-screen border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Page Header */}
        <div className="mb-8 pb-6 border-b border-[#E6E1DA]">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-2">
            <Sparkles className="w-4 h-4" />
            Live Recognition & Text Formation
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] tracking-tight">
            Live ISL Recognition
          </h1>
          <p className="mt-2 text-base text-[#475569] max-w-2xl font-normal">
            Use your webcam to recognize ISL alphabet gestures in real time and automatically form text.
          </p>
        </div>

        {/* 2. Mode Selector Bar */}
        <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-4 sm:p-5 mb-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
                Recognition Mode
              </span>
              <span className="text-xs text-[#64748B]">Select active prediction engine</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#FAF8F5] p-1.5 border border-[#E6E1DA] rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setRecognitionMode('demo')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                recognitionMode === 'demo'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Demo Mode (Active)
            </button>

            <button
              disabled
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
              title="CNN Model Inference coming soon"
            >
              <span>Model Mode</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-bold">
                Coming soon
              </span>
            </button>
          </div>
        </div>

        {/* 3. Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          
          {/* LEFT: Large Webcam Panel (7 cols) */}
          <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl overflow-hidden shadow-xs flex flex-col">
            
            {/* Viewfinder Header */}
            <div className="px-5 py-4 bg-[#FAF8F5] border-b border-[#E6E1DA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isCameraActive ? 'bg-[#0D9488] animate-pulse' : 'bg-slate-400'
                }`}></span>
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">
                  {isCameraActive ? 'Camera Status: Active' : 'Camera Status: Offline'}
                </span>
              </div>

              {/* Start / Stop Camera Controls */}
              <div className="flex items-center gap-2">
                {!isCameraActive ? (
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 text-[#0D9488] fill-[#0D9488]" />
                    <span>Start Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop Camera</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewfinder Surface */}
            <div className="relative bg-[#0F172A] min-h-[360px] sm:min-h-[400px] flex items-center justify-center p-6 text-white overflow-hidden">
              
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {!isCameraActive && (
                <div className="flex flex-col items-center justify-center text-center p-6 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-[#0D9488]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">Webcam Stream Preview</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-6">
                    Click "Start Camera" above to activate your video stream or use the compact letter selector below.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Enable Webcam Access
                  </button>
                </div>
              )}

              {isCameraActive && (
                <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-[#0D9488]/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4 z-20">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-[#0D9488]"></div>
                    <div className="w-4 h-4 border-t-2 border-r-2 border-[#0D9488]"></div>
                  </div>

                  <div className="self-center bg-[#0F172A]/90 backdrop-blur border border-[#0D9488]/40 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping"></span>
                    <span>Tracking Hand Landmarks</span>
                  </div>

                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-[#0D9488]"></div>
                    <div className="w-4 h-4 border-b-2 border-r-2 border-[#0D9488]"></div>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute bottom-4 left-4 right-4 bg-amber-900/90 text-amber-200 px-3 py-2 rounded-lg text-xs border border-amber-700 z-30">
                  {cameraError}
                </div>
              )}

            </div>

            {/* Compact A–Z Letter Selector */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E6E1DA]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Compact A–Z Letter Selector (Demo Mode)
                </span>
                <span className="text-[11px] text-[#0D9488] font-bold">Click to trigger gesture</span>
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-1.5">
                {ISL_ALPHABET.map((item) => (
                  <button
                    key={item.letter}
                    onClick={() => selectDemoLetter(item.letter)}
                    className={`h-9 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                      currentLetter === item.letter
                        ? 'bg-[#0F172A] text-white ring-2 ring-[#0D9488] shadow-xs'
                        : 'bg-white text-[#334155] border border-[#E6E1DA] hover:border-[#0D9488]'
                    }`}
                  >
                    {item.letter}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Recognition Panel (5 cols) */}
          <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[440px]">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E1DA] mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  CURRENT LETTER
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF8F5] text-[#64748B] border border-[#E6E1DA]">
                    Demo Mode
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                    stabilityStatus === 'Stable'
                      ? 'bg-[#0D9488]/10 text-[#0F766E] border-[#0D9488]/30'
                      : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                  }`}>
                    {stabilityStatus === 'Stable' ? 'Stable' : 'Detecting...'}
                  </span>
                </div>
              </div>

              {/* Large Predicted Letter Display */}
              <div className="flex flex-col items-center justify-center p-6 bg-[#FAF8F5] border border-[#E6E1DA] rounded-2xl mb-6 text-center">
                <div className="w-28 h-28 rounded-2xl bg-[#0F172A] text-[#FAF8F5] flex items-center justify-center border-4 border-[#0D9488] shadow-md mb-3">
                  <span className="text-6xl font-black tracking-tight">{currentLetter}</span>
                </div>

                <div className="text-sm font-bold text-[#0F172A] mb-1">
                  Confidence: <span className="text-[#0D9488] font-mono">{confidence}%</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-xs my-2">
                  <div 
                    className="bg-[#0D9488] h-full transition-all duration-300"
                    style={{ width: `${confidence}%` }}
                  ></div>
                </div>

                <span className="text-xs text-[#64748B] font-medium">
                  Posture: {activeSignData.handForm}
                </span>
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl text-xs space-y-1">
                <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#0D9488]" />
                  <span>Sign Formation Guidance</span>
                </div>
                <p className="text-[#475569] leading-relaxed">{activeSignData.description}</p>
              </div>

            </div>

            <div className="mt-4 pt-4 border-t border-[#E6E1DA] text-xs text-[#64748B] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#0D9488]" />
                <span>Engine: Modular ISLPredictor</span>
              </div>
              <span className="font-mono text-[11px] text-[#0D9488]">DemoPredictor</span>
            </div>

          </div>

        </div>

        {/* 4. RECOGNIZED TEXT SECTION */}
        <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 shadow-xs">
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                <span>RECOGNIZED TEXT</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#0F766E]">
                  Auto Accumulating
                </span>
              </h2>

              {/* Speaking Active Audio Wave Indicator */}
              {isSpeaking && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0D9488] text-white text-[11px] font-bold animate-pulse">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>Audio Playing...</span>
                </div>
              )}
            </div>

            <span className="text-xs font-semibold text-[#0D9488] bg-[#0D9488]/10 px-2.5 py-0.5 rounded font-mono">
              {messageBuffer.length} {messageBuffer.length === 1 ? 'Character' : 'Characters'}
            </span>
          </div>

          {/* Recognized Text Screen */}
          <div className="min-h-[90px] p-5 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl flex items-center justify-between mb-4">
            <span className="text-3xl font-extrabold tracking-widest text-[#0F172A] break-all font-mono">
              {messageBuffer || <span className="text-[#94A3B8] font-normal italic text-base">Select A–Z signs to spell text (e.g. H → E → L → L → O)...</span>}
            </span>
            {messageBuffer && (
              <span className="w-2.5 h-6 bg-[#0D9488] animate-pulse ml-2 shrink-0"></span>
            )}
          </div>

          {/* Browser TTS Error / Compatibility Notice */}
          {ttsError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{ttsError}</span>
            </div>
          )}

          {/* Controls: Space, Backspace, Clear, Speak */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSpeak}
              disabled={!messageBuffer.trim() || isSpeaking}
              className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-[#0D9488] text-white shadow-md'
                  : messageBuffer.trim()
                    ? 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Volume2 className="w-4 h-4 text-white animate-bounce" />
                  <span>Speaking...</span>
                </>
              ) : messageBuffer.trim() ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Speak</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span>Speak</span>
                </>
              )}
            </button>

            <button
              onClick={handleAddSpace}
              className="py-3 px-5 bg-white border border-[#E6E1DA] hover:bg-[#FAF8F5] text-[#0F172A] font-semibold text-sm rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CornerDownLeft className="w-4 h-4 text-[#0D9488]" />
              <span>Space</span>
            </button>

            <button
              onClick={handleBackspace}
              disabled={!messageBuffer}
              className="py-3 px-5 bg-white border border-[#E6E1DA] hover:bg-[#FAF8F5] text-[#0F172A] font-semibold text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Backspace
            </button>

            <button
              onClick={handleClear}
              disabled={!messageBuffer}
              className="flex items-center gap-1.5 py-3 px-5 bg-white border border-[#E6E1DA] hover:bg-rose-50 text-rose-600 font-semibold text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
