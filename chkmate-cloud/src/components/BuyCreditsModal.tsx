import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Check, CreditCard, Shield, Sparkles, Loader2 } from 'lucide-react';
import Button from './Button';
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { useToastActions } from '../context/ToastContext';
import { cn } from '../lib/utils';
import { useUser } from '@clerk/clerk-react';

const CREDIT_PACKS = [
  {
    id: 'STARTER',
    name: 'Starter',
    credits: 100,
    price: '$9',
    description: 'Perfect for small projects and initial cloud audits.',
    color: 'from-blue-500 to-indigo-600',
    popular: false
  },
  {
    id: 'PRO',
    name: 'Pro',
    credits: 500,
    price: '$39',
    description: 'Designed for production environments and frequent scans.',
    color: 'from-brand-500 to-emerald-600',
    popular: true
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    credits: 2000,
    price: '$129',
    description: 'Ideal for scaling infrastructures and mid-sized teams.',
    color: 'from-purple-500 to-pink-600',
    popular: false
  },
  {
    id: 'SCALE',
    name: 'Scale',
    credits: 10000,
    price: '$499',
    description: 'For enterprise-grade multi-cloud observability.',
    color: 'from-amber-500 to-orange-600',
    priceId: 'pri_scale_placeholder', // Replace with real ID
    popular: false
  }
];

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export default function BuyCreditsModal({ isOpen, onClose, onSuccess }: BuyCreditsModalProps) {
  const toast = useToastActions();
  const { user } = useUser();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);

  useEffect(() => {
    initializePaddle({ 
        environment: 'sandbox', 
        token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || 'test_token' 
    }).then((paddleInstance: Paddle | undefined) => {
        if (paddleInstance) {
            setPaddle(paddleInstance);
        }
    });
  }, []);

  const handlePurchase = async () => {
    if (!selectedPack || !paddle || !user) return;

    const pack = CREDIT_PACKS.find(p => p.id === selectedPack);
    if (!pack) return;

    setLoading(true);
    try {
      paddle.Checkout.open({
        items: [{ priceId: pack.priceId || 'pri_test_123', quantity: 1 }],
        customData: {
            userId: user.id,
            packId: selectedPack
        },
        customer: {
            email: user.primaryEmailAddress?.emailAddress || '',
        },
        settings: {
            displayMode: 'overlay',
            theme: 'dark',
            successUrl: `${window.location.origin}/dashboard?payment=success&pack=${selectedPack}`
        }
      });
      // Paddle overlay opens, we don't close modal immediately unless success event
      // But redirect is set in successUrl
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Payment initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 uppercase tracking-widest">
                  Credit Top-up
                </span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Fuel Your Cloud Engine</h2>
              <p className="text-slate-400 mt-2 font-medium">Select a credit package to continue building and auditing.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                onClick={() => setSelectedPack(pack.id)}
                className={cn(
                  "relative group cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 flex flex-col",
                  selectedPack === pack.id
                    ? "bg-slate-800 border-brand-500 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                    Best Value
                  </div>
                )}

                <div className={cn(
                  "w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br transition-transform group-hover:scale-110",
                  pack.color
                )}>
                  <Zap className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{pack.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-black text-white">{pack.credits}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Credits</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">
                  {pack.description}
                </p>

                <div className="text-xl font-black text-white border-t border-slate-800 pt-4 group-hover:text-brand-400 transition-colors">
                  {pack.price}
                </div>

                <div className={cn(
                  "absolute bottom-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  selectedPack === pack.id ? "bg-brand-500 scale-100" : "bg-slate-800 scale-0"
                )}>
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
          </div>

          {/* Secure Note */}
          <div className="mt-8 p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-widest">Premium Security</p>
                <p className="text-xs text-slate-500">Processed by Stripe. 256-bit encrypted.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-30 grayscale">
              <CreditCard className="w-8 h-8" />
              <div className="text-[10px] font-bold uppercase tracking-tighter">Visa / MC / Amex</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between gap-6">
          <div className="hidden md:block">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Instant provisioning
            </p>
            <p className="text-xs text-slate-500">Credits available immediately after purchase.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 md:flex-initial"
            >
              Cancel
            </Button>
            <Button
              loading={loading}
              disabled={!selectedPack}
              onClick={handlePurchase}
              className="flex-1 md:min-w-[200px]"
            >
              Initialize Payment
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
