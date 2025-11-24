import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Ticket } from 'lucide-react';

const Tour = () => {
  const [allDates, setAllDates] = useState([]);
  const [visibleDates, setVisibleDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(3);

  useEffect(() => {
    // In development, Vite serves public folder at root. In production, we want to fetch from the shared public folder to allow editing without rebuilds.
    const isDev = import.meta.env.DEV;
    // When built, the app is served from /samjay/react/dist/ so fetching /samjay/react/public/data/ might be failing due to server config or path mapping.
    // Let's try a relative path that works for the built structure assuming standard serving.
    // If served at root/samjay/react/dist/index.html, 'data/tour-dates.json' would look for root/samjay/react/dist/data/tour-dates.json which exists.
    // BUT the user specifically wants to use the PUBLIC folder source.
    
    // Let's try a more robust path that works if the server is configured correctly for the public folder.
    // Note: accessing ../../../public from a browser URL isn't possible. The server must expose the public folder.
    // Assuming the webroot is /var/www/html/gabemade/public/
    // Then the URL to the public json is /samjay/react/public/data/tour-dates.json
    
    // Use the specified absolute URL for the JSON file
    const dataUrl = 'https://gabemade.it/samjay/new/json/tour-dates.json'; 
    
    fetch(`${dataUrl}?t=${new Date().getTime()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch shows');
        return res.json();
      })
      .then(data => {
        // Parse dates to ensure we only show upcoming ones
        // The format is MM-DD-YY (e.g., 12-03-25).
        // Standard new Date() in Chrome/Firefox usually parses "MM-DD-YY" correctly, but it's safer to parse manually or be robust.
        
        const parseDate = (dateStr) => {
           const parts = dateStr.split('-');
           if (parts.length === 3) {
              // Assuming MM-DD-YY
              // Month is 0-indexed in Date constructor
              return new Date(`20${parts[2]}`, parts[0] - 1, parts[1]);
           }
           return new Date(dateStr);
        };
        
        const sortedDates = data.sort((a, b) => parseDate(a.date) - parseDate(b.date));
        
        // Filter for future dates
        // Set "today" to beginning of day to include shows happening today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureDates = sortedDates.filter(d => parseDate(d.date) >= today);
        
        // Fallback: if filtering removes everything (e.g. parsing error), show all data to verify at least fetch works
        // But we want upcoming. 
        
        setAllDates(futureDates);
        setVisibleDates(futureDates.slice(0, 3));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading tour dates:', err);
        // Fallback or empty state
        setLoading(false);
      });
  }, []);

  const handleLoadMore = () => {
    const newCount = displayCount + 10;
    setDisplayCount(newCount);
    setVisibleDates(allDates.slice(0, newCount));
  };

  const formatDate = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(`20${parts[2]}`, parts[0] - 1, parts[1]);
    
    // Get month name
    const month = date.toLocaleString('default', { month: 'long' });
    // Get day number
    const day = date.getDate();
    
    // Add ordinal suffix
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${month} ${getOrdinal(day)}`;
  };

  if (loading) return <div className="py-24 text-center text-white font-mono">Loading dates...</div>;


  return (
    <section className="relative w-full bg-transparent py-24 px-6 md:px-12 lg:px-24">
      {/* Cinematic Gradient Overlay - Top down */}
      <div className="absolute inset-0 bg-gradient-to-b from-sam-black via-sam-black/60 to-transparent pointer-events-none z-0 h-[50vh]" />

      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-16 relative z-10">
        <h2 className="font-display text-5xl md:text-7xl uppercase text-white mb-4">
          Live <span className="text-sam-red">Dates</span>
        </h2>
        <p className="font-mono text-gray-400 max-w-md">
          Catch Sam Jay live on stage. {allDates.length} Upcoming Shows
        </p>
      </div>

      {/* Tour List */}
      <div className="max-w-7xl mx-auto space-y-4 relative z-10">
        {visibleDates.map((show, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-transparent hover:border-sam-red/50 hover:bg-white/5 transition-all duration-300"
          >
            {/* Gradient Border Line */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:via-sam-red/50 transition-colors duration-300" />
            {/* Date */}
            <div className="flex items-center gap-4 md:w-1/4 mb-2 md:mb-0">
              <Calendar className="w-5 h-5 text-sam-red" />
              <span className="font-display text-2xl tracking-wide uppercase">{formatDate(show.date)}</span>
            </div>

            {/* Location */}
            <div className="flex flex-col md:w-1/2 mb-4 md:mb-0">
              <span className="font-mono text-lg text-white group-hover:text-sam-red transition-colors">
                {show.city}
              </span>
              <span className="text-white/80 text-sm flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                {show.venue}
              </span>
            </div>

            {/* Button */}
            <div className="w-full md:w-auto">
              <a
                href={show.ticket_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-white text-black font-bold uppercase hover:bg-sam-red hover:text-white transition-colors"
              >
                <Ticket className="w-4 h-4" />
                Tickets
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleDates.length < allDates.length && (
        <div className="flex justify-center mt-12 relative z-10">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-transparent border border-sam-red text-sam-red font-bold uppercase tracking-wider hover:bg-sam-red hover:text-black transition-all duration-300"
          >
            Load More Dates
          </button>
        </div>
      )}
    </section>
  );
};

export default Tour;
