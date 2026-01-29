import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Shield, AlertTriangle, CheckCircle, RefreshCw, Globe, DollarSign } from 'lucide-react';

const FleetControlAnimation = () => {
    const [resources, setResources] = useState<any[]>([]);
    
    useEffect(() => {
        // Simulate importing resources sequence with more details
        const newResources = [
            { id: 1, name: "prod-eks-cluster", type: "Cluster", region: "us-east-1", cost: "$1,200", icon: Server, status: "scanning", delay: 0 },
            { id: 2, name: "payment-db-primary", type: "RDS", region: "us-west-2", cost: "$850", icon: Database, status: "scanning", delay: 800 },
            { id: 3, name: "frontend-lb", type: "ALB", region: "us-east-1", cost: "$45", icon: Server, status: "scanning", delay: 1600 },
            { id: 4, name: "legacy-bastion", type: "EC2", region: "eu-central-1", cost: "$120", icon: Server, status: "scanning", delay: 2400 },
            { id: 5, name: "analytics-warehouse", type: "Redshift", region: "us-east-1", cost: "$450", icon: Database, status: "scanning", delay: 3200 },
        ];

        let timeouts: NodeJS.Timeout[] = [];

        newResources.forEach((res, index) => {
            const t1 = setTimeout(() => {
                setResources(prev => [...prev, { ...res, status: 'scanning' }]);
                
                // Then change status after scan
                const t2 = setTimeout(() => {
                    setResources(prev => prev.map(r => {
                        if (r.id === res.id) {
                            if (r.id === 4) return { ...r, status: 'warning', issue: 'Unencrypted Volume' };
                            return { ...r, status: 'secure' };
                        }
                        return r;
                    }));
                }, 1500);
                timeouts.push(t2);

            }, res.delay);
            timeouts.push(t1);
        });

        // Loop reset
        const resetTimer = setTimeout(() => {
            setResources([]);
        }, 10000); 

        return () => {
            timeouts.forEach(clearTimeout);
            clearTimeout(resetTimer);
        };
    }, [resources.length === 0]); 

    return (
        <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="h-14 bg-slate-800/30 border-b border-slate-800/50 flex items-center px-6 justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                     <span className="text-sm font-medium text-slate-300">Inventory Sync</span>
                </div>
                {resources.length > 0 && resources.length < 5 && (
                    <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
                        <RefreshCw size={14} className="animate-spin" />
                        Syncing Resources...
                    </div>
                )}
                 {resources.length === 5 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                        <CheckCircle size={14} />
                        Sync Complete
                    </div>
                )}
            </div>

            {/* List Header */}
             <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900/50 border-b border-slate-800/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <div className="col-span-5">Resource Name</div>
                <div className="col-span-2">Region</div>
                <div className="col-span-2">Est. Cost</div>
                <div className="col-span-3 text-right">Status</div>
            </div>

            {/* List Body */}
            <div className="flex-1 p-2 space-y-1 relative overflow-hidden bg-slate-950/30">
                <AnimatePresence>
                    {resources.map((res) => (
                        <motion.div
                            key={res.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-slate-800/30 border border-transparent hover:border-slate-800/50 transition-colors"
                        >
                            {/* Name & Type */}
                            <div className="col-span-5 flex items-center gap-3">
                                <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                                    <res.icon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-200 font-medium">{res.name}</span>
                                    <span className="text-[10px] text-slate-500 uppercase">{res.type}</span>
                                </div>
                            </div>

                            {/* Region */}
                             <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-400">
                                <Globe size={12} className="text-slate-600" />
                                {res.region}
                            </div>

                            {/* Cost */}
                             <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                                <DollarSign size={12} className="text-slate-600" />
                                {res.cost}
                            </div>

                            {/* Status */}
                            <div className="col-span-3 flex justify-end">
                                {res.status === 'scanning' && (
                                    <span className="text-xs text-slate-500 italic flex items-center gap-2">
                                        <RefreshCw size={12} className="animate-spin" /> Scanning
                                    </span>
                                )}
                                {res.status === 'secure' && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                        <Shield size={12} />
                                        Secure
                                    </motion.div>
                                )}
                                {res.status === 'warning' && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                        <AlertTriangle size={12} />
                                        {res.issue}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {resources.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                        <span className="text-sm">Connecting to AWS...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FleetControlAnimation;
