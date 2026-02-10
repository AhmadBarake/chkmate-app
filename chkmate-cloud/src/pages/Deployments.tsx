import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  ChevronDown,
  Shield,
  DollarSign,
  FileCode,
  AlertTriangle,
  Clock,
  Server,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchDeployments,
  fetchDeploymentCredentials,
  fetchTemplates,
  runDeploymentPlan,
  runDeploymentApply,
  runDeploymentDestroy,
  DeploymentRecord,
  DeploymentCredential,
  Template,
} from '../lib/api';
import { cn } from '../lib/utils';
import { useToastActions } from '../context/ToastContext';
import Button from '../components/Button';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNING: { label: 'Planning', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  PLAN_READY: { label: 'Plan Ready', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  APPLYING: { label: 'Applying', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  SUCCEEDED: { label: 'Deployed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  FAILED: { label: 'Failed', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
  DESTROYING: { label: 'Destroying', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  DESTROYED: { label: 'Destroyed', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: <Trash2 className="w-3.5 h-3.5" /> },
};

export default function Deployments() {
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [credentials, setCredentials] = useState<DeploymentCredential[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeploy, setShowNewDeploy] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedCredential, setSelectedCredential] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');
  const [planning, setPlanning] = useState(false);
  const [expandedDeployment, setExpandedDeployment] = useState<string | null>(null);
  const { getToken } = useAuth();
  const toast = useToastActions();

  const REGIONS = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = await getToken();
      const [deps, creds, tmpls] = await Promise.all([
        fetchDeployments(undefined, token),
        fetchDeploymentCredentials(token),
        fetchTemplates(token),
      ]);
      setDeployments(deps);
      setCredentials(creds);
      setTemplates(tmpls);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlan() {
    if (!selectedTemplate || !selectedCredential) {
      toast.error('Select a template and credentials');
      return;
    }

    setPlanning(true);
    try {
      const token = await getToken();
      const result = await runDeploymentPlan(selectedTemplate, selectedCredential, selectedRegion, token);
      toast.success(`Plan complete: ${result.summary.add} to add, ${result.summary.change} to change, ${result.summary.destroy} to destroy`);
      setShowNewDeploy(false);
      await loadData();
      setExpandedDeployment(result.deploymentId);
    } catch (err: any) {
      toast.error(err?.message || 'Plan failed');
    } finally {
      setPlanning(false);
    }
  }

  async function handleApply(deploymentId: string) {
    try {
      const token = await getToken();
      await runDeploymentApply(deploymentId, token);
      toast.success('Deployment applied successfully');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Apply failed');
      await loadData();
    }
  }

  async function handleDestroy(deploymentId: string) {
    try {
      const token = await getToken();
      await runDeploymentDestroy(deploymentId, token);
      toast.success('Infrastructure destroyed');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Destroy failed');
      await loadData();
    }
  }

  const activeDeployments = deployments.filter(d => d.status === 'SUCCEEDED');
  const totalResources = activeDeployments.reduce((sum, d) => sum + d.resourceCount, 0);
  const totalCost = activeDeployments.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="w-7 h-7 text-violet-400" />
            <h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
          </div>
          <p className="text-sm text-slate-500">
            Deploy Terraform templates to your AWS accounts
          </p>
        </div>
        <Button
          onClick={() => setShowNewDeploy(!showNewDeploy)}
          leftIcon={<Play className="w-4 h-4" />}
          className="bg-violet-600 hover:bg-violet-500"
          disabled={credentials.length === 0}
        >
          New Deployment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Deployments" value={deployments.length.toString()} icon={<Rocket className="w-5 h-5 text-violet-400" />} />
        <StatCard label="Active" value={activeDeployments.length.toString()} icon={<CheckCircle className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Resources" value={totalResources.toString()} icon={<Server className="w-5 h-5 text-blue-400" />} />
        <StatCard label="Est. Cost" value={`$${totalCost.toFixed(0)}/mo`} icon={<DollarSign className="w-5 h-5 text-emerald-400" />} />
      </div>

      {/* New deployment form */}
      <AnimatePresence>
        {showNewDeploy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/70 border border-violet-500/20 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">New Deployment</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Credentials</label>
                  <select
                    value={selectedCredential}
                    onChange={e => setSelectedCredential(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">Select credentials...</option>
                    {credentials.filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowNewDeploy(false)}>Cancel</Button>
                <Button
                  onClick={handlePlan}
                  loading={planning}
                  className="bg-violet-600 hover:bg-violet-500"
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Run Plan (15 credits)
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {credentials.length === 0 && !loading && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-medium">No deployment credentials configured</p>
            <p className="text-xs text-slate-500">
              Go to <a href="/deploy/credentials" className="text-violet-400 hover:underline">Deployment Credentials</a> to add AWS deployment credentials first.
            </p>
          </div>
        </div>
      )}

      {/* Deployments list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : deployments.length === 0 ? (
        <div className="text-center py-20">
          <Rocket className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No deployments yet</h3>
          <p className="text-sm text-slate-600">
            Create a new deployment to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map((dep, index) => {
            const statusConfig = STATUS_CONFIG[dep.status] || STATUS_CONFIG.FAILED;
            const isExpanded = expandedDeployment === dep.id;

            return (
              <motion.div
                key={dep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
              >
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedDeployment(isExpanded ? null : dep.id)}
                >
                  <div className={cn('p-2.5 rounded-lg border', statusConfig.color)}>
                    {statusConfig.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCode className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm font-medium text-white truncate">
                        {dep.template?.name || 'Unknown'}
                      </span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{dep.credential?.name || 'Unknown'}</span>
                      <span>{new Date(dep.createdAt).toLocaleDateString()}</span>
                      {dep.resourceCount > 0 && <span>{dep.resourceCount} resources</span>}
                      {dep.estimatedCost != null && <span>${dep.estimatedCost.toFixed(0)}/mo</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {dep.status === 'PLAN_READY' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500"
                        onClick={() => handleApply(dep.id)}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Apply (30 credits)
                      </Button>
                    )}
                    {dep.status === 'SUCCEEDED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDestroy(dep.id)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Destroy
                      </Button>
                    )}
                  </div>

                  <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', isExpanded && 'rotate-180')} />
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-slate-800/50 space-y-3">
                        {dep.errorMessage && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                            {dep.errorMessage}
                          </div>
                        )}

                        {dep.planOutput?.summary && (
                          <div className="flex gap-4 text-sm">
                            <span className="text-emerald-400">+{dep.planOutput.summary.add} add</span>
                            <span className="text-amber-400">~{dep.planOutput.summary.change} change</span>
                            <span className="text-red-400">-{dep.planOutput.summary.destroy} destroy</span>
                          </div>
                        )}

                        {dep.planOutput?.auditScore != null && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Shield className="w-3.5 h-3.5 text-violet-400" />
                            Security Score: <span className="text-white font-medium">{dep.planOutput.auditScore}</span>/100
                            {dep.planOutput.auditIssues > 0 && (
                              <span className="text-amber-400">({dep.planOutput.auditIssues} issues)</span>
                            )}
                          </div>
                        )}

                        {(dep.applyOutput || dep.planOutput?.output) && (
                          <details className="text-xs">
                            <summary className="text-slate-500 cursor-pointer hover:text-slate-300">View output logs</summary>
                            <pre className="mt-2 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-400 overflow-auto max-h-60 font-mono text-[11px]">
                              {dep.applyOutput || dep.planOutput?.output}
                            </pre>
                          </details>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
