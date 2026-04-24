/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { 
  CloudSun, MapPin, AlertCircle, Zap, Activity, Monitor, Clock as ClockIcon, RefreshCw
} from 'lucide-react';
import FrameManager from '../components/display/FrameManager';
import WeatherWidget from '../components/display/WeatherWidget';
import TickerEngine from '../components/display/TickerEngine';



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
  const [time, setTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const lastFetchRef = useRef(0);

  // Capture token from URL and persist
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("screenToken", token);
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams]);

  const getTelemetry = () => {
    const telemetry = {
        uptime: Math.round(performance.now() / 1000),
    };
    if (window.performance && window.performance.memory) {
        telemetry.ramUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
    }
    return telemetry;
  };

  const fetchData = useCallback(async () => {
    // Issue 4.1 Fix: Throttle fetches to once every 3 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 3000) return;
    lastFetchRef.current = now;

    await Promise.resolve();
    let token = localStorage.getItem('screenToken');
    if (!token) {
      token = searchParams.get("token");
    }

    const authConfig = {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };

    setIsSyncing(true);
    try {
      // Use the new Manifest-Only API (Issue 4.2 Fix)
      if (token) {
        const manifestRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens/manifest`, authConfig);
        const { screen, playlist: newPlaylist, tickers: newTickers, settings: newSettings, media: newMedia } = manifestRes.data;
        
        setScreenInfo(screen);

        // Issue 5.1 Fix: Deep compare playlist IDs to prevent unnecessary restarts
        const currentIds = playlist.map(p => p.id || p._id).join(',');
        const newIds = newPlaylist.map(p => p.id || p._id).join(',');

        if (newIds !== currentIds) {
          setPlaylist(newPlaylist);
          setCurrentIdx(0);
        }

        setTickers(newTickers);
        setSettings(newSettings);
        setAllMedia(newMedia);
      } else {
        // Fallback for screens without tokens (legacy or initial setup)
        const screenId = searchParams.get('screenId');
        const [playlistRes, mediaRes, tickerRes, settingsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/schedule/active${screenId ? `?screenId=${screenId}` : ''}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/media`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/ticker/active`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/settings`)
        ]);

        setPlaylist(playlistRes.data);
        setAllMedia(mediaRes.data);
        setTickers(tickerRes.data);
        setSettings(settingsRes.data);
      }

    } catch (err) {
      console.error("Data sync error", err);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setIsInitialLoading(false);
      }, 1500);
    }
  }, [searchParams, playlist]);

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
        const { screen, playlist: newPlaylist, tickers: newTickers, settings: newSettings, media: newMedia } = manifest;
        
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
    });

    // Legacy fallback listeners
    socket.on('contentUpdate', fetchData);
    socket.on('scheduleUpdated', fetchData);
    socket.on('tickerUpdate', fetchData);
    socket.on('connect', () => {
        console.log("🟢 Socket connected, syncing manifest...");
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
            const mappedMediaId = mapping[zone.i];
            const mappedMedia = allMedia.find(m => (m.id === mappedMediaId || m._id === mappedMediaId)) || 
                                (item.populatedMapping && item.populatedMapping[zone.i]);
            
            // Issue 1.1 Fix: Clamp coordinates and dimensions to prevent overflow
            const rawX = Math.max(0, Math.min(zone.x || 0, 11));
            const rawY = Math.max(0, Math.min(zone.y || 0, 11));
            const rawW = Math.max(1, Math.min(zone.w || 12, 12 - rawX));
            const rawH = Math.max(1, Math.min(zone.h || 12, 12 - rawY));

            const left = (rawX / 12) * 100;
            const top = (rawY / 12) * 100;
            const width = (rawW / 12) * 100;
            const height = (rawH / 12) * 100;
            
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
                {zone.type === 'ticker' ? (
                  <TickerEngine ticker={tickers.find(t => (t.id === mappedMediaId || t._id === mappedMediaId))} />
                ) : (
                  <FrameManager 
                    item={mappedMedia} 
                    zoneId={zone.i}
                    onMediaError={() => {
                        // For multi-frame, we don't necessarily want to skip the WHOLE layout
                        // but maybe we should if the main frame fails.
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    const singleMedia = item.mediaId || item;

    return (
      <div className="w-full h-full p-12 animate-fade-in relative z-10">
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

  const idleWallpaper = allMedia.find(m => (m.id === settings.idleWallpaperId || m._id === settings.idleWallpaperId));

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
        <p className="text-[10px] text-text/20 uppercase font-black tracking-[4px] mt-4">Establishing Secure Node Connection</p>
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
      <div className="h-56 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-24 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${isSyncing ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]'} animate-pulse`} />
            <span className="text-[12px] font-black uppercase tracking-[12px] text-text/90">Live</span>
          </div>
          {(screenInfo || searchParams.get('screenId')) && (
            <div className="px-6 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
               <Monitor size={16} className="text-text/20" />
               <span className="text-[12px] font-black text-text/40 uppercase tracking-[4px]">
                 {screenInfo ? screenInfo.name : searchParams.get('screenId').slice(-8)}
               </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-16">
          <WeatherWidget location={screenInfo?.location} />
          <div className="h-24 w-px bg-white/10" />
          <div className="flex items-center gap-8">
             <div className="text-right">
                <p className="text-[7rem] font-black tracking-tighter tabular-nums leading-none text-text drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
                <p className="text-2xl font-black uppercase tracking-[8px] text-text/40 mt-3 flex items-center justify-end gap-3">
                   <ClockIcon size={20} className="text-blue-400" /> {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
             </div>
             <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                <p className="text-4xl font-black text-blue-500 tabular-nums">{time.toLocaleTimeString([], { second: '2-digit' })}</p>
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
            {idleWallpaper ? (
              <div className="w-full h-full p-16 bg-black">
                <div className="w-full h-full glass overflow-hidden relative shadow-2xl border-white/5">
                  <FrameManager item={idleWallpaper} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                  </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-10 border border-white/10 relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-[40px] blur-2xl group-hover:blur-3xl transition-all" />
                  <Activity size={64} className="text-blue-500 relative z-10 animate-pulse" />
                </div>
                <h2 className="text-8xl font-black tracking-tighter uppercase text-text leading-none">Nexus Engine</h2>
                <p className="text-2xl text-text/20 mt-6 uppercase tracking-[12px] font-black">Standing By for Transmission</p>
              </div>
            )}
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
