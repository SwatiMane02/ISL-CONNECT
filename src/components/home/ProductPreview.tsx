import React, { useState, useEffect } from 'react';
import { Volume2, RotateCcw, Camera, Sparkles, CornerDownLeft, Info } from 'lucide-react';
import { ISL_ALPHABET } from '../../data/islAlphabet';

export const ProductPreview: React.FC = () => {
  const [activeLetter, setActiveLetter] = useState<string>('H');
  const [textBuffer, setTextBuffer] = useState<string>('HELLO');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoPlayDemo, setAutoPlayDemo] = useState<boolean>(true);
  const [confidence, setConfidence] = useState<number>(98.6);

  // Cycle demo letters automatically if autoPlay is active
  useEffect(() => {
    if (!autoPlayDemo) return;
    const demoSequence = ['H', 'E', 'L', 'L', 'O'];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % demoSequence.length;
      const nextLetter = demoSequence[index];
      setActiveLetter(nextLetter);
      setConfidence(Number((96.5 + Math.random() * 3).toFixed(1)));
    }, 2200);

    return () => clearInterval(interval);
  }, [autoPlayDemo]);

  const currentSignInfo = ISL_ALPHABET.find(item => item.letter === activeLetter) || ISL_ALPHABET[0];

  const handleSelectLetter = (letter: string) => {
    setAutoPlayDemo(false);
    setActiveLetter(letter);
    setConfidence(Number((96.5 + Math.random() * 3).toFixed(1)));
  };

  const handleAppendLetter = (letter: string) => {
    setTextBuffer(prev => prev + letter);
  };

  const handleClearText = () => {
    setTextBuffer('');
  };

  const handleAddSpace = () => {
    setTextBuffer(prev => prev + ' ');
  };

  const handleSpeakText = () => {
    if (!textBuffer.trim()) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textBuffer);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback simulation
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  return (
    <section id="live-demo" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-3">
              <Sparkles className="w-4 h-4" />
              Interactive Recognition Simulation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              Real-time Vision → Text → Speech
            </h2>
          </div>
          <p className="mt-3 text-base text-[#475569] max-w-xl">
            Experience how ISL CONNECT captures hand keypoints, predicts the ISL letter, builds text, and speaks aloud.
          </p>
        </div>

        {/* Realistic Product Interface Box */}
        <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Simulated Webcam Viewfinder (7 cols) */}
          <div className="lg:col-span-7 bg-[#0F172A] p-6 text-white flex flex-col justify-between relative min-h-[420px]">
            
            {/* Camera Viewfinder Header */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5 bg-[#1E293B]/90 backdrop-blur px-3 py-1.5 rounded-md border border-slate-700/60">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-xs font-medium text-slate-200">Webcam Stream: Active</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAutoPlayDemo(!autoPlayDemo)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    autoPlayDemo ? 'bg-[#0D9488] text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {autoPlayDemo ? 'Auto Simulation: ON' : 'Auto Simulation: OFF'}
                </button>
              </div>
            </div>

            {/* Central Simulated Hand Tracking Box */}
            <div className="my-auto py-8 flex flex-col items-center justify-center relative">
              
              {/* Simulated Hand Keypoint Frame */}
              <div className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-[#0D9488] rounded-xl flex flex-col items-center justify-center relative bg-slate-900/60 p-4 transition-all">
                
                {/* Simulated Keypoint Dots & Skeleton Overlay */}
                <div className="absolute inset-4 border border-[#0D9488]/40 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#0D9488] absolute top-6 left-12 animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-[#0D9488] absolute top-12 left-24 animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-[#0D9488] absolute top-8 right-16 animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-[#0D9488] absolute bottom-12 right-20 animate-pulse"></div>
                </div>

                {/* Big Letter Card Representation */}
                <div className="w-28 h-28 rounded-2xl bg-[#0F172A] border-2 border-[#0D9488] flex items-center justify-center shadow-lg mb-3">
                  <span className="text-6xl font-extrabold text-[#FAF8F5] tracking-tight">{activeLetter}</span>
                </div>

                {/* Recognition Badge */}
                <div className="bg-[#0D9488] text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-wide shadow">
                  Sign Detected: {activeLetter} ({confidence}%)
                </div>
              </div>

              {/* Hand Form Description Banner */}
              <div className="mt-4 text-center max-w-sm">
                <span className="text-xs text-slate-400 font-medium block">
                  Gesture Shape: {currentSignInfo.handForm}
                </span>
              </div>
            </div>

            {/* Viewfinder Footer Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800 z-10">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#0D9488]" />
                <span>Camera 720p HD @ 30 FPS</span>
              </div>
              <div>Scope: ISL A–Z</div>
            </div>
          </div>

          {/* Right Column: Output Buffer & Control Panel (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-[#FFFFFF]">
            
            <div>
              {/* Output Label */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Accumulated Text Buffer</span>
                <span className="text-xs font-medium text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded">
                  {textBuffer.length} Characters
                </span>
              </div>

              {/* Spelled Sentence Screen */}
              <div className="min-h-[110px] p-4 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl flex items-center justify-between mb-4">
                <span className="text-3xl font-extrabold tracking-widest text-[#0F172A] break-all font-mono">
                  {textBuffer || <span className="text-[#94A3B8] font-normal italic text-lg">Click signs to spell...</span>}
                </span>
                
                {textBuffer && (
                  <span className="w-2.5 h-6 bg-[#0D9488] animate-pulse ml-2"></span>
                )}
              </div>

              {/* Speech Output Action */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleSpeakText}
                  disabled={!textBuffer.trim()}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    isSpeaking 
                      ? 'bg-[#0D9488] text-white'
                      : textBuffer.trim() 
                        ? 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSpeaking ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Volume2 className="w-4 h-4 text-[#0D9488]" />}
                  <span>{isSpeaking ? 'Speaking...' : 'Speak Audio'}</span>
                </button>

                <button
                  onClick={() => handleAppendLetter(activeLetter)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#F3EFEA] hover:bg-[#E6E1DA] text-[#0F172A] rounded-xl font-semibold text-sm transition-colors border border-[#CBD5E1] cursor-pointer"
                >
                  <CornerDownLeft className="w-4 h-4 text-[#0D9488]" />
                  <span>Append '{activeLetter}'</span>
                </button>
              </div>

              {/* Buffer Quick Utilities */}
              <div className="flex items-center gap-2 mb-8">
                <button
                  onClick={handleAddSpace}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#FFFFFF] border border-[#E6E1DA] text-[#475569] rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  + Add Space
                </button>
                <button
                  onClick={handleClearText}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#FFFFFF] border border-[#E6E1DA] text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Text
                </button>
              </div>

              {/* Interactive Alphabet Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Simulate ISL Sign Input</span>
                  <span className="text-xs text-[#64748B]">Click any letter</span>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl">
                  {ISL_ALPHABET.map((item) => (
                    <button
                      key={item.letter}
                      onClick={() => handleSelectLetter(item.letter)}
                      className={`h-9 rounded-md font-bold text-sm transition-all cursor-pointer ${
                        activeLetter === item.letter
                          ? 'bg-[#0F172A] text-[#FAF8F5] ring-2 ring-[#0D9488]'
                          : 'bg-[#FFFFFF] text-[#334155] border border-[#E6E1DA] hover:border-[#0D9488]'
                      }`}
                    >
                      {item.letter}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Scope Notice Footer */}
            <div className="mt-6 pt-4 border-t border-[#E6E1DA] flex items-center gap-2 text-xs text-[#64748B]">
              <Info className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>Current version is trained on 26 ISL finger spelling gestures (A–Z).</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
