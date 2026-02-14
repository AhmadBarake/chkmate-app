import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { GitCommit, Clock, Zap, Globe, Shield, Bot, Rocket, Bug, Sparkles, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

interface ChangeItem {
  tag: string;
  tagColor: string;
  title: string;
  description: string;
}

interface VersionEntry {
  version: string;
  date?: string;
  label?: string;
  labelColor?: string;
  dotColor: string;
  changes: ChangeItem[];
  opacity?: string;
}

const changelog: VersionEntry[] = [
  {
    version: 'v0.22-beta',
    label: 'Current',
    labelColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-brand-500',
    changes: [
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Agentic Deployments',
        description: 'Sandboxed Terraform plan/apply/destroy with encrypted state storage, cross-account IAM role assumption, and deployment dashboard.',
      },
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Agentic Auto-Fix Mode',
        description: 'AI-powered remediation engine with 29 security + 10 cost policies, change plan UI with per-change diffs, and one-click apply.',
      },
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Template Versioning',
        description: 'Automatic version snapshots before agent modifications with full restore capability.',
      },
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Expanded Cloud Scanner',
        description: 'Now scans 19 AWS services with pagination: EC2, RDS, S3, IAM, Lambda, DynamoDB, ECS, CloudFront, Route53, SNS, SQS, ElastiCache, API Gateway, Amplify, ELB, and more.',
      },
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Recursive Terraform Parser',
        description: 'Complete rewrite from regex to balanced-brace HCL parser supporting nested blocks, heredocs, modules, data sources, and dynamic blocks.',
      },
      {
        tag: 'Fix', tagColor: 'bg-red-500/10 text-red-400',
        title: '14 Critical Bug Fixes',
        description: 'Fixed SQL injection in policy engine, XSS in resource display, race conditions in credit deduction, and 11 more security/data integrity issues.',
      },
    ],
  },
  {
    version: 'v0.15',
    label: 'Closed Beta',
    labelColor: 'bg-slate-800 text-slate-400 border-slate-700',
    dotColor: 'bg-slate-600',
    changes: [
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Immersive Infrastructure Map',
        description: 'Interactive, node-based visualization for AWS resources with auto-layout and zoom capabilities.',
      },
      {
        tag: 'UX', tagColor: 'bg-blue-500/10 text-blue-400',
        title: 'Design Refresh',
        description: 'Overhauled landing page with premium slate-950 theme, glassmorphism effects, and refined typography.',
      },
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Legal Compliance Suite',
        description: 'GDPR-compliant Terms, Privacy, and Refund policy pages with Paddle as Merchant of Record.',
      },
    ],
  },
  {
    version: 'v0.10',
    date: '2026-01-26',
    dotColor: 'bg-slate-700',
    changes: [
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Project Restructuring',
        description: 'Separated SaaS application from marketing website into dedicated repository.',
      },
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Secure Authentication Suite',
        description: 'Clerk-based auth with backend token validation and protected routes.',
      },
      {
        tag: 'Refactor', tagColor: 'bg-blue-500/10 text-blue-400',
        title: 'AI Widget Optimization',
        description: 'Refactored embedded AI assistant into a floating widget for better UX.',
      },
    ],
  },
  {
    version: 'v0.1 - v0.9',
    date: 'Oct - Dec 2025',
    dotColor: 'bg-slate-700',
    opacity: 'opacity-70',
    changes: [
      {
        tag: 'Feat', tagColor: 'bg-emerald-500/10 text-emerald-400',
        title: 'Core Platform',
        description: 'AWS Cloud Scanner, IaC Builder, Cost Control Dashboard, Infrastructure Map, Credit System, and ECS Fargate deployment pipeline.',
      },
    ],
  },
];

interface RoadmapItem {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  quarter: string;
  status: 'in-progress' | 'planned' | 'exploring';
}

