import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useToastActions } from '../context/ToastContext';
import { useClerk } from '@clerk/clerk-react';
import { LayoutDashboard, Folder, FileText, FileCode, LogOut, Box, Cloud, Server, Sparkles, Map, DollarSign } from 'lucide-react';
import clsx from 'clsx';
import { CreditIndicator } from './CreditBalance';

const navItems = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Projects', to: '/projects', icon: Folder },
  { name: 'Templates', to: '/templates', icon: FileCode },
  { name: 'Cloud Scanner', to: '/cloud-scanner', icon: Cloud },
  { name: 'Visualize', to: '/infrastructure-map', icon: Map },
  { name: 'Cost Control', to: '/cost-control', icon: DollarSign },
  { name: 'Connections', to: '/connections', icon: Server },
  { name: 'Smart Advice', to: '/recommendations', icon: Sparkles },
  { name: 'Invoices', to: '/invoices', icon: FileText },
];

export default function DashboardLayout() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToastActions();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const packId = params.get('pack');

    if (paymentStatus === 'success') {
      toast.success(`Complete! ${packId ? packId + ' pack' : 'Credits'} added to your balance.`);
      // Trigger balance refresh across components
      window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: null })); // null triggers re-fetch
      
      // Clean up URL
      navigate(location.pathname, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment cancelled. No credits were deducted.');
      navigate(location.pathname, { replace: true });
    }
  }, [location, toast, navigate]);

  const handleLogout = () => {
    signOut(() => navigate('/'));
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 flex flex-col bg-slate-950/80 backdrop-blur-xl z-20">
        <div className="p-6">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <h1 className="text-2xl font-bold tracking-tighter text-white font-mono flex items-center gap-1">
                chkmate<span className="text-brand-500 group-hover:animate-pulse">_</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-300 group relative overflow-hidden',
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 font-bold shadow-[0_0_20px_rgba(14,165,233,0.15)] border border-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                )
              }
            >
              <item.icon className={clsx(
                "w-4 h-4 transition-transform group-hover:scale-110",
                "group-[.isActive]:text-brand-400"
              )} />
              {item.name}
              <div className="absolute inset-y-0 left-0 w-1 bg-brand-500 opacity-0 group-[.isActive]:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent z-10 relative">
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            <h1 className="text-sm font-bold tracking-widest text-slate-400 uppercase">
              Operational Environment
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-slate-800 mx-2" />
            <CreditIndicator />
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account</span>
                <span className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">Admin User</span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform border border-white/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                AU
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <div className="max-w-7xl mx-auto p-8 min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
