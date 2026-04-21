import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Clock, ShieldCheck, Zap, Activity, Monitor, CloudSun, MapPin } from 'lucide-react';

const Weather = ({ location }) => {
  const [temp, setTemp] = useState('--');
  const [area, setArea] = useState(location || 'Detecting...');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let query = location || '';
        
        if (!query) {
          try {
            const geoRes = await axios.get('https://ipapi.co/json/');
            if (geoRes.data && geoRes.data.city) {
              query = geoRes.data.city;
              setArea(query);
            }
          } catch (e) { console.error('Geo detection error:', e); }
        }

        const res = await axios.get(`https://wttr.in/${encodeURIComponent(query)}?format=j1`);
        const data = res.data.current_condition[0];
        setTemp(data.temp_C);
        
        if (!location && !query) {
          setArea(res.data.nearest_area[0].areaName[0].value);
        } else if (location) {
          setArea(location);
        }
      } catch (err) { 
        console.error('Weather error:', err);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [location]);

  return (
    <div className="flex items-center gap-4 px-5 py-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <MapPin size={12} className="text-sky-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{area}</span>
      </div>
      <div className="h-3 w-px bg-white/10" />
      <div className="flex items-center gap-2">
        <CloudSun size={14} className="text-amber-400" />
        <span className="text-lg font-black tracking-tighter">{temp}°C</span>
      </div>
    </div>
  );
};

const quotes = [
  { text: "Safety is not a gadget, but a state of mind.", author: "Factory Protocol" },
  { text: "Quality is doing it right when no one is looking.", author: "Industrial Standard" },
  { text: "Excellence is an art won by training and habituation.", author: "Plant Operations" },
  { text: "Tomorrow: Your reward for working safely today.", author: "Safety First" }
];

