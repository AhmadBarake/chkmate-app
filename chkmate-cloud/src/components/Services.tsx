import React from 'react';
import Section from './Section';
import { SERVICES } from '../constants';
import { ArrowUpRight } from 'lucide-react';

const Services: React.FC = () => {
  return (
    <Section id="services" className="bg-black">
      <div className="text-left mb-16 border-b border-gray-800 pb-8">
        <span className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Our Expertise</span>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 mt-2">Core Competencies</h2>
        <p className="text-gray-400 max-w-2xl">We don't just write code; we engineer value. Our expertise spans across critical domains required for modern digital transformation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SERVICES.map((service, index) => (
          <div 
            key={index} 
            className="group relative p-8 border border-gray-800 hover:border-white transition-all duration-300 bg-black hover:bg-gray-900/20"
          >
            <div className="absolute top-8 right-8 text-gray-600 group-hover:text-white transition-colors duration-300">
              <ArrowUpRight size={24} />
            </div>
            
            <div className="mb-6 p-4 inline-block rounded-full bg-gray-900 text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
              <service.icon size={28} />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default Services;