import React from 'react';
import { 
  Shield, 
  User, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Key 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CloudScanResult, SecurityIssue, IAMDetails } from '../../lib/api';

interface IAMViewerProps {
  details: IAMDetails;
  issues: SecurityIssue[];
}

export function IAMViewer({ details, issues }: IAMViewerProps) {
  const [activeTab, setActiveTab] = React.useState<'users' | 'roles' | 'policies'>('users');

  // Helper to find issues for a resource
  const getIssuesFor = (id: string) => issues.filter(i => i.resourceId.includes(id));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">IAM Users</div>
            <div className="text-2xl font-bold">{details.users.length}</div>
          </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">IAM Roles</div>
            <div className="text-2xl font-bold">{details.roles.length}</div>
          </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Custom Policies</div>
            <div className="text-2xl font-bold">{details.policies.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'users' ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:text-slate-50"
            )}
          >
            <User className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'roles' ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:text-slate-50"
            )}
          >
            <Users className="w-4 h-4" /> Roles
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'policies' ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:text-slate-50"
            )}
          >
            <FileText className="w-4 h-4" /> Policies
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-4">
              {details.users.map((user, idx) => {
                const userIssues = getIssuesFor(user.userName);
                const daysSincePassword = user.passwordLastUsed 
                  ? Math.floor((Date.now() - new Date(user.passwordLastUsed).getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {user.userName}
                        {userIssues.length > 0 && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {userIssues.length} Issues
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                           <Clock className="w-3 h-3" /> Created: {new Date(user.createDate || '').toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                           <Key className="w-3 h-3" /> Pwd Used: {daysSincePassword !== null ? `${daysSincePassword} days ago` : 'Never/None'}
                        </span>
                      </div>
                      {/* Issues List for this User */}
                      {userIssues.length > 0 && (
                         <div className="mt-3 pl-4 border-l-2 border-red-500/30 space-y-1">
                             {userIssues.map((issue, i) => (
                                 <p key={i} className="text-xs text-red-300">{issue.issue}</p>
                             ))}
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {details.users.length === 0 && <p className="text-slate-500 text-center py-4">No users found.</p>}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
               {details.roles.map((role, idx) => (
                 <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h4 className="font-bold">{role.roleName}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Created: {new Date(role.createDate || '').toLocaleDateString()}
                    </p>
                 </div>
               ))}
               {details.roles.length === 0 && <p className="text-slate-500 text-center py-4">No roles found.</p>}
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4">
              {details.policies.map((pol, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                   <div>
                     <h4 className="font-bold">{pol.policyName}</h4>
                     {pol.policyName.includes('*') || pol.policyName.toLowerCase().includes('admin') ? (
                         <span className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" /> Broad Permissions Potentially
                         </span>
                     ) : null}
                   </div>
                   <div className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                      Attachments: {pol.attachmentCount || 0}
                   </div>
                </div>
              ))}
              {details.policies.length === 0 && <p className="text-slate-500 text-center py-4">No custom local policies found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
