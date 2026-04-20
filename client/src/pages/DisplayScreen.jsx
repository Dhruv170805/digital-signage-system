import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Clock, ShieldCheck, Zap, Activity } from 'lucide-react';

const socket = io(import.meta.env.VITE_API_URL);

const DisplayScreen = () => {
  const [activeMedia, setActiveMedia] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ticker, setTicker] = useState({ text: '', speed: 5, isActive: 1 });
  const [time, setTime] = useState(new Date());
  
  const [motivationIdx, setMotivationIdx] = useState(0);
  const quotes = [
    { text: "Safety is not a gadget, but a state of mind.", author: "Factory Protocol" },
    { text: "Quality is doing it right when no one is looking.", author: "Industrial Standard" },
    { text: "Excellence is an art won by training and habituation.", author: "Plant Operations" },
    { text: "Tomorrow: Your reward for working safely today.", author: "Safety First" }
  ];

  const fetchContent = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const screenId = urlParams.get('screenId');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedule/active${screenId ? `?screenId=${screenId}` : ''}`);
      setActiveMedia(res.data);
      
      if (screenId) {
        // Heartbeat to server
        await axios.put(`${import.meta.env.VITE_API_URL}/api/screens/${screenId}/status`, { status: 'online' });
      }
    } catch (err) { console.error(err); }
  };

  const fetchTicker = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`);
      setTicker(prev => ({ ...prev, ...res.data }));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const init = async () => {
      await fetchContent();
      await fetchTicker();
    };
    init();

    const t = setInterval(() => setTime(new Date()), 1000);
    const m = setInterval(() => setMotivationIdx(i => (i + 1) % quotes.length), 10000);

    socket.on('contentUpdate', fetchContent);
    socket.on('tickerUpdate', fetchTicker);

    return () => {
      clearInterval(t);
      clearInterval(m);
      socket.off('contentUpdate');
      socket.off('tickerUpdate');
    };
  }, [quotes.length]);

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
    const url = `${import.meta.env.VITE_API_URL}/${media.filePath}`;
    const layout = media.layout ? JSON.parse(media.layout) : null;

    const MediaItem = ({ type, src, name }) => {
      if (type === 'video') {
        return <video src={src} autoPlay muted loop className="w-full h-full object-cover" />;
      }
      if (type === 'pdf') {
        return <iframe src={`${src}#toolbar=0`} className="w-full h-full border-none" />;
      }
      return <img src={src} alt={name} className="w-full h-full object-cover" />;
    };

    if (layout && layout.length > 0) {
      // Grid-based layout rendering
      return (
        <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-2 p-2">
          {layout.map((zone, i) => (
            <div 
              key={zone.i}
              className="relative border border-white/10 rounded-lg overflow-hidden"
              style={{
                gridColumn: `span ${zone.w}`,
                gridRow: `span ${zone.h}`,
                gridColumnStart: zone.x + 1,
                gridRowStart: zone.y + 1
              }}
            >
              <MediaItem type={media.fileType} src={url} name={media.fileName} />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[8px] mono uppercase text-[var(--accent)] tracking-widest">
                Zone {i + 1}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
         <MediaItem type={media.fileType} src={url} name={media.fileName} />
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col text-[var(--text)] select-none">
      {/* Header Stat Bar */}
      <div className="h-14 bg-[#050508] border-b border-[#111] flex items-center justify-between px-8 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="text-[var(--accent)] w-4 h-4 animate-pulse" />
            <span className="mono text-[8px] uppercase tracking-[4px] font-bold opacity-40">SYSTEM LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--green)] w-3 h-3" />
            <span className="mono text-[8px] uppercase tracking-[2px] font-bold opacity-30">ENCRYPTED FEED</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="mono text-lg font-bold tracking-widest text-[var(--text)]">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {activeMedia.length > 0 ? (
          <div className="w-full h-full animate-fade-in">
            {renderMedia(activeMedia[currentIdx])}
            
            {/* Overlay Info */}
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
               <div className="glass px-4 py-2 flex items-center gap-2 border-[var(--accent)]/20">
                  <span className="mono text-[10px] uppercase font-bold tracking-widest text-[var(--accent)]">
                    Now Playing
                  </span>
                  <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-ping" />
               </div>
               <p className="mono text-[10px] text-[var(--text-dim)] uppercase tracking-wider bg-black/60 px-4 py-1 rounded">
                 {activeMedia[currentIdx].fileName}
               </p>
            </div>

            {/* Content Progress */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
               {activeMedia.map((_, i) => (
                 <div 
                   key={i} 
                   className={`h-1 rounded-full transition-all duration-500 ${
                     i === currentIdx ? 'w-12 bg-[var(--accent)]' : 'w-2 bg-white/20'
                   }`}
                 />
               ))}
            </div>
          </div>
        ) : (
          /* IDLE FACTORY STATE */
          <div className="text-center animate-fade-in relative w-full h-full flex flex-col items-center justify-center">
            {/* Industrial Ambient BG */}
            <div className="absolute inset-0 grid-bg opacity-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[160px] animate-pulse" />
            
            <div className="relative z-10 space-y-12 max-w-4xl px-20">
              <div className="space-y-4">
                 <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-6 py-2 rounded-full inline-block mb-4">
                    <p className="mono text-[var(--accent)] text-xs font-bold tracking-[6px] uppercase">Nexus Operational Mode</p>
                 </div>
                 <h2 className="text-7xl font-light tracking-tighter leading-none">
                   Focus on <span className="text-[var(--accent)] italic">Safety</span>, <br />Deliver <span className="mono text-5xl">Excellence.</span>
                 </h2>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

              <div className="space-y-2 py-4">
                 <p className="text-2xl font-medium tracking-tight text-[var(--text-dim)] animate-fade-in leading-relaxed italic" key={motivationIdx}>
                   "{quotes[motivationIdx].text}"
                 </p>
                 <p className="mono text-[10px] uppercase tracking-[4px] text-[var(--text-faint)]">
                   — {quotes[motivationIdx].author}
                 </p>
              </div>

              <div className="flex justify-center gap-4 pt-10">
                 <div className="flex items-center gap-3 glass px-6 py-3 border-[#1a1a1a]">
                    <Clock size={16} className="text-[var(--text-dim)]" />
                    <span className="mono text-sm tracking-[2px]">{time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</span>
                 </div>
                 <div className="flex items-center gap-3 glass px-6 py-3 border-[#1a1a1a]">
                    <Zap size={16} className="text-[var(--accent)]" />
                    <span className="mono text-sm tracking-[2px]">LINE 01 STATUS: ONLINE</span>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticker Bar */}
      <div className="h-20 bg-black border-t border-[#111] flex items-center overflow-hidden z-20">
        <div className="bg-[var(--accent)] h-full px-8 flex items-center z-10 shadow-[20px_0_40px_rgba(0,0,0,0.8)] border-r border-black/20">
           <span className="mono text-[var(--bg)] font-black text-xs tracking-[4px] uppercase whitespace-nowrap">Broadcast</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
           <div 
             className="flex gap-20 whitespace-nowrap animate-ticker py-2" 
             style={{ animationDuration: ticker.isActive ? `${Math.max(5, 100 - ticker.speed * 10)}s` : '0s' }}
           >
              <div className="flex items-center gap-20">
                <div className="flex items-center gap-4">
                  <span className={`mono text-[var(--accent)] text-2xl font-bold tracking-widest leading-none ${ticker.type === 'link' ? 'underline decoration-dotted cursor-pointer' : ''}`}>
                    {ticker.text || 'NEXUS DIGITAL SIGNAGE SYSTEM READY FOR OPERATIONAL UPDATES...'}
                  </span>
                  {ticker.type === 'link' && ticker.linkUrl && (
                    <span className="mono text-[var(--accent)]/40 text-sm font-bold uppercase tracking-widest bg-[var(--accent)]/10 px-3 py-1 rounded">
                      GO TO: {ticker.linkUrl}
                    </span>
                  )}
                </div>
                {/* Repeat for continuous loop */}
                <div className="flex items-center gap-4">
                  <span className={`mono text-[var(--accent)] text-2xl font-bold tracking-widest leading-none ${ticker.type === 'link' ? 'underline decoration-dotted' : ''}`}>
                    {ticker.text || 'NEXUS DIGITAL SIGNAGE SYSTEM READY FOR OPERATIONAL UPDATES...'}
                  </span>
                  {ticker.type === 'link' && ticker.linkUrl && (
                    <span className="mono text-[var(--accent)]/40 text-sm font-bold uppercase tracking-widest bg-[var(--accent)]/10 px-3 py-1 rounded">
                      GO TO: {ticker.linkUrl}
                    </span>
                  )}
                </div>
              </div>
           </div>
        </div>
        <div className="bg-black/80 backdrop-blur-md px-10 h-full flex items-center border-l border-[#111]">
           <p className="mono text-[var(--text-dim)] text-[10px] uppercase font-bold tracking-[2px]">Nexus OS v4.0</p>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
