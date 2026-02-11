import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Shield,
  DollarSign,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Undo2,
  Sparkles,
} from 'lucide-react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { cn } from '../lib/utils';
import {
  runAgentAnalysis,
  applyAgentChanges,
  AgentChange,
  ChangePlan,
} from '../lib/api';
import AuditScore from './AuditScore';
import Button from './Button';
import { useAuth } from '@clerk/clerk-react';

interface AgenticPanelProps {
  content: string;
  provider: string;
  templateId: string;
  onContentUpdate?: (newContent: string) => void;
  onClose?: () => void;
  className?: string;
}

type ViewState = 'idle' | 'analyzing' | 'plan' | 'applying' | 'done' | 'error';

export default function AgenticPanel({
  content,
  provider,
  templateId,
  onContentUpdate,
  onClose,
  className,
}: AgenticPanelProps) {
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [changePlan, setChangePlan] = useState<ChangePlan | null>(null);
  const [changeStates, setChangeStates] = useState<Record<string, 'proposed' | 'accepted' | 'rejected'>>({});
  const [expandedChange, setExpandedChange] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedResult, setAppliedResult] = useState<{ appliedCount: number; versionId: string } | null>(null);
  const { getToken } = useAuth();

  const handleAnalyze = useCallback(async () => {
    setViewState('analyzing');
    setError(null);
    setChangePlan(null);
    setChangeStates({});

    try {
      const token = await getToken();
      const plan = await runAgentAnalysis(templateId, content, provider, token);
      setChangePlan(plan);

      // Initialize all changes as proposed
      const states: Record<string, 'proposed' | 'accepted' | 'rejected'> = {};
      plan.changes.forEach(c => { states[c.id] = 'proposed'; });
      setChangeStates(states);
      setViewState('plan');
    } catch (err: any) {
      setError(err?.message || 'Agent analysis failed');
      setViewState('error');
    }
  }, [templateId, content, provider, getToken]);

  const handleAcceptAll = () => {
    if (!changePlan) return;
    const states: Record<string, 'proposed' | 'accepted' | 'rejected'> = {};
    changePlan.changes.forEach(c => { states[c.id] = 'accepted'; });
    setChangeStates(states);
  };

  const handleRejectAll = () => {
    if (!changePlan) return;
    const states: Record<string, 'proposed' | 'accepted' | 'rejected'> = {};
    changePlan.changes.forEach(c => { states[c.id] = 'rejected'; });
    setChangeStates(states);
  };

  const toggleChange = (id: string) => {
    setChangeStates(prev => ({
      ...prev,
      [id]: prev[id] === 'accepted' ? 'rejected' : 'accepted',
    }));
  };

  const handleApply = async () => {
    if (!changePlan) return;

    const acceptedIds = Object.entries(changeStates)
      .filter(([, state]) => state === 'accepted')
      .map(([id]) => id);

    if (acceptedIds.length === 0) {
      setError('Select at least one change to apply');
      return;
    }

    setViewState('applying');
    setError(null);

    try {
      const token = await getToken();
      const result = await applyAgentChanges(changePlan.sessionId, acceptedIds, token);
      setAppliedResult({ appliedCount: result.appliedCount, versionId: result.versionId });
      onContentUpdate?.(result.updatedContent);
      setViewState('done');
    } catch (err: any) {
      setError(err?.message || 'Failed to apply changes');
      setViewState('plan');
    }
  };

  const acceptedCount = Object.values(changeStates).filter(s => s === 'accepted').length;
  const totalChanges = changePlan?.changes.length || 0;

  const securityChanges = changePlan?.changes.filter(c => c.type === 'SECURITY_FIX') || [];
  const costChanges = changePlan?.changes.filter(c => c.type === 'COST_OPTIMIZATION') || [];
  const bestPracticeChanges = changePlan?.changes.filter(c => c.type === 'BEST_PRACTICE') || [];

  return (
    <div className={cn('flex flex-col h-full bg-slate-950', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-violet-400" />
            <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
          </div>
          <h2 className="font-bold text-lg">Agentic Automation</h2>
          {viewState === 'plan' && (
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium">
              {totalChanges} changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewState === 'idle' && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleAnalyze}
              leftIcon={<Zap className="w-4 h-4" />}
              className="bg-violet-600 hover:bg-violet-500"
            >
              Analyze & Fix
            </Button>
          )}
          {viewState === 'plan' && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleAnalyze}
              leftIcon={<Loader2 className="w-4 h-4" />}
              className="bg-slate-700 hover:bg-slate-600"
            >
              Re-analyze
            </Button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {/* Idle state */}
          {viewState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div className="p-4 rounded-full bg-violet-500/10 mb-4">
                <Bot className="w-12 h-12 text-violet-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Agentic Automation
              </h3>
              <p className="text-sm text-slate-500 max-w-xs mb-6">
                The agent will analyze your template, identify issues,
                and generate fixes you can review and apply.
              </p>
              <Button
                onClick={handleAnalyze}
                leftIcon={<Zap className="w-4 h-4" />}
                className="bg-violet-600 hover:bg-violet-500"
              >
                Start Agent Analysis (25 credits)
              </Button>
            </motion.div>
          )}

          {/* Analyzing state */}
          {viewState === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
                <Bot className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-slate-400 mb-1">Agent is analyzing your template...</p>
              <p className="text-xs text-slate-600">Running audit, cost analysis & generating fixes</p>
            </motion.div>
          )}

          {/* Error state */}
          {viewState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-400 mb-2">Analysis Failed</h3>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              <Button variant="outline" onClick={handleAnalyze}>
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Change Plan state */}
          {viewState === 'plan' && changePlan && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Score comparison */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Current</p>
                    <AuditScore score={changePlan.originalScore.security} size="sm" />
                    <p className="text-xs text-slate-400 mt-1">
                      ${changePlan.originalScore.cost.toFixed(0)}/mo
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ChevronRight className="w-5 h-5 text-violet-400" />
                    {changePlan.totalEstimatedSavings > 0 && (
                      <span className="text-xs text-emerald-400 font-medium">
                        -${changePlan.totalEstimatedSavings.toFixed(0)}/mo
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-violet-400 uppercase font-bold mb-1">Projected</p>
                    <AuditScore score={changePlan.projectedScore.security} size="sm" />
                    <p className="text-xs text-slate-400 mt-1">
                      ${changePlan.projectedScore.cost.toFixed(0)}/mo
                    </p>
                  </div>
                </div>
              </div>

              {/* Bulk actions */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  <span className="text-white font-medium">{acceptedCount}</span> of {totalChanges} changes selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Accept All
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    onClick={handleRejectAll}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Reject All
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Change groups */}
              {securityChanges.length > 0 && (
                <ChangeGroup
                  title="Security Fixes"
                  icon={<Shield className="w-4 h-4 text-red-400" />}
                  changes={securityChanges}
                  changeStates={changeStates}
                  expandedChange={expandedChange}
                  onToggle={toggleChange}
                  onExpand={setExpandedChange}
                />
              )}

              {costChanges.length > 0 && (
                <ChangeGroup
                  title="Cost Optimizations"
                  icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                  changes={costChanges}
                  changeStates={changeStates}
                  expandedChange={expandedChange}
                  onToggle={toggleChange}
                  onExpand={setExpandedChange}
                />
              )}

              {bestPracticeChanges.length > 0 && (
                <ChangeGroup
                  title="Best Practices"
                  icon={<Zap className="w-4 h-4 text-amber-400" />}
                  changes={bestPracticeChanges}
                  changeStates={changeStates}
                  expandedChange={expandedChange}
                  onToggle={toggleChange}
                  onExpand={setExpandedChange}
                />
              )}

              {/* Apply button */}
              <div className="sticky bottom-0 pt-4 pb-2 bg-slate-950">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-violet-600 hover:bg-violet-500"
                  onClick={handleApply}
                  disabled={acceptedCount === 0}
                  leftIcon={<Check className="w-5 h-5" />}
                >
                  Apply {acceptedCount} Change{acceptedCount !== 1 ? 's' : ''}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Applying state */}
          {viewState === 'applying' && (
            <motion.div
              key="applying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
              </div>
              <p className="text-slate-400">Applying changes to template...</p>
            </motion.div>
          )}

          {/* Done state */}
          {viewState === 'done' && appliedResult && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Changes Applied Successfully
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                {appliedResult.appliedCount} change{appliedResult.appliedCount !== 1 ? 's were' : ' was'} applied to your template.
                A version snapshot was saved automatically.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewState('idle');
                    setChangePlan(null);
                    setAppliedResult(null);
                  }}
                  leftIcon={<Undo2 className="w-4 h-4" />}
                >
                  Run Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ChangeGroup({
  title,
  icon,
  changes,
  changeStates,
  expandedChange,
  onToggle,
  onExpand,
}: {
  title: string;
  icon: React.ReactNode;
  changes: AgentChange[];
  changeStates: Record<string, string>;
  expandedChange: string | null;
  onToggle: (id: string) => void;
  onExpand: (id: string | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-bold text-slate-300">{title}</h4>
        <span className="text-xs text-slate-600">({changes.length})</span>
      </div>
      <div className="space-y-2">
        {changes.map(change => (
          <ChangeCard
            key={change.id}
            change={change}
            state={changeStates[change.id] || 'proposed'}
            isExpanded={expandedChange === change.id}
            onToggle={() => onToggle(change.id)}
            onExpand={() => onExpand(expandedChange === change.id ? null : change.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ChangeCard({
  change,
  state,
  isExpanded,
  onToggle,
  onExpand,
}: {
  change: AgentChange;
  state: string;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  const severityColors: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const isAccepted = state === 'accepted';

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isAccepted
          ? 'border-violet-500/30 bg-violet-500/5'
          : 'border-slate-800 bg-slate-900/30'
      )}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Accept/reject toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            isAccepted
              ? 'bg-violet-500 border-violet-500'
              : 'border-slate-600 hover:border-slate-400'
          )}
        >
          {isAccepted && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-slate-500">{change.policyCode}</span>
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', severityColors[change.severity] || severityColors.MEDIUM)}>
              {change.severity}
            </span>
          </div>
          <p className="text-sm text-slate-200 truncate">{change.title}</p>
          <p className="text-xs text-slate-500 truncate">{change.resourceRef}</p>
        </div>

        {/* Impact badges */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {change.impact.securityScoreChange > 0 && (
            <span className="text-[10px] text-emerald-400 font-medium">
              +{change.impact.securityScoreChange} pts
            </span>
          )}
          {change.impact.monthlyCostChange < 0 && (
            <span className="text-[10px] text-emerald-400 font-medium">
              -${Math.abs(change.impact.monthlyCostChange).toFixed(0)}/mo
            </span>
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={onExpand}
          className="flex-shrink-0 p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-500 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Expanded diff view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-slate-800/50">
              <p className="text-xs text-slate-400 mb-2">{change.description}</p>
              <div className="rounded-lg overflow-hidden border border-slate-800 max-h-64 overflow-auto">
                <ReactDiffViewer
                  oldValue={change.diff.before || '(no existing code)'}
                  newValue={change.diff.after}
                  splitView={false}
                  useDarkTheme={true}
                  hideLineNumbers={true}
                  styles={{
                    variables: {
                      dark: {
                        diffViewerBackground: 'transparent',
                        addedBackground: 'rgba(16, 185, 129, 0.1)',
                        addedColor: '#10b981',
                        removedBackground: 'rgba(239, 68, 68, 0.1)',
                        removedColor: '#ef4444',
                        wordAddedBackground: 'rgba(16, 185, 129, 0.25)',
                        wordRemovedBackground: 'rgba(239, 68, 68, 0.25)',
                        gutterBackground: '#020617',
                        gutterColor: '#475569',
                        codeFoldGutterBackground: '#0f172a',
                        codeFoldBackground: '#020617',
                        emptyLineBackground: '#020617',
                      },
                    },
                    contentText: {
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, Menlo, monospace',
                      lineHeight: '18px',
                    },
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
