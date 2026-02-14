import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Stethoscope, Database, ShoppingCart, Activity, Truck, Pill, FileText, Lock, Network, RefreshCw, ScanBarcode, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Section from '../components/Section';

const CaseStudySGH: React.FC = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900/50 z-0">
             {/* Abstract Medical Background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2128&auto=format&fit=crop')] bg-cover bg-center" />
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
                    <span className="bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-blue-800">Healthcare Strategy</span>
                    <span className="bg-emerald-900/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono uppercase border border-emerald-800">Digital Integration</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-50 mb-6 max-w-4xl leading-tight">
                    Transforming Patient Care with <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-300">Integrated E-Commerce</span>.
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-8">
                    A comprehensive consulting roadmap for Saudi German Hospital to launch a seamless online store for prescriptions, wellness, and booking, deeply integrated with existing hospital systems.
                </p>
            </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400">
           <ArrowLeft className="rotate-[-90deg]" size={24} />
        </div>
      </section>

      {/* Technical User Journey Strategy */}
      <Section className="bg-slate-950">
           <div className="text-center mb-16">
              <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">The Patient Experience</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-50 mt-2 mb-6">Digital Prescription Journey</h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                  We architected a "Zero-Friction" flow that connects physical consultations to digital fulfillment, minimizing patient effort while maintaining strict medical compliance.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
               {/* Step 1 */}
               <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-blue-500/50 transition-colors relative group">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center border border-gray-700 text-slate-400 font-mono text-xs z-10">01</div>
                   <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-lg flex items-center justify-center mb-4 border border-blue-900/50">
                       <Stethoscope size={24} />
                   </div>
                   <h3 className="font-bold text-slate-50 mb-2">Doctor's Console</h3>
                   <p className="text-sm text-slate-400">Doctor enters prescription into HIS (Hospital Information System) with specific dosage and duration.</p>
               </div>
               
               {/* Connector */}
               <div className="hidden md:flex items-center justify-center">
                   <div className="w-full h-0.5 bg-gradient-to-r from-neutral-800 to-neutral-800 relative">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-700 rounded-full"></div>
                   </div>
               </div>

               {/* Step 2 */}
               <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-brand-500/50 transition-colors relative group col-span-2 md:col-span-1">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center border border-gray-700 text-slate-400 font-mono text-xs z-10">02</div>
                   <div className="w-12 h-12 bg-brand-900/30 text-brand-400 rounded-lg flex items-center justify-center mb-4 border border-brand-900/50">
                       <Network size={24} />
                   </div>
                   <h3 className="font-bold text-slate-50 mb-2">Middleware Sync</h3>
                   <p className="text-sm text-slate-400">HL7 message triggers API payload. Prescription object is created in E-Com DB linked to Patient MRN.</p>
               </div>

                {/* Connector */}
               <div className="hidden md:flex items-center justify-center">
                   <div className="w-full h-0.5 bg-gradient-to-r from-neutral-800 to-neutral-800 relative">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-700 rounded-full"></div>
                   </div>
               </div>

               {/* Step 3 */}
               <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-emerald-500/50 transition-colors relative group">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center border border-gray-700 text-slate-400 font-mono text-xs z-10">03</div>
                   <div className="w-12 h-12 bg-emerald-900/30 text-emerald-400 rounded-lg flex items-center justify-center mb-4 border border-emerald-900/50">
                       <ShoppingCart size={24} />
                   </div>
                   <h3 className="font-bold text-slate-50 mb-2">Pre-Populated Cart</h3>
                   <p className="text-sm text-slate-400">Patient receives SMS link. Clicking it opens the App with meds already in cart, pending checkout.</p>
               </div>
          </div>
      </Section>

      {/* Integration Deep Dive */}
      <Section className="bg-neutral-900 border-y border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
             <div>
                 <h2 className="text-3xl font-bold text-slate-50 mb-6">Integration Architecture</h2>
                 <p className="text-slate-400 leading-relaxed mb-6">
                     The core complexity lay in the bidirectional synchronization between the legacy on-premise HIS and the cloud-native e-commerce platform. We implemented a robust <strong>Enterprise Service Bus (ESB)</strong> pattern.
                 </p>
                 
                 <div className="space-y-6">
                     <div className="bg-slate-950 p-4 rounded-lg border-l-4 border-blue-500">
                         <h4 className="text-slate-50 font-bold flex items-center"><Activity size={16} className="mr-2 text-blue-500"/> Patient History Integration</h4>
                         <p className="text-xs text-slate-400 mt-2">
                             The system queries the EMR for patient allergies and contraindications in real-time before checkout. If a conflict affects the cart (e.g., potential drug interaction), the order is flagged for pharmacist review.
                         </p>
                     </div>
                     <div className="bg-slate-950 p-4 rounded-lg border-l-4 border-brand-500">
                         <h4 className="text-slate-50 font-bold flex items-center"><CreditCard size={16} className="mr-2 text-brand-500"/> Real-time Adjudication</h4>
                         <p className="text-xs text-slate-400 mt-2">
                             Checkout flow integrates with Insurance Gateways (Waseel/Nawn) to calculate patient copay instantly. Logic handles coverage rejection by offering full-pay overrides.
                         </p>
                     </div>
                 </div>
             </div>
             
             {/* Abstract Integration Visual */}
             <div className="bg-slate-950 p-8 rounded-xl border border-gray-800 relative">
                  <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">SYSTEM TOPOLOGY</div>
                  
                  <div className="flex flex-col space-y-8 mt-4">
                      {/* HIS Layer */}
                      <div className="flex items-center justify-between p-4 border border-gray-700 rounded bg-gray-900/50">
                          <div className="flex items-center">
                              <Database className="text-slate-400 mr-3" />
                              <div>
                                  <div className="text-slate-50 font-bold text-sm">Legacy HIS (ERP)</div>
                                  <div className="text-[10px] text-slate-400">Oracle DB • HL7 Standards</div>
                              </div>
                          </div>
                          <div className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900">On-Premise</div>
                      </div>

                      {/* Middleware Arrow */}
                      <div className="flex justify-center -my-4 relative z-10">
                          <div className="bg-gray-800 p-2 rounded-full border border-gray-600">
                              <RefreshCw size={16} className="text-blue-400" />
                          </div>
                      </div>

                      {/* Middleware Layer */}
                      <div className="flex items-center justify-center p-6 border-2 border-dashed border-blue-800/50 rounded-xl bg-blue-900/10">
                          <div className="text-center">
                              <div className="text-blue-400 font-mono font-bold">Secure Middleware Layer</div>
                              <div className="text-[10px] text-blue-300 mt-1">Data normalization • Caching • Rate Limiting</div>
                          </div>
                      </div>

                      {/* Middleware Arrow */}
                      <div className="flex justify-center -my-4 relative z-10">
                           <div className="bg-gray-800 p-2 rounded-full border border-gray-600">
                              <RefreshCw size={16} className="text-emerald-400" />
                          </div>
                      </div>

                      {/* E-Com Layer */}
                      <div className="flex items-center justify-between p-4 border border-emerald-800 rounded bg-emerald-900/10">
                          <div className="flex items-center">
                              <ShoppingCart className="text-emerald-500 mr-3" />
                              <div>
                                  <div className="text-slate-50 font-bold text-sm">Cloud E-Commerce</div>
                                  <div className="text-[10px] text-slate-400">Headless API • React Frontend</div>
                              </div>
                          </div>
                          <div className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-900">AWS Cloud</div>
                      </div>
                  </div>
             </div>
          </div>
      </Section>

      {/* Operational Workflows */}
      <Section className="bg-slate-950">
          <div className="text-center mb-16">
              <span className="text-orange-400 font-mono text-sm uppercase tracking-wider">Operational Excellence</span>
              <h2 className="text-3xl font-bold text-slate-50 mt-2">Logistics & Stock Control</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="w-12 h-12 bg-orange-900/20 rounded-full flex items-center justify-center mb-6 border border-orange-900/50">
                      <ScanBarcode className="text-orange-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-3">Live Stock Synchronization</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      To prevent overselling, we implemented a <strong>"Soft Lock"</strong> mechanism. When a user adds an item to cart, middleware queries the specific hospital branch's inventory and reserves the unit for 15 minutes.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2">
                      <li className="flex items-center">• 5-minute full sync cycles</li>
                      <li className="flex items-center">• Multi-location inventory visibility</li>
                  </ul>
              </div>

              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="w-12 h-12 bg-cyan-900/20 rounded-full flex items-center justify-center mb-6 border border-cyan-900/50">
                      <FileText className="text-cyan-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-3">Checkout Validation</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      Checkout is not just payment; it's a medical validation gate. The logic checks for valid prescription expiry, insurance coverage limits, and controlled substance regulations before capturing payment.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2">
                      <li className="flex items-center">• Automated Insurance Approval</li>
                      <li className="flex items-center">• ID Verification for Controlled Meds</li>
                  </ul>
              </div>

              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="w-12 h-12 bg-pink-900/20 rounded-full flex items-center justify-center mb-6 border border-pink-900/50">
                      <Truck className="text-pink-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-3">Order Fulfillment</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      Orders are routed to the nearest hospital pharmacy for packing. The system generates a digital pick-list for pharmacists. Once packed, a "Ready for Pickup" or "Out for Delivery" status triggers a patient notification.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2">
                      <li className="flex items-center">• Smart Routing Algorithm</li>
                      <li className="flex items-center">• Cold-chain delivery tracking</li>
                  </ul>
              </div>
          </div>
      </Section>

      <Footer />
    </>
  );
};

export default CaseStudySGH;
