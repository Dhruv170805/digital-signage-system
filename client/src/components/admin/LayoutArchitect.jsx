import React, { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { Palette, XCircle, FileText, Info, Trash2, Plus, Layers, Maximize, AlertTriangle, Save, RefreshCw, Layout as LayoutIcon, Monitor, Settings, Zap, Type, MoveRight, Power, Grid3X3, Smartphone, Square } from 'lucide-react';
import api from '../../services/api';
import { useTemplates } from '../../hooks/useAdminData';
import useBuilderStore from '../../store/useBuilderStore';
import toast from 'react-hot-toast';

const LayoutArchitect = ({ fetchData }) => {
  const { data: templates = [], refetch } = useTemplates();
  const { templateName, setTemplateName, frames, setFrames, addFrame, updateFrame, removeFrame, selectedFrameId, selectFrame, resetBuilder } = useBuilderStore();
  const [activeTab, setActiveTab] = useState('editor'); 
  const architectRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [isDragging, setIsDragging] = useState(false);

  // 🎯 GRID CONSTANTS
  const GRID_SIZE = 12; // 12x12 grid for TV broadcast quality alignment
  const snapToGrid = (val) => Math.round(val / (100 / GRID_SIZE)) * (100 / GRID_SIZE);

  // 🧠 COVERAGE CALCULATION (Saved with Server 100x100 Grid)
  const coverageReport = React.useMemo(() => {
    const GRID_RES = 100;
    const grid = Array(GRID_RES).fill(0).map(() => Array(GRID_RES).fill(false));
    let totalCellsFilled = 0;

    frames.forEach(f => {
        const startX = Math.max(0, Math.floor(f.x));
        const startY = Math.max(0, Math.floor(f.y));
        const endX = Math.min(GRID_RES, Math.ceil(f.x + f.w));
        const endY = Math.min(GRID_RES, Math.ceil(f.y + f.h));

        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                if (!grid[x][y]) {
                    grid[x][y] = true;
                    totalCellsFilled++;
                }
            }
        }
    });

    const coveragePct = (totalCellsFilled / (GRID_RES * GRID_RES)) * 100;
    return {
        isComplete: coveragePct >= 99.9,
        percentage: Math.round(coveragePct),
        missingCells: (GRID_RES * GRID_RES) - totalCellsFilled
    };
  }, [frames]);

  const collisions = React.useMemo(() => {
    const overlapping = new Set();
    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        const a = frames[i];
        const b = frames[j];
        // Standard AABB collision check
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) { 
            overlapping.add(a.i); 
            overlapping.add(b.i); 
        }
      }
    }
    return Array.from(overlapping);
  }, [frames]);

  useEffect(() => {
    if (!architectRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(architectRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  const loadTemplate = (template) => {
    const parsedLayout = typeof template.layout === 'string' ? JSON.parse(template.layout) : template.layout;
    setTemplateName(template.name);
    setFrames(parsedLayout);
    setActiveTab('editor');
    toast.success(`Layout ${template.name} Loaded`);
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Terminate this layout permanently?')) return;
    try {
      await api.delete(`/api/templates/${id}`);
      toast.success('Layout Terminated');
      refetch();
    } catch { toast.error('Termination failure'); }
  };

  const getCoveredLayout = (currentFrames) => {
    if (currentFrames.length === 0) return currentFrames;
    let layout = [...currentFrames].map(f => ({ ...f }));
    
    // 1. Horizontal Expansion (Right)
    layout.forEach(f => {
      let rightEdge = f.x + f.w;
      let nearestX = 100;
      layout.forEach(other => {
        if (other.i === f.i) return;
        const verticalOverlap = !(other.y >= f.y + f.h || other.y + other.h <= f.y);
        if (other.x >= rightEdge - 0.1 && verticalOverlap) {
          if (other.x < nearestX) nearestX = other.x;
        }
      });
      f.w = Math.max(f.w, nearestX - f.x);
    });

    // 2. Vertical Expansion (Down)
    layout.forEach(f => {
      let bottomEdge = f.y + f.h;
      let nearestY = 100;
      layout.forEach(other => {
        if (other.i === f.i) return;
        const horizontalOverlap = !(other.x >= f.x + f.w || other.x + other.w <= f.x);
        if (other.y >= bottomEdge - 0.1 && horizontalOverlap) {
          if (other.y < nearestY) nearestY = other.y;
        }
      });
      f.h = Math.max(f.h, nearestY - f.y);
    });

    // 3. Horizontal Expansion (Left)
    layout.forEach(f => {
      let leftEdge = f.x;
      let nearestX = 0;
      layout.forEach(other => {
        if (other.i === f.i) return;
        const verticalOverlap = !(other.y >= f.y + f.h || other.y + other.h <= f.y);
        if (other.x + other.w <= leftEdge + 0.1 && verticalOverlap) {
          if (other.x + other.w > nearestX) nearestX = other.x + other.w;
        }
      });
      const diff = f.x - nearestX;
      if (diff > 0) {
          f.x = nearestX;
          f.w += diff;
      }
    });

    // 4. Vertical Expansion (Up)
    layout.forEach(f => {
      let topEdge = f.y;
      let nearestY = 0;
      layout.forEach(other => {
        if (other.i === f.i) return;
        const horizontalOverlap = !(other.x >= f.x + f.w || other.x + other.w <= f.x);
        if (other.y + other.h <= topEdge + 0.1 && horizontalOverlap) {
          if (other.y + other.h > nearestY) nearestY = other.y + other.h;
        }
      });
      const diff = f.y - nearestY;
      if (diff > 0) {
          f.y = nearestY;
          f.h += diff;
      }
    });

    // 5. Final fallback check
    const GRID_RES = 100;
    const grid = Array(GRID_RES).fill(0).map(() => Array(GRID_RES).fill(false));
    let totalCellsFilled = 0;
    layout.forEach(f => {
        const startX = Math.max(0, Math.floor(f.x));
        const startY = Math.max(0, Math.floor(f.y));
        const endX = Math.min(GRID_RES, Math.ceil(f.x + f.w));
        const endY = Math.min(GRID_RES, Math.ceil(f.y + f.h));
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                if (!grid[x][y]) { grid[x][y] = true; totalCellsFilled++; }
            }
        }
    });

    // If gaps still exist (e.g. L-shapes or disconnected areas), force the largest frame to cover everything
    // and push it to the background so it doesn't hide other frames.
    if (totalCellsFilled < GRID_RES * GRID_RES) {
        let largest = layout[0];
        let maxArea = 0;
        layout.forEach(f => {
            const area = f.w * f.h;
            if (area > maxArea) { maxArea = area; largest = f; }
        });
        largest.x = 0;
        largest.y = 0;
        largest.w = 100;
        largest.h = 100;
        largest.zIndex = -1; // Force to background
    }

    return layout;
  };

  const saveTemplate = async () => {
    if (!templateName) return toast.error('Layout Name missing');
    if (frames.length === 0) return toast.error('Canvas empty');
    if (collisions.length > 0) return toast.error('Resolve spatial collisions');
    
    // 🧠 AUTOMATION: Silent Auto-Fill
    let finalFrames = frames;
    if (!coverageReport.isComplete) {
        toast('Optimizing layout for 100% coverage...', { icon: '⚡' });
        finalFrames = getCoveredLayout(frames);
    }

    try {
      await api.post(`/api/templates`, { 
        name: templateName.trim(), 
        layout: JSON.stringify(finalFrames) 
      });
      toast.success('Layout Saved');
      resetBuilder();
      refetch();
      if (fetchData) fetchData();
      setActiveTab('inventory');
    } catch (err) { 
      const msg = err.response?.data?.message || 'Save failure';
      toast.error(msg); 
    }
  };

  const autoFillGaps = () => {
    // 🧠 ADVANCED GRID SNAP & ALIGNMENT
    const newFrames = frames.map(f => {
        let nx = snapToGrid(f.x);
        let ny = snapToGrid(f.y);
        let nw = snapToGrid(f.w);
        let nh = snapToGrid(f.h);

        // Snap to edges if within threshold
        if (nx < 2) nx = 0;
        if (ny < 2) ny = 0;
        if (nx + nw > 98) nw = 100 - nx;
        if (ny + nh > 98) nh = 100 - ny;

        return { ...f, x: nx, y: ny, w: nw, h: nh };
    });
    
    setFrames(newFrames);
    toast.success('Broadcast Alignment Applied');
  };

  const fillRemainingSpace = () => {
    const newFrames = getCoveredLayout(frames);
    if (newFrames.length > frames.length) {
        setFrames(newFrames);
        toast.success(`Generated ${newFrames.length - frames.length} filler zones.`);
    } else {
        toast.success('Perfect Coverage Detected');
    }
  };

  const pctToPx = (pct, total) => (pct / 100) * total;
  const pxToPct = (px, total) => {
      let rawPct = (px / total) * 100;
      let snapped = snapToGrid(rawPct);
      
      // 🧲 STICKY EDGES
      if (snapped < 1) snapped = 0;
      if (snapped > 99) snapped = 100;
      
      return snapped;
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
          
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2"><Grid3X3 className="text-indigo-600" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Templates</span></div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">BROADCAST EDITOR</h2>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Visual Editor</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Saved ({templates.length})</button>
                </div>
            </div>

            {activeTab === 'editor' && (
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-inner">
                    <div className="flex gap-2">
                        <button onClick={addFrame} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"><Plus size={14}/> Create Zone</button>
                        <div className="w-px h-8 bg-slate-300 mx-2" />
                        <button onClick={() => setFrames([{ i: 'Main', x: 0, y: 0, w: 100, h: 100, type: 'media', zIndex: 1 }])} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all text-slate-600 shadow-sm">Standard</button>
                        <button onClick={() => setFrames([{ i: 'Left', x: 0, y: 0, w: 50, h: 100, type: 'media', zIndex: 1 }, { i: 'Right', x: 50, y: 0, w: 50, h: 100, type: 'media', zIndex: 1 }])} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all text-slate-600 shadow-sm">Vertical Split</button>
                        <button onClick={autoFillGaps} className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase hover:bg-amber-100 transition-all shadow-sm">Grid Alignment</button>
                        <button onClick={fillRemainingSpace} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all shadow-sm flex items-center gap-2"><Maximize size={12}/> Fill Gaps</button>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Broadcast Coverage</p>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-500 ${coverageReport.isComplete ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} style={{ width: `${coverageReport.percentage}%` }} />
                                </div>
                                <span className={`text-[10px] font-black ${coverageReport.isComplete ? 'text-emerald-600' : 'text-rose-600'}`}>{coverageReport.percentage}%</span>
                            </div>
                        </div>
                        <button onClick={resetBuilder} className="px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all shadow-sm">Reset Architect</button>
                    </div>
                </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-white">
            {activeTab === 'editor' ? (
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
                    <div className="p-8 bg-[#F1F5F9]/50 flex-1 overflow-hidden flex items-center justify-center">
                        <div className="relative w-full max-w-5xl mx-auto">
                            <div className={`absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 rounded-[48px] blur-xl opacity-50 transition-colors duration-300 ${collisions.length > 0 ? 'from-rose-500/20 to-rose-400/20' : ''}`} />
                            <div ref={architectRef} className="relative w-full aspect-video bg-slate-950 border-[8px] border-slate-900 rounded-[40px] overflow-hidden shadow-2xl" style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                                {frames.map((f) => (
                                    <Rnd 
                                        key={f.i} 
                                        size={{ width: `${f.w}%`, height: `${f.h}%` }} 
                                        position={{ x: pctToPx(f.x, containerSize.width), y: pctToPx(f.y, containerSize.height) }} 
                                        onDragStart={() => setIsDragging(true)}
                                        onDragStop={(e, d) => {
                                            setIsDragging(false);
                                            updateFrame(f.i, { x: pxToPct(d.x, containerSize.width), y: pxToPct(d.y, containerSize.height) });
                                        }} 
                                        onResizeStart={() => setIsDragging(true)}
                                        onResizeStop={(e, dir, ref, delta, pos) => {
                                            setIsDragging(false);
                                            updateFrame(f.i, { 
                                                w: pxToPct(ref.offsetWidth, containerSize.width), 
                                                h: pxToPct(ref.offsetHeight, containerSize.height), 
                                                x: pxToPct(pos.x, containerSize.width), 
                                                y: pxToPct(pos.y, containerSize.height) 
                                            });
                                        }} 
                                        bounds="parent" 
                                        onClick={() => selectFrame(f.i)} 
                                        className={`group border-2 ${selectedFrameId === f.i ? 'border-sky-400 z-50 shadow-2xl bg-sky-500/10' : collisions.includes(f.i) ? 'border-rose-500 z-40 bg-rose-500/20' : 'border-white/10 z-10 hover:border-white/30 hover:bg-white/5'}`} 
                                        dragHandleClassName="drag-handle"
                                    >
                                        <div className={`w-full h-full relative flex flex-col items-center justify-center rounded-lg transition-colors duration-200 ${isDragging ? 'bg-sky-500/5' : ''}`}>
                                            <div className={`drag-handle absolute top-0 left-0 right-0 h-8 bg-sky-600 flex items-center justify-between px-3 cursor-move transition-opacity ${selectedFrameId === f.i || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><span className="text-[10px] font-black uppercase text-white tracking-widest">{f.i}</span><button onClick={(e) => { e.stopPropagation(); removeFrame(f.i); }} className="text-white hover:text-rose-200"><XCircle size={14}/></button></div>
                                            <div className="text-center pointer-events-none p-4"><p className={`text-2xl font-black tracking-tighter uppercase transition-colors ${collisions.includes(f.i) ? 'text-rose-500' : 'text-white/40'}`}>{f.type}</p><p className={`text-[10px] font-bold uppercase mt-1 ${collisions.includes(f.i) ? 'text-rose-400' : 'text-white/20'}`}>{f.w}% × {f.h}%</p></div>
                                        </div>
                                    </Rnd>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* RIGHT PANE: Config */}
                    <div className="lg:w-1/3 flex flex-col h-full bg-white divide-y divide-slate-200">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Frame Logic</h4>
                            {selectedFrameId ? frames.filter(f => f.i === selectedFrameId).map(f => (
                                <div key={f.i} className="grid grid-cols-2 gap-6 animate-fade-in">
                                    <div className="space-y-2 col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Type</label><select className="nexus-input bg-slate-50 border-slate-200" value={f.type} onChange={(e) => updateFrame(f.i, { type: e.target.value })}><option value="media">Broadcast</option><option value="ticker">Ticker</option><option value="widget">Widget</option></select></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">X Pos (%)</label><input type="number" className="nexus-input bg-slate-50 border-slate-200" value={f.x} onChange={(e) => updateFrame(f.i, { x: parseInt(e.target.value) || 0 })}/></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Y Pos (%)</label><input type="number" className="nexus-input bg-slate-50 border-slate-200" value={f.y} onChange={(e) => updateFrame(f.i, { y: parseInt(e.target.value) || 0 })}/></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Width (%)</label><input type="number" className="nexus-input bg-slate-50 border-slate-200" value={f.w} onChange={(e) => updateFrame(f.i, { w: parseInt(e.target.value) || 1 })}/></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Height (%)</label><input type="number" className="nexus-input bg-slate-50 border-slate-200" value={f.h} onChange={(e) => updateFrame(f.i, { h: parseInt(e.target.value) || 1 })}/></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Stack (Z)</label><input type="number" className="nexus-input bg-slate-50 border-slate-200" value={f.zIndex} onChange={(e) => updateFrame(f.i, { zIndex: parseInt(e.target.value) || 1 })}/></div>
                                    <div className="flex items-end"><button onClick={() => removeFrame(f.i)} className="nexus-btn-primary bg-rose-500 hover:bg-rose-600 w-full py-3.5 rounded-2xl"><Trash2 size={16}/></button></div>
                                </div>
                            )) : <div className="h-full min-h-[200px] flex items-center justify-center opacity-30 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"><p className="text-[10px] font-black uppercase tracking-[4px]">Select Frame</p></div>}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-slate-50/50">
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-3"><div className="w-6 h-px bg-emerald-600/30" /> SAVE LAYOUT</h4>
                            <div className="space-y-6">
                                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Name</label><input type="text" className="nexus-input bg-white border-slate-200 font-black text-lg" placeholder="SCHEDULE-ALPHA" value={templateName} onChange={(e) => setTemplateName(e.target.value)}/></div>
                                {collisions.length > 0 && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3"><AlertTriangle className="text-rose-500 shrink-0" size={16} /><p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest leading-relaxed">Spatial Collision: {collisions.join(', ')}</p></div>}
                                <button onClick={saveTemplate} className="nexus-btn-primary w-full py-4 text-[10px] tracking-[6px] shadow-xl uppercase">SAVE LAYOUT</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                        {templates.map(t => (
                            <div key={t._id} className="p-10 bg-white border border-slate-200 rounded-[48px] transition-all hover:border-indigo-400 hover:shadow-2xl group flex flex-col">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-sm"><LayoutIcon size={32} /></div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => loadTemplate(t)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-all"><Maximize size={20}/></button>
                                        <button onClick={() => deleteTemplate(t._id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate mb-2">{t.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px] mb-8 flex items-center gap-2"><Layers size={12}/> {(typeof t.layout === 'string' ? JSON.parse(t.layout) : t.layout).length} Layers</p>
                                <div className="mt-auto aspect-video bg-slate-900 rounded-[32px] overflow-hidden relative shadow-inner p-1 border-4 border-slate-800">
                                    {(typeof t.layout === 'string' ? JSON.parse(t.layout) : t.layout).map((f, idx) => (<div key={idx} className="absolute border border-white/20 bg-white/5 rounded" style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }} />))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
       </div>
  );
};

export default LayoutArchitect;
