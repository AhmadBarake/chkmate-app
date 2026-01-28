import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Zap, ShoppingCart, History, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { getCreditBalance, getCreditHistory, CreditBalance as CreditBalanceType, CreditTransaction } from '../lib/api';
import Button from './Button';
import BuyCreditsModal from './BuyCreditsModal';
import { useToastActions } from '../context/ToastContext';

interface CreditBalanceProps {
  onBuyCredits?: () => void;
  className?: string;
  compact?: boolean;
}

export default function CreditBalance({ onBuyCredits, className, compact = false }: CreditBalanceProps) {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const toast = useToastActions();

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const data = await getCreditBalance();
      setBalance(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (newBalanceValue: number) => {
    // Legacy support or if we add modal back without redirect
    loadBalance(); 
    // Dispatch event to update other indicators
    window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: null }));
  };

  useEffect(() => {
    const handleUpdate = () => loadBalance();
    window.addEventListener('balanceUpdated', handleUpdate);
    return () => window.removeEventListener('balanceUpdated', handleUpdate);
  }, []);

  if (loading) {
    return (
      <div className={cn('bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-2xl h-32 animate-pulse', className)} />
    );
  }

  if (error || !balance) {
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={onBuyCredits}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors',
          className
        )}
      >
        <Coins className="w-4 h-4 text-yellow-400" />
        <span className="font-medium text-sm">{balance.balance}</span>
      </button>
    );
  }

  return (
    <>
      <div className={cn('bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/50 relative overflow-hidden group', className)}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-yellow-500/10 transition-colors" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 group-hover:scale-110 transition-transform">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Available Credits</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-white tracking-tight">{balance.balance.toLocaleString()}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBuyModalOpen(true)}
            className="shadow-lg shadow-brand-500/20"
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Top up
          </Button>
        </div>
 
        {/* Credit costs summary */}
        <div className="grid grid-cols-2 gap-3 pb-2">
          <div className="flex flex-col gap-1 bg-slate-950/40 border border-slate-800/50 rounded-xl px-4 py-3 group/item hover:border-brand-500/30 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Engine Usage</span>
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-slate-300">Generation</span>
               <span className="text-xs font-black text-brand-400">{balance.costs.GENERATION} cr</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 bg-slate-950/40 border border-slate-800/50 rounded-xl px-4 py-3 group/item hover:border-brand-500/30 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Analysis Cost</span>
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-slate-300">Audits</span>
               <span className="text-xs font-black text-brand-400">{balance.costs.AUDIT} cr</span>
            </div>
          </div>
        </div>
      </div>

      <BuyCreditsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// Mini credit indicator for navbar
export function CreditIndicator({ className }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
 
  useEffect(() => {
    const fetchBalance = () => {
      getCreditBalance()
        .then(data => setBalance(data.balance))
        .catch(() => setBalance(null));
    };

    fetchBalance();

    // Listen for balance updates from other components
    const handleUpdate = () => fetchBalance();
    window.addEventListener('balanceUpdated', handleUpdate);
    
    return () => window.removeEventListener('balanceUpdated', handleUpdate);
  }, []);
 
  if (balance === null) return null;
 
  const isLow = balance < 50;
 
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsBuyModalOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer',
          isLow 
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-brand-500/50',
          className
        )}
      >
        <div className={cn(
          "w-2 h-2 rounded-full",
          isLow ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
        )} />
        <Coins className="w-3.5 h-3.5" />
        <span>{balance.toLocaleString()} CR</span>
      </motion.button>

      <BuyCreditsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={(newVal) => {
          setBalance(newVal);
          window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: newVal }));
        }}
      />
    </>
  );
}

// Transaction history component
export function CreditHistory({ className }: { className?: string }) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreditHistory(20)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 bg-slate-800 rounded-lg" />
      ))}
    </div>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <History className="w-4 h-4" />
          Ledger History
        </h3>
        <span className="text-[10px] font-bold text-slate-600 uppercase">Last 20 entries</span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/20 border border-slate-800/50 rounded-2xl">
            <p className="text-slate-500 text-sm font-medium italic">No transactions recorded in the ledger yet.</p>
          </div>
        ) : (
          transactions.map(tx => (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              key={tx.id}
              className="flex items-center justify-between bg-slate-900/40 border border-slate-800/50 rounded-xl px-5 py-4 hover:border-slate-700 transition-colors group"
            >
              <div>
                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors capitalize">
                  {tx.description.replace('_', ' ')}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {tx.referenceId && (
                    <span className="text-[10px] text-slate-700 font-mono">#{tx.referenceId.substring(0, 8)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  'font-mono text-sm font-black',
                  tx.amount > 0 ? 'text-emerald-400' : 'text-slate-400'
                )}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Credits</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
