import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  Server, 
  Database, 
  HardDrive, 
  Globe, 
  Box, 
  RefreshCw,
  User,
  Zap,
  Layers,
  Smartphone,
  ChevronDown,
  ChevronRight,
  X,
  List,
  LayoutGrid
} from 'lucide-react';
import Button from '../components/Button';
import { 
  CloudConnection, 
  CloudResource,
  fetchConnections, 
  fetchConnectionResources,
  syncConnection 
} from '../lib/api';
import { cn } from '../lib/utils';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  Panel,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { transformResourcesToGraph } from '../lib/layout';

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

const RESOURCE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'vpc': { icon: Globe, color: 'text-purple-400', label: 'VPCs' },
  'subnet': { icon: Box, color: 'text-purple-300', label: 'Subnets' },
  'ec2_instance': { icon: Server, color: 'text-orange-400', label: 'EC2 Instances' },
  'rds_instance': { icon: Database, color: 'text-blue-400', label: 'RDS Instances' },
  's3_bucket': { icon: HardDrive, color: 'text-green-400', label: 'S3 Buckets' },
  'iam_user': { icon: User, color: 'text-red-400', label: 'IAM Users' },
  'lambda_function': { icon: Zap, color: 'text-amber-400', label: 'Lambda Functions' },
  'dynamodb_table': { icon: Layers, color: 'text-cyan-400', label: 'DynamoDB Tables' },
  'amplify_app': { icon: Smartphone, color: 'text-pink-400', label: 'Amplify Apps' },
};

interface ResourceNodeProps {
  resource: CloudResource;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  depth?: number;
}

