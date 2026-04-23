import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { 
  CloudSun, MapPin, AlertCircle, Zap, Activity, Monitor 
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
    <div className="flex items-center gap-4 px-5 py-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <MapPin size={12} className="text-sky-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{area}</span>
      </div>
      <div className="h-3 w-px bg-white/10" />
      <div className="flex items-center gap-2">
        <CloudSun size={14} className="text-amber-400" />
        <span className="text-lg font-black tracking-tighter text-white">{temp}°C</span>
      </div>
    </div>
  );
};

// --- Media Item Component ---
const MediaItem = ({ item }) => {
  if (!item) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 gap-2">
      <AlertCircle className="text-rose-500/50" size={32} />
      <span className="text-[8px] font-black text-rose-500/40 uppercase tracking-[4px]">Media Missing</span>
    </div>
  );

  const apiBase = import.meta.env.VITE_API_URL.replace(/\/$/, '');
  const filePath = item.filePath.startsWith('/') ? item.filePath : `/${item.filePath}`;
  const src = `${apiBase}${filePath}`;

  if (item.fileType === 'video') {
    return <video src={src} autoPlay muted loop className="w-full h-full object-fill bg-black" />;
  }
  
  if (item.fileType === 'pdf') {
    return <iframe src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none bg-white" title={item.fileName} />;
  }

  return <img src={src} alt={item.fileName} className="w-full h-full object-fill bg-black" />;
};

