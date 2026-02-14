import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Cpu, Lock, Shield, Server, Database, GitBranch, Terminal, Cloud, Network, EyeOff, Layers, Zap, FileText, Palette, Layout, Code, Smartphone, Globe, Box, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

const CaseStudyLumi: React.FC = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900/50 z-0">
             {/* Abstract Neural/AI Background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2065&auto=format&fit=crop')] bg-cover bg-center" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 pt-20">
            <Link to="/" className="inline-flex items-center text-slate-400 hover:text-slate-50 mb-8 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back to Home
            </Link>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="flex items-center space-x-4 mb-4">
                    <span className="bg-brand-900/40 text-brand-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-brand-800">Artificial Intelligence</span>
                    <span className="bg-cyan-900/40 text-cyan-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-cyan-800">HealthTech Security</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-50 mb-6 max-w-4xl leading-tight">
                    Intelligent Care with <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">Privacy-First AI</span>.
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-8">
                    Architecting a secure, AI-powered clinic management platform for therapists, utilizing hybrid LLMs and a military-grade privacy pipeline.
                </p>
            </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400">
           <ArrowLeft className="rotate-[-90deg]" size={24} />
        </div>
      </section>

      {/* AI Architecture Section */}
      <Section className="bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
             <div className="order-2 md:order-1">
                  <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl relative overflow-hidden">
                      <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">HYBRID MODEL TOPOLOGY</div>
                      
                      <div className="flex flex-col space-y-6 mt-4 relative z-10">
                          {/* Input */}
                          <div className="flex items-center space-x-4">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <div className="flex-1 bg-gray-800 p-3 rounded border border-gray-700 text-sm text-slate-400">
                                  Therapist Session Notes (Raw Audio/Text)
                              </div>
                          </div>

                          {/* PII Redaction Layer */}
                          <div className="pl-6 border-l-2 border-dashed border-gray-700 ml-1 py-2">
                              <div className="bg-red-900/20 border border-red-900/50 p-4 rounded flex items-center justify-between">
                                  <div className="flex items-center">
                                      <EyeOff size={20} className="text-red-400 mr-3" />
                                      <span className="text-sm font-bold text-red-300">PII Redaction Layer</span>
                                  </div>
                                  <span className="text-[10px] text-red-500 font-mono">NER / Regex</span>
                              </div>
                          </div>

                          {/* LLM Router */}
                          <div className="flex items-center justify-center">
                              <div className="bg-blue-900/30 p-2 rounded-full border border-blue-500/50">
                                  <GitBranch size={20} className="text-blue-400" />
                              </div>
                          </div>

                          {/* Models */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-brand-900/10 border border-brand-500/30 p-4 rounded text-center">
                                  <Brain size={24} className="text-brand-400 mx-auto mb-2" />
                                  <div className="text-sm font-bold text-slate-50">Gemini Pro</div>
                                  <div className="text-[10px] text-slate-400">Complex Reasoning & Insight Generation</div>
                              </div>
                              <div className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded text-center">
                                  <Cpu size={24} className="text-cyan-400 mx-auto mb-2" />
                                  <div className="text-sm font-bold text-slate-50">Custom LLM</div>
                                  <div className="text-[10px] text-slate-400">Fine-tuned on Clinical Methodology</div>
                              </div>
                          </div>
                      </div>
                      
                      {/* Background Grid */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] z-0 pointer-events-none" />
                  </div>
             </div>
             
             <div className="order-1 md:order-2">
                 <h2 className="text-3xl font-bold text-slate-50 mb-6">Hybrid Intelligence Engine</h2>
                 <p className="text-slate-400 leading-relaxed mb-6">
                     Lumi isn't just a wrapper. We engineered a dual-model system. <strong>Gemini</strong> handles broad reasoning and complex summarization, while a lightweight <strong>Custom LLM</strong>, fine-tuned on anonymized clinical datasets, handles domain-specific terminology and structured data extraction.
                 </p>
                 <ul className="space-y-4 text-slate-400">
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Context-Aware Routing:</strong> An intelligent router decides which model to query based on request complexity and cost.</span>
                     </li>
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Next.js + Node.js:</strong> A high-performance, type-safe full-stack environment using Prisma ORM for seamless data compatibility.</span>
                     </li>
                 </ul>
             </div>
          </div>
      </Section>

      {/* Data Privacy & Security */}
      <Section className="bg-neutral-950 border-y border-neutral-900">
          <div className="text-center mb-16">
              <span className="text-red-400 font-mono text-sm uppercase tracking-wider">HIPAA Compliance</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mt-2 mb-6">Zero-Trust Privacy Pipeline</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                  Patient trust is paramount. We implemented a rigorous anonymization pipeline that ensures no Personally Identifiable Information (PII) ever reaches the LLM providers.
              </p>
          </div>

          <div className="max-w-5xl mx-auto">
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-slate-950 border border-gray-800 p-8 rounded-2xl relative">
                   {/* Step 1 */}
                   <div className="text-center relative z-10">
                       <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-700 shadow-lg">
                           <FileText size={24} className="text-slate-400" />
                       </div>
                       <h4 className="text-slate-50 text-sm font-bold">Raw Input</h4>
                       <p className="text-[10px] text-slate-400 mt-1">Session Transcript</p>
                   </div>
                   
                   {/* Arrow */}
                   <div className="hidden md:flex justify-center">
                       <ArrowLeft className="rotate-180 text-slate-400" />
                   </div>

                   {/* Step 2 */}
                   <div className="text-center relative z-10">
                       <div className="w-16 h-16 bg-red-900/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                           <EyeOff size={24} className="text-red-500" />
                       </div>
                       <h4 className="text-slate-50 text-sm font-bold">PII Scrubbing</h4>
                       <p className="text-[10px] text-slate-400 mt-1">NER + Pattern Match</p>
                   </div>

                   {/* Arrow */}
                   <div className="hidden md:flex justify-center">
                       <ArrowLeft className="rotate-180 text-slate-400" />
                   </div>

                   {/* Step 3 */}
                   <div className="text-center relative z-10">
                       <div className="w-16 h-16 bg-blue-900/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                           <Brain size={24} className="text-blue-500" />
                       </div>
                       <h4 className="text-slate-50 text-sm font-bold">LLM Processing</h4>
                       <p className="text-[10px] text-slate-400 mt-1">Anonymized Context</p>
                   </div>
                   
               </div>
               <div className="mt-8 text-center">
                   <p className="text-sm text-slate-400">
                       <span className="text-green-500">●</span> Data at Rest: AES-256 Encryption &nbsp;&nbsp;&nbsp; 
                       <span className="text-green-500">●</span> Data in Transit: TLS 1.3
                   </p>
               </div>
          </div>
      </Section>

      {/* Infrastructure & DevOps */}
      <Section className="bg-slate-950">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
               <div>
                   <div className="flex items-center text-orange-400 mb-4">
                       <Cloud className="mr-3" />
                       <span className="uppercase tracking-widest font-mono text-sm">Cloud Infrastructure</span>
                   </div>
                   <h3 className="text-3xl font-bold text-slate-50 mb-6">High Availability & Cost Efficiency</h3>
                   <p className="text-slate-400 leading-relaxed mb-6">
                       Deployed on AWS using <strong>Terraform</strong> for reproducible infrastructure. The architecture balances reliability with startup-friendly costs.
                   </p>
                   
                   <div className="space-y-4">
                       <div className="p-4 border border-gray-800 rounded bg-neutral-900 hover:border-orange-500/50 transition-colors">
                           <h4 className="text-slate-50 font-bold flex items-center mb-2"><Layers size={16} className="text-orange-400 mr-2" /> Multi-AZ ECS Fargate</h4>
                           <p className="text-xs text-slate-400">
                               Compute workload distributed across 3 Availability Zones for fault tolerance. Utilizing <strong>Fargate Spot</strong> integration for 70% cost reduction on non-critical tasks.
                           </p>
                       </div>
                       <div className="p-4 border border-gray-800 rounded bg-neutral-900 hover:border-blue-500/50 transition-colors">
                           <h4 className="text-slate-50 font-bold flex items-center mb-2"><Database size={16} className="text-blue-400 mr-2" /> Aurora Serverless V2</h4>
                           <p className="text-xs text-slate-400">
                               PostgreSQL database that instantly scales compute capacity to match demand, dropping to minimum ACUs during off-hours to save costs.
                           </p>
                       </div>
                   </div>
               </div>

               <div>
                   <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl">
                       <h3 className="text-xl font-bold text-slate-50 mb-6 flex items-center"><Terminal size={20} className="mr-3 text-green-400"/> IaC & Pipeline</h3>
                       
                       <div className="space-y-6 relative">
                           {/* Pipeline Visual */}
                           <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-800"></div>

                           <div className="flex items-start relative pl-10">
                               <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 font-mono text-xs text-slate-50">1</div>
                               <div>
                                   <div className="text-slate-50 font-bold text-sm">Terraform Plan</div>
                                   <div className="text-xs text-slate-400 mt-1">Infrastructure changes visualized</div>
                               </div>
                           </div>

                           <div className="flex items-start relative pl-10">
                               <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-900/50 font-mono text-xs text-blue-400">2</div>
                               <div>
                                   <div className="text-slate-50 font-bold text-sm">CI/CD (GitHub Actions)</div>
                                   <div className="text-xs text-slate-400 mt-1">Lint → Test → Build Container</div>
                               </div>
                           </div>
                           
                           <div className="flex items-start relative pl-10">
                               <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-green-900/20 flex items-center justify-center border border-green-900/50 font-mono text-xs text-green-400">3</div>
                               <div>
                                   <div className="text-slate-50 font-bold text-sm">Terraform Apply</div>
                                   <div className="text-xs text-slate-400 mt-1">Atomic state update & Rollout</div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
      </Section>

      {/* Product Engineering & Experience */}
      <Section className="bg-neutral-950 border-t border-neutral-900">
          <div className="mb-16">
              <div className="flex items-center space-x-2 mb-4">
                  <Monitor size={20} className="text-brand-400" />
                  <span className="text-brand-400 font-mono text-sm uppercase tracking-wider">Product Engineering</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mb-6">Built for Focus & Scale</h2>
              <p className="text-slate-400 max-w-3xl">
                  We designed Lumi to disappear. The interface is intentionally minimalist to reduce cognitive load for therapists during sessions, while the backend is architected for massive concurrent throughput.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* UI/UX Column */}
              <div className="bg-gradient-to-b from-neutral-900 to-black p-1 rounded-2xl border border-neutral-800">
                  <div className="bg-slate-950 rounded-xl p-6 h-full relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-50 text-neutral-800 group-hover:text-brand-900/40 transition-colors">
                          <Palette size={80} />
                      </div>
                      
                      <div className="relative z-10">
                          <div className="w-12 h-12 bg-brand-900/20 rounded-lg flex items-center justify-center mb-6 text-brand-400 border border-brand-900/50">
                              <Layout size={24} />
                          </div>
                          
                          <h3 className="text-xl font-bold text-slate-50 mb-4">Clinical "Zen" UI</h3>
                          <ul className="space-y-3 text-slate-400 text-sm">
                              <li className="flex items-start">
                                  <span className="text-brand-500 mr-2">●</span>
                                  <span><strong>Dark Mode First:</strong> Reduces eye strain during late-night charting sessions.</span>
                              </li>
                              <li className="flex items-start">
                                  <span className="text-brand-500 mr-2">●</span>
                                  <span><strong>Focus States:</strong> Input fields enlarge and dim background noise when active.</span>
                              </li>
                              <li className="flex items-start">
                                  <span className="text-brand-500 mr-2">●</span>
                                  <span><strong>WCAG 2.1 AA:</strong> High contrast ratios for accessibility compliance.</span>
                              </li>
                          </ul>
                      </div>
                  </div>
              </div>

              {/* Frontend Column */}
              <div className="bg-gradient-to-b from-neutral-900 to-black p-1 rounded-2xl border border-neutral-800">
                  <div className="bg-slate-950 rounded-xl p-6 h-full relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-50 text-neutral-800 group-hover:text-cyan-900/40 transition-colors">
                          <Code size={80} />
                      </div>
                      
                      <div className="relative z-10">
                          <div className="w-12 h-12 bg-cyan-900/20 rounded-lg flex items-center justify-center mb-6 text-cyan-400 border border-cyan-900/50">
                              <Smartphone size={24} />
                          </div>
                          
                          <h3 className="text-xl font-bold text-slate-50 mb-4">Frontend Engineering</h3>
                          <ul className="space-y-3 text-slate-400 text-sm">
                              <li className="flex items-start">
                                  <span className="text-cyan-500 mr-2">●</span>
                                  <span><strong>React 18 + Vite:</strong> Instant HMR and concurrent rendering features.</span>
                              </li>
                              <li className="flex items-start">
                                  <span className="text-cyan-500 mr-2">●</span>
                                  <span><strong>Tailwind CSS:</strong> Atomic utility classes for a design system that scales.</span>
                              </li>
                              <li className="flex items-start">
                                  <span className="text-cyan-500 mr-2">●</span>
                                  <span><strong>Real-time State:</strong> Optimistic UI updates for instant interaction feedback.</span>
                              </li>
                          </ul>
                      </div>
                  </div>
              </div>

              {/* Backend Column */}
              <div className="bg-gradient-to-b from-neutral-900 to-black p-1 rounded-2xl border border-neutral-800">
                  <div className="bg-slate-950 rounded-xl p-6 h-full relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-50 text-neutral-800 group-hover:text-green-900/40 transition-colors">
                          <Box size={80} />
                      </div>
                      
                      <div className="relative z-10">
                          <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center mb-6 text-green-400 border border-green-900/50">
                              <Globe size={24} />
                          </div>
                          
                          <h3 className="text-xl font-bold text-slate-50 mb-4">Backend Architecture</h3>
                          <ul className="space-y-3 text-slate-400 text-sm">
                              <li className="flex items-start">
                                  <span className="text-green-500 mr-2">●</span>
                                  <span><strong>Node.js Microservices:</strong> Decoupled services for auth, transcription, and LLM via gRPC.</span>
                              </li>
                              <li className="flex items-start">
                                  <span className="text-green-500 mr-2">●</span>
                                  <span><strong>Event-Driven:</strong> RabbitMQ for asynchronous processing of long-running AI tasks.</span>
                              </li>
                              <li className="flex items-start">
                                  <span className="text-green-500 mr-2">●</span>
                                  <span><strong>Prisma ORM:</strong> Type-safe database access with automated migrations.</span>
                              </li>
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      </Section>
      
      <Footer />
    </>
  );
};

export default CaseStudyLumi;
