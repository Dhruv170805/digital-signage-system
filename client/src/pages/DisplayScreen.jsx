/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { 
  CloudSun, MapPin, AlertCircle, Zap, Activity, Monitor, Clock as ClockIcon, RefreshCw, ShieldAlert, QrCode, WifiOff
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

  const lastFetchRef = useRef(0);

  // Capture token from URL and persist
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("screenToken", token);
      console.log("🔑 New device token anchored to localStorage");
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      window.location.reload(); // Refresh to apply token to initial fetch
    }
  }, [searchParams]);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
    };
    if (window.performance && window.performance.memory) {
        telemetry.ramUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
    }
    return telemetry;
  };

  const saveToLocalCache = (data) => {
    try { localStorage.setItem('nexus_manifest_cache', JSON.stringify(data)); } catch (e) {}
  };

  const loadFromLocalCache = () => {
    try {
      const cached = localStorage.getItem('nexus_manifest_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  };

  const fetchData = useCallback(async () => {
    // Issue 4.1 Fix: Throttle fetches to once every 3 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 3000) return;
    lastFetchRef.current = now;

    await Promise.resolve();
    let token = localStorage.getItem('screenToken');

    const authConfig = {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };

    setIsSyncing(true);
    try {
      if (token) {
        const manifestRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens/manifest`, authConfig);
        const { screen, playlist: newPlaylist, tickers: newTickers, settings: newSettings, media: newMedia, idleMedia: newIdleMedia, idleConfig: newIdleConfig } = manifestRes.data;
        
        setScreenInfo(screen);
        
        saveToLocalCache(manifestRes.data);
        setIsOffline(false);

        // Deep compare playlist IDs to prevent unnecessary restarts
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
      }
    } catch (err) {
      console.error("Data sync error", err);
      
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
         localStorage.removeItem('screenToken');
         setError('IDENTITY_REVOKED');
         return;
      }

      setIsOffline(true);
      const cached = loadFromLocalCache();
      if (cached) {
         setPlaylist(cached.playlist || []);
         setTickers(cached.tickers || []);
         setSettings(cached.settings || {});
         setAllMedia(cached.media || []);
         setIdleMedia(cached.idleMedia || null);
         setIdleConfig(cached.idleConfig || null);
      }
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setIsInitialLoading(false);
      }, 1500);
    }
  }, [playlist]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    fetchData();

    const t = setInterval(() => setTime(new Date()), 1000);
    
    // Issue 6.1 Fix: Remove heavy interval and move to event-driven push
    // Jittered fetch is still good as a "safety net" but can be much rarer (e.g., once an hour)
    const safetyNetInterval = 3600000 + (Math.random() * 60000);
    const f = setInterval(fetchData, safetyNetInterval);

    const hb = setInterval(() => {
        const token = localStorage.getItem('screenToken');
        const screenId = searchParams.get('screenId');
        const telemetry = getTelemetry();

        if (token) {
            socket.emit('screenPing', { token, telemetry });
        } else if (screenId) {
            socket.emit('screenPing', { screenId, telemetry });
        }

        // Memory Leak Prevention: Force reload at 3 AM
        const now = new Date();
        if (now.getHours() === 3 && now.getMinutes() === 0 && now.getSeconds() < 10) {
            console.log("🕒 3 AM Maintenance: Purging memory via hard reload...");
            window.location.reload();
        }
    }, 10000);

    // Delta-based Push Logic
    socket.on('manifestUpdate', (manifest) => {
        console.log("⚡ Received instant manifest push from server");
        const { screen, playlist: newPlaylist, tickers: newTickers, settings: newSettings, media: newMedia, idleMedia: newIdleMedia, idleConfig: newIdleConfig } = manifest;
        
        setScreenInfo(screen);

        const currentIds = playlist.map(p => p.id || p._id).join(',');
        const newIds = newPlaylist.map(p => p.id || p._id).join(',');

        if (newIds !== currentIds) {
          setPlaylist(newPlaylist);
          setCurrentIdx(0);
        }

        setTickers(newTickers);
        setSettings(newSettings);
        setAllMedia(newMedia);
        setIdleMedia(newIdleMedia);
        setIdleConfig(newIdleConfig);
    });

    // Legacy fallback listeners
    socket.on('contentUpdate', fetchData);
    socket.on('scheduleUpdated', fetchData);
    socket.on('tickerUpdate', fetchData);
    socket.on('connect', () => {
        console.log("🟢 Socket connected, syncing manifest...");
        const token = localStorage.getItem('screenToken');
        const screenId = searchParams.get('screenId');
        const telemetry = getTelemetry();

        if (token) {
            socket.emit('screenPing', { token, telemetry });
        } else if (screenId) {
            socket.emit('screenPing', { screenId, telemetry });
        }
        fetchData();
    });

    return () => {
      clearInterval(t);
      clearInterval(f);
      clearInterval(hb);
      socket.disconnect();
    };
  }, [fetchData, searchParams, playlist]);

  // Playlist Engine
  useEffect(() => {
    if (playlist.length > 1) {
      const duration = playlist[currentIdx]?.duration || 10;
      const t = setTimeout(() => setCurrentIdx((prev) => (prev + 1) % playlist.length), duration * 1000);
      return () => clearTimeout(t);
    } else {
      if (currentIdx !== 0) {
        Promise.resolve().then(() => setCurrentIdx(0));
      }
    }
  }, [currentIdx, playlist]);

  // Ticker Engine
  useEffect(() => {
    if (tickers.length > 1) {
      const t = setTimeout(() => setCurrentTickerIdx((prev) => (prev + 1) % tickers.length), 15000);
      return () => clearTimeout(t);
    } else {
        if (currentTickerIdx !== 0) {
          Promise.resolve().then(() => setCurrentTickerIdx(0));
        }
    }
  }, [currentTickerIdx, tickers]);

  const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  const renderMediaContent = (item) => {
    if (!item) return (
      <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-3xl">
        <Activity className="text-blue-500/20 animate-pulse" size={120} />
      </div>
    );
    
    // Support both flattened and nested (populated) structures
    const layoutSource = item.layout || (item.templateId && item.templateId.layout);
    const layout = layoutSource ? safeParse(layoutSource) : null;
    const mapping = item.mediaMapping ? safeParse(item.mediaMapping, {}) : {};

    // Multi-Frame Engine rendering
    if (layout && layout.length > 0) {
      return (
        <div className="w-full h-full relative animate-fade-in">
          {layout.map((zone) => {
            const mappedItems = mapping[zone.i];
            
            // Support % based positioning (0-100)
            const left = Math.max(0, Math.min(zone.x || 0, 100));
            const top = Math.max(0, Math.min(zone.y || 0, 100));
            const width = Math.max(1, Math.min(zone.w || 100, 100 - left));
            const height = Math.max(1, Math.min(zone.h || 100, 100 - top));
            
            const zIndex = zone.zIndex || 1;

            return (
              <div 
                key={zone.i} 
                className="absolute overflow-hidden"
                style={{ 
                  left: `${left}%`, 
                  top: `${top}%`, 
                  width: `${width}%`, 
                  height: `${height}%`,
                  minWidth: '10px',
                  minHeight: '10px',
                  zIndex: zIndex
                }}
              >
                <LocalFramePlayer 
                    zone={zone} 
                    frameItems={mappedItems} 
                    allMedia={allMedia} 
                    tickers={tickers} 
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (!item) return (
        <div className="w-full h-full p-[3vw] animate-fade-in relative z-10">
          <div className="w-full h-full glass overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative border-white/5 bg-black">
             {renderIdleContent()}
          </div>
        </div>
    );

    const singleMedia = item.mediaId || item;

    return (
      <div className="w-full h-full p-[3vw] animate-fade-in relative z-10">
        <div className="w-full h-full glass overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative border-white/5 bg-black">
          <FrameManager 
            item={singleMedia} 
            onMediaError={() => {
                console.log("⚠️ Fullscreen media failed, skipping...");
                setCurrentIdx((prev) => (playlist.length > 0 ? (prev + 1) % playlist.length : 0));
            }}
          />
        </div>
      </div>
    );
  };

  const renderIdleContent = () => {
    if (idleConfig) {
        const { contentType, content, style } = idleConfig;
        
        if (contentType === 'color') {
            return <div className="w-full h-full" style={{ backgroundColor: content.bgColor || '#000' }} />;
        }
        
        if (contentType === 'text') {
            return (
                <div className="w-full h-full flex items-center justify-center p-[10vw]" style={{ backgroundColor: style.background || 'transparent' }}>
                    <h2 
                        className="font-black text-center leading-tight uppercase tracking-tighter drop-shadow-2xl"
                        style={{ 
                            fontSize: `${style.fontSize || 4}vw`, 
                            color: style.color || '#fff',
                            fontWeight: style.fontWeight || '900',
                            textAlign: style.align || 'center'
                        }}
                    >
                        {content.text}
                    </h2>
                </div>
            );
        }

        if (contentType === 'video' || contentType === 'image') {
            const mockMedia = {
                filePath: content.url,
                fileType: contentType,
                fileName: 'Idle Content'
            };
            return <FrameManager item={mockMedia} />;
        }
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl p-24">
            <Activity className="text-blue-500/20 animate-pulse mb-8" size={160} />
            <h2 className="text-4xl font-black text-white/20 uppercase tracking-[20px] text-center max-w-4xl leading-relaxed">
                Nexus Production Engine: Standby for Transmission
            </h2>
        </div>
    );
  };

  if (error === 'IDENTITY_REVOKED' || (!localStorage.getItem('screenToken') && !searchParams.get('screenId'))) {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[200] font-sans">
            <div className="p-16 glass rounded-[60px] border border-rose-500/20 bg-rose-500/5 max-w-3xl w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 blur-[100px] rounded-full" />
                <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 mx-auto mb-10 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
                    <ShieldAlert size={40} className="text-rose-500 animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Security Clearance Required</h1>
                <p className="text-[12px] font-bold text-rose-200 uppercase tracking-[6px] mb-12 leading-relaxed">This node is currently unlinked from the main network manifest.</p>
                
                <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator Pairing Sequence</p>
                    <div className="bg-white px-8 py-6 rounded-2xl border-4 border-dashed border-slate-200 flex items-center justify-center gap-4">
                        <QrCode size={48} className="text-black"/>
                        <div className="text-left">
                            <p className="text-3xl font-black text-black tracking-tighter uppercase">NEXUS-PAIR</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access control center to authorize</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (isOffline && !playlist.length) {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[200] font-sans">
            <div className="p-16 glass rounded-[60px] border border-amber-500/20 bg-amber-500/5 max-w-3xl w-full text-center shadow-2xl">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 mx-auto mb-10 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                    <WifiOff size={40} className="text-amber-500 animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Network Isolation Detected</h1>
                <p className="text-[12px] font-bold text-amber-200 uppercase tracking-[6px] mb-12 leading-relaxed">Awaiting reconnection to master server. No local cache found.</p>
                <div className="flex items-center justify-center gap-4 text-slate-400">
                    <Activity size={16} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Polling fallback relays...</span>
                </div>
            </div>
        </div>
    );
  }

  if (isInitialLoading) return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center z-[100] font-sans">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-10">
          <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Activity size={32} className="text-blue-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-black text-text uppercase tracking-[12px] animate-pulse">Nexus Intelligence</h2>
        <p className="text-[10px] text-text/20 uppercase font-black tracking-[4px] mt-4">Establishing Secure Screen Connection</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-bg overflow-hidden flex flex-col text-text select-none font-sans bg-drift">
      {/* Cinematic Background Gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <div className="h-[12vh] min-h-[80px] bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-[4vw] z-50">
        <div className="flex items-center gap-[2vw]">
          <div className="flex items-center gap-[1vw]">
            <div className={`w-[1vw] h-[1vw] min-w-[12px] min-h-[12px] rounded-full ${isSyncing ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]'} animate-pulse`} />
            <span className="text-[min(1.5vw,1rem)] font-black uppercase tracking-[min(0.5vw,4px)] text-white/50 whitespace-nowrap">Live</span>
          </div>
          {(screenInfo || searchParams.get('screenId')) && (
            <div className="px-[1.5vw] py-[0.5vh] bg-white/5 rounded-2xl border border-white/10 flex items-center gap-[0.5vw]">
               <Monitor size={16} className="text-text/20 w-[1.5vw] h-[1.5vw] min-w-[14px] min-h-[14px]" />
               <span className="text-[min(1vw,0.75rem)] font-black text-text/40 uppercase tracking-[min(0.2vw,4px)]">
                 {screenInfo ? screenInfo.name : searchParams.get('screenId').slice(-8)}
               </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-[3vw]">
          <WeatherWidget location={screenInfo?.location} />
          <div className="h-[6vh] w-px bg-white/10" />
          <div className="flex items-center gap-[2vw]">
             <div className="text-right">
                <p className="text-[min(6vw,6rem)] font-black tracking-tighter tabular-nums leading-none text-text drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
                <p className="text-[min(1.2vw,1rem)] font-black uppercase tracking-[min(0.5vw,8px)] text-text/40 mt-[1vh] flex items-center justify-end gap-[0.5vw]">
                   <ClockIcon size={20} className="text-blue-400 w-[1.5vw] h-[1.5vw] min-w-[14px] min-h-[14px]" /> {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
             </div>
             <div className="w-[6vw] h-[6vw] min-w-[60px] min-h-[60px] rounded-[1.5vw] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                <p className="text-[min(2vw,2rem)] font-black text-blue-500 tabular-nums">{time.toLocaleTimeString([], { second: '2-digit' })}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden z-10">
        {playlist.length > 0 && currentIdx < playlist.length ? (
          <div className="w-full h-full relative transition-all duration-1000">
            {renderMediaContent(playlist[currentIdx])}
          </div>
        ) : (
          <div className="w-full h-full relative z-10 animate-fade-in flex items-center justify-center">
            <div className="w-full h-full p-16 bg-black">
              <div className="w-full h-full glass overflow-hidden relative shadow-2xl border-white/5">
                {renderIdleContent()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Standalone Global/Screen Ticker */}
      {tickers.length > 0 && (
          <div className="h-32 flex items-center overflow-hidden z-50 border-t border-white/5 bg-black/60 backdrop-blur-3xl relative">
             <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
             <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
             <TickerEngine ticker={tickers[currentTickerIdx]} />
          </div>
      )}
    </div>
  );
};

export default DisplayScreen;
