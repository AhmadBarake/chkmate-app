import React, { useEffect, useState } from 'react';
import { fetchTemplates } from '../lib/api';
import { FileCode, Clock, Folder, AlertCircle, ArrowRight, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SecurityBadge, Severity } from '../components/SecurityBadge';
import { staggerContainer, staggerItem } from '../lib/animations';
import { formatRelativeTime } from '../lib/utils';

import { useAuth, useUser } from '@clerk/clerk-react';

export default function Templates() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        if (!user) return;
        const token = await getToken();
        const data = await fetchTemplates(token);
        setTemplates(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, [user]);

  const getTemplateStatus = (t: any) => {
    const report = t.auditReports?.[0];
    if (!report) return null;
    
    if (report.criticalCount > 0) return { severity: 'CRITICAL' as Severity, count: report.criticalCount };
    if (report.highCount > 0) return { severity: 'HIGH' as Severity, count: report.highCount };
    if (report.mediumCount > 0) return { severity: 'MEDIUM' as Severity, count: report.mediumCount };
    if (report.lowCount > 0) return { severity: 'LOW' as Severity, count: report.lowCount };
    
    return { severity: 'SECURE' as Severity, count: 0 };
  };

  if (loading) return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
        <div className="w-48 h-8 bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
             <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white">Infrastructure Blueprints</h2>
            <p className="text-slate-500 mt-1 font-medium capitalize">Global repository of your architectural designs.</p>
          </div>
        </div>
      </header>

      {templates.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl">
          <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest">No blueprints detected in the archives.</p>
        </div>
      ) : (
        <motion.div
           variants={staggerContainer}
           initial="initial"
           animate="animate"
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {templates.map((t) => {
            const status = getTemplateStatus(t);
            return (
              <motion.div key={t.id} variants={staggerItem}>
                <Link to={`/projects/${t.projectId}/templates/${t.id}`} className="block group h-full">
                  <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl hover:border-brand-500/30 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-500/10 transition-colors" />
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                               <FileCode className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 uppercase font-black tracking-widest border border-slate-800">
                                  {t.provider}
                               </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           {status && <SecurityBadge severity={status.severity} />}
                           <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                               <Clock className="w-3 h-3"/>
                               {formatRelativeTime(t.createdAt)}
                           </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-extrabold mb-4 group-hover:text-brand-400 transition-colors truncate">
                      {t.name}
                    </h3>

                    <div className="mt-auto space-y-4">
                      {t.project && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 group-hover:border-brand-500/20 transition-colors">
                           <Folder className="w-3.5 h-3.5 text-brand-500/50" />
                           <span className="uppercase tracking-widest truncate">{t.project.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600 pl-1 pt-2">
                         <span>Workspace Environment</span>
                         <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-brand-400 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
