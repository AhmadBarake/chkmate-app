import React from 'react';
import Section from './Section';
import { SECTORS } from '../constants';

const Sectors: React.FC = () => {
  return (
    <Section id="sectors" className="bg-neutral-900 border-y border-neutral-800">
      <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-emerald-400 font-mono text-sm tracking-wider uppercase">Industries</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-6">
            Specialized Solutions for <br />
            <span className="text-gray-500">High-Stakes Sectors.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            We understand the unique regulatory and technical challenges of our focus industries. Our solutions are built to be compliant, secure, and resilient from day one.
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SECTORS.map((sector, index) => (
          <div key={index} className="flex flex-col p-6 bg-black border border-gray-800 hover:border-gray-600 transition-all duration-300 group">
            <div className="flex items-center mb-4 text-white group-hover:text-gray-300 transition-colors">
              <div className="p-3 bg-neutral-900 rounded-lg mr-4 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                <sector.icon size={24} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold">{sector.name}</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{sector.description}</p>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <a href="#contact" className="inline-flex items-center text-white font-bold border-b border-white pb-1 hover:text-gray-300 transition-colors">
            Discuss your industry needs
        </a>
      </div>
    </Section>
  );
};

export default Sectors;