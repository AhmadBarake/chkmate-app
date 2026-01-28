import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  Code2,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { ViolationResult, Severity } from '../lib/api';

interface ViolationCardProps {
  policyCode: string;
  policyName: string;
  severity: Severity;
  results: ViolationResult[];
  defaultExpanded?: boolean;
}

const severityConfig: Record<Severity, { 
  icon: typeof AlertTriangle; 
  color: string; 
  bg: string; 
  border: string;
  label: string;
}> = {
  CRITICAL: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Critical',
  },
  HIGH: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    label: 'High',
  },
  MEDIUM: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    label: 'Medium',
  },
  LOW: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    label: 'Low',
  },
  INFO: {
    icon: Info,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    label: 'Info',
  },
};

export default function ViolationCard({
  policyCode,
  policyName,
  severity,
  results,
  defaultExpanded = false,
}: ViolationCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        'rounded-xl border overflow-hidden transition-all',
        config.bg,
        config.border
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={cn('p-2 rounded-lg', config.bg)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-mono px-1.5 py-0.5 rounded', config.bg, config.color)}>
              {policyCode}
            </span>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.bg, config.color)}>
              {config.label}
            </span>
          </div>
          <h3 className="font-medium text-white mt-1 truncate">{policyName}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {results.length} {results.length === 1 ? 'issue' : 'issues'}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-800"
        >
          <div className="p-4 space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-slate-900/50 rounded-lg p-3 space-y-2"
              >
                {/* Resource reference */}
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-slate-500" />
                  <code className="text-sm font-mono text-slate-300">
                    {result.resourceRef}
                  </code>
                  {result.line && (
                    <span className="text-xs text-slate-500">
                      Line {result.line}
                    </span>
                  )}
                </div>

                {/* Message */}
                <p className="text-sm text-slate-300 pl-6">
                  {result.message}
                </p>

                {/* Suggestion */}
                {result.suggestion && (
                  <div className="flex items-start gap-2 pl-6 pt-2 border-t border-slate-800">
                    <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-400">
                      {result.suggestion}
                    </p>
                  </div>
                )}

                {/* Auto-fixable badge */}
                {result.autoFixable && (
                  <div className="flex items-center gap-1.5 pl-6">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Auto-fixable</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Summary counts component
export function ViolationSummary({ 
  criticalCount, 
  highCount, 
  mediumCount, 
  lowCount 
}: {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}) {
  const counts = [
    { label: 'Critical', count: criticalCount, color: 'text-red-400 bg-red-500/20' },
    { label: 'High', count: highCount, color: 'text-orange-400 bg-orange-500/20' },
    { label: 'Medium', count: mediumCount, color: 'text-yellow-400 bg-yellow-500/20' },
    { label: 'Low', count: lowCount, color: 'text-blue-400 bg-blue-500/20' },
  ];

  return (
    <div className="flex items-center gap-2">
      {counts.map(({ label, count, color }) => (
        count > 0 && (
          <span
            key={label}
            className={cn('px-2 py-0.5 rounded text-xs font-medium', color)}
          >
            {count} {label}
          </span>
        )
      ))}
      {counts.every(c => c.count === 0) && (
        <span className="text-emerald-400 text-sm">No issues found</span>
      )}
    </div>
  );
}
