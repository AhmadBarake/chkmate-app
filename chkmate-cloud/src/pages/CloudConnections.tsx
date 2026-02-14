import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Server, 
  Copy,
  ExternalLink,
  ChevronRight,
  X,
  Eye 
} from 'lucide-react';
import Button from '../components/Button';
import InfrastructureExplorer from '../components/InfrastructureExplorer';
import { fadeInUp } from '../lib/animations';
import { 
  fetchConnections, 
  getAWSSetupDetails, 
  connectAWS, 
  syncConnection, 
  deleteConnection,
  CloudConnection 
} from '../lib/api';
import { useToastActions } from '../context/ToastContext';

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
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
  { value: 'me-south-1', label: 'Middle East (Bahrain)' },
];

import { useUser, useAuth } from '@clerk/clerk-react';

export default function CloudConnections() {
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToastActions();
  const { user } = useUser();
  const { getToken } = useAuth();

  // Setup state
  const [setupDetails, setSetupDetails] = useState<{ externalId: string, setupUrl: string, hostAccountId: string } | null>(null);
  const [roleArn, setRoleArn] = useState('');
  const [connectionName, setConnectionName] = useState('AWS Account');
  const [connecting, setConnecting] = useState(false);
  
  // Explorer state
  const [viewingConnectionId, setViewingConnectionId] = useState<string | null>(null);
  
  // Region selection state (per connection)
  const [selectedRegions, setSelectedRegions] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConnections();
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const data = await fetchConnections(token);
      setConnections(data);
    } catch (err) {
      console.error('Failed to load connections:', err);
      toast.error('Failed to load cloud connections');
    } finally {
      setLoading(false);
    }
  };

  const startAddConnection = async () => {
    setIsAdding(true);
    try {
      const token = await getToken();
      const details = await getAWSSetupDetails(token);
      setSetupDetails(details);
    } catch (err) {
      toast.error('Failed to initialize setup');
      setIsAdding(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupDetails) return;

    setConnecting(true);
    try {
      const token = await getToken();
      await connectAWS({
        name: connectionName,
        roleArn,
        externalId: setupDetails.externalId
      }, token);
      toast.success('AWS Account connected successfully');
      setIsAdding(false);
      setRoleArn('');
      setConnectionName('AWS Account');
      loadConnections();
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect account');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (id: string) => {
    try {
      const region = selectedRegions[id] || 'us-east-1';
      toast.info(`Scanning ${region}...`);
      const token = await getToken();
      await syncConnection(id, region, token);
      toast.success('Synchronization complete');
      loadConnections();
    } catch (err) {
      toast.error('Failed to sync connection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;
    try {
      const token = await getToken();
      await deleteConnection(id, token);
      toast.success('Connection removed');
      loadConnections();
    } catch (err) {
      toast.error('Failed to remove connection');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <Cloud className="text-brand-400" />
            Cloud Connections
          </h1>
          <p className="text-slate-400">
            Manage your persistent cloud connections for context-aware generation.
          </p>
        </div>
        {!isAdding && (
          <Button onClick={startAddConnection} rightIcon={<Plus className="w-4 h-4" />}>
            Add Connection
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1"
          >
            <div className="max-w-2xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-6">Connect AWS Account</h2>
              
              <div className="space-y-8">
                {/* Step 1: Explanation */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Create IAM Role Manually</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Create a new role in your AWS IAM Console with the following trust relationship.
                    </p>
                    
                    {setupDetails && (
                      <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Account ID to Trust</label>
                            <div className="flex items-center gap-2 mt-1">
                                <code className="bg-slate-900 px-3 py-2 rounded text-slate-200 font-mono text-sm flex-1 border border-slate-800">
                                    {setupDetails.hostAccountId}
                                </code>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(setupDetails.hostAccountId);
                                        toast.success('Account ID copied');
                                    }}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                         <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">External ID (Required)</label>
                            <div className="flex items-center gap-2 mt-1">
                                <code className="bg-slate-900 px-3 py-2 rounded text-slate-200 font-mono text-sm flex-1 border border-slate-800">
                                    {setupDetails.externalId}
                                </code>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(setupDetails.externalId);
                                        toast.success('External ID copied');
                                    }}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                         <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Permissions (Easier: Custom Policy)</label>
                            <div className="mt-1 text-sm text-slate-300 mb-2">
                                If you can't find the managed policy, click <b>Create inline policy</b> &rarr; <b>JSON</b> and paste this:
                            </div>
                            <div className="relative">
                                <pre className="bg-slate-950 p-3 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:Describe*",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "s3:ListBucket",
                "s3:GetBucketVersioning",
                "rds:Describe*",
                "iam:ListRoles",
                "iam:ListUsers",
                "iam:ListAccessKeys",
                "iam:GetAccessKeyLastUsed",
                "iam:GetLoginProfile",
                "iam:ListMFADevices",
                "lambda:ListFunctions",
                "dynamodb:ListTables",
                "dynamodb:DescribeTable",
                "amplify:ListApps",
                "amplify:ListBranches",
                "ce:GetCostAndUsage",
                "ce:GetCostForecast"
            ],
            "Resource": "*"
        }
    ]
}`}
                                </pre>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:Describe*",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "s3:ListBucket",
                "s3:GetBucketVersioning",
                "rds:Describe*",
                "iam:ListRoles",
                "iam:ListUsers",
                "iam:ListAccessKeys",
                "iam:GetAccessKeyLastUsed",
                "iam:GetLoginProfile",
                "iam:ListMFADevices",
                "lambda:ListFunctions",
                "dynamodb:ListTables",
                "dynamodb:DescribeTable",
                "amplify:ListApps",
                "amplify:ListBranches",
                "ce:GetCostAndUsage",
                "ce:GetCostForecast"
            ],
            "Resource": "*"
        }
    ]
}`);
                                        toast.success('Policy JSON copied');
                                    }}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                       <a 
                        href="https://us-east-1.console.aws.amazon.com/iamv2/home#/roles/create?step=selectTrustEntity"
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-bold rounded-lg transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open IAM Console
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 2: Input */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Enter Role Details</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Once the stack creation is complete, copy the <code>RoleArn</code> from the Outputs tab and paste it here.
                    </p>
                    
                    <form onSubmit={handleConnect} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Connection Name</label>
                        <input
                          type="text"
                          value={connectionName}
                          onChange={e => setConnectionName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-50 focus:border-brand-500 outline-none"
                          placeholder="e.g. Production AWS"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Role ARN</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={roleArn}
                            onChange={e => setRoleArn(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-50 focus:border-brand-500 outline-none font-mono text-sm"
                            placeholder="arn:aws:iam::123456789012:role/ChkmateRole"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                         <Button
                          type="button"
                          variant="ghost" 
                          onClick={() => setIsAdding(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          loading={connecting}
                          loadingText="Verifying..."
                          rightIcon={<ChevronRight className="w-4 h-4" />}
                        >
                          Verify & Connect
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {connections.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800/50 border-dashed">
                <Cloud className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-lg font-medium text-slate-300 mb-1">No connections yet</h3>
                <p className="text-slate-500 mb-6">Connect your cloud provider to get context-aware suggestions.</p>
                <Button onClick={startAddConnection} variant="outline">
                  Connect AWS Account
                </Button>
              </div>
            ) : (
              connections.map(conn => (
                <div key={conn.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group relative flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FF9900]/10 flex items-center justify-center">
                        <Cloud className="w-6 h-6 text-[#FF9900]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-50 leading-tight">{conn.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            conn.status === 'ACTIVE' ? 'bg-emerald-500' : 
                            conn.status === 'FAILED' ? 'bg-red-500' : 'bg-slate-500'
                          }`} />
                          <span className="text-xs text-slate-400 capitalize">{conn.status.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(conn.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      title="Remove connection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Provider</span>
                      <span className="text-slate-300 font-medium uppercase">{conn.provider}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Resources</span>
                      <span className="text-slate-300 font-medium">{conn._count?.resources || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Last Sync</span>
                      <span className="text-slate-300">
                        {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 mb-3">
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Region to Scan</label>
                    <select
                      value={selectedRegions[conn.id] || 'us-east-1'}
                      onChange={(e) => setSelectedRegions(prev => ({ ...prev, [conn.id]: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-50 focus:border-brand-500 outline-none"
                    >
                      {AWS_REGIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewingConnectionId(conn.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                        View
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSync(conn.id)}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                        Sync
                    </Button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explorer Modal */}
      <AnimatePresence>
        {viewingConnectionId && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-5xl h-[80vh] bg-slate-900 rounded-xl relative overflow-hidden"
                >
                    <InfrastructureExplorer 
                        connectionId={viewingConnectionId} 
                        onClose={() => setViewingConnectionId(null)}
                    />
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
