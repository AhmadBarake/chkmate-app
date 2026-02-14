import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Plus,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Copy,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchDeploymentCredentials,
  createDeploymentCredential as createCredentialAPI,
  deleteDeploymentCredential as deleteCredentialAPI,
  getDeploymentSetup,
  DeploymentCredential,
} from '../lib/api';
import { cn } from '../lib/utils';
import { useToastActions } from '../context/ToastContext';
import Button from '../components/Button';

export default function DeploymentCredentials() {
  const [credentials, setCredentials] = useState<DeploymentCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<{ externalId: string; templateYaml: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoleArn, setNewRoleArn] = useState('');
  const { getToken } = useAuth();
  const toast = useToastActions();

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const token = await getToken();
      const data = await fetchDeploymentCredentials(token);
      setCredentials(data);
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup() {
    try {
      const token = await getToken();
      const data = await getDeploymentSetup(token);
      setSetupData(data);
      setShowSetup(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate setup template');
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !newRoleArn.trim()) {
      toast.error('Name and Role ARN are required');
      return;
    }

    setCreating(true);
    try {
      const token = await getToken();
      const credential = await createCredentialAPI(newName, newRoleArn, token);
      setCredentials(prev => [credential, ...prev]);
      setNewName('');
      setNewRoleArn('');
      setShowSetup(false);
      toast.success('Deployment credentials connected successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create credentials');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const token = await getToken();
      await deleteCredentialAPI(id, token);
      setCredentials(prev => prev.filter(c => c.id !== id));
      toast.success('Credentials deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-7 h-7 text-violet-400" />
            <h1 className="text-2xl font-bold tracking-tight">Deployment Credentials</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage AWS IAM roles for Terraform deployments
          </p>
        </div>
        <Button
          onClick={handleSetup}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Add Credentials
        </Button>
      </div>

      {/* Setup modal */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/70 border border-violet-500/20 rounded-xl p-6 space-y-5"
          >
            <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" />
              Connect Deployment Account
            </h3>

            {/* Step 1: CloudFormation */}
            {setupData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">1</span>
                  <p className="text-sm text-slate-300 font-medium">Deploy this CloudFormation template in your AWS account</p>
                </div>
                <div className="relative">
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-400 overflow-auto max-h-48 font-mono">
                    {setupData.templateYaml.slice(0, 500)}...
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.templateYaml);
                      toast.success('Template copied to clipboard');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-600">
                  External ID: <code className="text-violet-400">{setupData.externalId}</code>
                </p>
              </div>
            )}

            {/* Step 2: Enter details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">2</span>
                <p className="text-sm text-slate-300 font-medium">Enter the role details after deployment</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Account Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., Production Account"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Role ARN</label>
                  <input
                    type="text"
                    value={newRoleArn}
                    onChange={e => setNewRoleArn(e.target.value)}
                    placeholder="arn:aws:iam::123456789012:role/ChkmateDeploymentRole"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSetup(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                loading={creating}
                className="bg-violet-600 hover:bg-violet-500"
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Connect Account
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-300 font-medium mb-1">Deployment credentials have write access</p>
          <p className="text-xs text-slate-500">
            Unlike scanner credentials (read-only), deployment credentials can create, modify, and destroy AWS resources.
            Only connect accounts where you want Chkmate to manage infrastructure via Terraform.
          </p>
        </div>
      </div>

      {/* Credentials list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-20">
          <Key className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No deployment credentials</h3>
          <p className="text-sm text-slate-600 mb-6">
            Add AWS deployment credentials to enable Terraform deployments
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((cred, index) => (
            <motion.div
              key={cred.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors"
            >
              <div className={cn(
                'p-2.5 rounded-lg border',
                cred.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              )}>
                {cred.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-50">{cred.name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="uppercase font-bold">{cred.provider}</span>
                  <span>{cred._count?.deployments || 0} deployments</span>
                  <span>{new Date(cred.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(cred.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
