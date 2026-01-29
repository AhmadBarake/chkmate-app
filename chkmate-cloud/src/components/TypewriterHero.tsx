import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, DollarSign, Check, ChevronRight, Server, Globe, Database, HardDrive } from 'lucide-react';

const examples = [
    {
        prompt: "Scalable ECS cluster, 2 AZs, ALB, and RDS Postgres.",
        cost: "$142/mo",
        time: "1.2s",
        resourceType: "aws_ecs_cluster",
        code: [
            { text: 'module "ecs_cluster" {', color: "text-pink-400" },
            { text: '  source  = "terraform-aws-modules/ecs/aws"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '  version = "~> 5.0"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '', color: "" },
            { text: '  cluster_name = "prod-cluster"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '  fargate_capacity_providers = {', color: "text-slate-400" },
            { text: '    FARGATE = {}', color: "text-slate-400" },
            { text: '  }', color: "text-slate-100" },
            { text: '}', color: "text-slate-100" }
        ]
    },
    {
        prompt: "GCP Cloud Run service with Cloud SQL and Redis.",
        cost: "$85/mo",
        time: "0.9s",
        resourceType: "google_cloud_run_service",
        code: [
            { text: 'resource "google_cloud_run_service" "app" {', color: "text-pink-400" },
            { text: '  name     = "main-service"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '  location = "us-central1"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '', color: "" },
            { text: '  template {', color: "text-slate-100" },
            { text: '    spec {', color: "text-slate-100" },
            { text: '      containers {', color: "text-slate-100" },
            { text: '        image = "gcr.io/proj/app:latest"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '      }', color: "text-slate-100" },
            { text: '    }', color: "text-slate-100" },
            { text: '  }', color: "text-slate-100" },
            { text: '}', color: "text-slate-100" }
        ]
    },
    {
        prompt: "S3 bucket with versioning and public access block.",
        cost: "$2.50/mo",
        time: "0.4s",
        resourceType: "aws_s3_bucket",
        code: [
            { text: 'module "s3_bucket" {', color: "text-pink-400" },
            { text: '  source = "terraform-aws-modules/s3-bucket/aws"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '', color: "" },
            { text: '  bucket = "secure-assets-prod"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '  acl    = "private"', color: "text-slate-400", highlight: "text-green-400" },
            { text: '', color: "" },
            { text: '  versioning = {', color: "text-slate-100" },
            { text: '    enabled = true', color: "text-slate-400", highlight: "text-yellow-300" },
            { text: '  }', color: "text-slate-100" },
            { text: '}', color: "text-slate-100" }
        ]
    }
];

const TypewriterHero = () => {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  const currentExample = examples[exampleIndex];

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    let resetTimeout: NodeJS.Timeout;

    const animate = async () => {
      // 1. Reset
      setDisplayText("");
      setShowResult(false);
      setIsTyping(true);

      // 2. Type
      let charIndex = 0;
      const typeChar = () => {
        if (charIndex <= currentExample.prompt.length) {
          setDisplayText(currentExample.prompt.slice(0, charIndex));
          charIndex++;
          // Varied typing speed for realism
          typingTimeout = setTimeout(typeChar, 30 + Math.random() * 40);
        } else {
            // Typing done
            setIsTyping(false);
            // Wait a bit then show result
            setTimeout(() => {
                setShowResult(true);
                // Hold result then switch to next example
                resetTimeout = setTimeout(() => {
                    setExampleIndex((prev) => (prev + 1) % examples.length);
                }, 4000); // How long to show the result
            }, 500);
        }
      };
      
      typeChar();
    };

    animate();

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(resetTimeout);
    };
  }, [exampleIndex]); // Re-run when index changes

  return (
    <div className="w-full max-w-6xl mx-auto relative perspective-1000">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center h-[380px]">
        
        {/* Input Card (User) */}
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-4 w-full h-[280px] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-2xl flex flex-col relative z-20"
        >
            <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                User Intent
            </div>
            
            <div className="font-mono text-base md:text-lg text-slate-100 leading-normal mb-6 flex-1">
                <span className="text-brand-400 mr-2">{'>'}</span>
                {displayText}
                {isTyping && (
                    <span className="inline-block w-2.5 h-5 ml-1 bg-brand-400 animate-pulse align-middle" />
                )}
            </div>

             <div className="flex items-center gap-2 mt-auto">
                 <div className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">Plain English</div>
                 <div className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">NLP</div>
             </div>
        </motion.div>


        {/* Output Card (System) */}
            <div className="lg:col-span-8 relative w-full h-[380px]">
         <AnimatePresence mode='wait'>
            {showResult ? (
                <motion.div 
                    key={exampleIndex} // Re-animate on change
                    initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full h-full bg-slate-950/90 backdrop-blur-xl border border-brand-500/30 rounded-3xl p-0 shadow-2xl overflow-hidden relative z-10 flex flex-col"
                >
                    {/* Header */}
                    <div className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-700" />
                            <div className="w-3 h-3 rounded-full bg-slate-700" />
                            <div className="w-3 h-3 rounded-full bg-slate-700" />
                        </div>
                        <div className="text-xs font-mono text-slate-500">main.tf</div>
                    </div>

                    {/* Code Content */}
                    <div className="p-6 font-mono text-xs overflow-hidden relative flex-1">
                        <div className="absolute top-6 right-6 z-20">
                             <motion.div 
                                initial={{ scale: 0.8, opacity: 0, y: -10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-md"
                             >
                                <DollarSign size={14} />
                                <span className="font-bold text-sm">{currentExample.cost}</span>
                            </motion.div>
                        </div>
                        
                        <div className="space-y-1.5 text-slate-300">
                             {currentExample.code.map((line, idx) => (
                                 <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + idx * 0.05 }}
                                    className={line.color}
                                >
                                    {/* Simple highlighting logic for demo purposes */}
                                     {line.highlight ? (
                                         <>
                                            {line.text.split('=').map((part, i, arr) => (
                                                <span key={i}>
                                                    {part}
                                                    {i < arr.length -1 && ' = '}
                                                </span>
                                            ))}
                                            {/* Not perfect parsing but works for these static snippets if needed, 
                                                actually let's just use the hardcoded text for now or simple replace.
                                                Simpler approach: just render text, color whole line or specific spans if refined.
                                                For now standard rendering with the class passed.
                                            */}
                                            {line.text} 
                                         </>
                                     ) : (
                                         line.text
                                     )}
                                </motion.div>
                             ))}
                        </div>
                    </div>
                    
                    {/* Status Bar */}
                     <div className="bg-slate-900 border-t border-slate-800 p-3 px-6 flex items-center justify-between text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-4">
                             <span className="flex items-center gap-1.5 text-emerald-400"><Check size={12} /> Valid HCL</span>
                             <span className="flex items-center gap-1.5"><Server size={12} /> {currentExample.resourceType}</span>
                        </div>
                        <div>Generated in {currentExample.time}</div>
                     </div>
                </motion.div>
            ) : (
                 <div className="w-full h-full flex items-center justify-center border border-slate-800/50 rounded-3xl bg-slate-900/20">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                         <div className="w-12 h-12 rounded-full border-2 border-slate-600 border-t-brand-500 animate-spin" />
                         <span className="font-mono text-sm text-slate-400">Architecting...</span>
                    </div>
                 </div>
            )}
         </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

export default TypewriterHero;
