import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Loader2,
  Link,
  Zap,
  Sparkles,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth, useUser } from '@clerk/clerk-react';
import Button from '../components/Button';
import {
  fetchConnections,
  scanSavedConnection,
  fetchRecommendations,
  CloudConnection,
  CloudScanResult,
  Recommendation,
} from '../lib/api';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import { cn } from '../lib/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#a855f7'];

export default function SimpleCosts() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [scanResult, setScanResult] = useState<CloudScanResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const token = await getToken();
        const conns = await fetchConnections(token);
        setConnections(conns);

        const active = conns.find(c => c.status === 'ACTIVE');
        if (active) {
          const [scan, recs] = await Promise.all([
            scanSavedConnection(active.id, undefined, token),
            fetchRecommendations(active.id, token).catch(() => [] as Recommendation[]),
          ]);
          setScanResult(scan);
          setRecommendations(recs.filter(r => r.type === 'COST' && r.status === 'OPEN'));
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, getToken]);

  const hasConnection = connections.some(c => c.status === 'ACTIVE');
  const totalMonthly = scanResult?.costBreakdown?.totalMonthly ?? 0;
  const byService = scanResult?.costBreakdown?.byService ?? {};
  const costTrend = scanResult?.costTrend ?? [];

  // Prepare pie chart data
  const pieData = Object.entries(byService)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalSavings = recommendations.reduce((sum, r) => sum + (r.impact.savings ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Cost <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-brand-400">Overview</span>
        </h2>
        <p className="text-slate-400 mt-1 font-medium">Understand your cloud spending at a glance.</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !hasConnection ? (
        <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
          <Link className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium mb-1">No AWS account connected</p>
          <p className="text-sm text-slate-500 mb-4">Connect your account to see cost breakdowns and savings opportunities.</p>
          <Button onClick={() => navigate('/connections')} leftIcon={<Zap className="w-4 h-4" />}>
            Connect AWS Account
          </Button>
        </div>
      ) : (
        <>
          {/* Big Numbers */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div
              variants={staggerItem}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Monthly Spend</p>
              </div>
              <p className="text-4xl font-black text-white">${totalMonthly.toFixed(0)}</p>
              <p className="text-xs text-slate-500 mt-1">Based on current resource usage</p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Potential Savings</p>
              </div>
              <p className="text-4xl font-black text-emerald-400">${totalSavings.toFixed(0)}</p>
              <p className="text-xs text-slate-500 mt-1">{recommendations.length} optimization{recommendations.length !== 1 ? 's' : ''} available</p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <PieChartIcon className="w-5 h-5 text-brand-400" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Services</p>
              </div>
              <p className="text-4xl font-black text-white">{pieData.length}</p>
              <p className="text-xs text-slate-500 mt-1">Active AWS services with cost</p>
            </motion.div>
          </motion.div>

          {/* Cost Breakdown + Top Savings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <h3 className="text-lg font-semibold mb-4">Spend by Service</h3>
              {pieData.length > 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          formatter={(value: number) => `$${value.toFixed(2)}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {pieData.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                        <span className="text-slate-400 truncate">{item.name}</span>
                        <span className="font-bold text-slate-300 ml-auto">${item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                  <p className="text-slate-500 text-sm">No cost data available yet. Run a scan to see breakdowns.</p>
                </div>
              )}
            </motion.div>

            {/* Top Savings Recommendations */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Savings Opportunities</h3>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.slice(0, 5).map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-white">{rec.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{rec.description}</p>
                        </div>
                        {rec.impact.savings && (
                          <span className="text-sm font-black text-emerald-400 shrink-0">
                            -${rec.impact.savings.toFixed(0)}/mo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                          rec.effort === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' :
                          rec.effort === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        )}>
                          {rec.effort} effort
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-400 text-sm font-medium">No cost recommendations yet</p>
                  <p className="text-xs text-slate-500 mt-1">Generate recommendations from the Smart Advice page.</p>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/recommendations')}>
                    Get Recommendations
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Link to Full Cost Control */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Need more detail?</p>
              <p className="text-sm text-slate-400">Switch to Full mode for the complete Cost Control dashboard with trends, filters, and export.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/cost-control')}>
              Full Cost Control <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
