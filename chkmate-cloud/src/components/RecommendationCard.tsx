import React from 'react';
import { 
  AlertTriangle, 
  DollarSign, 
  Zap, 
  Shield, 
  Check, 
  X,
  ArrowRight
} from 'lucide-react';
import Button from './Button';
import { cn } from '../lib/utils';

export interface Recommendation {
  id: string;
  type: 'COST' | 'SECURITY' | 'PERFORMANCE' | 'RELIABILITY';
  title: string;
  description: string;
  impact: {
      savings?: number;
      risk?: string;
      performanceGain?: string;
  };
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'APPLIED' | 'DISMISSED';
  resourceId?: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onDismiss: (id: string) => void;
  onApply?: (id: string) => void;
}

const TYPE_CONFIG = {
  'COST': { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'SECURITY': { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  'PERFORMANCE': { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  'RELIABILITY': { icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

const EFFORT_COLORS = {
    'LOW': 'text-emerald-400',
    'MEDIUM': 'text-yellow-400',
    'HIGH': 'text-red-400',
};

export default function RecommendationCard({ recommendation, onDismiss, onApply }: RecommendationCardProps) {
  const config = TYPE_CONFIG[recommendation.type] || TYPE_CONFIG['COST'];
  const Icon = config.icon;

  return (
    <div className={cn(
        "bg-slate-900/50 border rounded-xl p-5 transition-all hover:shadow-lg hover:border-slate-700 relative overflow-hidden group",
        config.border
    )}>
       {/* Background accent */}
       <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10 opacity-10", config.bg.replace('/10', ''))} />

       <div className="flex gap-4">
           {/* Icon */}
           <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                <Icon className={cn("w-5 h-5", config.color)} />
           </div>

           {/* Content */}
           <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start mb-1">
                   <h3 className="font-bold text-slate-50 text-base leading-tight pr-8">{recommendation.title}</h3>
                   <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-800 bg-slate-950", config.color)}>
                       {recommendation.type}
                   </span>
               </div>
               
               <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                   {recommendation.description}
               </p>

               <div className="flex items-center gap-4 text-xs">
                   {/* Impact Badges */}
                   {recommendation.impact.savings && (
                       <div className="flex items-center gap-1.5 text-emerald-400 font-medium px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                           <DollarSign className="w-3.5 h-3.5" />
                           Save ${recommendation.impact.savings}/mo
                       </div>
                   )}
                   {recommendation.impact.risk && (
                       <div className="flex items-center gap-1.5 text-red-400 font-medium px-2 py-1 rounded bg-red-500/10 border border-red-500/20 capitalize">
                           <Shield className="w-3.5 h-3.5" />
                           {recommendation.impact.risk} Risk
                       </div>
                   )}
                    
                   <div className="w-px h-4 bg-slate-800" />
                   
                   <span className="text-slate-500">
                       Effort: <span className={cn("font-bold", EFFORT_COLORS[recommendation.effort])}>{recommendation.effort}</span>
                   </span>
               </div>
           </div>
       </div>

       {/* Actions */}
       <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
           <Button size="sm" variant="ghost" onClick={() => onDismiss(recommendation.id)} className="text-slate-500 hover:text-slate-300">
               Dismiss
           </Button>
           {onApply && (
               <Button size="sm" variant="outline" onClick={() => onApply(recommendation.id)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                   Details
               </Button>
           )}
       </div>
    </div>
  );
}
