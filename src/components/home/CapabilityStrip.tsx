import React from 'react';
import { Layers, Zap, Type, Volume2 } from 'lucide-react';

export const CapabilityStrip: React.FC = () => {
  const capabilities = [
    {
      icon: Layers,
      title: '26 Alphabet Classes',
      description: 'Comprehensive trained classification model for ISL finger spelling letters A through Z.'
    },
    {
      icon: Zap,
      title: 'Real-Time Recognition',
      description: 'Ultra-low latency computer vision keypoint extraction directly in your browser.'
    },
    {
      icon: Type,
      title: 'Instant Text Output',
      description: 'Continuous gesture buffering spells words and sentences cleanly without manual typing.'
    },
    {
      icon: Volume2,
      title: 'Optional Audio Speech',
      description: 'Integrated Text-to-Speech engine converts recognized signs into spoken voice output.'
    }
  ];

  return (
    <section className="py-14 bg-[#FFFFFF] border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="flex flex-col p-6 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] hover:border-[#0D9488]/40 transition-all group"
              >
                <div className="w-11 h-11 rounded-lg bg-[#0F172A] flex items-center justify-center mb-5 text-[#FAF8F5] group-hover:bg-[#0D9488] transition-colors">
                  <Icon className="w-5 h-5 text-[#0D9488] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
