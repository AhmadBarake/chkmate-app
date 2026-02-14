import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket,
  Shield,
  DollarSign,
  BookOpen,
  ArrowRight,
  Server,
  AlertTriangle,
  CheckCircle2,
  Link,
  Zap,
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Button from '../components/Button';
import { fetchConnections, scanSavedConnection, CloudConnection, CloudScanResult } from '../lib/api';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import { cn } from '../lib/utils';

export default function SimplifiedDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [scanResult, setScanResult] = useState<CloudScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      if (!user) return;
      try {
        const token = await getToken();
        const conns = await fetchConnections(token);
        setConnections(conns);

        // Auto-scan the first active connection for overview
        const active = conns.find(c => c.status === 'ACTIVE');
        if (active) {
          const result = await scanSavedConnection(active.id, undefined, token);
          setScanResult(result);
        }
      } catch {
        // Silent - will show empty state
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [user, getToken]);

  const hasConnection = connections.some(c => c.status === 'ACTIVE');

  const quickActions = [
    {
      title: 'Deploy a Web App',
      description: 'Launch a React, Vue, or static site on AWS in minutes',
      icon: Rocket,
      color: 'brand',
      to: '/simple/deploy',
    },
    {
      title: 'Scan My Infrastructure',
      description: 'Get a security & cost overview of your AWS account',
      icon: Shield,
      color: 'violet',
      to: '/cloud-scanner',
    },
    {
      title: 'View Costs',
      description: "See what you're spending and where to save",
      icon: DollarSign,
      color: 'emerald',
      to: '/simple/costs',
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    brand: { bg: 'bg-brand-500/10', border: 'border-brand-500/20', text: 'text-brand-400', glow: 'bg-brand-500/5' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'bg-violet-500/5' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'bg-emerald-500/5' },
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
            Simplified View
          </div>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-brand-400">Chkmate</span>
        </h2>
        <p className="text-slate-400 mt-2 font-medium">Deploy, monitor, and optimize your cloud infrastructure — no Terraform knowledge needed.</p>
      </motion.div>

      {/* Quick Deploy Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {quickActions.map((action) => {
          const colors = colorMap[action.color];
          return (
            <motion.div
              key={action.title}
              variants={staggerItem}
              onClick={() => navigate(action.to)}
              className={cn(
                'bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl cursor-pointer group',
                'hover:border-slate-700 transition-all relative overflow-hidden'
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors', colors.glow, 'group-hover:opacity-150')} />
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300', colors.bg, colors.border, 'border')}>
                <action.icon className={cn('w-6 h-6', colors.text)} />
              </div>
              <h3 className="text-lg font-bold text-slate-50 mb-1 group-hover:text-brand-300 transition-colors">{action.title}</h3>
              <p className="text-sm text-slate-400 mb-4">{action.description}</p>
              <div className={cn('flex items-center gap-1 text-sm font-medium', colors.text)}>
                Get started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Resource Overview */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Infrastructure Overview</h3>
          {hasConnection && (
            <button
              onClick={() => navigate('/simple/resources')}
              className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View details <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !hasConnection ? (
          <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
            <Link className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium mb-1">No AWS account connected</p>
            <p className="text-sm text-slate-500 mb-4">Connect your account to see resources, costs, and security insights.</p>
            <Button
              onClick={() => navigate('/connections')}
              leftIcon={<Zap className="w-4 h-4" />}
              className="shadow-lg shadow-brand-500/20"
            >
              Connect AWS Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Server className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resources</p>
                  <p className="text-2xl font-black text-slate-50">{scanResult?.summary.totalResources ?? 0}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Total AWS resources discovered</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Monthly</p>
                  <p className="text-2xl font-black text-slate-50">
                    ${scanResult?.costBreakdown?.totalMonthly?.toFixed(0) ?? '—'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Estimated monthly cloud spend</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  {(scanResult?.summary.criticalIssues ?? 0) > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security</p>
                  <p className="text-2xl font-black text-slate-50">
                    {(scanResult?.summary.criticalIssues ?? 0) + (scanResult?.summary.highIssues ?? 0)} issues
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Critical + high severity findings</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Getting Started Guides */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Getting Started</h3>
          <button
            onClick={() => navigate('/simple/guides')}
            className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            All guides <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Deploy your first web app', desc: 'Step-by-step guide to deploying a React or static site', icon: Rocket, color: 'text-brand-400' },
            { title: 'Connect your AWS account', desc: 'Securely link your infrastructure in under 2 minutes', icon: Link, color: 'text-violet-400' },
            { title: 'Understand your cloud costs', desc: 'Learn where your money goes and how to optimize', icon: DollarSign, color: 'text-emerald-400' },
            { title: 'Secure your infrastructure', desc: 'Review findings and apply recommended fixes', icon: Shield, color: 'text-amber-400' },
          ].map((guide) => (
            <motion.div
              key={guide.title}
              onClick={() => navigate('/simple/guides')}
              className="flex items-center gap-4 bg-slate-900/30 border border-slate-800 p-4 rounded-xl hover:bg-slate-900/50 transition-colors cursor-pointer group"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <guide.icon className={cn('w-5 h-5', guide.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm group-hover:text-brand-300 transition-colors">{guide.title}</p>
                <p className="text-xs text-slate-500 truncate">{guide.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
