import React, { useState } from 'react';
import { Camera, Cpu, Activity, Volume2, ChevronRight } from 'lucide-react';

export const RecognitionDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: '1. RGB Video Frame Capture',
      subtitle: 'In-browser webcam video stream sampling',
      icon: Camera,
      metrics: '30 FPS | 720p Resolution | Zero Cloud Upload',
      description: 'The user’s standard laptop or mobile camera captures live hand movements. Frames are processed locally on device using client-side JavaScript.',
      previewCode: `const videoFrame = webcamRef.current.getFrame();\n// Local canvas frame buffer ready`
    },
    {
      id: 2,
      title: '2. Hand Keypoint Extraction',
      subtitle: '21 3D Coordinate Joint Tracking',
      icon: Activity,
      metrics: '21 Keypoints | (X, Y, Z) Joint Vectors',
      description: 'The vision pipeline extracts 21 precise 3D landmark coordinates mapping fingertips, knuckles, wrist, and thumb pivot points with high accuracy.',
      previewCode: `const landmarks = await handDetector.estimateHands(frame);\n// Extracted 21 joint landmark coordinates`
    },
    {
      id: 3,
      title: '3. Spatial Pattern Classifier',
      subtitle: 'ISL A–Z Normalized Gesture Matching',
      icon: Cpu,
      metrics: '98.4% Mean Model Accuracy | 26 Classes',
      description: 'Extracted keypoint spatial distances are evaluated against normalized ISL alphabet representations to identify the exact sign gesture.',
      previewCode: `const predictedLetter = classifyISLSign(landmarks);\n// Match: 'H' (Confidence: 0.984)`
    },
    {
      id: 4,
      title: '4. Text & Speech Synthesis',
      subtitle: 'Buffer accumulation and voice output',
      icon: Volume2,
      metrics: 'Real-time Buffer | SpeechSynthesis API',
      description: 'Predicted letters are appended to the sentence buffer and converted into audible speech upon user activation.',
      previewCode: `textBuffer += predictedLetter;\nspeechSynthesis.speak(new SpeechSynthesisUtterance(textBuffer));`
    }
  ];

  const currentStepData = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <section id="recognition-demo" className="py-20 md:py-28 bg-[#FFFFFF] border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-3">
            AI Vision Pipeline Inspection
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
            See the recognition happen frame by frame.
          </h2>
          <p className="mt-3 text-base text-[#475569]">
            Explore how raw webcam frames are converted into structured keypoints, matched to ISL alphabet signs, and rendered as text and audio.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === activeStep;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md'
                    : 'bg-[#FAF8F5] text-[#334155] border-[#E6E1DA] hover:border-[#0D9488]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-[#0D9488] text-white' : 'bg-[#E6E1DA]/60 text-[#0F172A]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-tight">{step.title}</h4>
                    <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{step.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#0D9488]' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Step Inspector Card */}
        <div className="bg-[#FAF8F5] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Details */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0D9488]/10 text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-4">
              Pipeline Stage {currentStepData.id} of 4
            </div>

            <h3 className="text-2xl font-bold text-[#0F172A] mb-3">
              {currentStepData.title}
            </h3>

            <p className="text-base text-[#475569] leading-relaxed mb-6">
              {currentStepData.description}
            </p>

            <div className="p-4 bg-white border border-[#E6E1DA] rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">Performance Metric</span>
              <span className="text-xs font-semibold text-[#0D9488] font-mono">{currentStepData.metrics}</span>
            </div>
          </div>

          {/* Right Code/Pipeline Simulation */}
          <div className="lg:col-span-5 bg-[#0F172A] text-slate-100 p-6 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]"></span>
                isl_engine_pipeline.ts
              </span>
              <span>Stage {currentStepData.id}</span>
            </div>

            <pre className="text-emerald-400 leading-relaxed">
              <code>{currentStepData.previewCode}</code>
            </pre>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: RUNNING</span>
              <span className="text-emerald-400 font-bold">Latency: &lt; 15ms</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