// --- Advanced Ticker Component ---
const TickerDisplay = ({ ticker }) => {
    if (!ticker) return null;

    const style = {
        fontFamily: ticker.fontFamily || 'sans-serif',
        color: ticker.color || '#ffffff',
        backgroundColor: ticker.backgroundColor || 'transparent',
        padding: ticker.padding || '0px',
        fontWeight: ticker.fontWeight || 'normal',
    };

    const isVertical = ticker.direction === 'vertical';
    const animationName = ticker.direction === 'left-right' ? 'ticker-ltr' : (isVertical ? 'ticker-vertical' : 'ticker-rtl');
    const animDuration = Math.max(5, 100 - (ticker.speed || 50)) + 's';

    return (
        <div className="w-full h-full flex items-center overflow-hidden relative" style={{ backgroundColor: style.backgroundColor }}>
            <div 
                className="whitespace-nowrap absolute"
                style={{
                    animation: `${animationName} ${animDuration} linear infinite`,
                    ...style
                }}
            >
                <div className="flex items-center gap-24 px-12">
                    <span className={`tracking-tight ${ticker.fontSize || 'text-4xl'} ${ticker.fontStyle || 'normal'}`}>
                        {ticker.text}
                    </span>
                    {ticker.type === 'link' && ticker.linkUrl && (
                        <div className="px-4 py-1.5 bg-white/10 rounded-lg border border-white/20">
                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={10} /> {ticker.linkUrl.replace(/^https?:\/\//, '')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes ticker-rtl {
                    0% { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                }
                @keyframes ticker-ltr {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100vw); }
                }
                @keyframes ticker-vertical {
                    0% { transform: translateY(100vh); }
                    100% { transform: translateY(-100%); }
                }
            `}</style>
        </div>
    );
};

// --- Main Display Screen ---
const DisplayScreen = () => {
  const [searchParams] = useSearchParams();
  const screenId = searchParams.get('screenId');

  const [playlist, setPlaylist] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [tickers, setTickers] = useState([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);

  const [settings, setSettings] = useState({ idleWallpaperId: '' });
  const [time, setTime] = useState(new Date());
  const [screenLocation, setScreenLocation] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [playlistRes, mediaRes, tickerRes, settingsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedule/active${screenId ? `?screenId=${screenId}` : ''}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/ticker/active${screenId ? `?screenId=${screenId}` : ''}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings`)
      ]);

      if (playlistRes.data.length !== playlist.length) setCurrentIdx(0);
      if (tickerRes.data.length !== tickers.length) setCurrentTickerIdx(0);

      setPlaylist(playlistRes.data);
      setAllMedia(mediaRes.data);
      setTickers(tickerRes.data);
      setSettings(settingsRes.data);

      if (screenId) {
        const screenRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens`);
        const thisScreen = screenRes.data.find(s => s.id === screenId);
        if (thisScreen?.location) setScreenLocation(thisScreen.location);
      }
    } catch (err) {} finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  }, [screenId, playlist.length, tickers.length]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    fetchData();

    const t = setInterval(() => setTime(new Date()), 1000);
    const f = setInterval(fetchData, 300000);

    const hb = setInterval(() => {
        if (screenId) socket.emit('screenPing', { screenId });
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
  }, [fetchData, screenId]);

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
        <div className="w-full h-full relative animate-fade-in bg-black">
          {layout.map((zone) => {
            const mappedMediaId = mapping[zone.i];
            const mappedMedia = allMedia.find(m => (m.id === mappedMediaId || m._id === mappedMediaId));
            
            // Convert grid coords (12x12 system if used) to percentages, or direct percentages if provided
            const left = zone.x !== undefined ? (zone.x <= 12 ? (zone.x / 12) * 100 : zone.x) : 0;
            const top = zone.y !== undefined ? (zone.y <= 12 ? (zone.y / 12) * 100 : zone.y) : 0;
            const width = zone.w !== undefined ? (zone.w <= 12 ? (zone.w / 12) * 100 : zone.width || 100) : 100;
            const height = zone.h !== undefined ? (zone.h <= 12 ? (zone.h / 12) * 100 : zone.height || 100) : 100;
            const zIndex = zone.zIndex || 1;

            return (
              <div 
                key={zone.i} 
                className="absolute overflow-hidden border border-white/5"
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
      <div className="w-full h-full p-8 animate-fade-in">
        <div className="w-full h-full glass overflow-hidden shadow-2xl relative border-white/5 bg-black/50">
          <MediaItem item={item} />
        </div>
      </div>
    );
  };

  const idleWallpaper = allMedia.find(m => (m.id === settings.idleWallpaperId || m._id === settings.idleWallpaperId));

  return (
    <div className="fixed inset-0 w-full h-full bg-[var(--bg)] overflow-hidden flex flex-col text-[var(--text)] select-none font-sans">
      {/* Header */}
      <div className="h-20 bg-black/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-10 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isSyncing ? 'bg-sky-500' : 'bg-emerald-500'} shadow-[0_0_15px_rgba(16,185,129,0.4)]`} />
            <span className="text-[10px] font-black uppercase tracking-[8px] text-white/90">
              {isSyncing ? 'Syncing' : 'Live'}
            </span>
          </div>
          {screenId && (
            <div className="px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
               <Monitor size={12} className="text-slate-500" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{screenId.slice(-6)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <Weather location={screenLocation} />
          <div className="h-10 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-3xl font-black tracking-tighter tabular-nums leading-none text-white">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <span className="text-lg opacity-40 ml-1">{time.toLocaleTimeString([], { second: '2-digit' })}</span>
            </p>
            <p className="text-[9px] font-black uppercase tracking-[4px] text-slate-500 mt-1">
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-black z-10">
        {playlist.length > 0 ? (
          <div key={playlist[currentIdx]?.id} className="w-full h-full relative">
            {renderMediaContent(playlist[currentIdx])}
          </div>
        ) : (
          <div className="w-full h-full relative z-10 animate-fade-in">
            {idleWallpaper ? (
              <div className="w-full h-full p-8 bg-black/20">
                <div className="w-full h-full glass overflow-hidden relative shadow-2xl border-white/5">
                  <MediaItem item={idleWallpaper} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center text-white">
                <Activity className="text-sky-500 opacity-50 mb-8" size={64}/>
                <h2 className="text-6xl font-black tracking-tighter uppercase">Standing By</h2>
                <p className="text-xl text-slate-400 mt-4 uppercase tracking-[4px]">No active broadcast schedules</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Standalone Global/Screen Ticker */}
      {tickers.length > 0 && (
          <div className="h-24 flex items-center overflow-hidden z-50 border-t border-white/10 bg-black">
             <TickerDisplay ticker={tickers[currentTickerIdx]} />
          </div>
      )}
    </div>
  );
};

export default DisplayScreen;
