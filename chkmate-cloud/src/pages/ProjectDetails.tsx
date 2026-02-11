import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileCode, ArrowLeft, Clock, Trash, Loader2, GitBranch, ArrowRight } from 'lucide-react';
import { fetchProject, deleteTemplate, Project } from '../lib/api';
import { parseError } from '../lib/errors';
import { useToastActions } from '../context/ToastContext';
import { SkeletonCard } from '../components/Skeleton';
import Button, { IconButton } from '../components/Button';
import { EmptyTemplates } from '../components/EmptyState';
import { SecurityBadge, Severity } from '../components/SecurityBadge';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import { formatRelativeTime, cn } from '../lib/utils';

import { useAuth } from '@clerk/clerk-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastActions();
  const { getToken } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchProject(id, token);
      setProject(data);
    } catch (err) {
      const error = parseError(err);
      toast.error(error.message, 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setDeletingId(templateId);
    try {
      const token = await getToken();
      await deleteTemplate(templateId, token);
      toast.success('Template deleted successfully');
      loadProject();
    } catch (err) {
      const error = parseError(err);
      toast.error(error.message, 'Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const getTemplateStatus = (t: any) => {
    const report = t.auditReports?.[0];
    if (!report) return null;
    
    if (report.criticalCount > 0) return { severity: 'CRITICAL' as Severity, count: report.criticalCount };
    if (report.highCount > 0) return { severity: 'HIGH' as Severity, count: report.highCount };
    if (report.mediumCount > 0) return { severity: 'MEDIUM' as Severity, count: report.mediumCount };
    if (report.lowCount > 0) return { severity: 'LOW' as Severity, count: report.lowCount };
    
    return { severity: 'SECURE' as Severity, count: 0 };
  };

  if (loading) {
    return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Link
          to="/projects"
          className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="animate-fade-in">
          <h2 className="text-4xl font-black tracking-tight flex items-center gap-3">
             <div className="w-2 h-8 bg-brand-500 rounded-full" />
             Project
          </h2>
          <div className="flex items-center gap-2 mt-1 px-4">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Insight</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="h-48 bg-slate-900/20 border border-slate-800/50 rounded-3xl animate-pulse" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-900/20 border border-slate-800/50 rounded-2xl animate-pulse" />)}
           </div>
        </div>
        <div className="space-y-6">
           <div className="h-full bg-slate-900/20 border border-slate-800/50 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">Project not found</p>
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-6">
          <Link
            to="/projects"
            className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
              <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
              <span className="text-slate-700">/</span>
              <span className="text-white font-medium">{project.name}</span>
            </div>
            <div className="flex items-center gap-3 mb-1">
               <h2 className="text-4xl font-black tracking-tight">{project.name}</h2>
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                Active Project
              </span>
            </div>
            <p className="text-slate-500 mt-1 font-medium italic">{project.description || "Infrastructure blueprint orchestration."}</p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/projects/${id}/new-template`)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="shadow-lg shadow-brand-500/20"
        >
          New Template
        </Button>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Infrastructure Templates</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
             <Clock className="w-3.5 h-3.5" />
             {project.templates?.length || 0} Blueprints
          </div>
        </div>

        {!project.templates || project.templates.length === 0 ? (
          <EmptyTemplates onAction={() => navigate(`/projects/${id}/new-template`)} />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {project.templates.map((t: any) => {
              if (!t) return null;
              const status = getTemplateStatus(t);
              return (
                <motion.div key={t.id} variants={staggerItem}>
                  <Link to={`/projects/${id}/templates/${t.id}`} className="block group">
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl hover:border-brand-500/30 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-500/10 transition-colors" />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                             <FileCode className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 uppercase font-black tracking-[0.1em] border border-slate-800">
                                {t.provider}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {status && <SecurityBadge severity={status.severity} />}
                          <IconButton
                            aria-label="Delete template"
                            variant="danger"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteTemplate(e, t.id)}
                            loading={deletingId === t.id}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                      </div>

                      <h3 className="text-xl font-extrabold mb-4 group-hover:text-brand-400 transition-colors truncate pr-4">
                        {t.name}
                      </h3>
                      
                      <div className="mt-auto space-y-4">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                           <div className="flex items-center gap-1.5">
                              <GitBranch className="w-3 h-3 text-slate-600" />
                              v{t.version || '1.0'}
                           </div>
                           <div className="w-1 h-1 rounded-full bg-slate-800" />
                           <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-600" />
                              {formatRelativeTime(t.createdAt)}
                           </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600 pl-1">
                           <span>View Blueprint</span>
                           <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-brand-400 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
