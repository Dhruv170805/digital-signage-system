import React, { useState, useEffect, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import { Palette, XCircle, FileText, Info, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useTemplates } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';

const Card = ({ children, className = "", title, icon, subtitle }) => {
  const Icon = icon;
  return (
    <div className={`glass-card p-8 animate-fade-in ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-accent shadow-inner">
                <Icon size={24} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-black text-text uppercase tracking-tighter leading-none">{title}</h3>
              {subtitle && <p className="text-[10px] font-bold text-text-dim uppercase tracking-[2px] mt-1.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

const LayoutArchitect = ({ fetchData }) => {
  const { data: templates = [], refetch } = useTemplates();
  const [templateName, setTemplateName] = useState('');
  const [currentLayout, setCurrentLayout] = useState([]);
  const [architectWidth, setArchitectWidth] = useState(0);
  const [collisions, setCollisions] = useState([]);
  const architectRef = useRef(null);

  const checkCollisions = (layout) => {
    const overlapping = [];
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const a = layout[i];
        const b = layout[j];
        const isOverlapping = (
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y
        );
        if (isOverlapping) {
          if (!overlapping.includes(a.i)) overlapping.push(a.i);
          if (!overlapping.includes(b.i)) overlapping.push(b.i);
        }
      }
    }
    setCollisions(overlapping);
  };

  useEffect(() => {
    checkCollisions(currentLayout);
  }, [currentLayout]);

  useEffect(() => {
    if (!architectRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setArchitectWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(architectRef.current);
    return () => observer.disconnect();
  }, []);

  const safeParseJSON = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  const saveTemplate = async () => {
    if (!templateName) return toast.error('Enter Layout Name');
    if (collisions.length > 0) return toast.error('Resolve frame collisions before saving.');
    const isDuplicate = templates.some(t => t.name.toLowerCase() === templateName.trim().toLowerCase());
    if (isDuplicate) return toast.error('Layout name must be unique.');

    try {
      await api.post(`/api/templates`, { name: templateName.trim(), layout: JSON.stringify(currentLayout) });
      toast.success('Layout Saved');
      setTemplateName('');
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const rowHeight = architectWidth > 0 ? (architectWidth / 12) * (9/16) : 50;

  return (
    <div className="space-y-8 animate-fade-in">
       <Card 
         className="w-full" 
         title="Layout Architect" 
         icon={Palette} 
         subtitle="Grid System: 12 x 12 Precision Mapping"
       >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 mt-2">
             <div className="flex flex-wrap gap-2">
               <button onClick={() => setCurrentLayout([{ i: 'Main', x: 0, y: 0, w: 12, h: 12 }])} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-text transition-all">Fullscreen</button>
               <button onClick={() => setCurrentLayout([{ i: 'Left', x: 0, y: 0, w: 6, h: 12 }, { i: 'Right', x: 6, y: 0, w: 6, h: 12 }])} className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase text-sky-400 hover:bg-sky-500 hover:text-text transition-all">50/50 V</button>
               <button onClick={() => setCurrentLayout([{ i: 'Top', x: 0, y: 0, w: 12, h: 6 }, { i: 'Bottom', x: 0, y: 6, w: 12, h: 6 }])} className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase text-sky-400 hover:bg-sky-500 hover:text-text transition-all">50/50 H</button>
               <button onClick={() => setCurrentLayout([{ i: 'TL', x: 0, y: 0, w: 6, h: 6 }, { i: 'TR', x: 6, y: 0, w: 6, h: 6 }, { i: 'BL', x: 0, y: 6, w: 6, h: 6 }, { i: 'BR', x: 6, y: 6, w: 6, h: 6 }])} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-500 hover:text-text transition-all">Quad</button>
               <button onClick={() => setCurrentLayout([{ i: 'Main', x: 0, y: 0, w: 9, h: 12 }, { i: 'Side', x: 9, y: 0, w: 3, h: 12 }])} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-text transition-all">Sidebar</button>
               <button onClick={() => { if(window.confirm('Wipe current design?')) setCurrentLayout([]); }} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500 hover:text-text transition-all">Wipe</button>
               <button onClick={() => setCurrentLayout([...currentLayout, { i: `Frame${currentLayout.length+1}`, x: 0, y: 0, w: 4, h: 4 }])} className="px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-sky-400 hover:text-text transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">+ Add Frame</button>
             </div>
          </div>
          <div ref={architectRef} className="bg-slate-950 border-4 border-slate-800 rounded-[40px] relative overflow-hidden grid-bg shadow-[0_0_100px_rgba(0,0,0,0.5)] p-0" style={{ height: architectWidth > 0 ? (Math.floor(rowHeight) * 12) : 'auto', minHeight: '400px' }}>
             <div className="absolute inset-0 grid pointer-events-none opacity-20" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
                {[...Array(144)].map((_, i) => (
                  <div key={i} className="border-[0.5px] border-slate-800" />
                ))}
             </div>

             <GridLayout 
              className="layout" 
              layout={currentLayout.map(item => ({ ...item, maxW: 12, maxH: 12, minW: 1, minH: 1 }))} 
              cols={12} 
              rowHeight={Math.floor(rowHeight)} 
              width={architectWidth} 
              maxRows={12}
              onLayoutChange={(newLayout) => {
                const validatedLayout = newLayout.map(item => {
                  let { x, y, w, h, i } = item;
                  w = Math.max(1, Math.min(Math.round(w), 12));
                  h = Math.max(1, Math.min(Math.round(h), 12));
                  if (x < 0) x = 0;
                  if (y < 0) y = 0;
                  if (x + w > 12) x = 12 - w;
                  if (y + h > 12) y = 12 - h;
                  return { i, x: Math.round(x), y: Math.round(y), w, h };
                });
                const hasChanged = JSON.stringify(validatedLayout) !== JSON.stringify(currentLayout);
                if (hasChanged) setCurrentLayout(validatedLayout);
              }} 
              margin={[0, 0]} 
              draggableHandle=".drag-handle"
              resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n']}
              compactType={null}
              preventCollision={false}
              isDraggable={true}
              isResizable={true}
              isBounded={true}
            >
                {currentLayout.map(z => (
                  <div key={z.i} className={`bg-slate-900/90 border backdrop-blur-md flex flex-col items-center justify-center text-white group overflow-hidden rounded-xl shadow-2xl transition-all ${collisions.includes(z.i) ? 'border-rose-500 shadow-rose-500/20 bg-rose-500/5' : 'border-sky-500/30 hover:border-sky-400'}`}>
                     <div className={`drag-handle w-full backdrop-blur-md flex justify-between items-center px-3 py-1.5 font-black uppercase tracking-widest text-[9px] border-b cursor-grab active:cursor-grabbing ${collisions.includes(z.i) ? 'bg-rose-500/20 text-rose-200 border-rose-500/20' : 'bg-sky-500/20 text-sky-200 border-sky-500/20'}`}>
                        <div className="flex items-center gap-2">
                          <div className="grid grid-cols-2 gap-0.5 opacity-40">
                            {[...Array(4)].map((_, i) => <div key={i} className={`w-0.5 h-0.5 rounded-full ${collisions.includes(z.i) ? 'bg-rose-300' : 'bg-white'}`} />)}
                          </div>
                          <span>{z.i} {collisions.includes(z.i) ? '(COLLISION)' : ''}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentLayout(currentLayout.filter(item => item.i !== z.i)); }} className="hover:text-rose-400 transition-colors p-1">
                          <XCircle size={14} />
                        </button>
                     </div>
                     <div className="flex-1 flex flex-col items-center justify-center leading-none pointer-events-none p-4 w-full">
                        <div className="relative">
                          <span className="font-black text-3xl tracking-tighter text-white drop-shadow-2xl">{z.w} : {z.h}</span>
                          <div className="absolute -inset-2 bg-sky-500/10 blur-xl rounded-full -z-10" />
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-px w-4 bg-sky-500/30" />
                          <span className="text-[8px] font-black text-sky-400/60 uppercase tracking-widest">{z.x}, {z.y}</span>
                          <div className="h-px w-4 bg-sky-500/30" />
                        </div>
                     </div>
                     <div className="absolute bottom-0 right-0 w-4 h-4 p-1 pointer-events-none opacity-40 group-hover:opacity-100">
                        <div className="w-full h-full border-r-2 border-b-2 border-sky-400 rounded-br-sm" />
                     </div>
                  </div>
                ))}
             </GridLayout>
          </div>
          <div className="mt-8 flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
             <input type="text" placeholder="Layout Name" className="nexus-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)}/>
             <button onClick={saveTemplate} className="nexus-btn-primary whitespace-nowrap px-10 tracking-[2px]">Save</button>
          </div>
       </Card>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card 
            className="p-8" 
            title="Inspector" 
            icon={Info} 
            subtitle="Frame Coordinate Control"
          >
             {collisions.length > 0 && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                   <AlertTriangle className="text-rose-500" size={16} />
                   <p className="text-[10px] font-bold text-rose-500 uppercase">Warning: {collisions.length} frames are overlapping. Adjust coordinates to resolve.</p>
                </div>
             )}
             <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar mt-2">
                {currentLayout.map((z, idx) => (
                  <div key={z.i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="font-black text-xs text-sky-600">{z.i.toUpperCase()}</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                           <label className="text-[8px] font-black uppercase opacity-40">Width</label>
                           <input type="number" min="1" max="12" value={z.w} onChange={(e) => {
                              const next = [...currentLayout];
                              next[idx].w = parseInt(e.target.value) || 1;
                              setCurrentLayout(next);
                           }} className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-sky-500/50 text-text"/>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black uppercase opacity-40">Height</label>
                           <input type="number" min="1" max="12" value={z.h} onChange={(e) => {
                              const next = [...currentLayout];
                              next[idx].h = parseInt(e.target.value) || 1;
                              setCurrentLayout(next);
                           }} className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-sky-500/50 text-text"/>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </Card>

          <Card 
            className="p-8" 
            title="Library" 
            icon={FileText} 
            subtitle="Saved Layout Manifest"
          >
             <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar mt-2">
                {templates.map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-all cursor-pointer">
                     <div>
                        <p className="text-[10px] font-extrabold truncate max-w-[120px] uppercase text-text">{t.name}</p>
                        <p className="text-[8px] font-bold text-sky-600 opacity-60 uppercase">{safeParseJSON(t.layout).length} FRAMES</p>
                     </div>
                     <button onClick={() => setCurrentLayout(safeParseJSON(t.layout))} className="text-[9px] font-black border border-slate-300 px-3 py-1 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-text">LOAD</button>
                  </div>
                ))}
             </div>
          </Card>
       </div>
    </div>
  );
};

export default LayoutArchitect;
