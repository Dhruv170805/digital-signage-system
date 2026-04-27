import React, { useRef, useEffect, useState } from 'react';
import TickerEngine from './TickerEngine';
import WeatherWidget from './WeatherWidget';
import { useFrameIntelligence } from '../../hooks/useFrameIntelligence';
import useLayoutStore from '../../store/useLayoutStore';
import { Monitor, Clock as ClockIcon } from 'lucide-react';

const MiniTopBar = ({ screenInfo }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/90 drop-shadow-md">LIVE</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <WeatherWidget location={screenInfo?.location} />
        </div>
        <div className="flex items-center gap-4 text-white">
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{screenInfo?.name || 'SCREEN-01'}</span>
            <div className="text-right ml-auto">
                <div className="text-xl font-black tracking-tighter tabular-nums leading-none">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
            </div>
        </div>
    </div>
  );
};

const FrameOverlay = ({ frame, tickers, screenInfo, mediaRef }) => {
  const [style, setStyle] = useState({ bottom: '2%', left: '2%', width: '96%', height: 'auto' });
  const { blockedZones } = useLayoutStore();

  // Use the intelligence hook to find a safe zone for the overlay
  // We pass the blockedZones from the store (which are updated by the PDF renderer)
  const intelStyle = useFrameIntelligence(mediaRef, { 
      id: frame.i, 
      type: frame.type || 'unknown', 
      textRegions: blockedZones,
      overlayType: 'mixed' // A mix of ticker and topbar logic
  });

  useEffect(() => {
    if (intelStyle) {
      setStyle(intelStyle);
    }
  }, [intelStyle]);

  // Determine what to show in this frame based on some config or defaults
  // For demo, main frame gets TopBar + Ticker, side frames get nothing or minimal
  const isMain = frame.i === 'main' || frame.w > 60;
  if (!isMain && !frame.overlay) return null;

  return (
    <div 
        className="absolute z-50 transition-all duration-[1500ms] cubic-bezier(0.2, 0.8, 0.2, 1) pointer-events-none flex flex-col gap-2" 
        style={style}
    >
        {/* Only show top bar on main frames if enabled */}
        {(frame.overlay?.enableTopBar !== false) && isMain && (
            <div className="pointer-events-auto">
                <MiniTopBar screenInfo={screenInfo} />
            </div>
        )}

        {/* Show ticker if available */}
        {(frame.overlay?.enableTicker !== false) && tickers && tickers.length > 0 && (
            <div className="pointer-events-auto rounded-[1rem] overflow-hidden border border-white/10 shadow-2xl h-12 bg-black/50 backdrop-blur-xl relative">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />
                <TickerEngine ticker={tickers[0]} />
            </div>
        )}
    </div>
  );
};

export default FrameOverlay;
