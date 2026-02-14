import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Filter,
  DollarSign,
  Shield,
  Zap,
  Clock
} from 'lucide-react';
import Button from '../components/Button';
import RecommendationCard from '../components/RecommendationCard';
import {
    CloudConnection,
    fetchConnections,
    fetchRecommendations,
    generateRecommendations,
    dismissRecommendation as dismissRecommendationAPI,
    syncConnection,
    Recommendation
} from '../lib/api';
import { cn } from '../lib/utils';

// Common AWS regions
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

export default function Recommendations() {
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east-1');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COST' | 'SECURITY' | 'RELIABILITY'>('ALL');
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    loadConnections();
  }, [user]);

  useEffect(() => {
      if (selectedConnectionId) {
          loadRecommendations(selectedConnectionId);
      } else {
          setRecommendations([]);
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
        setIsLoading(false);
    }
  };

  const loadRecommendations = async (connId: string) => {
      if (!user) return;
      try {
          const token = await getToken();
          const recs = await fetchRecommendations(connId, token);
          setRecommendations(recs);
      } catch (err) {
          console.error("Failed to fetch recommendations", err);
      }
  };

  const handleAnalyze = async () => {
      if (!selectedConnectionId || !user) return;
      setIsAnalyzing(true);
      try {
          const token = await getToken();
          // First sync resources from selected region, then generate recommendations
          await syncConnection(selectedConnectionId, selectedRegion, token);
          const recs = await generateRecommendations(selectedConnectionId, token);
          setRecommendations(recs);
      } catch (err) {
          console.error("Analysis failed", err);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleDismiss = async (id: string) => {
      // Optimistic update
      setRecommendations(prev => prev.filter(r => r.id !== id));
      try {
          const token = await getToken();
          await dismissRecommendationAPI(selectedConnectionId, id, token);
      } catch (err) {
          console.error("Failed to dismiss recommendation", err);
          // Reload to restore if the API call failed
          if (selectedConnectionId) loadRecommendations(selectedConnectionId);
      }
  };

  const filteredRecs = recommendations.filter(r => {

      if (filter === 'ALL') return true;
      return r.type === filter;
  });

  const stats = {
      savings: recommendations.reduce((acc, r) => acc + (r.impact.savings || 0), 0),
      critical: recommendations.filter(r => r.impact.risk === 'high' || r.impact.risk === 'critical').length,
      total: recommendations.length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">


      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              Smart Recommendations
            </h1>
            <p className="text-slate-400 mt-1">
              AI-driven insights to optimize your infrastructure cost, security, and performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <select 
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-brand-500"
                disabled={isAnalyzing}
             >
                 {connections.map(c => (
                     <option key={c.id} value={c.id}>{c.name} ({c.provider})</option>
                 ))}
                 {connections.length === 0 && <option value="">No connections</option>}
             </select>

             <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-brand-500"
                disabled={isAnalyzing}
             >
                 {AWS_REGIONS.map(r => (
                     <option key={r.value} value={r.value}>{r.label}</option>
                 ))}
             </select>

             <Button 
                onClick={handleAnalyze} 
                loading={isAnalyzing}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                variant="primary"
             >
                 {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-4 -mt-4" />
                <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Potential Savings
                </p>
                <div className="text-3xl font-bold text-slate-50">${stats.savings.toFixed(2)}<span className="text-sm text-slate-500 font-normal">/mo</span></div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-4 -mt-4" />
                <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Critical Risks
                </p>
                <div className="text-3xl font-bold text-slate-50">{stats.critical}</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl -mr-4 -mt-4" />
                <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-400" /> Open Opportunities
                </p>
                <div className="text-3xl font-bold text-slate-50">{stats.total}</div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
                { id: 'ALL', label: 'All Items' },
                { id: 'COST', label: 'Cost Savings', icon: DollarSign },
                { id: 'SECURITY', label: 'Security', icon: Shield },
                { id: 'RELIABILITY', label: 'Reliability', icon: Zap },
            ].map(f => {
                const Icon = f.icon;
                return (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            filter === f.id 
                                ? "bg-brand-500 text-black border-brand-500" 
                                : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                        )}
                    >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {f.label}
                    </button>
                );
            })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode='popLayout'>
                {filteredRecs.map(rec => (
                    <motion.div
                        key={rec.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <RecommendationCard 
                            recommendation={rec} 
                            onDismiss={handleDismiss} 
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {filteredRecs.length === 0 && !isLoading && (
                <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">All Good!</h3>
                    <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                        We didn't find any {filter !== 'ALL' ? filter.toLowerCase() : ''} issues in your infrastructure. 
                        Run an analysis specifically if you haven't recently.
                    </p>
                </div>
            )}
        </div>

      </main>
    </div>
  );
}
