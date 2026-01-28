import React, { useState } from 'react';
import Section from './Section';
import { Link } from 'react-router-dom';
import { CASE_STUDIES } from '../constants';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CaseStudies: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewAll, setViewAll] = useState(false);
  const itemsPerPage = 3;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % CASE_STUDIES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? CASE_STUDIES.length - 1 : prevIndex - 1
    );
  };
  
  // Calculate visible items
  const visibleItems = [];
  if (viewAll) {
      visibleItems.push(...CASE_STUDIES);
  } else {
      for (let i = 0; i < itemsPerPage; i++) {
        const index = (currentIndex + i) % CASE_STUDIES.length;
        visibleItems.push(CASE_STUDIES[index]);
      }
  }

  return (
    <Section id="case-studies" className="bg-black">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-800 pb-8">
        <div className="max-w-2xl">
          <span className="text-orange-400 font-mono text-sm uppercase tracking-wider">Success Stories</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 mt-2">Proven Results</h2>
          <p className="text-gray-400">
            Real-world challenges solved with precision engineering and strategic foresight.
          </p>
        </div>
        <div className="mt-6 md:mt-0 flex items-center space-x-6">
            {!viewAll && (
                <div className="flex space-x-2">
                    <button onClick={prevSlide} className="p-2 border border-gray-700 rounded-full hover:bg-neutral-800 transition-colors text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextSlide} className="p-2 border border-gray-700 rounded-full hover:bg-neutral-800 transition-colors text-white">
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
            <button 
                onClick={() => setViewAll(!viewAll)}
                className="hidden md:inline-block text-white hover:text-gray-300 font-mono text-sm uppercase tracking-widest border-b border-white pb-1 transition-colors"
            >
                {viewAll ? "Show Less" : "View All Projects"}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AnimatePresence mode={viewAll ? 'popLayout' : 'wait'}>
            {visibleItems.map((study, index) => (
            <motion.div 
                layout
                key={`${study.client}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group flex flex-col h-full border border-gray-800 bg-neutral-900/20 hover:border-white/30 transition-all duration-300"
            >
                {/* Image Preview */}
                <div className="h-48 bg-neutral-900 w-full relative overflow-hidden group-hover:opacity-90 transition-opacity">
                    {study.image ? (
                        <div 
                            className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
                            style={{ backgroundImage: `url(${study.image})` }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-mono text-xs uppercase tracking-widest">
                            Project Preview
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{study.client}</span>
                            {/* Link to case study if URL is provided and not hash */}
                            {study.link && study.link !== '#' ? (
                            <Link to={study.link} className="hover:text-cyan-400 transition-colors">
                                <h3 className="text-xl font-bold text-white mt-1 underline decoration-1 underline-offset-4">{study.title}</h3>
                            </Link>
                            ) : (
                            <h3 className="text-xl font-bold text-white mt-1 group-hover:underline decoration-1 underline-offset-4">{study.title}</h3>
                            )}
                        </div>
                        
                        {study.link && study.link !== '#' ? (
                            <Link to={study.link}>
                                <ArrowUpRight className="text-gray-500 group-hover:text-white transition-colors cursor-pointer" size={20} />
                            </Link>
                        ) : (
                            <ArrowUpRight className="text-gray-500 group-hover:text-white transition-colors" size={20} />
                        )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6 flex-grow">
                        {study.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                        {study.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-white/5 text-gray-300 px-2 py-1 rounded border border-white/10">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <div className="mt-8 md:hidden text-center">
         <button 
            onClick={() => setViewAll(!viewAll)}
            className="text-white hover:text-gray-300 font-mono text-sm uppercase tracking-widest border-b border-white pb-1 transition-colors"
        >
            {viewAll ? "Show Less" : "View All Projects"}
        </button>
      </div>
    </Section>
  );
};

export default CaseStudies;