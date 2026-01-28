import React from 'react';
import { motion, Variants } from 'framer-motion';

export default function CloudHeroAnimation() {
  const drawAndErase: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 },
        opacity: { duration: 0.5 }
      }
    }
  };

  const float: Variants = {
      animate: {
          y: [0, -10, 0],
          transition: {
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
          }
      }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-64 h-40 flex items-center justify-center">
        <motion.svg
          viewBox="0 0 100 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-brand-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]"
          initial="hidden"
          animate="visible"
        >
             {/* Cloud 1 (Main) */}
            <motion.path 
                variants={drawAndErase}
                d="M25 35 
                   C25 35, 20 35, 18 30
                   C16 25, 20 20, 22 20
                   C22 15, 30 10, 38 15
                   C42 10, 55 12, 58 20
                   C65 20, 68 28, 62 35
                   L25 35Z"
            />
            
            {/* Cloud 2 (smaller, behind/left) */}
            <motion.path 
                variants={drawAndErase} 
                d="M15 25
                   C15 25, 12 25, 10 22
                   C8 18, 12 15, 14 15
                   C14 12, 18 10, 22 12
                   C25 12, 28 18, 25 22
                   L15 25Z"
                style={{ opacity: 0.5 }}
            />

            {/* Cloud 3 (smaller, right) */}
             <motion.path 
                variants={drawAndErase}
                d="M70 30
                   C70 30, 75 30, 78 26
                   C80 22, 75 18, 72 18
                   C72 15, 65 14, 60 18
                   C58 18, 55 24, 60 28
                   L70 30Z" 
                style={{ opacity: 0.5 }}
            />

            {/* Connecting Lines / Network */}
            <motion.path variants={drawAndErase} d="M38 35 L38 45" strokeDasharray="1 1" />
            <motion.path variants={drawAndErase} d="M50 35 L50 45" strokeDasharray="1 1" />
            
            <motion.rect variants={drawAndErase} x="34" y="45" width="8" height="4" rx="1" />
            <motion.rect variants={drawAndErase} x="46" y="45" width="8" height="4" rx="1" />

        </motion.svg>
      </div>
    </div>
  );
}
