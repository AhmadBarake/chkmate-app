import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import ThreeBackground from './ThreeBackground';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Three.js Background */}
      <ThreeBackground />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-xs font-mono tracking-widest text-gray-300 mb-6 uppercase">
            Future-Proof Your Infrastructure
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8"
        >
          Build for <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">Scale.</span> <br />
          Deploy for <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">Impact.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light"
        >
          Cost-efficient cloud consulting and app development tailored to SMEs, enterprises, and startups. We architect the digital backbone for Fintech, Health Tech, and Logistics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#services"
            className="px-8 py-4 bg-white text-black font-bold text-lg rounded-none hover:bg-gray-200 transition-colors w-full sm:w-auto"
          >
            Our Services
          </a>
          <a
            href="#contact"
            className="px-8 py-4 border border-white text-white font-bold text-lg rounded-none hover:bg-white hover:text-black transition-colors w-full sm:w-auto"
          >
            Start Project
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center text-gray-500">
          <span className="text-xs uppercase tracking-widest mb-2">Scroll</span>
          <ChevronDown className="animate-bounce" />
        </div>
      </motion.div>
      
      {/* Overlay Gradient for smoother blending */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none" />
    </div>
  );
};

export default Hero;