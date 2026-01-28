import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface TemplateDiffProps {
    oldValue: string;
    newValue: string;
    diffData: {
        costDelta: number;
        securityDelta: {
            newViolations: any[];
            fixedViolations: any[];
            totalIssuesChange: number;
            scoreChange: number;
        };
    };
}

export const TemplateDiff: React.FC<TemplateDiffProps> = ({ oldValue, newValue, diffData }) => {
    const { costDelta, securityDelta } = diffData;

    return (
        <div className="flex flex-col gap-4 h-full overflow-hidden bg-slate-950 border border-slate-800 rounded-xl">
            {/* Diff Header / Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-800 bg-slate-900/50">
                {/* Cost Delta */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className={`p-2 rounded-full ${costDelta > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                        {costDelta > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Monthly Cost Change</div>
                        <div className={`text-lg font-bold ${costDelta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {costDelta >= 0 ? '+' : ''}${Math.abs(costDelta).toFixed(2)}/mo
                        </div>
                    </div>
                </div>

                {/* Security Change */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className={`p-2 rounded-full ${securityDelta.scoreChange < 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                        {securityDelta.scoreChange < 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Security Score Impact</div>
                        <div className={`text-lg font-bold ${securityDelta.scoreChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {securityDelta.scoreChange > 0 ? '+' : ''}{securityDelta.scoreChange.toFixed(0)} points
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Lists */}
            {(securityDelta.newViolations.length > 0 || securityDelta.fixedViolations.length > 0) && (
                <div className="px-4 py-2 flex gap-6 border-b border-slate-800 text-xs bg-slate-900/30">
                    {securityDelta.newViolations.length > 0 && (
                        <div className="flex-1">
                            <h4 className="text-red-400 font-bold mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" /> New Issues ({securityDelta.newViolations.reduce((acc, v) => acc + v.results.length, 0)})
                            </h4>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                                {securityDelta.newViolations.map((v, i) => (
                                    <div key={i} className="text-slate-400 leading-relaxed">
                                        • <span className="text-slate-200 font-medium">{v.policyName}</span>
                                        <div className="pl-3 text-[10px] text-slate-500 italic">
                                            Found in: {v.results.map((r: any) => r.resourceRef).join(', ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {securityDelta.fixedViolations.length > 0 && (
                        <div className="flex-1">
                            <h4 className="text-green-400 font-bold mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Issues Fixed ({securityDelta.fixedViolations.reduce((acc, v) => acc + v.results.length, 0)})
                            </h4>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                                {securityDelta.fixedViolations.map((v, i) => (
                                    <div key={i} className="text-slate-400 leading-relaxed">
                                        • <span className="text-slate-200 font-medium">{v.policyName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Diff Viewer */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950">
                <ReactDiffViewer
                    oldValue={oldValue}
                    newValue={newValue}
                    splitView={true}
                    useDarkTheme={true}
                    styles={{
                        variables: {
                            dark: {
                                diffViewerBackground: 'transparent',
                                addedBackground: 'rgba(16, 185, 129, 0.1)',
                                addedColor: '#10b981',
                                removedBackground: 'rgba(239, 68, 68, 0.1)',
                                removedColor: '#ef4444',
                                wordAddedBackground: 'rgba(16, 185, 129, 0.25)',
                                wordRemovedBackground: 'rgba(239, 68, 68, 0.25)',
                                gutterBackground: '#020617',
                                gutterColor: '#475569',
                                codeFoldGutterBackground: '#0f172a',
                                codeFoldBackground: '#020617',
                                emptyLineBackground: '#020617',
                            }
                        },
                        contentText: {
                           fontSize: '13px',
                           fontFamily: 'JetBrains Mono, Menlo, monospace',
                           lineHeight: '20px'
                        },
                        line: {
                           padding: '0 8px'
                        }
                    }}
                />
            </div>
        </div>
    );
};
