import React from 'react';
import { Loader2 } from 'lucide-react';

export default function CloudLoader({ message = "Analyzing Requirements...", subMessage = "Our AI is designing the optimal architecture..." }: { message?: string, subMessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-brand-400 animate-spin relative z-10" />
      </div>
      <h3 className="mt-8 text-xl font-semibold text-slate-50">{message}</h3>
      <p className="text-slate-400 mt-2 max-w-md">{subMessage}</p>
    </div>
  );
}
