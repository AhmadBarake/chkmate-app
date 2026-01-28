import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Database, 
  Server, 
  HardDrive, 
  Globe, 
  Box, 
  ChevronRight, 
  ChevronDown,
  RefreshCw,
  User,
  Zap,
  Layers,
  Smartphone
} from 'lucide-react';
import { CloudResource, fetchConnectionResources } from '../lib/api';
import Button from './Button';

interface InfrastructureExplorerProps {
  connectionId: string;
  onClose?: () => void;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  'ec2': <Server className="w-4 h-4 text-orange-400" />,
  'rds': <Database className="w-4 h-4 text-blue-400" />,
  's3': <HardDrive className="w-4 h-4 text-green-400" />,
  'vpc': <Globe className="w-4 h-4 text-purple-400" />,
  'subnet': <Box className="w-4 h-4 text-purple-300" />,
  'elb': <Globe className="w-4 h-4 text-yellow-400" />,
  'iam': <User className="w-4 h-4 text-red-400" />,
  'lambda': <Zap className="w-4 h-4 text-amber-400" />,
  'dynamodb': <Layers className="w-4 h-4 text-cyan-400" />,
  'amplify': <Smartphone className="w-4 h-4 text-pink-400" />,
};

export default function InfrastructureExplorer({ connectionId, onClose }: InfrastructureExplorerProps) {
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  useEffect(() => {
    loadResources();
  }, [connectionId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await fetchConnectionResources(connectionId);
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  const resourceTypes = useMemo(() => {
    const types = new Set(resources.map(r => r.resourceType));
    return Array.from(types).sort();
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSearch = 
        (r.name?.toLowerCase().includes(search.toLowerCase()) || '') ||
        r.resourceId.toLowerCase().includes(search.toLowerCase()) ||
        r.resourceType.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = selectedType === 'all' || r.resourceType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [resources, search, selectedType]);

  const getIcon = (type: string) => {
    // Simple matching for AWS types
    if (type.includes('instance') || type.includes('ec2')) return RESOURCE_ICONS['ec2'];
    if (type.includes('db') || type.includes('rds')) return RESOURCE_ICONS['rds'];
    if (type.includes('bucket') || type.includes('s3')) return RESOURCE_ICONS['s3'];
    if (type.includes('vpc')) return RESOURCE_ICONS['vpc'];
    if (type.includes('subnet')) return RESOURCE_ICONS['subnet'];
    if (type.includes('load') || type.includes('elb') || type.includes('alb')) return RESOURCE_ICONS['elb'];
    if (type.includes('iam')) return RESOURCE_ICONS['iam'];
    if (type.includes('lambda')) return RESOURCE_ICONS['lambda'];
    if (type.includes('dynamo')) return RESOURCE_ICONS['dynamodb'];
    if (type.includes('amplify')) return RESOURCE_ICONS['amplify'];
    return <Box className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div>
            <h2 className="font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-brand-400" />
                Infrastructure Explorer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
                {resources.length} resources discovered
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={loadResources} loading={loading}>
                <RefreshCw className="w-4 h-4" />
            </Button>
            {onClose && (
                <Button size="sm" variant="ghost" onClick={onClose}>
                    Close
                </Button>
            )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, ID, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:border-brand-500 outline-none"
          />
        </div>
        <div className="relative min-w-[150px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:border-brand-500 outline-none appearance-none"
            >
                <option value="all">All Types</option>
                {resourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
           <div className="flex items-center justify-center py-12">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500" />
           </div>
        ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
                <p>No resources found matching filters.</p>
            </div>
        ) : (
            filteredResources.map(resource => (
                <div key={resource.id} className="border border-slate-800/50 rounded-lg bg-slate-900/30 overflow-hidden">
                    <div 
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={() => setExpandedResource(expandedResource === resource.id ? null : resource.id)}
                    >
                         <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                             {getIcon(resource.resourceType)}
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-0.5">
                                 <span className="font-medium text-slate-200 truncate pr-2" title={resource.name || resource.resourceId}>
                                     {resource.name || resource.resourceId}
                                 </span>
                                 <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                     {resource.resourceType}
                                 </span>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-500">
                                 <span>{resource.region}</span>
                                 <span className="font-mono truncate max-w-[200px]">{resource.resourceId}</span>
                             </div>
                         </div>
                         <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expandedResource === resource.id ? 'rotate-90' : ''}`} />
                    </div>
                    
                    {expandedResource === resource.id && (
                        <div className="px-3 pb-3 pt-0 border-t border-slate-800/50 bg-slate-950/30">
                            <pre className="mt-3 text-[10px] font-mono text-slate-400 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800">
                                {JSON.stringify(resource.metadata, null, 2)}
                            </pre>
                             <div className="mt-2 text-[10px] text-slate-600 flex justify-end">
                                Last synced: {new Date(resource.lastSyncedAt).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
}
