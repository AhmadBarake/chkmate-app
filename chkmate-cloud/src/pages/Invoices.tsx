import React from 'react';
import { FileText, Plus, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

export default function Invoices() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-400" />
              Invoices
            </h1>
            <p className="text-slate-400 mt-1">
              Billing history and downloadable statements.
            </p>
         </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl border-dashed">
         <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 relative">
            <FileText className="w-8 h-8 text-slate-500" />
            <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center border border-slate-900">
               <Plus className="w-3 h-3 text-slate-50" />
            </div>
         </div>
         <h3 className="text-xl font-bold text-slate-50 mb-2">No Invoices Yet</h3>
         <p className="text-slate-400 max-w-sm text-center mb-8">
            You haven't been billed for any services yet. Once you upgrade or incur charges, your invoices will appear here.
         </p>
         
         <div className="flex gap-4">
             <Button
                variant="secondary"
                onClick={() => navigate('/pricing')}
             >
                View Plans
             </Button>
         </div>

         <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Secure Billing via Stripe</span>
         </div>
      </div>
    </div>
  );
}
