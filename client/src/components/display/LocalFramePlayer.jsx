import React, { useState, useEffect, useMemo } from 'react';
import FrameManager from './FrameManager';
import TickerEngine from './TickerEngine';
import { Radio } from 'lucide-react';

const LocalFramePlayer = ({ zone, frameItems, allMedia, tickers }) => {
  const [currentIndex, setCurrentIdx] = useState(0);

  // Normalize mapping items: handle both simple ID strings and complex config objects
  const items = useMemo(() => {
    return Array.isArray(frameItems) 
      ? frameItems 
      : (frameItems ? [{ mediaId: frameItems, duration: 10, priority: 1 }] : []);
  }, [frameItems]);

  // INTERNAL ENGINE: Filters items based on the current system time and date
  const getValidPlaylist = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0];

    const valid = items.filter(item => {
      // Date Range Validation
      if (item.startDate && item.startDate > currentDate) return false;
      if (item.endDate && item.endDate < currentDate) return false;
      
      // Time Window Validation
      if (item.startTime && item.endTime) {
        if (item.startTime <= item.endTime) {
          if (currentTime < item.startTime || currentTime > item.endTime) return false;
        } else {
          // Crosses midnight (e.g. 23:00 to 02:00)
          if (currentTime < item.startTime && currentTime > item.endTime) return false;
        }
      }
      return true;
    });

    if (valid.length === 0) return [];

    // Preemption Logic: Only show the highest priority tier available in this frame
    const maxPriority = Math.max(...valid.map(i => i.priority || 1));
    return valid.filter(i => (i.priority || 1) === maxPriority);
  }, [items]);

  // TRANSITION ENGINE: Manages the rotation of the playlist
  useEffect(() => {
    if (getValidPlaylist.length <= 1) {
        if (currentIndex !== 0) setCurrentIdx(0);
        return;
    }
    
    // Safety: If playlist shrinks, reset index to avoid out-of-bounds
    if (currentIndex >= getValidPlaylist.length) {
        setCurrentIdx(0);
        return;
    }

    const currentItem = getValidPlaylist[currentIndex];
    const duration = (currentItem.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % getValidPlaylist.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, getValidPlaylist]);

  // RENDER LOGIC
  if (getValidPlaylist.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent animate-pulse" />
        <Radio className="text-white/5 group-hover:text-indigo-500/10 transition-colors duration-1000" size={48} />
        <span className="mt-4 text-[8px] font-black text-white/5 uppercase tracking-[4px]">Waiting for Signal</span>
      </div>
    );
  }

  const currentConfig = getValidPlaylist[currentIndex];
  
  // Dynamic Content Branching
  if (zone.type === 'ticker') {
    const tickerData = tickers.find(t => t.id === currentConfig.mediaId || t._id === currentConfig.mediaId);
    return <TickerEngine ticker={tickerData} />;
  }

  // Find the actual media asset from the global library
  const mappedMedia = allMedia.find(m => (m.id === currentConfig.mediaId || m._id === currentConfig.mediaId));
  const itemToRender = mappedMedia || currentConfig;
  
  return (
    <div className="w-full h-full relative group">
      <FrameManager 
        item={itemToRender} 
        zoneId={zone.i}
        onMediaError={() => {
          if (getValidPlaylist.length > 1) {
              setCurrentIdx((prev) => (prev + 1) % getValidPlaylist.length);
          }
        }}
      />
      {/* Frame Label (Visible on hover or debug) */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[8px] font-bold text-white/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest border border-white/5">
        Zone: {zone.i}
      </div>
    </div>
  );
};

export default LocalFramePlayer;
