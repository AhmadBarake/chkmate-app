import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VisualMapAnimation = () => {
    const [key, setKey] = useState(0);

    useEffect(() => {
        // Reset animation every 4 seconds to loop the whole build process
        const timer = setInterval(() => {
            setKey(prev => prev + 1);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center">
             {/* Grid Floor */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 transform-gpu perspective-500">
                <div className="w-[200%] h-[200%] bg-[linear-gradient(to_right,#475569_1px,transparent_1px),linear-gradient(to_bottom,#475569_1px,transparent_1px)] bg-[size:40px_40px] [transform:rotateX(60deg)_rotateZ(45deg)] animate-[pan_20s_linear_infinite]"></div>
            </div>

            {/* Floating Isometric Blocks */}
            {/* Using key to force re-render/re-mount to restart animations */}
            <div key={key} className="relative z-10 w-full h-full flex items-center justify-center">
                
                {/* Center Core (VPC/Cluster) */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: 100 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
                    className="absolute w-28 h-28 bg-slate-800/80 border-2 border-slate-600 rounded-xl backdrop-blur-sm shadow-2xl flex items-center justify-center z-10"
                    style={{ transform: 'translateY(10px) rotateX(45deg) rotateZ(45deg)' }}
                >
                     <div className="w-14 h-14 bg-indigo-500/20 rounded-full animate-pulse" />
                </motion.div>

                {/* Satellite Service 1 (DB) */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, x: -50, y: -50 }}
                    animate={{ scale: 1, opacity: 1, x: -80, y: -40 }} // Adjusted position
                    transition={{ type: "spring", stiffness: 120, delay: 0.4 }}
                    className="absolute w-20 h-20 bg-blue-500/20 border border-blue-400 rounded-lg backdrop-blur-md shadow-lg flex items-center justify-center z-20"
                >
                    <div className="text-xs font-mono text-blue-300 font-bold">RDS</div>
                </motion.div>

                 {/* Satellite Service 2 (Cache) */}
                 <motion.div
                    initial={{ scale: 0, opacity: 0, x: 50, y: -50 }}
                    animate={{ scale: 1, opacity: 1, x: 80, y: -40 }}
                    transition={{ type: "spring", stiffness: 120, delay: 0.6 }}
                    className="absolute w-16 h-16 bg-red-500/20 border border-red-400 rounded-lg backdrop-blur-md shadow-lg flex items-center justify-center z-20"
                >
                     <div className="text-xs font-mono text-red-300 font-bold">Redis</div>
                </motion.div>

                 {/* Satellite Service 3 (LB) */}
                 <motion.div
                    initial={{ scale: 0, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 80 }}
                    transition={{ type: "spring", stiffness: 120, delay: 0.8 }}
                    className="absolute w-24 h-12 bg-emerald-500/20 border border-emerald-400 rounded-md backdrop-blur-md shadow-lg flex items-center justify-center z-30"
                >
                    <div className="text-xs font-mono text-emerald-300 font-bold">ALB</div>
                </motion.div>
                
                {/* Connecting Lines (Pulsing) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <motion.path 
                        d="M 50% 50% L 35% 40%" // Hypothetical coords, just visual fluff
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.5 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        stroke="rgba(99, 102, 241, 0.5)" strokeWidth="2" fill="none"
                    />
                </svg>
            </div>
        </div>
    );
};

export default VisualMapAnimation;
