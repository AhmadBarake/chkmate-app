import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  Plus,
  Rocket,
  Lock,
  Globe,
  ExternalLink,
  Loader2,
  KeyRound,
  FolderGit2,
  ArrowRight,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Button from '../components/Button';
import {
  fetchGitHubConnections,
  connectGitHubAccount,
  fetchGitHubRepos,
  createGitHubRepo,
  GitHubConnectionInfo,
  GitHubRepoInfo,
} from '../lib/api';
import { useToastActions } from '../context/ToastContext';
import { staggerContainer, staggerItem } from '../lib/animations';
import { cn } from '../lib/utils';

export default function SimpleGitHub() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const toast = useToastActions();

  const [connections, setConnections] = useState<GitHubConnectionInfo[]>([]);
  const [repos, setRepos] = useState<GitHubRepoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(false);

  // Connect state
  const [showConnect, setShowConnect] = useState(false);
  const [patInput, setPatInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Create repo state
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoDesc, setRepoDesc] = useState('');
  const [repoPurpose, setRepoPurpose] = useState<'terraform' | 'webapp'>('terraform');
  const [creatingRepo, setCreatingRepo] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const token = await getToken();
        const conns = await fetchGitHubConnections(token);
        setConnections(conns);
        if (conns.length > 0) {
          setReposLoading(true);
          const r = await fetchGitHubRepos(conns[0].id, token);
          setRepos(r);
          setReposLoading(false);
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, getToken]);

  const handleConnect = async () => {
    if (!patInput.trim()) return;
    setConnecting(true);
    try {
      const token = await getToken();
      const result = await connectGitHubAccount(patInput.trim(), token);
      toast.success(`Connected as ${result.githubUsername}`);
      setShowConnect(false);
      setPatInput('');
      // Reload
      const conns = await fetchGitHubConnections(token);
      setConnections(conns);
      if (conns.length > 0) {
        const r = await fetchGitHubRepos(conns[0].id, token);
        setRepos(r);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleCreateRepo = async () => {
    if (!repoName.trim() || connections.length === 0) return;
    setCreatingRepo(true);
    try {
      const token = await getToken();
      const desc = repoDesc || (repoPurpose === 'terraform'
        ? 'Terraform infrastructure managed by Chkmate'
        : 'Web application source code');
      const repo = await createGitHubRepo(connections[0].id, repoName.trim(), desc, true, token);
      toast.success(`Created "${repo.fullName}"`);
      setShowCreateRepo(false);
      setRepoName('');
      setRepoDesc('');
      // Reload repos
      const r = await fetchGitHubRepos(connections[0].id, token);
      setRepos(r);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create repo');
    } finally {
      setCreatingRepo(false);
    }
  };

  const isConnected = connections.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <Github className="w-5 h-5 text-slate-50" />
          <h2 className="text-3xl font-extrabold tracking-tight">GitHub</h2>
        </div>
        <p className="text-slate-400 mt-1 font-medium">Store your infrastructure code and deploy from repositories.</p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : !isConnected ? (
        /* Not Connected */
        <div className="space-y-6">
          <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
            <Github className="w-14 h-14 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-50 mb-2">Connect Your GitHub Account</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Push your Terraform templates to GitHub, create infrastructure repos, and link them to deployments for automated workflows.
            </p>
            <Button
              onClick={() => setShowConnect(true)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              className="shadow-lg shadow-brand-500/20"
            >
              Connect with Access Token
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Version Control', desc: 'Track every change to your infrastructure code', icon: FolderGit2, color: 'brand' },
              { title: 'Quick Deploy', desc: 'Deploy directly from your GitHub repositories', icon: Rocket, color: 'emerald' },
              { title: 'AI + Git', desc: 'Agentic fixes pushed as commits automatically', icon: Sparkles, color: 'violet' },
            ].map(item => (
              <div key={item.title} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
                <item.icon className={cn('w-8 h-8 mb-3', `text-${item.color}-400`)} />
                <p className="font-bold text-slate-50 text-sm">{item.title}</p>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Connected */
        <>
          {/* Account Badge */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connections[0].avatarUrl ? (
                <img src={connections[0].avatarUrl} alt="" className="w-9 h-9 rounded-full border border-white/10" />
              ) : (
                <Github className="w-9 h-9 text-slate-50" />
              )}
              <div>
                <p className="font-bold text-slate-50 text-sm">{connections[0].githubUsername}</p>
                <p className="text-[11px] text-slate-500">Connected</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCreateRepo(true)} leftIcon={<Plus className="w-4 h-4" />}>
              New Repo
            </Button>
          </div>

          {/* Repos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Your Repositories</h3>
            {reposLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-900/40 border border-slate-800/50 rounded-xl animate-pulse" />)}
              </div>
            ) : repos.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-xl p-8 text-center">
                <p className="text-slate-500 text-sm">No repositories yet. Create one to store your infrastructure code.</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {repos.slice(0, 12).map((repo) => (
                  <motion.div
                    key={repo.fullName}
                    variants={staggerItem}
                    className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-50 truncate">{repo.name}</p>
                        {repo.description && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{repo.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {repo.isPrivate ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" /> Public
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {repo.language && <span className="bg-slate-800 px-1.5 py-0.5 rounded">{repo.language}</span>}
                        <span>{repo.defaultBranch}</span>
                      </div>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-brand-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConnect(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-50">Connect GitHub</h3>
                <button onClick={() => setShowConnect(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">Enter a Personal Access Token with <strong className="text-slate-300">repo</strong> scope.</p>
              <input
                type="password"
                value={patInput}
                onChange={(e) => setPatInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-brand-500/50 outline-none font-mono text-sm mb-4"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowConnect(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleConnect}
                  disabled={!patInput.trim() || connecting}
                  leftIcon={connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  className="flex-1"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Repo Modal */}
      <AnimatePresence>
        {showCreateRepo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateRepo(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-50">Create Repository</h3>
                <button onClick={() => setShowCreateRepo(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Purpose Selector */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setRepoPurpose('terraform')}
                  className={cn('flex-1 p-3 rounded-xl border text-left transition-all',
                    repoPurpose === 'terraform' ? 'border-brand-500/30 bg-brand-500/10' : 'border-slate-800 hover:border-slate-700'
                  )}
                >
                  <FolderGit2 className={cn('w-5 h-5 mb-1', repoPurpose === 'terraform' ? 'text-brand-400' : 'text-slate-500')} />
                  <p className="text-xs font-bold text-slate-50">Terraform Infra</p>
                  <p className="text-[10px] text-slate-500">Infrastructure code</p>
                </button>
                <button
                  onClick={() => setRepoPurpose('webapp')}
                  className={cn('flex-1 p-3 rounded-xl border text-left transition-all',
                    repoPurpose === 'webapp' ? 'border-brand-500/30 bg-brand-500/10' : 'border-slate-800 hover:border-slate-700'
                  )}
                >
                  <Globe className={cn('w-5 h-5 mb-1', repoPurpose === 'webapp' ? 'text-brand-400' : 'text-slate-500')} />
                  <p className="text-xs font-bold text-slate-50">Web App Code</p>
                  <p className="text-[10px] text-slate-500">Application source</p>
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                  placeholder="my-infrastructure"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-brand-500/50 outline-none"
                />
                <input
                  type="text"
                  value={repoDesc}
                  onChange={(e) => setRepoDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-brand-500/50 outline-none"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowCreateRepo(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleCreateRepo}
                  disabled={!repoName.trim() || creatingRepo}
                  leftIcon={creatingRepo ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderGit2 className="w-4 h-4" />}
                  className="flex-1"
                >
                  {creatingRepo ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
