import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';

// Helper to extract video ID from YouTube URL
const getYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const VideoModal = ({ isOpen, onClose, videoUrl }) => {
  const videoId = getYouTubeId(videoUrl);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="relative w-full max-w-5xl aspect-video bg-black/40 rounded-lg overflow-hidden shadow-2xl border border-white/10 backdrop-blur-xl "
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            {videoId && (
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="Video Player"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const VideoCard = ({ video, idx, onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoId = getYouTubeId(video.link);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      viewport={{ once: true }}
      transition={{ duration: 0.1 }}
      className="relative aspect-video overflow-hidden glass-card group cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-sam-red/20 hover:z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsVideoLoaded(false);
      }}
      onClick={() => onPlay(video.link)}
    >
      {/* Video Preview (only loads on hover) */}
      {isHovered && videoId && (
        <div className={`absolute inset-0 z-10 transition-opacity duration-700 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${videoId}`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full object-cover pointer-events-none scale-150"
            onLoad={() => setIsVideoLoaded(true)}
          />
        </div>
      )}

      {/* Static Content (Thumbnail + Overlay) - Always rendered behind, acting as placeholder */}
      <div className="absolute inset-0 z-0">
          {/* Thumbnail */}
          <img 
            src={video.img} 
            alt={video.title} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
          />
          
          {/* Overlay with Play Button */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center z-20 pointer-events-none">
            <div className="w-10 h-10 bg-sam-red/90 rounded-full flex items-center justify-center transition-transform">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>

          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none">
            <h3 className="font-mono text-sm md:text-sm text-white truncate">
              {video.title}
            </h3>
          </div>
      </div>
    </motion.div>
  );
};

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setVisibleCount(window.innerWidth < 768 ? 3 : 12);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch(`data/videos.json?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => setVideos(data))
      .catch(err => console.error('Failed to load videos:', err));
  }, []);

  if (videos.length === 0) return null;

  // Get unique categories and calculate counts
  const categoryCounts = videos.reduce((acc, video) => {
    const cat = video.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categories = ['All', ...new Set(videos.map(v => v.category).filter(Boolean))];

  // Filter videos based on active category
  // When 'All' is selected, videos are shown in their original order (assumed to be sorted by date)
  const filteredVideos = activeCategory === 'All' 
    ? videos
    : videos.filter(v => v.category === activeCategory);

  const visibleVideos = filteredVideos.slice(0, visibleCount);

  return (
    <section className="relative w-full bg-transparent py-24 px-6 md:px-12 lg:px-24  overflow-hidden">
      <div className="max-w-7xl mx-auto mb-12 flex flex-col items-start">
        <h2 className="font-display text-5xl md:text-7xl uppercase text-white mb-8">
          Sam Jay <span className="text-sam-red">Network</span>
        </h2>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = cat === 'All' ? videos.length : categoryCounts[cat];
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setVisibleCount(isMobile ? 3 : 12);
                }}
                className={`px-6 py-2 font-mono uppercase tracking-wider text-sm border transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-sam-red border-sam-red text-black font-black'
                    : 'bg-transparent border-white/20 text-white/60 hover:border-sam-red hover:text-white'
                }`}
              >
                {cat} <span className="ml-1 opacity-60 text-xs">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        {visibleVideos.map((video, idx) => (
          <VideoCard 
            key={`${video.link}-${idx}`} 
            video={video} 
            idx={idx} 
            onPlay={setSelectedVideo}
          />
        ))}
      </div>

      {visibleCount < filteredVideos.length && (
        <div className="w-full flex justify-center mt-12">
          <button
            onClick={() => setVisibleCount(prev => prev + (isMobile ? 3 : 12))}
            className="px-8 py-3 bg-transparent border border-sam-red text-sam-red font-bold uppercase tracking-wider hover:bg-sam-red hover:text-black transition-all duration-300 cursor-pointer"
          >
            Load More
          </button>
        </div>
      )}

      <VideoModal 
        isOpen={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
        videoUrl={selectedVideo || ''} 
      />
    </section>
  );
};

export default Videos;
