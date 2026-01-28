import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuditScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function AuditScore({ 
  score, 
  size = 'md', 
  showLabel = true,
  className 
}: AuditScoreProps) {
  // Determine color and status based on score
  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: ShieldCheck };
    if (score >= 70) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-500', icon: ShieldCheck };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500', icon: ShieldAlert };
    if (score >= 30) return { label: 'Poor', color: 'text-orange-400', bg: 'bg-orange-500', icon: ShieldAlert };
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500', icon: ShieldX };
  };

  const status = getScoreStatus(score);
  const Icon = status.icon;

  const sizes = {
    sm: { gauge: 60, stroke: 4, icon: 16, text: 'text-sm' },
    md: { gauge: 100, stroke: 6, icon: 24, text: 'text-xl' },
    lg: { gauge: 140, stroke: 8, icon: 32, text: 'text-3xl' },
  };

  const s = sizes[size];
  const radius = (s.gauge - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: s.gauge, height: s.gauge }}>
        {/* Background circle */}
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${s.gauge} ${s.gauge}`}>
          <circle
            cx={s.gauge / 2}
            cy={s.gauge / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-slate-800"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx={s.gauge / 2}
            cy={s.gauge / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            className={status.color}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={cn('font-bold', status.color, s.text)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>

      {showLabel && (
        <div className="flex items-center gap-1.5">
          <Icon className={cn('w-4 h-4', status.color)} />
          <span className={cn('text-sm font-medium', status.color)}>{status.label}</span>
        </div>
      )}
    </div>
  );
}

// Mini inline version for cards/badges
export function AuditScoreBadge({ score, className }: { score: number; className?: string }) {
  const getScoreStatus = (score: number) => {
    if (score >= 90) return { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (score >= 70) return { color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (score >= 50) return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (score >= 30) return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  const status = getScoreStatus(score);

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      status.color,
      className
    )}>
      <Shield className="w-3 h-3" />
      {Math.round(score)}
    </span>
  );
}
