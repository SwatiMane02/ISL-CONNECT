import React, { useState } from 'react';
import { Camera, Sparkles, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string, sectionId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', id: 'hero' },
    { name: 'Live Recognition', path: '/live', id: 'live' },
    { name: 'Learn ISL', path: '/learn', id: 'learn' },
    { name: 'Practice', path: '/practice', id: 'practice' },
    { name: 'AI Insights', path: '/', id: 'recognition-demo' },
    { name: 'Organizations', path: '/', id: 'problem-solution' },
    { name: 'About', path: '/', id: 'roadmap' }
  ];

  const handleNavClick = (path: string, sectionId?: string) => {
    onNavigate(path, sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6E1DA] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('/')}
          className="cursor-pointer flex items-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center text-[#FAF8F5] transition-transform group-hover:scale-105">
            <Camera className="w-5 h-5 text-[#0D9488]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-[#0F172A]">ISL CONNECT</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                A–Z BETA
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] -mt-1 tracking-wide font-medium">Accessible Sign Vision</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-7">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path && (link.path !== '/' || link.id === 'hero');
            return (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.path, link.id)}
                className={`text-sm font-medium transition-colors py-1 cursor-pointer ${
                  isActive 
                    ? 'text-[#0D9488] font-bold border-b-2 border-[#0D9488]' 
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* Primary CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => handleNavClick('/live')}
            className="inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-[#FAF8F5] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <span>Live Recognition</span>
            <ArrowUpRight className="w-4 h-4 text-[#0D9488]" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#0F172A] hover:bg-[#E6E1DA]/50 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E6E1DA] bg-[#FAF8F5] px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.path, link.id)}
                className="text-left px-3 py-2 text-base font-medium text-[#334155] hover:bg-[#F3EFEA] rounded-md transition-colors"
              >
                {link.name}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-[#E6E1DA]">
            <button
              onClick={() => handleNavClick('/live')}
              className="w-full flex items-center justify-center gap-2 bg-[#0F172A] text-[#FAF8F5] px-4 py-3 rounded-lg font-semibold text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#0D9488]" />
              <span>Launch Live Recognition</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
