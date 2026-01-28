import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'SECURE';

interface SecurityBadgeProps {
  severity: Severity;
  className?: string;
  showIcon?: boolean;
}

const config: Record<Severity, { color: string; bg: string; border: string; icon: any; label: string }> = {
  CRITICAL: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: ShieldAlert,
    label: 'Critical'
  },
  HIGH: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: AlertCircle,
    label: 'High'
  },
  MEDIUM: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: AlertTriangle,
    label: 'Medium'
  },
  LOW: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: Info,
    label: 'Low'
  },
  INFO: {
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    icon: Info,
    label: 'Info'
  },
  SECURE: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: ShieldCheck,
    label: 'Secure'
  }
};

export function SecurityBadge({ severity, className, showIcon = true }: SecurityBadgeProps) {
  const { color, bg, border, icon: Icon, label } = config[severity];

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all',
      color,
      bg,
      border,
      className
    )}>
      {showIcon && <Icon className="w-3 h-3" />}
      {label}
    </div>
  );
}