const safeParse = (data, fallback = []) => {
  if (!data) return fallback;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

const DisplayScreen = () => {
  const [activeMedia, setActiveMedia] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ticker, setTicker] = useState({ text: '', speed: 5, isActive: 1, fontSize: 'text-4xl', fontStyle: 'normal' });
  const [settings, setSettings] = useState({ idleWallpaperId: '' });
  const [time, setTime] = useState(new Date());
  const [motivationIdx, setMotivationIdx] = useState(0);
  const [screenLocation, setScreenLocation] = useState('');

  const screenId = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('screenId');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, mediaRes, tickerRes, settingsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedule/active${screenId ? `?screenId=${screenId}` : ''}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings`)
      ]);
      setActiveMedia(schedRes.data);
      setAllMedia(mediaRes.data);
      setTicker(prev => ({ ...prev, ...tickerRes.data }));
      setSettings(settingsRes.data);

      if (screenId) {
        const screenRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens`);
        const thisScreen = screenRes.data.find(s => s.id === screenId);
        if (thisScreen && thisScreen.location) {
          setScreenLocation(thisScreen.location);
        }
        await axios.put(`${import.meta.env.VITE_API_URL}/api/screens/${screenId}/status`, { status: 'online' });
      }
    } catch (err) { console.error(err); }
  }, [screenId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    fetchData();

    const t = setInterval(() => setTime(new Date()), 1000);
    const m = setInterval(() => setMotivationIdx(i => (i + 1) % quotes.length), 10000);
    const f = setInterval(fetchData, 30000); // Auto-fetch fallback every 30s

    socket.on('contentUpdate', fetchData);
    socket.on('tickerUpdate', (data) => setTicker(prev => ({ ...prev, ...data })));

    return () => {
      clearInterval(t);
      clearInterval(m);
      clearInterval(f);
      socket.disconnect();
    };
  }, [fetchData]);

  useEffect(() => {
    if (activeMedia.length > 1) {
      const duration = activeMedia[currentIdx]?.duration || 10;
      const t = setTimeout(() => {
        setCurrentIdx((currentIdx + 1) % activeMedia.length);
      }, duration * 1000);
      return () => clearTimeout(t);
    }
  }, [currentIdx, activeMedia]);

  const MediaItem = ({ item }) => {
    if (!item) return null;
    const src = `${import.meta.env.VITE_API_URL}/${item.filePath}`;
    if (item.fileType === 'video') return <video src={src} autoPlay muted loop className="w-full h-full object-cover" />;
    if (item.fileType === 'pdf') return <iframe src={`${src}#toolbar=0`} className="w-full h-full border-none" title={item.fileName} />;
    return <img src={src} alt={item.fileName} className="w-full h-full object-cover" />;
  };

  const renderMedia = (media) => {
    const layout = media.layout ? safeParse(media.layout) : null;
    const mapping = media.mediaMapping ? safeParse(media.mediaMapping, {}) : {};

    if (layout && layout.length > 0) {
      return (
        <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-6 p-6">
          {layout.map((zone) => {
            const mappedMediaId = mapping[zone.i];
            const mappedMedia = allMedia.find(m => m.id === mappedMediaId);

            return (
              <div key={zone.i} className="relative glass overflow-hidden shadow-2xl"
                style={{ gridColumn: `span ${zone.w}`, gridRow: `span ${zone.h}`, gridColumnStart: zone.x + 1, gridRowStart: zone.y + 1 }}>
                <MediaItem item={mappedMedia} />
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white border border-white/10 uppercase">{zone.i}</div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="w-full h-full p-8">
        <div className="w-full h-full glass overflow-hidden shadow-2xl relative">
          <MediaItem item={media} />
        </div>
      </div>
    );
  };

  const idleWallpaper = allMedia.find(m => m.id === settings.idleWallpaperId);

  return (
    <div className="h-screen w-screen bg-[var(--bg)] overflow-hidden flex flex-col text-[var(--text)] select-none font-sans">
      {/* Header */}
      <div className="h-20 bg-black/20 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-10 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
          <span className="text-[10px] font-black uppercase tracking-[8px] text-white/90">Live</span>
        </div>
        <div className="flex items-center gap-8">
          <Weather location={screenLocation} />
          <div className="h-10 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-3xl font-black tracking-tighter tabular-nums leading-none">
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
        <div className="absolute inset-0 grid-bg opacity-20" />

        {activeMedia.length > 0 ? (
          <div className="w-full h-full animate-fade-in relative z-10">
            {renderMedia(activeMedia[currentIdx])}
            <div className="absolute bottom-12 right-12 flex flex-col items-end gap-3 z-30">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-2xl shadow-2xl">
                <p className="text-[9px] font-black uppercase tracking-[6px] text-sky-400 mb-1">Manifest</p>
                <p className="text-xl font-extrabold uppercase tracking-tight">{activeMedia[currentIdx].templateName || activeMedia[currentIdx].fileName}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative z-10 animate-fade-in">
            {idleWallpaper ? (
              <div className="w-full h-full p-8">
                <div className="w-full h-full glass overflow-hidden relative shadow-2xl border-white/5">
                  <MediaItem item={idleWallpaper} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-12 left-12">
                    <div className="flex items-center gap-4 mb-4">
                      <Monitor className="text-sky-400" size={32} />
                      <h2 className="text-5xl font-black tracking-tighter uppercase">Idle Screen</h2>
                    </div>
                    <p className="text-lg font-medium text-slate-300 max-w-2xl">Standing by for next mission broadcast. The station remains at high readiness.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center">
                <div className="space-y-12 max-w-5xl">
                  <div className="inline-block px-8 py-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl shadow-[0_0_40px_rgba(14,165,233,0.1)]">
                    <p className="text-xl font-black tracking-[12px] uppercase text-sky-400">Operations Mode</p>
                  </div>
                  <h2 className="text-9xl font-black tracking-tighter leading-[0.85] uppercase">
                    Safety <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Excellence</span><br />
                    Standard
                  </h2>
                  <div className="h-1.5 w-64 bg-sky-500/20 mx-auto rounded-full" />
                  <div className="space-y-4">
                    <p className="text-4xl font-bold tracking-tight text-slate-300 italic">"{quotes[motivationIdx].text}"</p>
                    <p className="text-xs uppercase tracking-[6px] font-black text-slate-500">Source: {quotes[motivationIdx].author}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Ticker */}
      <div className="h-24 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex items-center overflow-hidden z-20">
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="flex gap-24 whitespace-nowrap animate-ticker" style={{ animationDuration: ticker.isActive ? `${Math.max(5, 60 - ticker.speed * 5)}s` : '0s' }}>
            <div className="flex items-center gap-24">
              <div className="flex items-center gap-12">
                <span className={`text-white font-bold tracking-tight ${ticker.fontSize} ${ticker.fontStyle === 'bold' ? 'font-black' : ticker.fontStyle === 'bold-italic' ? 'font-black italic' : ticker.fontStyle}`}>
                  {ticker.text || 'BROADCAST ACTIVE // READY FOR DATA TRANSMISSION...'}
                </span>
                {ticker.type === 'link' && ticker.linkUrl && (
                  <div className="px-4 py-1.5 bg-white/10 rounded-lg border border-white/10">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Source: {ticker.linkUrl}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Duplicated for seamless loop */}
            <div className="flex items-center gap-24">
              <div className="flex items-center gap-12">
                <span className={`text-white font-bold tracking-tight ${ticker.fontSize} ${ticker.fontStyle === 'bold' ? 'font-black' : ticker.fontStyle === 'bold-italic' ? 'font-black italic' : ticker.fontStyle}`}>
                  {ticker.text || 'BROADCAST ACTIVE // READY FOR DATA TRANSMISSION...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
