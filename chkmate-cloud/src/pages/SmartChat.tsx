import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, AlertCircle, Bot, User, Loader2, ChevronDown, Check } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import Button from '../components/Button';
import { chatWithAI, ChatMessage } from '../services/geminiService';
import { fetchProjects, Project } from '../lib/api';
import { useToastActions } from '../context/ToastContext';
import { useAuth } from '@clerk/clerk-react';

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
}

export default function SmartChat() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const toast = useToastActions();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm your Chkmate Cloud Assistant. I can help you design infrastructure, review security, or optimize costs. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadProjects = async () => {
    try {
        if(!user) return;
        const token = await getToken();
        const data = await fetchProjects(token);
        setProjects(data);
    } catch (err) {
        console.error("Failed to load projects for context", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for API (exclude IDs and timestamps)
      const history = messages.map(({ role, content }) => ({ role, content }));
      
      const context = selectedProject ? {
        projectName: selectedProject.name,
      } : undefined;

      const responseText = await chatWithAI(history, input, context);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      toast.error("Failed to get response from AI");
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header with Context Selector */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20 text-brand-400">
             <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-50 flex items-center gap-2">
              Smart Chat
              <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Beta</span>
            </h1>
            <p className="text-xs text-slate-500">AI-powered infrastructure architect</p>
          </div>
        </div>

        <div className="relative">
           <button 
             onClick={() => setIsContextOpen(!isContextOpen)}
             className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:border-slate-700 transition-colors"
           >
             <span className="text-slate-500">Context:</span>
             <span className="font-medium text-slate-50 max-w-[150px] truncate">
               {selectedProject ? selectedProject.name : "Global (No Project)"}
             </span>
             <ChevronDown className="w-4 h-4 text-slate-500" />
           </button>

           <AnimatePresence>
             {isContextOpen && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
               >
                 <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => { setSelectedProject(null); setIsContextOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                    >
                      <span className="text-slate-300">Global (No Project)</span>
                      {!selectedProject && <Check className="w-4 h-4 text-brand-500" />}
                    </button>
                    <div className="h-[1px] bg-slate-800 my-1" />
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProject(p); setIsContextOpen(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                      >
                        <span className="text-slate-300 truncate">{p.name}</span>
                        {selectedProject?.id === p.id && <Check className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 overflow-y-auto custom-scrollbar mb-4 space-y-6">
         {messages.map((msg) => (
           <motion.div 
             key={msg.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
           >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'model' 
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' 
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                   msg.role === 'model'
                     ? 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
                     : 'bg-brand-600 text-white rounded-tr-none'
                 }`}>
                    {msg.content}
                 </div>
                 <span className="text-[10px] text-slate-600 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </div>
           </motion.div>
         ))}
         
         {loading && (
           <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                 <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
           </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative">
         <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your potential infrastructure..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-4 pr-14 py-4 min-h-[60px] max-h-[120px] text-sm focus:outline-none focus:border-brand-500/50 resize-none custom-scrollbar"
         />
         <div className="absolute right-2 bottom-2.5">
           <Button
             size="sm"
             onClick={handleSend}
             disabled={!input.trim() || loading}
             className="h-9 w-9 p-0 rounded-lg"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
           </Button>
         </div>
      </div>
    </div>
  );
}
