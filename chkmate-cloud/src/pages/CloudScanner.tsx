import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Key, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle,
  BarChart,
  DollarSign,
  ChevronRight,
  Server,
  Database,
  Globe,
  HardDrive,
  Eye,
  EyeOff,
  TrendingDown,
  LayoutDashboard,
  Box,
  BrainCircuit
} from 'lucide-react';
import { cn } from '../lib/utils';
import Button from '../components/Button';
import { fadeInUp } from '../lib/animations';
import { validateCloudCredentials, scanCloudAccount, scanSavedConnection, fetchConnections, AWSCredentials, CloudScanResult, CloudConnection, CREDIT_COSTS } from '../lib/api';
import { useToastActions } from '../context/ToastContext';
import { useAuth, useUser } from '@clerk/clerk-react';

import { IAMViewer } from '../components/scanner/IAMViewer';
import { ResourcesViewer } from '../components/scanner/ResourcesViewer';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CloudScanner() {
  const [step, setStep] = useState<'connect' | 'scanning' | 'results'>('connect');
  const [credentials, setCredentials] = useState<AWSCredentials>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<CloudScanResult | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [validating, setValidating] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // New State for Saved Connections
  const [scanMode, setScanMode] = useState<'saved' | 'manual'>('saved');
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');

  // Result Tabs
  const [resultTab, setResultTab] = useState<'overview' | 'iam' | 'cost' | 'resources'>('overview');

  const toast = useToastActions();

  React.useEffect(() => {
    const loadConnections = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        // Updated to use token
        const data = await fetchConnections(token);
        setConnections(data);
      } catch (e) {
        console.error("Failed to load connections", e);
      }
    };
    loadConnections();
  }, [user]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);

    try {
      const sanitized = {
        ...credentials,
        accessKeyId: credentials.accessKeyId.trim(),
        secretAccessKey: credentials.secretAccessKey.trim(),
        region: credentials.region.trim(),
      };
      
      const token = await getToken();
      const { isValid } = await validateCloudCredentials(sanitized, token);
      if (isValid) {
        toast.success('Credentials validated successfully');
        await handleScan();
      } else {
        toast.error('Invalid AWS credentials');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to validate credentials');
    } finally {
      setValidating(false);
    }
  };

  const handleScan = async () => {
    setStep('scanning');
    setScanning(true);
    setResultTab('overview'); // Reset tab

    try {
      let scanResults;
      const token = await getToken();
      
      if (scanMode === 'saved') {
         if (!selectedConnectionId) throw new Error('Please select a connection');
         const conn = connections.find(c => c.id === selectedConnectionId);
         if (!conn) throw new Error('Connection not found');
         
         // Using saved connection with selected region
         scanResults = await scanSavedConnection(selectedConnectionId, selectedRegion, token);
      } else {
         // Using manual credentials
         const sanitized = {
           ...credentials,
           accessKeyId: credentials.accessKeyId.trim(),
           secretAccessKey: credentials.secretAccessKey.trim(),
           region: credentials.region.trim(),
         };
         
         scanResults = await scanCloudAccount(sanitized, token);
      }
      
      setResults(scanResults);
      setStep('results');
      toast.success('Scan completed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Scan failed');
      setStep('connect');
    } finally {
      setScanning(false);
      // Clear sensitive credentials from memory
      if (scanMode === 'manual') {
        setCredentials({ accessKeyId: '', secretAccessKey: '', region: credentials.region });
      }
    }
  };

  const regions = [
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

  // Prepare cost data for chart
  const costData = results?.costBreakdown?.byService 
    ? Object.entries(results.costBreakdown.byService)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5
    : [];

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col px-6 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Cloud className="text-brand-400" />
          Cloud Infrastructure Scanner
        </h1>
        <p className="text-slate-400">
          Connect your AWS account to scan for security vulnerabilities, IAM risks, and cost efficiency.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'connect' && (
          <motion.div
            key="connect"
            {...fadeInUp}
            className="flex-1 flex items-center justify-center py-12"
          >
            <div className="w-full max-w-md bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-2xl">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                   <Key className="w-8 h-8 text-brand-400" />
                 </div>
                 <h2 className="text-xl font-bold mb-2 text-slate-50">Connect AWS Account</h2>
                 <p className="text-sm text-slate-400">
                   {scanMode === 'saved' ? 'Select a saved connection to scan.' : 'Enter credentials for a one-time scan.'}
                 </p>
               </div>

               {/* Toggle */}
               <div className="flex bg-slate-950 p-1.5 rounded-xl mb-6 border border-slate-800">
                 <button
                    onClick={() => setScanMode('saved')}
                    className={cn(
                       "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                       scanMode === 'saved' ? "bg-slate-800 text-slate-50 shadow-sm" : "text-slate-400 hover:text-slate-50"
                    )}
                 >
                    Saved Connection
                 </button>
                 <button
                    onClick={() => setScanMode('manual')}
                    className={cn(
                       "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                       scanMode === 'manual' ? "bg-slate-800 text-slate-50 shadow-sm" : "text-slate-400 hover:text-slate-50"
                    )}
                 >
                    Manual Credentials
                 </button>
               </div>

               {scanMode === 'saved' ? (
                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                           Select Connection
                        </label>
                        <select
                           value={selectedConnectionId}
                           onChange={(e) => setSelectedConnectionId(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-50 focus:border-brand-500 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-colors"
                        >
                           <option value="">-- Choose Connection --</option>
                           {connections
                              .filter(c => c.provider === 'aws')
                              .map(c => (
                                 <option key={c.id} value={c.id}>
                                    {c.name} ({c.status})
                                 </option>
                              ))
                           }
                        </select>
                        {connections.length === 0 && (
                           <p className="text-xs text-slate-500 mt-2">
                               No saved AWS connections found. <a href="/connections" className="text-brand-400 hover:underline">Create one</a> or use manual mode.
                           </p>
                        )}
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                           Region to Scan
                        </label>
                        <select
                           value={selectedRegion}
                           onChange={(e) => setSelectedRegion(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-50 focus:border-brand-500 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-colors"
                        >
                           {regions.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                           ))}
                        </select>
                     </div>

                     <div className="bg-brand-500/5 border border-brand-500/10 rounded-lg p-3 flex gap-3 text-xs text-brand-200">
                        <DollarSign className="w-5 h-5 flex-shrink-0 text-brand-400" />
                        <p>
                           Scan Cost: <strong className="text-slate-50">{CREDIT_COSTS.CLOUD_SCAN} credits</strong>.
                           Includes full IAM audit, resource inventory, and cost analysis.
                        </p>
                     </div>

                     <Button
                        onClick={handleScan}
                        disabled={!selectedConnectionId}
                        variant="primary"
                        fullWidth
                        loading={scanning} 
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                        className="h-12 text-sm"
                     >
                        Start Comprehensive Scan
                     </Button>
                  </div>
               ) : (
                  <form onSubmit={handleConnect} className="space-y-4">
                    {/* Manual Form fields omitted for brevity but would go here same as before */}
                     <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access Key ID</label>
                       <input
                         type="text"
                         value={credentials.accessKeyId}
                         onChange={e => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-50 focus:border-brand-500 outline-none"
                         placeholder="AKIA..."
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Secret Access Key</label>
                       <div className="relative">
                         <input
                           type={showSecret ? 'text' : 'password'}
                           value={credentials.secretAccessKey}
                           onChange={e => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-50 focus:border-brand-500 outline-none pr-10"
                           placeholder="wJalr..."
                           required
                         />
                         <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-50">
                           {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                       </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Region</label>
                        <select
                           value={credentials.region}
                           onChange={e => setCredentials({ ...credentials, region: e.target.value })}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-50 focus:border-brand-500 outline-none"
                        >
                           {regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                     </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={validating}
                      loadingText="Validating..."
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                      className="h-12 text-sm"
                    >
                      Verify & Scan
                    </Button>
                  </form>
               )}
            </div>
          </motion.div>
        )}

        {step === 'scanning' && (
          <motion.div
            key="scanning"
            {...fadeInUp}
            className="flex-1 flex flex-col items-center justify-center text-center py-20"
          >
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
              <div className="absolute inset-4 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <Cloud className="absolute inset-0 m-auto w-10 h-10 text-slate-50 animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-bold mb-3 text-slate-50">Scanning Environment</h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-12 text-lg">
              We are deeply analyzing your AWS account across multiple dimensions...
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-slate-500">
               {[
                   { icon: Server, label: "Resource Inventory" },
                   { icon: Key, label: "IAM & Permissions" },
                   { icon: DollarSign, label: "Cost & Usage" },
                   { icon: ShieldCheck, label: "Security Groups" },
                   { icon: Database, label: "Databases & Storage" },
                   { icon: Globe, label: "Network & ELB" },
                   { icon: BrainCircuit, label: "Lambda Functions" },
                   { icon: Box, label: "EKS Clusters" }
               ].map((item, idx) => (
                   <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-3 bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800"
                    >
                        <item.icon className="w-5 h-5 text-brand-500" /> {item.label}
                   </motion.div>
               ))}
            </div>
          </motion.div>
        )}

        {step === 'results' && results && (
          <motion.div
            key="results"
            {...fadeInUp}
            className="space-y-6 pb-12"
          >
             {/* Header */}
             <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-50 mb-1">Scan Results</h2>
                    <p className="text-slate-400">
                        Detailed analysis for <span className="font-mono text-slate-50">{results.scannedRegion}</span>
                        <span className="mx-2">•</span>
                        {results.summary.totalResources} Resources Found
                    </p>
                 </div>
                 <div className="flex gap-3">
                     <Button variant="outline" onClick={() => setStep('connect')}>New Scan</Button>
                     <Button variant="primary" rightIcon={<BarChart className="w-4 h-4" />}>Export Report</Button>
                 </div>
             </div>

             {/* Errors Alert */}
             {results.errors && results.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-400 mb-1">Partial Scan Failures</h4>
                        <p className="text-sm text-red-200/80 mb-2">Some permissions were missing. Results may be incomplete.</p>
                        <details className="text-xs text-red-300 cursor-pointer">
                            <summary>View Errors</summary>
                            <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
                                {results.errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </details>
                    </div>
                </div>
             )}

             {/* Navigation Tabs */}
             <div className="flex border-b border-slate-800">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'iam', label: 'IAM & Access', icon: Key },
                    { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
                    { id: 'resources', label: 'Resources', icon: Box },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setResultTab(tab.id as any)}
                        className={cn(
                            "px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-all",
                            resultTab === tab.id 
                                ? "border-brand-500 text-slate-50" 
                                : "border-transparent text-slate-400 hover:text-slate-50"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4", resultTab === tab.id ? "text-brand-400" : "")} />
                        {tab.label}
                    </button>
                ))}
             </div>

             {/* Tab Content */}
             <div className="py-2">
                 {resultTab === 'overview' && (
                     <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                <div className="text-slate-400 text-sm mb-1">Overall Score</div>
                                <div className="text-3xl font-bold text-slate-50 mb-2">
                                    {Math.max(0, 100 - (results.summary.criticalIssues * 10) - (results.summary.highIssues * 5))}
                                    <span className="text-sm text-slate-500 font-normal ml-1">/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-500 to-emerald-500" 
                                        style={{ width: `${Math.max(0, 100 - (results.summary.criticalIssues * 10))}%` }} 
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                <div className="text-slate-400 text-sm mb-1">Critical Issues</div>
                                <div className="text-3xl font-bold text-red-500 mb-2">{results.summary.criticalIssues}</div>
                                <div className="flex items-center gap-1.5 text-xs text-red-400/80">
                                <AlertTriangle className="w-3.5 h-3.5" /> Immediate action required
                                </div>
                            </div>
                            
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                <div className="text-slate-400 text-sm mb-1">Monthly Cost</div>
                                <div className="text-3xl font-bold text-slate-50 mb-2">
                                    ${results.costBreakdown?.totalMonthly.toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-500">
                                    Est. based on current usage
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                <div className="text-slate-400 text-sm mb-1">Potential Savings</div>
                                <div className="text-3xl font-bold text-emerald-500 mb-2">
                                    ${results.summary.estimatedMonthlySavings.toFixed(2)}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                                <TrendingDown className="w-3.5 h-3.5" /> Optimization available
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Security Feed */}
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                <h3 className="font-bold text-slate-50 mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-brand-400" /> Top Security Risks
                                </h3>
                                <div className="space-y-3">
                                    {results.securityIssues.slice(0, 5).map((issue, i) => (
                                        <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-bold text-slate-200">{issue.issue}</h4>
                                                <span className={cn(
                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                    issue.severity === 'CRITICAL' ? "bg-red-500/20 text-red-400" :
                                                    issue.severity === 'HIGH' ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                                                )}>{issue.severity}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="text-xs text-slate-500 font-mono">{issue.resourceType} • {issue.resourceId}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {results.securityIssues.length === 0 && <p className="text-slate-500 text-sm text-center">No major risks found.</p>}
                                </div>
                            </div>

                            {/* Cost Chart Preview */}
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                 <h3 className="font-bold text-slate-50 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emerald-400" /> Cost Distribution
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={costData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={100} tick={{fill: '#94a3b8', fontSize: 12}} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                                            />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {costData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#64748b'} />
                                                ))}
                                            </Bar>
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                     </div>
                 )}

                 {resultTab === 'iam' && results.iamDetails && (
                     <IAMViewer details={results.iamDetails} issues={results.securityIssues.filter(i => i.resourceType.includes('IAM'))} />
                 )}

                 {resultTab === 'cost' && (
                     <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                 <h3 className="font-bold text-slate-50 mb-2">Monthly Forecast</h3>
                                 <div className="text-4xl font-bold text-slate-50 mb-1">
                                    ${(results.costForecast || results.costBreakdown?.totalMonthly || 0).toFixed(2)}
                                 </div>
                                 <p className="text-sm text-slate-500">Projected cost for this month</p>
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                 <h3 className="font-bold text-slate-50 mb-2">Potential Savings</h3>
                                 <div className="text-4xl font-bold text-emerald-500 mb-1">
                                    ${results.summary.estimatedMonthlySavings.toFixed(2)}
                                 </div>
                                 <p className="text-sm text-emerald-500/80">Identified optimization opportunities</p>
                            </div>
                         </div>

                         <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                             <h3 className="font-bold text-slate-50 mb-6">Cost by Service</h3>
                             <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={costData}>
                                        <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <YAxis tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                             </div>
                         </div>
                         
                         <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                             <h3 className="font-bold text-slate-50 mb-4">Cost Issues & Recommendations</h3>
                             {results.costOpportunities.map((opp, idx) => (
                                 <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                                     <div>
                                         <div className="font-bold text-slate-200">{opp.recommendation}</div>
                                         <div className="text-xs text-slate-500 font-mono">{opp.resourceType} • {opp.resourceId}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="font-bold text-emerald-400">+${opp.potentialSavings.toFixed(2)}</div>
                                         <div className="text-xs text-slate-500">Savings</div>
                                     </div>
                                 </div>
                             ))}
                             {results.costOpportunities.length === 0 && <p className="text-slate-500">No cost issues found.</p>}
                         </div>
                     </div>
                 )}

                 {resultTab === 'resources' && (
                     <ResourcesViewer results={results} />
                 )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
