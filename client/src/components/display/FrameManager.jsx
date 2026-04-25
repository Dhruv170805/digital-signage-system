import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import PdfRenderer from './PdfRenderer';

const getMediaUrl = (filePath, zoneId) => {
  if (!filePath) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const url = `${apiBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  return zoneId ? `${url}?z=${zoneId}` : url;
};

const FrameManager = ({ item, zone, onMediaEnd, onMediaError, mediaRef }) => {
  const [displayItems, setDisplayItems] = useState({ current: item, next: null });
  const [transitioning, setTransitioning] = useState(false);
  const [textContents, setTextContents] = useState({});

  const getFilePath = (media) => media?.filePath || media?.path || '';
  const getFileType = (media) => {
    if (media?.fileType) return media.fileType;
    if (media?.mimeType) {
      if (media.mimeType.startsWith('image/')) return 'image';
      if (media.mimeType.startsWith('video/')) return 'video';
      if (media.mimeType === 'application/pdf') return 'pdf';
      if (media.mimeType.startsWith('text/')) return 'text';
    }
    return 'unknown';
  };

  // 🧠 TRANSITION ENGINE: Handle dual-layer swaps
  useEffect(() => {
    const currentId = displayItems.current?._id || displayItems.current?.id;
    const incomingId = item?._id || item?.id;

    if (incomingId !== currentId) {
      setTransitioning(true);
      setDisplayItems(prev => ({ ...prev, next: item }));

      // Duration must match CSS transitions (0.8s - 1s)
      const timer = setTimeout(() => {
        setDisplayItems({ current: item, next: null });
        setTransitioning(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [item]);

  // 🧠 TEXT LOADER
  useEffect(() => {
    const fetchText = async (media) => {
        const id = media._id || media.id;
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
    if (getFileType(item) === 'text') fetchText(item);
  }, [item]);

  const renderMedia = (mediaItem, layer) => {
    if (!mediaItem) return null;

    const filePath = getFilePath(mediaItem);
    const fileType = getFileType(mediaItem);
    const src = getMediaUrl(filePath, zone?.i) || undefined;
    
    // Only attach the external ref to the current active layer
    const isCurrent = layer === 'current';
    const attachRef = isCurrent ? mediaRef : null;
    
    // Determine Transition Style
    let transitionClass = "absolute inset-0 w-full h-full ";
    if (layer === 'next') {
        const style = zone?.transition || 'fade';
        if (style === 'slide') transitionClass += "animate-slide-in";
        else if (style === 'zoom') transitionClass += "animate-zoom-in";
        else transitionClass += "animate-fade-in"; // Default fade
    } else if (layer === 'current' && transitioning) {
        const style = zone?.transition || 'fade';
        if (style === 'slide') transitionClass += "animate-slide-out";
        else transitionClass += "transition-opacity duration-1000 opacity-0";
    }

    if (fileType === 'video') {
      return (
        <video 
          ref={attachRef}
          key={`vid-${mediaItem._id || mediaItem.id}`}
          src={src} 
          autoPlay 
          muted 
          playsInline
          onEnded={() => onMediaEnd && onMediaEnd()}
          onError={() => onMediaError && onMediaError()}
          className={`${transitionClass} object-cover bg-black`}
        />
      );
    }
    
    if (fileType === 'text') {
      return (
        <div ref={attachRef} key={`txt-${mediaItem._id || mediaItem.id}`} className={`${transitionClass} flex items-center justify-center p-[5vw] bg-slate-900`}>
           <div className="w-full h-full glass p-[4vw] rounded-[40px] border-white/10 shadow-2xl flex items-center justify-center overflow-auto hide-scrollbar">
              <pre className="text-[min(5vw,4rem)] font-black text-white whitespace-pre-wrap font-sans text-center leading-tight tracking-tighter uppercase drop-shadow-2xl">
                {textContents[mediaItem._id || mediaItem.id] || 'Syncing...'}
              </pre>
           </div>
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div ref={attachRef} key={`pdf-${mediaItem._id || mediaItem.id}`} className={`${transitionClass} w-full h-full`}>
          <PdfRenderer url={src} zone={zone} />
        </div>
      );
    }

    return (
      <img 
        ref={attachRef}
        key={`img-${mediaItem._id || mediaItem.id}`}
        src={src} 
        alt="Broadcast Asset"
        onError={() => onMediaError && onMediaError()}
        className={`${transitionClass} object-cover bg-black`}
      />
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {displayItems.current && renderMedia(displayItems.current, 'current')}
      {displayItems.next && renderMedia(displayItems.next, 'next')}
    </div>
  );
};

export default FrameManager;
