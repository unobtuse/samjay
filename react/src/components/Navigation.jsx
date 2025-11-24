import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { SiTiktok, SiImdb } from 'react-icons/si';

const navLinks = [
  { name: "Specials", href: "#hero" },
  { name: "Live", href: "#tour" },
  { name: "Clips", href: "#videos" },
  { name: "Press", href: "#press" },
  { name: "Booking", href: "mailto:KBaker@avalon-usa.com?subject=Sam JayBooking Request" },
];

const Navigation = ({ mobileOpen, setMobileOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 w-full transition-all duration-300 ${
        mobileOpen ? 'z-[100]' : 'z-50'
      } ${
        isScrolled ? 'bg-sam-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo (Helvetica Condensed Style) */}
        <a href="#top" className="font-logo font-black tracking-tighter text-2xl md:text-3xl text-white uppercase scale-y-110">
          <img src="./new/assets/logos/sam-jay-logo-darkmode.svg" className="h-6" alt="Sam Jay" />
        </a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-4">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              className="font-mono text-sm text-white hover:text-sam-red transition-colors uppercase tracking-widest"
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
            <a href="https://www.tiktok.com/@samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors" title="TikTok">
              <SiTiktok className="w-5 h-5" />
            </a>
            <a href="https://www.imdb.com/name/nm7615637/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors" title="IMDb">
              <SiImdb className="w-5 h-5" />
            </a>
         <a href="https://punchup.live/samjay" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors font-black text-lg leading-none hover:!fill-sam-red" title="PUNCHUP">
              <img src="./new/assets/logos/punchup.svg" className="h-3" />
            </a>  </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-white relative z-[110]"
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
            className="fixed top-0 left-0 w-full h-screen flex flex-col items-center justify-center gap-8 lg:hidden z-40 bg-black/20 pt-20"
          >
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-display font-black text-3xl text-center text-white hover:text-sam-red uppercase transition-all duration-300"
              >
                {link.name}
              </a>
            ))}
            
            <div className="flex items-center gap-6 mt-4 pt-6 w-full justify-center transition-all duration-300">
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
              <a href="https://www.tiktok.com/@samjaycomic" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors" title="TikTok">
                <SiTiktok className="w-6 h-6" />
              </a>
              <a href="https://www.imdb.com/name/nm7615637/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors" title="IMDb">
                <SiImdb className="w-6 h-6" />
              </a>
               <a href="https://punchup.live/samjay" target="_blank" rel="noopener noreferrer" className="text-white hover:text-sam-red transition-colors font-black text-lg leading-none hover:fill-sam-red" title="PUNCHUP">
              <img src="./new/assets/logos/punchup.svg" className="h-3" />
            </a> 
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navigation;
