import React from 'react';
import { PARTNERS } from '../constants';

const Partners: React.FC = () => {
  return (
    <div className="py-10 bg-neutral-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-500 text-sm font-mono uppercase tracking-widest mb-6">Powered By Ecosystem Leaders</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale">
            {/* Using text representation for reliability, but styled to look like logos */}
            {PARTNERS.map((partner, index) => (
                <span key={index} className="text-lg md:text-xl font-bold text-gray-300 hover:text-slate-50 transition-colors cursor-default">
                    {partner}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Partners;