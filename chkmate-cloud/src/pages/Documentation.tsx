import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { GitCommit, Clock, ArrowRight, Zap, Globe, Shield } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 font-sans">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-16">
              <span className="inline-block px-3 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full text-xs font-bold mb-6">
                Roadmap
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Changelog & Roadmap</h1>
              <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
                Stay updated with the latest improvements and see what's coming next to chkmate.
              </p>
            </div>

            {/* Changelog Section */}
            <section className="mb-20">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <GitCommit className="text-brand-400" /> Latest Updates
              </h2>
              
              <div className="relative pl-8 border-l border-slate-800 space-y-12">

                {/* v1.41 */}
                <div className="relative">
                  <span className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-slate-950 bg-brand-500"></span>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">v1.41</h3>
                    <span className="text-xs text-slate-500 font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Current</span>
                  </div>
                  <ul className="space-y-4 text-slate-400 mt-4">
                    <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Immersive Infrastructure Map</strong>
                         Added an interactive, node-based visualization map for AWS resources with auto-layout and zoom capabilities.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">UX</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Apple-Inspired Design Refresh</strong>
                         Overhauled the Landing Page with a premium "slate-950" theme, glassmorphism effects, and refined typography.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Update</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Pricing & Assets Update</strong>
                         Adjusted pricing tiers and updated feature visualization assets (Bento Grid) for better clarity and appeal.
                      </span>
                    </li>
                  </ul>
                </div>
                
                {/* v1.40 */}
                <div className="relative">
                   <span className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-slate-950 bg-slate-700"></span>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">v1.40 (Closed Beta)</h3>
                    <span className="text-xs text-slate-500 font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Current</span>
                  </div>
                  <ul className="space-y-4 text-slate-400 mt-4">
                    <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Legal Compliance Page Suite</strong>
                         Implemented GDPR-compliant Terms, Privacy, and Refund policy pages designated Paddle as Merchant of Record.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Unified Navigation & Footer</strong>
                         Standardized footer component across landing and legal pages with improved client-side routing.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">UX</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Interest Registration Flow</strong>
                         Replaced direct signup with a "Register Interest" modal for closed beta access management.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">UX</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Pricing & Docs</strong>
                         Separated Pricing and Documentation into dedicated views for better information architecture.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* v1.39 - Repository Separation */}
                 <div className="relative">
                   <span className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-slate-950 bg-slate-700"></span>
                   <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">v1.39</h3>
                    <span className="text-xs text-slate-500 font-mono">2026-01-26</span>
                  </div>
                   <ul className="space-y-4 text-slate-400 mt-4">
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Project Restructuring</strong>
                         Separated SaaS application from marketing website into dedicated repository (chkmate-app).
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Secure Authentication Suite</strong>
                         Implemented Clerk-based auth with backend token validation and protected routes.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Refactor</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">AI Widget Optimization</strong>
                         Refactored embedded AI assistant into a floating widget for better UX.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Fix</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Amplify Deployment</strong>
                         Resolved blank screen issues and build configuration conflicts on AWS Amplify.
                      </span>
                    </li>
                   </ul>
                </div>

                {/* v1.30 - v1.38: Previous Development */}
                 <div className="relative">
                   <span className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-slate-950 bg-slate-600"></span>
                   <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">v1.30 - v1.38</h3>
                    <span className="text-xs text-slate-500 font-mono">Dec 2025 - Jan 2026</span>
                  </div>
                   <ul className="space-y-4 text-slate-400 mt-4">
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">AWS Cloud Scanner</strong>
                         Full-stack cloud security scanner with cross-account role assumption, S3/RDS/EC2/IAM scanning.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Infrastructure as Code Builder</strong>
                         AI-powered Terraform/HCL generation with real-time cost estimation and policy validation.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Cost Control Dashboard</strong>
                         Real-time AWS cost breakdown with historical trend analysis from Cost Explorer API.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Infrastructure Map Visualization</strong>
                         Interactive network topology visualization of discovered AWS resources.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">UX</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Dashboard Redesign</strong>
                         Complete UI overhaul with glassmorphism design, dark mode, and responsive layouts.
                      </span>
                    </li>
                   </ul>
                </div>

                {/* v1.0 - v1.29: Foundation */}
                 <div className="relative opacity-70">
                   <span className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-slate-950 bg-slate-700"></span>
                   <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">v1.0 - v1.29</h3>
                    <span className="text-xs text-slate-500 font-mono">Oct - Nov 2025</span>
                  </div>
                   <ul className="space-y-4 text-slate-400 mt-4">
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Core Platform Launch</strong>
                         Initial release with project management, template library, and Terraform scaffolding.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Feat</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">Credit System</strong>
                         Implemented usage-based credit system with Paddle payment integration.
                      </span>
                    </li>
                     <li className="flex items-start gap-3">
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">Infra</span>
                      <span>
                        <strong className="text-slate-200 block mb-1">AWS Deployment Pipeline</strong>
                         ECS Fargate deployment with ALB, RDS PostgreSQL, and CloudFormation templates.
                      </span>
                    </li>
                   </ul>
                </div>

              </div>
            </section>

             {/* Roadmap Section */}
            <section>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Clock className="text-indigo-400" /> Coming Soon
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Feature 1 */}
                 <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-brand-500/30 transition-colors">
                    <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center mb-4">
                        <Zap size={20} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Context-Aware AI</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Deeper integration with your existing infrastructure state. The AI will understand your current VPCs, SG rules, and IAM capabilities to suggest non-conflicting additions.
                    </p>
                    <div className="flex gap-2">
                         <span className="px-2 py-1 bg-slate-950 rounded text-[10px] font-mono text-slate-500 border border-slate-800">Q2 2026</span>
                    </div>
                 </div>

                 {/* Feature 2 */}
                 <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-brand-500/30 transition-colors">
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center mb-4">
                        <Globe size={20} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Multi-Cloud Support</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Native support for Azure ARM/Bicep and Google Cloud Platform (GCP). Generate cross-cloud architectures with a single prompt.
                    </p>
                     <div className="flex gap-2">
                         <span className="px-2 py-1 bg-slate-950 rounded text-[10px] font-mono text-slate-500 border border-slate-800">Q3 2026</span>
                    </div>
                 </div>

                 {/* Feature 3 */}
                  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-brand-500/30 transition-colors">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center mb-4">
                        <Shield size={20} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Advanced Governance Updates</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Wider policy context window for OPA/Sentinel integration. Define organizational guardrails that the AI must strictly adhere to when generating code.
                    </p>
                     <div className="flex gap-2">
                         <span className="px-2 py-1 bg-slate-950 rounded text-[10px] font-mono text-slate-500 border border-slate-800">Q3 2026</span>
                    </div>
                 </div>
              </div>
            </section>

          </main>

          {/* Sidebar Navigation (Optional for docs) */}
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
             </div>
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  );
}
