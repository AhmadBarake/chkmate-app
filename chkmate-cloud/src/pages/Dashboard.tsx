import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Folder, FileCode, Zap, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { fetchProjects, fetchTemplates, Project, Template } from '../lib/api';
import { parseError } from '../lib/errors';
import { useToastActions } from '../context/ToastContext';
import { SkeletonStatsCard, SkeletonCard } from '../components/Skeleton';
import Button from '../components/Button';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import { formatRelativeTime, cn } from '../lib/utils';

interface DashboardStats {
  totalProjects: number;
  totalTemplates: number;
  generationsUsed: number;
  generationsLimit: number;
}

import { useAuth, useUser } from '@clerk/clerk-react';

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

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      if (!user) return;
      const token = await getToken();
      const [projects, templates] = await Promise.all([
        fetchProjects(token),
        fetchTemplates(token),
      ]);

      setStats({
        totalProjects: projects.length,
        totalTemplates: templates.length,
        generationsUsed: templates.length, // Approximation for now
        generationsLimit: 5,
      });

      setRecentProjects(projects.slice(0, 3));
      setRecentTemplates(templates.slice(0, 3));
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
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Builder</span>
          </h2>
          <p className="text-slate-400 mt-2 font-medium">Your cloud infrastructure landscape is secure and operational.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Button
            onClick={() => navigate('/projects')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-lg shadow-brand-500/20"
          >
            New Project
          </Button>
        </motion.div>
      </div>

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
          <motion.div
            variants={staggerItem}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl group hover:border-brand-500/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                <Folder className="w-6 h-6" />
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold tracking-widest flex items-center gap-1 uppercase">
                <TrendingUp className="w-3 h-3" />
                Live
              </span>
            </div>
            <p className="text-4xl font-black">{stats.totalProjects}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Active Projects</p>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl group hover:border-purple-500/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-purple-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <FileCode className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-black">{stats.totalTemplates}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">IaC Blueprints</p>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl col-span-1 md:col-span-2 group hover:border-amber-500/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Resource Consumption</p>
                  <p className="text-3xl font-black">
                    {stats.generationsUsed}
                    <span className="text-lg font-bold text-slate-600">
                      {' '}/ {stats.generationsLimit}
                    </span>
                  </p>
                </div>
              </div>
              {usagePercentage >= 70 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white"
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getUsageColor()} shadow-[0_0_10px_rgba(245,158,11,0.3)]`}
                initial={{ width: 0 }}
                animate={{ width: `${usagePercentage}%` }}
                transition={{ duration: 0.8, ease: 'circOut' }}
              />
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-tight text-slate-500">
              <span>Hobby Tier</span>
              <span className={cn(usagePercentage > 80 ? "text-amber-500" : "")}>
                {stats.generationsLimit - stats.generationsUsed} Units Remaining
              </span>
            </div>
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
            <h3 className="text-lg font-semibold">Recent Templates</h3>
            <button
              onClick={() => navigate('/templates')}
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
              <p className="text-slate-400 text-sm">No templates yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/projects')}
              >
                Generate your first template
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
