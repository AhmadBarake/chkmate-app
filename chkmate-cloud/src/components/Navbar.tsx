import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { NAV_LINKS } from '../constants';
import { useTheme } from '../context/ThemeContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    navigate(href);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
            <span className="text-2xl font-bold tracking-tighter text-slate-50 font-mono">
              chkmate<span className="text-gray-500">_</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-gray-300 hover:text-slate-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:tracking-wide cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
              
              <div className="flex items-center gap-4">
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>

              <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-lg text-slate-400 hover:text-slate-50 hover:bg-slate-800/50 transition-all"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <span
                className="ml-2 px-5 py-2 border border-white/20 text-slate-50/60 text-sm font-mono rounded-full cursor-default select-none pointer-events-none"
              >
                v1.41 (Closed Beta)
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-slate-50 hover:bg-gray-800 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-gray-300 hover:text-slate-50 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
              >
                {link.name}
              </a>
            ))}
             <SignedIn>
               <div className="px-3 py-2">
                 <UserButton afterSignOutUrl="/" />
               </div>
             </SignedIn>
             <button
               onClick={toggleTheme}
               className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-slate-50 rounded-md text-base font-medium"
             >
               {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
               {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
             </button>
             <div className="block w-full text-center mt-4 px-5 py-3 border border-white/20 text-slate-50/60 text-sm font-mono rounded-full cursor-default select-none pointer-events-none">
                v1.41 (Closed Beta)
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;