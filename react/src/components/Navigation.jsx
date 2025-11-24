import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';

const navLinks = [
  { name: "Specials", href: "#hero" },
  { name: "Live", href: "#tour" },
  { name: "Clips", href: "#videos" },
  { name: "Press", href: "#press" },
  { name: "Contact", href: "#footer" },
];

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled || mobileOpen ? 'bg-sam-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo (Helvetica Condensed Style) */}
        <a href="#" className="font-logo font-black tracking-tighter text-2xl md:text-3xl text-white uppercase scale-y-110">
          <img src="./new/assets/logos/sam-jay-logo-darkmode.svg" className="w-12h-12" alt="Sam Jay" />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              className="font-mono text-sm text-gray-400 hover:text-sam-red transition-colors uppercase tracking-widest"
            >
              {link.name}
            </a>
          ))}
          {/* social links */}
        <a href="https://www.instagram.com/samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://x.com/SamJayComic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://www.facebook.com/samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.youtube.com/@samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://www.imdb.com/name/nm7615637/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors font-black text-lg leading-none" title="IMDb">
              <img src="./new/assets/logos/imdb.svg" className="w-6 h-6" />
            </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute text-center top-full left-0 w-full bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl py-8 px-6 flex flex-col items-center gap-6 md:hidden"
          >
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-display font-black text-3xl text-center text-white hover:text-sam-red uppercase"
              >
                {link.name}
              </a>
            ))}
            
            <div className="flex items-center gap-6 mt-4 pt-6 w-full justify-center">
              <a href="https://www.instagram.com/samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://x.com/SamJayComic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="https://www.facebook.com/samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://www.youtube.com/@samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors">
                <Youtube className="w-6 h-6" />
              </a>
              <a href="https://www.imdb.com/name/nm7615637/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors font-black text-xl leading-none" title="IMDb">
                 <img src="./new/assets/logos/imdb.svg" className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
