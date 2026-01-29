import React, { useState } from 'react';
import { Box, Cloud, Map, DollarSign, Rocket, Shield, Users, Code, Layout, Sparkles, GitCompare, FileCode as File, ArrowRight, Check, PieChart, ShieldCheck, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThreeCloudBackground from '../components/ThreeCloudBackground';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import RegisterInterestModal from '../components/RegisterInterestModal';
import Newsletter from '../components/Newsletter';
import TypewriterHero from '../components/TypewriterHero';
import CodeArchitectAnimation from '../components/animations/CodeArchitectAnimation';
import CostChartAnimation from '../components/animations/CostChartAnimation';
import VisualMapAnimation from '../components/animations/VisualMapAnimation';
import SecurityScanAnimation from '../components/animations/SecurityScanAnimation';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
        question: "How does the 'Natural Language to IaC' work?",
        answer: "We use advanced LLMs fine-tuned on Terraform and cloud architecture patterns. You describe your infrastructure in plain English, and our engine generates valid, secure-by-default Terraform code, which you can then visualize and refine."
    },
    {
        question: "Can I import my existing AWS environment?",
        answer: "Yes! Our 'Day 2' features allow you to connect your AWS account (via a read-only role). We scan your existing resources, generate a visual map, and provide cost and security insights immediately."
    },
    {
        question: " Is it safe to give Chkmate access to my AWS account?",
        answer: "We take security seriously. We only request ReadOnlyAccess to scan your resources. We never store your credentials directly; we use secure IAM roles with external IDs. You can revoke access at any time from your AWS console."
    },
    {
        question: "What happens if the AI generates incorrect code?",
        answer: "Chkmate includes a 'Diff Engine' and verification steps. You can review every line of code generated, see it visualized, and run automatic validation (terraform plan) before applying anything. We also integrate checkov and tfsec to catch misconfigurations."
    }
  ];

  const openModal = () => setIsModalOpen(true);
  const goToDocs = () => navigate('/docs');

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-36 pb-10 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
        
        {/* Subtle Background */}
        <div className="absolute inset-0 z-0 opacity-80">
           <ThreeCloudBackground /> 
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide mb-8 backdrop-blur-md uppercase">
                v1.41 Closed Beta now live
            </div>

            {/* Hero Visual: Typewriter Effect */}
            <div className="w-full mb-8">
               <TypewriterHero />
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-6xl font-semibold tracking-tighter mb-4">
                Build Production-Ready <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Infra in Minutes.</span>
            </h1>

            {/* Subhead */}
            <p className="text-lg md:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed font-medium">
                Stop wrestling with HCL and hidden costs. Describe your stack in plain English—Chkmate generates secure, cost-optimized Terraform with automated visual maps and instant budget audits.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16">
                <button onClick={openModal} className="bg-slate-100 text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-white/10">
                    Request Access
                </button>
                <button onClick={goToDocs} className="bg-slate-900/80 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all border border-slate-700 backdrop-blur-sm flex items-center justify-center">
                   View Roadmap
                </button>
            </div>

        </div>
      </div>

      {/* Bento Grid Features Section */}
      <div id="features" className="py-32 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
            <div className="mb-20">
                <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">Designed for scale.</h2>
                <p className="text-2xl text-slate-400 max-w-3xl">Everything you need to build secure, cost-effective infrastructure without the headache.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Large Card 1 */}
                <div className="md:col-span-2 bg-slate-900/50 rounded-[2rem] p-10 overflow-hidden relative group border border-slate-800 hover:border-brand-500/30 transition-colors">
                    <div className="relative z-10 max-w-lg">
                        <div className="mb-4 text-indigo-400"><Cloud size={32} /></div>
                        <h3 className="text-3xl font-semibold mb-3">AI-Powered HCL Architect</h3>
                        <p className="text-slate-400 text-lg">Positions it as an "Expert" in the room. You describe the intent, we generate the valid Terraform code.</p>
                    </div>
                    {/* Feature Image */}
                    <div className="mt-10 aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
                        <CodeArchitectAnimation />
                    </div>
                </div>

                {/* Tall Card 2 */}
                <div className="md:col-span-1 bg-slate-900/50 rounded-[2rem] p-10 overflow-hidden relative group border border-slate-800 hover:border-brand-500/30 transition-colors">
                     <div className="mb-4 text-emerald-400"><DollarSign size={32} /></div>
                     <h3 className="text-3xl font-semibold mb-3">Eliminate Sticker Shock</h3>
                     <p className="text-slate-400 text-lg mb-8">Eliminate the "Surprise Bill". Know exactly what your infra costs before you deploy.</p>
                     
                     {/* Cost Graph */}
                    <div className="w-full h-[400px] md:h-auto md:aspect-[3/5] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                        <CostChartAnimation />
                    </div>
                </div>

                {/* Medium Card 3 */}
                <div className="md:col-span-1 bg-slate-900/50 rounded-[2rem] p-10 overflow-hidden group border border-slate-800 hover:border-brand-500/30 transition-colors">
                    <div className="mb-4 text-blue-400"><Map size={32} /></div>
                    <h3 className="text-2xl font-semibold mb-3">Visual Maps</h3>
                    <p className="text-slate-400">Interactive diagrams of your entire stack.</p>
                    {/* Map UI */}
                    <div className="mt-8 h-64 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
                         <VisualMapAnimation />
                    </div>
                </div>

                {/* Large Card 4 */}
                 <div className="md:col-span-2 bg-slate-900/50 rounded-[2rem] p-10 overflow-hidden relative group border border-slate-800 hover:border-brand-500/30 transition-colors">
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1">
                            <div className="mb-4 text-rose-400"><Shield size={32} /></div>
                            <h3 className="text-3xl font-semibold mb-3">Built-in Compliance Guardrails</h3>
                            <p className="text-slate-400 text-lg">A "Safety Net" for your infrastructure. 50+ guardrails automatically applied to every generated line of code.</p>
                            
                            <ul className="mt-6 space-y-3">
                                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-indigo-400"/> IAM Least Privilege</li>
                                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-indigo-400"/> Encryption at Rest</li>
                                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-indigo-400"/> No Public S3 Buckets</li>
                            </ul>
                        </div>
                        {/* Security Scan */}
                         <div className="flex-1 w-full aspect-square md:aspect-auto h-full min-h-[200px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
                             <SecurityScanAnimation />
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>

      {/* Quick Start Guide: How it Works */}
      {/* Quick Start Guide: How it Works */}
      <div id="how-it-works" className="mt-32 py-24 relative overflow-hidden bg-slate-950">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">Master your cloud.</h2>
            <p className="text-2xl text-slate-400 max-w-3xl">From blank page to production-ready infrastructure in 5 simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1: Connect */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] group hover:border-brand-500/30 transition-all flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xl mb-6 border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Context-Aware Connection</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Connect your AWS (Read-Only) so Chkmate understands your existing VPCs and Subnets.
              </p>
              <div className="mt-auto p-2 px-3 bg-slate-950/50 rounded-lg border border-slate-800/50 text-[10px] font-mono text-slate-500">
                ReadOnlyAccess
              </div>
            </div>

            {/* Step 2: Blueprinting */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] group hover:border-brand-500/30 transition-all flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl mb-6 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Blueprinting</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                 Describe your intent. Chkmate doesn't just "write code"—it architects based on AWS best practices.
              </p>
              <div className="mt-auto flex gap-1 items-center text-[10px] text-brand-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> AI Powered
              </div>
            </div>

            {/* Step 3: Pre-Fly Check */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] group hover:border-brand-500/30 transition-all flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">The 'Pre-Fly' Check</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Get a visual map, a 12-month cost projection, and a security audit before you ever run terraform apply.
              </p>
              <div className="mt-auto flex items-center justify-between w-full">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden mr-2">
                  <div className="h-full w-[85%] bg-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400">85%</span>
              </div>
            </div>

            {/* Step 4: Refine */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] group hover:border-brand-500/30 transition-all flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl mb-6 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                4
              </div>
              <h3 className="text-xl font-semibold mb-3">Refine</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Use the Diff Engine to compare changes side-by-side.
              </p>
              <div className="mt-auto flex items-center gap-2 text-blue-400 text-[10px] font-bold">
                <GitCompare className="w-3 h-3" /> Diff View
              </div>
            </div>

            {/* Step 5: Sync */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] group hover:border-brand-500/30 transition-all flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl mb-6 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                5
              </div>
              <h3 className="text-xl font-semibold mb-3">Git-Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Push Terraform directly to GitHub. Versioned and ready.
              </p>
              <div className="mt-auto flex -space-x-2">
                 <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400"><Code size={12}/></div>
                 <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400"><File size={12}/></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Who is it for */}
      <div className="py-32 max-w-7xl mx-auto px-6 bg-slate-950">
           <div className="mb-20">
                <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Builders.</span></h2>
                <p className="text-2xl text-slate-400 max-w-3xl">Whether you are a solo developer shipping your first SaaS or an architect managing enterprise scale.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-900/50 p-10 rounded-[2rem] border border-slate-800 hover:border-brand-500/30 transition-colors group">
                   <div className="mb-6 w-14 h-14 rounded-2xl bg-slate-950 text-brand-400 border border-slate-800 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                      <Code size={28} />
                   </div>
                   <h3 className="text-3xl font-semibold mb-4 text-white">Developers</h3>
                   <ul className="space-y-4 text-slate-400 text-lg">
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Stop context-switching to documentation.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Write the logic, let Chkmate handle the syntax.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Ship infrastructure with your code, instantly.</li>
                   </ul>
               </div>
               <div className="bg-slate-900/50 p-10 rounded-[2rem] border border-slate-800 hover:border-brand-500/30 transition-colors group">
                    <div className="mb-6 w-14 h-14 rounded-2xl bg-slate-950 text-brand-400 border border-slate-800 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                      <Layout size={28} />
                   </div>
                   <h3 className="text-3xl font-semibold mb-4 text-white">Architects</h3>
                   <ul className="space-y-4 text-slate-400 text-lg">
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Standardize infrastructure patterns across your team.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Get instant cost estimates for client proposals.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Enforce security guardrails by default.</li>
                   </ul>
               </div>
           </div>
      </div>

      {/* Governance / Management Section */}
      <div id="governance" className="py-32 px-6 bg-slate-950 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />



          <div className="max-w-[1400px] mx-auto relative z-10">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                   <div className="order-2 lg:order-1 lg:col-span-4 xl:col-span-5">
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wide mb-6 uppercase border border-emerald-500/20">
                            Day 2 Operations
                       </div>
                       <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 leading-tight">
                           Complete control over your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">existing</span> fleet.
                       </h2>
                       <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                           Chkmate isn't just for new projects. Import your running AWS environments to instantly gain governance superpowers, from security auditing to cost optimization.
                       </p>

                       <div className="space-y-10">
                           {/* Feature 1: Cost */}
                           <div className="flex gap-5 group">
                               <div className="mt-1 flex-shrink-0 w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300 shadow-lg shadow-orange-900/20">
                                   <PieChart size={28} />
                               </div>
                               <div>
                                   <h3 className="text-xl font-semibold mb-2 text-white">Deep Cost Intelligence</h3>
                                   <p className="text-slate-400 leading-relaxed mb-2">
                                       Stop flying blind. Visualize spend by service, region, and team.
                                   </p>
                                   <ul className="text-sm text-slate-500 space-y-1">
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-orange-400"/> Idle resource detection</li>
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-orange-400"/> Rightsizing recommendations</li>
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-orange-400"/> Anomaly alerts</li>
                                   </ul>
                               </div>
                           </div>

                           {/* Feature 2: Security */}
                           <div className="flex gap-5 group">
                               <div className="mt-1 flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-lg shadow-blue-900/20">
                                   <ShieldCheck size={28} />
                               </div>
                               <div>
                                   <h3 className="text-xl font-semibold mb-2 text-white">Continuous Security Auditing</h3>
                                   <p className="text-slate-400 leading-relaxed mb-2">
                                       Automated scanning against industry benchmarks (CIS, SOC2).
                                   </p>
                                    <ul className="text-sm text-slate-500 space-y-1">
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400"/> Misconfiguration detection</li>
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400"/> IAM privilege analysis</li>
                                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400"/> Public exposure scanning</li>
                                   </ul>
                               </div>
                           </div>

                           {/* Feature 3: Policy */}
                           <div className="flex gap-5 group">
                               <div className="mt-1 flex-shrink-0 w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shadow-lg shadow-purple-900/20">
                                   <FileText size={28} />
                               </div>
                               <div>
                                   <h3 className="text-xl font-semibold mb-2 text-white">Policy Management</h3>
                                   <p className="text-slate-400 leading-relaxed mb-2">
                                       Define guardrails as code and prevent drift before it happens.
                                   </p>
                                    <ul className="text-sm text-slate-500 space-y-1">
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400"/> Tagging enforcement</li>
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400"/> Region & Service Allow-lists</li>
                                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400"/> Auto-remediation</li>
                                   </ul>
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Image Side */}
                   <div className="order-1 lg:order-2 lg:col-span-8 xl:col-span-7 relative group perspective-1000">
                        {/* Decorative elements */}
                        <div className="absolute -inset-1 bg-gradient-to-tr from-brand-500/40 to-indigo-500/40 rounded-[2rem] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                        
                        <div className="relative rounded-[2rem] bg-slate-900 overflow-hidden shadow-2xl transition-transform duration-700 md:rotate-y-[-5deg] md:group-hover:rotate-y-0 shadow-black/50">
                             {/* Mac-style window controls */}
                             <div className="h-12 bg-slate-800/50 border-b border-slate-700/50 flex items-center px-6 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                            </div>
                            <img 
                                src="/Cost dashboard.png" 
                                alt="Chkmate Governance Dashboard - Cost and Compliance" 
                                className="w-full h-auto object-cover"
                            />
                        </div>
                   </div>
               </div>
          </div>

      </div>

      {/* Pricing Section (Clean Apple Style) */}
      <div id="pricing" className="py-32 px-6 bg-slate-950 border-t border-slate-800/50">
           <div className="max-w-5xl mx-auto">
               <h2 className="text-4xl md:text-5xl font-semibold text-center mb-16 tracking-tight">Simple, transparent pricing.</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {/* Free */}
                   <div className="p-8 rounded-[2rem] bg-slate-900/30 border border-slate-800 flex flex-col">
                       <h3 className="text-xl font-medium text-slate-300 mb-2">Hobby</h3>
                       <div className="text-4xl font-semibold mb-6">$9.99</div>
                       <button onClick={openModal} className="w-full py-3 rounded-full border border-slate-700 hover:bg-slate-800 transition font-medium mb-8">Join Waitlist</button>
                       <ul className="space-y-4 flex-1">
                           <li className="text-slate-400 text-sm">5 Projects</li>
                           <li className="text-slate-400 text-sm">Basic Generators</li>
                           <li className="text-slate-400 text-sm">Community Support</li>
                           <li className="text-slate-400 text-sm">Basic Cost Estimation</li>
                       </ul>
                   </div>

                   {/* Pro (Highlighted) */}
                    <div className="p-8 rounded-[2rem] bg-brand-600/10 border border-brand-500 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Most Popular</div>
                       <h3 className="text-xl font-medium text-white mb-2">Pro</h3>
                       <div className="text-4xl font-semibold mb-6">$49.99<span className="text-lg text-slate-400 font-normal">/mo</span></div>
                       <div className="text-center text-xs text-brand-400 mb-2 font-bold uppercase tracking-wide">Limited Closed Beta</div>
                       <button onClick={openModal} className="w-full py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-white transition font-medium mb-8 shadow-lg shadow-brand-500/25">Lock in Lifetime Pricing</button>
                       <ul className="space-y-4 flex-1">
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Join 200+ engineers</li>
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Advanced AI Models</li>
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Export to GitHub</li>
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Security Auditing</li>
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Cost Intelligence</li>
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Policy Management</li>
                       </ul>
                   </div>

                   {/* Team */}
                   <div className="p-8 rounded-[2rem] bg-slate-900/30 border border-slate-800 flex flex-col">
                       <h3 className="text-xl font-medium text-slate-300 mb-2">Team</h3>
                       <div className="text-4xl font-semibold mb-6">$99.99<span className="text-lg text-slate-400 font-normal">/mo</span></div>
                       <button onClick={openModal} className="w-full py-3 rounded-full border border-slate-700 hover:bg-slate-800 transition font-medium mb-8">Join Waitlist</button>
                       <ul className="space-y-4 flex-1">
                           <li className="text-slate-400 text-sm">5 Team Members</li>
                           <li className="text-slate-400 text-sm">SSO & Audit Logs</li>
                           <li className="text-slate-400 text-sm">Dedicated Success Mgr</li>
                           <li className="text-slate-400 text-sm">Team Governance</li>
                           <li className="text-slate-400 text-sm">Custom Guardrails</li>
                       </ul>
                   </div>
               </div>
           </div>
      </div>

    {/* Newsletter */}
    <Newsletter />

    {/* FAQ Section */}
    <div className="py-24 px-6 bg-slate-950 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto">
             <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center tracking-tight">Frequently Asked Questions</h2>
             <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border border-slate-800 rounded-2xl bg-slate-900/30 overflow-hidden transition-all hover:border-slate-700">
                        <button 
                            className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                            onClick={() => toggleFaq(index)}
                        >
                            <span className="font-semibold text-lg text-slate-200">{faq.question}</span>
                            {openFaq === index ? <ChevronUp className="text-slate-400 w-5 h-5 flex-shrink-0"/> : <ChevronDown className="text-slate-400 w-5 h-5 flex-shrink-0"/>}
                        </button>
                        <div 
                            className={`px-6 pb-6 text-slate-400 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pb-0'}`}
                        >
                            {faq.answer}
                        </div>
                    </div>
                ))}
             </div>
        </div>
    </div>

    {/* Footer */}
    <Footer />
    
    <RegisterInterestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
  </div>
  );
}
