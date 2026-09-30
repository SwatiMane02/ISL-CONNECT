import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/home/Hero';
import { ProductPreview } from './components/home/ProductPreview';
import { CapabilityStrip } from './components/home/CapabilityStrip';
import { ProblemSolution } from './components/home/ProblemSolution';
import { RecognitionDemo } from './components/home/RecognitionDemo';
import { ProcessWorkflow } from './components/home/ProcessWorkflow';
import { AlphabetGrid } from './components/home/AlphabetGrid';
import { Roadmap } from './components/home/Roadmap';
import { CTASection } from './components/home/CTASection';
import { Footer } from './components/layout/Footer';
import { LiveRecognitionPage } from './components/live/LiveRecognitionPage';
import { LearnISLPage } from './components/learn/LearnISLPage';
import { PracticePage } from './components/practice/PracticePage';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === '/live') return '/live';
    if (path === '/learn') return '/learn';
    if (path === '/practice') return '/practice';
    return '/';
  });

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/live') setCurrentPath('/live');
      else if (path === '/learn') setCurrentPath('/learn');
      else if (path === '/practice') setCurrentPath('/practice');
      else setCurrentPath('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string, sectionId?: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (path === '/' && sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] flex flex-col font-sans">
      {/* Shared Navbar */}
      <Navbar currentPath={currentPath} onNavigate={handleNavigate} />

      <main className="flex-grow">
        {currentPath === '/live' ? (
          /* Live ISL Recognition Page at /live */
          <LiveRecognitionPage />
        ) : currentPath === '/learn' ? (
          /* Learn ISL Alphabet Page at /learn */
          <LearnISLPage onNavigate={handleNavigate} />
        ) : currentPath === '/practice' ? (
          /* Practice Mode Page at /practice */
          <PracticePage onNavigate={handleNavigate} />
        ) : (
          /* Homepage at / */
          <>
            <Hero 
              onExploreDemo={() => handleNavigate('/live')} 
              onExploreAlphabet={() => handleNavigate('/learn')} 
            />

            <ProductPreview />

            <CapabilityStrip />

            <ProblemSolution />

            <RecognitionDemo />

            <ProcessWorkflow />

            <AlphabetGrid 
              onSelectLetterForDemo={() => handleNavigate('/live')} 
            />

            <Roadmap />

            <CTASection onTryDemo={() => handleNavigate('/live')} />
          </>
        )}
      </main>

      {/* Shared Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
