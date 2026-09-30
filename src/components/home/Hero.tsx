import React from 'react';
import { ArrowRight, Play, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onExploreDemo: () => void;
  onExploreAlphabet: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreDemo, onExploreAlphabet }) => {
  return (
    <section id="hero" className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden editorial-grid border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Scope Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E6E1DA] shadow-xs mb-8">
          <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wide text-[#334155] uppercase">
            Product Scope: ISL Alphabet Recognition (A–Z)
          </span>
        </div>

        {/* Main Editorial Headline */}
        <div className="max-w-4xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#0F172A] tracking-tight leading-[1.08] mb-6">
            Speak through <br className="hidden sm:inline" />
            <span className="font-serif-editorial italic font-normal text-[#0F766E] border-b-2 border-[#0D9488]/30 pb-1">
              your signs.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#475569] leading-relaxed max-w-2xl mb-10 font-normal">
            ISL CONNECT bridges communication gaps by instantly interpreting Indian Sign Language (ISL) A–Z alphabet hand gestures into readable text and natural spoken voice in real time.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-14">
            <button
              onClick={onExploreDemo}
              className="inline-flex items-center justify-center gap-3 bg-[#0F172A] hover:bg-[#1E293B] text-[#FAF8F5] px-7 py-4 rounded-xl font-semibold text-base transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <Play className="w-5 h-5 text-[#0D9488] fill-[#0D9488]" />
              <span>Try Live Demo</span>
            </button>

            <button
              onClick={onExploreAlphabet}
              className="inline-flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-[#F3EFEA] text-[#0F172A] border border-[#CBD5E1] px-7 py-4 rounded-xl font-semibold text-base transition-all cursor-pointer"
            >
              <span>Explore A–Z Alphabet</span>
              <ArrowRight className="w-4 h-4 text-[#64748B]" />
            </button>
          </div>

          {/* Trust & Transparency Badges */}
          <div className="pt-8 border-t border-[#E6E1DA] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#64748B] font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>26 ISL Finger Alphabet Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>Real-Time Webcam Vision Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>100% In-Browser Privacy Protection</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
