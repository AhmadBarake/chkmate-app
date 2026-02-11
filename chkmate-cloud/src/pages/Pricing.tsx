import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Check, Star, Zap, Infinity, Rocket, Building, CreditCard, Bot, Shield, DollarSign, Map, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type BillingCycle = 'monthly' | 'annual';

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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

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

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">-20%</span>
            </button>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        <section className="mb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={billingCycle}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Starter */}
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/30 flex flex-col">
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300">Starter</h3>
                  <p className="text-slate-500 text-sm mt-1">For individuals getting started.</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Free</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    {['3 Projects', '50 credits/month', 'AI Terraform generation', 'Basic cost estimation', 'Community support'].map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-400">
                           <Check className="w-4 h-4 text-slate-600 flex-shrink-0" /> {feature}
                        </li>
                    ))}
                </ul>
                <button className="w-full py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition font-medium text-sm">
                    Get Started
                </button>
              </div>

              {/* Pro */}
              <div className="p-8 rounded-3xl border border-brand-500 bg-slate-900/60 flex flex-col relative shadow-2xl shadow-brand-500/10 md:scale-105 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                </div>
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center mb-4">
                    <Rocket className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <p className="text-slate-400 text-sm mt-1">For professionals & power users.</p>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-brand-400">${billingCycle === 'monthly' ? '49' : '39'}</span>
                  <span className="text-lg text-slate-500 font-normal">/mo</span>
                </div>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-emerald-400 mb-4">Billed $468/year (save $120)</p>
                )}
                {billingCycle === 'monthly' && <div className="mb-4" />}
                <ul className="space-y-3 mb-8 flex-1">
                    {[
                      'Unlimited projects',
                      '500 credits/month',
                      'Agentic auto-fix mode',
                      'Cloud scanner (19 services)',
                      'Security audits & cost intelligence',
                      'Deploy to AWS (sandboxed)',
                      'GitHub export & diff engine',
                      'Template versioning',
                      'Priority support',
                    ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-300">
                           <div className="bg-brand-500/20 p-0.5 rounded-full flex-shrink-0"><Check className="w-3 h-3 text-brand-400" /></div> {feature}
                        </li>
                    ))}
                </ul>
                <button className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition font-medium shadow-lg shadow-brand-600/20 text-sm">
                    Start Free Trial
                </button>
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
                <div className="mb-2">
                  <span className="text-4xl font-bold">${billingCycle === 'monthly' ? '149' : '119'}</span>
                  <span className="text-lg text-slate-500 font-normal">/mo</span>
                </div>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-emerald-400 mb-4">Billed $1,428/year (save $360)</p>
                )}
                {billingCycle === 'monthly' && <div className="mb-4" />}
                <ul className="space-y-3 mb-8 flex-1">
                    {[
                      'Everything in Pro',
                      '10 team members',
                      '2,000 credits/month',
                      'SSO & audit logs',
                      'Team governance & RBAC',
                      'Custom guardrails',
                      'Dedicated success manager',
                      'API access',
                    ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-400">
                           <Check className="w-4 h-4 text-slate-600 flex-shrink-0" /> {feature}
                        </li>
                    ))}
                </ul>
                <button className="w-full py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition font-medium text-sm">
                    Contact Sales
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Feature Comparison Table */}
        <section className="mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-2xl font-bold mb-8 text-center text-slate-200"
          >
            Feature Comparison
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="border border-slate-800 rounded-2xl overflow-hidden"
          >
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
                {featureComparison.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/20'}>
                    <td className="p-4 text-sm text-slate-300">{row.feature}</td>
                    {(['starter', 'pro', 'team'] as const).map((plan) => (
                      <td key={plan} className="p-4 text-center text-sm">
                        {typeof row[plan] === 'boolean' ? (
                          row[plan] ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="text-slate-700">&mdash;</span>
                          )
                        ) : (
                          <span className="text-slate-300 font-medium">{row[plan]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </section>

        {/* Credit Packs */}
        <section>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-4 text-center text-slate-200"
            >
              Credit Packs
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center text-slate-400 mb-12 max-w-2xl mx-auto"
            >
                Need more generation power? Top up with credit packs. Credits are used across all features: generation, audits, scans, agent analysis, and deployments.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                     { name: 'Starter Pack', credits: '50 Credits', price: '$10', perCredit: '$0.20', icon: CreditCard, color: 'text-slate-400', borderHover: 'hover:border-slate-600' },
                     { name: 'Booster Pack', credits: '200 Credits', price: '$35', perCredit: '$0.175', icon: Zap, color: 'text-brand-400', borderHover: 'hover:border-brand-500/30' },
                     { name: 'Power Pack', credits: '500 Credits', price: '$75', perCredit: '$0.15', icon: Star, color: 'text-yellow-400', borderHover: 'hover:border-yellow-500/30' },
                     { name: 'Mega Pack', credits: '1,200 Credits', price: '$150', perCredit: '$0.125', icon: Infinity, color: 'text-purple-400', borderHover: 'hover:border-purple-500/30' },
                 ].map((pack, i) => (
                     <motion.div
                       key={pack.name}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.4, delay: i * 0.1 }}
                       viewport={{ once: true }}
                       className={`border border-slate-800 bg-slate-900/50 p-6 rounded-2xl ${pack.borderHover} transition cursor-pointer group`}
                     >
                         <div className="flex justify-between items-start mb-4">
                             <pack.icon className={`w-6 h-6 ${pack.color}`} />
                             <span className="font-mono text-lg font-bold text-white">{pack.price}</span>
                         </div>
                         <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                         <p className="text-slate-400 text-sm">{pack.credits}</p>
                         <p className="text-slate-600 text-xs mt-1">{pack.perCredit}/credit</p>
                         <div className="mt-6 pt-4 border-t border-slate-800">
                             <span className="text-xs text-brand-400 font-bold uppercase tracking-wider group-hover:underline">Buy Now</span>
                         </div>
                     </motion.div>
                 ))}
            </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
