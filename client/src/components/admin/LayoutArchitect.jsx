import React, { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { Palette, XCircle, FileText, Info, Trash2, Plus, Layers, Maximize } from 'lucide-react';
import api from '../../services/api';
import { useTemplates } from '../../hooks/useAdminData';
import useBuilderStore from '../../store/useBuilderStore';
import toast from 'react-hot-toast';
import Card from './Card';

const LayoutArchitect = ({ fetchData }) => {
  const { data: templates = [], refetch } = useTemplates();
  const { 
    templateName, setTemplateName, 
    frames, setFrames, addFrame, updateFrame, removeFrame, 
    selectedFrameId, selectFrame, resetBuilder 
  } = useBuilderStore();

  const architectRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [collisions, setCollisions] = useState([]);

  const checkCollisions = (currentFrames) => {
    const overlapping = new Set();
    for (let i = 0; i < currentFrames.length; i++) {
      for (let j = i + 1; j < currentFrames.length; j++) {
        const a = currentFrames[i];
        const b = currentFrames[j];
        
        // Simple AABB collision detection in % space
        const isOverlapping = (
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y
        );

        if (isOverlapping) {
          overlapping.add(a.i);
          overlapping.add(b.i);
        }
      }
    }
    setCollisions(Array.from(overlapping));
  };

  useEffect(() => {
    checkCollisions(frames);
  }, [frames]);

  useEffect(() => {
    if (!architectRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
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
    if (frames.length === 0) return toast.error('Add at least one frame');
    if (collisions.length > 0) return toast.error('Resolve frame collisions before saving');

    try {
      await api.post(`/api/templates`, { 
        name: templateName.trim(), 
        layout: JSON.stringify(frames) 
      });
      toast.success('Layout Saved Successfully');
      resetBuilder();
      refetch();
      if (fetchData) fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.error || err.message); 
    }
  };

  const loadTemplate = (t) => {
    setTemplateName(t.name);
    setFrames(safeParseJSON(t.layout));
  };

  // Convert % to px for rendering
  const pctToPx = (pct, total) => (pct / 100) * total;
  // Convert px to % for saving
  const pxToPct = (px, total) => Math.round((px / total) * 100);

  return (
    <div className="space-y-8 animate-fade-in text-text">
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Architect View */}
          <Card 
            className="lg:col-span-3 overflow-visible" 
            title="Canvas Architect" 
            icon={Palette} 
            subtitle="Precision Absolute Positioning System"
          >
             <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={addFrame} className="nexus-btn-primary flex items-center gap-2 py-2 text-[10px]">
                   <Plus size={14}/> Add New Frame
                </button>
                <button onClick={() => setFrames([{ i: 'Main', x: 0, y: 0, w: 100, h: 100, type: 'media', zIndex: 1 }])} className="px-4 py-2 bg-slate-800 rounded-xl text-[10px] font-black uppercase hover:bg-slate-700">Fullscreen</button>
                <button onClick={() => setFrames([{ i: 'Left', x: 0, y: 0, w: 50, h: 100, type: 'media', zIndex: 1 }, { i: 'Right', x: 50, y: 0, w: 50, h: 100, type: 'media', zIndex: 1 }])} className="px-4 py-2 bg-slate-800 rounded-xl text-[10px] font-black uppercase hover:bg-slate-700">Split V</button>
                <button onClick={resetBuilder} className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Clear Canvas</button>
             </div>

             <div 
               ref={architectRef}
               className="aspect-video bg-slate-950 border-4 border-slate-900 rounded-[32px] relative overflow-hidden shadow-inner"
               style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }}
             >
                {frames.map((f) => (
                  <Rnd
                    key={f.i}
                    size={{ 
                      width: `${f.w}%`, 
                      height: `${f.h}%` 
                    }}
                    position={{ 
                      x: pctToPx(f.x, containerSize.width), 
                      y: pctToPx(f.y, containerSize.height) 
                    }}
                    onDragStop={(e, d) => {
                      updateFrame(f.i, { 
                        x: pxToPct(d.x, containerSize.width), 
                        y: pxToPct(d.y, containerSize.height) 
                      });
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      updateFrame(f.i, {
                        w: pxToPct(ref.offsetWidth, containerSize.width),
                        h: pxToPct(ref.offsetHeight, containerSize.height),
                        x: pxToPct(position.x, containerSize.width),
                        y: pxToPct(position.y, containerSize.height),
                      });
                    }}
                    bounds="parent"
                    onClick={() => selectFrame(f.i)}
                    className={`group border-2 transition-colors ${
                      selectedFrameId === f.i ? 'border-sky-500 z-50 shadow-[0_0_30px_rgba(56,189,248,0.3)]' : 
                      collisions.includes(f.i) ? 'border-rose-500 z-40 bg-rose-500/10' : 
                      'border-white/10 z-10 hover:border-white/30'
                    }`}
                    dragHandleClassName="drag-handle"
                  >
                     <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm relative flex flex-col items-center justify-center overflow-hidden rounded-lg">
                        <div className={`drag-handle absolute top-0 left-0 right-0 h-6 bg-sky-500/20 flex items-center justify-between px-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity ${selectedFrameId === f.i ? 'opacity-100' : ''}`}>
                           <span className="text-[8px] font-black uppercase text-sky-300">{f.i} {collisions.includes(f.i) ? '(!)' : ''}</span>
                           <button onClick={(e) => { e.stopPropagation(); removeFrame(f.i); }} className="text-rose-400 hover:text-rose-200"><XCircle size={12}/></button>
                        </div>
                        <div className="text-center pointer-events-none">
                           <p className={`text-2xl font-black tracking-tighter uppercase transition-colors ${collisions.includes(f.i) ? 'text-rose-500' : 'text-white/20'}`}>{f.type}</p>
                           <p className={`text-[10px] font-bold uppercase ${collisions.includes(f.i) ? 'text-rose-400/60' : 'text-sky-500/40'}`}>{f.w}% x {f.h}%</p>
                        </div>
                     </div>
                  </Rnd>
                ))}
             </div>

             <div className="mt-8 flex gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex-1 space-y-1">
                   <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Layout Identifier</label>
                   <input 
                     type="text" 
                     placeholder="e.g., GLOBAL-PROMO-LAYOUT" 
                     className="nexus-input" 
                     value={templateName} 
                     onChange={(e) => setTemplateName(e.target.value)}
                   />
                </div>
                <div className="flex items-end pb-1">
                   <button onClick={saveTemplate} className="nexus-btn-primary px-12 py-3.5 tracking-[4px]">PUBLISH</button>
                </div>
             </div>
          </Card>

          {/* Controls & Library */}
          <div className="space-y-8">
             <Card title="Properties" icon={Layers} subtitle="Frame Fine-Tuning">
                {collisions.length > 0 && (
                   <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-pulse">
                      <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                      <p className="text-[10px] font-black text-rose-500 uppercase leading-tight">Collision Detected: Adjust frames to resolve overlap</p>
                   </div>
                )}
                {selectedFrameId ? (
                   <div className="space-y-6">
                      {frames.filter(f => f.i === selectedFrameId).map(f => (
                         <div key={f.i} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase opacity-40">Type</label>
                                  <select 
                                    className="nexus-input py-2 text-xs" 
                                    value={f.type} 
                                    onChange={(e) => updateFrame(f.i, { type: e.target.value })}
                                  >
                                     <option value="media">Media</option>
                                     <option value="ticker">Ticker</option>
                                     <option value="widget">Widget</option>
                                  </select>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase opacity-40">Z-Index</label>
                                  <input 
                                    type="number" 
                                    className="nexus-input py-2 text-xs" 
                                    value={f.zIndex} 
                                    onChange={(e) => updateFrame(f.i, { zIndex: parseInt(e.target.value) || 1 })}
                                  />
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase opacity-40">X Position (%)</label>
                                  <input 
                                    type="number" 
                                    min="0" max="100"
                                    className="nexus-input py-2 text-xs" 
                                    value={f.x} 
                                    onChange={(e) => updateFrame(f.i, { x: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase opacity-40">Y Position (%)</label>
                                  <input 
                                    type="number" 
                                    min="0" max="100"
                                    className="nexus-input py-2 text-xs" 
                                    value={f.y} 
                                    onChange={(e) => updateFrame(f.i, { y: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                  />
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase opacity-40">Width (%)</label>
                                  <input 
                                    type="number" 
                                    min="1" max="100"
                                    className="nexus-input py-2 text-xs" 
                                    value={f.w} 
                                    onChange={(e) => updateFrame(f.i, { w: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })}
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase opacity-40">Height (%)</label>
                                  <input 
                                    type="number" 
                                    min="1" max="100"
                                    className="nexus-input py-2 text-xs" 
                                    value={f.h} 
                                    onChange={(e) => updateFrame(f.i, { h: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })}
                                  />
                               </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                               <span className="text-[10px] font-black uppercase text-slate-400">Layer {f.zIndex}</span>
                               <button onClick={() => removeFrame(f.i)} className="text-rose-500 hover:text-rose-700"><Trash2 size={16}/></button>
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-3xl">
                      <Info className="text-slate-300 mb-2" size={24} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Select a frame on the canvas to edit properties</p>
                   </div>
                )}
             </Card>

             <Card title="Manifest" icon={FileText} subtitle="Saved Designs">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {templates.map(t => (
                      <div key={t._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center group hover:border-sky-500/30 transition-all">
                         <div className="truncate pr-4">
                            <p className="text-[10px] font-black uppercase text-slate-700 truncate">{t.name}</p>
                            <p className="text-[8px] font-bold text-sky-600 opacity-60 uppercase">{safeParseJSON(t.layout).length} Layers</p>
                         </div>
                         <button onClick={() => loadTemplate(t)} className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-sky-500 hover:text-white transition-all shadow-sm">Load</button>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
       </div>
    </div>
  );
};

export default LayoutArchitect;
