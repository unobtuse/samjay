import React from 'react';
import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Tour from './components/Tour';
import Videos from './components/Videos';
import Podcasts from './components/Podcasts';
import News from './components/News';
import InstagramFeed from './components/InstagramFeed';
import SplineBackground from './components/SplineBackground';

function App() {
  return (
    <main className="min-h-screen text-white selection:bg-sam-red selection:text-white relative">
      <SplineBackground />
      <Navigation />
      <div id="hero"><Hero /></div>
      <div id="tour"><Tour /></div>
      <div id="videos"><Videos /></div>
      <div id="podcasts"><Podcasts /></div>
      <div id="press"><News /></div>
      <div id="instagram"><InstagramFeed /></div>
      
      {/* Footer */}
      <footer id="footer" className="relative pt-32 pb-12 text-center font-mono text-gray-500 z-20 mt-[-1px]">
        {/* Background Fade */}
        <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left: Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-logo font-black tracking-tighter text-2xl text-white uppercase scale-y-110">
              <img src="/samjay/new/assets/logos/sam-jay-logo-darkmode.svg" className="w-12h-12 m-6" alt="Sam Jay" />
            </span>
            <span className="text-xs">© 2025 SAM JAY. ALL RIGHTS RESERVED.</span>
          </div>

          {/* Middle: Social Icons */}
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/samjaycomic" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sam-red transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://x.com/SamJayComic" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sam-red transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://www.facebook.com/samjaycomic" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sam-red transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.youtube.com/@samjaycomic" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sam-red transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://www.imdb.com/name/nm7615637/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sam-red transition-colors font-black text-lg leading-none" title="IMDb">
              IMDb
            </a>
          </div>

          {/* Right: Credits */}
          <a href="http://gabemade.it" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors group">
            Made by 
            <img src="https://gabemade.it/samjay/new/assets/images/gabemadeit-white-logo.svg" alt="Gabemade" className="h-4 opacity-70 group-hover:opacity-100 transition-opacity" /> 
            with ❤️
          </a>

        </div>
      </footer>
    </main>
  );
}

export default App;

