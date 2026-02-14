import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Link,
  DollarSign,
  Shield,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import Button from '../components/Button';
import { staggerContainer, staggerItem } from '../lib/animations';
import { cn } from '../lib/utils';

interface GuideStep {
  title: string;
  description: string;
  action?: { label: string; to: string };
}

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  difficulty: 'Beginner' | 'Intermediate';
  timeEstimate: string;
  steps: GuideStep[];
}

const guides: Guide[] = [
  {
    id: 'deploy-spa',
    title: 'Deploy your first web app',
    description: 'Go from zero to a live React, Vue, or static website hosted on AWS with CloudFront CDN.',
    icon: Rocket,
    color: 'brand',
    difficulty: 'Beginner',
    timeEstimate: '5 min',
    steps: [
      {
        title: 'Choose a template',
        description: 'Head to the Deploy App wizard and pick from our pre-built templates — React SPA, Next.js, Static Site, or Node API.',
        action: { label: 'Open Deploy Wizard', to: '/simple/deploy' },
      },
      {
        title: 'Name and configure',
        description: 'Give your app a name and select the AWS region closest to your users. We handle all the Terraform configuration for you.',
      },
      {
        title: 'Set up deploy credentials (optional)',
        description: 'To deploy automatically, connect your AWS credentials. You can also generate the template first and deploy later.',
        action: { label: 'Manage Credentials', to: '/deploy/credentials' },
      },
      {
        title: 'Review and launch',
        description: 'Review the deployment plan showing what resources will be created, estimated costs, and security audit. Hit deploy when ready.',
      },
      {
        title: 'Monitor your deployment',
        description: 'Track deployment progress in real-time. Once complete, you\'ll see your live endpoint and resource details.',
        action: { label: 'View Deployments', to: '/deploy' },
      },
    ],
  },
  {
    id: 'connect-aws',
    title: 'Connect your AWS account',
    description: 'Securely link your AWS account to discover resources, analyze costs, and get security insights.',
    icon: Link,
    color: 'violet',
    difficulty: 'Beginner',
    timeEstimate: '2 min',
    steps: [
      {
        title: 'Go to Connections',
        description: 'Navigate to the Connections page where you can manage your cloud account links.',
        action: { label: 'Open Connections', to: '/connections' },
      },
      {
        title: 'Create an IAM role',
        description: 'Chkmate uses a cross-account IAM role for secure, read-only access. We provide a CloudFormation template that sets this up automatically.',
      },
      {
        title: 'Enter your Role ARN',
        description: 'After the CloudFormation stack completes, copy the Role ARN from the outputs tab and paste it into Chkmate.',
      },
      {
        title: 'Verify connection',
        description: 'Chkmate will validate the connection and start discovering your resources. This typically takes under a minute.',
      },
    ],
  },
  {
    id: 'understand-costs',
    title: 'Understand your cloud costs',
    description: 'Learn how to read cost breakdowns, identify waste, and act on savings recommendations.',
    icon: DollarSign,
    color: 'emerald',
    difficulty: 'Beginner',
    timeEstimate: '3 min',
    steps: [
      {
        title: 'Connect your account first',
        description: 'Cost analysis requires an active AWS connection. If you haven\'t already, set one up.',
        action: { label: 'Connect AWS', to: '/connections' },
      },
      {
        title: 'View Cost Overview',
        description: 'The Cost Overview page shows your estimated monthly spend, a service-by-service breakdown, and potential savings.',
        action: { label: 'View Costs', to: '/simple/costs' },
      },
      {
        title: 'Review recommendations',
        description: 'Smart Advice analyzes your resources and suggests optimizations. Each recommendation shows estimated savings and implementation effort.',
        action: { label: 'Smart Advice', to: '/recommendations' },
      },
      {
        title: 'Deep dive with Cost Control',
        description: 'For detailed analysis with trends, filters, and export — switch to Full mode and use the Cost Control dashboard.',
        action: { label: 'Cost Control', to: '/cost-control' },
      },
    ],
  },
  {
    id: 'secure-infra',
    title: 'Secure your infrastructure',
    description: 'Review security findings from cloud scans and learn how to remediate common issues.',
    icon: Shield,
    color: 'amber',
    difficulty: 'Intermediate',
    timeEstimate: '10 min',
    steps: [
      {
        title: 'Run a cloud scan',
        description: 'The Cloud Scanner checks your AWS resources against 19 security policies covering IAM, S3, EC2, RDS, and more.',
        action: { label: 'Cloud Scanner', to: '/cloud-scanner' },
      },
      {
        title: 'Review findings',
        description: 'Findings are categorized as Critical, High, Medium, or Low. Focus on Critical and High severity items first.',
      },
      {
        title: 'Use Smart Advice',
        description: 'Generate AI-powered recommendations for security improvements. Each recommendation explains the risk and how to fix it.',
        action: { label: 'Smart Advice', to: '/recommendations' },
      },
      {
        title: 'Apply fixes with Agentic Mode',
        description: 'For Terraform-managed infrastructure, enable Agentic Mode to automatically generate and apply security fixes to your templates.',
      },
    ],
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  brand: { bg: 'bg-brand-500/10', border: 'border-brand-500/20', text: 'text-brand-400', badge: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export default function SimpleGuides() {
  const navigate = useNavigate();
  const [expandedGuide, setExpandedGuide] = useState<string | null>('deploy-spa');

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-brand-400" />
          <h2 className="text-3xl font-extrabold tracking-tight">
            Getting Started <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">Guides</span>
          </h2>
        </div>
        <p className="text-slate-400 mt-1 font-medium">Step-by-step walkthroughs to get the most out of Chkmate.</p>
      </motion.div>

      {/* Guide Cards */}
      <motion.div
        className="space-y-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {guides.map((guide) => {
          const colors = colorClasses[guide.color];
          const isExpanded = expandedGuide === guide.id;

          return (
            <motion.div
              key={guide.id}
              variants={staggerItem}
              className={cn(
                'bg-slate-900/40 border rounded-2xl transition-all overflow-hidden',
                isExpanded ? 'border-slate-700' : 'border-slate-800/50 hover:border-slate-700'
              )}
            >
              {/* Guide Header */}
              <button
                onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                className="w-full flex items-center gap-4 p-6 text-left"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', colors.bg, colors.border, 'border')}>
                  <guide.icon className={cn('w-6 h-6', colors.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-50">{guide.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{guide.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', colors.badge)}>
                    {guide.difficulty}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {guide.timeEstimate}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  </motion.div>
                </div>
              </button>

              {/* Expanded Steps */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 pt-0">
                      <div className="border-t border-slate-800 pt-5 space-y-4">
                        {guide.steps.map((guideStep, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                                colors.bg, colors.text
                              )}>
                                {idx + 1}
                              </div>
                              {idx < guide.steps.length - 1 && (
                                <div className="w-px flex-1 bg-slate-800 mt-2" />
                              )}
                            </div>
                            <div className="pb-4 flex-1">
                              <p className="font-bold text-sm text-slate-50">{guideStep.title}</p>
                              <p className="text-sm text-slate-400 mt-1">{guideStep.description}</p>
                              {guideStep.action && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(guideStep.action!.to);
                                  }}
                                  className={cn('flex items-center gap-1 text-sm font-medium mt-2 hover:underline', colors.text)}
                                >
                                  {guideStep.action.label} <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
