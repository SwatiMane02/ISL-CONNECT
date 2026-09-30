import React from 'react';
import { Camera, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string, sectionId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#FAF8F5] border-t border-[#E6E1DA] py-12 text-[#475569]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-[#E6E1DA]">
          
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-[#FAF8F5]">
              <Camera className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div>
              <span className="font-bold text-base text-[#0F172A]">ISL CONNECT</span>
              <p className="text-xs text-[#64748B]">Accessible Indian Sign Language Recognition</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
            <button onClick={() => onNavigate('/', 'hero')} className="hover:text-[#0F172A] transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => onNavigate('/live')} className="hover:text-[#0F172A] transition-colors cursor-pointer">
              Live Recognition
            </button>
            <button onClick={() => onNavigate('/learn')} className="hover:text-[#0F172A] transition-colors cursor-pointer">
              Learn ISL A–Z
            </button>
            <button onClick={() => onNavigate('/practice')} className="hover:text-[#0F172A] transition-colors cursor-pointer">
              Practice
            </button>
            <button onClick={() => onNavigate('/', 'roadmap')} className="hover:text-[#0F172A] transition-colors cursor-pointer">
              Roadmap
            </button>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} ISL CONNECT. Designed for accessibility and inclusion.</p>
          
          <div className="flex items-center gap-2">
            <span>Built with care for Indian Sign Language accessibility</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>

      </div>
    </footer>
  );
};
