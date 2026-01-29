import React, { useState } from 'react';
import { Box, Cloud, Map, DollarSign, Rocket, Shield, Users, Code, Layout, Sparkles, GitCompare, FileCode as File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThreeCloudBackground from '../components/ThreeCloudBackground';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import RegisterInterestModal from '../components/RegisterInterestModal';
import Newsletter from '../components/Newsletter';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const goToDocs = () => navigate('/docs');

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-32 pb-32 px-6 min-h-screen flex items-center overflow-hidden">
        
        {/* Background Animation - Behind Content */}
        <div className="absolute inset-0 z-0 opacity-80">
            <ThreeCloudBackground />
        </div>
        
        {/* Hero Grid: Text + Image */}
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              v1.40 Closed Beta Access Now Open
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 drop-shadow-lg">
              Stop Guessing.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Start Deploying Secure, Cost-Aware Architecture.</span>
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-xl leading-relaxed drop-shadow-md">
              Describe your stack in plain English. We handle the Terraform, visualize the plan, and catch the cost leaks before you hit apply.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={openModal} className="bg-slate-100 text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10">
                Claim Early Access
              </button>
              <button onClick={goToDocs} className="bg-slate-900/80 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-medium transition-colors border border-slate-700 backdrop-blur-sm">
                Watch 2-Min Demo
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="hidden lg:block">
            <div className="relative scale-125 origin-left">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-indigo-500/20 rounded-3xl blur-2xl opacity-50"></div>
              <img 
                src="/Hero.png" 
                alt="Chkmate platform interface showing AI-powered Terraform generation and AWS infrastructure visualization"
                className="relative w-full rounded-2xl shadow-2xl shadow-black/50 border border-slate-700/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Value Props Section */}
      <div className="mt-24 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/20 p-8 rounded-3xl hover:border-emerald-500/40 transition-colors">
            <div className="mb-4 p-3 inline-block rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Zero Sticker Shock</h3>
            <p className="text-slate-400 leading-relaxed">
              See the exact monthly impact of every resource. From NAT Gateways to RDS IOPS—if it costs money, we find it.
            </p>
          </div>
          <div className="bg-gradient-to-br from-brand-500/10 to-slate-900/50 border border-brand-500/20 p-8 rounded-3xl hover:border-brand-500/40 transition-colors">
            <div className="mb-4 p-3 inline-block rounded-xl bg-brand-500/20 text-brand-400">
              <Shield size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Auto-Hardened Templates</h3>
            <p className="text-slate-400 leading-relaxed">
              Every line of generated HCL is scanned against 50+ security guardrails (S3 Public Access, IAM Least Privilege, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Features Section Starts Here - Natural Flow */}

      <div id="features" className="mt-32 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Everything you need to <span className="text-brand-400">master the cloud</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Natural Language to IaC", 
              desc: "Speak your infrastructure into existence. Support for AWS, Azure, and GCP. No more wrestling with documentation.",
              icon: Cloud
            },
            { 
              title: "Visual Architecture Maps", 
              desc: "Instantly visualize how your resources connect before writing a single line of code. Drag, drop, and refine.",
              icon: Map
            },
            { 
              title: "Cost Estimation", 
              desc: "Get accurate monthly projections based on resource types and volume. Avoid sticker shock.",
              icon: DollarSign
            },
             { 
              title: "One-Click Deploy", 
              desc: "Push your generated Terraform directly to your Git repository or apply it via our secure runner.",
              icon: Rocket
            },
             { 
              title: "Security Scans", 
              desc: "Built-in checkov and tfsec integration ensures your infrastructure is compliant from day one.",
              icon: Shield
            },
             { 
              title: "Team Collaboration", 
              desc: "Share templates, review designs, and manage state files together with your team.",
              icon: Users
            }
          ].map((feature, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-brand-500/50 transition-colors group">
               <div className="mb-6 p-4 inline-block rounded-full bg-slate-950 text-brand-400 border border-slate-800 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                  <feature.icon size={28} />
               </div>
               <h3 className="text-xl font-semibold mb-3 text-slate-100">{feature.title}</h3>
               <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start Guide: How it Works */}
      <div id="how-it-works" className="mt-32 py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Master your cloud in <span className="text-brand-400">5 simple steps</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              From blank page to production-ready infrastructure with full cost visibility and security guardrails.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
            {/* Step 1: Connect */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl group hover:border-brand-500/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                1
              </div>
              <h3 className="text-xl font-bold mb-4">Connect</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Establish a secure, read-only connection to your AWS account using a cross-account IAM role.
              </p>
              <div className="mt-auto p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 text-[10px] font-mono text-slate-500">
                Managed Policy: ReadOnlyAccess
              </div>
            </div>

            {/* Step 2: Prompt */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl group hover:border-brand-500/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                2
              </div>
              <h3 className="text-xl font-bold mb-4">Prompt</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Describe your desired architecture in plain English. AI understands your existing VPCs and Subnets.
              </p>
              <div className="mt-auto flex gap-1 items-center text-[10px] text-brand-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Context Aware
              </div>
            </div>

            {/* Step 3: Analyze */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl group hover:border-brand-500/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                3
              </div>
              <h3 className="text-xl font-bold mb-4">Analyze</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Instantly see a visual diagram, monthly cost breakdown, and automated security audit report.
              </p>
              <div className="mt-auto flex items-center justify-between">
                <div className="h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400">85 Score</span>
              </div>
            </div>

            {/* Step 4: Refine */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl group hover:border-brand-500/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                4
              </div>
              <h3 className="text-xl font-bold mb-4">Refine</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Use the Diff Engine to compare changes. See exactly how cost and security impact evolves as you edit.
              </p>
              <div className="mt-auto flex items-center gap-2 text-blue-400 text-[10px] font-bold">
                <GitCompare className="w-3 h-3" /> Side-by-Side Diff
              </div>
            </div>

            {/* Step 5: Sync */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl group hover:border-brand-500/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                5
              </div>
              <h3 className="text-xl font-bold mb-4">Git-Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Download your Terraform files or sync directly to GitHub. Your infrastructure is now versioned and ready.
              </p>
              <div className="mt-auto flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <File className="w-3 h-3 text-slate-400" />
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Code className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Who is it for */}
      <div className="mt-32 max-w-6xl mx-auto px-6">
           <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Built for <span className="text-indigo-400">Builders</span></h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-brand-500/30 transition-colors group">
                   <div className="mb-6 p-4 inline-block rounded-full bg-slate-950 text-brand-400 border border-slate-800 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                      <Code size={32} />
                   </div>
                   <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">Developers</h3>
                   <ul className="space-y-3 text-slate-300">
                       <li className="flex gap-2">• Stop context switching between code and docs.</li>
                       <li className="flex gap-2">• Generate boilerplate in seconds.</li>
                       <li className="flex gap-2">• Focus on application logic, not HCL syntax.</li>
                   </ul>
               </div>
               <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-brand-500/30 transition-colors group">
                    <div className="mb-6 p-4 inline-block rounded-full bg-slate-950 text-brand-400 border border-slate-800 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                      <Layout size={32} />
                   </div>
                   <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">Architects</h3>
                   <ul className="space-y-3 text-slate-300">
                       <li className="flex gap-2">• Design systems visually.</li>
                       <li className="flex gap-2">• Standardize patterns across teams.</li>
                       <li className="flex gap-2">• Get instant cost estimates for proposals.</li>
                   </ul>
               </div>
           </div>
      </div>

       {/* Pricing */}
       <div id="pricing" className="mt-32 max-w-5xl mx-auto px-6 mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-6">Simple Pricing</h2>
          <p className="text-center text-slate-400 mb-16 text-xl">Start building for free, upgrade when you scale.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Free Tier */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30">
                  <h3 className="text-xl font-bold text-slate-300">Hobby</h3>
                  <div className="text-4xl font-bold mt-4 mb-2">$0</div>
                  <p className="text-slate-500 text-sm mb-6">Forever free for individuals.</p>
                  <button onClick={openModal} className="w-full py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition font-medium mb-8">Register Interest</button>
                  <ul className="space-y-3 text-sm text-slate-400">
                      <li>• 5 Projects</li>
                      <li>• Basic Generators</li>
                      <li>• Community Support</li>
                  </ul>
              </div>

              {/* Pro Tier */}
              <div className="p-8 rounded-2xl border border-brand-500 bg-slate-900/80 relative transform md:-translate-y-4 shadow-2xl shadow-brand-500/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <div className="text-4xl font-bold mt-4 mb-2 text-brand-400">$29<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <p className="text-slate-400 text-sm mb-6">For power users and freelancers.</p>
                  <button onClick={openModal} className="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition font-medium mb-8">Register Interest</button>
                  <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex gap-2"><Box className="w-4 h-4 text-brand-400"/> Unlimited Projects</li>
                      <li className="flex gap-2"><Box className="w-4 h-4 text-brand-400"/> Advanced AI Models</li>
                      <li className="flex gap-2"><Box className="w-4 h-4 text-brand-400"/> Export to GitHub</li>
                      <li className="flex gap-2"><Box className="w-4 h-4 text-brand-400"/> Priority Support</li>
                  </ul>
              </div>

              {/* Team Tier */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30">
                  <h3 className="text-xl font-bold text-slate-300">Team</h3>
                  <div className="text-4xl font-bold mt-4 mb-2">$99<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <p className="text-slate-500 text-sm mb-6">For startups and agencies.</p>
                  <button onClick={openModal} className="w-full py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition font-medium mb-8">Register Interest</button>
                  <ul className="space-y-3 text-sm text-slate-400">
                      <li>• 10 Team Members</li>
                      <li>• SSO & Audit Logs</li>
                      <li>• Custom Templates</li>
                      <li>• Dedicated Success Mgr</li>
                  </ul>
              </div>
          </div>
          
          <div className="text-center mt-12">
            <button onClick={() => navigate('/pricing')} className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-2 mx-auto">
               Compare Plans & Credit Packs <Rocket size={16} />
            </button>
          </div>
       </div>

    {/* Newsletter */}
    <Newsletter />

    {/* Footer */}
    <Footer />
    
    <RegisterInterestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
  </div>
  );
}
