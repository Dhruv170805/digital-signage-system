import React, { useState, useEffect } from 'react';
import FrameManager from './FrameManager';
import TickerEngine from './TickerEngine';
import { Activity } from 'lucide-react';

const LocalFramePlayer = ({ zone, frameItems, allMedia, tickers }) => {
  const [currentIndex, setCurrentIdx] = useState(0);

  // Parse legacy string mappings vs new array of objects mappings
  const items = Array.isArray(frameItems) ? frameItems : (frameItems ? [{ mediaId: frameItems }] : []);

  // Filter based on time/date
  const getValidItems = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0];

    return items.filter(item => {
      if (item.startDate && item.startDate > currentDate) return false;
      if (item.endDate && item.endDate < currentDate) return false;
      if (item.startTime && item.endTime) {
        if (item.startTime <= item.endTime) {
          if (currentTime < item.startTime || currentTime > item.endTime) return false;
        } else {
          // Midnight crossing
          if (currentTime < item.startTime && currentTime > item.endTime) return false;
        }
      }
      return true;
    }).sort((a, b) => (b.priority || 1) - (a.priority || 1));
  };

  const [activePlaylist, setActivePlaylist] = useState(getValidItems());

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlaylist(getValidItems());
    }, 10000); // Check validity every 10s
    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    if (activePlaylist.length === 0) return;
    
    // Safety check index
    if (currentIndex >= activePlaylist.length) {
        setCurrentIdx(0);
        return;
    }

    const currentItem = activePlaylist[currentIndex];
    const duration = (currentItem.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % activePlaylist.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, activePlaylist]);

  if (activePlaylist.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/80">
        <Activity className="text-white/10 animate-pulse" size={40} />
      </div>
    );
  }

  const currentConfig = activePlaylist[currentIndex];
  
  if (zone.type === 'ticker') {
    const tickerData = tickers.find(t => t.id === currentConfig.mediaId || t._id === currentConfig.mediaId);
    return <TickerEngine ticker={tickerData} />;
  }

  const mappedMedia = allMedia.find(m => (m.id === currentConfig.mediaId || m._id === currentConfig.mediaId));
  
  return (
    <FrameManager 
      item={mappedMedia} 
      zoneId={zone.i}
      onMediaError={() => {
        // Skip to next immediately on error, unless it's the only one
        if (activePlaylist.length > 1) {
            setCurrentIdx((prev) => (prev + 1) % activePlaylist.length);
        }
      }}
    />
  );
};

export default LocalFramePlayer;
