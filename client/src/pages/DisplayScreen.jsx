import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { 
  CloudSun, MapPin, AlertCircle, Zap, Activity, Monitor, Clock as ClockIcon
} from 'lucide-react';

// --- Weather Component ---
const Weather = ({ location }) => {
  const [temp, setTemp] = useState('--');
  const [area, setArea] = useState(location || 'Detecting...');
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const fetchWeather = useCallback(async () => {
    try {
      let city = location || '';
      if (!city) {
        try {
          const geoRes = await axios.get('https://ipapi.co/json/');
          if (geoRes.data?.city) {
            city = geoRes.data.city;
            setArea(city);
          }
        } catch (e) {}
      }

      if (apiKey && city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
        const res = await axios.get(url);
        setTemp(Math.round(res.data.main.temp));
        setArea(res.data.name);
      } else {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=%t+%C`);
        setTemp(res.data.split(' ')[0].replace('+', ''));
      }
    } catch (err) {}
  }, [location, apiKey]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return (
    <div className="flex items-center gap-6 px-6 py-2 bg-white/5 rounded-[20px] border border-white/10 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <MapPin size={14} className="text-blue-400" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[2px] text-white/60 truncate max-w-[150px]">{area}</span>
      </div>
      <div className="h-6 w-px bg-white/10" />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <CloudSun size={16} className="text-amber-400" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-white tabular-nums">{temp}°C</span>
      </div>
    </div>
  );
};

// --- Media Item Component ---
const MediaItem = ({ item }) => {
  const videoRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, []);

  if (!item) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 gap-4">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
        <AlertCircle className="text-rose-500/50" size={32} />
      </div>
      <span className="text-[10px] font-black text-rose-500/40 uppercase tracking-[6px]">Asset Missing</span>
    </div>
  );

  const apiBase = import.meta.env.VITE_API_URL.replace(/\/$/, '');
  const filePath = item.filePath.startsWith('/') ? item.filePath : `/${item.filePath}`;
  const src = `${apiBase}${filePath}`;

  if (item.fileType === 'video') {
    return (
      <div className="w-full h-full relative bg-black">
        <video 
          ref={videoRef}
          src={src} 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-fill shadow-2xl" 
        />
      </div>
    );
  }
  
  if (item.fileType === 'pdf') {
    return <iframe src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none bg-white shadow-2xl pointer-events-none" title={item.fileName} />;
  }

  return <img src={src} alt={item.fileName} className="w-full h-full object-fill bg-black shadow-2xl" />;
};

// --- Advanced Ticker Component ---
const TickerDisplay = ({ ticker }) => {
    if (!ticker) return null;

    const fontSizeMap = {
        'text-xs': '0.75rem',
        'text-sm': '0.875rem',
        'text-base': '1rem',
        'text-lg': '1.125rem',
        'text-xl': '1.25rem',
        'text-2xl': '1.5rem',
        'text-3xl': '1.875rem',
        'text-4xl': '2.25rem',
        'text-5xl': '3rem',
        'text-6xl': '3.75rem',
        'text-7xl': '4.5rem',
        'text-8xl': '6rem',
        'text-9xl': '8rem',
    };

    const resolvedFontSize = fontSizeMap[ticker.fontSize] || ticker.fontSize || '2.25rem';

    const style = {
        fontFamily: ticker.fontFamily || 'sans-serif',
        color: ticker.color || '#ffffff',
        backgroundColor: ticker.backgroundColor || 'transparent',
        padding: ticker.padding || '0px',
        fontWeight: ticker.fontWeight || 'bold',
        fontSize: resolvedFontSize
    };

    const isVertical = ticker.direction === 'vertical';
    const animationName = ticker.direction === 'left-right' ? 'ticker-ltr' : (isVertical ? 'ticker-vertical' : 'ticker-rtl');
    const animDuration = Math.max(5, 100 - (ticker.speed || 50)) + 's';

    const TickerContent = () => (
        <div className="flex items-center gap-32 px-16">
            <span className="tracking-tight uppercase font-black">
                {ticker.text}
            </span>
            {ticker.type === 'link' && ticker.linkUrl && (
                <div className="px-6 py-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                    <span className="text-[12px] font-black text-blue-400 uppercase tracking-[4px] flex items-center gap-3" style={{ fontSize: '1rem' }}>
                        <Zap size={14} className="animate-pulse" /> {ticker.linkUrl.replace(/^https?:\/\//, '')}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full h-full flex items-center overflow-hidden relative shadow-inner" style={{ backgroundColor: style.backgroundColor }}>
            <div 
                className="whitespace-nowrap absolute flex items-center"
                style={{
                    animation: `${animationName} ${animDuration} linear infinite`,
                    ...style
                }}
            >
                <TickerContent />
                <TickerContent />
                <TickerContent />
                <TickerContent />
            </div>
        </div>
    );
};

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

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('screenToken');
    const screenId = searchParams.get('screenId'); // Fallback for legacy

    const authConfig = {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };

    setIsSyncing(true);
    try {
      // 1. Identify Screen (if token exists)
      if (token) {
        try {
          const meRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens/me`, authConfig);
          setScreenInfo(meRes.data);
        } catch (e) {
          console.error("Identity verification failed", e);
        }
      }

      // 2. Fetch Playlist (Assignments)
      const scheduleUrl = token 
        ? `${import.meta.env.VITE_API_URL}/api/schedule/me`
        : `${import.meta.env.VITE_API_URL}/api/schedule/active${screenId ? `?screenId=${screenId}` : ''}`;

      const [playlistRes, mediaRes, tickerRes, settingsRes] = await Promise.all([
        axios.get(scheduleUrl, authConfig),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`, authConfig),
        axios.get(`${import.meta.env.VITE_API_URL}/api/ticker/active`, authConfig),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings`)
      ]);

      if (playlistRes.data.length !== playlist.length) setCurrentIdx(0);
      if (tickerRes.data.length !== tickers.length) setCurrentTickerIdx(0);

      setPlaylist(playlistRes.data);
      setAllMedia(mediaRes.data);
      setTickers(tickerRes.data);
      setSettings(settingsRes.data);

    } catch (err) {
      console.error("Data sync error", err);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setIsInitialLoading(false);
      }, 1500);
    }
  }, [searchParams, playlist.length, tickers.length]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    fetchData();

    const t = setInterval(() => setTime(new Date()), 1000);
    const f = setInterval(fetchData, 300000);

    const hb = setInterval(() => {
        const token = localStorage.getItem('screenToken');
        const screenId = searchParams.get('screenId');
        if (token) {
            socket.emit('screenPing', { token });
        } else if (screenId) {
            socket.emit('screenPing', { screenId });
        }
    }, 10000);

    socket.on('contentUpdate', fetchData);
    socket.on('scheduleUpdated', fetchData);
    socket.on('tickerUpdate', fetchData);

    return () => {
      clearInterval(t);
      clearInterval(f);
      clearInterval(hb);
      socket.disconnect();
    };
  }, [fetchData, searchParams]);

  // Playlist Engine
  useEffect(() => {
    if (playlist.length > 1) {
      const duration = playlist[currentIdx]?.duration || 10;
      const t = setTimeout(() => setCurrentIdx((prev) => (prev + 1) % playlist.length), duration * 1000);
      return () => clearTimeout(t);
    } else {
      if (currentIdx !== 0) setCurrentIdx(0);
    }
  }, [currentIdx, playlist]);

  // Ticker Engine
  useEffect(() => {
    if (tickers.length > 1) {
      const t = setTimeout(() => setCurrentTickerIdx((prev) => (prev + 1) % tickers.length), 15000);
      return () => clearTimeout(t);
    } else {
        if (currentTickerIdx !== 0) setCurrentTickerIdx(0);
    }
  }, [currentTickerIdx, tickers]);

  const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  const renderMediaContent = (item) => {
    if (!item) return null;
    
    const layout = item.layout ? safeParse(item.layout) : null;
    const mapping = item.mediaMapping ? safeParse(item.mediaMapping, {}) : {};

    // Multi-Frame Engine rendering
    if (layout && layout.length > 0) {
      return (
        <div className="w-full h-full relative animate-fade-in">
          {layout.map((zone) => {
            const mappedMediaId = mapping[zone.i];
            const mappedMedia = allMedia.find(m => (m.id === mappedMediaId || m._id === mappedMediaId));
            
            const left = zone.x !== undefined ? (zone.x <= 12 ? (zone.x / 12) * 100 : zone.x) : 0;
            const top = zone.y !== undefined ? (zone.y <= 12 ? (zone.y / 12) * 100 : zone.y) : 0;
            const width = zone.w !== undefined ? (zone.w <= 12 ? (zone.w / 12) * 100 : zone.width || 100) : 100;
            const height = zone.h !== undefined ? (zone.h <= 12 ? (zone.h / 12) * 100 : zone.height || 100) : 100;
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
                  zIndex: zIndex
                }}
              >
                {zone.type === 'ticker' ? (
                  <TickerDisplay ticker={tickers.find(t => t.id === mappedMediaId)} />
                ) : (
                  <MediaItem item={mappedMedia} />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="w-full h-full p-12 animate-fade-in relative z-10">
        <div className="w-full h-full glass overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative border-white/5 bg-black">
          <MediaItem item={item} />
        </div>
      </div>
    );
  };

  const idleWallpaper = allMedia.find(m => (m.id === settings.idleWallpaperId || m._id === settings.idleWallpaperId));

  if (isInitialLoading) return (
    <div className="fixed inset-0 bg-[#0B1220] flex items-center justify-center z-[100] font-sans">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-10">
          <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Activity size={32} className="text-blue-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-[12px] animate-pulse">Nexus Intelligence</h2>
        <p className="text-[10px] text-white/20 uppercase font-black tracking-[4px] mt-4">Establishing Secure Node Connection</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0B1220] overflow-hidden flex flex-col text-white select-none font-sans bg-drift">
      {/* Cinematic Background Gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <div className="h-32 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-16 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${isSyncing ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]'} animate-pulse`} />
            <span className="text-[12px] font-black uppercase tracking-[12px] text-white/90">Live</span>
          </div>
          {(screenInfo || searchParams.get('screenId')) && (
            <div className="px-6 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
               <Monitor size={16} className="text-white/20" />
               <span className="text-[12px] font-black text-white/40 uppercase tracking-[4px]">
                 {screenInfo ? screenInfo.name : searchParams.get('screenId').slice(-8)}
               </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-12">
          <Weather location={screenInfo?.location} />
          <div className="h-16 w-px bg-white/10" />
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-6xl font-black tracking-tighter tabular-nums leading-none text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
                <p className="text-[12px] font-black uppercase tracking-[8px] text-white/20 mt-3 flex items-center justify-end gap-2">
                   <ClockIcon size={12} /> {time.toLocaleDateString([], { weekday: 'long' })}
                </p>
             </div>
             <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <p className="text-2xl font-black text-blue-500 tabular-nums">{time.toLocaleTimeString([], { second: '2-digit' })}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden z-10">
        {playlist.length > 0 ? (
          <div key={playlist[currentIdx]?.id} className="w-full h-full relative transition-all duration-1000">
            {renderMediaContent(playlist[currentIdx])}
          </div>
        ) : (
          <div className="w-full h-full relative z-10 animate-fade-in flex items-center justify-center">
            {idleWallpaper ? (
              <div className="w-full h-full p-16 bg-black">
                <div className="w-full h-full glass overflow-hidden relative shadow-2xl border-white/5">
                  <MediaItem item={idleWallpaper} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                  </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-10 border border-white/10 relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-[40px] blur-2xl group-hover:blur-3xl transition-all" />
                  <Activity size={64} className="text-blue-500 relative z-10 animate-pulse" />
                </div>
                <h2 className="text-8xl font-black tracking-tighter uppercase text-white leading-none">Nexus Engine</h2>
                <p className="text-2xl text-white/20 mt-6 uppercase tracking-[12px] font-black">Standing By for Transmission</p>
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
             <TickerDisplay ticker={tickers[currentTickerIdx]} />
          </div>
      )}
    </div>
  );
};

export default DisplayScreen;
