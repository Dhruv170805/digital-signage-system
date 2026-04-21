import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Clock, ShieldCheck, Zap, Activity } from 'lucide-react';

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
  const [ticker, setTicker] = useState({ text: '', speed: 5, isActive: 1 });
  const [time, setTime] = useState(new Date());
  
  const [motivationIdx, setMotivationIdx] = useState(0);

  const screenId = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('screenId');
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      const [schedRes, mediaRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedule/active${screenId ? `?screenId=${screenId}` : ''}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`)
      ]);
      setActiveMedia(schedRes.data);
      setAllMedia(mediaRes.data);
      if (screenId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/screens/${screenId}/status`, { status: 'online' });
      }
    } catch (err) { console.error(err); }
  }, [screenId]);

  const fetchTicker = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`);
      setTicker(prev => ({ ...prev, ...res.data }));
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    const init = async () => {
      await Promise.all([fetchContent(), fetchTicker()]);
    };
    init();

    const t = setInterval(() => setTime(new Date()), 1000);
    const m = setInterval(() => setMotivationIdx(i => (i + 1) % quotes.length), 10000);

    socket.on('contentUpdate', fetchContent);
    socket.on('tickerUpdate', fetchTicker);

    return () => {
      clearInterval(t);
      clearInterval(m);
      socket.disconnect();
    };
  }, [fetchContent, fetchTicker]);

  useEffect(() => {
    if (activeMedia.length > 1) {
      const duration = activeMedia[currentIdx]?.duration || 10;
      const t = setTimeout(() => {
        setCurrentIdx((currentIdx + 1) % activeMedia.length);
      }, duration * 1000);
      return () => clearTimeout(t);
    }
  }, [currentIdx, activeMedia]);

  const renderMedia = (media) => {
    const layout = media.layout ? safeParse(media.layout) : null;
    const mapping = media.mediaMapping ? safeParse(media.mediaMapping, {}) : {};

    const MediaItem = ({ item }) => {
      if (!item) return <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center mono text-[10px] opacity-20">NO_SIGNAL</div>;
      const src = `${import.meta.env.VITE_API_URL}/${item.filePath}`;
      if (item.fileType === 'video') return <video src={src} autoPlay muted loop className="w-full h-full object-cover" />;
      if (item.fileType === 'pdf') return <iframe src={`${src}#toolbar=0`} className="w-full h-full border-none" title={item.fileName} />;
      return <img src={src} alt={item.fileName} className="w-full h-full object-cover" />;
    };

    if (layout && layout.length > 0) {
      return (
        <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-4 p-4">
          {layout.map((zone) => {
            const mappedMediaId = mapping[zone.i];
            const mappedMedia = allMedia.find(m => m.id === parseInt(mappedMediaId));
            
            return (
              <div key={zone.i} className="relative border-2 border-[var(--border)] overflow-hidden bg-white"
                style={{ gridColumn: `span ${zone.w}`, gridRow: `span ${zone.h}`, gridColumnStart: zone.x + 1, gridRowStart: zone.y + 1 }}>
                <MediaItem item={mappedMedia} />
                <div className="absolute top-0 left-0 px-2 py-0.5 bg-[var(--border)] text-[8px] mono uppercase text-white font-bold">ZONE_{zone.i}</div>
              </div>
            );
          })}
        </div>
      );
    }

    return <div className="w-full h-full flex items-center justify-center p-4"><div className="w-full h-full border-4 border-[var(--border)] overflow-hidden"><MediaItem item={media} /></div></div>;
  };

  return (
    <div className="h-screen w-screen bg-white overflow-hidden flex flex-col text-[var(--text)] select-none">
      <div className="h-16 bg-white border-b-4 border-[var(--border)] flex items-center justify-between px-10 z-20">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5" />
            <span className="mono text-[10px] tracking-[4px] font-black">TERMINAL_STATUS: ONLINE</span>
          </div>
          <div className="h-4 w-px bg-[var(--border)]" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[var(--green)] rounded-full animate-pulse" />
            <span className="mono text-[10px] tracking-[2px] font-bold opacity-40">SIGNAL_ENCRYPTED</span>
          </div>
        </div>
        <div className="text-right flex items-center gap-8">
           <div className="mono text-[10px] font-bold text-[var(--text-dim)]">
              <p>FACTORY_OS_v4.0.2</p>
           </div>
           <p className="mono text-3xl font-black tracking-tighter">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#f0f0f0]">
        {activeMedia.length > 0 ? (
          <div className="w-full h-full animate-fade-in">
            {renderMedia(activeMedia[currentIdx])}
            <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2 z-30">
               <div className="bg-[var(--accent-alt)] border-2 border-[var(--border)] px-4 py-2 flex items-center gap-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                 <span className="mono text-[10px] uppercase font-black tracking-widest">CONTENT_IDENTIFIER</span>
                 <div className="w-2 h-2 bg-black animate-ping" />
               </div>
               <p className="mono text-[10px] font-bold uppercase tracking-widest bg-white border-2 border-[var(--border)] px-4 py-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">{activeMedia[currentIdx].templateName || activeMedia[currentIdx].fileName}</p>
            </div>
          </div>
        ) : (
          <div className="text-center animate-fade-in relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute inset-0 grid-bg opacity-5" />
            <div className="relative z-10 space-y-16 max-w-5xl px-20">
              <div className="border-4 border-[var(--border)] px-10 py-4 inline-block mb-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-[var(--accent-alt)]">
                <p className="mono text-xl font-black tracking-[8px] uppercase">Nexus Operations Mode</p>
              </div>
              <h2 className="text-9xl font-black tracking-tighter leading-[0.95] text-left uppercase">
                Focus on <br />
                <span className="bg-[var(--border)] text-white px-4 py-1 inline-block my-2">Safety</span>,<br />
                Deliver <br />
                <span className="text-[var(--text-faint)]">Excellence.</span>
              </h2>
              <div className="h-2 w-full bg-[var(--border)]" />
              <div className="text-left space-y-4">
                <p className="text-3xl font-bold tracking-tight leading-tight italic max-w-3xl">"{quotes[motivationIdx].text}"</p>
                <p className="mono text-xs uppercase tracking-[4px] font-black text-[var(--text-dim)]">AUTHENTICATED_SOURCE: {quotes[motivationIdx].author}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-24 bg-[var(--border)] flex items-center overflow-hidden z-20">
        <div className="bg-[var(--accent-alt)] h-full px-10 flex items-center z-10 border-r-4 border-black">
          <span className="mono text-black font-black text-sm tracking-[6px] uppercase whitespace-nowrap">Broadcast</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
           <div className="flex gap-20 whitespace-nowrap animate-ticker py-2" style={{ animationDuration: ticker.isActive ? `${Math.max(5, 100 - ticker.speed * 10)}s` : '0s' }}>
              <div className="flex items-center gap-20">
                <div className="flex items-center gap-4">
                  <span className="mono text-white text-4xl font-black tracking-widest uppercase">{ticker.text || 'NEXUS SYSTEM BROADCAST ACTIVE...'}</span>
                  {ticker.type === 'link' && ticker.linkUrl && <span className="mono text-black bg-[var(--accent-alt)] text-xs font-black uppercase tracking-[4px] px-4 py-1">SOURCE: {ticker.linkUrl}</span>}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
