import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Code2, Layout, Database, File, ChevronLeft, ChevronRight, PenTool, Sparkles, CheckCircle, Shield, PanelRightOpen, PanelRightClose, GitCompare, Bot, Github, Loader2 } from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { TemplateDiff } from '../components/TemplateDiff';
import { generateTemplate, createTemplate, fetchTemplate, fetchTemplateDiff, DiffResult, CloudConnection, fetchConnections, fetchGitHubConnections, fetchTemplateRepoLinks, quickPushTemplateToGitHub, pushTemplateToGitHub as pushToGH, GitHubConnectionInfo, TemplateRepoLinkInfo } from '../lib/api';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '../lib/utils';
import { parseError } from '../lib/errors';
import { useToastActions } from '../context/ToastContext';
import { trackGenerationStarted,
  trackGenerationCompleted,
  trackGenerationFailed,
  trackTemplateSaved,
  trackTemplateDownloaded,
  trackProviderSelected,
  trackEvent,
  AnalyticsEvents,
} from '../lib/analytics';
import Button from '../components/Button';
import { SkeletonDiagram, SkeletonCode } from '../components/Skeleton';
import { fadeInUp } from '../lib/animations';
import AuditPanel from '../components/AuditPanel';
import AgenticPanel from '../components/AgenticPanel';

const PROVIDERS = [
  { id: 'aws', name: 'AWS', icon: '☁️', description: 'Amazon Web Services' },
  { id: 'azure', name: 'Azure', icon: '🔷', description: 'Microsoft Azure' },
  { id: 'gcp', name: 'GCP', icon: '🌐', description: 'Google Cloud Platform' },
  { id: 'kubernetes', name: 'Kubernetes', icon: '⚓', description: 'Container Orchestration' },
];

type GenerationStage = 'idle' | 'analyzing' | 'designing' | 'generating' | 'complete';

const STAGE_MESSAGES: Record<GenerationStage, string> = {
  idle: '',
  analyzing: 'Analyzing your requirements...',
  designing: 'Designing architecture...',
  generating: 'Generating Terraform code...',
  complete: 'Generation complete!',
};

import { useUser, useAuth } from '@clerk/clerk-react';

