import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Server, Video, Shield, GitBranch, Users, Play, Database, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

// Mock Data for Charts
const userData = [
  { month: 'Jan', users: 5000 },
  { month: 'Feb', users: 12000 },
  { month: 'Mar', users: 25000 },
  { month: 'Apr', users: 38000 },
  { month: 'May', users: 48000 },
  { month: 'Jun', users: 62000 },
];

const trafficData = [
  { time: '00:00', bandwidth: 2 },
  { time: '04:00', bandwidth: 1 },
  { time: '08:00', bandwidth: 45 },
  { time: '12:00', bandwidth: 80 },
  { time: '16:00', bandwidth: 65 },
  { time: '20:00', bandwidth: 30 },
];

const CaseStudyADSG: React.FC = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900/50 z-0">
             {/* Abstract Network/Cloud Background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center" />
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
                    <span className="bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-blue-800">Cloud Architecture</span>
                    <span className="bg-brand-900/40 text-brand-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-brand-800">Education Tech</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
                    Scaling Learning for <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">60,000+ Users</span> with Serverless AWS Architecture.
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-8">
                    Implementing a secure, high-concurrency video streaming platform for <span className="text-white font-semibold">Abu Dhabi School of Government</span>.
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
                     The Abu Dhabi School of Government (ADSG) needed to democratize access to world-class learning materials for government employees across the emirate. The existing legacy infrastructure struggled with:
                 </p>
                 <ul className="space-y-4 text-slate-400">
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Concurrency Spikes:</strong> System crashes during mandatory training windows when 10k+ users logged in simultaneously.</span>
                     </li>
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Video Latency:</strong> Poor streaming quality for on-demand HD course content.</span>
                     </li>
                     <li className="flex items-start">
                         <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                         <span><strong>Slow Deployment:</strong> Manual release cycles taking weeks to push critical updates.</span>
                     </li>
                 </ul>
             </div>
             
             <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg">
                 <h3 className="text-xl font-bold text-white mb-6">Impact Analysis</h3>
                 <div className="space-y-6">
                      <div>
                          <div className="flex justify-between text-sm mb-2 text-slate-400">
                              <span>User Satisfaction</span>
                              <span className="text-red-400">Low (Pre-Migration)</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 w-[30%]" />
                          </div>
                      </div>
                      <div>
                          <div className="flex justify-between text-sm mb-2 text-slate-400">
                              <span>Server Costs</span>
                              <span className="text-red-400">Critically High</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 w-[85%]" />
                          </div>
                      </div>
                      <div>
                          <div className="flex justify-between text-sm mb-2 text-slate-400">
                              <span>Downtime Events</span>
                              <span className="text-red-400">Frequent</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 w-[60%]" />
                          </div>
                      </div>
                 </div>
             </div>
          </div>
      </Section>

      {/* Solution Architecture Diagram */}
      <Section className="bg-neutral-950 border-y border-neutral-900">
          <div className="text-center mb-16">
              <span className="text-cyan-400 font-mono text-sm uppercase tracking-wider">The Solution</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-6">3-Tier AWS Serverless Architecture</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                  We designed a fully decoupled, event-driven architecture utilizing AWS Managed Services to ensure auto-scaling, high availability, and zero-maintenance overhead.
              </p>
          </div>

          <div className="bg-slate-950 border border-gray-800 p-8 md:p-12 rounded-xl relative overflow-hidden">
              {/* Custom SVG Architecture Diagram */}
              <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 relative z-10">
                  
                  {/* CLIENT */}
                  <div className="text-center">
                      <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                          <Users size={32} className="text-white" />
                      </div>
                      <p className="text-sm font-mono text-slate-400">60k+ Users</p>
                      <p className="text-xs text-slate-500">(Web & Mobile)</p>
                  </div>
                  
                  {/* ARROW */}
                  <div className="hidden md:block flex-1 border-t-2 border-dashed border-gray-700 relative">
                     <span className="absolute top-[-24px] left-1/2 -translate-x-1/2 text-xs text-slate-400">Route 53 / WAF</span>
                  </div>

                  {/* CDN / EDGE */}
                  <div className="text-center relative group">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                          <Cloud size={40} className="text-white" />
                      </div>
                      <p className="text-sm font-bold text-white">CloudFront CDN</p>
                      <p className="text-xs text-slate-400 mt-1">Global Edge Caching</p>
                  </div>

                   {/* ARROW */}
                   <div className="hidden md:block flex-1 border-t-2 border-dashed border-gray-700 relative">
                      <span className="absolute top-[-24px] left-1/2 -translate-x-1/2 text-xs text-slate-400">ALB</span>
                   </div>

                  {/* COMPUTE */}
                  <div className="p-6 border border-dashed border-cyan-800/50 rounded-xl bg-cyan-900/5">
                      <div className="text-cyan-500 text-xs font-mono uppercase mb-4 text-center">Compute Layer</div>
                      <div className="flex space-x-4">
                          <div className="text-center">
                              <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-neutral-700">
                                  <Server size={24} className="text-cyan-400" />
                              </div>
                              <p className="text-xs text-white">ECS Fargate</p>
                              <p className="text-[10px] text-slate-400">Microservices</p>
                          </div>
                          <div className="text-center">
                              <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-neutral-700">
                                  <Play size={24} className="text-brand-400" />
                              </div>
                              <p className="text-xs text-white">Lambda</p>
                              <p className="text-[10px] text-slate-400">Video Encoding</p>
                          </div>
                      </div>
                  </div>

                   {/* ARROW */}
                   <div className="hidden md:block flex-1 border-t-2 border-dashed border-gray-700 relative"></div>

                  {/* DATA */}
                  <div className="text-center">
                      <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                          <Database size={32} className="text-orange-400" />
                      </div>
                      <p className="text-sm font-bold text-white">RDS & S3</p>
                      <p className="text-xs text-slate-500">Persistent Storage</p>
                  </div>

              </div>
              
              {/* Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none" />
          </div>
      </Section>

      {/* Video Streaming Focus */}
      <Section className="bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                   <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-2xl">
                       <h4 className="text-lg font-bold text-white mb-4 border-b border-neutral-800 pb-2">Adaptive Bitrate Streaming</h4>
                       {/* Chart: Traffic Spikes */}
                       <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={trafficData}>
                                   <defs>
                                       <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                           <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                       </linearGradient>
                                   </defs>
                                   <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                   <XAxis dataKey="time" stroke="#666" fontSize={12} />
                                   <YAxis stroke="#666" fontSize={12} />
                                   <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                                   <Area type="monotone" dataKey="bandwidth" stroke="#8884d8" fillOpacity={1} fill="url(#colorBw)" />
                               </AreaChart>
                           </ResponsiveContainer>
                       </div>
                       <p className="text-xs text-slate-400 mt-4 text-center">Peak Bandwidth Visualization (On-Demand Scaling)</p>
                   </div>
              </div>
              <div className="order-1 md:order-2">
                  <div className="flex items-center text-brand-400 mb-4">
                      <Video className="mr-3" />
                      <span className="uppercase tracking-widest font-mono text-sm">Media Engineering</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6">Seamless Video Experience</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      Education relies on content. We implemented an automated media pipeline using <strong>AWS MediaConvert</strong> triggered by S3 uploads.
                  </p>
                  <ul className="space-y-4 text-slate-400">
                      <li className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span><strong>Multi-Codec Support:</strong> H.264 & H.265 encoded content for optimized delivery on mobile and desktop.</span>
                      </li>
                      <li className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span><strong>HLS Streaming:</strong> Adaptive bitrate streaming ensures smooth playback even on low-bandwidth government networks.</span>
                      </li>
                  </ul>
              </div>
          </div>
      </Section>
      
      {/* CI/CD & Security */}
      <Section className="bg-neutral-900 border-t border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="col-span-1 md:col-span-2">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <GitBranch className="mr-3 text-green-400" /> 
                      DevSecOps Pipeline
                  </h3>
                   <div className="bg-slate-950 border border-gray-800 rounded-lg p-6">
                       <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-slate-400 text-sm font-mono">
                           <div className="flex flex-col items-center">
                               <div className="px-4 py-2 border border-gray-700 rounded bg-gray-900 mb-2">GitHub</div>
                               <span>Commit</span>
                           </div>
                           <div className="h-0.5 w-8 bg-gray-700 md:block hidden"></div>
                           <div className="flex flex-col items-center">
                               <div className="px-4 py-2 border border-blue-900/50 rounded bg-blue-900/10 mb-2 text-blue-300">AWS CodeBuild</div>
                               <span>Test & Scan</span>
                           </div>
                           <div className="h-0.5 w-8 bg-gray-700 md:block hidden"></div>
                           <div className="flex flex-col items-center">
                               <div className="px-4 py-2 border border-green-900/50 rounded bg-green-900/10 mb-2 text-green-300">AWS CodeDeploy</div>
                               <span>Blue/Green</span>
                           </div>
                           <div className="h-0.5 w-8 bg-gray-700 md:block hidden"></div>
                           <div className="flex flex-col items-center">
                               <div className="px-4 py-2 border border-gray-700 rounded bg-gray-900 mb-2">Production</div>
                               <span>Live</span>
                           </div>
                       </div>
                       <div className="mt-8 pt-6 border-t border-gray-800">
                           <p className="text-slate-400 text-xs">
                               <span className="text-green-400 font-bold">ZERO DOWNTIME:</span> Utilized ECS Blue/Green Deployments to ensure critical learning services remained available during updates.
                           </p>
                       </div>
                   </div>
              </div>

              <div>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Shield className="mr-3 text-orange-400" />
                      Security Audit
                  </h3>
                  <ul className="space-y-4">
                      <li className="bg-slate-950 p-4 border-l-2 border-green-500">
                          <h4 className="text-white font-bold text-sm">WAF (Web Application Firewall)</h4>
                          <p className="text-xs text-slate-400 mt-1">Blocked 99.9% of SQLi and XSS attempts during penetration testing.</p>
                      </li>
                      <li className="bg-slate-950 p-4 border-l-2 border-green-500">
                          <h4 className="text-white font-bold text-sm">KMS Encryption</h4>
                          <p className="text-xs text-slate-400 mt-1">AES-256 Encryption for all PII data at rest and in transit.</p>
                      </li>
                      <li className="bg-slate-950 p-4 border-l-2 border-green-500">
                          <h4 className="text-white font-bold text-sm">IAM Roles</h4>
                          <p className="text-xs text-slate-400 mt-1">Least Privilege access policy enforced across all microservices.</p>
                      </li>
                  </ul>
              </div>

          </div>
      </Section>

      {/* Results / Growth */}
      <Section className="bg-slate-950">
          <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white">The Result</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="p-8 border border-gray-800 text-center">
                  <div className="text-4xl font-bold text-white mb-2">99.99%</div>
                  <div className="text-sm text-slate-400 uppercase tracking-widest">Uptime Achieved</div>
              </div>
              <div className="p-8 border border-gray-800 text-center">
                  <div className="text-4xl font-bold text-white mb-2">60,000+</div>
                  <div className="text-sm text-slate-400 uppercase tracking-widest">Active Learners</div>
              </div>
              <div className="p-8 border border-gray-800 text-center">
                  <div className="text-4xl font-bold text-white mb-2">-40%</div>
                  <div className="text-sm text-slate-400 uppercase tracking-widest">Infra Costs</div>
              </div>
          </div>
          
          <div className="h-96 w-full bg-neutral-900/50 p-8 rounded-xl border border-neutral-800">
               <h3 className="text-white font-bold mb-8">User Adoption Growth</h3>
               <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={userData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                        <Line type="monotone" dataKey="users" stroke="#4ade80" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
               </ResponsiveContainer>
          </div>
      </Section>
      
      <Footer />
    </>
  );
};

export default CaseStudyADSG;
