import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram as InstagramIcon } from 'lucide-react';

const InstagramFeed = () => {
  const [instaData, setInstaData] = useState(null);

  useEffect(() => {
    fetch(`data/instagram.json?t=${new Date().getTime()}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setInstaData(data))
      .catch(err => console.error('Failed to load instagram:', err));
  }, []);

  if (!instaData) return null;

  // Filter for images/videos that have a thumbnail
  const posts = instaData.posts.slice(0, 12); // Show first 12

  return (
    <section className="relative w-full bg-transparent pt-24 pb-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
        <h2 className="font-display text-5xl md:text-7xl uppercase text-white">
          Instagram <span className="text-sam-red">Feed</span>
        </h2>
        <a 
          href={`https://instagram.com/${instaData.username}`} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-gray-400 hover:text-white transition-colors"
        >
          <InstagramIcon className="w-5 h-5" />
          @{instaData.username}
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-8 max-w-7xl mx-auto px-4">
        {posts.map((post, idx) => {
          // Get up to 3 images for the fan effect
          const mediaItems = post.media || [];
          const images = mediaItems
            .map(m => m.thumbnail_url || m.url)
            .filter(Boolean)
            .slice(0, 3)
            .map(url => `./api/instagram-image.php?src=${encodeURIComponent(btoa(url))}`);
          
          if (images.length === 0) return null;

          return (
            <motion.a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              initial="initial"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true }}
              variants={{
                initial: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: idx * 0.1 } 
                }
              }}
              className="relative aspect-square group cursor-pointer z-0 hover:z-20"
              style={{ perspective: "1000px" }}
            >
              <div className="relative w-full h-full preserve-3d">
                {/* Fan Images (Background) */}
                {images.slice(1).map((img, i) => {
                  // Alternate directions for fan effect
                  const rotate = i % 2 === 0 ? 15 : 15;
                  const x = i % 2 === 0 ? 0 : 0;
                  const y = 0;
                  
                  return (
                    <motion.div
                      key={i}
                      variants={{
                        initial: { rotate: 0, x: 0, y: 0, opacity: 0, scale: 1 },
                        visible: { opacity: 0, scale: 1 },
                        hover: { 
                          rotate: rotate, 
                          x: x, 
                          y: y,
                          opacity: 1, 
                          scale: 1.5,
                          transition: { type: "spring", stiffness: 300, damping: 20 } 
                        }
                      }}
                      className="absolute inset-0 w-full h-full bg-gray-800 border border-white/10 shadow-xl"
                      style={{ 
                        zIndex: -1 - i,
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  );
                })}

                {/* Main Card */}
                <motion.div
                  style={{ transformOrigin: 'bottom center' }}
                  variants={{
                    hover: { 
                      y: 0,
                      scale: 1.5,
                      rotate: 12,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
                      transition: { type: "spring", stiffness: 400, damping: 30 }
                    }
                  }}
                  className="relative w-full h-full bg-black/40 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl"
                >
                  <img 
                    src={images[0]} 
                    alt={post.caption ? post.caption.substring(0, 50) : "Instagram Post"} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0  opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center ">
                    <InstagramIcon className="text-white w-10 h-10 drop-shadow-lg" />
                  </div>
                  
                  {/* Multiple Items Indicator */}
                  {images.length > 1 && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                        <span className="text-[10px] font-mono text-white">{images.length}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* View More Button */}
      <div className="flex justify-center mt-12">
        <a
          href={`https://instagram.com/${instaData.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 bg-transparent border border-sam-red text-sam-red font-bold uppercase tracking-wider hover:bg-sam-red hover:text-black transition-all duration-300 flex items-center gap-2"
        >
          <InstagramIcon className="w-5 h-5" />
          View More on Instagram
        </a>
      </div>
    </section>
  );
};

export default InstagramFeed;

