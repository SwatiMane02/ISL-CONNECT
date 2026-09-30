import React, { useState } from 'react';
import { ISL_ALPHABET, type ISLSign } from '../../data/islAlphabet';
import { Search, Info, Sparkles, Volume2 } from 'lucide-react';

interface AlphabetGridProps {
  onSelectLetterForDemo?: (letter: string) => void;
}

export const AlphabetGrid: React.FC<AlphabetGridProps> = ({ onSelectLetterForDemo }) => {
  const [selectedLetter, setSelectedLetter] = useState<ISLSign>(ISL_ALPHABET[0]);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Vowel' | 'Consonant'>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAlphabet = ISL_ALPHABET.filter(item => {
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesSearch = item.letter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePronounceLetter = (letter: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Letter ${letter}`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <section id="alphabet-grid" className="py-20 md:py-28 bg-[#FFFFFF] border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-3">
              ISL Finger Spelling Dictionary
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              ISL A–Z Alphabet Preview
            </h2>
          </div>
          <p className="mt-3 md:mt-0 text-base text-[#475569] max-w-lg">
            Explore the 26 Indian Sign Language alphabet gestures supported by the recognition engine. Select any sign to view hand posture instructions.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-[#FAF8F5] p-4 rounded-xl border border-[#E6E1DA]">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2">
            {(['All', 'Vowel', 'Consonant'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white text-[#475569] border border-[#E6E1DA] hover:border-[#0D9488]'
                }`}
              >
                {cat === 'All' ? 'All 26 Letters' : `${cat}s`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search letter (e.g. A, H)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E6E1DA] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
            />
          </div>

        </div>

        {/* Grid & Selected Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* A-Z Grid (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-4 sm:grid-cols-6 gap-3">
            {filteredAlphabet.map((item) => {
              const isSelected = selectedLetter.letter === item.letter;
              return (
                <button
                  key={item.letter}
                  onClick={() => setSelectedLetter(item)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#0F172A] text-white border-[#0F172A] ring-2 ring-[#0D9488] shadow-md scale-105 z-10'
                      : 'bg-[#FAF8F5] text-[#0F172A] border-[#E6E1DA] hover:border-[#0D9488] hover:bg-white'
                  }`}
                >
                  <span className="text-3xl font-black tracking-tight">{item.letter}</span>
                  <span className={`text-[10px] font-semibold mt-1 uppercase tracking-wider ${
                    isSelected ? 'text-[#0D9488]' : 'text-[#64748B]'
                  }`}>
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Letter Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 sticky top-24">
            
            <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0F172A] text-[#FAF8F5] flex items-center justify-center border-2 border-[#0D9488] shadow">
                  <span className="text-4xl font-black">{selectedLetter.letter}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">{selectedLetter.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#0F766E] font-bold">
                      {selectedLetter.category}
                    </span>
                    <span className="text-xs text-[#64748B]">Complexity: {selectedLetter.difficulty}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePronounceLetter(selectedLetter.letter)}
                className="p-2.5 rounded-lg bg-white border border-[#E6E1DA] text-[#0F172A] hover:bg-[#F3EFEA] transition-colors cursor-pointer"
                title="Pronounce letter"
              >
                <Volume2 className="w-5 h-5 text-[#0D9488]" />
              </button>
            </div>

            {/* Hand Form Guidance */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">Hand Posture Shape</h4>
                <p className="text-sm font-semibold text-[#0F172A]">{selectedLetter.handForm}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">Detailed Description</h4>
                <p className="text-sm text-[#475569] leading-relaxed">{selectedLetter.description}</p>
              </div>

              <div className="p-3.5 bg-white border border-[#E6E1DA] rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <p className="text-xs text-[#334155] leading-relaxed">
                  <strong className="text-[#0F172A]">Recognition Tip:</strong> {selectedLetter.tips}
                </p>
              </div>
            </div>

            {/* CTA */}
            {onSelectLetterForDemo && (
              <button
                onClick={() => onSelectLetterForDemo(selectedLetter.letter)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
                <span>Simulate '{selectedLetter.letter}' in Demo</span>
              </button>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
