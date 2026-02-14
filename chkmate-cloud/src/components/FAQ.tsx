import React, { useState } from 'react';
import Section from './Section';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { FAQ_ITEMS } from '../constants';

const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <Section id="faq" className="bg-neutral-950 border-t border-gray-900">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Header */}
        <div className="md:w-1/3">
           <span className="text-purple-400 font-mono text-sm uppercase tracking-wider">Clarity First</span>
           <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mt-2 mb-4">Common Questions</h2>
           <p className="text-gray-400">
               Everything you need to know about how we work, deliver, and support your digital ambition.
           </p>
        </div>

        {/* Accordion List */}
        <div className="md:w-2/3">
            <div className="space-y-4">
                {FAQ_ITEMS.map((item, index) => (
                    <div key={index} className="border border-gray-800 rounded-lg bg-neutral-900/30 overflow-hidden">
                        <button 
                            onClick={() => toggleAccordion(index)}
                            className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-neutral-900/50 transition-colors"
                        >
                            <span className={`font-bold text-lg ${activeIndex === index ? 'text-slate-50' : 'text-gray-300'}`}>
                                {item.question}
                            </span>
                            <div className={`p-2 rounded-full ${activeIndex === index ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}>
                                {activeIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                            </div>
                        </button>
                        
                        <AnimatePresence>
                            {activeIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-gray-800/50 pt-4">
                                        {item.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </Section>
  );
};

export default FAQ;
