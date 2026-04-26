import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import useLayoutStore from '../../store/useLayoutStore';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker locally to remove CDN dependency for 24/7 reliability
pdfjs.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';

const PdfRenderer = ({ url, zone }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { setBlockedZones, resetLayout } = useLayoutStore();
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  // 🧠 TEXT AVOIDANCE ENGINE: Detect text regions to avoid covering them with HUD
  // FIX: Optimized with clustering to prevent DOM flooding / re-render storm
  const handlePageRenderSuccess = useCallback(async (page) => {
    try {
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      
      const rawZones = textContent.items.map(item => {
        const [x, y, w, h] = [item.transform[4], item.transform[5], item.width, item.height];
        return {
          x: (x / viewport.width) * 100,
          y: 100 - ((y / viewport.height) * 100), 
          w: (w / viewport.width) * 100,
          h: (h / viewport.height) * 100
        };
      }).filter(z => z.h > 2.0); // Ignore tiny text

      // Simple Clustering: Merge overlapping or near zones to reduce object count
      const clusteredZones = [];
      if (rawZones.length > 0) {
          // Identify top and bottom text density broad zones (simplified for performance)
          const topText = rawZones.some(z => z.y < 15);
          const bottomText = rawZones.some(z => z.y > 85);
          if (topText) clusteredZones.push({ x: 0, y: 0, w: 100, h: 15 });
          if (bottomText) clusteredZones.push({ x: 0, y: 85, w: 100, h: 15 });
      }

      setBlockedZones(clusteredZones);
    } catch (e) {
      console.warn('[PDF:AI] Text detection failure:', e);
    }
  }, [setBlockedZones]);

  useEffect(() => {
    return () => resetLayout(); 
  }, [resetLayout]);

  // 🧠 MODE LOGIC
  const mode = useMemo(() => {
    if (!zone) return 'fit';
    const { w, h } = zone;
    if (w > 60 && h > 60) return 'fit';      
    if (w > 30) return 'slide';              
    return 'scroll';                         
  }, [zone]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // 🚀 SLIDE MODE
  useEffect(() => {
    if (mode !== 'slide' || !numPages || numPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev >= numPages ? 1 : prev + 1));
    }, 8000); 
    return () => clearInterval(interval);
  }, [mode, numPages]);

  // 🚀 SCROLL MODE
  useEffect(() => {
    if (mode !== 'scroll') return;
    let animationFrame;
    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += 0.5; 
        if (scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - scrollRef.current.clientHeight) {
          scrollRef.current.scrollTop = 0;
        }
      }
      animationFrame = requestAnimationFrame(scroll);
    };
    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [mode]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-black overflow-hidden relative flex items-center justify-center"
    >
      {/* 2. MAIN DOCUMENT STAGE */}
      <div 
        ref={scrollRef}
        className={`w-full h-full relative z-10 flex justify-center hide-scrollbar ${mode === 'scroll' ? 'overflow-y-auto' : 'overflow-hidden items-center'}`}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-[4px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[6px]">Syncing Document</p>
            </div>
          }
        >
          {mode === 'scroll' ? (
             <div className="flex flex-col items-center w-full">
                {Array.from(new Array(numPages), (el, index) => (
                    <Page 
                        key={index}
                        pageNumber={index + 1} 
                        width={containerRef.current ? containerRef.current.offsetWidth : 800}
                        onRenderSuccess={handlePageRenderSuccess}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="w-full"
                    />
                ))}
             </div>
          ) : (
            <div className="animate-fade-in transition-all duration-1000 w-full h-full flex items-center justify-center" key={currentPage}>
                <div className="w-full h-full flex items-center justify-center">
                    <Page 
                        pageNumber={currentPage} 
                        width={containerRef.current ? containerRef.current.offsetWidth : 800}
                        onRenderSuccess={handlePageRenderSuccess}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </div>
            </div>
          )}
        </Document>
      </div>
    </div>
  );
};

export default PdfRenderer;
