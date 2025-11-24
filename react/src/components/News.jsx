import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const News = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9); // Start with 9 items (3 rows * 3 columns)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setVisibleCount(window.innerWidth < 768 ? 3 : 9);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Fetch from our custom PHP endpoint that scrapes OG tags
    fetch(`./api/fetch-news.php?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNewsData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load news:', err);
        setLoading(false);
      });
  }, []);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + (isMobile ? 3 : 9)); // Load 3 on mobile, 9 on desktop
  };

  if (loading) return <div className="text-white text-center py-12 font-mono">LOADING NEWS...</div>;
  if (newsData.length === 0) return null;

  return (
    <section className="relative w-full bg-transparent py-24 px-6 md:px-12 lg:px-24 ">
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="font-display text-5xl md:text-7xl uppercase text-white" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
          In The <span className="text-sam-red">News</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {newsData.slice(0, visibleCount).map((item, idx) => (
          <motion.a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group flex flex-col glass-card overflow-hidden hover:shadow-xl/30 hover:scale-105 hover:z-10 transition-all duration-500 h-auto self-start"
          >
            {/* Thumbnail Container */}
            <div className="relative w-full h-48 bg-gray-900 overflow-hidden">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/20 font-display text-4xl">
                  SAM JAY
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sam-red font-display text-sm tracking-wide uppercase">
                  {item.source}
                </span>
                <span className="text-gray-500 font-mono text-xs">
                  {item.date}
                </span>
              </div>
              
              <h3 className="text-white font-sans text-lg font-bold leading-tight mb-2 group-hover:text-sam-red transition-colors">
                {item.title}
              </h3>
            </div>
          </motion.a>
        ))}
      </div>

      {visibleCount < newsData.length && (
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-transparent border border-sam-red text-sam-red font-bold uppercase tracking-wider hover:bg-sam-red hover:text-black transition-all duration-300 cursor-pointer"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

export default News;
