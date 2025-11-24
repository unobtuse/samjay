import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ExternalLink, X } from 'lucide-react';

const Hero = () => {
  const [specials, setSpecials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPosterVisible, setIsPosterVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState('');
  
  const videoRef = useRef(null);
  const posterTimeoutRef = useRef(null);

  // Fetch data
  useEffect(() => {
    fetch('/samjay/new/json/specials.json')
      .then(res => res.json())
      .then(data => {
        setSpecials(data);
      })
      .catch(err => console.error("Failed to load specials:", err));
  }, []);

  // Handle slide change
  useEffect(() => {
    if (specials.length === 0) return;

    setIsPosterVisible(true);
    setProgress(0);
    
    // Reset video if it exists
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load(); // Force reload for new source
    }

    // Fade out poster after 3 seconds
    if (posterTimeoutRef.current) clearTimeout(posterTimeoutRef.current);
    posterTimeoutRef.current = setTimeout(() => {
      setIsPosterVisible(false);
      if (videoRef.current && !isModalOpen) {
        videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
      }
    }, 3000);

    return () => {
      if (posterTimeoutRef.current) clearTimeout(posterTimeoutRef.current);
    };
  }, [currentIndex, specials, isModalOpen]);

  // Pause background video when modal is open
  useEffect(() => {
    if (videoRef.current) {
      if (isModalOpen) {
        videoRef.current.pause();
      } else if (!isPosterVisible) {
        videoRef.current.play().catch(e => console.log("Resume prevented:", e));
      }
    }
  }, [isModalOpen, isPosterVisible]);

  const handleVideoUpdate = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const handleVideoEnded = () => {
    if (!isModalOpen) {
      nextSlide();
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % specials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + specials.length) % specials.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Swipe handlers
  const onDragEnd = (event, info) => {
    if (info.offset.x < -100) {
      nextSlide();
    } else if (info.offset.x > 100) {
      prevSlide();
    }
  };

  // Helper to get YouTube Embed URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1];
      const ampersandPosition = videoId.indexOf('&');
      if (ampersandPosition !== -1) {
        videoId = videoId.substring(0, ampersandPosition);
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  const openModal = (url) => {
    setCurrentTrailerUrl(getYoutubeEmbedUrl(url));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTrailerUrl('');
  };

  if (specials.length === 0) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  const currentSpecial = specials[currentIndex];

  // Helper for poster alignment styles
  const getPosterStyle = (special) => {
    const vAlign = special['poster-align-v'] || 'center';
    const hAlign = special['poster-align-h'] || 'center';
    
    return {
      objectPosition: `${vAlign} ${hAlign}`
    };
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentSpecial.id}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={onDragEnd}
        >
          {/* Video Background */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={currentSpecial.video}
            muted
            playsInline
            onTimeUpdate={handleVideoUpdate}
            onEnded={handleVideoEnded}
          />

          {/* Poster Overlay */}
          <motion.img
            src={currentSpecial.poster}
            alt={currentSpecial.title}
            className="absolute inset-0 w-full h-full object-cover z-10"
            style={getPosterStyle(currentSpecial)}
            initial={{ opacity: 1 }}
            animate={{ opacity: isPosterVisible ? 1 : 0 }}
            transition={{ duration: 1 }} // Fade duration
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-20" />

          {/* Content Info - Bottom Right */}
          <div className="absolute bottom-0 left-0 p-8 md:p-16 z-30 max-w-2xl w-full flex flex-col items-start text-left">
            
            {/* Logo */}
            {currentSpecial.logo && (
              <motion.img 
                src={currentSpecial.logo} 
                alt={currentSpecial.title}
                className="h-24 md:h-32 object-contain mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
            )}

            {/* Metadata */}
            <motion.div 
              className="flex items-center gap-2 text-sm md:text-base font-mono text-gray-300 mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span>{currentSpecial.year}</span>
              <span>•</span>
              <span>{currentSpecial['rating-or-duration']}</span>
              <span>•</span>
              <span>{currentSpecial.type}</span>
              <span>•</span>
              <span>{currentSpecial.genre}</span>
            </motion.div>

            {/* Description */}
            <motion.p 
              className="text-gray-200 text-sm md:text-lg mb-6 line-clamp-3 md:line-clamp-none"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {currentSpecial.description}
            </motion.p>

            {/* Buttons */}
            <motion.div 
              className="flex flex-wrap justify-start gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {currentSpecial.trailer && (
                <button 
                  onClick={() => openModal(currentSpecial.trailer)}
                  className="px-3 py-3 bg-sam-black/90 text-white font-bold border border-white uppercase tracking-wider hover:bg-white hover:text-black transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Trailer
                </button>
              )}
              
              {currentSpecial['watch-link'] && (
                <a 
                  href={currentSpecial['watch-link']} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-3 bg-sam-black/90 text-sam-red font-bold border border-sam-red uppercase tracking-wider hover:bg-sam-red hover:text-black transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Stream on {currentSpecial.network}
                </a>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute z-40 flex gap-3
        /* Mobile: Vertical, Right side, Centered vertically */
        flex-col right-4 top-1/2 -translate-y-1/2
        /* Desktop: Horizontal, Bottom Right */
        md:flex-row md:top-auto md:bottom-12 md:right-12 md:translate-y-0
      ">
        {specials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-sam-red scale-125' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800 z-50">
        <motion.div 
          className="h-full bg-sam-red"
          style={{ width: `${progress}%` }}
          transition={{ ease: "linear", duration: 0.1 }} // Smooth out small updates
        />
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <iframe 
                src={currentTrailerUrl} 
                title="Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hero;
