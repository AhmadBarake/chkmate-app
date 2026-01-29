import React, { useState } from 'react';
import { Box, Cloud, Map, DollarSign, Rocket, Shield, Users, Code, Layout, Sparkles, GitCompare, FileCode as File, ArrowRight, Check } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
        
        {/* Subtle Background */}
        <div className="absolute inset-0 z-0 opacity-80">
           <ThreeCloudBackground /> 
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide mb-8 backdrop-blur-md uppercase">
                v1.40 Closed Beta
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-8xl font-semibold tracking-tighter mb-6">
                Infrastructure.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Reimagined.</span>
            </h1>

            {/* Subhead */}
            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl leading-relaxed font-medium">
                Describe your stack in plain English. We handle the Terraform, visualize the plan, and catch the cost leaks.
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

            {/* Hero Image / Placeholder */}
            <div className="relative w-full max-w-5xl mt-8">
               {/* Glow effect behind image */}
               <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-indigo-500/20 rounded-[2.5rem] blur-3xl opacity-50"></div>
               
                <img 
                    src="/Hero.png" 
                    alt="Chkmate Interface" 
                    className="relative w-full rounded-[2rem] border border-slate-700/50 shadow-2xl bg-slate-950 z-10"
                />
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
                        <h3 className="text-3xl font-semibold mb-3">Natural Language to IaC</h3>
                        <p className="text-slate-400 text-lg">Use plain English to define complex AWS, Azure, or GCP architectures. The AI handles the boilerplate.</p>
                    </div>
                    {/* Feature Image */}
                    <div className="mt-10 aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                        <img 
                            src="/iac.png" 
                            alt="Natural Language to IaC Interface" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Tall Card 2 */}
                <div className="md:col-span-1 bg-slate-900/50 rounded-[2rem] p-10 overflow-hidden relative border border-slate-800 hover:border-brand-500/30 transition-colors">
                     <div className="mb-4 text-emerald-400"><DollarSign size={32} /></div>
                     <h3 className="text-3xl font-semibold mb-3">Cost Aware</h3>
                     <p className="text-slate-400 text-lg mb-8">Know the price before you deploy. Real-time estimation.</p>
                     
                     {/* Cost Graph */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                        <img 
                            src="/cost-aware.png" 
                            alt="Cost Estimation Graph" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Medium Card 3 */}
                <div className="md:col-span-1 bg-slate-900/50 rounded-[2rem] p-10 overflow-hidden border border-slate-800 hover:border-brand-500/30 transition-colors">
                    <div className="mb-4 text-blue-400"><Map size={32} /></div>
                    <h3 className="text-2xl font-semibold mb-3">Visual Maps</h3>
                    <p className="text-slate-400">Interactive diagrams of your entire stack.</p>
                    {/* Map UI */}
                    <div className="mt-8 h-32 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
                         <img 
                            src="/visualize.png" 
                            alt="Infrastructure Visualization" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Large Card 4 */}
                 <div className="md:col-span-2 bg-slate-900/50 rounded-[2rem] p-10 overflow-hidden relative border border-slate-800 hover:border-brand-500/30 transition-colors">
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1">
                            <div className="mb-4 text-rose-400"><Shield size={32} /></div>
                            <h3 className="text-3xl font-semibold mb-3">Secure by Default</h3>
                            <p className="text-slate-400 text-lg">Built-in checkov and tfsec integration. 50+ guardrails automatically applied to every generated line of code.</p>
                            
                            <ul className="mt-6 space-y-3">
                                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-indigo-400"/> IAM Least Privilege</li>
                                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-indigo-400"/> Encryption at Rest</li>
                                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-indigo-400"/> No Public S3 Buckets</li>
                            </ul>
                        </div>
                        {/* Security Scan */}
                         <div className="flex-1 w-full aspect-square md:aspect-auto h-full min-h-[200px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                             <img 
                                src="/security.png" 
                                alt="Security Scan Results" 
                                className="w-full h-full object-cover"
                            />
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
              <h3 className="text-xl font-semibold mb-3">Connect</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Establish a secure, read-only connection to your AWS account.
              </p>
              <div className="mt-auto p-2 px-3 bg-slate-950/50 rounded-lg border border-slate-800/50 text-[10px] font-mono text-slate-500">
                ReadOnlyAccess
              </div>
            </div>

            {/* Step 2: Prompt */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] group hover:border-brand-500/30 transition-all flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl mb-6 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Prompt</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Describe your desired architecture in plain English.
              </p>
              <div className="mt-auto flex gap-1 items-center text-[10px] text-brand-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> AI Powered
              </div>
            </div>

            {/* Step 3: Analyze */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] group hover:border-brand-500/30 transition-all flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Analyze</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                See visual diagrams, cost breakdowns, and security audits.
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
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Stop context switching between code and docs.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Generate boilerplate in seconds.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Focus on application logic, not HCL syntax.</li>
                   </ul>
               </div>
               <div className="bg-slate-900/50 p-10 rounded-[2rem] border border-slate-800 hover:border-brand-500/30 transition-colors group">
                    <div className="mb-6 w-14 h-14 rounded-2xl bg-slate-950 text-brand-400 border border-slate-800 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                      <Layout size={28} />
                   </div>
                   <h3 className="text-3xl font-semibold mb-4 text-white">Architects</h3>
                   <ul className="space-y-4 text-slate-400 text-lg">
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Design systems visually.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Standardize patterns across teams.</li>
                       <li className="flex gap-3"><span className="text-brand-500">•</span> Get instant cost estimates for proposals.</li>
                   </ul>
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
                       <div className="text-4xl font-semibold mb-6">$0</div>
                       <button onClick={openModal} className="w-full py-3 rounded-full border border-slate-700 hover:bg-slate-800 transition font-medium mb-8">Register Interest</button>
                       <ul className="space-y-4 flex-1">
                           <li className="text-slate-400 text-sm">5 Projects</li>
                           <li className="text-slate-400 text-sm">Basic Generators</li>
                           <li className="text-slate-400 text-sm">Community Support</li>
                       </ul>
                   </div>

                   {/* Pro (Highlighted) */}
                    <div className="p-8 rounded-[2rem] bg-brand-600/10 border border-brand-500 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Most Popular</div>
                       <h3 className="text-xl font-medium text-white mb-2">Pro</h3>
                       <div className="text-4xl font-semibold mb-6">$29<span className="text-lg text-slate-400 font-normal">/mo</span></div>
                       <button onClick={openModal} className="w-full py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-white transition font-medium mb-8 shadow-lg shadow-brand-500/25">Register Interest</button>
                       <ul className="space-y-4 flex-1">
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Unlimited Projects</li>
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Advanced AI Models</li>
                           <li className="text-slate-300 text-sm flex gap-2"><Check size={16} className="text-brand-400"/> Export to GitHub</li>
                       </ul>
                   </div>

                   {/* Team */}
                   <div className="p-8 rounded-[2rem] bg-slate-900/30 border border-slate-800 flex flex-col">
                       <h3 className="text-xl font-medium text-slate-300 mb-2">Team</h3>
                       <div className="text-4xl font-semibold mb-6">$99<span className="text-lg text-slate-400 font-normal">/mo</span></div>
                       <button onClick={openModal} className="w-full py-3 rounded-full border border-slate-700 hover:bg-slate-800 transition font-medium mb-8">Register Interest</button>
                       <ul className="space-y-4 flex-1">
                           <li className="text-slate-400 text-sm">10 Team Members</li>
                           <li className="text-slate-400 text-sm">SSO & Audit Logs</li>
                           <li className="text-slate-400 text-sm">Dedicated Success Mgr</li>
                       </ul>
                   </div>
               </div>
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
