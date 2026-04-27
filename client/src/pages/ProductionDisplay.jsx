import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useSocketStore from '../store/useSocketStore';
import '../App.css'; 

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '';

const ProductionDisplay = () => {
  const [playlist, setPlaylist] = useState([]);
  const [ticker, setTicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const connect = useSocketStore((state) => state.connect);
  
  const screenId = localStorage.getItem('screenId');
  const deviceToken = localStorage.getItem('deviceToken');

  const fetchPlaylist = React.useCallback(async () => {
    if (!API_URL || !screenId) return;
    try {
      const response = await axios.get(`${API_URL}/screens/${screenId}/playlist`);
      const data = response.data.data;
      
      const activeTicker = data.find(s => s.tickerId)?.ticker;
      const content = data.filter(s => s.mediaId || s.templateId);
      
      setPlaylist(content);
      setTicker(activeTicker);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
      setLoading(false);
    }
  }, [screenId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlaylist();
    if (deviceToken) connect(deviceToken);

    const interval = setInterval(fetchPlaylist, 60000);
    return () => clearInterval(interval);
  }, [fetchPlaylist, connect, deviceToken]);

  if (loading) return <div className="loading bg-bg text-text flex items-center justify-center min-h-screen">Initializing Nexus Engine...</div>;

  return (
    <div className="display-container fullscreen bg-bg text-text">
      {playlist.length === 0 && (
        <div className="fallback-content">
          <div className="w-20 h-20 bg-slate-100 rounded-full animate-pulse" />
        </div>
      )}

      {playlist.map((item) => {
        if (item.template) {
          return (
            <div key={item.id} className="template-layer">
              {item.template.frames.map(frame => (
                <div 
                  key={frame.id}
                  className="frame"
                  style={{
                    position: 'absolute',
                    left: `${frame.coordinateX}%`,
                    top: `${frame.coordinateY}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                    zIndex: frame.zIndex
                  }}
                >
                  <ContentRenderer frame={frame} schedule={item} />
                </div>
              ))}
            </div>
          );
        }
        
        if (item.media) {
          return (
            <div key={item.id} className="fullscreen-media">
              <MediaRenderer media={item.media} />
            </div>
          );
        }

        return null;
      })}

      {ticker && (
        <div 
          className="ticker-container"
          style={{
            backgroundColor: ticker.backgroundColor,
            color: ticker.fontColor,
            fontSize: `${ticker.fontSize}px`
          }}
        >
          <div className={`ticker-text move-${ticker.direction}`} style={{ animationDuration: `${ticker.speed}s` }}>
            {ticker.text}
          </div>
        </div>
      )}
    </div>
  );
};

const ContentRenderer = ({ schedule }) => {
  if (schedule.media) return <MediaRenderer media={schedule.media} />;
  return <div className="empty-frame">No Content</div>;
};

const MediaRenderer = ({ media }) => {
  if (!media || !media.filename) return null;
  const uploadUrl = import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/uploads` : '';
  const url = `${uploadUrl}/${media.filename}`;
  
  if (media.mimeType.startsWith('image/')) {
    return <img src={url} alt={media.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  
  if (media.mimeType.startsWith('video/')) {
    return <video src={url} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }

  if (media.mimeType === 'application/pdf') {
    return <iframe src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Content" className="object-fill" />;
  }

  return <div>Unsupported Media</div>;
};

export default ProductionDisplay;
