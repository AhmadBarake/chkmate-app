import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Battery, Server, Shield, Users, Globe, Cloud, Database, Layout, Lock, CheckCircle, BarChart3, Zap, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

const CaseStudyAEMENA: React.FC = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900/50 z-0">
             {/* Solar/Energy Background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center" />
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
                    <span className="bg-green-900/40 text-green-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-green-800">Sustainable Energy</span>
                    <span className="bg-yellow-900/40 text-yellow-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-yellow-800">Cloud Architecture</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-50 mb-6 max-w-4xl leading-tight">
                    Powering the Future with <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-500">Digital Intelligence</span>.
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-8">
                    A comprehensive digital transformation for AE MENA, featuring a custom CMS for project management and a scalable AWS infrastructure for global asset delivery.
                </p>
            </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400">
           <ArrowLeft className="rotate-[-90deg]" size={24} />
        </div>
      </section>

      {/* Scope Overview */}
      <Section className="bg-neutral-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                  <h2 className="text-3xl font-bold text-slate-50 mb-6">Empowering Green Energy</h2>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      AE MENA needed a digital presence that matched their innovation in the solar sector. We delivered a complete overhaul—from a high-performance diverse website to a secure, internal content management system that gives them full control over their project portfolio.
                  </p>
                  <div className="space-y-4">
                      <div className="flex items-start">
                          <CheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" size={20} />
                          <div>
                              <h4 className="text-slate-50 font-bold">Custom CMS Development</h4>
                              <p className="text-sm text-slate-400">Tailored admin dashboard with role-based access control (RBAC) for managing solar projects and news.</p>
                          </div>
                      </div>
                      <div className="flex items-start">
                          <CheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" size={20} />
                          <div>
                              <h4 className="text-slate-50 font-bold">AWS Cloud Infrastructure</h4>
                              <p className="text-sm text-slate-400">Serverless file storage and global CDN integration for lightning-fast asset loading.</p>
                          </div>
                      </div>
                      <div className="flex items-start">
                          <CheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" size={20} />
                          <div>
                              <h4 className="text-slate-50 font-bold">Website Redesign</h4>
                              <p className="text-sm text-slate-400">Modern, responsive UI that communicates reliability and technological leadership.</p>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 relative group">
                   <div className="absolute -top-4 -right-4 bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform">
                       Results
                   </div>
                   <div className="grid grid-cols-2 gap-6 text-center">
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <Zap className="mx-auto text-yellow-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-slate-50">40%</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">Faster Load Time</div>
                       </div>
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <Shield className="mx-auto text-green-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-slate-50">100%</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">RBAC Security</div>
                       </div>
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <Globe className="mx-auto text-blue-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-slate-50">CDN</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">Global Caching</div>
                       </div>
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <Layout className="mx-auto text-brand-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-slate-50">Custom</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">CMS Interface</div>
                       </div>
                   </div>
              </div>
          </div>
      </Section>

      {/* Cloud Architecture */}
      <Section className="bg-slate-950">
           <div className="mb-16 text-center">
              <span className="text-yellow-500 font-mono text-sm uppercase tracking-wider">Infrastructure</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mt-2 mb-6">Scalable AWS Backbone</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                  We architected a robust cloud environment to handle high-resolution project imagery and secure data storage, ensuring zero downtime and maximum security.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* S3 Storage */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <HardDrive size={100} className="text-yellow-500" />
                  </div>
                  <div className="w-12 h-12 bg-yellow-900/20 rounded-lg flex items-center justify-center mb-6 text-yellow-400 relative z-10">
                      <Database size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-3 relative z-10">S3 Object Storage</h3>
                  <p className="text-slate-400 text-sm relative z-10">
                      Centralized, durable storage for all media assets. Configured with lifecycle policies to manage costs and versioning for data recovery.
                  </p>
              </div>

               {/* CloudFront CDN */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Globe size={100} className="text-blue-500" />
                  </div>
                  <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center mb-6 text-blue-400 relative z-10">
                      <Cloud size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-3 relative z-10">CloudFront CDN</h3>
                  <p className="text-slate-400 text-sm relative z-10">
                      Content Delivery Network ensuring low-latency access to site content from anywhere in the MENA region and beyond.
                  </p>
              </div>

               {/* Security */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Lock size={100} className="text-green-500" />
                  </div>
                  <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center mb-6 text-green-400 relative z-10">
                      <Shield size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-3 relative z-10">IAM & Security</h3>
                  <p className="text-slate-400 text-sm relative z-10">
                      Granular IAM policies and bucket policies to strictly control access. Data is encrypted at rest (AES-256) and in transit (SSL/TLS).
                  </p>
              </div>
          </div>
      </Section>

      {/* CMS & Admin */}
      <Section className="bg-neutral-950 border-t border-neutral-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="order-2 md:order-1">
                   {/* Abstract CMS UI Visualization */}
                   <div className="bg-neutral-900 border border-gray-800 rounded-xl p-4 shadow-2xl relative">
                       <div className="flex items-center space-x-2 border-b border-gray-800 pb-4 mb-4">
                           <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                           <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                           <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                           <div className="ml-4 bg-gray-800 h-4 w-64 rounded text-[10px] flex items-center px-2 text-slate-400 text-mono">admin.aemena.com/dashboard</div>
                       </div>
                       
                       <div className="grid grid-cols-4 gap-4">
                           {/* Sidebar */}
                           <div className="col-span-1 space-y-2">
                               <div className="h-8 bg-green-900/20 rounded w-full border-l-2 border-green-500"></div>
                               <div className="h-8 bg-gray-800 rounded w-full"></div>
                               <div className="h-8 bg-gray-800 rounded w-full"></div>
                               <div className="h-8 bg-gray-800 rounded w-full"></div>
                           </div>
                           
                           {/* Main Content */}
                           <div className="col-span-3 space-y-4">
                               <div className="flex justify-between">
                                   <div className="h-8 bg-gray-800 rounded w-1/3"></div>
                                   <div className="h-8 bg-blue-600 rounded w-24"></div>
                               </div>
                               <div className="h-32 bg-gray-800/50 rounded border border-dashed border-gray-700 flex items-center justify-center text-slate-500 text-xs">
                                   Drag & Drop Image Upload
                               </div>
                               <div className="space-y-2">
                                   <div className="h-4 bg-gray-800 rounded w-full"></div>
                                   <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                                   <div className="h-4 bg-gray-800 rounded w-4/6"></div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>

               <div className="order-1 md:order-2">
                   <div className="flex items-center space-x-2 mb-4">
                        <Layout size={20} className="text-green-400" />
                        <span className="text-green-400 font-mono text-sm uppercase tracking-wider">Custom CMS</span>
                   </div>
                   <h2 className="text-3xl font-bold text-slate-50 mb-6">Control at Your Fingertips</h2>
                   <p className="text-slate-400 leading-relaxed mb-6">
                       Off-the-shelf CMS solutions were too rigid for AE MENA's specific portfolio needs. We built a custom React-based admin panel that empowers their team to manage content effortlessly.
                   </p>
                   <ul className="space-y-4 text-slate-400">
                       <li className="flex items-start">
                           <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                           <span><strong>Role-Based Access:</strong> Distinct permissions for Editors, Admins, and Viewers to maintain content integrity.</span>
                       </li>
                       <li className="flex items-start">
                           <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                           <span><strong>Direct AWS Uploads:</strong> Secure, signed URL uploads directly to S3, bypassing server bottlenecks.</span>
                       </li>
                       <li className="flex items-start">
                           <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                           <span><strong>Live Preview:</strong> Real-time rendering preview ensures content looks perfect before publishing.</span>
                       </li>
                   </ul>
               </div>
          </div>
      </Section>
      
      <Footer />
    </>
  );
};

export default CaseStudyAEMENA;
