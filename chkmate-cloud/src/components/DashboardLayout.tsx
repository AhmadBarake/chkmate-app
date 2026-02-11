import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useToastActions } from '../context/ToastContext';
import { useDashboardMode } from '../context/DashboardModeContext';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  Folder,
  FileText,
  FileCode,
  LogOut,
  Cloud,
  Server,
  Sparkles,
  Map,
  DollarSign,
  Bot,
  History,
  Rocket,
  KeyRound,
  BookOpen,
  Link,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { CreditIndicator } from './CreditBalance';
import { getAgenticMode, setAgenticMode } from '../lib/api';

// ── Sidebar section types ──────────────────────────────
interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// ── Full mode sections ─────────────────────────────────
const fullSections: NavSection[] = [
  {
    label: 'Plan',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
      { name: 'Projects', to: '/projects', icon: Folder },
      { name: 'Templates', to: '/templates', icon: FileCode },
      { name: 'Smart Advice', to: '/recommendations', icon: Sparkles },
    ],
  },
  {
    label: 'Deploy',
    items: [
      { name: 'Deployments', to: '/deploy', icon: Rocket },
      { name: 'Agent History', to: '/agent/sessions', icon: History },
      { name: 'Deploy Keys', to: '/deploy/credentials', icon: KeyRound },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { name: 'Cloud Scanner', to: '/cloud-scanner', icon: Cloud },
      { name: 'Visualize', to: '/infrastructure-map', icon: Map },
      { name: 'Cost Control', to: '/cost-control', icon: DollarSign },
    ],
  },
  {
    label: 'Connect',
    items: [
      { name: 'Connections', to: '/connections', icon: Server },
      { name: 'Invoices', to: '/invoices', icon: FileText },
    ],
  },
];

// ── Simplified mode sections ───────────────────────────
const simplifiedSections: NavSection[] = [
  {
    label: 'Quick Start',
    items: [
      { name: 'Overview', to: '/dashboard', icon: LayoutDashboard, exact: true },
      { name: 'Deploy App', to: '/simple/deploy', icon: Rocket },
      { name: 'Guides', to: '/simple/guides', icon: BookOpen },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'My Resources', to: '/simple/resources', icon: Monitor },
      { name: 'Cost Overview', to: '/simple/costs', icon: DollarSign },
      { name: 'Connections', to: '/connections', icon: Link },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Invoices', to: '/invoices', icon: FileText },
    ],
  },
];

export default function DashboardLayout() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToastActions();
  const { mode, setMode } = useDashboardMode();
  const [agenticEnabled, setAgenticEnabled] = useState(false);
  const [togglingAgentic, setTogglingAgentic] = useState(false);

  // Get user display info
  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const userAvatar = user?.imageUrl;

  // Load agentic mode status
  useEffect(() => {
    async function loadAgenticMode() {
      try {
        const token = await getToken();
        const result = await getAgenticMode(token);
        setAgenticEnabled(result.enabled);
      } catch {
        // Silently ignore - defaults to off
      }
    }
    if (user) loadAgenticMode();
  }, [user, getToken]);

  const handleToggleAgentic = async () => {
    setTogglingAgentic(true);
    try {
      const token = await getToken();
      const result = await setAgenticMode(!agenticEnabled, token);
      setAgenticEnabled(result.enabled);
      toast.success(result.enabled ? 'Agentic Automation enabled' : 'Agentic Automation disabled');
    } catch {
      toast.error('Failed to toggle Agentic mode');
    } finally {
      setTogglingAgentic(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const packId = params.get('pack');

    if (paymentStatus === 'success') {
      toast.success(`Complete! ${packId ? packId + ' pack' : 'Credits'} added to your balance.`);
      window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: null }));
      navigate(location.pathname, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment cancelled. No credits were deducted.');
      navigate(location.pathname, { replace: true });
    }
  }, [location, toast, navigate]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const sections = mode === 'full' ? fullSections : simplifiedSections;

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

        <nav className="flex-1 px-4 py-2 space-y-5 overflow-y-auto custom-scrollbar">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-2 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-slate-800/60" />
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
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
                    )} />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Agentic Mode Toggle — only in Full mode */}
        {mode === 'full' && (
          <div className="px-4 py-3 border-t border-slate-800/50">
            <button
              onClick={handleToggleAgentic}
              disabled={togglingAgentic}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm group',
                agenticEnabled
                  ? 'bg-violet-500/10 border border-violet-500/30 text-violet-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Bot className={clsx('w-4 h-4', agenticEnabled ? 'text-violet-400' : 'text-slate-500')} />
                <span className="font-medium">Agentic Mode</span>
              </div>
              <div
                className={clsx(
                  'w-8 h-[18px] rounded-full transition-colors relative',
                  agenticEnabled ? 'bg-violet-500' : 'bg-slate-700'
                )}
              >
                <div
                  className={clsx(
                    'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all shadow-sm',
                    agenticEnabled ? 'left-[15px]' : 'left-[2px]'
                  )}
                />
              </div>
            </button>
          </div>
        )}

        {/* Simplified mode: link to switch to Full */}
        {mode === 'simplified' && (
          <div className="px-4 py-3 border-t border-slate-800/50">
            <button
              onClick={() => setMode('full')}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-brand-400 hover:bg-brand-500/5 transition-all group"
            >
              <span className="font-medium">Switch to Full</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

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
              Overview
            </h1>
          </div>
          <div className="flex items-center gap-6">
            {/* Full/Simplified Toggle */}
            <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5">
              <button
                onClick={() => setMode('full')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
                  mode === 'full'
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                Full
              </button>
              <button
                onClick={() => {
                  setMode('simplified');
                  navigate('/dashboard');
                }}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
                  mode === 'simplified'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                Simple
              </button>
            </div>

            <div className="h-8 w-[1px] bg-slate-800 mx-2" />
            <CreditIndicator />
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account</span>
                <span className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">{userName}</span>
              </div>
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform border border-white/10"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform border border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {userInitials}
                </div>
              )}
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
