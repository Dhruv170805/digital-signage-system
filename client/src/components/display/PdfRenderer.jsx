import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker for performance using the local copy if possible, or cdn
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfRenderer = ({ url, frameWidth, frameHeight }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState('fit'); // 'fit', 'slideshow', 'scroll'
  const [scale, setScale] = useState(1);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    // Auto-determine mode based on page count and frame aspect ratio
    if (numPages > 1) {
        setMode('slideshow');
    } else {
        setMode('fit');
    }
  };

  // Slideshow Logic
  useEffect(() => {
    if (mode === 'slideshow' && numPages > 1) {
      const interval = setInterval(() => {
        setCurrentPage((prev) => (prev % numPages) + 1);
      }, 8000); // 8 seconds per page
      return () => clearInterval(interval);
    }
  }, [mode, numPages]);

  // Auto-Scroll Logic (for long vertical PDFs)
  useEffect(() => {
    if (mode === 'scroll') {
      let animationFrame;
      const scroll = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += 1;
          if (scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - scrollRef.current.clientHeight) {
            scrollRef.current.scrollTop = 0;
          }
        }
        animationFrame = requestAnimationFrame(scroll);
      };
      animationFrame = requestAnimationFrame(scroll);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [mode]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-900 overflow-hidden relative flex items-center justify-center"
    >
      <div 
        ref={scrollRef}
        className={`w-full h-full ${mode === 'scroll' ? 'overflow-y-auto hide-scrollbar' : 'overflow-hidden flex items-center justify-center'}`}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[4px]">Processing Document</p>
            </div>
          }
        >
          {mode === 'slideshow' ? (
            <div className="animate-fade-in key={currentPage}">
                <Page 
                    pageNumber={currentPage} 
                    width={frameWidth || containerRef.current?.offsetWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-2xl"
                />
            </div>
          ) : mode === 'scroll' ? (
            Array.from(new Array(numPages), (el, index) => (
              <Page 
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={frameWidth || containerRef.current?.offsetWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="mb-4"
              />
            ))
          ) : (
            <Page 
              pageNumber={1} 
              height={frameHeight || containerRef.current?.offsetHeight}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          )}
        </Document>
      </div>

      {/* Broadcast HUD for PDF */}
      {numPages > 1 && mode === 'slideshow' && (
        <div className="absolute bottom-8 right-8 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 animate-fade-in">
            <div className="flex gap-1">
                {[...Array(numPages)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-500 ${i + 1 === currentPage ? 'w-8 bg-indigo-500' : 'w-2 bg-white/20'}`} 
                    />
                ))}
            </div>
            <span className="text-[10px] font-black text-white/40 tabular-nums">
                PAGE {currentPage} / {numPages}
            </span>
        </div>
      )}
    </div>
  );
};

export default PdfRenderer;
