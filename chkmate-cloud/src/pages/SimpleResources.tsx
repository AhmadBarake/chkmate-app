import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server,
  HardDrive,
  Database,
  Globe,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Link,
  Zap,
  Box,
  Cloud,
  Shield,
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Button from '../components/Button';
import {
  fetchConnections,
  fetchConnectionResources,
  scanSavedConnection,
  CloudConnection,
  CloudResource,
  CloudScanResult,
} from '../lib/api';
import { staggerContainer, staggerItem } from '../lib/animations';
import { cn } from '../lib/utils';

type ResourceCategory = 'compute' | 'storage' | 'database' | 'networking' | 'other';

function categorize(resourceType: string): ResourceCategory {
  const type = resourceType.toLowerCase();
  if (type.includes('instance') || type.includes('lambda') || type.includes('ecs') || type.includes('fargate')) return 'compute';
  if (type.includes('bucket') || type.includes('s3') || type.includes('ebs') || type.includes('volume')) return 'storage';
  if (type.includes('rds') || type.includes('dynamo') || type.includes('elasticache') || type.includes('database')) return 'database';
  if (type.includes('vpc') || type.includes('subnet') || type.includes('security_group') || type.includes('elb') || type.includes('cloudfront') || type.includes('route53')) return 'networking';
  return 'other';
}

const categoryConfig: Record<ResourceCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  compute: { label: 'Compute', icon: Server, color: 'brand' },
  storage: { label: 'Storage', icon: HardDrive, color: 'violet' },
  database: { label: 'Database', icon: Database, color: 'emerald' },
  networking: { label: 'Networking', icon: Globe, color: 'amber' },
  other: { label: 'Other', icon: Box, color: 'slate' },
};

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  brand: { bg: 'bg-brand-500/10', border: 'border-brand-500/20', text: 'text-brand-400' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400' },
};

export default function SimpleResources() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [scanResult, setScanResult] = useState<CloudScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const conns = await fetchConnections(token);
      setConnections(conns);

      const active = conns.find(c => c.status === 'ACTIVE');
      if (active) {
        const [res, scan] = await Promise.all([
          fetchConnectionResources(active.id, token),
          scanSavedConnection(active.id, undefined, token),
        ]);
        setResources(res);
        setScanResult(scan);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user, getToken]);

  const handleRescan = async () => {
    const active = connections.find(c => c.status === 'ACTIVE');
    if (!active) return;
    setScanning(true);
    try {
      const token = await getToken();
      const [res, scan] = await Promise.all([
        fetchConnectionResources(active.id, token),
        scanSavedConnection(active.id, undefined, token),
      ]);
      setResources(res);
      setScanResult(scan);
    } catch {
      // Silent
    } finally {
      setScanning(false);
    }
  };

  const hasConnection = connections.some(c => c.status === 'ACTIVE');

  // Group resources by category
  const grouped = resources.reduce<Record<ResourceCategory, CloudResource[]>>((acc, r) => {
    const cat = categorize(r.resourceType);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, { compute: [], storage: [], database: [], networking: [], other: [] });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-extrabold tracking-tight">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">Resources</span>
          </h2>
          <p className="text-slate-400 mt-1 font-medium">Visual overview of your AWS infrastructure.</p>
        </motion.div>
        {hasConnection && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRescan}
            disabled={scanning}
            leftIcon={scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            {scanning ? 'Scanning...' : 'Rescan'}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !hasConnection ? (
        <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
          <Link className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium mb-1">No AWS account connected</p>
          <p className="text-sm text-slate-500 mb-4">Connect your account to discover and visualize your resources.</p>
          <Button onClick={() => navigate('/connections')} leftIcon={<Zap className="w-4 h-4" />}>
            Connect AWS Account
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Bar */}
          {scanResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <Cloud className="w-5 h-5 text-brand-400" />
                <div>
                  <p className="text-lg font-black text-white">{scanResult.summary.totalResources}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resources</p>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-lg font-black text-white">{scanResult.summary.criticalIssues}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical</p>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-lg font-black text-white">{scanResult.summary.highIssues}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">High</p>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-lg font-black text-white">
                    ${scanResult.summary.estimatedMonthlySavings?.toFixed(0) ?? '0'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Potential Savings</p>
                </div>
              </div>
            </div>
          )}

          {/* Resource Groups */}
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {(Object.keys(categoryConfig) as ResourceCategory[]).map((cat) => {
              const items = grouped[cat];
              if (items.length === 0) return null;
              const config = categoryConfig[cat];
              const colors = colorClasses[config.color];

              return (
                <motion.div key={cat} variants={staggerItem}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg, colors.border, 'border')}>
                      <config.icon className={cn('w-4 h-4', colors.text)} />
                    </div>
                    <h3 className="font-bold text-white">{config.label}</h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((resource) => (
                      <div
                        key={resource.id}
                        className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-white truncate">{resource.name || resource.resourceId}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{resource.resourceType}</p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded shrink-0 ml-2">
                            {resource.region}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}
