import React from 'react';

interface GesturePlaceholderSvgProps {
  letter: string;
  category: string;
  className?: string;
}

export const GesturePlaceholderSvg: React.FC<GesturePlaceholderSvgProps> = ({
  letter,
  category,
  className = "w-full h-32"
}) => {
  return (
    <div className={`relative flex items-center justify-center bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl overflow-hidden p-3 select-none ${className}`}>
      
      {/* Background SVG Grid & Vector Hand Shape */}
      <svg className="w-full h-full text-[#0D9488]/20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Decorative Grid Lines */}
        <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="60" cy="60" r="32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="10" y1="60" x2="110" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="60" y1="10" x2="60" y2="110" stroke="currentColor" strokeWidth="1" opacity="0.4" />

        {/* Stylized Hand Keypoint Joint Nodes */}
        <circle cx="60" cy="40" r="4" className="fill-[#0D9488]" />
        <circle cx="45" cy="50" r="3.5" className="fill-[#0D9488]" />
        <circle cx="75" cy="50" r="3.5" className="fill-[#0D9488]" />
        <circle cx="60" cy="70" r="4" className="fill-[#0F172A]" />
        <circle cx="40" cy="75" r="3" className="fill-[#0F172A]" />
        <circle cx="80" cy="75" r="3" className="fill-[#0F172A]" />

        {/* Skeleton Connecting Lines */}
        <path d="M60 70 L60 40 M60 70 L45 50 M60 70 L75 50 M60 70 L40 75 M60 70 L80 75" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>

      {/* Center Letter Watermark Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-black text-[#0F172A] tracking-tight">{letter}</span>
        <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider mt-0.5">
          {category} Gesture
        </span>
      </div>

    </div>
  );
};
