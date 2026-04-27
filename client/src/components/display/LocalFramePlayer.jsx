import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import FrameManager from './FrameManager';
import TickerEngine from './TickerEngine';
import PreloadLayer from './PreloadLayer';
import useInterruptStore from '../../store/useInterruptStore';
import { Radio } from 'lucide-react';

const LocalFramePlayer = ({ zone, frameItems, allMedia, tickers }) => {
  const [currentIndex, setCurrentIdx] = useState(0);
  const [nextIsReady, setNextIsReady] = useState(false);
  const [minuteTick, setMinuteTick] = useState(0);
  const { activeInterrupt, clearInterrupt } = useInterruptStore();
  const mediaRef = useRef(null);

  // 🧠 CLOCK-ALIGNED MINUTE TICKER
  useEffect(() => {
    const alignTick = () => {
        const now = new Date();
        const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
        
        const timeoutId = setTimeout(() => {
            setMinuteTick(t => t + 1);
            const intervalId = setInterval(() => setMinuteTick(t => t + 1), 60000);
            return () => clearInterval(intervalId);
        }, delay);
        
        return () => clearTimeout(timeoutId);
    };
    return alignTick();
  }, []);

  // Normalize mapping items
  const items = useMemo(() => {
    return Array.isArray(frameItems) 
      ? frameItems 
      : (frameItems ? [{ mediaId: frameItems, duration: 10, priority: 1 }] : []);
  }, [frameItems]);

  // 🧠 SCHEDULER
  const validPlaylist = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0];
    
    const valid = items.filter(item => {
      if (item.startDate && item.startDate > currentDate) return false;
      if (item.endDate && item.endDate < currentDate) return false;
      if (item.startTime && item.endTime) {
        if (item.startTime <= item.endTime) {
          if (currentTime < item.startTime || currentTime > item.endTime) return false;
        } else {
          if (currentTime < item.startTime && currentTime > item.endTime) return false;
        }
      }
      return true;
    });

    if (valid.length === 0) return [];
    const maxPriority = Math.max(...valid.map(i => i.priority || 1));
    return valid.filter(i => (i.priority || 1) === maxPriority);
  }, [items, minuteTick]);

  const nextIndex = (currentIndex + 1) % validPlaylist.length;

  // 🧠 ASSET RESOLVER
  const resolveAsset = useCallback((plItem) => {
    if (!plItem) return null;
    return allMedia.find(m => (m.id === plItem.mediaId || m._id === plItem.mediaId)) || plItem;
  }, [allMedia]);

  const currentAsset = useMemo(() => resolveAsset(validPlaylist[currentIndex]), [currentIndex, validPlaylist, resolveAsset]);
  const nextAsset = useMemo(() => resolveAsset(validPlaylist.length > 1 ? validPlaylist[nextIndex] : null), [validPlaylist, nextIndex, resolveAsset]);

  // 🧠 ADVANCE LOGIC
  const advance = useCallback(() => {
    if (validPlaylist.length > 1 && nextIsReady) {
      setCurrentIdx(nextIndex);
      setNextIsReady(false); // Reset for next item
    } else if (validPlaylist.length === 1) {
      setCurrentIdx(0);
    }
  }, [validPlaylist.length, nextIndex, nextIsReady]);

  // 🛡️ PRELOAD CIRCUIT BREAKER
  useEffect(() => {
    if (nextAsset && !nextIsReady) {
      const timeout = setTimeout(() => {
        setNextIsReady(true); 
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [nextAsset, nextIsReady]);

  // 🚀 PLAYLIST ROTATION
  useEffect(() => {
    if (validPlaylist.length <= 1 || !currentAsset) return;

    const isVideo = currentAsset.fileType === 'video' || (currentAsset.mimeType && currentAsset.mimeType.startsWith('video/'));

    if (!isVideo) {
        const duration = (validPlaylist[currentIndex]?.duration || 10) * 1000;
        const timer = setTimeout(advance, duration);
        return () => clearTimeout(timer);
    }
  }, [currentIndex, validPlaylist, currentAsset, advance]);

  // 🚨 INTERRUPT AUTO-CLEAR
  useEffect(() => {
    if (activeInterrupt) {
      const timer = setTimeout(clearInterrupt, (activeInterrupt.duration || 15) * 1000);
      return () => clearTimeout(timer);
    }
  }, [activeInterrupt, clearInterrupt]);

  if (validPlaylist.length === 0 && !activeInterrupt) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
        <Radio className="text-white/5 animate-pulse" size={48} />
      </div>
    );
  }

  if (activeInterrupt) {
    return (
      <div className="absolute inset-0 z-[9999] bg-black animate-fade-in">
        <FrameManager item={activeInterrupt} zone={zone} />
      </div>
    );
  }

  if (zone.type === 'ticker') {
    const tickerData = tickers.find(t => t.id === validPlaylist[currentIndex].mediaId || t._id === validPlaylist[currentIndex].mediaId);
    return <TickerEngine ticker={tickerData} />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
        <FrameManager 
        item={currentAsset} 
        zone={zone}
        onMediaEnd={advance}
        onMediaError={advance}
        mediaRef={mediaRef}
        />

        {nextAsset && (
        <PreloadLayer 
            item={nextAsset} 
            onReady={() => setNextIsReady(true)} 
        />
        )}
    </div>
  );
};

export default LocalFramePlayer;
