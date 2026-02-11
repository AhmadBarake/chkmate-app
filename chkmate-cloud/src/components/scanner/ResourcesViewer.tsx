import React from 'react';
import { 
  Database,
  Server,
  Code2,
  AlertTriangle,
  Radio,
  Share2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CloudScanResult } from '../../lib/api';

interface ResourcesViewerProps {
  results: CloudScanResult;
}

export function ResourcesViewer({ results }: ResourcesViewerProps) {
    const { lambdaIssues, dynamoDBIssues, elbIssues, eksIssues } = results;

    const hasLambda = (lambdaIssues?.length || 0) > 0;
    const hasDynamo = (dynamoDBIssues?.length || 0) > 0;
    const hasELB = (elbIssues?.length || 0) > 0;
    const hasEKS = (eksIssues?.length || 0) > 0;

    if (!hasLambda && !hasDynamo && !hasELB && !hasEKS) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Server className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No issues found in Lambda, DynamoDB, ELB, or EKS resources.</p>
                <p className="text-xs mt-1">(Or no resources detected in this region)</p>
            </div>
        );
    }

  return (
    <div className="space-y-8">
      
      {/* LAMBDA */}
      {hasLambda && (
          <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-slate-800 pb-2">
                  <Code2 className="w-5 h-5 text-orange-400" /> Lambda Functions
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                      {lambdaIssues?.length} Issues
                  </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lambdaIssues?.map((issue, idx) => (
                      <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-slate-200 text-sm truncate w-3/4" title={issue.functionName}>
                                  {issue.functionName}
                              </h4>
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">
                                  {issue.runtime}
                              </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{issue.issue}</p>
                          <div className="text-xs text-brand-400 bg-brand-500/10 p-2 rounded">
                              Fix: {issue.recommendation}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* DYNAMODB */}
      {hasDynamo && (
          <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-slate-800 pb-2">
                  <Database className="w-5 h-5 text-blue-400" /> DynamoDB Tables
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                      {dynamoDBIssues?.length} Issues
                  </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dynamoDBIssues?.map((issue, idx) => (
                      <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-slate-200 text-sm">{issue.tableName}</h4>
                              <AlertTriangle className={cn("w-4 h-4", 
                                  issue.severity === 'HIGH' ? "text-red-500" : "text-yellow-500"
                              )} />
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{issue.issue}</p>
                          <div className="text-xs text-slate-300">
                              {issue.recommendation}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ELB */}
      {hasELB && (
          <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-slate-800 pb-2">
                  <Share2 className="w-5 h-5 text-purple-400" /> Load Balancers
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                      {elbIssues?.length} Issues
                  </span>
              </h3>
              <div className="space-y-3">
                  {elbIssues?.map((issue, idx) => (
                      <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                          <div>
                              <h4 className="font-bold text-slate-200 text-sm">{issue.loadBalancerName}</h4>
                              <p className="text-xs text-slate-400">{issue.issue}</p>
                          </div>
                          <div className="text-xs text-right">
                              <span className={cn(
                                  "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                  issue.severity === 'HIGH' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                              )}>
                                  {issue.severity}
                              </span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* EKS */}
      {hasEKS && (
          <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-slate-800 pb-2">
                  <Radio className="w-5 h-5 text-emerald-400" /> EKS Clusters
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                      {eksIssues?.length} Issues
                  </span>
              </h3>
              {eksIssues?.map((issue, idx) => (
                   <div key={idx} className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                       <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                           <AlertTriangle className="w-4 h-4" /> {issue.clusterName}
                       </div>
                       <p className="text-sm text-red-200">{issue.issue}</p>
                       <p className="text-xs text-red-200/60 mt-1">Rec: {issue.recommendation}</p>
                   </div>
              ))}
          </div>
      )}

    </div>
  );
}
