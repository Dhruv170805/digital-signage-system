/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { 
  CloudSun, MapPin, AlertCircle, Zap, Activity, Monitor, Clock as ClockIcon, RefreshCw, ShieldAlert, Tv, Radio
} from 'lucide-react';
import FrameManager from '../components/display/FrameManager';
import WeatherWidget from '../components/display/WeatherWidget';
import TickerEngine from '../components/display/TickerEngine';
import useLayoutStore from '../store/useLayoutStore';

// --- Main Display Screen ---
const DisplayScreen = () => {
  const [searchParams] = useSearchParams();
  const { tickerPosition } = useLayoutStore();
  
  const [playlist, setPlaylist] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [tickers, setTickers] = useState([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);

  const [idleConfig, setIdleConfig] = useState(null);
  const [time, setTime] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [screenConfig, setScreenConfig] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.innerWidth / window.innerHeight,
    type: window.innerWidth / window.innerHeight > 1.7 ? 'landscape' : (window.innerWidth / window.innerHeight < 0.8 ? 'portrait' : 'square'),
    scale: window.innerWidth > 3000 ? 1.5 : (window.innerWidth > 1920 ? 1.2 : 1)
  });

  const lastFetchRef = useRef(0);
  const socketRef = useRef(null);
  const playlistRef = useRef([]);

  const [screenToken, setScreenToken] = useState(localStorage.getItem('screenToken'));

  // Capture token from URL and persist
  useEffect(() => {
    const token = searchParams.get("token");
    const isPreview = searchParams.get("preview") === "true";

    if (token) {
      if (isPreview) {
        setScreenToken(token);
      } else {
        localStorage.setItem("screenToken", token);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        window.location.reload();
      }
    }
  }, [searchParams]);

  const getTelemetry = useCallback(() => {
    const telemetry = { 
      uptime: Math.round(performance.now() / 1000),
      connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
    if (window.performance && window.performance.memory) {
        telemetry.ramUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
    }
    return telemetry;
  }, []);

  const fetchData = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return;
    lastFetchRef.current = now;

    const token = screenToken;
    const authConfig = { headers: token ? { Authorization: `Bearer ${token}` } : {} };

    // 🛡️ Resolve API Base with fallback for 5006
    let apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
    if (!apiBase && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        apiBase = 'http://localhost:5006';
    }

    try {
      const endpoint = token ? '/api/screens/manifest' : '/api/screens/public-manifest';
      const res = await axios.get(`${apiBase}${endpoint}`, authConfig);
      
      const { playlist: newPlaylist = [], tickers: newTickers = [], idleConfig: newIdle = null } = res.data;
      
      setIsOffline(false);

      const currentIds = playlistRef.current.map(p => p._id || p.id).join(',');
      const newIds = newPlaylist.map(p => p._id || p.id).join(',');

      if (newIds !== currentIds) {
        setPlaylist(newPlaylist);
        playlistRef.current = newPlaylist;
        setCurrentIdx(0);
      }

      setTickers(newTickers);
      setIdleConfig(newIdle);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403) && token) {
         localStorage.removeItem('screenToken');
         setScreenToken(null);
         return;
      }
      setIsOffline(true);
    } finally {
      setTimeout(() => { setIsInitialLoading(false); }, 1000);
    }
  }, [screenToken]);

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

  useEffect(() => {
    const token = screenToken;
    const deviceToken = localStorage.getItem('deviceToken');
    
    // 🛡️ Resolve API Base for socket
    let apiBase = (import.meta.env.VITE_API_URL || '');
    if (!apiBase && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        apiBase = 'http://localhost:5006';
    }

    const socket = io(apiBase, {
      auth: { token, deviceToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000
    });
    
    socketRef.current = socket;
    
    fetchData();
    const t = setInterval(() => setTime(new Date()), 1000);
    const hb = setInterval(() => {
        const telemetry = getTelemetry();
        if (token && socket.connected) socket.emit('screenPing', { token, telemetry });
    }, 10000);

    socket.on('connect', () => {
      setIsOffline(false);
      const telemetry = getTelemetry();
      if (token) socket.emit('screenPing', { token, telemetry });
    });

    socket.on('manifestUpdate', () => fetchData());
    socket.on('forceReset', () => window.location.reload());

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('manifestUpdate');
        socket.off('forceReset');
        // Delay disconnect slightly to avoid "closed before established" error in StrictMode
        setTimeout(() => socket.disconnect(), 10);
      }
      clearInterval(t);
      clearInterval(hb);
      socketRef.current = null;
    };
  }, [screenToken, fetchData, getTelemetry]);

  // Handle playlist rotation
  useEffect(() => {
    if (playlist.length <= 1) return;
    
    const currentItem = playlist[currentIdx];
    const duration = (currentItem?.duration || 10) * 1000;
    
    const timer = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % playlist.length);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [currentIdx, playlist]);

  // Handle ticker rotation
  useEffect(() => {
    if (tickers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTickerIdx(prev => (prev + 1) % tickers.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [tickers]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center space-y-8 animate-fade-in">
        <div className="relative">
            <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-[40px] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="text-indigo-500 animate-pulse" size={48} />
            </div>
            <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
        </div>
        <div className="text-center space-y-2 relative">
            <h2 className="text-white text-2xl font-black uppercase tracking-[12px] animate-pulse">Initializing</h2>
            <p className="text-indigo-400/40 text-[10px] font-black uppercase tracking-[4px]">Uplink Synchronization in Progress</p>
        </div>
      </div>
    );
  }

  const currentItem = playlist[currentIdx];

  return (
    <div className={`h-screen w-screen bg-black overflow-hidden relative cursor-none select-none ${screenConfig.type}`}>
      
      {/* 🔮 BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,27,75,1)_0%,rgba(0,0,0,1)_100%)] opacity-60" />
          <div className="absolute inset-0 backdrop-blur-[150px]" />
      </div>

      {/* ⚡ STATUS OVERLAYS */}
      <div className="absolute top-12 left-12 z-50 flex items-center gap-6">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 px-8 py-4 rounded-[32px] flex items-center gap-4 shadow-2xl">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            <ClockIcon className="text-indigo-400" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest leading-none mb-1">System Time</p>
            <p className="text-2xl font-black text-white uppercase tabular-nums tracking-tighter">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
        
        {isOffline && (
            <div className="bg-rose-500/10 backdrop-blur-3xl border border-rose-500/20 px-8 py-4 rounded-[32px] flex items-center gap-4 animate-pulse">
                <ShieldAlert className="text-rose-500" size={24} />
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[4px]">Signal Offline</p>
            </div>
        )}
      </div>

      <div className="absolute top-12 right-12 z-50 flex items-center gap-4">
        <WeatherWidget />
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-4 rounded-[32px] group hover:bg-white/10 transition-all">
            <MapPin className="text-white/40 group-hover:text-white transition-colors" size={20} />
        </div>
      </div>

      {/* 🚀 MAIN CONTENT */}
      <div className="h-full w-full relative z-10 flex flex-col">
        {playlist.length > 0 ? (
            <div className="flex-1 relative">
                <FrameManager item={currentItem} />
                
                {/* HUD OVERLAY */}
                <div className="absolute bottom-40 right-12 z-40 max-w-xl text-right animate-fade-in-up" key={currentIdx}>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[8px] mb-4">Live Manifest</p>
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-2xl">
                        {currentItem?.name || currentItem?.mediaId?.originalName || 'Broadcast Stream'}
                    </h1>
                    <div className="flex items-center justify-end gap-3 opacity-40">
                        <Activity size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Channel-0{currentIdx + 1}</span>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {idleConfig ? (
                   <FrameManager item={idleConfig.mediaId || idleConfig} />
                ) : (
                    <div className="relative z-10 flex flex-col items-center space-y-12">
                        <div className="w-32 h-32 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[48px] flex items-center justify-center shadow-2xl">
                            <Monitor className="text-indigo-500/40" size={64} />
                        </div>
                        <div className="text-center space-y-4">
                            <h3 className="text-white text-4xl font-black uppercase tracking-[16px]">Standby</h3>
                            <p className="text-indigo-400/40 text-[10px] font-black uppercase tracking-[6px]">Awaiting Broadcast Manifest</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 📟 TICKER */}
        {tickers.length > 0 && (
            <div className={`h-32 w-full z-50 shrink-0 ${tickerPosition === 'top' ? 'order-first' : ''}`}>
                <div className="h-full w-full bg-black/60 backdrop-blur-3xl border-t border-white/5 relative overflow-hidden flex items-center">
                    <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-black/90 to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-black/90 to-transparent z-10" />
                    <TickerEngine ticker={tickers[currentTickerIdx]} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DisplayScreen;
