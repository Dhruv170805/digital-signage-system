import React, { useMemo } from 'react';

const TickerContent = ({ messages }) => {
  return (
    <div className="flex items-center flex-nowrap">
        {messages.map((msg, idx) => (
          <React.Fragment key={idx}>
            <span className="uppercase font-black px-16 tracking-tighter whitespace-nowrap">
                {msg}
            </span>
            {/* Professional Broadcast Separator */}
            <div className="flex items-center gap-1 opacity-30">
                <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                <div className="w-4 h-px bg-white/20" />
                <div className="w-1 h-1 bg-indigo-400 rounded-full" />
            </div>
          </React.Fragment>
        ))}
    </div>
  );
};

const TickerEngine = ({ ticker }) => {
  const messages = useMemo(() => {
    if (!ticker?.text) return [];
    const split = ticker.text.split('\n').filter(m => m.trim() !== '');
    // If text is too short, we repeat the array internally to ensure it fills the width
    return split.length < 5 ? [...split, ...split, ...split] : split;
  }, [ticker?.text]);

  if (messages.length === 0) return null;

  const animDuration = Math.max(10, 150 - (ticker.speed || 50)) + 's';

  return (
      <div className="w-full h-full relative overflow-hidden bg-black/20 group">
          {/* 1. CINEMATIC EDGE MASKS */}
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-black via-black/60 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-black via-black/60 to-transparent z-20 pointer-events-none" />

          {/* 2. OVERFLOW CONTAINER: Ensures track starts at absolute left */}
          <div className="absolute inset-0 flex items-center justify-start">
              <div 
                  className="ticker-track flex items-center"
                  style={{ 
                      '--ticker-duration': animDuration,
                      color: ticker.color || '#ffffff',
                      fontSize: '20px',
                      fontWeight: '900'
                  }}
              >
                  {/* 
                      3. PERFECT DOUBLE-BUFFER:
                      To have a seamless loop with translateX(-50%), we need 
                      exactly TWO identical blocks. When block 1 exits, 
                      block 2 is in its exact starting position.
                  */}
                  <TickerContent messages={messages} />
                  <TickerContent messages={messages} />
              </div>
          </div>
      </div>
  );
};

export default TickerEngine;
