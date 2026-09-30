import React from 'react';
import { ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react';

interface CTASectionProps {
  onTryDemo: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onTryDemo }) => {
  return (
    <section className="py-20 md:py-28 bg-[#0F172A] text-[#FAF8F5] relative overflow-hidden">
      
      {/* Background Accent Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E293B] border border-slate-700 text-xs font-semibold text-[#0D9488] mb-8">
          <Sparkles className="w-4 h-4" />
          Accessibility First Computer Vision
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Ready to experience <br />
          <span className="font-serif-editorial italic font-normal text-[#0D9488]">
            real-time sign interpretation?
          </span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
          Try the live ISL A–Z alphabet recognition demo directly in your browser. No downloads, installations, or registration required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#0D9488] hover:bg-[#0F766E] text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <span>Try Live Demo Now</span>
            <ArrowUpRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800 pt-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            <span>Private & Local Processing</span>
          </div>
          <div className="hidden sm:block text-slate-600">•</div>
          <div className="hidden sm:block">Scope: ISL Finger Spelling (A–Z)</div>
        </div>

      </div>
    </section>
  );
};
