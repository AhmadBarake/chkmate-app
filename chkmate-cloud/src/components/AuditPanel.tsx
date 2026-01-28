import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  ChevronRight,
  DollarSign,
  Lock,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { runAudit, AuditResult, AuditViolation } from '../lib/api';
import AuditScore from './AuditScore';
import ViolationCard, { ViolationSummary } from './ViolationCard';
import Button from './Button';

interface AuditPanelProps {
  content: string;
  provider: string;
  templateId?: string;
  onClose?: () => void;
  className?: string;
}

type TabType = 'all' | 'security' | 'cost';

export default function AuditPanel({
  content,
  provider,
  templateId,
  onClose,
  className,
}: AuditPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const handleRunAudit = async () => {
    setLoading(true);
    setError(null);

    try {
      const auditResult = await runAudit(content, provider, templateId);
      setResult(auditResult);
    } catch (err) {
      console.error('Audit failed:', err);
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  // Filter violations by category
  const filteredViolations = result?.violations.filter(v => {
    if (activeTab === 'all') return true;
    if (activeTab === 'security') return v.category === 'SECURITY';
    if (activeTab === 'cost') return v.category === 'COST';
    return true;
  }) || [];

  // Count by category
  const securityCount = result?.violations.filter(v => v.category === 'SECURITY')
    .reduce((acc, v) => acc + v.results.length, 0) || 0;
  const costCount = result?.violations.filter(v => v.category === 'COST')
    .reduce((acc, v) => acc + v.results.length, 0) || 0;

  return (
    <div className={cn('flex flex-col h-full bg-slate-950', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <h2 className="font-bold text-lg">Security & Cost Audit</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleRunAudit}
            loading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {result ? 'Re-scan' : 'Run Audit'}
          </Button>
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
          {!result && !loading && !error && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div className="p-4 rounded-full bg-slate-900/50 mb-4">
                <ShieldCheck className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Ready to Audit
              </h3>
              <p className="text-sm text-slate-500 max-w-xs mb-6">
                Scan your Terraform template for security vulnerabilities 
                and cost optimization opportunities
              </p>
              <Button
                onClick={handleRunAudit}
                leftIcon={<Shield className="w-4 h-4" />}
              >
                Start Audit
              </Button>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-brand-500/30" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
              </div>
              <p className="text-slate-400">Analyzing template...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-400 mb-2">Audit Failed</h3>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              <Button variant="outline" onClick={handleRunAudit}>
                Try Again
              </Button>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score section */}
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center gap-6">
                  <AuditScore score={result.summary.score} size="lg" />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Audit Complete</h3>
                    <ViolationSummary
                      criticalCount={result.summary.criticalCount}
                      highCount={result.summary.highCount}
                      mediumCount={result.summary.mediumCount}
                      lowCount={result.summary.lowCount}
                    />
                    <p className="text-sm text-slate-400 mt-2">
                      {result.summary.passedChecks} checks passed • {result.summary.totalIssues} issues found
                    </p>
                  </div>
                </div>
              </div>

              {/* Projected Cost Section */}
              {result.costBreakdown && result.costBreakdown.totalMonthly > 0 && (
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Projected Monthly Cost</h3>
                    <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      ESTIMATED
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">${result.costBreakdown.totalMonthly.toFixed(2)}</span>
                    <span className="text-slate-500 text-xs">/ month</span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(result.costBreakdown.byService).map(([service, cost]) => (
                      <div key={service} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-tight text-[11px] font-bold">{service}</span>
                        </div>
                        <span className="text-sm font-mono text-slate-300">${cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 italic">
                      Estimate based on standard on-demand pricing in us-east-1. Actual costs may vary based on usage patterns and regions.
                    </p>
                  </div>
                </div>
              )}

              {/* Category tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === 'all' 
                      ? 'bg-brand-500/20 text-brand-300' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  All ({result.summary.totalIssues})
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === 'security' 
                      ? 'bg-red-500/20 text-red-300' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Security ({securityCount})
                </button>
                <button
                  onClick={() => setActiveTab('cost')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === 'cost' 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Cost ({costCount})
                </button>
              </div>

              {/* Violations list */}
              <div className="space-y-3">
                {filteredViolations.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p>No issues in this category</p>
                  </div>
                ) : (
                  filteredViolations.map((violation, index) => (
                    <ViolationCard
                      key={`${violation.policyCode}-${index}`}
                      policyCode={violation.policyCode}
                      policyName={violation.policyName}
                      severity={violation.severity}
                      results={violation.results}
                      defaultExpanded={index === 0}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
