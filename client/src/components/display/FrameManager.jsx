import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const getMediaUrl = (filePath) => {
  if (!filePath) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${apiBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
};

const FrameManager = ({ item, onMediaError }) => {
  const [currentMedia, setCurrentMedia] = useState(item);
  const [previousMedia, setPreviousMedia] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

    const src = getMediaUrl(mediaItem.filePath);
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
    
    if (mediaItem.fileType === 'pdf') {
      return (
        <iframe 
          key={`pdf-${mediaItem.id || mediaItem._id}`}
          src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} 
          className={`${transitionClass} border-none bg-white pointer-events-none`}
          style={{ opacity, zIndex: isFadingOut ? 1 : 2 }}
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