export default function Builder() {
  const { projectId, templateId } = useParams();
  const navigate = useNavigate();
  const toast = useToastActions();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [step, setStep] = useState<'provider' | 'design' | 'review' | 'code'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [designPrompt, setDesignPrompt] = useState('');
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');
  const [generatedFiles, setGeneratedFiles] = useState<{ [key: string]: string }>({});
  const [selectedFile, setSelectedFile] = useState('main.tf');
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showAgenticPanel, setShowAgenticPanel] = useState(false);
  const [originalFiles, setOriginalFiles] = useState<{ [key: string]: string }>({});
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState<DiffResult | null>(null);
  const [comparing, setComparing] = useState(false);

  // GitHub state
  const [ghConnections, setGhConnections] = useState<GitHubConnectionInfo[]>([]);
  const [ghRepoLinks, setGhRepoLinks] = useState<TemplateRepoLinkInfo[]>([]);
  const [pushingToGH, setPushingToGH] = useState(false);

  // ReactFlow State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load connections
  useEffect(() => {
    const loadConnections = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        // Since api.ts is updated, fetchConnections now accepts a token
        const data = await fetchConnections(token); 
        setConnections(data);
      } catch (e) {
        console.error("Failed to load connections", e);
      }
    };
    loadConnections();
  }, [user]);

  // Load GitHub connections
  useEffect(() => {
    const loadGH = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        const conns = await fetchGitHubConnections(token);
        setGhConnections(conns);
      } catch (e) {
        console.error('Failed to load GitHub connections', e);
      }
    };
    loadGH();
  }, [user]);

  // Load template repo links when editing
  useEffect(() => {
    const loadLinks = async () => {
      if (!templateId || !user) return;
      try {
        const token = await getToken();
        const links = await fetchTemplateRepoLinks(templateId, token);
        setGhRepoLinks(links);
      } catch (e) {
        console.error('Failed to load repo links', e);
      }
    };
    loadLinks();
  }, [templateId, user]);

  // Load template if editing
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId || !user) return;
      setLoadingTemplate(true);
      try {
        const token = await getToken();
        const template = await fetchTemplate(templateId, token);
        
        setSelectedProvider(template.provider);

        try {
          const content = JSON.parse(template.content);

          let loadedFiles = {};
          let loadedCost = null;
          let loadedDiagram = null;

          if (content.files) {
            loadedFiles = content.files;
            loadedCost = content.cost;
            loadedDiagram = content.diagram;
          } else {
            loadedFiles = content;
          }

          setGeneratedFiles(loadedFiles || {});
          setOriginalFiles(loadedFiles || {});
          setCostEstimate(loadedCost || null);

          if (loadedDiagram) {
            setNodes(loadedDiagram.nodes.map((n: any) => ({
              ...n,
              data: { label: n.label },
              style: {
                background: '#1e1e1e',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                width: 150,
              }
            })));
            setEdges(loadedDiagram.edges.map((e: any) => ({
              ...e,
              type: 'smoothstep',
              animated: true,
              style: { stroke: "#0ea5e9" },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#0ea5e9" }
            })));
          }

          setStep('review');
          toast.success('Template loaded successfully');
        } catch (e) {
          console.error("Failed to parse template content", e);
          toast.error('Failed to parse template content');
        }
      } catch (err) {
        const error = parseError(err);
        toast.error(error.message, 'Failed to load template');
      } finally {
        setLoadingTemplate(false);
      }
    };
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, user, setNodes, setEdges]);

  const simulateStages = async () => {
    setGenerationStage('analyzing');
    await new Promise(r => setTimeout(r, 800));
    setGenerationStage('designing');
    await new Promise(r => setTimeout(r, 1200));
    setGenerationStage('generating');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationStage('analyzing');

    // Track generation start
    trackGenerationStarted(selectedProvider, designPrompt.length);

    // Start stage simulation in parallel
    simulateStages();

    try {
      const token = await getToken();
      const data = await generateTemplate(designPrompt, selectedProvider, selectedConnectionId, token);

      setGenerationStage('complete');
      setGeneratedFiles(data.files);
      setCostEstimate(data.cost);

      if (data.diagram) {
        setNodes(data.diagram.nodes.map((n: any) => ({
          ...n,
          data: { label: n.label },
          style: {
            background: '#1e1e1e',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            width: 150,
          }
        })));
        setEdges(data.diagram.edges.map((e: any) => ({
          ...e,
          type: 'smoothstep',
          animated: true,
          style: { stroke: "#0ea5e9" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#0ea5e9" }
        })));
      }

      toast.success('Infrastructure generated successfully');

      // Track successful generation
      trackGenerationCompleted(
        selectedProvider,
        Object.keys(data.files).length,
        data.cost?.total
      );

      // Reset stage after brief delay
      setTimeout(() => {
        setGenerationStage('idle');
      }, 1500);

    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'Generation failed');
      setGenerationStage('idle');

      // Track generation failure
      trackGenerationFailed(selectedProvider, error.code, error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const name = prompt("Enter a name for this template:", "New Template");
    if (!name) return;

    setSaving(true);
    try {
      const compositeContent = {
        files: generatedFiles,
        cost: costEstimate,
        diagram: { nodes, edges }
      };
      const content = JSON.stringify(compositeContent);
      if (projectId) {
        const token = await getToken();
        // createTemplate now accepts token as 5th argument
        const template = await createTemplate(projectId, name, content, selectedProvider, token);
        toast.success('Template saved successfully');

        // Track template save
        trackTemplateSaved(template.id, selectedProvider, projectId);

        navigate(`/projects/${projectId}`);
      }
    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedFiles[selectedFile]], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Downloaded ${selectedFile}`);

    // Track template download
    trackTemplateDownloaded(templateId || 'new', selectedFile, selectedProvider);
  };

  const handlePushToGitHub = async () => {
    if (!templateId) {
      toast.info('Save your template first before pushing to GitHub');
      return;
    }
    if (ghConnections.length === 0) {
      toast.info('Connect your GitHub account first');
      navigate('/github');
      return;
    }
    setPushingToGH(true);
    try {
      const token = await getToken();
      const content = generatedFiles[selectedFile] || '';
      if (ghRepoLinks.length > 0) {
        // Push to linked repo
        const link = ghRepoLinks[0];
        await pushToGH(templateId, link.repoId, link.branch, link.filePath, content, token);
        toast.success(`Pushed to ${link.repo?.fullName || 'linked repo'}`);
      } else {
        // Quick push to first connection's default
        const conn = ghConnections[0];
        const result = await quickPushTemplateToGitHub(templateId, conn.id, content, token);
        toast.success(`Pushed to ${result.repoFullName}`);
        // Reload links
        const links = await fetchTemplateRepoLinks(templateId, token);
        setGhRepoLinks(links);
      }
    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'GitHub push failed');
    } finally {
      setPushingToGH(false);
    }
  };

  const handleToggleDiff = async () => {
    if (showDiff) {
      setShowDiff(false);
      return;
    }

    if (!templateId) {
      toast.info("Comparison is only available for existing templates");
      return;
    }

    setComparing(true);
    try {
      // For accurate comparison, we send the current content of the selected file
      // Note: Backend currently compares strings, so we could send the full set if needed
      const token = await getToken();
      const diff = await fetchTemplateDiff(templateId, generatedFiles[selectedFile], token);
      setDiffData(diff);
      setShowDiff(true);
    } catch (e) {
      const error = parseError(e);
      toast.error(error.message, 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setGeneratedFiles(prev => ({
        ...prev,
        [selectedFile]: value
      }));
    }
  };

  const hasGenerated = Object.keys(generatedFiles).length > 0;

  if (loadingTemplate) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col">
        <div className="flex gap-4 mb-4 border-b border-slate-800 pb-4 px-8">
          {['provider', 'design', 'review', 'code'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 px-3 py-1">
              <span className="w-6 h-6 rounded-full bg-slate-800 animate-pulse" />
              <span className="w-16 h-4 bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex-1 px-8 pb-8 grid grid-cols-2 gap-6">
          <SkeletonDiagram className="h-full" />
          <SkeletonCode lines={12} className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <style>{`.react-flow__attribution { display: none !important; }`}</style>

      {/* Stepper */}
      <div className="flex gap-4 mb-4 border-b border-slate-800 pb-2 px-4">
        {(['provider', 'design', 'review', 'code'] as const).map((s, i) => (
          <button
            key={s}
            className={cn(
              "capitalize font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors text-sm",
              step === s ? 'bg-slate-900/50 text-white' : 'text-slate-500 hover:text-slate-400',
              (s !== 'provider' && !selectedProvider) && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => {
              if (s === 'provider') setStep('provider');
              if (s === 'design' && selectedProvider) setStep('design');
              if (s === 'review' && hasGenerated) setStep('review');
              if (s === 'code' && hasGenerated) setStep('code');
            }}
          >
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-colors",
              step === s ? "bg-brand-500 text-white" :
              (s === 'provider' || (s === 'design' && selectedProvider) || hasGenerated) ? "bg-slate-700" : "bg-slate-900/50"
            )}>
              {i + 1}
            </span>
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden px-4 pb-4">
        <AnimatePresence mode="wait">
          {step === 'provider' && (
            <motion.div
              key="provider"
              className="max-w-4xl mx-auto h-full flex flex-col justify-center"
              {...fadeInUp}
            >
              <h2 className="text-2xl font-bold mb-2 text-center">Select Cloud Provider</h2>
              <p className="text-slate-400 text-center mb-8 text-sm">Choose the platform for your infrastructure</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROVIDERS.map(p => (
                  <motion.button
                    key={p.id}
                    onClick={() => {
                      setSelectedProvider(p.id);
                      trackProviderSelected(p.id);
                    }}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all group",
                      selectedProvider === p.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-900/30 hover:border-slate-700'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{p.icon}</div>
                    <div className="text-base font-bold">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{p.description}</div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  disabled={!selectedProvider}
                  onClick={() => setStep('design')}
                  size="lg"
                  variant="secondary"
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Next Step
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'design' && (
            <motion.div key="design" className="h-full flex gap-4" {...fadeInUp}>
              {/* Left Panel */}
              <div className="w-[30%] flex flex-col gap-4">
                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 flex-1 flex flex-col">
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-brand-400"/>
                    Describe Your Architecture
                  </h2>
                  <textarea
                    value={designPrompt}
                    onChange={(e) => setDesignPrompt(e.target.value)}
                    className="w-full flex-1 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm outline-none focus:border-brand-500 resize-none font-mono text-slate-300 placeholder:text-slate-600"
                    placeholder="Example: A scalable web application with load balancer, auto-scaling group, managed database, and CDN for static assets..."
                  />

                  {/* Connection Selector */}
                  {selectedProvider === 'aws' && connections.length > 0 && (
                     <div className="mt-4 border-t border-slate-800 pt-3">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                           Use Cloud Context
                        </label>
                        <select
                           value={selectedConnectionId}
                           onChange={(e) => setSelectedConnectionId(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-brand-500 outline-none"
                        >
                           <option value="">No Context (Start Fresh)</option>
                           {connections
                              .filter(c => c.provider === 'aws')
                              .map(c => (
                                 <option key={c.id} value={c.id}>
                                    {c.name} ({c._count?.resources || 0} resources)
                                 </option>
                              ))
                           }
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                           Select a connection to let AI see your existing VPCs, Subnets, and S3 Buckets.
                        </p>
                     </div>
                  )}

                  {/* Cloud Context Summary */}
                  {selectedConnectionId && (
                     <div className="mt-2 p-3 bg-brand-500/10 border border-brand-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
                           <Sparkles className="w-3 h-3" />
                           Active Context
                        </div>
                        {(() => {
                          const conn = connections.find(c => c.id === selectedConnectionId);
                          if (!conn) return null;
                          return (
                             <div className="space-y-1 text-xs text-slate-400">
                                <div className="flex justify-between">
                                   <span>Provider</span>
                                   <span className="text-slate-200 font-medium uppercase">{conn.provider}</span>
                                </div>
                                <div className="flex justify-between">
                                   <span>Resources</span>
                                   <span className="text-slate-200 font-medium">{conn._count?.resources || 0} discovered</span>
                                </div>
                                <div className="flex justify-between">
                                   <span>Last Sync</span>
                                   <span className="text-slate-200 font-medium">{conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleDateString() : 'Never'}</span>
                                </div>
                             </div>
                          );
                        })()}
                     </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={!designPrompt.trim() || generating}
                    loading={generating}
                    loadingText={STAGE_MESSAGES[generationStage]}
                    className="mt-4"
                    fullWidth
                    leftIcon={!generating && <Sparkles className="w-4 h-4" />}
                  >
                    Generate Design
                  </Button>
                </div>

                {hasGenerated && (
                  <Button
                    onClick={() => setStep('review')}
                    variant="secondary"
                    fullWidth
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Continue to Review
                  </Button>
                )}
              </div>

              {/* Right Panel - Diagram */}
              <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {generating ? (
                    <motion.div
                      key="loading"
                      className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Multi-stage loader */}
                      <div className="space-y-4 text-center">
                        <div className="relative w-16 h-16 mx-auto">
                          <div className="absolute inset-0 rounded-full border-2 border-brand-500/30" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
                          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-brand-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                        </div>

                        <motion.p
                          key={generationStage}
                          className="text-lg font-medium text-slate-300"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {STAGE_MESSAGES[generationStage]}
                        </motion.p>

                        {/* Stage indicators */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                          {(['analyzing', 'designing', 'generating'] as const).map((stage, i) => (
                            <div
                              key={stage}
                              className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                generationStage === stage ? "bg-brand-500" :
                                (['analyzing', 'designing', 'generating'].indexOf(generationStage) > i) ? "bg-brand-500/50" :
                                "bg-slate-700"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : generationStage === 'complete' ? (
                    <motion.div
                      key="complete"
                      className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        </motion.div>
                        <p className="text-lg font-medium text-emerald-400">Generation Complete!</p>
                      </div>
                    </motion.div>
                  ) : hasGenerated ? (
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      fitView
                    >
                      <Background color="#333" gap={16} />
                      <Controls />
                    </ReactFlow>
                  ) : (
                    <motion.div
                      key="empty"
                      className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-4"
                      {...fadeInUp}
                    >
                      <Layout className="w-16 h-16 opacity-20" />
                      <p className="text-center max-w-xs text-sm">
                        Describe your infrastructure above and click Generate to create an architecture diagram
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div key="review" className="h-full flex flex-col lg:grid lg:grid-cols-2 gap-4 overflow-hidden" {...fadeInUp}>
              <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-800 flex flex-col h-[50vh] lg:h-full">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Layout className="text-brand-400 w-4 h-4" /> Architecture Diagram
                </h3>
                <div className="flex-1 rounded-lg overflow-hidden border border-slate-800 bg-slate-950/50 relative">
                  <ReactFlow nodes={nodes} edges={edges} fitView>
                    <Background color="#333" gap={16} />
                  </ReactFlow>
                </div>
              </div>

              <div className="flex flex-col gap-4 h-full overflow-auto">
                <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-800 flex-1">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Database className="text-emerald-400 w-4 h-4" /> Cost Estimate
                  </h3>
                  <div className="space-y-2">
                    {costEstimate?.breakdown?.map((item: any, i: number) => (
                      <motion.div
                        key={i}
                        className="flex justify-between border-b border-slate-800 pb-2 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <span className="text-slate-400">{item.resource}</span>
                        <span className="font-mono text-slate-200">${item.cost}/mo</span>
                      </motion.div>
                    ))}
                    <div className="flex justify-between text-lg font-bold pt-3 text-white border-t border-slate-700 mt-2">
                      <span>Total Estimated</span>
                      <span className="text-emerald-400">${costEstimate?.total}/mo</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setStep('design')}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Design
                  </Button>
                  <Button variant="secondary" onClick={() => setStep('code')} rightIcon={<Code2 className="w-4 h-4" />}>
                    View Code
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'code' && (
            <motion.div key="code" className="h-full flex flex-col" {...fadeInUp}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Code2 className="text-blue-400 w-5 h-5" /> Generated Terraform
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep('review')}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    variant={showDiff ? 'secondary' : 'outline'}
                    onClick={handleToggleDiff}
                    loading={comparing}
                    leftIcon={<GitCompare className="w-4 h-4" />}
                  >
                    {showDiff ? 'Back to Editor' : 'Compare'}
                  </Button>
                  <Button
                    variant={showAuditPanel ? 'secondary' : 'outline'}
                    onClick={() => {
                      setShowAuditPanel(!showAuditPanel);
                      if (!showAuditPanel) setShowAgenticPanel(false);
                    }}
                    leftIcon={<Shield className="w-4 h-4" />}
                    rightIcon={showAuditPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  >
                    Security Audit
                  </Button>
                  <Button
                    variant={showAgenticPanel ? 'secondary' : 'outline'}
                    onClick={() => {
                      setShowAgenticPanel(!showAgenticPanel);
                      if (!showAgenticPanel) setShowAuditPanel(false);
                    }}
                    leftIcon={<Bot className="w-4 h-4" />}
                    rightIcon={showAgenticPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    className={showAgenticPanel ? '' : 'border-violet-500/30 text-violet-300 hover:bg-violet-500/10'}
                  >
                    Agent Fix
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={saving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save to Project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePushToGitHub}
                    loading={pushingToGH}
                    loadingText="Pushing..."
                    leftIcon={<Github className="w-4 h-4" />}
                    className="border-slate-700 hover:border-slate-500"
                  >
                    {ghRepoLinks.length > 0 ? 'Push to GitHub' : 'Push to GitHub'}
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex border border-slate-800 rounded-xl bg-slate-950 min-h-0 relative">
                {/* File Explorer */}
                <div className="w-48 border-r border-slate-800 bg-slate-950/50 p-3 flex-shrink-0">
                  <h3 className="font-bold text-slate-500 mb-3 text-[10px] uppercase tracking-wider px-2">Files</h3>
                  <div className="space-y-0.5">
                    {Object.keys(generatedFiles).map(file => (
                      <button
                        key={file}
                        onClick={() => setSelectedFile(file)}
                        className={cn(
                          "flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all",
                          selectedFile === file
                            ? "bg-brand-500/20 text-brand-300 font-medium"
                            : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                        )}
                      >
                        <File className="w-3.5 h-3.5" />
                        {file}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 min-w-0">
                  {showDiff && diffData ? (
                    <TemplateDiff
                      oldValue={originalFiles[selectedFile] || ''}
                      newValue={generatedFiles[selectedFile] || ''}
                      diffData={diffData}
                    />
                  ) : (
                    <Editor
                      height="100%"
                      defaultLanguage="hcl"
                      theme="chkmate-dark"
                      path={selectedFile}
                      value={generatedFiles[selectedFile]}
                      onChange={handleEditorChange}
                      onMount={(editor, monaco) => {
                        monaco.editor.defineTheme('chkmate-dark', {
                          base: 'vs-dark',
                          inherit: true,
                          rules: [],
                          colors: {
                            'editor.background': '#020617',
                            'editor.lineHighlightBackground': '#1e293b',
                            'editorCursor.foreground': '#38bdf8',
                            'editor.selectionBackground': '#0ea5e933',
                          }
                        });
                        monaco.editor.setTheme('chkmate-dark');
                      }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                    />
                  )}
                </div>

                {/* Audit Panel */}
                <AnimatePresence>
                  {showAuditPanel && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '400px', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-l border-slate-800 overflow-hidden flex-shrink-0 h-full absolute right-0 top-0 bottom-0 z-20 bg-slate-950 shadow-xl"
                      style={{ width: 400 }}
                    >
                      <AuditPanel
                        content={Object.values(generatedFiles).join('\n\n')}
                        provider={selectedProvider}
                        templateId={templateId}
                        onClose={() => setShowAuditPanel(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Agentic Panel */}
                <AnimatePresence>
                  {showAgenticPanel && templateId && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '420px', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-l border-violet-500/20 overflow-hidden flex-shrink-0 h-full absolute right-0 top-0 bottom-0 z-20 bg-slate-950 shadow-xl"
                      style={{ width: 420 }}
                    >
                      <AgenticPanel
                        content={Object.values(generatedFiles).join('\n\n')}
                        provider={selectedProvider}
                        templateId={templateId}
                        onContentUpdate={(newContent) => {
                          // Update the main.tf with agent changes
                          setGeneratedFiles(prev => ({ ...prev, 'main.tf': newContent }));
                        }}
                        onClose={() => setShowAgenticPanel(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
