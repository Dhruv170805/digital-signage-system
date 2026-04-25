import React from 'react';

const getMediaUrl = (filePath) => {
  if (!filePath) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${apiBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
};

const PreloadLayer = ({ item, onReady }) => {
  if (!item) return null;

  const filePath = item.filePath || item.path || '';
  const fileType = item.fileType || (item.mimeType?.startsWith('video/') ? 'video' : 'image');
  const src = getMediaUrl(filePath);

  if (fileType === 'video') {
    return (
      <video 
        src={src} 
        preload="auto" 
        muted 
        style={{ display: 'none' }} 
        onCanPlayThrough={onReady} 
      />
    );
  }

  if (fileType === 'image') {
    return (
      <img 
        src={src} 
        style={{ display: 'none' }} 
        onLoad={onReady} 
        onError={onReady} // Don't block the queue on 404s
      />
    );
  }

  // PDFs are handled by the PDF worker's internal cache
  if (fileType === 'pdf') {
    setTimeout(onReady, 500);
    return null;
  }

  return null;
};

export default PreloadLayer;
