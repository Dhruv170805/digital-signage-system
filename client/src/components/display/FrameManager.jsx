import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import PdfRenderer from './PdfRenderer';

const getMediaUrl = (filePath, zoneId) => {
  if (!filePath) return null;
  let apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const url = `${apiBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  return zoneId ? `${url}?z=${zoneId}` : url;
};

const FrameManager = ({ item, zone, onMediaEnd, onMediaError, mediaRef }) => {
  const [displayItems, setDisplayItems] = useState({ current: item, next: null });
  const [transitioning, setTransitioning] = useState(false);
  const [textContents, setTextContents] = useState({});
  const [loadError, setLoadError] = useState(false);

  const getMediaData = useCallback((mediaOrAssignment) => {
    if (!mediaOrAssignment) return null;
    if (mediaOrAssignment.mediaId && typeof mediaOrAssignment.mediaId === 'object') {
      return mediaOrAssignment.mediaId;
    }
    if (mediaOrAssignment.filePath || mediaOrAssignment.path) {
      return mediaOrAssignment;
    }
    return mediaOrAssignment;
  }, []);

  const getFilePath = useCallback((item) => {
    const media = getMediaData(item);
    let path = media?.filePath || media?.path || '';
    if (path.startsWith('server/')) path = path.replace('server/', '');
    return path;
  }, [getMediaData]);

  const getFileType = useCallback((item) => {
    const media = getMediaData(item);
    if (media?.fileType) return media.fileType;
    if (media?.mimeType) {
      if (media.mimeType.startsWith('image/')) return 'image';
      if (media.mimeType.startsWith('video/')) return 'video';
      if (media.mimeType === 'application/pdf') return 'pdf';
      if (media.mimeType.startsWith('text/')) return 'text';
    }
    return 'unknown';
  }, [getMediaData]);

  // 🧠 TRANSITION ENGINE
  useEffect(() => {
    const currentId = displayItems.current?._id || displayItems.current?.id || displayItems.current?.uid;
    const incomingId = item?._id || item?.id || item?.uid;

    if (incomingId && incomingId !== currentId) {
      setTransitioning(true);
      setLoadError(false);
      setDisplayItems(prev => ({ ...prev, next: item }));

      const timer = setTimeout(() => {
        setDisplayItems({ current: item, next: null });
        setTransitioning(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [item, displayItems.current]);

  // 🧠 TEXT LOADER
  useEffect(() => {
    const fetchText = async (media) => {
        const id = media._id || media.id || media.uid;
        const path = getFilePath(media);
        if (textContents[id] || !path) return;
        try {
            const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
            const res = await fetch(`${apiBase}/${path}`);
            const text = await res.text();
            setTextContents(prev => ({ ...prev, [id]: text }));
        } catch (e) {
            setTextContents(prev => ({ ...prev, [id]: 'Signal Error' }));
        }
    };
    const mediaData = getMediaData(item);
    if (getFileType(item) === 'text' && mediaData) fetchText(mediaData);
  }, [item, getFilePath, getFileType, getMediaData, textContents]);

  const handleMediaError = useCallback((e) => {
    console.error('[FrameManager] Media failed to load:', e.target?.src);
    setLoadError(true);
    if (onMediaError) onMediaError();
  }, [onMediaError]);

  const renderMedia = (mediaItem, layer) => {
    if (!mediaItem) return null;

    const filePath = getFilePath(mediaItem);
    const fileType = getFileType(mediaItem);
    const src = getMediaUrl(filePath, zone?.i);
    
    if (!src && fileType !== 'text') return null;

    const isCurrent = layer === 'current';
    const attachRef = isCurrent ? mediaRef : null;
    
    let transitionClass = "absolute inset-0 w-full h-full ";
    if (layer === 'next') {
        const style = zone?.transition || 'fade';
        if (style === 'slide') transitionClass += "animate-slide-in";
        else if (style === 'zoom') transitionClass += "animate-zoom-in";
        else transitionClass += "animate-fade-in";
    } else if (layer === 'current' && transitioning) {
        const style = zone?.transition || 'fade';
        if (style === 'slide') transitionClass += "animate-slide-out";
        else transitionClass += "transition-opacity duration-1000 opacity-0";
    }

    if (fileType === 'video') {
      return (
        <video 
          ref={attachRef}
          key={`vid-${mediaItem._id || mediaItem.id || mediaItem.uid}`}
          src={src} 
          autoPlay 
          muted 
          playsInline
          onEnded={() => onMediaEnd && onMediaEnd()}
          onError={handleMediaError}
          className={`${transitionClass} signage-asset bg-black`}
        />
      );
    }
    
    if (fileType === 'text') {
      const textKey = mediaItem._id || mediaItem.id || mediaItem.uid;
      return (
        <div ref={attachRef} key={`txt-${textKey}`} className={`${transitionClass} flex items-center justify-center p-[5vw] bg-slate-900`}>
           <div className="w-full h-full glass p-[4vw] rounded-[40px] border-white/10 shadow-2xl flex items-center justify-center overflow-auto hide-scrollbar">
              <pre className="text-[min(5vw,4rem)] font-black text-white whitespace-pre-wrap font-sans text-center leading-tight tracking-tighter uppercase drop-shadow-2xl">
                {textContents[textKey] || 'Syncing...'}
              </pre>
           </div>
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div ref={attachRef} key={`pdf-${mediaItem._id || mediaItem.id || mediaItem.uid}`} className={`${transitionClass} w-full h-full`}>
          <PdfRenderer url={src} zone={zone} />
        </div>
      );
    }

    return (
      <img 
        ref={attachRef}
        key={`img-${mediaItem._id || mediaItem.id || mediaItem.uid}`}
        src={src} 
        alt="Broadcast Asset"
        onError={handleMediaError}
        className={`${transitionClass} signage-asset bg-black`}
      />
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black signage-frame">
      {displayItems.current && renderMedia(displayItems.current, 'current')}
      {displayItems.next && renderMedia(displayItems.next, 'next')}
      
      {loadError && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
            <AlertCircle className="text-rose-500 mb-4" size={48} />
            <p className="text-white text-xs font-black uppercase tracking-[4px]">Signal Lost</p>
            <p className="text-rose-400/40 text-[8px] font-bold uppercase tracking-widest mt-2">Asset Resolution Failure</p>
        </div>
      )}
    </div>
  );
};

export default FrameManager;
