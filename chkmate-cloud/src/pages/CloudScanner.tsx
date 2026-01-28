import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Key, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle,
  BarChart,
  Lock,
  DollarSign,
  ChevronRight,
  Server,
  Database,
  Globe,
  HardDrive,
  Eye,
  EyeOff,
  TrendingDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import Button from '../components/Button';
import { fadeInUp } from '../lib/animations';
import { validateCloudCredentials, scanCloudAccount, scanSavedConnection, fetchConnections, AWSCredentials, CloudScanResult, CloudConnection, CREDIT_COSTS } from '../lib/api';
import { useToastActions } from '../context/ToastContext';

import { useAuth, useUser } from '@clerk/clerk-react';

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
        handleScan();
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

    try {
      // Add artificial delay for UX (scanning feels better if it takes a moment)
      await new Promise(r => setTimeout(r, 2000));
      
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
      
      if (scanResults.creditsRemaining !== undefined) {
        // Optionally update global credit context
      }
    } catch (err: any) {
      toast.error(err.message || 'Scan failed');
      setStep('connect');
    } finally {
      setScanning(false);
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

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Cloud className="text-brand-400" />
          Cloud Infrastructure Scanner
        </h1>
        <p className="text-slate-400">
          Connect your AWS account to scan for security vulnerabilities and cost optimization opportunities.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'connect' && (
          <motion.div
            key="connect"
            {...fadeInUp}
            className="flex-1 flex items-center justify-center"
          >
            <div className="w-full max-w-md bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Key className="w-8 h-8 text-brand-400" />
                 </div>
                 <h2 className="text-xl font-bold mb-2">Connect AWS Account</h2>
                 <p className="text-sm text-slate-400">
                   {scanMode === 'saved' ? 'Select a saved connection to scan.' : 'Enter credentials for a one-time scan.'}
                 </p>
               </div>

               {/* Toggle */}
               <div className="flex bg-slate-950 p-1 rounded-lg mb-6 border border-slate-800">
                 <button
                    onClick={() => setScanMode('saved')}
                    className={cn(
                       "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                       scanMode === 'saved' ? "bg-brand-500 text-white shadow" : "text-slate-400 hover:text-white"
                    )}
                 >
                    Saved Connection
                 </button>
                 <button
                    onClick={() => setScanMode('manual')}
                    className={cn(
                       "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                       scanMode === 'manual' ? "bg-brand-500 text-white shadow" : "text-slate-400 hover:text-white"
                    )}
                 >
                    Manual Credentials
                 </button>
               </div>

               {scanMode === 'saved' ? (
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                           Select Connection
                        </label>
                        <select
                           value={selectedConnectionId}
                           onChange={(e) => setSelectedConnectionId(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
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
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                           Region to Scan
                        </label>
                        <select
                           value={selectedRegion}
                           onChange={(e) => setSelectedRegion(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
                        >
                           {regions.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                           ))}
                        </select>
                     </div>

                     <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 flex gap-3 text-xs text-brand-200">
                        <DollarSign className="w-5 h-5 flex-shrink-0" />
                        <p>
                           Scan Cost: <strong>{CREDIT_COSTS.CLOUD_SCAN} credits</strong>.
                           Includes security audit and cost analysis.
                        </p>
                     </div>

                     <Button
                        onClick={handleScan}
                        disabled={!selectedConnectionId}
                        variant="primary"
                        fullWidth
                        loading={scanning} // Reusing scanning state for loading button
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                     >
                        Start Scan
                     </Button>
                  </div>
               ) : (
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Access Key ID
                      </label>
                      <input
                        type="text"
                        value={credentials.accessKeyId}
                        onChange={e => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none transition-colors"
                        placeholder="AKIA..."
                        required
                      />
                    </div>
    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Secret Access Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={credentials.secretAccessKey}
                          onChange={e => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none transition-colors pr-10"
                          placeholder="wJalr..."
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Region
                      </label>
                      <select
                        value={credentials.region}
                        onChange={e => setCredentials({ ...credentials, region: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none transition-colors appearance-none"
                      >
                        {regions.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
    
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 text-xs text-blue-200">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <p>
                        We recommend using a temporary IAM user with 
                        <code className="bg-blue-500/20 px-1 py-0.5 rounded mx-1">ReadOnlyAccess</code> 
                        permission. Credentials are never stored.
                      </p>
                    </div>
    
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={validating}
                      loadingText="Validating credentials..."
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Start Scan
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
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
              <div className="absolute inset-4 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <Cloud className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Scanning Environment</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Analyzing S3 buckets, EC2 instances, Security Groups, RDS databases, and IAM configurations...
            </p>

            <div className="flex gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" /> EC2 & Network
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> Storage
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" /> Databases
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" /> IAM
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && results && (
          <motion.div
            key="results"
            {...fadeInUp}
            className="space-y-6 pb-12"
          >
            {/* Scan Errors */}
            {results.errors && results.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6">
                 <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5" />
                   Scan Completed with Errors
                 </h3>
                 <p className="text-red-200/60 text-sm mb-3">
                   Some resources could not be scanned due to permission issues. The results below may be incomplete.
                 </p>
                 <ul className="list-disc list-inside text-red-200/80 text-sm space-y-1">
                   {results.errors.map((err, i) => (
                     <li key={i}>{err}</li>
                   ))}
                 </ul>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-sm mb-1">Total Resources</div>
                <div className="text-3xl font-bold text-white mb-2">{results.summary.totalResources}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe className="w-3.5 h-3.5" /> Scanned {results.scannedRegion ? `in ${results.scannedRegion}` : `Account`}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="font-bold text-slate-400">Note:</span> S3 and IAM results are global.
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
                <div className="text-slate-400 text-sm mb-1">High Priority</div>
                <div className="text-3xl font-bold text-orange-500 mb-2">{results.summary.highIssues}</div>
                <div className="flex items-center gap-1.5 text-xs text-orange-400/80">
                  <ShieldCheck className="w-3.5 h-3.5" /> Recommended fixes
                </div>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-sm mb-1">Monthly Cost</div>
                <div className="text-3xl font-bold text-white mb-2">
                  ${results.costBreakdown?.totalMonthly.toFixed(2) || '0.00'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <DollarSign className="w-3.5 h-3.5" /> Est. running cost
                </div>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-sm mb-1">Monthly Savings</div>
                <div className="text-3xl font-bold text-emerald-500 mb-2">${results.summary.estimatedMonthlySavings.toFixed(2)}</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                  <TrendingDown className="w-3.5 h-3.5" /> Optimization potential
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Issues Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-400" />
                    Security Findings
                  </h3>
                  
                  <div className="space-y-3">
                    {results.securityIssues.map((issue, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded uppercase",
                                issue.severity === 'CRITICAL' ? "bg-red-500/20 text-red-400" :
                                issue.severity === 'HIGH' ? "bg-orange-500/20 text-orange-400" :
                                issue.severity === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-blue-500/20 text-blue-400"
                              )}>
                                {issue.severity}
                              </span>
                              <span className="text-slate-400 text-xs font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                                {issue.resourceType}
                              </span>
                            </div>
                            <h4 className="font-medium text-slate-200">{issue.issue}</h4>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg text-sm">
                          <AlertTriangle className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-slate-400">Resource: </span>
                            <span className="text-white font-mono">{issue.resourceId}</span>
                            <p className="text-slate-400 mt-1">
                             <span className="text-brand-400 font-medium">Recommendation:</span> {issue.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {results.securityIssues.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" />
                        <p>No security issues found. Great job!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Cost Optimization
                  </h3>
                  
                  <div className="space-y-3">
                    {results.costOpportunities.map((opp, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                        <div>
                          <div className="text-xs text-slate-400 font-mono mb-1">{opp.resourceType} • {opp.resourceId}</div>
                          <h4 className="font-medium text-slate-200 mb-1">{opp.recommendation}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-bold">+${opp.potentialSavings}/mo</div>
                          <div className="text-xs text-slate-500">Potential Savings</div>
                        </div>
                      </div>
                    ))}
                    
                    {results.costOpportunities.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" />
                        <p>No blatant cost inefficiencies found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Actions */}
              <div className="space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 sticky top-4">
                  <h3 className="font-bold mb-4">Export Report</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Download a detailed PDF report of these findings to share with your team.
                  </p>
                  <Button variant="secondary" fullWidth rightIcon={<BarChart className="w-4 h-4" />}>
                    Download Report
                  </Button>
                  
                  <div className="border-t border-slate-800 my-6 pt-6">
                    <h4 className="font-bold mb-2 text-sm">Next Scan</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Schedule automated scans to keep your infrastructure secure.
                    </p>
                    <Button variant="outline" fullWidth>
                      Configure Schedule
                    </Button>
                  </div>
                  
                  <Button variant="ghost" fullWidth onClick={() => setStep('connect')}>
                    Scan Another Account
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
