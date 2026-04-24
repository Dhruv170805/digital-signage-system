import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const TickerContent = ({ ticker }) => (
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

const TickerEngine = ({ ticker }) => {
  const containerRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const [clones, setClones] = useState(4);

  useEffect(() => {
      if (!ticker) return;
      
      const updateClones = () => {
          if (containerRef.current && contentRef.current) {
              const viewportWidth = containerRef.current.parentElement?.offsetWidth || window.innerWidth;
              const textWidth = contentRef.current.offsetWidth || 500;
              const needed = Math.ceil(viewportWidth / textWidth) + 2;
              setClones(needed);
          }
      };

      const observer = new ResizeObserver(updateClones);
      if (containerRef.current?.parentElement) {
          observer.observe(containerRef.current.parentElement);
      }
      
      updateClones();
      return () => observer.disconnect();
  }, [ticker]);

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

  return (
      <div className="w-full h-full flex items-center overflow-hidden relative shadow-inner" style={{ backgroundColor: style.backgroundColor }}>
          <div 
              ref={containerRef}
              className="whitespace-nowrap absolute flex items-center"
              style={{
                  animation: `${animationName} ${animDuration} linear infinite`,
                  ...style
              }}
          >
              {[...Array(clones)].map((_, i) => (
                  <div key={i} ref={i === 0 ? contentRef : null}>
                      <TickerContent ticker={ticker} />
                  </div>
              ))}
          </div>
      </div>
  );
};

export default TickerEngine;
