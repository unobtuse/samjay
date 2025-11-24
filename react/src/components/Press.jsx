import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';

const Press = () => {
  const [pressData, setPressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/samjay/api/press.php?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.items) {
          setPressData(data.items);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load press:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white text-center py-12">Loading press...</div>;
  if (pressData.length === 0) return null;

  return (
    <section className="relative w-full bg-sam-black py-24 px-6 md:px-12 lg:px-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="font-display text-5xl md:text-7xl uppercase text-white">
          In The <span className="text-sam-red">News</span>
        </h2>
      </div>

      <div className="grid gap-4 max-w-5xl mx-auto">
        {pressData.map((item, idx) => (
          <motion.a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group block p-6 border-l-2 border-white/10 hover:border-sam-red hover:bg-white/5 transition-all"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Thumbnail */}
              {item.image && (
                <div className="w-full md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-sm bg-gray-900">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <h3 className="font-display text-xl md:text-2xl text-white group-hover:text-sam-red transition-colors">
                    {item.source}
                  </h3>
                  <span className="font-mono text-xs text-gray-500">
                    {new Date(item.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <p className="font-sans text-gray-400 mt-2 text-lg group-hover:text-white transition-colors line-clamp-2">
                  {item.title}
                </p>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
};

export default Press;

