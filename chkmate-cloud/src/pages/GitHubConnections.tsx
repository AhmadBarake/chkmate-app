import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  Globe,
  ExternalLink,
  GitBranch,
  Loader2,
  KeyRound,
  FolderGit2,
  X,
  Check,
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Button from '../components/Button';
import {
  fetchGitHubConnections,
  connectGitHubAccount,
  disconnectGitHubAccount,
  fetchGitHubRepos,
  createGitHubRepo,
  GitHubConnectionInfo,
  GitHubRepoInfo,
  GitHubCreatedRepo,
} from '../lib/api';
import { useToastActions } from '../context/ToastContext';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import { cn, formatRelativeTime } from '../lib/utils';

export default function GitHubConnections() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const toast = useToastActions();

  const [connections, setConnections] = useState<GitHubConnectionInfo[]>([]);
  const [repos, setRepos] = useState<GitHubRepoInfo[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(false);

  // Connect modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [patInput, setPatInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Create repo modal state
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [creatingRepo, setCreatingRepo] = useState(false);

  useEffect(() => { loadConnections(); }, [user]);

  const loadConnections = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const conns = await fetchGitHubConnections(token);
      setConnections(conns);
      if (conns.length > 0 && !selectedConnection) {
        setSelectedConnection(conns[0].id);
        loadRepos(conns[0].id);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const loadRepos = async (connectionId: string) => {
    setReposLoading(true);
    try {
      const token = await getToken();
      const r = await fetchGitHubRepos(connectionId, token);
      setRepos(r);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load repositories');
    } finally {
      setReposLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!patInput.trim()) return;
    setConnecting(true);
    try {
      const token = await getToken();
      const result = await connectGitHubAccount(patInput.trim(), token);
      toast.success(`Connected as ${result.githubUsername}`);
      setShowConnectModal(false);
      setPatInput('');
      loadConnections();
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect GitHub');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const token = await getToken();
      await disconnectGitHubAccount(connectionId, token);
      toast.success('GitHub disconnected');
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      if (selectedConnection === connectionId) {
        setSelectedConnection(null);
        setRepos([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim() || !selectedConnection) return;
    setCreatingRepo(true);
    try {
      const token = await getToken();
      const repo = await createGitHubRepo(
        selectedConnection,
        newRepoName.trim(),
        newRepoDesc,
        newRepoPrivate,
        token,
      );
      toast.success(`Repository "${repo.fullName}" created`);
      setShowCreateRepo(false);
      setNewRepoName('');
      setNewRepoDesc('');
      loadRepos(selectedConnection);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create repository');
    } finally {
      setCreatingRepo(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <Github className="w-5 h-5 text-slate-50" />
            <h2 className="text-3xl font-extrabold tracking-tight">GitHub</h2>
          </div>
          <p className="text-slate-400 font-medium">Connect your GitHub account to push templates, create repos, and link deployments.</p>
        </motion.div>
        <div className="flex gap-3">
          {connections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateRepo(true)}
              leftIcon={<FolderGit2 className="w-4 h-4" />}
            >
              New Repo
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowConnectModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-lg shadow-brand-500/20"
          >
            Connect GitHub
          </Button>
        </div>
      </div>

      {/* Connected Accounts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-20 bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
          <Github className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium mb-1">No GitHub account connected</p>
          <p className="text-sm text-slate-500 mb-4">Connect your GitHub account to push infrastructure code and manage repositories.</p>
          <Button onClick={() => setShowConnectModal(true)} leftIcon={<KeyRound className="w-4 h-4" />}>
            Connect with Personal Access Token
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => (
            <motion.div
              key={conn.id}
              className={cn(
                'bg-slate-900/40 border rounded-2xl p-5 flex items-center justify-between transition-all cursor-pointer',
                selectedConnection === conn.id ? 'border-brand-500/30 bg-brand-500/5' : 'border-slate-800/50 hover:border-slate-700'
              )}
              onClick={() => {
                setSelectedConnection(conn.id);
                loadRepos(conn.id);
              }}
            >
              <div className="flex items-center gap-4">
                {conn.avatarUrl ? (
                  <img src={conn.avatarUrl} alt={conn.githubUsername} className="w-10 h-10 rounded-full border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <Github className="w-5 h-5 text-slate-50" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-50">{conn.githubUsername}</p>
                  <p className="text-xs text-slate-500">{conn._count.repositories} repo{conn._count.repositories !== 1 ? 's' : ''} linked &middot; Connected {formatRelativeTime(conn.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDisconnect(conn.id); }}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Repository List */}
      {selectedConnection && (
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Repositories</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadRepos(selectedConnection)}
              leftIcon={reposLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>

          {reposLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-slate-900/40 border border-slate-800/50 rounded-xl animate-pulse" />)}
            </div>
          ) : repos.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-xl p-8 text-center">
              <p className="text-slate-500 text-sm">No repositories found. Create one to get started.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {repos.map((repo) => (
                <motion.div
                  key={repo.fullName}
                  variants={staggerItem}
                  className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-50 truncate group-hover:text-brand-300 transition-colors">{repo.name}</p>
                      <p className="text-[11px] text-slate-500">{repo.owner}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {repo.isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{repo.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3 h-3" />
                      <span>{repo.defaultBranch}</span>
                      {repo.language && (
                        <>
                          <span>&middot;</span>
                          <span>{repo.language}</span>
                        </>
                      )}
                    </div>
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-brand-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConnectModal(false)}
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
                <button onClick={() => setShowConnectModal(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Enter a GitHub Personal Access Token with <strong className="text-slate-300">repo</strong> scope to connect your account.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Access Token</label>
                  <input
                    type="password"
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Create a token at <span className="text-brand-400">GitHub Settings &rarr; Developer settings &rarr; Personal access tokens (classic)</span>. Required scope: <code className="bg-slate-800 px-1 rounded">repo</code>.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowConnectModal(false)} className="flex-1">Cancel</Button>
                  <Button
                    onClick={handleConnect}
                    disabled={!patInput.trim() || connecting}
                    leftIcon={connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {connecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Repository Name</label>
                  <input
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                    placeholder="my-infrastructure"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <input
                    type="text"
                    value={newRepoDesc}
                    onChange={(e) => setNewRepoDesc(e.target.value)}
                    placeholder="Terraform infrastructure managed by Chkmate"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewRepoPrivate(true)}
                    className={cn('flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                      newRepoPrivate ? 'border-brand-500/30 bg-brand-500/10 text-brand-400' : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    <Lock className="w-4 h-4" /> Private
                  </button>
                  <button
                    onClick={() => setNewRepoPrivate(false)}
                    className={cn('flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                      !newRepoPrivate ? 'border-brand-500/30 bg-brand-500/10 text-brand-400' : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    <Globe className="w-4 h-4" /> Public
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">Repo will be initialized with a README and Terraform .gitignore.</p>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowCreateRepo(false)} className="flex-1">Cancel</Button>
                  <Button
                    onClick={handleCreateRepo}
                    disabled={!newRepoName.trim() || creatingRepo}
                    leftIcon={creatingRepo ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderGit2 className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {creatingRepo ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
