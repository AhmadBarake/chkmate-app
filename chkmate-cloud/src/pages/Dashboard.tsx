import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Folder, FileCode, Zap, TrendingUp, Plus, ArrowRight, Shield, Cloud, CheckCircle2, Circle } from 'lucide-react';
import { fetchProjects, fetchTemplates, fetchConnections, scanSavedConnection, Project, Template, CloudScanResult } from '../lib/api';
import { parseError } from '../lib/errors';
import { useToastActions } from '../context/ToastContext';
import { SkeletonStatsCard, SkeletonCard } from '../components/Skeleton';
import Button from '../components/Button';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import { formatRelativeTime, cn } from '../lib/utils';
import { useAuth, useUser } from '@clerk/clerk-react';

interface DashboardStats {
  totalProjects: number;
  totalTemplates: number;
  generationsUsed: number;
  generationsLimit: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToastActions();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTemplates: 0,
    generationsUsed: 0,
    generationsLimit: 5, // Hobby plan default
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<Template[]>([]);
  const [cloudData, setCloudData] = useState<CloudScanResult | null>(null);
  const [hasConnection, setHasConnection] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      if (!user) return;
      const token = await getToken();
      
      // Parallel fetch
      const [projects, templates, connections] = await Promise.all([
        fetchProjects(token),
        fetchTemplates(token),
        fetchConnections(token)
      ]);

      setStats({
        totalProjects: projects.length,
        totalTemplates: templates.length,
        generationsUsed: templates.length, // Approximation for now
        generationsLimit: 5,
      });

      setRecentProjects(projects.slice(0, 3));
      setRecentTemplates(templates.slice(0, 3));
      setHasConnection(connections.length > 0);

      // Try to get cloud data if connection exists
      if (connections.length > 0) {
        // Use first active connection
        const activeConn = connections.find(c => c.status === 'ACTIVE') || connections[0];
        try {
          const scan = await scanSavedConnection(activeConn.id, undefined, token); // Default region
          setCloudData(scan);
        } catch (err) {
          console.warn("Failed to fetch scan data for dashboard", err);
        }
      }

    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const usagePercentage = Math.min(
    (stats.generationsUsed / stats.generationsLimit) * 100,
    100
  );

  const getUsageColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 70) return 'bg-amber-500';
    return 'bg-brand-500';
  };
  
  // Progress Steps
  const steps = [
      { label: "Connect Cloud Account", completed: hasConnection, link: "/connections" },
      { label: "Create Project", completed: stats.totalProjects > 0, link: "/projects" },
      { label: "Generate Blueprint", completed: stats.totalTemplates > 0, link: "/projects" }, // leads to projects to start
      { label: "Run Security Scan", completed: !!cloudData, link: "/cloud-scanner" }
  ];
  
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 uppercase tracking-widest">
              Standard Account
            </div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">{user?.firstName || 'Builder'}</span>
          </h2>
          <p className="text-slate-400 mt-2 font-medium">
             {cloudData 
               ? `Your cloud infrastructure has ${cloudData.summary.criticalIssues} critical issues.` 
               : "Your cloud infrastructure landscape is awaiting analysis."}
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-3">
             <Button
                onClick={() => navigate('/cloud-scanner')}
                variant="secondary"
                leftIcon={<Cloud className="w-4 h-4" />}
             >
                Scan Cloud
             </Button>
             <Button
                onClick={() => navigate('/projects')}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shadow-lg shadow-brand-500/20"
             >
                New Project
             </Button>
        </motion.div>
      </div>

      {/* Getting Started Tracker (Only show if not complete) */}
      {completedSteps < steps.length && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 relative overflow-hidden"
          >
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                   <Zap className="w-4 h-4 text-brand-400" />
                   Getting Started
                </h3>
                <span className="text-xs font-bold text-slate-500">{completedSteps} / {steps.length} Complete</span>
             </div>
             
             <div className="w-full bg-slate-800/50 rounded-full h-1.5 mb-6">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {steps.map((step, i) => (
                   <div 
                      key={i} 
                      onClick={() => !step.completed && navigate(step.link)}
                      className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          step.completed 
                             ? "bg-slate-900/50 border-emerald-500/20 text-emerald-400 cursor-default"
                             : "bg-slate-800/20 border-slate-700/50 hover:bg-slate-800/40 hover:border-brand-500/30 cursor-pointer"
                      )}
                   >
                      {step.completed ? (
                         <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      ) : (
                         <Circle className="w-5 h-5 flex-shrink-0 text-slate-600" />
                      )}
                      <span className={cn("text-xs font-bold", step.completed ? "text-slate-300" : "text-slate-400")}>
                         {step.label}
                      </span>
                   </div>
                ))}
             </div>
          </motion.div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatsCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Projects Card */}
          <motion.div
            variants={staggerItem}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl group hover:border-brand-500/30 transition-all relative overflow-hidden cursor-pointer"
            onClick={() => navigate('/projects')}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                <Folder className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-black">{stats.totalProjects}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Active Projects</p>
          </motion.div>

          {/* Cost Overview (Real Data) */}
          <motion.div
            variants={staggerItem}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl group hover:border-emerald-500/30 transition-all relative overflow-hidden cursor-pointer"
            onClick={() => navigate('/cost-control')}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              {cloudData && (
                 <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold tracking-widest">
                    LIVE
                 </span>
              )}
            </div>
            <p className="text-4xl font-black">
               {cloudData ? `$${cloudData.costBreakdown?.totalMonthly.toFixed(0)}` : '$0'}
            </p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Est. Monthly Cost</p>
          </motion.div>

          {/* Security Summary (Real Data) */}
          <motion.div
            variants={staggerItem}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl group hover:border-red-500/30 transition-all relative overflow-hidden cursor-pointer"
            onClick={() => navigate('/cloud-scanner')}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-red-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-black">
               {cloudData ? cloudData.summary.criticalIssues : 0}
            </p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Critical Issues</p>
          </motion.div>
          
           {/* Blueprints / Usage */}
          <motion.div
            variants={staggerItem}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl group hover:border-purple-500/30 transition-all relative overflow-hidden cursor-pointer"
            onClick={() => navigate('/blueprints')}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-purple-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <FileCode className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-black">{stats.totalTemplates}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Blueprints</p>
          </motion.div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Projects</h3>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} lines={1} />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-xl p-8 text-center">
              <Folder className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No projects yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/projects')}
              >
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <motion.div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl hover:bg-slate-900/50 transition-colors cursor-pointer group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Folder className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-brand-300 transition-colors truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatRelativeTime(project.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Templates */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Blueprints</h3>
            <button
              onClick={() => navigate('/blueprints')}
              className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} lines={1} />
              ))}
            </div>
          ) : recentTemplates.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-xl p-8 text-center">
              <FileCode className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No blueprints yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/projects')}
              >
                Generate your first blueprint
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  onClick={() =>
                    navigate(
                      `/projects/${template.projectId}/templates/${template.id}`
                    )
                  }
                  className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl hover:bg-slate-900/50 transition-colors cursor-pointer group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <FileCode className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-brand-300 transition-colors truncate">
                        {template.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="uppercase">{template.provider}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(template.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
