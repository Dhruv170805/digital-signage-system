import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const getMediaUrl = (filePath, zoneId) => {
  if (!filePath) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const url = `${apiBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  return zoneId ? `${url}?z=${zoneId}` : url;
};

const FrameManager = ({ item, zoneId, onMediaError }) => {
  const [currentMedia, setCurrentMedia] = useState(item);
  const [previousMedia, setPreviousMedia] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textContents, setTextContents] = useState({});

  useEffect(() => {
    const fetchText = async (media) => {
        const id = media._id || media.id;
        if (textContents[id]) return;
        try {
            const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
            const res = await fetch(`${apiBase}/${media.filePath}`);
            const text = await res.text();
            setTextContents(prev => ({ ...prev, [id]: text }));
        } catch (e) {
            console.error('Failed to fetch text content:', e);
            setTextContents(prev => ({ ...prev, [id]: 'Error loading text content.' }));
        }
    };

    if (item?.fileType === 'text') fetchText(item);
    if (previousMedia?.fileType === 'text') fetchText(previousMedia);
  }, [item, previousMedia, textContents]);

  useEffect(() => {
    const currentId = currentMedia?.id || currentMedia?._id;
    const newId = item?.id || item?._id;

    if (currentId !== newId) {
      setPreviousMedia(currentMedia);
      setCurrentMedia(item);
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setPreviousMedia(null);
        setIsTransitioning(false);
      }, 1000); // 1s crossfade
      return () => clearTimeout(timer);
    }
  }, [item, currentMedia]);

  const renderMedia = (mediaItem, isFadingOut) => {
    if (!mediaItem) return null;

    const src = getMediaUrl(mediaItem.filePath, zoneId) || undefined;
    const opacity = isFadingOut ? 0 : 1;
    const transitionClass = "transition-opacity duration-1000 absolute inset-0 w-full h-full";

    if (mediaItem.fileType === 'video') {
      return (
        <video 
          key={`vid-${mediaItem.id || mediaItem._id}`}
          src={src} 
          autoPlay 
          muted 
          loop 
          playsInline
          onError={() => onMediaError && onMediaError()}
          className={`${transitionClass} object-fill bg-black`}
          style={{ opacity, zIndex: isFadingOut ? 1 : 2 }}
        />
      );
    }
    
    if (mediaItem.fileType === 'text') {
      return (
        <div 
          key={`txt-${mediaItem.id || mediaItem._id}`}
          className={`${transitionClass} flex items-center justify-center p-[5vw] bg-slate-900`}
          style={{ opacity, zIndex: isFadingOut ? 1 : 2 }}
        >
           <div className="w-full h-full glass p-[4vw] rounded-[40px] border-white/10 shadow-2xl flex items-center justify-center overflow-auto custom-scrollbar">
              <pre className="text-[min(5vw,4rem)] font-black text-white whitespace-pre-wrap font-sans text-center leading-tight tracking-tighter uppercase drop-shadow-2xl">
                {textContents[mediaItem.id || mediaItem._id] || 'Loading...'}
              </pre>
           </div>
        </div>
      );
    }

    if (mediaItem.fileType === 'pdf') {
      return (
        <iframe 
          key={`pdf-${mediaItem.id || mediaItem._id}`}
          src={src ? `${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH` : undefined} 
          className={`${transitionClass} border-none bg-white pointer-events-none object-fill`}
          style={{ opacity, zIndex: isFadingOut ? 1 : 2, width: '100%', height: '100%' }}
          title={mediaItem.fileName} 
        />
      );
    }

    return (
      <img 
        key={`img-${mediaItem.id || mediaItem._id}`}
        src={src} 
        alt={mediaItem.fileName} 
        onError={() => onMediaError && onMediaError()}
        className={`${transitionClass} object-fill bg-black`}
        style={{ opacity, zIndex: isFadingOut ? 1 : 2 }}
      />
    );
  };

  if (!currentMedia && !previousMedia) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 gap-4">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
        <AlertCircle className="text-rose-500/50" size={32} />
      </div>
      <span className="text-[10px] font-black text-rose-500/40 uppercase tracking-[6px]">Asset Missing</span>
    </div>
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {previousMedia && renderMedia(previousMedia, true)}
      {renderMedia(currentMedia, false)}
    </div>
  );
};

export default FrameManager;
