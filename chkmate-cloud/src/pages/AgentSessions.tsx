import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Shield,
  DollarSign,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { fetchAgentSessions, AgentSession } from '../lib/api';
import { cn } from '../lib/utils';
import Button from '../components/Button';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNING: { label: 'Planning', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  REVIEWING: { label: 'Reviewing', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  APPLYING: { label: 'Applying', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  COMPLETED: { label: 'Completed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AgentSessions() {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const data = await fetchAgentSessions(undefined, token);
        setSessions(data);
      } catch (err) {
        console.error('Failed to load agent sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
  const activeSessions = sessions.filter(s => ['PLANNING', 'REVIEWING', 'APPLYING'].includes(s.status));
  const totalSavings = completedSessions.reduce((sum, s) => sum + s.totalSavings, 0);
  const totalChangesApplied = completedSessions.reduce(
    (sum, s) => sum + (s.appliedChanges?.length || 0), 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Bot className="w-7 h-7 text-violet-400" />
              <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Agent History</h1>
          </div>
          <p className="text-sm text-slate-500">
            View all agent analysis sessions and applied changes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={sessions.length.toString()}
          icon={<Bot className="w-5 h-5 text-violet-400" />}
        />
        <StatCard
          label="Active"
          value={activeSessions.length.toString()}
          icon={<Loader2 className="w-5 h-5 text-blue-400" />}
        />
        <StatCard
          label="Changes Applied"
          value={totalChangesApplied.toString()}
          icon={<Shield className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Est. Savings"
          value={`$${totalSavings.toFixed(0)}/mo`}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <Bot className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No agent sessions yet</h3>
          <p className="text-sm text-slate-600 mb-6">
            Open a template in the Builder and use the "Agent Fix" button to start
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <SessionCard key={session.id} session={session} index={index} />
          ))}
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

function SessionCard({ session, index }: { session: AgentSession; index: number }) {
  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.CANCELLED;
  const changesCount = session.changePlan?.length || 0;
  const appliedCount = session.appliedChanges?.length || 0;
  const date = new Date(session.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group"
    >
      <div className="flex items-center gap-4">
        {/* Status icon */}
        <div className={cn('p-2.5 rounded-lg border', statusConfig.color)}>
          {statusConfig.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm font-medium text-white truncate">
              {session.template?.name || 'Unknown Template'}
            </span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', statusConfig.color)}>
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {changesCount > 0 && (
              <span>{changesCount} changes proposed</span>
            )}
            {appliedCount > 0 && (
              <span className="text-emerald-500">{appliedCount} applied</span>
            )}
            {session.totalSavings > 0 && (
              <span className="text-emerald-400">-${session.totalSavings.toFixed(0)}/mo savings</span>
            )}
          </div>
        </div>

        {/* Score change */}
        {session.originalScore && session.projectedScore && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{session.originalScore.security.toFixed(0)}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400 font-medium">{session.projectedScore.security.toFixed(0)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
