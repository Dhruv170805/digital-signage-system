/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { 
  CloudSun, MapPin, AlertCircle, Zap, Activity, Monitor, Clock as ClockIcon, RefreshCw, ShieldAlert, QrCode, WifiOff, Cpu, HardDrive
} from 'lucide-react';
import FrameManager from '../components/display/FrameManager';
import WeatherWidget from '../components/display/WeatherWidget';
import TickerEngine from '../components/display/TickerEngine';
import LocalFramePlayer from '../components/display/LocalFramePlayer';
import useLayoutStore from '../store/useLayoutStore';

// --- Main Display Screen ---
const DisplayScreen = () => {
  const [searchParams] = useSearchParams();
  const { topBarPosition, tickerPosition } = useLayoutStore();
  
  const [screenInfo, setScreenInfo] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [tickers, setTickers] = useState([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);

  const [settings, setSettings] = useState({ idleWallpaperId: '' });
  const [idleMedia, setIdleMedia] = useState(null);
  const [idleConfig, setIdleConfig] = useState(null);
  const [time, setTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 🧠 1. SCREEN DETECTION ENGINE
  const [screenConfig, setScreenConfig] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.innerWidth / window.innerHeight,
    type: window.innerWidth / window.innerHeight > 1.7 ? 'landscape' : (window.innerWidth / window.innerHeight < 0.8 ? 'portrait' : 'square'),
    scale: window.innerWidth > 3000 ? 1.5 : (window.innerWidth > 1920 ? 1.2 : 1)
  });

  const lastFetchRef = useRef(0);
  const transitionRef = useRef(null);

  // Capture token from URL and persist
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("screenToken", token);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      window.location.reload();
    }
  }, [searchParams]);

  // 🧠 LIVE RESIZE SUPPORT
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = w / h;
      setScreenConfig({
        width: w,
        height: h,
        ratio,
        type: ratio > 1.7 ? 'landscape' : (ratio < 0.8 ? 'portrait' : 'square'),
        scale: w > 3000 ? 1.5 : (w > 1920 ? 1.2 : 1)
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTelemetry = () => {
    const telemetry = { 
      uptime: Math.round(performance.now() / 1000),
      connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
    if (window.performance && window.performance.memory) {
        telemetry.ramUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
    }
    return telemetry;
  };

  const fetchData = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 3000) return;
    lastFetchRef.current = now;

    let token = localStorage.getItem('screenToken');
    const authConfig = { headers: token ? { Authorization: `Bearer ${token}` } : {} };

    setIsSyncing(true);
    try {
      if (token) {
        const manifestRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens/manifest`, authConfig);
        const { screen, playlist: newPlaylist, tickers: newTickers, settings: newSettings, media: newMedia, idleMedia: newIdleMedia, idleConfig: newIdleConfig } = manifestRes.data;
        
        setScreenInfo(screen);
        setIsOffline(false);

        const currentIds = playlist.map(p => p.id || p._id).join(',');
        const newIds = (newPlaylist || []).map(p => p.id || p._id).join(',');

        if (newIds !== currentIds) {
          setPlaylist(newPlaylist || []);
          setCurrentIdx(0);
        }

        setTickers(newTickers || []);
        setSettings(newSettings || {});
        setAllMedia(newMedia || []);
        setIdleMedia(newIdleMedia || null);
        setIdleConfig(newIdleConfig || null);
      } else {
        // Fallback for non-registered screens
        const publicRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens/public-manifest`);
        const { screen, playlist: newPlaylist, tickers: newTickers, settings: newSettings, media: newMedia, idleConfig: newIdleConfig } = publicRes.data;
        
        setScreenInfo(screen);
        setPlaylist(newPlaylist || []);
        setTickers(newTickers || []);
        setSettings(newSettings || {});
        setAllMedia(newMedia || []);
        setIdleConfig(newIdleConfig || null);
      }
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403) && token) {
         localStorage.removeItem('screenToken');
         // Retry once with public manifest
         lastFetchRef.current = 0;
         fetchData();
         return;
      }
      setIsOffline(true);
    } finally {
      setTimeout(() => { setIsSyncing(false); setIsInitialLoading(false); }, 1500);
    }
  }, [playlist]);

  useEffect(() => {
    const token = localStorage.getItem('screenToken');
    const deviceToken = localStorage.getItem('deviceToken');
    
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token, deviceToken },
      transports: ['websocket', 'polling']
    });
    
    fetchData();
    const t = setInterval(() => setTime(new Date()), 1000);
    const hb = setInterval(() => {
        const currentToken = localStorage.getItem('screenToken');
        const telemetry = getTelemetry();
        if (currentToken) socket.emit('screenPing', { token: currentToken, telemetry });
    }, 10000);

    socket.on('manifestUpdate', (manifest) => {
        const { screen, playlist: newPlaylist, tickers: newTickers, media: newMedia, idleConfig: newIdleConfig } = manifest;
        setScreenInfo(screen);
        setPlaylist(newPlaylist || []);
        setTickers(newTickers || []);
        setAllMedia(newMedia || []);
        setIdleConfig(newIdleConfig || null);
    });

    socket.on('connect', () => { fetchData(); });

    return () => { clearInterval(t); clearInterval(hb); socket.disconnect(); };
  }, [fetchData]);

  // Cinematic Playlist Transition Engine
  useEffect(() => {
    if (playlist.length > 1) {
      const duration = (playlist[currentIdx]?.duration || 10) * 1000;
      const timer = setTimeout(() => {
        if (transitionRef.current) transitionRef.current.classList.add('opacity-0');
        setTimeout(() => {
            setCurrentIdx((prev) => (prev + 1) % playlist.length);
            if (transitionRef.current) transitionRef.current.classList.remove('opacity-0');
        }, 800);
      }, duration - 800);
      return () => clearTimeout(timer);
    } else {
      if (currentIdx !== 0) setCurrentIdx(0);
    }
  }, [currentIdx, playlist]);

  // Ticker Transition Engine
  useEffect(() => {
    if (tickers.length > 1) {
      const duration = 15000; // Show each ticker for 15 seconds
      const timer = setInterval(() => {
        setCurrentTickerIdx((prev) => (prev + 1) % tickers.length);
      }, duration);
      return () => clearInterval(timer);
    } else {
      if (currentTickerIdx !== 0) setCurrentTickerIdx(0);
    }
  }, [tickers, currentTickerIdx]);

  const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  // 🧠 --- AI LAYOUT ENGINE CORE ---
  const analyzeContent = (item, mapping = {}) => {
    const type = item?.fileType || (item?.mimeType?.startsWith('video/') ? 'video' : (item?.mimeType === 'application/pdf' ? 'pdf' : 'image'));
    const frameCount = Object.keys(mapping).length;
    return {
      type,
      isTextHeavy: type === 'pdf' || type === 'text',
      isVideo: type === 'video',
      isMultiFrame: frameCount > 1,
      count: frameCount || 1
    };
  };

  const scoreLayouts = (analyzed) => {
    const scores = { IMMERSIVE: 1, FOCUS: 1, SPLIT: 1, GRID: 1 };

    if (analyzed.isVideo) {
      scores.IMMERSIVE += 12; // Video always wants edge-to-edge
      scores.FOCUS += 4;
    } else if (analyzed.isTextHeavy) {
      scores.FOCUS += 15;     // PDF needs margins for readability
      scores.IMMERSIVE += 2;
    } else if (analyzed.count >= 3) {
      scores.GRID += 10;      // High density content
      scores.SPLIT += 5;
    } else if (analyzed.count === 2) {
      scores.SPLIT += 12;     // Balanced comparison
      scores.FOCUS += 4;
    } else {
      scores.FOCUS += 10;     // Default elegant focus
    }

    // Orientation Penalty/Bonus
    if (screenConfig.type === 'portrait') {
      scores.SPLIT -= 8; // Vertical screens hate side-by-side
      scores.GRID += 5;  // Vertical screens love stacking
    }

    return scores;
  };

  const getAILayout = (intent, analyzed) => {
    const isPortrait = screenConfig.type === 'portrait';
    
    switch (intent) {
      case 'IMMERSIVE':
        return [{ i: 'main', x: 0, y: 0, w: 100, h: 100 }];
      
      case 'FOCUS':
        // Elegant centered frame with 10% breathing room
        return [{ i: 'main', x: 10, y: 8, w: 80, h: 80 }];
      
      case 'SPLIT':
        return isPortrait 
          ? [{ i: 'top', x: 0, y: 0, w: 100, h: 50 }, { i: 'bottom', x: 0, y: 50, w: 100, h: 50 }]
          : [{ i: 'left', x: 0, y: 0, w: 50, h: 100 }, { i: 'right', x: 50, y: 0, w: 50, h: 100 }];
      
      case 'GRID':
        return [
          { i: 'g1', x: 0, y: 0, w: 50, h: 50 }, { i: 'g2', x: 50, y: 0, w: 50, h: 50 },
          { i: 'g3', x: 0, y: 50, w: 50, h: 50 }, { i: 'g4', x: 50, y: 50, w: 50, h: 50 }
        ];
      
      default:
        return [{ i: 'main', x: 0, y: 0, w: 100, h: 100 }];
    }
  };

  const renderMediaContent = (item) => {
    if (!item) return null;
    const layoutSource = item.layout || (item.templateId && item.templateId.layout);
    const originalLayout = layoutSource ? safeParse(layoutSource) : null;
    const mapping = item.mediaMapping ? safeParse(item.mediaMapping, {}) : {};

    // 🧠 AI ANALYSIS
    const mainMedia = item.mediaId || item;
    const analyzed = analyzeContent(mainMedia, mapping);
    const scores = scoreLayouts(analyzed);
    const bestIntent = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    
    // 🧩 1. GENERATE DYNAMIC FRAMES
    // If user provided a specific multi-frame layout, we optimize it. 
    // Otherwise, the AI generates the perfect structure.
    let targetLayout = (originalLayout && originalLayout.length > 0) 
        ? originalLayout 
        : getAILayout(bestIntent, analyzed);

    const SAFE_MARGIN = 2; // Broadcast overscan protection

    const finalLayout = targetLayout.map((frame) => {
        let { x, y, w, h } = frame;

        // 🧠 2. CONTENT-AWARE REFINEMENTS
        if (analyzed.isVideo && bestIntent === 'IMMERSIVE') {
            // Force true edge-to-edge for video impact
            x = 0; y = 0; w = 100; h = 100;
        } else {
            // Apply Safe Zone System for non-immersive content
            if (x === 0) { x += SAFE_MARGIN; w -= SAFE_MARGIN; }
            if (x + w >= 100) { w -= SAFE_MARGIN; }
            if (y === 0) { y += SAFE_MARGIN; h -= SAFE_MARGIN; }
            if (y + h >= 100) { h -= SAFE_MARGIN; }
        }

        return { ...frame, x, y, w, h };
    });

    return (
      <div className="w-full h-full relative">
        <div className="broadcast-grid" />
        <div className="w-full h-full relative overflow-hidden">
          {finalLayout.map((zone) => {
              // Map mapping keys (Frame-xxx) to AI slots (main, top, etc) if needed
              const frameItems = mapping[zone.i] || (zone.i === 'main' ? [mainMedia] : []);
              
              return (
                <div 
                    key={zone.i} 
                    className="absolute glass-frame transition-all duration-[1500ms] cubic-bezier(0.2, 0.8, 0.2, 1)" 
                    style={{ 
                        left: `${zone.x}%`, 
                        top: `${zone.y}%`, 
                        width: `${zone.w}%`, 
                        height: `${zone.h}%`, 
                        zIndex: zone.zIndex || 1 
                    }}
                >
                    <LocalFramePlayer zone={zone} frameItems={frameItems} allMedia={allMedia} tickers={tickers} screenInfo={screenInfo} />
                </div>
              );
          })}
        </div>
      </div>
    );
  };

  const renderIdleContent = () => {
    if (idleConfig) {
        const { contentType, content, style } = idleConfig;
        if (contentType === 'color') return <div className="w-full h-full" style={{ backgroundColor: content.bgColor || '#000' }} />;
        if (contentType === 'text') return (
            <div className="w-full h-full flex items-center justify-center p-24" style={{ backgroundColor: style.background || 'transparent' }}>
                <h2 className="font-black text-center leading-tight uppercase tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" style={{ fontSize: `${style.fontSize || 4}vw`, color: style.color || '#fff' }}>{content.text}</h2>
            </div>
        );
        if (contentType === 'video' || contentType === 'image') return <FrameManager item={{ filePath: content.url, fileType: contentType }} />;
    }
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent animate-pulse" />
            <Activity className="text-indigo-500/10 animate-pulse mb-12" size={240} />
            <h2 className="text-5xl font-black text-white/5 uppercase tracking-[32px] text-center max-w-6xl leading-relaxed">NEXUS • ENGINE • ONLINE</h2>
            <div className="mt-20 flex gap-12 opacity-10">
                <div className="flex items-center gap-3"><Cpu size={24}/><span className="text-xl font-black">X-PROTOCOL</span></div>
                <div className="flex items-center gap-3"><HardDrive size={24}/><span className="text-xl font-black">SYNC-ACTIVE</span></div>
            </div>
        </div>
    );
  };

  if (error === 'IDENTITY_REVOKED') return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[200] p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-transparent to-transparent opacity-50" />
        <div className="max-w-4xl w-full p-20 bg-black/40 backdrop-blur-3xl rounded-[80px] border border-rose-500/20 text-center shadow-[0_0_100px_rgba(244,63,94,0.1)] relative">
            <div className="w-32 h-32 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 mx-auto mb-12 shadow-[0_0_60px_rgba(244,63,94,0.4)]">
                <ShieldAlert size={64} className="text-rose-500 animate-pulse" />
            </div>
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-6 leading-none">Access Suspended</h1>
            <p className="text-lg font-bold text-rose-300/60 uppercase tracking-[8px] mb-16">Terminal Identity De-Authorized by Master Hub</p>
            <div className="p-10 bg-white/5 rounded-[40px] border border-white/5"><p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px] mb-6">Security Handshake Token</p><div className="bg-white p-8 rounded-3xl flex items-center justify-center gap-8 shadow-2xl"><QrCode size={80} className="text-black"/><div className="text-left"><p className="text-5xl font-black text-black tracking-tighter">NX-PAIR</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Authorize at Command Center</p></div></div></div>
        </div>
    </div>
  );

  if (isInitialLoading) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
      <div className="text-center relative">
        <div className="w-48 h-48 mx-auto mb-12 relative flex items-center justify-center">
          <div className="absolute inset-0 border-[12px] border-indigo-500/10 rounded-full" />
          <div className="absolute inset-0 border-[12px] border-t-indigo-500 rounded-full animate-spin shadow-[0_0_40px_rgba(99,102,241,0.4)]" />
          <Activity size={64} className="text-indigo-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-[16px] animate-pulse">Initializing Nexus</h2>
        <div className="mt-8 flex justify-center gap-2">{[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}</div>
      </div>
    </div>
  );

  return (
    <div 
        className="fixed inset-0 w-full h-full bg-[#000] overflow-hidden text-white select-none font-sans"
        style={{ '--scale': screenConfig.scale, fontSize: 'calc(16px * var(--scale))' }}
    >
      {/* 1. CINEMATIC DEPTH BASE */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle at center, #111 0%, #000 100%)' }}>
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      {/* 2. STAGE (TRUE FULLSCREEN CONTENT) */}
      <div ref={transitionRef} className="absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out">
        {playlist.length > 0 && currentIdx < playlist.length ? renderMediaContent(playlist[currentIdx]) : (
          <div className="w-full h-full animate-fade-in relative">{renderIdleContent()}</div>
        )}
      </div>
    </div>
  );
};

export default DisplayScreen;
