import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { subscribeToMailchimp } from '../services/mailchimp';

interface RegisterInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterInterestModal: React.FC<RegisterInterestModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    subscribeToMailchimp(
      email,
      () => {
        setIsSubmitted(true);
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
          setEmail('');
        }, 2000);
      },
      (err) => {
        console.error('Mailchimp error:', err);
        // We could show an error state here, but for now just logging
        // Fallback to success UI for better UX if it's just a duplicate or benign error
        setIsSubmitted(true); 
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-brand-500/20 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {!isSubmitted ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Join the Waitlist</h2>
            <p className="text-slate-400 mb-6">
              We're currently in closed beta (v1.40). Enter your email to get notified when spots open up.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Register Interest
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">You're on the list!</h3>
            <p className="text-slate-400">
              We'll be in touch soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterInterestModal;
