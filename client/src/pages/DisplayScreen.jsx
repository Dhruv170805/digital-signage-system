import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { 
  Clock, ShieldCheck, Zap, Activity, Monitor, 
  CloudSun, MapPin, AlertCircle, RefreshCw 
} from 'lucide-react';

// --- Weather Component (Optimized) ---
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
        } catch (e) { /* silent fail */ }
      }

      if (apiKey && city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
        const res = await axios.get(url);
        setTemp(Math.round(res.data.main.temp));
        setArea(res.data.name);
      } else {
        // Fallback to wttr.in with CORS proxy or simple format if needed
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=%t+%C`);
        setTemp(res.data.split(' ')[0].replace('+', ''));
      }
    } catch (err) { 
      console.error('Weather error:', err);
    }
  }, [location, apiKey]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 min
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
    return (
      <video 
        src={src} 
        autoPlay 
        muted 
        loop 
        className="w-full h-full object-contain bg-black" 
        onError={(e) => console.error("Video Load Error", e)}
      />
    );
  }
  
  if (item.fileType === 'pdf') {
    return (
      <iframe 
        src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} 
        className="w-full h-full border-none bg-white" 
        title={item.fileName} 
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={item.fileName} 
      className="w-full h-full object-contain bg-black" 
      onError={(e) => { e.target.src = 'https://via.placeholder.com/1920x1080?text=Asset+Error'; }}
    />
  );
};

// --- Main Display Screen ---
const DisplayScreen = () => {
  const [searchParams] = useSearchParams();
  const screenId = searchParams.get('screenId');

  const [playlist, setPlaylist] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ticker, setTicker] = useState({ text: '', speed: 5, isActive: 1, fontSize: 'text-4xl', fontStyle: 'normal' });
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
        axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings`)
      ]);

      // Reset index if playlist length changed or content significantly changed
      if (playlistRes.data.length !== playlist.length) {
        setCurrentIdx(0);
      }

      setPlaylist(playlistRes.data);
      setAllMedia(mediaRes.data);
      setTicker(prev => ({ ...prev, ...tickerRes.data }));
      setSettings(settingsRes.data);

      if (screenId) {
        const screenRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens`);
        const thisScreen = screenRes.data.find(s => s.id === screenId);
        if (thisScreen?.location) setScreenLocation(thisScreen.location);
      }
    } catch (err) { 
      console.error('Display Data Sync Error:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  }, [screenId, playlist.length]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    fetchData();

    const t = setInterval(() => setTime(new Date()), 1000);
    const f = setInterval(fetchData, 300000); // 5 min fallback sync

    const hb = setInterval(() => {
        if (screenId) socket.emit('screenPing', { screenId });
    }, 10000);

    socket.on('contentUpdate', fetchData);
    socket.on('scheduleUpdated', fetchData);
    socket.on('tickerUpdate', (data) => setTicker(prev => ({ ...prev, ...data })));

    return () => {
      clearInterval(t);
      clearInterval(f);
      clearInterval(hb);
      socket.disconnect();
    };
  }, [fetchData, screenId]);

  // Playlist Rotation Engine
  useEffect(() => {
    if (playlist.length > 1) {
      const duration = playlist[currentIdx]?.duration || 10;
      const t = setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % playlist.length);
      }, duration * 1000);
      return () => clearTimeout(t);
    } else if (playlist.length === 1) {
      if (currentIdx !== 0) setCurrentIdx(0);
    }
  }, [currentIdx, playlist]);

  const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  const renderMediaContent = (item) => {
    if (!item) return null;
    
    const layout = item.layout ? safeParse(item.layout) : null;
    const mapping = item.mediaMapping ? safeParse(item.mediaMapping, {}) : {};

    if (layout && layout.length > 0) {
      return (
        <div className="w-full h-full grid animate-fade-in" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
          {layout.map((zone) => {
            const mappedMediaId = mapping[zone.i];
            const mappedMedia = allMedia.find(m => (m.id === mappedMediaId || m._id === mappedMediaId));
            return (
              <div key={zone.i} className="relative overflow-hidden border border-white/5"
                style={{ gridColumn: `${zone.x + 1} / span ${zone.w}`, gridRow: `${zone.y + 1} / span ${zone.h}` }}>
                <MediaItem item={mappedMedia} />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="w-full h-full p-8 animate-fade-in">
        <div className="w-full h-full glass overflow-hidden shadow-2xl relative border-white/5">
          <MediaItem item={item} />
        </div>
      </div>
    );
  };

  const idleWallpaper = allMedia.find(m => (m.id === settings.idleWallpaperId || m._id === settings.idleWallpaperId));

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div onDoubleClick={handleFullscreen} className="fixed inset-0 w-full h-full bg-[var(--bg)] overflow-hidden flex flex-col text-[var(--text)] select-none font-sans">
      {/* Header */}
      <div className="h-20 bg-black/20 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-10 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isSyncing ? 'bg-sky-500' : 'bg-rose-500'} shadow-[0_0_15px_rgba(244,63,94,0.4)]`} />
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
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10" />

        {playlist.length > 0 ? (
          <div key={playlist[currentIdx]?.id} className="w-full h-full relative z-10">
            {renderMediaContent(playlist[currentIdx])}
          </div>
        ) : (
          <div className="w-full h-full relative z-10 animate-fade-in">
            {idleWallpaper ? (
              <div className="w-full h-full p-8">
                <div className="w-full h-full glass overflow-hidden relative shadow-2xl border-white/5">
                  <MediaItem item={idleWallpaper} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute bottom-16 left-16 max-w-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-sky-500/20 rounded-2xl border border-sky-500/20 backdrop-blur-xl">
                        <Activity className="text-sky-400" size={32} />
                      </div>
                      <h2 className="text-6xl font-black tracking-tighter uppercase text-white leading-none">Ready Mode</h2>
                    </div>
                    <p className="text-xl font-medium text-slate-300 tracking-tight leading-relaxed">
                      Standing by for next mission broadcast. This station remains at high readiness level 1.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center text-white">
                <div className="space-y-12 max-w-5xl">
                  <div className="inline-block px-8 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.1)]">
                    <p className="text-xl font-black tracking-[12px] uppercase text-rose-400">System Idle</p>
                  </div>
                  <h2 className="text-9xl font-black tracking-tighter leading-[0.85] uppercase">
                    Safety <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Excellence</span><br />
                    Protocol
                  </h2>
                  <div className="h-1.5 w-64 bg-white/10 mx-auto rounded-full" />
                  <p className="text-2xl font-bold tracking-tight text-slate-500 uppercase">Awaiting Data Transmission...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticker Footer */}
      <div className="h-24 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex items-center overflow-hidden z-20">
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div 
            className="flex gap-24 whitespace-nowrap animate-ticker" 
            style={{ 
              animationDuration: ticker.isActive ? `${Math.max(5, 60 - ticker.speed * 5)}s` : '0s',
              animationPlayState: ticker.isActive ? 'running' : 'paused'
            }}
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-24">
                <div className="flex items-center gap-12">
                  <span className={`text-white tracking-tight ${ticker.fontSize} ${ticker.fontStyle}`}>
                    {ticker.text || 'BROADCAST ACTIVE // SECURE DATA LINK ESTABLISHED // STANDING BY...'}
                  </span>
                  {ticker.type === 'link' && ticker.linkUrl && (
                    <div className="px-4 py-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                      <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={10} /> {ticker.linkUrl.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
