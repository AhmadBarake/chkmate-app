import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Video, Server, Shield, Users, Award, BookOpen, PlayCircle, Lock, Cloud, Database, Cpu, Globe, Laptop, CheckCircle, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

const CaseStudyAFC: React.FC = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900/50 z-0">
             {/* Abstract Financial/Data Background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1591696205602-2f950c417cb9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
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
                    <span className="bg-yellow-900/40 text-yellow-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-yellow-800">EdTech</span>
                    <span className="bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-blue-800">Financial Services</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
                    Democratizing Finance with <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">Secure E-Learning</span>.
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-8">
                    A complete digital transformation for Arab Finance Corp, featuring a high-performance LMS, secure video streaming pipeline, and a modern financial education platform.
                </p>
            </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400">
           <ArrowLeft className="rotate-[-90deg]" size={24} />
        </div>
      </section>

      {/* Scope & Consulting */}
      <Section className="bg-neutral-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Full-Cycle Digital Consulting</h2>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      The project scope wasn't just code; it was a strategic overhaul. I partnered with AFC to map out their digital future, moving from legacy systems to a cloud-native ecosystem capable of serving thousands of aspiring investors.
                  </p>
                  <div className="space-y-4">
                      <div className="flex items-start">
                          <CheckCircle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={20} />
                          <div>
                              <h4 className="text-white font-bold">Strategic Planning</h4>
                              <p className="text-sm text-slate-400">Defined user personas, learning paths, and monetization strategies for premium courses.</p>
                          </div>
                      </div>
                      <div className="flex items-start">
                          <CheckCircle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={20} />
                          <div>
                              <h4 className="text-white font-bold">Architecture Design</h4>
                              <p className="text-sm text-slate-400">Designed a scalable AWS topology to handle spikes during market hours and course launches.</p>
                          </div>
                      </div>
                      <div className="flex items-start">
                          <CheckCircle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={20} />
                          <div>
                              <h4 className="text-white font-bold">End-to-End Development</h4>
                              <p className="text-sm text-slate-400">Lead the full-stack development, ensuring pixel-perfect UI implementation and robust backend security.</p>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 relative">
                   <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform rotate-2">
                       Impact
                   </div>
                   <div className="grid grid-cols-2 gap-6 text-center">
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <Users className="mx-auto text-blue-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-white">10k+</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">Active Students</div>
                       </div>
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <PlayCircle className="mx-auto text-yellow-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-white">500+</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">Video Hours</div>
                       </div>
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <Zap className="mx-auto text-green-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-white">99.9%</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">Uptime</div>
                       </div>
                       <div className="p-4 bg-slate-950 rounded-xl border border-gray-800">
                           <Globe className="mx-auto text-brand-400 mb-2" size={32} />
                           <div className="text-2xl font-bold text-white">Global</div>
                           <div className="text-xs text-slate-400 uppercase tracking-wider">Reach</div>
                       </div>
                   </div>
              </div>
          </div>
      </Section>

      {/* LMS & Video Engine */}
      <Section className="bg-slate-950">
          <div className="mb-16 text-center">
              <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">The Core Engine</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-6">Secure, Adaptive Video Streaming</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                  We built a Netflix-grade streaming pipeline to protect intellectual property while delivering buffer-free education on any device.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-blue-500/30 transition-colors">
                  <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center mb-6 text-blue-400">
                      <Lock size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">DRM & Signed Cookies</h3>
                  <p className="text-slate-400 text-sm">
                      Content is locked behind AWS CloudFront Signed Cookies. Direct S3 access is blocked, preventing unauthorized downloads or sharing of paid course material.
                  </p>
              </div>

               {/* Feature 2 */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-yellow-500/30 transition-colors">
                  <div className="w-12 h-12 bg-yellow-900/20 rounded-lg flex items-center justify-center mb-6 text-yellow-400">
                      <BarChart3 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Adaptive Bitrate (HLS)</h3>
                  <p className="text-slate-400 text-sm">
                      Raw uploads are transcoded via AWS MediaConvert into HLS playlists (360p to 4k). The player automatically adjusts quality based on the user's bandwidth.
                  </p>
              </div>

               {/* Feature 3 */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-green-500/30 transition-colors">
                  <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center mb-6 text-green-400">
                      <BookOpen size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Progress Tracking</h3>
                  <p className="text-slate-400 text-sm">
                      Granular analytics track user engagement. Video timestamps, quiz scores, and completion certificates are synced in real-time to the student dashboard.
                  </p>
              </div>
          </div>
      </Section>

      {/* AWS Architecture */}
      <Section className="bg-neutral-950 border-y border-neutral-900">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="order-2 md:order-1">
                   <div className="bg-slate-950 border border-gray-800 p-8 rounded-xl relative overflow-hidden">
                       <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">AWS TOPOLOGY</div>
                       
                       <div className="flex flex-col space-y-8 mt-4 relative z-10">
                           {/* Upload Phase */}
                           <div className="flex items-center justify-between">
                               <div className="flex items-center space-x-3">
                                   <div className="bg-gray-800 p-2 rounded"><Users size={16} className="text-slate-400"/></div>
                                   <div className="text-xs text-slate-400">Instructor Upload</div>
                               </div>
                               <div className="h-px bg-gray-700 flex-1 mx-4 relative">
                                    <div className="absolute right-0 -top-1 w-2 h-2 bg-gray-700 rotate-45"></div>
                               </div>
                               <div className="bg-green-900/20 border border-green-900/50 p-3 rounded text-center w-24">
                                   <Database size={20} className="text-green-500 mx-auto mb-1" />
                                   <div className="text-[10px] text-white">S3 Raw</div>
                               </div>
                           </div>

                             {/* Processing Phase */}
                           <div className="flex items-center justify-center">
                               <div className="h-8 w-px bg-gray-700"></div>
                           </div>
                           
                           <div className="bg-brand-900/10 border border-brand-500/30 p-4 rounded text-center mx-auto w-3/4">
                               <div className="flex items-center justify-center space-x-2 mb-2">
                                  <Cpu size={20} className="text-brand-400" />
                                  <span className="text-sm font-bold text-white">AWS MediaConvert</span>
                               </div>
                               <div className="text-[10px] text-slate-400">Transcode to HLS • Generate Thumbnails</div>
                           </div>

                           <div className="flex items-center justify-center">
                               <div className="h-8 w-px bg-gray-700"></div>
                           </div>

                           {/* Delivery Phase */}
                           <div className="flex items-center justify-between">
                               <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded text-center w-24">
                                   <Cloud size={20} className="text-blue-500 mx-auto mb-1" />
                                   <div className="text-[10px] text-white">CloudFront</div>
                               </div>
                               <div className="h-px bg-gray-700 flex-1 mx-4 relative">
                                    <div className="absolute right-0 -top-1 w-2 h-2 bg-gray-700 rotate-45"></div>
                               </div>
                               <div className="flex items-center space-x-3">
                                   <div className="bg-gray-800 p-2 rounded"><Laptop size={16} className="text-slate-400"/></div>
                                   <div className="text-xs text-slate-400">Student View</div>
                               </div>
                           </div>
                       </div>
                       
                       {/* Background Grid */}
                       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] z-0 pointer-events-none" />
                   </div>
               </div>
               
               <div className="order-1 md:order-2">
                   <h2 className="text-3xl font-bold text-white mb-6">Cloud-Native Reliability</h2>
                   <p className="text-slate-400 leading-relaxed mb-6">
                       Scaling to serve video/heavy content requires robust infrastructure. We utilized the full power of AWS to ensure 99.9% availability and low latency streaming globally.
                   </p>
                   <ul className="space-y-4 text-slate-400">
                       <li className="flex items-start">
                           <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                           <span><strong>S3 + CloudFront CDN:</strong> Edge caching ensures videos load instantly regardless of the user's location.</span>
                       </li>
                       <li className="flex items-start">
                           <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                           <span><strong>Lambda Triggers:</strong> automated workflows that trigger transcoding and database updates instantly upon file upload.</span>
                       </li>
                       <li className="flex items-start">
                           <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                           <span><strong>RDS Postgres:</strong> ACID-compliant transactional data storage for critical user enrollment and payment records.</span>
                       </li>
                   </ul>
               </div>
           </div>
      </Section>

      {/* Website Redesign */}
      <Section className="bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Experience Redesign</h2>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      Finance can be intimidating. We redesigned the AFC experience to be welcoming, modern, and trustworthy. We moved away from dense, text-heavy layouts to a card-based, visual hierarchy that guides users through their learning journey.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-800 rounded bg-neutral-900">
                          <h4 className="text-white font-bold mb-1">Mobile First</h4>
                          <p className="text-xs text-slate-400">Fully responsive design optimization for learning on the go.</p>
                      </div>
                      <div className="p-4 border border-gray-800 rounded bg-neutral-900">
                          <h4 className="text-white font-bold mb-1">Dark Mode</h4>
                          <p className="text-xs text-slate-400">Professional, trading-terminal inspired aesthetic.</p>
                      </div>
                  </div>
              </div>
              <div className="relative">
                  {/* Abstract Representation of UI layers */}
                  <div className="relative z-10 bg-neutral-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl p-2 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                      <div className="bg-slate-950 rounded-lg h-6 mb-2 flex items-center px-4 space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="bg-neutral-900 h-64 flex flex-col items-center justify-center text-slate-500 space-y-4">
                          <div className="w-3/4 h-8 bg-gray-800 rounded"></div>
                          <div className="w-1/2 h-32 bg-gray-800 rounded"></div>
                          <div className="flex w-3/4 space-x-4">
                              <div className="w-1/2 h-16 bg-gray-800 rounded"></div>
                              <div className="w-1/2 h-16 bg-gray-800 rounded"></div>
                          </div>
                      </div>
                  </div>
                  <div className="absolute top-4 -right-4 w-full h-full bg-blue-900/10 border border-blue-900/30 rounded-xl -z-10 transform -rotate-2"></div>
              </div>
          </div>
      </Section>
      
      <Footer />
    </>
  );
};

export default CaseStudyAFC;
