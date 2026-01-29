import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CodeArchitectAnimation = () => {
    const lines = [
        { text: 'resource "aws_vpc" "main" {', indent: 0, color: 'text-pink-400' },
        { text: 'cidr_block = "10.0.0.0/16"', indent: 2, color: 'text-slate-300' },
        { text: '}', indent: 0, color: 'text-slate-100' },
        { text: '', indent: 0, color: '' },
        { text: 'resource "aws_db_instance" "default" {', indent: 0, color: 'text-pink-400' },
        { text: 'allocated_storage = 20', indent: 2, color: 'text-slate-300' },
        { text: 'engine = "postgres"', indent: 2, color: 'text-green-400' },
        { text: '}', indent: 0, color: 'text-slate-100' },
        { text: '', indent: 0, color: '' },
        { text: 'resource "aws_s3_bucket" "data" {', indent: 0, color: 'text-pink-400' },
        { text: 'bucket = "prod-data-v1"', indent: 2, color: 'text-yellow-300' },
        { text: '}', indent: 0, color: 'text-slate-100' },
    ];

    return (
        <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-1.5 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></div>
            </div>
            <div className="mt-6 space-y-1">
                {lines.map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.3, duration: 0.3 }}
                        viewport={{ once: false, amount: 0.5 }}
                        className={`${line.color}`}
                        style={{ paddingLeft: `${line.indent * 0.5}rem` }}
                    >
                        {line.text}
                    </motion.div>
                ))}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: lines.length * 0.3, duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    className="w-2 h-4 bg-brand-500 ml-2 inline-block align-middle"
                />
            </div>
        </div>
    );
};

export default CodeArchitectAnimation;
