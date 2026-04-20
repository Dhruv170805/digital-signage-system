import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const DisplayScreen = () => {
  const [schedule, setSchedule] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ticker, setTicker] = useState({ text: "Welcome to Digital Signage System!", speed: 5 });

  useEffect(() => {
    fetchActiveSchedule();
    fetchTicker();
    const interval = setInterval(fetchActiveSchedule, 60000); // Refresh schedule every minute

    const socket = io('http://localhost:5005');
    socket.on('contentUpdate', () => fetchActiveSchedule());
    socket.on('tickerUpdate', (text) => setTicker(prev => ({ ...prev, text })));
    socket.on('tickerSpeedUpdate', (speed) => setTicker(prev => ({ ...prev, speed })));

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const fetchActiveSchedule = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/schedule/active');
      setSchedule(res.data);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
    }
  };

  const fetchTicker = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/ticker');
      setTicker(res.data);
    } catch (err) {
      console.error("Failed to fetch ticker", err);
    }
  };

  useEffect(() => {
    if (schedule.length > 0) {
      const currentItem = schedule[currentIndex];
      const timer = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % schedule.length);
      }, (currentItem?.duration || 10) * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, schedule]);

  const currentContent = schedule[currentIndex];
  const layout = currentContent?.layout ? JSON.parse(currentContent.layout) : null;
  
  // Default layout if none provided
  const mediaZone = layout?.find(z => z.id === 'media') || { x: 0, y: 0, w: 100, h: 100 };
  const tickerZone = layout?.find(z => z.id === 'ticker') || { x: 0, y: 90, w: 100, h: 10 };

  return (
    <div className="fixed inset-0 bg-[#020617] overflow-hidden text-slate-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#020617_100%)] opacity-50" />
      
      {!currentContent ? (
        <div className="relative w-full h-full flex items-center justify-center text-center z-10">
          <div className="glass-effect p-12 rounded-3xl border border-white/10 shadow-2xl">
            <div className="text-6xl font-black gradient-text animate-pulse mb-6">NEXUS</div>
            <div className="text-2xl font-medium text-slate-400">Waiting for Broadcast...</div>
            <p className="text-slate-500 mt-2">Connect to the control plane to start streaming.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Media Zone */}
          <div 
            className="absolute flex items-center justify-center overflow-hidden z-0"
            style={{
              left: `${mediaZone.x}%`,
              top: `${mediaZone.y}%`,
              width: `${mediaZone.w}%`,
              height: `${mediaZone.h}%`,
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {currentContent.fileType === 'image' ? (
              <img 
                src={`http://localhost:5005/${currentContent.filePath}`} 
                alt="Signage" 
                className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <iframe 
                src={`http://localhost:5005/${currentContent.filePath}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full border-none"
                title="PDF Content"
              />
            )}
          </div>

          {/* Ticker Zone */}
          <div 
            className="absolute bg-white/5 backdrop-blur-xl flex items-center overflow-hidden border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20"
            style={{
              left: `${tickerZone.x}%`,
              top: `${tickerZone.y}%`,
              width: `${tickerZone.w}%`,
              height: `${tickerZone.h}%`,
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div className="absolute left-0 h-full w-24 bg-gradient-to-r from-[#020617] to-transparent z-30" />
            <div className="absolute right-0 h-full w-24 bg-gradient-to-l from-[#020617] to-transparent z-30" />
            
            <div 
              className="whitespace-nowrap animate-marquee text-3xl font-black tracking-wide text-white/90 px-12"
              style={{ animationDuration: `${30 - (ticker.speed || 5)}s` }}
            >
              <span className="gradient-text mx-8">LATEST UPDATES</span>
              {ticker.text} — {ticker.text} — {ticker.text}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DisplayScreen;
