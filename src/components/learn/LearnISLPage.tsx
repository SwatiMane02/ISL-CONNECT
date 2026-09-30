import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ISL_ALPHABET, type ISLSign } from '../../data/islAlphabet';
import { GesturePlaceholderSvg } from './GesturePlaceholderSvg';
import { Search, Sparkles, Volume2, ArrowRight, CheckCircle2, Info, BookOpen, HelpCircle, RotateCcw, Trophy, Check, X, AlertCircle } from 'lucide-react';

interface LearnISLPageProps {
  onNavigate: (path: string) => void;
}

const LOCAL_STORAGE_KEY = 'isl_connect_practiced_letters';

export const LearnISLPage: React.FC<LearnISLPageProps> = ({ onNavigate }) => {
  // Tab State: 'Explore' vs 'Quiz'
  const [activeTab, setActiveTab] = useState<'Explore' | 'Quiz'>('Explore');

  // Search & Filter State
  const [selectedLetter, setSelectedLetter] = useState<ISLSign>(ISL_ALPHABET[0]);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Vowel' | 'Consonant'>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Practiced Letters State (Persisted in localStorage)
  const [practicedLetters, setPracticedLetters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load practiced letters from localStorage', e);
    }
    return ['A', 'B', 'C', 'E', 'H', 'L', 'O']; // Default initial set
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(practicedLetters));
    } catch (e) {
      console.warn('Failed to save practiced letters to localStorage', e);
    }
  }, [practicedLetters]);

  // Toggle Practiced Status
  const togglePracticed = (letter: string) => {
    setPracticedLetters(prev => {
      if (prev.includes(letter)) {
        return prev.filter(l => l !== letter);
      } else {
        return [...prev, letter];
      }
    });
  };

  // Reset Progress Handler
  const handleResetProgress = () => {
    setPracticedLetters([]);
    setShowResetConfirm(false);
  };

  // Filtered Alphabet Data
  const filteredAlphabet = useMemo(() => {
    return ISL_ALPHABET.filter(item => {
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesSearch = item.letter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchTerm]);

  // Audio Pronunciation
  const handlePronounceLetter = (letter: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Letter ${letter}`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // =========================================================================
  // QUIZ MODE STATE & ENGINE
  // =========================================================================
  const [quizQuestionIndex, setQuizQuestionIndex] = useState<number>(1);
  const [quizTotalQuestions] = useState<number>(10);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizTarget, setQuizTarget] = useState<ISLSign>(ISL_ALPHABET[0]);
  const [quizChoices, setQuizChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isQuestionScored, setIsQuestionScored] = useState<boolean>(false);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);

  // Generate 4 Quiz Choices for a target letter
  const generateQuizChoices = useCallback((target: ISLSign) => {
    const choices = new Set<string>([target.letter]);
    const remainingLetters = ISL_ALPHABET.map(item => item.letter).filter(l => l !== target.letter);
    
    while (choices.size < 4 && remainingLetters.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingLetters.length);
      choices.add(remainingLetters[randomIndex]);
      remainingLetters.splice(randomIndex, 1);
    }

    return Array.from(choices).sort(() => Math.random() - 0.5);
  }, []);

  // Initialize new Quiz Question
  const startNextQuizQuestion = useCallback((nextIndex: number) => {
    if (nextIndex > quizTotalQuestions) {
      setIsQuizComplete(true);
      return;
    }

    const randomIndex = Math.floor(Math.random() * ISL_ALPHABET.length);
    const target = ISL_ALPHABET[randomIndex];

    setQuizTarget(target);
    setQuizChoices(generateQuizChoices(target));
    setSelectedChoice(null);
    setIsQuestionScored(false);
  }, [quizTotalQuestions, generateQuizChoices]);

  // Start or Reset Quiz
  const handleStartQuiz = () => {
    setQuizQuestionIndex(1);
    setQuizScore(0);
    setIsQuizComplete(false);
    startNextQuizQuestion(1);
  };

  // Handle Answer Choice Selection
  const handleSelectQuizChoice = (choiceLetter: string) => {
    if (selectedChoice !== null) return; // Prevent changing choice after selection
    
    setSelectedChoice(choiceLetter);
    if (choiceLetter === quizTarget.letter && !isQuestionScored) {
      setIsQuestionScored(true);
      setQuizScore(prev => prev + 1);
    }
  };

  // Handle Next Quiz Question
  const handleNextQuizQuestion = () => {
    const nextIndex = quizQuestionIndex + 1;
    setQuizQuestionIndex(nextIndex);
    startNextQuizQuestion(nextIndex);
  };

  // Initialize Quiz on first tab switch
  useEffect(() => {
    if (activeTab === 'Quiz' && quizChoices.length === 0) {
      handleStartQuiz();
    }
  }, [activeTab, quizChoices.length]);

  const progressPercentage = Math.round((practicedLetters.length / 26) * 100);
  const quizAccuracy = quizQuestionIndex > 0 ? Math.round((quizScore / (isQuizComplete ? quizTotalQuestions : quizQuestionIndex)) * 100) : 0;

  return (
    <div className="py-10 md:py-16 bg-[#FAF8F5] min-h-screen border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Header with Progress Indicator & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#E6E1DA] gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-2">
              <BookOpen className="w-4 h-4" />
              ISL Finger Spelling Guide
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] tracking-tight">
              Learn the ISL Alphabet
            </h1>
            <p className="mt-2 text-base text-[#475569] max-w-2xl font-normal">
              Explore the 26 Indian Sign Language alphabet gestures supported by ISL CONNECT.
            </p>
          </div>

          {/* Persistent Progress Card */}
          <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-4 sm:p-5 min-w-[260px] shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#0F172A] mb-2">
              <span>PRACTICED PROGRESS</span>
              <span className="text-[#0D9488] font-mono">{practicedLetters.length} / 26</span>
            </div>
            <div className="w-full bg-[#E6E1DA]/60 h-2.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-[#0D9488] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#64748B]">
              <span>{progressPercentage}% Complete</span>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#E6E1DA] rounded-2xl p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-[#0F172A]">Reset Learning Progress?</h3>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed mb-6">
                This will clear all {practicedLetters.length} practiced letters from your browser storage. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-[#FAF8F5] border border-[#E6E1DA] text-[#0F172A] rounded-xl text-xs font-semibold hover:bg-[#F3EFEA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetProgress}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Yes, Reset Progress
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Navigation Tabs */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setActiveTab('Explore')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'Explore'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'bg-white text-[#475569] border border-[#E6E1DA] hover:border-[#0D9488]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#0D9488]" />
            <span>Explore Alphabet (26 Letters)</span>
          </button>

          <button
            onClick={() => setActiveTab('Quiz')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'Quiz'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'bg-white text-[#475569] border border-[#E6E1DA] hover:border-[#0D9488]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-[#0D9488]" />
            <span>Alphabet Quiz Mode</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: EXPLORE ALPHABET VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'Explore' && (
          <>
            {/* Search + Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-[#FFFFFF] p-4 rounded-2xl border border-[#E6E1DA] shadow-xs">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2">
                {(['All', 'Vowel', 'Consonant'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#475569] border border-[#E6E1DA] hover:border-[#0D9488]'
                    }`}
                  >
                    {cat === 'All' ? 'All (26)' : cat === 'Vowel' ? 'Vowels (5)' : 'Consonants (21)'}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search letter (e.g. A, H)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0D9488]"
                />
              </div>

            </div>

            {/* Grid & Selected Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
              
              {/* A–Z Alphabet Grid (7 cols) */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredAlphabet.map((item) => {
                  const isSelected = selectedLetter.letter === item.letter;
                  const isPracticed = practicedLetters.includes(item.letter);

                  return (
                    <div
                      key={item.letter}
                      onClick={() => setSelectedLetter(item)}
                      className={`bg-[#FFFFFF] border rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer relative group shadow-xs ${
                        isSelected
                          ? 'border-[#0F172A] ring-2 ring-[#0D9488] shadow-md scale-[1.02] z-10'
                          : 'border-[#E6E1DA] hover:border-[#0D9488] hover:shadow'
                      }`}
                    >
                      {/* Card Top */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-black text-[#0F172A]">{item.letter}</span>
                        {isPracticed && (
                          <span className="text-[10px] font-bold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded flex items-center gap-1 border border-[#0D9488]/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Practiced
                          </span>
                        )}
                      </div>

                      {/* Gesture Placeholder Diagram */}
                      <GesturePlaceholderSvg 
                        letter={item.letter}
                        category={item.category}
                        className="w-full h-28 mb-3"
                      />

                      {/* Detail Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLetter(item);
                        }}
                        className="w-full py-2 bg-[#FAF8F5] group-hover:bg-[#0F172A] text-[#0F172A] group-hover:text-white rounded-xl text-xs font-bold transition-colors border border-[#E6E1DA] group-hover:border-[#0F172A] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>View Sign</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#0D9488]" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Selected Letter Detail Panel (5 cols) */}
              <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 sticky top-24 shadow-xs">
                
                {/* Detail Header */}
                <div className="flex items-center justify-between pb-6 border-b border-[#E6E1DA] mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#0F172A] text-[#FAF8F5] flex items-center justify-center border-2 border-[#0D9488] shadow">
                      <span className="text-4xl font-black">{selectedLetter.letter}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0F172A]">{selectedLetter.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2.5 py-0.5 rounded bg-[#0D9488]/10 text-[#0F766E] font-bold">
                          {selectedLetter.category}
                        </span>
                        <span className="text-xs text-[#64748B]">Complexity: {selectedLetter.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePronounceLetter(selectedLetter.letter)}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-[#0F172A] hover:bg-[#F3EFEA] transition-colors cursor-pointer"
                    title="Pronounce letter"
                  >
                    <Volume2 className="w-5 h-5 text-[#0D9488]" />
                  </button>
                </div>

                {/* Gesture Visual Diagram */}
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block mb-2">
                    Gesture Posture Diagram
                  </span>
                  <GesturePlaceholderSvg 
                    letter={selectedLetter.letter}
                    category={selectedLetter.category}
                    className="w-full h-40"
                  />
                </div>

                {/* "How to form this sign" Section */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      How to form this sign
                    </h4>
                    <p className="text-sm font-semibold text-[#0F172A]">{selectedLetter.handForm}</p>
                  </div>

                  <div>
                    <p className="text-sm text-[#475569] leading-relaxed">{selectedLetter.description}</p>
                  </div>

                  <div className="p-3.5 bg-[#FAF8F5] border border-[#E6E1DA] rounded-xl flex items-start gap-2.5 text-xs text-[#334155]">
                    <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#0F172A]">Postural Tip:</strong> {selectedLetter.tips}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => togglePracticed(selectedLetter.letter)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
                      practicedLetters.includes(selectedLetter.letter)
                        ? 'bg-[#0D9488]/10 text-[#0F766E] border-[#0D9488]/30'
                        : 'bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#0F172A] border-[#CBD5E1]'
                    }`}
                  >
                    {practicedLetters.includes(selectedLetter.letter) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                        <span>Practiced (Click to unmark)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#0D9488]" />
                        <span>Mark as Practiced</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onNavigate('/practice')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Practice with Webcam</span>
                    <ArrowRight className="w-4 h-4 text-[#0D9488]" />
                  </button>
                </div>

              </div>

            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALPHABET QUIZ MODE */}
        {/* ========================================================================= */}
        {activeTab === 'Quiz' && (
          <div className="max-w-3xl mx-auto">
            {isQuizComplete ? (
              /* Quiz Complete Summary Screen */
              <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-8 sm:p-12 text-center shadow-xs">
                <div className="w-20 h-20 rounded-3xl bg-[#0D9488]/10 text-[#0F766E] border border-[#0D9488]/30 flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-[#0D9488]" />
                </div>

                <h2 className="text-3xl font-extrabold text-[#0F172A] mb-2">
                  Alphabet Quiz Complete!
                </h2>
                <p className="text-sm text-[#475569] mb-8">
                  You evaluated all 10 ISL sign gesture questions.
                </p>

                <div className="grid grid-cols-2 gap-4 p-6 bg-[#FAF8F5] border border-[#E6E1DA] rounded-2xl mb-8 max-w-md mx-auto">
                  <div>
                    <span className="text-xs text-[#64748B] font-semibold block uppercase">Final Score</span>
                    <span className="text-3xl font-black text-[#0F172A]">{quizScore} / {quizTotalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B] font-semibold block uppercase">Accuracy</span>
                    <span className="text-3xl font-black text-[#0D9488] font-mono">{quizAccuracy}%</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleStartQuiz}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#0D9488]" />
                    <span>Retake Quiz</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('Explore')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-[#E6E1DA] hover:bg-[#FAF8F5] text-[#0F172A] px-6 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer"
                  >
                    <span>Back to Alphabet Guide</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Quiz Question Workspace */
              <div className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 shadow-xs">
                
                {/* Quiz Header & Progress */}
                <div className="flex items-center justify-between pb-6 border-b border-[#E6E1DA] mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                      ISL ALPHABET QUIZ
                    </span>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      Question {quizQuestionIndex} of {quizTotalQuestions}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[#64748B] font-semibold block">CURRENT SCORE</span>
                    <span className="text-lg font-black text-[#0D9488] font-mono">{quizScore} / {quizQuestionIndex - 1}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#E6E1DA]/60 h-2 rounded-full overflow-hidden mb-8">
                  <div 
                    className="bg-[#0D9488] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(quizQuestionIndex / quizTotalQuestions) * 100}%` }}
                  ></div>
                </div>

                {/* Question Prompt */}
                <div className="bg-[#FAF8F5] border border-[#E6E1DA] rounded-2xl p-6 mb-8 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block mb-2">
                    Which letter corresponds to this gesture posture?
                  </span>
                  
                  <GesturePlaceholderSvg 
                    letter="?"
                    category={quizTarget.category}
                    className="w-full h-36 max-w-sm mx-auto my-3"
                  />

                  <p className="text-sm font-semibold text-[#0F172A] max-w-md mx-auto mt-2">
                    "{quizTarget.handForm}"
                  </p>
                </div>

                {/* 4 Multiple Choice Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {quizChoices.map((choice) => {
                    const isSelected = selectedChoice === choice;
                    const isCorrect = choice === quizTarget.letter;
                    
                    let buttonStyle = "bg-[#FAF8F5] border-[#E6E1DA] hover:border-[#0D9488] text-[#0F172A]";
                    if (selectedChoice !== null) {
                      if (isCorrect) {
                        buttonStyle = "bg-[#0D9488]/10 border-[#0D9488] text-[#0F766E] ring-2 ring-[#0D9488]";
                      } else if (isSelected) {
                        buttonStyle = "bg-rose-50 border-rose-300 text-rose-700";
                      } else {
                        buttonStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={choice}
                        onClick={() => handleSelectQuizChoice(choice)}
                        disabled={selectedChoice !== null}
                        className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-between font-black text-2xl ${buttonStyle}`}
                      >
                        <span>Letter {choice}</span>
                        {selectedChoice !== null && isCorrect && (
                          <Check className="w-6 h-6 text-[#0D9488]" />
                        )}
                        {selectedChoice !== null && isSelected && !isCorrect && (
                          <X className="w-6 h-6 text-rose-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback Badge & Next Button */}
                {selectedChoice !== null && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E6E1DA]">
                    <div>
                      {selectedChoice === quizTarget.letter ? (
                        <span className="text-sm font-bold text-[#0F766E] flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
                          Correct Answer! That is the posture for Letter {quizTarget.letter}.
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-rose-700 flex items-center gap-2">
                          <X className="w-5 h-5 text-rose-600" />
                          Incorrect. The correct answer was Letter {quizTarget.letter}.
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleNextQuizQuestion}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <span>{quizQuestionIndex < quizTotalQuestions ? 'Next Question' : 'View Quiz Results'}</span>
                      <ArrowRight className="w-4 h-4 text-[#0D9488]" />
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
