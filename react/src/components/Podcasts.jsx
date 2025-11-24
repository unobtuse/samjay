import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Music, Radio, ChevronLeft, ChevronRight } from 'lucide-react';

const Podcasts = () => {
  const [podcasts, setPodcasts] = useState([]);
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    // Fetch from local API instead of static JSON
    fetch(`./api/podcasts.php?q=sam%20jay&limit=50&t=${new Date().getTime()}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        // API returns { items: [...], ... }
        setPodcasts(data.items || []);
      })
      .catch(err => console.error('Failed to load podcasts:', err));
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -400 : 400;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Adjust scroll speed here
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  if (podcasts.length === 0) return null;

  return (
    <section className="relative w-full bg-transparent py-24 px-0 md:px-12 lg:px-24  overflow-hidden">
      <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <h2 className="font-display text-5xl md:text-7xl uppercase text-white">
          PODCAST <span className="text-sam-red">Appearances</span>
        </h2>
        
        {/* Desktop Navigation Buttons */}
        <div className="hidden md:flex gap-4 mb-2">
          <button 
            onClick={() => scroll('left')}
            className="p-3 border border-white/10 hover:border-sam-red/50 hover:bg-white/5 rounded-full transition-all group"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-3 border border-white/10 hover:border-sam-red/50 hover:bg-white/5 rounded-full transition-all group"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Horizontal Slider Container */}
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto pb-12  px-0 md:mx-0 md:px-0 custom-scrollbar scroll-smooth desktop-slider-mask cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-6 w-max items-start">
          {podcasts.map((pod, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group flex flex-col w-[300px] md:w-[400px] glass-card transition-all snap-start backdrop-blur-xl"
            >
              {/* Card Content */}
              <div className="w-full items-start gap-4 ">
                <img 
                  src={pod.image} 
                  alt={pod.show} 
                  draggable="false"
                  className="w-full mb-6object-cover flex-shrink-0 pointer-events-none" // Removed grayscale
                />
                
                <div className="flex-1 min-w-0 p-6">
                  <h3 className="font-bold text-white text-lg leading-tight mb-1 group-hover:text-sam-red transition-colors line-clamp-2">
                    {pod.show}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-2">{pod.title}</p>
                  <p className="text-xs font-mono text-gray-600">{pod.date}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 border-t border-white/5 divide-x divide-white/5">
                {pod.spotify_url ? (
                  <a 
                    href={pod.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase text-gray-400 hover:text-sam-red hover:bg-white/5 transition-colors"
                  >
                    <Music className="w-4 h-4" />
                    Spotify
                  </a>
                ) : (
                  <span className="flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase text-gray-600 cursor-not-allowed">
                    <Music className="w-4 h-4" />
                    Spotify
                  </span>
                )}
                
                {pod.apple_url ? (
                  <a 
                    href={pod.apple_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase text-gray-400 hover:text-sam-red hover:bg-white/5 transition-colors"
                  >
                    <Radio className="w-4 h-4" />
                    Apple
                  </a>
                ) : (
                  <a 
                    href={pod.link} // Fallback to generic link
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase text-gray-400 hover:text-sam-red hover:bg-white/5 transition-colors"
                  >
                    <Radio className="w-4 h-4" />
                    Link
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
    </section>
  );
};

export default Podcasts;
