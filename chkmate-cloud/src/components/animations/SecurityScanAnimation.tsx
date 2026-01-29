import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Lock, Globe } from 'lucide-react';

const SecurityScanAnimation = () => {
    const [scannedItems, setScannedItems] = useState<number[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setScannedItems(prev => {
                if (prev.length >= 3) return []; // Reset
                return [...prev, prev.length];
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const items = [
        { icon: Lock, label: "S3 Vertical Scaling", status: "secure" },
        { icon: Globe, label: "Public Access Blocked", status: "secure" },
        { icon: Shield, label: "IAM Least Privilege", status: "secure" },
    ];

    return (
        <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-center gap-4">
             {/* Scanner Line */}
             <motion.div 
                className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {items.map((item, index) => {
                const isScanned = scannedItems.includes(index);
                return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${isScanned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                <item.icon size={16} />
                            </div>
                            <span className={`text-sm ${isScanned ? 'text-slate-200' : 'text-slate-500'}`}>{item.label}</span>
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center">
                            {isScanned ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <Check size={16} className="text-emerald-400" />
                                </motion.div>
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-700" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SecurityScanAnimation;
