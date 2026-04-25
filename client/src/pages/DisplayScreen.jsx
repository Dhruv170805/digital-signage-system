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

// --- Main Display Screen ---
const DisplayScreen = () => {
  const [searchParams] = useSearchParams();
  
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
      auth: { token, deviceToken }
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

  const renderMediaContent = (item) => {
    if (!item) return null;
    const layoutSource = item.layout || (item.templateId && item.templateId.layout);
    const layout = layoutSource ? safeParse(layoutSource) : null;
    const mapping = item.mediaMapping ? safeParse(item.mediaMapping, {}) : {};

    if (layout && layout.length > 0) {
      return (
        <div className="w-full h-full relative">
          <div className="w-full h-full relative overflow-hidden bg-slate-950">
            {layout.map((zone) => (
                <div key={zone.i} className="absolute overflow-hidden bg-black/20" style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%`, zIndex: zone.zIndex || 1 }}>
                    <LocalFramePlayer zone={zone} frameItems={mapping[zone.i]} allMedia={allMedia} tickers={tickers} />
                </div>
            ))}
          </div>
        </div>
      );
    }

    const singleMedia = item.mediaId || item;
    return (
      <div className="w-full h-full bg-black">
        <FrameManager item={singleMedia} onMediaError={() => setCurrentIdx((prev) => (prev + 1) % playlist.length)} />
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
    <div className="fixed inset-0 w-full h-full bg-[#020617] overflow-hidden text-white select-none font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[250px] animate-pulse" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[80%] h-[80%] bg-blue-500/5 rounded-full blur-[250px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* STAGE (FULLSCREEN LAYER) */}
      <div ref={transitionRef} className="absolute inset-0 z-10 transition-opacity duration-700 ease-in-out bg-black">
        {playlist.length > 0 && currentIdx < playlist.length ? renderMediaContent(playlist[currentIdx]) : (
          <div className="w-full h-full animate-fade-in relative">{renderIdleContent()}</div>
        )}
      </div>

      {/* OVERLAY LAYER (HUD) */}
      <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between">
        
        {/* TOP HUD (FLOAT) */}
        <div className="w-full pt-[3vh] pb-[6vh] px-[5vw] bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-[4vw]">
                <div className="flex items-center gap-[1.5vw]">
                    <div className={`w-[1.2vw] h-[1.2vw] min-w-[14px] min-h-[14px] rounded-full ${isSyncing ? 'bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)]' : (isOffline ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.8)]' : 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.8)]')} animate-pulse`} />
                    <span className="text-[1.2vw] font-black uppercase tracking-[8px] text-white/50">
                        {isOffline ? 'OFFLINE WARNING' : (isSyncing ? 'SYNCING MANIFEST' : 'BROADCASTING')}
                    </span>
                </div>
                {(screenInfo || searchParams.get('screenId')) && (
                    <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3 backdrop-blur-md">
                        <Monitor size={18} className="text-indigo-400" />
                        <span className="text-[1vw] font-black text-white/70 uppercase tracking-widest">{screenInfo?.name || 'TERMINAL-01'}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-[4vw]">
                <WeatherWidget location={screenInfo?.location} />
                <div className="h-12 w-px bg-white/10" />
                <div className="text-right">
                    <p className="text-[5.5vw] font-black tracking-tighter tabular-nums leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <p className="text-[1vw] font-black uppercase tracking-[8px] text-white/40 mt-2 flex items-center justify-end gap-2"><ClockIcon size={14} className="text-indigo-400" /> {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        </div>

        {/* BOTTOM HUD (TICKER FLOAT) */}
        {tickers.length > 0 && (
            <div className="w-full pb-[4vh] pointer-events-auto">
                <div className="absolute bottom-0 left-0 w-full h-[25vh] bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="h-28 mx-[5vw] mb-4 flex items-center overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/60 to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/60 to-transparent z-10" />
                    <TickerEngine ticker={tickers[currentTickerIdx]} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DisplayScreen;
