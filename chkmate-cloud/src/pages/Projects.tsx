import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, createProject, deleteProject, Project } from '../lib/api';
import { parseError } from '../lib/errors';
import { useToastActions } from '../context/ToastContext';
import { trackProjectCreated, trackProjectDeleted } from '../lib/analytics';
import { Plus, Folder, Trash, Loader2, ArrowRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button, { IconButton } from '../components/Button';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import { cn } from '../lib/utils';

export default function Projects() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToastActions();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [user]); // Reload if user changes

  const loadProjects = async () => {
    try {
      if (!user) return;
      const token = await getToken();
      const data = await fetchProjects(token);
      setProjects(data);
    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      const token = await getToken();
      const email = user.primaryEmailAddress?.emailAddress || '';
      const project = await createProject(newName, newDesc, user.id, email, user.fullName, token);
      setShowNew(false);
      setNewName('');
      setNewDesc('');
      toast.success('Project created successfully');

      // Track project creation
      trackProjectCreated(project.id, project.name);

      loadProjects();
    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project? All templates inside it will be deleted.')) {
      return;
    }

    setDeletingId(id);
    try {
      const token = await getToken();
      await deleteProject(id, token);
      toast.success('Project deleted successfully');

      // Track project deletion
      trackProjectDeleted(id);

      loadProjects();
    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Projects</h2>
          <p className="text-slate-400 mt-2 font-medium">Manage your cloud infrastructure projects and templates.</p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="shadow-lg shadow-brand-500/20"
        >
          New Project
        </Button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-brand-400" />
                Initialize New Project
              </h3>
              <form onSubmit={handleCreate} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Project Name
                    </label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white focus:border-brand-500/50 outline-none transition-all placeholder:text-slate-700"
                      placeholder="e.g. Production Cluster"
                      required
                      disabled={creating}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Brief Description
                    </label>
                    <input
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white focus:border-brand-500/50 outline-none transition-all placeholder:text-slate-700"
                      placeholder="e.g. Multi-tier application stack"
                      disabled={creating}
                    />
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNew(false)}
                    disabled={creating}
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    loading={creating}
                    loadingText="Initializing..."
                    className="px-8"
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
             <div key={i} className="bg-slate-900/20 border border-slate-800/50 p-6 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/20 rounded-3xl border border-slate-800/50 border-dashed">
          <div className="w-20 h-20 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto mb-6 text-slate-700">
            <Folder className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Projects Detected</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-8">Start by creating a workspace to organize your cloud infrastructure blueprints.</p>
          <Button
            variant="outline"
            onClick={() => setShowNew(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Your First Project
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {projects.map((p) => (
            <motion.div
              key={p.id}
              variants={staggerItem}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl hover:border-brand-500/30 transition-all cursor-pointer group relative overflow-hidden"
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-500/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <IconButton
                    aria-label="Delete project"
                    variant="danger"
                    size="sm"
                    onClick={(e) => handleDelete(e, p.id)}
                    loading={deletingId === p.id}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              </div>
              
              <h3 className="text-xl font-extrabold mb-2 group-hover:text-brand-400 transition-colors truncate pr-4">
                {p.name}
              </h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed mb-6 h-10">
                {p.description || "No description provided for this architectural landscape."}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Workspace</span>
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
