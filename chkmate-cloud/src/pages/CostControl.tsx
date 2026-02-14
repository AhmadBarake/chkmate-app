import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Zap,
  HardDrive,
  Database,
  Globe,
  Smartphone,
  Server,
  Box,
  Plus
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import Button from '../components/Button';
import { fetchConnections, scanSavedConnection, CloudConnection, CloudScanResult } from '../lib/api';
import { fadeInUp } from '../lib/animations';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-west-2', label: 'Europe (London)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'me-south-1', label: 'Middle East (Bahrain)' },
];

import { useAuth, useUser } from '@clerk/clerk-react';

export default function CostControl() {
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east-1');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [scanResult, setScanResult] = useState<CloudScanResult | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    loadConnections();
  }, [user]);

  useEffect(() => {
    if (selectedConnectionId) {
      handleSync();
    }
  }, [selectedConnectionId, user]);

  const loadConnections = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const conns = await fetchConnections(token);
      setConnections(conns);
      if (conns.length > 0) {
        setSelectedConnectionId(conns[0].id);
      }
    } catch (err) {
      console.error("Failed to load connections", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedConnectionId || !user) return;
    setSyncing(true);
    try {
      const token = await getToken();
      const result = await scanSavedConnection(selectedConnectionId, selectedRegion, token);
      setScanResult(result);
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const chartData = useMemo(() => {
    if (!scanResult?.costBreakdown?.byService) return [];
    return Object.entries(scanResult.costBreakdown.byService).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [scanResult]);

  // Use real cost trend data from Cost Explorer, or show current month only
  const trendData = scanResult?.costTrend && scanResult.costTrend.length > 0
    ? scanResult.costTrend
    : scanResult?.costBreakdown?.totalMonthly
      ? [{ name: 'Current', cost: scanResult.costBreakdown.totalMonthly }]
      : [];

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('ec2')) return <Server className="w-4 h-4" />;
    if (n.includes('s3')) return <HardDrive className="w-4 h-4" />;
    if (n.includes('rds')) return <Database className="w-4 h-4" />;
    if (n.includes('lambda')) return <Zap className="w-4 h-4" />;
    if (n.includes('dynamo')) return <Globe className="w-4 h-4" />;
    return <Box className="w-4 h-4" />;
  };

  const hasData = scanResult && connections.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Cost Control Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Analyze, monitor and optimize your cloud spending.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          <select 
            value={selectedConnectionId}
            onChange={(e) => setSelectedConnectionId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-brand-500"
            disabled={syncing || connections.length === 0}
          >
            {connections.length === 0 ? <option>No Connections</option> : connections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-brand-500"
            disabled={syncing}
          >
            {AWS_REGIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <Button 
            onClick={handleSync} 
            loading={syncing}
            disabled={connections.length === 0}
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {!hasData && !loading ? (
         <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 relative">
               <DollarSign className="w-8 h-8 text-slate-500" />
               <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border border-slate-900">
                  <Plus className="w-3 h-3 text-slate-50" />
               </div>
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-2">No Cost Data Available</h3>
            <p className="text-slate-400 max-w-sm text-center mb-8">
               {connections.length === 0 
                 ? "Connect your cloud provider to start tracking costs and optimizing your spending." 
                 : "Select a connection and region to view cost insights."}
            </p>
            
            {connections.length === 0 && (
               <Button
                  onClick={() => window.location.href = '/connections'}
                  leftIcon={<Zap className="w-4 h-4" />}
               >
                  Connect Cloud Account
               </Button>
            )}
            
            {connections.length > 0 && (
               <Button
                  onClick={handleSync}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
               >
                  Run Cost Analysis
               </Button>
            )}
         </div>
      ) : (
      <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Monthly Forecast</div>
          <div className="text-3xl font-bold text-slate-50 mb-2">
            ${scanResult?.costBreakdown?.totalMonthly?.toFixed(2) || '0.00'}
          </div>
          {scanResult?.costTrend && scanResult.costTrend.length >= 2 && (() => {
            const latest = scanResult.costTrend[scanResult.costTrend.length - 1].cost;
            const prev = scanResult.costTrend[scanResult.costTrend.length - 2].cost;
            const change = prev > 0 ? ((latest - prev) / prev * 100) : 0;
            return (
              <div className={cn("flex items-center gap-1.5 text-xs", change > 0 ? "text-red-400" : "text-emerald-400")}>
                {change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change > 0 ? '+' : ''}{change.toFixed(1)}% from last month
              </div>
            );
          })()}
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Savings</div>
          <div className="text-3xl font-bold text-emerald-400 mb-2">
            ${scanResult?.summary?.estimatedMonthlySavings?.toFixed(2) || '0.00'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingDown className="w-3.5 h-3.5" /> Potential optimization
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active Resources</div>
          <div className="text-3xl font-bold text-slate-50 mb-2">{scanResult?.summary.totalResources || 0}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Server className="w-3.5 h-3.5" /> Infrastructure footprint
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Optimization Rate</div>
          <div className="text-3xl font-bold text-brand-400 mb-2">
            {scanResult ? Math.max(0, 100 - (scanResult.summary.estimatedMonthlySavings / (scanResult.costBreakdown?.totalMonthly || 1) * 100)).toFixed(0) : 0}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand-400">
            <Zap className="w-3.5 h-3.5" /> Efficiency score
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Service Chart */}
        <div className="lg:col-span-1 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold mb-6 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-brand-400" />
            Cost Distribution
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
             {chartData.map((entry, index) => (
               <div key={entry.name} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2 text-slate-400">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   {entry.name}
                 </div>
                 <div className="font-mono text-slate-200">${entry.value.toFixed(2)}</div>
               </div>
             ))}
          </div>
        </div>

        {/* Cost Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              Spending Trend
            </h3>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
               Last {trendData.length} Months
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                   formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Cost']}
                />
                <Area type="monotone" dataKey="cost" stroke="#6366f1" fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Opportunities */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
           <h3 className="text-base font-bold mb-4 flex items-center gap-2">
             <TrendingDown className="w-4 h-4 text-emerald-400" />
             Savings Opportunities
           </h3>
           <div className="space-y-3">
             {scanResult?.costOpportunities.map((opt, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/30 transition-colors group">
                   <div className="flex items-start justify-between">
                     <div className="flex gap-3">
                       <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                         {getServiceIcon(opt.resourceType)}
                       </div>
                       <div>
                         <div className="font-medium text-sm text-slate-200">{opt.recommendation}</div>
                         <div className="text-xs text-slate-500 mt-0.5">{opt.resourceType} • {opt.resourceId}</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-bold text-emerald-400">
                         Save ${opt.potentialSavings.toFixed(2)}
                       </div>
                       <div className="text-[10px] text-slate-600">per month</div>
                     </div>
                   </div>
                </div>
             ))}
             {(!scanResult || scanResult.costOpportunities.length === 0) && (
               <div className="text-center py-8 text-slate-500 text-sm italic">
                  No optimization opportunities found currently.
               </div>
             )}
           </div>
        </div>

        {/* Budget Alerts & Policy */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
           <h3 className="text-base font-bold mb-4 flex items-center gap-2">
             <Zap className="w-4 h-4 text-brand-400" />
             Cost Governance
           </h3>
           <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">Monthly Budget</span>
                    <span className="text-xs font-mono text-slate-500">$500.00</span>
                 </div>
                 <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (scanResult?.costBreakdown?.totalMonthly || 0) / 500 * 100)}%` }}
                    />
                 </div>
                 <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                    <span>${scanResult?.costBreakdown?.totalMonthly?.toFixed(2) || '0.00'} used</span>
                    <span>{((scanResult?.costBreakdown?.totalMonthly || 0) / 500 * 100).toFixed(1)}%</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                       <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Next Review</div>
                       <div className="text-xs font-bold">{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
                    </div>
                 </div>
                 <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                       <Zap className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Autofix</div>
                       <div className="text-xs font-bold text-emerald-500">Enabled</div>
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-brand-500/5 rounded-xl border border-brand-500/10">
                 <h4 className="text-xs font-bold text-brand-400 mb-2 flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    Export Cost Report
                 </h4>
                 <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                    Generate a detailed PDF or CSV report of your cloud expenditures and potential optimization recommendations.
                 </p>
                 <Button variant="secondary" size="sm" className="w-full text-[10px] h-8">
                    Generate Report
                 </Button>
              </div>
           </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
