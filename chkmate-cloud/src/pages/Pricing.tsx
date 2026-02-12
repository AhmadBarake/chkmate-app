import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Check, Star, Zap, Infinity, Rocket, Building, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const featureComparison = [
  { feature: 'Projects', starter: '3', pro: 'Unlimited', team: 'Unlimited' },
  { feature: 'Credits / month', starter: '50', pro: '500', team: '2,000' },
  { feature: 'AI Terraform generation', starter: true, pro: true, team: true },
  { feature: 'Visual infrastructure maps', starter: true, pro: true, team: true },
  { feature: 'Basic cost estimation', starter: true, pro: true, team: true },
  { feature: 'Cloud scanner (19 services)', starter: false, pro: true, team: true },
  { feature: 'Security audits (29 policies)', starter: false, pro: true, team: true },
  { feature: 'Cost intelligence (10 policies)', starter: false, pro: true, team: true },
  { feature: 'Agentic auto-fix mode', starter: false, pro: true, team: true },
  { feature: 'Deploy to AWS (sandboxed)', starter: false, pro: true, team: true },
  { feature: 'GitHub export & diff engine', starter: false, pro: true, team: true },
  { feature: 'Template versioning', starter: false, pro: true, team: true },
  { feature: 'Team members', starter: '1', pro: '1', team: '10' },
  { feature: 'SSO & audit logs', starter: false, pro: false, team: true },
  { feature: 'Team governance & RBAC', starter: false, pro: false, team: true },
  { feature: 'Custom guardrails', starter: false, pro: false, team: true },
  { feature: 'Dedicated success manager', starter: false, pro: false, team: true },
  { feature: 'API access', starter: false, pro: false, team: true },
  { feature: 'Support', starter: 'Community', pro: 'Priority', team: 'Dedicated' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 font-sans">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Start free. Upgrade when you need more power. No hidden fees.
          </p>
        </motion.div>

        {/* Blurred Subscription Plans + Feature Table + Credit Packs */}
        <div className="relative">
          {/* Blurred content */}
          <div className="select-none pointer-events-none" style={{ filter: 'blur(8px)', opacity: 0.35 }}>
            {/* Billing Toggle (decorative) */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-full p-1">
                <div className="px-5 py-2 rounded-full text-sm font-medium bg-brand-500 text-white">Monthly</div>
                <div className="px-5 py-2 rounded-full text-sm font-medium text-slate-400">Annual</div>
              </div>
            </div>

            {/* Plan cards (decorative) */}
            <section className="mb-24">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Starter */}
                <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/30 flex flex-col">
                  <div className="mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
                      <Zap className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300">Starter</h3>
                    <p className="text-slate-500 text-sm mt-1">For individuals getting started.</p>
                  </div>
                  <div className="mb-6"><span className="text-4xl font-bold">Free</span></div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['3 Projects', '50 credits/month', 'AI Terraform generation', 'Basic cost estimation'].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400"><Check className="w-4 h-4 text-slate-600 flex-shrink-0" /> {f}</li>
                    ))}
                  </ul>
                  <div className="w-full py-3 rounded-xl border border-slate-700 text-center font-medium text-sm">Get Started</div>
                </div>

                {/* Pro */}
                <div className="p-8 rounded-3xl border border-brand-500 bg-slate-900/60 flex flex-col relative md:scale-105 z-10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>
                  <div className="mb-6">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center mb-4">
                      <Rocket className="w-5 h-5 text-brand-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Pro</h3>
                    <p className="text-slate-400 text-sm mt-1">For professionals & power users.</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-brand-400">$XX</span>
                    <span className="text-lg text-slate-500 font-normal">/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['Unlimited projects', '500 credits/month', 'Agentic auto-fix mode', 'Cloud scanner'].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300"><div className="bg-brand-500/20 p-0.5 rounded-full flex-shrink-0"><Check className="w-3 h-3 text-brand-400" /></div> {f}</li>
                    ))}
                  </ul>
                  <div className="w-full py-3 rounded-xl bg-brand-600 text-white text-center font-medium text-sm">Start Free Trial</div>
                </div>

                {/* Team */}
                <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/30 flex flex-col">
                  <div className="mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                      <Building className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300">Team</h3>
                    <p className="text-slate-500 text-sm mt-1">For teams & organizations.</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$XXX</span>
                    <span className="text-lg text-slate-500 font-normal">/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['Everything in Pro', '10 team members', '2,000 credits/month', 'SSO & audit logs'].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400"><Check className="w-4 h-4 text-slate-600 flex-shrink-0" /> {f}</li>
                    ))}
                  </ul>
                  <div className="w-full py-3 rounded-xl border border-slate-700 text-center font-medium text-sm">Contact Sales</div>
                </div>
              </div>
            </section>

            {/* Feature Comparison Table (decorative) */}
            <section className="mb-24">
              <h2 className="text-2xl font-bold mb-8 text-center text-slate-200">Feature Comparison</h2>
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="text-left p-4 text-sm font-semibold text-slate-300 w-1/3">Feature</th>
                      <th className="text-center p-4 text-sm font-semibold text-slate-500">Starter</th>
                      <th className="text-center p-4 text-sm font-semibold text-brand-400">Pro</th>
                      <th className="text-center p-4 text-sm font-semibold text-indigo-400">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.slice(0, 8).map((row, i) => (
                      <tr key={row.feature} className={i % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/20'}>
                        <td className="p-4 text-sm text-slate-300">{row.feature}</td>
                        {(['starter', 'pro', 'team'] as const).map((plan) => (
                          <td key={plan} className="p-4 text-center text-sm">
                            {typeof row[plan] === 'boolean' ? (
                              row[plan] ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-700">&mdash;</span>
                            ) : (
                              <span className="text-slate-300 font-medium">{row[plan]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Credit Packs (decorative) */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-center text-slate-200">Credit Packs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                {[
                  { name: 'Starter Pack', credits: '50 Credits', price: '$XX', icon: CreditCard, color: 'text-slate-400' },
                  { name: 'Booster Pack', credits: '200 Credits', price: '$XX', icon: Zap, color: 'text-brand-400' },
                  { name: 'Power Pack', credits: '500 Credits', price: '$XX', icon: Star, color: 'text-yellow-400' },
                  { name: 'Mega Pack', credits: '1,200 Credits', price: '$XX', icon: Infinity, color: 'text-purple-400' },
                ].map((pack) => (
                  <div key={pack.name} className="border border-slate-800 bg-slate-900/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <pack.icon className={`w-6 h-6 ${pack.color}`} />
                      <span className="font-mono text-lg font-bold text-white">{pack.price}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                    <p className="text-slate-400 text-sm">{pack.credits}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="text-center">
              {/* Animated spinner */}
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-transparent border-t-brand-400"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-brand-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Pricing Coming Soon</h3>
              <p className="text-slate-400 max-w-lg mx-auto mb-8 text-lg">
                We're finalizing our pricing model. Join the waitlist to be the first to know and lock in early-adopter rates.
              </p>
              <button
                onClick={() => navigate('/#pricing')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-500 hover:bg-brand-400 text-white font-medium transition-colors shadow-lg shadow-brand-500/25"
              >
                Join the Waitlist
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
