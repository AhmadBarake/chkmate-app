import React from 'react';
import { Link } from 'react-router-dom';
import { NAV_LINKS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-6 md:mb-0">
          <span className="text-2xl font-bold tracking-tighter text-white font-mono">
              chkmate<span className="text-gray-500">_</span>
          </span>
          <p className="text-gray-500 text-sm mt-2">© {new Date().getFullYear()} chkmate interactive. All rights reserved.</p>
        </div>

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 text-center md:text-left">
          <div className="space-x-6">
            {NAV_LINKS.map((link) => (
             <a key={link.name} href={link.href} className="text-gray-500 hover:text-white text-sm transition-colors">
               {link.name}
             </a>
            ))}
          </div>
          <div className="space-x-6 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-8">
            <Link to="/terms" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Terms</Link>
            <Link to="/privacy" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Privacy</Link>
            <Link to="/refund" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;