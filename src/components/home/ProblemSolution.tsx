import React from 'react';
import { XCircle, CheckCircle2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export const ProblemSolution: React.FC = () => {
  return (
    <section id="problem-solution" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-3">
            <Sparkles className="w-4 h-4" />
            Breaking Accessibility Barriers
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight mb-4">
            From Communication Friction to Fluid Understanding
          </h2>
          <p className="text-base text-[#475569] leading-relaxed">
            Over 18 million Deaf and Hard-of-Hearing individuals in India face daily interaction challenges due to a scarcity of trained ISL interpreters. ISL CONNECT provides a lightweight, real-time computer vision alternative.
          </p>
        </div>

        {/* Visual Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: The Problem Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-8 shadow-xs relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldAlert className="w-4 h-4" />
              Traditional Challenge
            </div>

            <h3 className="text-2xl font-bold text-[#0F172A] mb-4">
              Communication Silence & Friction
            </h3>

            <ul className="space-y-4 text-sm text-[#475569]">
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Interpreter Shortage:</strong> Millions of ISL signers have restricted access to professional interpreters in healthcare, banking, and public offices.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Sluggish Text Notes:</strong> Typing or writing notes on paper slows down natural conversational pacing and causes misunderstandings.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">High Hardware Barrier:</strong> Traditional solutions often require specialized motion gloves or costly sensors.</span>
              </li>
            </ul>
          </div>

          {/* Center Connector Indicator (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center my-2 lg:my-0">
            <div className="w-12 h-12 rounded-full bg-[#0F172A] text-[#FAF8F5] flex items-center justify-center shadow-md">
              <ArrowRight className="w-6 h-6 text-[#0D9488] rotate-90 lg:rotate-0" />
            </div>
            <span className="text-xs font-bold text-[#0D9488] tracking-wider uppercase mt-2">
              The Bridge
            </span>
          </div>

          {/* Right: The Solution Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#FFFFFF] border-2 border-[#0D9488] rounded-2xl p-8 shadow-sm relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0D9488]/10 text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4" />
              ISL CONNECT Vision Solution
            </div>

            <h3 className="text-2xl font-bold text-[#0F172A] mb-4">
              Real-Time Vision & Voice Bridge
            </h3>

            <ul className="space-y-4 text-sm text-[#334155]">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Standard Webcam AI:</strong> Runs directly inside standard modern web browsers using existing laptop or phone webcams.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Live Finger Recognition:</strong> Classifies 26 ISL alphabet gestures (A–Z) with sub-second latency and visual feedback.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Immediate Text & Voice:</strong> Automatically compiles letters into words and reads them aloud via integrated Web Speech synthesis.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};
