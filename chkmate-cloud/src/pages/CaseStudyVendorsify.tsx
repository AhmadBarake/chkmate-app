import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, Users, Briefcase, Zap, Globe, Lock, Cpu, Server, Layout, PenTool, GitMerge, Settings, CloudLightning, Shield, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

// Mock Data
const onboardingData = [
  { name: 'Manual Setup (Weeks)', value: 14 },
  { name: 'Automated (Minutes)', value: 1.5 },
];

const CaseStudyVendorsify: React.FC = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900/50 z-0">
             {/* Abstract Tech Background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 pt-20">
            <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back to Home
            </Link>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="flex items-center space-x-4 mb-4">
                    <span className="bg-indigo-900/40 text-indigo-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-indigo-800">SaaS Engineering</span>
                    <span className="bg-emerald-900/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-emerald-800">AWS Consulting</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
                    Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-300">Vendorsify</span>: End-to-End SaaS Engineering.
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-8">
                    A full-cycle engagement: Architecting the platform, sourcing the engineering talent, and delivering a multi-region AWS infrastructure.
                </p>
            </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400">
           <ArrowLeft className="rotate-[-90deg]" size={24} />
        </div>
      </section>

      {/* Challenge Section */}
      <Section className="bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
             <div>
                 <h2 className="text-3xl font-bold text-white mb-6">The Challenge</h2>
                 <p className="text-slate-400 leading-relaxed mb-6">
                     Vendorsify needed to transform a B2B concept into a production-ready, multi-tenant SaaS platform. The challenge was multifaceted:
                 </p>
                 <ul className="space-y-4 text-slate-400">
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Full-Cycle Development:</strong> Executing the entire SDLC from wireframing to deployment without an existing technical team.</span>
                     </li>
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Complex Data Modeling:</strong> Designing a database schema capable of handling diverse vendor workflows while ensuring strict tenant isolation.</span>
                     </li>
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Scalable Ops:</strong> Provisioning a secure, auto-scaling AWS infrastructure from Day 1.</span>
                     </li>
                 </ul>
             </div>
             
             <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg relative overflow-hidden">
                 <h3 className="text-xl font-bold text-white mb-6">Scope of Work</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-950/50 rounded border border-gray-800">
                         <PenTool className="text-pink-400 mb-2" size={24} />
                         <span className="text-sm font-bold block text-white">UI/UX Design</span>
                         <span className="text-xs text-slate-400">Figma & Prototyping</span>
                     </div>
                     <div className="p-4 bg-slate-950/50 rounded border border-gray-800">
                         <Layout className="text-blue-400 mb-2" size={24} />
                         <span className="text-sm font-bold block text-white">Frontend Dev</span>
                         <span className="text-xs text-slate-400">React & Next.js</span>
                     </div>
                     <div className="p-4 bg-slate-950/50 rounded border border-gray-800">
                         <Database className="text-emerald-400 mb-2" size={24} />
                         <span className="text-sm font-bold block text-white">Backend & DB</span>
                         <span className="text-xs text-slate-400">Node.js & PostgreSQL</span>
                     </div>
                      <div className="p-4 bg-slate-950/50 rounded border border-gray-800">
                         <CloudLightning className="text-orange-400 mb-2" size={24} />
                         <span className="text-sm font-bold block text-white">AWS Infra</span>
                         <span className="text-xs text-slate-400">Terraform & ECS</span>
                     </div>
                 </div>
             </div>
          </div>
      </Section>

      {/* Platform Overview */}
      <Section className="bg-neutral-950 border-t border-neutral-900">
          <div className="max-w-4xl mx-auto text-center mb-12">
              <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">The Application</span>
              <h2 className="text-3xl font-bold text-white mt-2 mb-6">Vendor Lifecycle Management</h2>
              <p className="text-slate-400">
                  Vendorsify serves as a central hub for enterprise procurement teams, streamlining the chaotic process of onboarding, managing, and analyzing vendor relationships.
              </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-slate-950 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
                  <div className="text-indigo-400 mb-4 font-bold">01. Compliance Tracking</div>
                  <p className="text-sm text-slate-400">Automated collection and expiry tracking of critical documents (SOC2, ISO, Insurance certificates).</p>
              </div>
              <div className="p-6 bg-slate-950 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
                  <div className="text-indigo-400 mb-4 font-bold">02. Procurement Workflows</div>
                  <p className="text-sm text-slate-400">Customizable approval chains for new vendor requisitions and contract renewals.</p>
              </div>
              <div className="p-6 bg-slate-950 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
                  <div className="text-indigo-400 mb-4 font-bold">03. Spend Analysis</div>
                  <p className="text-sm text-slate-400">Real-time dashboards visualizing spend across categories, flagging anomalous expenditures.</p>
              </div>
          </div>
      </Section>

      {/* Engineer Sections Phase 1 & 2 */}
      {/* ... (Keeping previous frontend/backend sections concise or merged) ... */}
      <Section className="bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                   <div className="flex items-center text-emerald-400 mb-4">
                      <Database className="mr-3" />
                      <span className="uppercase tracking-widest font-mono text-sm">Core Engineering</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6">Robust Systems Architecture</h3>
                  <p className="text-slate-400 mb-6">
                      From atomic design components in React to normalized SQL schemas in PostgreSQL, every layer was built for scalability.
                  </p>
                  <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 mb-6">
                      <h4 className="text-white font-bold mb-2 flex items-center"><Layout size={16} className="mr-2 text-pink-400"/> Frontend</h4>
                      <p className="text-xs text-slate-400">Next.js with SSR, using a strict design system for consistent UX across tenant portals.</p>
                  </div>
                   <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
                      <h4 className="text-white font-bold mb-2 flex items-center"><Database size={16} className="mr-2 text-emerald-400"/> Backend</h4>
                      <p className="text-xs text-slate-400">Node.js microservices with Zod validation and a multi-tenant PostgreSQL schema.</p>
                  </div>
              </div>
                  <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                          <GitMerge size={120} className="text-white" />
                      </div>
                      
                      {/* Detailed UML Diagram Visual */}
                      <div className="relative z-10 font-mono text-[10px] md:text-xs">
                           <div className="flex flex-col md:flex-row justify-center items-start gap-8">
                               
                               {/* Tenant Entity */}
                               <div className="bg-slate-950 border border-emerald-500/50 p-4 rounded w-full md:w-48 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative">
                                   <div className="font-bold text-emerald-400 border-b border-gray-800 pb-2 mb-2 flex justify-between">
                                       <span>Tenant</span>
                                       <Lock size={12} />
                                   </div>
                                   <div className="space-y-1 text-slate-400">
                                       <div className="flex justify-between"><span>id</span> <span className="text-slate-500">UUID (PK)</span></div>
                                       <div className="flex justify-between"><span>name</span> <span className="text-slate-500">VARCHAR</span></div>
                                       <div className="flex justify-between"><span>schema</span> <span className="text-slate-500">VARCHAR</span></div>
                                       <div className="flex justify-between"><span>sso_config</span> <span className="text-slate-500">JSONB</span></div>
                                   </div>
                                   {/* Connector Line (Manual CSS for demo) */}
                                   <div className="hidden md:block absolute top-1/2 -right-8 w-8 h-px bg-gray-700"></div>
                               </div>

                               {/* User Entity */}
                               <div className="bg-slate-950 border border-blue-500/50 p-4 rounded w-full md:w-48 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative">
                                   <div className="font-bold text-blue-400 border-b border-gray-800 pb-2 mb-2 flex justify-between">
                                       <span>User</span>
                                       <Users size={12} />
                                   </div>
                                   <div className="space-y-1 text-slate-400">
                                       <div className="flex justify-between"><span>id</span> <span className="text-slate-500">UUID (PK)</span></div>
                                       <div className="flex justify-between"><span>tenant_id</span> <span className="text-slate-500">FK</span></div>
                                       <div className="flex justify-between"><span>email</span> <span className="text-slate-500">VARCHAR</span></div>
                                       <div className="flex justify-between"><span>role</span> <span className="text-slate-500">ENUM</span></div>
                                   </div>
                                    {/* Connector Line Vertical */}
                                   <div className="hidden md:block absolute -bottom-8 left-1/2 w-px h-8 bg-gray-700"></div>
                               </div>
                           </div>

                           <div className="hidden md:flex justify-center h-8">
                               {/* Spacer for vertical lines if needed */}
                           </div>

                           <div className="flex flex-col md:flex-row justify-center items-start gap-8 mt-8 md:mt-0">
                               {/* Vendor Profile */}
                                <div className="bg-slate-950 border border-brand-500/50 p-4 rounded w-full md:w-56 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative md:left-24">
                                   <div className="font-bold text-brand-400 border-b border-gray-800 pb-2 mb-2 flex justify-between">
                                       <span>VendorProfile</span>
                                       <Briefcase size={12} />
                                   </div>
                                   <div className="space-y-1 text-slate-400">
                                       <div className="flex justify-between"><span>id</span> <span className="text-slate-500">UUID (PK)</span></div>
                                       <div className="flex justify-between"><span>user_id</span> <span className="text-slate-500">FK (1:1)</span></div>
                                       <div className="flex justify-between"><span>compliance_status</span> <span className="text-slate-500">ENUM</span></div>
                                       <div className="flex justify-between"><span>docs_url</span> <span className="text-slate-500">VARCHAR</span></div>
                                   </div>
                               </div>
                           </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-800">
                          <h4 className="text-white font-bold mb-2 text-sm">Database Structure & Isolation</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                              We implemented a <strong>Schema-per-Tenant</strong> strategy within PostgreSQL. This ensures that while all tenants share the same physical RDS instance (cost-efficient), their data lives in completely separate logical schemas (secure). 
                              <br/><br/>
                              The <strong>User</strong> table acts as the global directory, routing authentication requests to the correct tenant context.
                          </p>
                      </div>
                  </div>
          </div>
      </Section>

      {/* Phase 3: AWS Infrastructure Deep Dive */}
      <Section className="bg-neutral-950 border-t border-neutral-900">
          <div className="text-center mb-16">
              <span className="text-orange-400 font-mono text-sm uppercase tracking-wider">Infrastructure & DevOps</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-6">Enterprise-Grade AWS Stack</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                  A fully automated, secure, and resilient cloud architecture designed to support strict enterprise compliance.
              </p>
          </div>

          {/* Architecture Diagram */}
          <div className="bg-slate-950 border border-gray-800 p-8 rounded-xl mb-12 relative overflow-hidden">
               <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">AWS ARCHITECTURE V1.0</div>
               
               <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 pt-8">
                   {/* Client */}
                   <div className="text-center group">
                       <div className="w-16 h-16 bg-neutral-900 border border-gray-700 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:border-white transition-colors">
                           <Users size={24} className="text-slate-400" />
                       </div>
                       <span className="text-xs text-slate-400">Enterprise Users</span>
                   </div>

                   {/* Arrow */}
                   <div className="hidden md:block h-px w-16 bg-gray-700 relative">
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">HTTPS</div>
                   </div>

                   {/* Edge Layer */}
                   <div className="text-center border border-dashed border-blue-900/50 p-4 rounded bg-blue-900/10">
                       <Globe size={32} className="text-blue-400 mx-auto mb-2" />
                       <div className="text-xs font-bold text-blue-300">CloudFront</div>
                       <div className="text-[10px] text-blue-500">WAF + CDN</div>
                   </div>

                    {/* Arrow */}
                   <div className="hidden md:block h-px w-16 bg-gray-700"></div>

                   {/* Compute Layer */}
                   <div className="flex-1 border border-orange-900/30 p-4 rounded bg-orange-900/5 relative">
                       <span className="absolute top-2 left-2 text-[10px] text-orange-600 font-mono">VPC PRIVATE SUBNET</span>
                       <div className="grid grid-cols-2 gap-4 mt-4">
                           <div className="bg-slate-950 border border-orange-800 p-3 rounded text-center">
                               <Server size={24} className="text-orange-500 mx-auto mb-1" />
                               <span className="text-xs text-white">ECS Cluster</span>
                               <span className="block text-[8px] text-slate-400">Auto-Scaling</span>
                           </div>
                           <div className="bg-slate-950 border border-orange-800 p-3 rounded text-center">
                               <Cpu size={24} className="text-yellow-500 mx-auto mb-1" />
                               <span className="text-xs text-white">Lambda</span>
                               <span className="block text-[8px] text-slate-400">Async Tasks</span>
                           </div>
                       </div>
                   </div>

                    {/* Arrow */}
                   <div className="hidden md:block h-px w-16 bg-gray-700"></div>

                    {/* Data Layer */}
                   <div className="text-center border border-dashed border-emerald-900/50 p-4 rounded bg-emerald-900/10">
                       <Database size={32} className="text-emerald-400 mx-auto mb-2" />
                       <div className="text-xs font-bold text-emerald-300">RDS Proxy</div>
                       <div className="text-[10px] text-emerald-500">PostgreSQL</div>
                   </div>
               </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-slate-950 border border-gray-800 p-6 rounded-xl">
                  <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                      <RefreshCw className="text-brand-400" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">CI/CD Pipelines</h3>
                  <div className="text-sm text-slate-400 space-y-3">
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-brand-500 rounded-full mr-2"></span>
                          <span>GitHub Webhooks triggers</span>
                      </div>
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-brand-500 rounded-full mr-2"></span>
                          <span><strong>Staging:</strong> Auto-deploy on merge</span>
                      </div>
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-brand-500 rounded-full mr-2"></span>
                          <span><strong>Prod:</strong> Manual approval gate</span>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-950 border border-gray-800 p-6 rounded-xl">
                  <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                      <Shield className="text-red-400" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Security First</h3>
                   <div className="text-sm text-slate-400 space-y-3">
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span>AWS WAF (IP & Geo Blocking)</span>
                      </div>
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span>KMS Encryption (At-rest)</span>
                      </div>
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span>Secrets Manager for Creds</span>
                      </div>
                  </div>
              </div>

               <div className="bg-slate-950 border border-gray-800 p-6 rounded-xl">
                  <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                      <Database className="text-blue-400" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Data Management</h3>
                   <div className="text-sm text-slate-400 space-y-3">
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span>Multi-AZ Failover</span>
                      </div>
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span>PITR (Point-in-time Recovery)</span>
                      </div>
                      <div className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span>S3 Lifecycle Policies</span>
                      </div>
                  </div>
              </div>
          </div>
      </Section>

      {/* Operational Impact (Reduced) */}
      <Section className="bg-slate-950">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <div className="order-2 md:order-1">
                   <h3 className="text-3xl font-bold text-white mb-6">Accelerated Time-to-Market</h3>
                   <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-2xl">
                       <h4 className="text-lg font-bold text-white mb-4 border-b border-neutral-800 pb-2">Onboarding Efficiency</h4>
                       <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={onboardingData} layout="vertical">
                                   <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                   <XAxis type="number" stroke="#666" fontSize={12} hide />
                                   <YAxis dataKey="name" type="category" stroke="#999" fontSize={12} width={100} />
                                   <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                                   <Bar dataKey="value" fill="#4f46e5" barSize={30} radius={[0, 4, 4, 0]} />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                       <p className="text-xs text-slate-400 mt-4 text-center">99% improvement in tenant provisioning time via Infrastructure-as-Code.</p>
                   </div>
              </div>

              <div className="order-1 md:order-2">
                  <div className="flex items-center text-emerald-400 mb-4">
                      <Users className="mr-3" />
                      <span className="uppercase tracking-widest font-mono text-sm">Team Orchestration</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6">Building the Dream Team</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      Beyond code, we built the company. We sourced, screened, and integrated a dedicated specialist team, implementing Agile methodologies that maximized delivery velocity.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 border border-gray-800 rounded bg-gray-900/30">
                          <div className="text-2xl font-bold text-white">2 Weeks</div>
                          <div className="text-xs text-slate-400 uppercase">Sourcing Time</div>
                      </div>
                      <div className="p-4 border border-gray-800 rounded bg-gray-900/30">
                          <div className="text-2xl font-bold text-white">High</div>
                          <div className="text-xs text-slate-400 uppercase">Retention Rate</div>
                      </div>
                  </div>
              </div>

          </div>
      </Section>
      
      <Footer />
    </>
  );
};

export default CaseStudyVendorsify;
