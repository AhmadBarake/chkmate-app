import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Globe,
  Server,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Box,
  Code2,
  FileCode,
  Zap,
  MapPin,
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Button from '../components/Button';
import {
  createProject,
  generateTemplate,
  fetchDeploymentCredentials,
  runDeploymentPlan,
  DeploymentCredential,
} from '../lib/api';
import { useToastActions } from '../context/ToastContext';
import { cn } from '../lib/utils';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-west-2', label: 'Europe (London)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'me-south-1', label: 'Middle East (Bahrain)' },
];

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}

const presets: TemplatePreset[] = [
  {
    id: 'react-spa',
    name: 'React / Vite SPA',
    description: 'S3 + CloudFront static site with custom domain support',
    icon: Code2,
    prompt: 'Create an AWS infrastructure for hosting a React SPA using S3 for static hosting with CloudFront CDN distribution, including proper bucket policies, OAC, and HTTPS redirect.',
  },
  {
    id: 'nextjs',
    name: 'Next.js App',
    description: 'Amplify hosting with SSR support and environment variables',
    icon: Globe,
    prompt: 'Create an AWS Amplify hosting configuration for a Next.js application with SSR support, custom domain, environment variables, and auto-deploy from a Git branch.',
  },
  {
    id: 'static-site',
    name: 'Static Website',
    description: 'S3 static website hosting with optional CloudFront',
    icon: FileCode,
    prompt: 'Create a simple AWS S3 static website hosting configuration with bucket policy for public read, index and error documents, and optional CloudFront distribution.',
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'ECS Fargate with ALB, auto-scaling, and RDS',
    icon: Server,
    prompt: 'Create an AWS ECS Fargate service for a Node.js API with an Application Load Balancer, auto-scaling policies, CloudWatch logging, VPC with public/private subnets, and an RDS PostgreSQL instance.',
  },
];

type WizardStep = 'template' | 'configure' | 'review';

export default function SimpleDeployWizard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const toast = useToastActions();

  const [step, setStep] = useState<WizardStep>('template');
  const [selectedPreset, setSelectedPreset] = useState<TemplatePreset | null>(null);
  const [appName, setAppName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [credentials, setCredentials] = useState<DeploymentCredential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    async function loadCredentials() {
      if (!user) return;
      try {
        const token = await getToken();
        const creds = await fetchDeploymentCredentials(token);
        setCredentials(creds.filter(c => c.isActive));
        if (creds.length > 0) {
          setSelectedCredential(creds.find(c => c.isActive)?.id || '');
        }
      } catch {
        // Will show empty state
      }
    }
    loadCredentials();
  }, [user, getToken]);

  const handleGenerate = async () => {
    if (!selectedPreset || !appName.trim()) return;
    setGenerating(true);
    try {
      const token = await getToken();

      // Create project
      const project = await createProject(appName.trim(), `Simplified deploy: ${selectedPreset.name}`, token);

      // Generate template
      const template = await generateTemplate(
        project.id,
        appName.trim(),
        selectedPreset.prompt + ` Use region ${region}. Name resources with the prefix "${appName.trim()}".`,
        'aws',
        token
      );

      toast.success('Infrastructure template generated!');

      if (selectedCredential) {
        // Go straight to deployment
        setDeploying(true);
        try {
          const planResult = await runDeploymentPlan(template.id, selectedCredential, region, token);
          toast.success('Deployment plan ready! Redirecting to review...');
          navigate(`/deploy`);
        } catch (err: any) {
          toast.error(err.message || 'Failed to create deployment plan');
          navigate(`/projects/${project.id}/templates/${template.id}`);
        }
      } else {
        // No credentials — redirect to template view
        toast.success('Template created! Set up deploy credentials to deploy.');
        navigate(`/projects/${project.id}/templates/${template.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate template');
    } finally {
      setGenerating(false);
      setDeploying(false);
    }
  };

  const steps: { key: WizardStep; label: string; num: number }[] = [
    { key: 'template', label: 'Choose Template', num: 1 },
    { key: 'configure', label: 'Configure', num: 2 },
    { key: 'review', label: 'Review & Deploy', num: 3 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Deploy an <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">App</span>
        </h2>
        <p className="text-slate-400 mt-1 font-medium">Choose a template, configure, and deploy — no Terraform required.</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all',
                i <= currentStepIndex
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-slate-600 border border-slate-800'
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                i < currentStepIndex ? 'bg-brand-500 text-white' : i === currentStepIndex ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-600'
              )}>
                {i < currentStepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-px', i < currentStepIndex ? 'bg-brand-500/30' : 'bg-slate-800')} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 'template' && (
          <motion.div
            key="template"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {presets.map((preset) => (
              <motion.div
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset);
                  setStep('configure');
                }}
                className={cn(
                  'bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl cursor-pointer group transition-all',
                  'hover:border-brand-500/30 hover:bg-slate-900/60',
                  selectedPreset?.id === preset.id && 'border-brand-500/40 bg-brand-500/5'
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                    <preset.icon className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-brand-300 transition-colors">{preset.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{preset.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 max-w-lg"
          >
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                {selectedPreset && <selectedPreset.icon className="w-5 h-5 text-brand-400" />}
                <span className="text-sm font-bold text-brand-400">{selectedPreset?.name}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">App Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="my-web-app"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-600 mt-1">Letters, numbers, and hyphens only</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                >
                  {AWS_REGIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {credentials.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deploy Credentials</label>
                  <select
                    value={selectedCredential}
                    onChange={(e) => setSelectedCredential(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                  >
                    <option value="">Generate template only</option>
                    {credentials.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('template')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!appName.trim()}
                leftIcon={<ArrowRight className="w-4 h-4" />}
              >
                Review
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 max-w-lg"
          >
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white">Deployment Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Template</span>
                  <span className="font-medium text-white">{selectedPreset?.name}</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">App Name</span>
                  <span className="font-medium text-white">{appName}</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Region</span>
                  <span className="font-medium text-white">{AWS_REGIONS.find(r => r.value === region)?.label}</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Deployment</span>
                  <span className="font-medium text-white">
                    {selectedCredential ? 'Auto-plan after generation' : 'Generate template only'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mt-4">
                <p className="text-xs text-slate-500">
                  Chkmate will generate a Terraform configuration based on the <strong className="text-slate-300">{selectedPreset?.name}</strong> template,
                  create a project named <strong className="text-slate-300">{appName}</strong>,
                  {selectedCredential
                    ? ' and automatically create a deployment plan for review.'
                    : ' which you can review and deploy later.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('configure')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating || deploying}
                leftIcon={generating || deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                className="shadow-lg shadow-brand-500/20"
              >
                {generating ? 'Generating...' : deploying ? 'Planning deployment...' : 'Deploy'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
