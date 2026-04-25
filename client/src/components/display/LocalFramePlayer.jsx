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

  // 🧠 MINUTE TICKER: Forces scheduler re-validation every 60s
  useEffect(() => {
    const timer = setInterval(() => setMinuteTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Normalize mapping items
  const items = useMemo(() => {
    return Array.isArray(frameItems) 
      ? frameItems 
      : (frameItems ? [{ mediaId: frameItems, duration: 10, priority: 1 }] : []);
  }, [frameItems]);

  // 🧠 SCHEDULER: Resolve valid items for this frame (Now reactive to time)
  const validPlaylist = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0];
    
    console.log(`[Scheduler:${zone.i}] Re-validating at ${currentTime}`);

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
  }, [items, minuteTick, zone.i]);

  const currentItem = validPlaylist[currentIndex];
  const nextIndex = (currentIndex + 1) % validPlaylist.length;
  const nextItem = validPlaylist.length > 1 ? validPlaylist[nextIndex] : null;

  // 🧠 ASSET RESOLVER
  const resolveAsset = (plItem) => {
    if (!plItem) return null;
    return allMedia.find(m => (m.id === plItem.mediaId || m._id === plItem.mediaId)) || plItem;
  };

  const currentAsset = useMemo(() => resolveAsset(currentItem), [currentItem, allMedia]);
  const nextAsset = useMemo(() => resolveAsset(nextItem), [nextItem, allMedia]);

  // 🧠 ADVANCE LOGIC: Only move if next is ready
  const advance = useCallback(() => {
    if (validPlaylist.length > 1 && nextIsReady) {
      setCurrentIdx(nextIndex);
      setNextIsReady(false);
    } else if (validPlaylist.length === 1) {
      setCurrentIdx(0);
    }
  }, [validPlaylist.length, nextIndex, nextIsReady]);

  // 🚀 PLAYLIST ROTATION
  useEffect(() => {
    if (validPlaylist.length <= 1 || !currentAsset) return;

    const isVideo = currentAsset.fileType === 'video' || (currentAsset.mimeType && currentAsset.mimeType.startsWith('video/'));

    // Non-video assets use duration-based timeout
    if (!isVideo) {
        const duration = (currentItem.duration || 10) * 1000;
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm relative">
        <Radio className="text-white/5 animate-pulse" size={48} />
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER SELECTION
  // ---------------------------------------------------------
  
  // 1. HARD OVERRIDE LAYER (Highest Z-Index)
  if (activeInterrupt) {
    return (
      <div className="absolute inset-0 z-[9999] bg-black animate-fade-in">
        <FrameManager item={activeInterrupt} zone={zone} />
      </div>
    );
  }

  // 2. TICKER SPECIAL HANDLING
  if (zone.type === 'ticker') {
    const tickerData = tickers.find(t => t.id === currentItem.mediaId || t._id === currentItem.mediaId);
    return <TickerEngine ticker={tickerData} />;
  }

  // 3. MAIN BUFFERED STAGE
  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Visible Layer */}
      <FrameManager 
        item={currentAsset} 
        zone={zone}
        onMediaEnd={advance}
        onMediaError={advance}
      />

      {/* Hidden Buffer (Preload) */}
      {nextAsset && (
        <PreloadLayer 
            item={nextAsset} 
            onReady={() => {
                console.log(`[Preload] Asset Ready: ${nextAsset.fileName || 'Next'}`);
                setNextIsReady(true);
            }} 
        />
      )}
    </div>
  );
};

export default LocalFramePlayer;
