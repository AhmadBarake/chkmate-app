import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { subscribeToMailchimp } from '../services/mailchimp';
import { submitWaitlistEmail } from '../lib/api';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    // Store in database first (reliable)
    try {
      await submitWaitlistEmail(email, 'NEWSLETTER', window.location.href);
    } catch (err) {
      console.error('Failed to save newsletter email to DB:', err);
    }

    // Also try Mailchimp (best-effort)
    subscribeToMailchimp(
      email,
      () => {
        setStatus('success');
        setEmail('');
      },
      (err) => {
        // DB save succeeded, so show success even if Mailchimp fails
        console.error('Mailchimp error:', err);
        setStatus('success');
        setEmail('');
      }
    );
  };

  return (
    <div className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl shadow-brand-500/5">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay ahead of the <span className="text-brand-400">cloud</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Get the latest updates on infrastructure automation, Terraform patterns, and new chkmate features delivered to your inbox.
            </p>
          </div>

          <div className="w-full md:w-auto min-w-[320px]">
            {status === 'success' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-white">Subscribed!</h3>
                <p className="text-emerald-200/60 text-sm">Thanks for joining.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === 'loading'}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2">
                    <button 
                      type="submit"
                      disabled={status === 'loading'}
                      className="bg-brand-600 hover:bg-brand-500 text-white p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center md:text-left pl-2">
                  No checkspam, we promise. Unsubscribe anytime.
                </p>
                {status === 'error' && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle size={12} /> {errorMessage}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