function ResourceNode({ resource, isExpanded, onToggle, children, depth = 0 }: ResourceNodeProps) {
  const config = RESOURCE_CONFIG[resource.resourceType] || { icon: Box, color: 'text-slate-400', label: resource.resourceType };
  const Icon = config.icon;
  const hasChildren = !!children;
  
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative">
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer group",
          "hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50",
          depth > 0 && "ml-8"
        )}
        onClick={() => {
          if (hasChildren && onToggle) {
            onToggle();
          } else {
            setShowDetails(!showDetails);
          }
        }}
      >
        {/* Connecting Line */}
        {depth > 0 && (
          <div className="absolute left-[-22px] top-0 bottom-0 w-px bg-slate-800 group-last:bottom-1/2" />
        )}
        {depth > 0 && (
          <div className="absolute left-[-22px] top-1/2 w-4 h-px bg-slate-800" />
        )}

        {hasChildren && (
          <button className="z-10 p-0.5 hover:bg-slate-700 rounded transition-colors bg-slate-950">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
        
        <div className={cn("p-1.5 rounded-md bg-slate-950 border border-slate-800 shadow-sm", !hasChildren && "ml-5")}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-200 truncate group-hover:text-brand-400 transition-colors">
            {resource.name || resource.resourceId}
          </div>
          <div className="text-[10px] text-slate-500 truncate flex items-center gap-2 uppercase tracking-tight">
            <span>{resource.resourceType.replace('_', ' ')}</span>
            {resource.region !== 'global' && <span>• {resource.region}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="text-[10px] text-slate-500 font-mono">{resource.resourceId.split('/').pop()?.slice(-8)}</span>
        </div>
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("pl-16 pr-3 pb-2", depth > 0 && "ml-8")}
          >
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metadata</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                  className="text-slate-600 hover:text-slate-400 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(resource.metadata || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center gap-4 py-1 border-b border-slate-900 last:border-0">
                    <span className="text-[10px] text-slate-500 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-[10px] text-slate-300 font-mono truncate max-w-[150px]">
                      {typeof val === 'object' ? '...' : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-l border-slate-900/50"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useAuth, useUser } from '@clerk/clerk-react';

function InfrastructureMapContent() {
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east-1');
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadConnections();
  }, [user]);

  useEffect(() => {
    if (selectedConnectionId) {
      loadResources();
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
      setLoading(false);
    }
  };

  const loadResources = async () => {
    if (!selectedConnectionId || !user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchConnectionResources(selectedConnectionId, token);
      setResources(data);
      
      // Update Graph
      const { nodes: layoutedNodes, edges: layoutedEdges } = transformResourcesToGraph(data);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedConnectionId) return;
    setSyncing(true);
    try {
      const token = await getToken();
      await syncConnection(selectedConnectionId, selectedRegion, token);
      await loadResources();
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setSyncing(false);
    }
  };

  // Build Hierarchy (for List View)
  const hierarchy = useMemo(() => {
    const vpcs = resources.filter(r => r.resourceType === 'vpc');
    const subnets = resources.filter(r => r.resourceType === 'subnet');
    const instances = resources.filter(r => r.resourceType === 'ec2_instance' || r.resourceType === 'rds_instance');
    
    const globalResources = resources.filter(r => ['s3_bucket', 'iam_user'].includes(r.resourceType));
    const regionalServerless = resources.filter(r => ['lambda_function', 'dynamodb_table', 'amplify_app'].includes(r.resourceType));

    const tree = vpcs.map(vpc => {
      const vpcSubnets = subnets.filter(s => s.metadata?.vpcId === vpc.resourceId);
      return {
        ...vpc,
        children: vpcSubnets.map(subnet => {
          const subnetInstances = instances.filter(i => 
            i.metadata?.subnetId === subnet.resourceId || 
            (i.resourceType === 'rds_instance' && i.metadata?.dbSubnetGroup?.subnets?.includes(subnet.resourceId))
          );
          return {
            ...subnet,
            children: subnetInstances
          };
        })
      };
    });

    const orphanned = resources.filter(r => 
      ['ec2_instance', 'rds_instance', 'subnet', 'vpc'].includes(r.resourceType) && 
      !vpcs.some(v => v.id === r.id) && 
      !subnets.some(s => s.id === r.id) &&
      !instances.some(i => i.id === r.id)
    );

    return { tree, globalResources, regionalServerless, orphanned };
  }, [resources]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  // Stats
  const stats = useMemo(() => ({
    total: resources.length,
    compute: resources.filter(r => ['ec2_instance', 'lambda_function'].includes(r.resourceType)).length,
    storage: resources.filter(r => ['s3_bucket', 'dynamodb_table', 'rds_instance'].includes(r.resourceType)).length,
    network: resources.filter(r => ['vpc', 'subnet'].includes(r.resourceType)).length,
  }), [resources]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      <style>{`.react-flow__attribution { display: none !important; }`}</style>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20">
                <Map className="w-6 h-6 text-brand-400" />
              </div>
              Infrastructure Map
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              Visualization for <span className="text-slate-200 font-medium">{selectedRegion}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
             {/* View Toggle */}
            <div className="flex bg-slate-950/50 rounded-lg p-1 border border-slate-800 mr-2">
                <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'list' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                    )}
                    title="List View"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => setViewMode('map')}
                    className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'map' ? "bg-brand-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                    )}
                    title="Map View"
                >
                    <LayoutGrid size={16} />
                </button>
            </div>

            <select 
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-brand-500"
              disabled={syncing}
            >
              {connections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {connections.length === 0 && <option value="">No connections</option>}
            </select>

            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-brand-500"
              disabled={syncing}
            >
              {AWS_REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <div className="w-px h-8 bg-slate-800 mx-1" />

            <Button 
              onClick={handleSync} 
              loading={syncing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              variant="primary"
              size="sm"
            >
              {syncing ? 'Scanning...' : 'Sync Region'}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Resources</p>
            <div className="flex items-end justify-between">
               <div className="text-3xl font-bold text-white">{stats.total}</div>
               <Box className="w-8 h-8 text-slate-800" />
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Compute</p>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-orange-400">{stats.compute}</div>
              <Zap className="w-8 h-8 text-orange-950/50" />
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Data & Storage</p>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-blue-400">{stats.storage}</div>
              <Layers className="w-8 h-8 text-blue-950/50" />
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Networking</p>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-purple-400">{stats.network}</div>
              <Globe className="w-8 h-8 text-purple-950/50" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-slate-500 animate-pulse">Building Infrastructure Map...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-slate-800/50 rounded-3xl bg-slate-900/20">
            <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
               <Map className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">No Data Discovered Yet</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              Choose a region and click "Sync Region" to build your interactive infrastructure map.
            </p>
            <Button 
                onClick={handleSync} 
                loading={syncing}
                variant="primary"
                className="mt-8"
            >
                Start Now
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Tree (VPC Hierarcy) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Network Hierarchy</h2>
                     <div className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {hierarchy.tree.length} VPCs
                     </div>
                  </div>

                  {hierarchy.tree.map(vpc => (
                    <div key={vpc.id} className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
                       <ResourceNode 
                          resource={vpc} 
                          isExpanded={expandedIds.has(vpc.id)} 
                          onToggle={() => toggleExpand(vpc.id)}
                          depth={0}
                       >
                          {vpc.children.map(subnet => (
                            <ResourceNode 
                               key={subnet.id} 
                               resource={subnet} 
                               isExpanded={expandedIds.has(subnet.id)} 
                               onToggle={() => toggleExpand(subnet.id)}
                               depth={1}
                            >
                               {subnet.children.map(instance => (
                                 <ResourceNode key={instance.id} resource={instance} depth={2} />
                               ))}
                            </ResourceNode>
                          ))}
                       </ResourceNode>
                    </div>
                  ))}

                  {hierarchy.tree.length === 0 && (
                    <div className="p-12 text-center bg-slate-900/20 border border-slate-800/40 rounded-2xl">
                       <p className="text-slate-600 text-sm">No VPCs found in this region.</p>
                    </div>
                  )}
                </div>

                {/* Sidebar Column (Global & Serverless) */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Regional Serverless */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Serverless & Managed</h2>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-2">
                        {hierarchy.regionalServerless.map(res => (
                            <ResourceNode key={res.id} resource={res} />
                        ))}
                        {hierarchy.regionalServerless.length === 0 && <p className="text-[10px] text-slate-700 text-center py-4">None found</p>}
                    </div>
                  </div>

                  {/* Global Resources */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Global Resources</h2>
                        <span className="text-[10px] text-brand-500 font-bold bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">AWS GLOBAL</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-2">
                        {hierarchy.globalResources.map(res => (
                            <ResourceNode key={res.id} resource={res} />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="h-[70vh] w-full bg-slate-900/30 rounded-2xl border border-slate-800/50 overflow-hidden relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                        minZoom={0.1}
                    >
                        <Background color="#333" gap={20} />
                        <Controls className="bg-slate-900 border-slate-800 text-white" />
                        <Panel position="top-right" className="bg-slate-950/80 backdrop-blur border border-slate-800 p-2 rounded-lg text-xs text-slate-400">
                             {nodes.length} Resources Visualized
                        </Panel>
                    </ReactFlow>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Wrap with ReactFlowProvider to ensure context exists
export default function InfrastructureMap() {
    return (
        <ReactFlowProvider>
            <InfrastructureMapContent />
        </ReactFlowProvider>
    );
}
