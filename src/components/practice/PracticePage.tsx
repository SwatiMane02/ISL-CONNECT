import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, RotateCcw, ArrowRight, LogOut, Play, Square, Award, Flame, Target, Trophy, RefreshCw, Cpu, Loader2 } from 'lucide-react';
import { useISLModelInference } from '../../hooks/useISLModelInference';
import { ISL_ALPHABET } from '../../data/islAlphabet';

interface PracticePageProps {
  onNavigate: (path: string) => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({ onNavigate }) => {
  const {
    videoRef,
    isCameraActive,
    cameraError,
    recognitionMode,
    setRecognitionMode,
    currentLetter,
    confidence,
    stabilityStatus,
    isModelLoading,
    modelError,
    isHandDetected,
    startCamera,
    stopCamera,
    selectDemoLetter
  } = useISLModelInference();

  // Session State
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [totalQuestions] = useState<number>(10);
  const [targetLetter, setTargetLetter] = useState<string>('G');
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isQuestionScored, setIsQuestionScored] = useState<boolean>(false);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);

  // Set Model Mode as active for Practice by default
  useEffect(() => {
    setRecognitionMode('model');
  }, [setRecognitionMode]);

  // Model readiness check
  const isModelConnected = recognitionMode === 'model' || recognitionMode === 'demo';

  // Match evaluation: stable recognized letter matches current practice target
  const isMatch = isModelConnected && currentLetter === targetLetter && stabilityStatus === 'Stable';

  // Single-scoring per question rule
  useEffect(() => {
    if (isMatch && !isQuestionScored) {
      setIsQuestionScored(true);
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
    }
  }, [isMatch, isQuestionScored]);

  // Advance to next question
  const handleNextLetter = () => {
    if (questionIndex >= totalQuestions) {
      setIsSessionComplete(true);
      return;
    }

    const remaining = ISL_ALPHABET.map(item => item.letter).filter(l => l !== targetLetter);
    const randomIndex = Math.floor(Math.random() * remaining.length);
    const nextTarget = remaining[randomIndex];

    // Reset scored flag and advance target (ensuring previous letter does not score new target)
    setIsQuestionScored(false);
    setTargetLetter(nextTarget);
    setQuestionIndex(prev => prev + 1);
  };

  // Restart complete session
  const handleRestartSession = () => {
    setQuestionIndex(1);
    setCorrectCount(0);
    setStreak(0);
    setIsQuestionScored(false);
    setIsSessionComplete(false);
    
    const randomIndex = Math.floor(Math.random() * ISL_ALPHABET.length);
    setTargetLetter(ISL_ALPHABET[randomIndex].letter);
  };

  const accuracy = questionIndex > 0 ? Math.round((correctCount / questionIndex) * 100) : 0;
  const activeSignData = ISL_ALPHABET.find(item => item.letter === targetLetter) || ISL_ALPHABET[0];

  return (
    <div className="py-10 md:py-16 bg-[#FAF8F5] min-h-screen border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#E6E1DA] gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-2">
              <Target className="w-4 h-4" />
              Webcam Practice Session
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] tracking-tight">
              Practice ISL
            </h1>
            <p className="mt-2 text-base text-[#475569] max-w-2xl font-normal">
              Build confidence with the ISL alphabet, one gesture at a time.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-white p-1 border border-[#E6E1DA] rounded-xl shadow-xs">
              <button
                onClick={() => setRecognitionMode('model')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  recognitionMode === 'model'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Live AI</span>
              </button>
              <button
                onClick={() => setRecognitionMode('demo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  recognitionMode === 'demo'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <span>Demo</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('/learn')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E6E1DA] hover:bg-[#F3EFEA] text-[#0F172A] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#64748B]" />
              <span>Exit Practice</span>
            </button>
          </div>
        </div>

        {/* PRACTICE COMPLETE SUMMARY SCREEN */}
        {isSessionComplete ? (
          <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-[#0D9488]/10 text-[#0F766E] border border-[#0D9488]/30 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-[#0D9488]" />
            </div>

            <h2 className="text-3xl font-extrabold text-[#0F172A] mb-2">
              Practice Session Complete!
            </h2>
            <p className="text-sm text-[#475569] mb-8">
              Great effort practicing the ISL alphabet gestures using your webcam stream.
            </p>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-[#FAF8F5] border border-[#E6E1DA] rounded-2xl mb-8">
              <div>
                <span className="text-xs text-[#64748B] font-semibold block uppercase">Final Score</span>
                <span className="text-2xl font-black text-[#0F172A]">{correctCount} / {totalQuestions}</span>
              </div>
              <div>
                <span className="text-xs text-[#64748B] font-semibold block uppercase">Accuracy</span>
                <span className="text-2xl font-black text-[#0D9488] font-mono">{accuracy}%</span>
              </div>
              <div>
                <span className="text-xs text-[#64748B] font-semibold block uppercase">Best Streak</span>
                <span className="text-2xl font-black text-amber-600">{streak}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleRestartSession}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#0D9488]" />
                <span>Start New Practice Session</span>
              </button>

              <button
                onClick={() => onNavigate('/learn')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-[#E6E1DA] hover:bg-[#FAF8F5] text-[#0F172A] px-6 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                <span>Explore Alphabet Guide</span>
                <ArrowRight className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 2. Progress Bar & Session Metrics */}
            <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 mb-8 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
              
              {/* Question Counter & Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A] mb-2">
                  <span>QUESTION {questionIndex} OF {totalQuestions}</span>
                  <span className="text-[#0D9488] font-mono">{Math.round((questionIndex / totalQuestions) * 100)}%</span>
                </div>
                <div className="w-full bg-[#E6E1DA]/60 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#0D9488] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Correct Answers */}
              <div className="flex items-center gap-3 p-3.5 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-[#0D9488]/10 text-[#0F766E] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Correct Answers</span>
                  <span className="text-base font-extrabold text-[#0F172A]">{correctCount} / {questionIndex}</span>
                </div>
              </div>

              {/* Accuracy */}
              <div className="flex items-center gap-3 p-3.5 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-[#0F172A] text-white flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Accuracy</span>
                  <span className="text-base font-extrabold text-[#0F172A] font-mono">{accuracy}%</span>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-3 p-3.5 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Current Streak</span>
                  <span className="text-base font-extrabold text-[#0F172A]">{streak} Signs</span>
                </div>
              </div>

            </div>

            {/* 3. Main Practice Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
              
              {/* LEFT: Webcam Panel (7 cols) */}
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
                <div className="relative bg-[#0F172A] min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-6 text-white overflow-hidden">
                  
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      isCameraActive ? 'opacity-100 scale-x-[-1]' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  {!isCameraActive && (
                    <div className="flex flex-col items-center justify-center text-center p-6 z-10">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
                        <Camera className="w-8 h-8 text-[#0D9488]" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-100 mb-1">Webcam Stream Offline</h3>
                      <p className="text-xs text-slate-400 max-w-sm mb-6">
                        Click "Start Camera" above to enable your video stream for live gesture practice.
                      </p>
                      <button
                        onClick={startCamera}
                        className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Enable Webcam Stream
                      </button>
                    </div>
                  )}

                  {/* Bounding Box Overlay */}
                  {isCameraActive && (
                    <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-[#0D9488]/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4 z-20">
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-[#0D9488]"></div>
                        <div className="w-4 h-4 border-t-2 border-r-2 border-[#0D9488]"></div>
                      </div>
                      
                      <div className="self-center bg-[#0F172A]/90 backdrop-blur border border-[#0D9488]/40 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                        {isModelLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D9488]" />
                            <span>Loading AI Model...</span>
                          </>
                        ) : recognitionMode === 'model' ? (
                          isHandDetected ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping"></span>
                              <span>Target: Form '{targetLetter}' Sign</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                              <span className="text-amber-300">Position Hand in Frame</span>
                            </>
                          )
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping"></span>
                            <span>Target: Form '{targetLetter}' (Demo)</span>
                          </>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-b-2 border-l-2 border-[#0D9488]"></div>
                        <div className="w-4 h-4 border-b-2 border-r-2 border-[#0D9488]"></div>
                      </div>
                    </div>
                  )}

                  {(cameraError || modelError) && (
                    <div className="absolute bottom-4 left-4 right-4 bg-amber-900/90 text-amber-200 px-3 py-2 rounded-lg text-xs border border-amber-700 z-30">
                      {cameraError || modelError}
                    </div>
                  )}

                </div>

                {/* Real-time Model Status Banner */}
                <div className="p-4 bg-[#FAF8F5] border-t border-[#E6E1DA] text-xs">
                  {recognitionMode === 'model' ? (
                    <div className="flex items-center justify-between text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>
                          <strong className="font-bold">Real-Time AI Active:</strong> MediaPipe + TensorFlow.js MLP
                        </span>
                      </div>
                      <span className="text-[#0D9488] font-mono font-semibold">
                        {isHandDetected ? `Detected: '${currentLetter}' (${confidence}%)` : 'Awaiting Hand Input'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                          Demo Letter Selector (Simulate Input)
                        </span>
                        <span className="text-[11px] text-[#0D9488] font-bold">Click to trigger gesture</span>
                      </div>
                      <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-1">
                        {ISL_ALPHABET.map((item) => (
                          <button
                            key={item.letter}
                            onClick={() => selectDemoLetter(item.letter)}
                            className={`h-7 rounded text-xs font-bold transition-all cursor-pointer ${
                              currentLetter === item.letter
                                ? 'bg-[#0F172A] text-white ring-2 ring-[#0D9488]'
                                : 'bg-white text-[#334155] border border-[#E6E1DA] hover:border-[#0D9488]'
                            }`}
                          >
                            {item.letter}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT: Target & Feedback Panel (5 cols) */}
              <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[460px]">
                
                <div>
                  <div className="pb-4 border-b border-[#E6E1DA] mb-6 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      SHOW THIS SIGN
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                      recognitionMode === 'model'
                        ? 'bg-[#0D9488]/10 text-[#0F766E] border-[#0D9488]/30'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {recognitionMode === 'model' ? 'Live AI Mode' : 'Demo Mode'}
                    </span>
                  </div>

                  {/* Target Prompt Card */}
                  <div className="flex flex-col items-center justify-center p-6 bg-[#FAF8F5] border border-[#E6E1DA] rounded-2xl mb-6 text-center">
                    
                    <div className="w-28 h-28 rounded-2xl bg-[#0F172A] text-[#FAF8F5] flex items-center justify-center border-4 border-[#0D9488] shadow-md mb-3">
                      <span className="text-6xl font-black">{targetLetter}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-[#0F172A] mb-1">
                      Make: <span className="text-[#0D9488]">{targetLetter}</span>
                    </h3>
                    
                    <p className="text-xs text-[#64748B] max-w-xs leading-relaxed">
                      {activeSignData.handForm}
                    </p>

                  </div>

                  {/* Match Feedback Badge */}
                  <div className="p-4 rounded-xl border mb-6 transition-all duration-300">
                    {isMatch ? (
                      <div className="flex items-center gap-3 bg-[#0D9488]/10 text-[#0F766E] border border-[#0D9488]/30 p-4 rounded-xl">
                        <CheckCircle2 className="w-6 h-6 text-[#0D9488] shrink-0" />
                        <div>
                          <span className="text-sm font-bold block">Correct Match Detected!</span>
                          <span className="text-xs font-medium">Model recognized '{currentLetter}' ({confidence}% confidence)</span>
                        </div>
                      </div>
                    ) : isHandDetected ? (
                      <div className="flex items-center gap-3 bg-amber-50 text-amber-800 border border-amber-200 p-4 rounded-xl">
                        <XCircle className="w-6 h-6 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-sm font-bold block text-[#0F172A]">Current Sign: '{currentLetter}'</span>
                          <span className="text-xs font-medium">
                            {stabilityStatus === 'Stable'
                              ? `Detected '${currentLetter}' (${confidence}%) • Adjust hand to '${targetLetter}'`
                              : `Detecting posture for '${targetLetter}'...`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-[#FAF8F5] text-[#475569] border border-[#E6E1DA] p-4 rounded-xl">
                        <Camera className="w-6 h-6 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-sm font-bold block text-[#0F172A]">Awaiting Hand Gesture</span>
                          <span className="text-xs font-medium">Show '{targetLetter}' to the camera</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Session Action Controls */}
                <div className="space-y-3 pt-4 border-t border-[#E6E1DA]">
                  <button
                    onClick={handleNextLetter}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{questionIndex < totalQuestions ? 'Next Letter' : 'Finish Practice'}</span>
                    <ArrowRight className="w-4 h-4 text-[#0D9488]" />
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleRestartSession}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-[#E6E1DA] hover:bg-[#FAF8F5] text-[#475569] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>

                    <button
                      onClick={() => onNavigate('/learn')}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-[#E6E1DA] hover:bg-[#FAF8F5] text-[#475569] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Exit</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
};
