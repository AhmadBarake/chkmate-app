import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Check, Star, Zap, Infinity } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 font-sans">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your team's scale. No hidden fees.
          </p>
        </div>

        {/* Subscription Plans */}
        <section className="mb-24">
           <h2 className="text-2xl font-bold mb-8 text-center text-slate-200">Subscription Plans</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               
               {/* Hobby */}
               <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/30 flex flex-col">
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-300">Hobby</h3>
                      <div className="text-4xl font-bold mt-2 mb-1">$0</div>
                      <p className="text-slate-500 text-sm">Forever free for individuals.</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                      {['5 Projects', 'Basic Generators', 'Community Support', 'Standard Speed'].map((feature) => (
                          <li key={feature} className="flex items-center gap-3 text-sm text-slate-400">
                             <Check className="w-4 h-4 text-slate-600" /> {feature}
                          </li>
                      ))}
                  </ul>
                  <button className="w-full py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition font-medium">
                      Get Started
                  </button>
               </div>

               {/* Pro */}
               <div className="p-8 rounded-3xl border border-brand-500 bg-slate-900/60 flex flex-col relative shadow-2xl shadow-brand-500/10 scale-105 z-10">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                       Most Popular
                   </div>
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-white">Pro</h3>
                      <div className="text-4xl font-bold mt-2 mb-1 text-brand-400">$29<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                      <p className="text-slate-400 text-sm">For power users & freelancers.</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                      {['Unlimited Projects', 'Advanced AI Models (GPT-4o)', 'Export to GitHub', 'Priority Support', '30-day History', 'High Speed Generation'].map((feature) => (
                          <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                             <div className="bg-brand-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-brand-400" /></div> {feature}
                          </li>
                      ))}
                  </ul>
                  <button className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition font-medium shadow-lg shadow-brand-600/20">
                      Start Free Trial
                  </button>
               </div>

               {/* Team */}
               <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/30 flex flex-col">
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-300">Team</h3>
                      <div className="text-4xl font-bold mt-2 mb-1">$99<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                      <p className="text-slate-500 text-sm">For startups & agencies.</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                      {['10 Team Members', 'SSO & Audit Logs', 'Custom Templates', 'Dedicated Success Mgr', 'Private Slack Channel', 'API Access'].map((feature) => (
                          <li key={feature} className="flex items-center gap-3 text-sm text-slate-400">
                             <Check className="w-4 h-4 text-slate-600" /> {feature}
                          </li>
                      ))}
                  </ul>
                  <button className="w-full py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition font-medium">
                      Contact Sales
                  </button>
               </div>

           </div>
        </section>

        {/* Credit Packs */}
        <section>
            <h2 className="text-2xl font-bold mb-8 text-center text-slate-200">Credit Packs</h2>
            <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
                Need more generation power without upgrading? Top up your account with credit packs.
                1 Credit = 1 AI Generation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                     { name: 'Starter Pack', credits: '50 Credits', price: '$10', icon: Zap, color: 'text-slate-400' },
                     { name: 'Booster Pack', credits: '200 Credits', price: '$35', icon: Star, color: 'text-brand-400' },
                     { name: 'Power Pack', credits: '500 Credits', price: '$80', icon: Zap, color: 'text-yellow-400' },
                     { name: 'Mega Pack', credits: '1000 Credits', price: '$150', icon: Infinity, color: 'text-purple-400' },
                 ].map((pack) => (
                     <div key={pack.name} className="border border-slate-800 bg-slate-900/50 p-6 rounded-2xl hover:border-slate-700 transition cursor-pointer group">
                         <div className="flex justify-between items-start mb-4">
                             <pack.icon className={`w-6 h-6 ${pack.color}`} />
                             <span className="font-mono text-lg font-bold text-white">{pack.price}</span>
                         </div>
                         <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                         <p className="text-slate-400 text-sm">{pack.credits}</p>
                         <div className="mt-6 pt-4 border-t border-slate-800">
                             <span className="text-xs text-brand-400 font-bold uppercase tracking-wider group-hover:underline">Buy Now</span>
                         </div>
                     </div>
                 ))}
            </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
