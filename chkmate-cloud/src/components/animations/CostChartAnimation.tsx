import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Trash2, Cpu, HardDrive, Zap, Tag } from 'lucide-react';

const CostChartAnimation = () => {
    const recommendations = [
        {
            icon: Cpu,
            title: "Right-Size RDS Instance",
            detail: "db.r5.2xlarge → db.r5.xlarge",
            save: "$360/mo",
            color: "text-blue-400"
        },
        {
            icon: Trash2,
            title: "Delete Unattached EBS",
            detail: "500GB GP2 Volume (Idle)",
            save: "$50/mo",
            color: "text-red-400"
        },
        {
            icon: Zap,
            title: "Convert to Spot Instances",
            detail: "EKS Node Group: worker-v1",
            save: "$820/mo",
            color: "text-amber-400"
        },
        {
            icon: HardDrive,
            title: "S3 Lifecycle Policy",
            detail: "Move logs to Glacier after 30d",
            save: "$120/mo",
            color: "text-purple-400"
        },
        {
            icon: Trash2,
            title: "Remove Idle NAT Gateway",
            detail: "vpc-prod-us-east-1",
            save: "$32/mo",
            color: "text-red-400"
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % recommendations.length);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl relative flex flex-col p-6 overflow-hidden">
             
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2 relative z-10">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Audit</div>
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                    <Zap size={10} />
                    LIVE
                </div>
            </div>

            {/* Scrolling List */}
            <div className="flex-1 relative overflow-hidden z-10">
                <AnimatePresence mode='popLayout'>
                    {recommendations.map((item, i) => {
                        // Logic to show a window of items or cycle them?
                        // Let's simpler: Just show 3 items, sliding up.
                        // Actually, let's make it a marquee or just render them based on current index?
                        // Let's render the "active" one prominent and others fading.
                        
                        // Better approach: Vertical list that auto-scrolls.
                        // For simplicity in this constrained view, let's show a simulated "stream" 
                        // where new alerts pop in at the top.
                        
                        // Let's use the index to determine position in a cyclic list
                        const position = (i - currentIndex + recommendations.length) % recommendations.length;
                        
                        // Show only top 3
                        if (position > 3) return null;

                        return (
                            <motion.div 
                                key={item.title} // unique key
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: position * 60, scale: 1, zIndex: 10 - position }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5 }}
                                className="absolute w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md bg-slate-800/50 ${item.color}`}>
                                        <item.icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-slate-200">{item.title}</div>
                                        <div className="text-[10px] text-slate-500">{item.detail}</div>
                                    </div>
                                </div>
                                <div className="text-emerald-400 text-xs font-bold">-{item.save}</div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Bottom Total Savings (Static/Pulse) */}
             <div className="relative z-10 mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center">
                <span className="text-xs text-slate-500">Total Potential Savings</span>
                <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-xl font-bold text-white"
                >
                    $1,382<span className="text-xs font-normal text-slate-400">/mo</span>
                </motion.div>
            </div>
        </div>
    );
};

export default CostChartAnimation;
