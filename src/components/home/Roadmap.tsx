import React from 'react';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';

export const Roadmap: React.FC = () => {
  const roadmapItems = [
    {
      phase: 'NOW',
      title: 'ISL Alphabet (A–Z)',
      status: 'Live Release',
      badgeClass: 'bg-[#0D9488]/10 text-[#0F766E] border-[#0D9488]/30',
      icon: CheckCircle2,
      features: [
        '26 finger spelling alphabet sign classes',
        'In-browser MediaPipe hand tracking',
        'Real-time text buffer accumulation',
        'Browser SpeechSynthesis audio output',
        '100% private client-side processing'
      ]
    },
    {
      phase: 'NEXT',
      title: 'Vocabulary & Digits',
      status: 'In Active R&D',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      features: [
        'Numerical signs recognition (0–9)',
        'Top 100 common ISL word gestures',
        'Dual-hand gesture tracking integration',
        'Custom hand calibration tool',
        'Confidence score threshold controls'
      ]
    },
    {
      phase: 'FUTURE',
      title: 'Continuous Speech',
      status: 'Planned Architecture',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Calendar,
      features: [
        'Continuous sentence-level sign translation',
        'Regional ISL dialect variations dataset',
        'Offline mobile applications (iOS & Android)',
        'Public Web API & Developer SDK',
        'Two-way speech-to-sign avatar engine'
      ]
    }
  ];

  return (
    <section id="roadmap" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-3">
            Product Evolution
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
            Transparent Product Roadmap
          </h2>
          <p className="mt-3 text-base text-[#475569]">
            We maintain strict clarity on our current release scope and ongoing model expansion.
          </p>
        </div>

        {/* 3 Column Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roadmapItems.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.phase}
                className="bg-[#FFFFFF] border border-[#E6E1DA] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs relative"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-[#0F172A] font-serif-editorial italic">
                      {item.phase}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.badgeClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0F172A] mb-4">{item.title}</h3>

                  <ul className="space-y-3 text-sm text-[#475569]">
                    {item.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-2 shrink-0"></span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E6E1DA] text-xs text-[#94A3B8]">
                  {item.phase === 'NOW' ? 'Currently Available in Demo' : 'Under Engineering'}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