const roadmapItems: RoadmapItem[] = [
  {
    icon: Bot,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10',
    title: 'Agentic V2: Drift Detection & Auto-Remediation',
    description: 'Continuous monitoring of deployed infrastructure. Detect drift from your Terraform state and auto-generate remediation plans.',
    quarter: 'Q2 2026',
    status: 'in-progress',
  },
  {
    icon: Zap,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Context-Aware AI Generation',
    description: 'Deep integration with your existing infrastructure state. The AI will understand your current VPCs, security groups, and IAM to suggest non-conflicting additions.',
    quarter: 'Q2 2026',
    status: 'planned',
  },
  {
    icon: Globe,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    title: 'Multi-Cloud Support',
    description: 'Native support for Azure ARM/Bicep and Google Cloud Platform. Generate cross-cloud architectures with a single prompt.',
    quarter: 'Q3 2026',
    status: 'planned',
  },
  {
    icon: Shield,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    title: 'Advanced Governance (OPA/Sentinel)',
    description: 'Wider policy context for OPA and Sentinel integration. Define organizational guardrails that the AI must strictly adhere to.',
    quarter: 'Q3 2026',
    status: 'exploring',
  },
  {
    icon: Rocket,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10',
    title: 'CI/CD Pipeline Generation',
    description: 'Automatically generate GitHub Actions, GitLab CI, or AWS CodePipeline configurations alongside your Terraform code.',
    quarter: 'Q4 2026',
    status: 'exploring',
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  'in-progress': { label: 'In Progress', color: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  'planned': { label: 'Planned', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  'exploring': { label: 'Exploring', color: 'bg-slate-800 text-slate-400 border-slate-700' },
};

export default function Documentation() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-brand-500/30 font-sans">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12">

          {/* Main Content */}
          <main className="flex-1">
            {/* Hero */}
            <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                Beta
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Changelog & Roadmap</h1>
              <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
                Stay updated with the latest improvements and see what's coming next to chkmate.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-500">
                <GitCommit className="w-3.5 h-3.5 text-brand-400" />
                v0.22-beta &middot; 22 commits on main
              </div>
            </motion.div>

            {/* Changelog Section */}
            <section className="mb-20">
              <motion.h2
                {...fadeUp}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold mb-8 flex items-center gap-3"
              >
                <GitCommit className="text-brand-400" /> Latest Updates
              </motion.h2>

              <div className="relative pl-8 border-l border-slate-800 space-y-12">
                {changelog.map((entry, entryIdx) => (
                  <motion.div
                    key={entry.version}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: entryIdx * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative ${entry.opacity || ''}`}
                  >
                    <span className={`absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-slate-950 ${entry.dotColor}`} />
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-50">{entry.version}</h3>
                      {entry.label && (
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${entry.labelColor}`}>
                          {entry.label}
                        </span>
                      )}
                      {entry.date && (
                        <span className="text-xs text-slate-500 font-mono">{entry.date}</span>
                      )}
                    </div>
                    <ul className="space-y-4 text-slate-400 mt-4">
                      {entry.changes.map((change, changeIdx) => (
                        <motion.li
                          key={changeIdx}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: entryIdx * 0.1 + changeIdx * 0.05 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-3"
                        >
                          <span className={`${change.tagColor} text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 flex-shrink-0`}>
                            {change.tag}
                          </span>
                          <span>
                            <strong className="text-slate-200 block mb-1">{change.title}</strong>
                            {change.description}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Roadmap Section */}
            <section>
              <motion.h2
                {...fadeUp}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold mb-8 flex items-center gap-3"
              >
                <Clock className="text-indigo-400" /> Coming Soon
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roadmapItems.map((item, i) => {
                  const status = statusConfig[item.status];
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-brand-500/30 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 ${item.iconBg} ${item.iconColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <item.icon size={20} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        {item.description}
                      </p>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-slate-950 rounded text-[10px] font-mono text-slate-500 border border-slate-800">
                          {item.quarter}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

          </main>

          {/* Sidebar Navigation */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-32">
              <h4 className="font-bold text-slate-200 mb-4 px-2">On this page</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <a href="#" className="block px-2 py-1.5 text-brand-400 border-l-2 border-brand-500 bg-brand-500/5 hover:text-brand-300 transition-colors">
                    Changelog
                  </a>
                </li>
                <li>
                  <a href="#" className="block px-2 py-1.5 text-slate-500 border-l-2 border-transparent hover:text-slate-300 hover:border-slate-800 transition-colors">
                    Roadmap
                  </a>
                </li>
              </ul>

              {/* Beta badge */}
              <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Beta Status</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chkmate is in closed beta. Features and pricing may change. Early adopters lock in lifetime pricing.
                </p>
                <div className="mt-3 text-xs font-mono text-slate-600">
                  v0.22-beta
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  );
}
