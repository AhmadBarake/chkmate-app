import React from 'react';
import { motion, Variants } from 'framer-motion';

export default function ChessLoader() {
  const drawAndErase: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: "easeInOut" },
        opacity: { duration: 0.1 }
      }
    },
    erase: {
        pathLength: 0,
        opacity: 0,
        transition: {
            pathLength: { duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 1.5 } // Fade out while erasing
        }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-24 h-24 flex items-center justify-center">
        
        {/* Container for the composition */}
        <motion.svg
          viewBox="0 0 50 40" // Adjusted viewBox for side-by-side composition
          fill="none"
          stroke="currentColor"
          strokeWidth="1" // Minimal stroke
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-slate-50"
          initial="hidden"
          animate={["visible", "erase"]}
          transition={{
            repeat: Infinity,
            repeatDelay: 0.5,
            // Sequence: Draw (2s) -> Wait -> Erase (1.5s) -> Wait (0.5s)
          }}
        >
            {/* PAWN (Left) */}
            <motion.g>
                 <motion.path variants={drawAndErase} d="M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /> {/* Head */}
                 <motion.path variants={drawAndErase} d="M12 14v2" /> {/* Neck */}
                 <motion.path variants={drawAndErase} d="M9 16h6l-1 8h-4l-1-8H9z" /> {/* Body */}
                 <motion.path variants={drawAndErase} d="M7 24h10" /> 
                 <motion.path variants={drawAndErase} d="M7 27h10" /> 
                 <motion.path variants={drawAndErase} d="M5 30h14" /> {/* Base */}
            </motion.g>

           {/* KING (Right) */}
           <motion.g 
                className="text-slate-50" // Highlight the King? Or keep white? Let's keep it subtle purple.
                style={{ translateX: 20, translateY: -2 }} // Position slightly higher
           > 
               <motion.path variants={drawAndErase} d="M12 22h-4c-1.1 0-1.88-.9-1.88-2 0-3.1 3.1-4 3.1-9a2.76 2.76 0 0 1-2.2-2.1c-.6-3.1 2-5.4 5-5.9" />
               <motion.path variants={drawAndErase} d="M12 22h4c1.1 0 1.88-.9 1.88-2 0-3.1-3.1-4-3.1-9a2.76 2.76 0 0 0 2.2-2.1c.6-3.1-2-5.4-5-5.9" />
               <motion.path variants={drawAndErase} d="M12 2v4" />
               <motion.path variants={drawAndErase} d="M9 6h6" />
           </motion.g>

        </motion.svg>
      </div>

      <motion.p 
        className="text-gray-400 font-mono text-xs uppercase tracking-widest"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        Designing Strategy...
      </motion.p>
    </div>
  );
}
