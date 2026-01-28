import React from 'react';
import Section from './Section';
import { ENGAGEMENT_MODELS } from '../constants';

const Process: React.FC = () => {
  return (
    <Section id="process" className="bg-black">
      <div className="text-center mb-16">
        <span className="text-pink-400 font-mono text-sm uppercase tracking-wider">Methodology</span>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 mt-2">How We Engage</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Flexible partnership models designed to fit your business stage, from startup validation to enterprise transformation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ENGAGEMENT_MODELS.map((model, index) => (
          <div key={index} className="p-8 border border-white/10 text-center hover:bg-white/5 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">{model.type}</h3>
            <div className="w-12 h-1 bg-white mx-auto mb-6"></div>
            <p className="text-gray-400">{model.detail}</p>
          </div>
        ))}
      </div>


    </Section>
  );
};

export default Process;