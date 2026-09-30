import React from 'react';
import { Camera, Hand, FileText, Volume2, ArrowRight } from 'lucide-react';

export const ProcessWorkflow: React.FC = () => {
  const processSteps = [
    {
      step: '01',
      icon: Camera,
      title: 'Position Hand in Frame',
      description: 'Open ISL CONNECT on any device with a webcam. Position your hand comfortably inside the on-screen guide area.'
    },
    {
      step: '02',
      icon: Hand,
      title: 'Form ISL Alphabet Gesture',
      description: 'Shape any of the 26 Indian Sign Language finger alphabet letters (A to Z) facing forward toward the camera.'
    },
    {
      step: '03',
      icon: FileText,
      title: 'Instant Visual Feedback',
      description: 'The computer vision engine detects keypoints instantly, highlights the recognized sign, and appends it to your text sentence.'
    },
    {
      step: '04',
      icon: Volume2,
      title: 'Text-to-Speech Output',
      description: 'Listen to the full spelled sentence voiced aloud via built-in Web Speech synthesis for seamless communication.'
    }
  ];

  return (
    <section id="process-flow" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-3">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
            From Gesture to Communication
          </h2>
          <p className="mt-3 text-base text-[#475569]">
            Designed for effortless interaction with zero setup, plugins, or extra hardware required.
          </p>
        </div>

        {/* Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {processSteps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step}
                className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 relative hover:border-[#0D9488]/50 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-[#FAF8F5] flex items-center justify-center group-hover:bg-[#0D9488] transition-colors">
                      <Icon className="w-6 h-6 text-[#0D9488] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-3xl font-extrabold text-[#E6E1DA] group-hover:text-[#0D9488]/30 transition-colors font-serif-editorial italic">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{item.description}</p>
                </div>

                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E6E1DA] flex items-center justify-center text-[#64748B]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
