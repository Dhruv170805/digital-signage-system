import React, { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { Palette, XCircle, FileText, Info, Trash2, Plus, Layers, Maximize, AlertTriangle, Save, RefreshCw, Layout as LayoutIcon, Monitor, Settings, Zap, Type, MoveRight, Power } from 'lucide-react';
import api from '../../services/api';
import { useTemplates } from '../../hooks/useAdminData';
import useBuilderStore from '../../store/useBuilderStore';
import toast from 'react-hot-toast';

const LayoutArchitect = ({ fetchData }) => {
  const { data: templates = [], refetch } = useTemplates();
  const { 
    templateName, setTemplateName, 
    frames, setFrames, addFrame, updateFrame, removeFrame, 
    selectedFrameId, selectFrame, resetBuilder 
  } = useBuilderStore();

  const [activeTab, setActiveTab] = useState('editor'); 
  const architectRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [collisions, setCollisions] = useState([]);

  const checkCollisions = (currentFrames) => {
    const overlapping = new Set();
    for (let i = 0; i < currentFrames.length; i++) {
      for (let j = i + 1; j < currentFrames.length; j++) {
        const a = currentFrames[i];
        const b = currentFrames[j];
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

  useEffect(() => { checkCollisions(frames); }, [frames]);

  useEffect(() => {
    if (!architectRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(architectRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  const safeParseJSON = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  const saveTemplate = async () => {
    if (!templateName) return toast.error('Layout identity missing');
    if (frames.length === 0) return toast.error('Canvas empty');
    if (collisions.length > 0) return toast.error('Resolve spatial collisions');

    try {
      await api.post(`/api/templates`, { name: templateName.trim(), layout: JSON.stringify(frames) });
      toast.success('Manifest Synchronized');
      resetBuilder();
      refetch();
      if (fetchData) fetchData();
      setActiveTab('inventory');
    } catch (err) { toast.error('Sync failure'); }
  };

  const loadTemplate = (t) => {
    setTemplateName(t.name);
    setFrames(safeParseJSON(t.layout));
    setActiveTab('editor');
    toast.success(`Protocol ${t.name} Loaded`);
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Wipe layout from system?')) return;
    try {
      await api.delete(`/api/templates/${id}`);
      toast.success('Layout Purged');
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error('Purge failed'); }
  };

  const pctToPx = (pct, total) => (pct / 100) * total;
  const pxToPct = (px, total) => Math.round((px / total) * 100);

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          
          {/* CONTROL CENTER HEADER */}
          <div className="bg-black/10 p-8 border-b border-white/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="text-indigo-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-500">Spatial Engine</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Architect Workspace</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Studio
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Manifest ({templates.length})
                    </button>
                </div>
            </div>

            {/* INTEGRATED CANVAS MONITOR */}
            {activeTab === 'editor' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex gap-2">
                            <button onClick={addFrame} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"><Plus size={14}/> Provision Frame</button>
                            <div className="w-px h-8 bg-slate-200 mx-2" />
                            <button onClick={() => setFrames([{ i: 'Main', x: 0, y: 0, w: 100, h: 100, type: 'media', zIndex: 1 }])} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm">100% Scale</button>
                            <button onClick={() => setFrames([{ i: 'Left', x: 0, y: 0, w: 50, h: 100, type: 'media', zIndex: 1 }, { i: 'Right', x: 50, y: 0, w: 50, h: 100, type: 'media', zIndex: 1 }])} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm">Split-V</button>
                        </div>
                        <button onClick={resetBuilder} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">Reset Canvas</button>
                    </div>

                    <div className="relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-sky-500/20 rounded-[32px] blur opacity-25 group-hover:opacity-40 transition duration-1000 ${collisions.length > 0 ? 'from-rose-500/30 to-rose-500/30 opacity-60' : ''}`} />
                        <div 
                            ref={architectRef}
                            className="relative aspect-[21/7] bg-slate-950 border-4 border-slate-900 rounded-[32px] overflow-hidden shadow-2xl"
                            style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                        >

                            {frames.map((f) => (
                                <Rnd
                                    key={f.i}
                                    size={{ width: `${f.w}%`, height: `${f.h}%` }}
                                    position={{ x: pctToPx(f.x, containerSize.width), y: pctToPx(f.y, containerSize.height) }}
                                    onDragStop={(e, d) => {
                                        updateFrame(f.i, { x: pxToPct(d.x, containerSize.width), y: pxToPct(d.y, containerSize.height) });
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
                                    className={`group border-2 ${
                                        selectedFrameId === f.i ? 'border-sky-500 z-50 shadow-[0_0_40px_rgba(56,189,248,0.4)] bg-sky-500/10' : 
                                        collisions.includes(f.i) ? 'border-rose-500 z-40 bg-rose-500/20 animate-pulse' : 
                                        'border-white/10 z-10 hover:border-white/30 hover:bg-white/5'
                                    }`}
                                    dragHandleClassName="drag-handle"
                                >
                                    <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden rounded-xl">
                                        <div className={`drag-handle absolute top-0 left-0 right-0 h-8 bg-sky-500/20 backdrop-blur-md flex items-center justify-between px-3 cursor-move opacity-0 group-hover:opacity-100 transition-opacity ${selectedFrameId === f.i ? 'opacity-100' : ''}`}>
                                            <span className="text-[10px] font-black uppercase text-sky-300 tracking-widest">{f.i}</span>
                                            <button onClick={(e) => { e.stopPropagation(); removeFrame(f.i); }} className="text-rose-400 hover:text-rose-200 transition-colors"><XCircle size={14}/></button>
                                        </div>
                                        <div className="text-center pointer-events-none p-4">
                                            <p className={`text-2xl font-black tracking-tighter uppercase ${collisions.includes(f.i) ? 'text-rose-500' : 'text-white/40'}`}>{f.type}</p>
                                            <p className={`text-[10px] font-bold uppercase mt-1 ${collisions.includes(f.i) ? 'text-rose-400/60' : 'text-white/20'}`}>{f.w}% × {f.h}%</p>
                                        </div>
                                    </div>
                                </Rnd>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* STUDIO CONTENT */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === 'editor' ? (
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200/50">
                    
                    {/* Left Pane: Frame Engineering */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-sky-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-sky-600/30" /> Frame Engineering
                            </h4>
                            {selectedFrameId ? (
                                <div className="space-y-10 animate-fade-in">
                                    {frames.filter(f => f.i === selectedFrameId).map(f => (
                                        <div key={f.i} className="space-y-8">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Logic Type</label>
                                                    <select className="nexus-input bg-slate-50" value={f.type} onChange={(e) => updateFrame(f.i, { type: e.target.value })}>
                                                        <option value="media">Multimedia Broadcast</option>
                                                        <option value="ticker">System Ticker</option>
                                                        <option value="widget">External Widget</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Stack Index</label>
                                                    <input type="number" className="nexus-input bg-slate-50" value={f.zIndex} onChange={(e) => updateFrame(f.i, { zIndex: parseInt(e.target.value) || 1 })}/>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">X Coordinate (%)</label>
                                                    <input type="number" className="nexus-input bg-slate-50" value={f.x} onChange={(e) => updateFrame(f.i, { x: parseInt(e.target.value) || 0 })}/>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Y Coordinate (%)</label>
                                                    <input type="number" className="nexus-input bg-slate-50" value={f.y} onChange={(e) => updateFrame(f.i, { y: parseInt(e.target.value) || 0 })}/>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Width Factor (%)</label>
                                                    <input type="number" className="nexus-input bg-slate-50" value={f.w} onChange={(e) => updateFrame(f.i, { w: parseInt(e.target.value) || 1 })}/>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Height Factor (%)</label>
                                                    <input type="number" className="nexus-input bg-slate-50" value={f.h} onChange={(e) => updateFrame(f.i, { h: parseInt(e.target.value) || 1 })}/>
                                                </div>
                                            </div>

                                            <button onClick={() => removeFrame(f.i)} className="w-full py-5 bg-rose-50 text-rose-600 rounded-3xl text-[10px] font-black uppercase tracking-[4px] hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-500/5">DE-PROVISION LAYER</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50">
                                    <Layers className="text-slate-300 mx-auto mb-4" size={40} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">Select Frame to Configure</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Pane: Manifest Protocol */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-emerald-600/30" /> Manifest Protocol
                            </h4>
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Protocol Identifier</label>
                                    <input 
                                        type="text" 
                                        className="nexus-input bg-white text-xl font-black placeholder:opacity-20" 
                                        placeholder="GLOBAL-WORKSPACE-ALPHA"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                    />
                                </div>

                                {collisions.length > 0 && (
                                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-[32px] flex items-start gap-4 shadow-xl shadow-rose-500/5">
                                        <AlertTriangle className="text-rose-500 mt-1" size={24} />
                                        <div>
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Protocol Collision</p>
                                            <p className="text-[11px] font-bold text-rose-500/60 mt-2 leading-relaxed uppercase">Spatial overlap detected in layers: {collisions.join(', ')}. Optimize coordinates to prevent rendering artifacts.</p>
                                        </div>
                                    </div>
                                )}

                                <button onClick={saveTemplate} className="nexus-btn-primary w-full py-6 text-[10px] tracking-[6px] shadow-2xl uppercase">
                                    SYNCHRONIZE MANIFEST
                                </button>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-slate-200" /> Spatial Inventory
                            </h4>
                            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="py-4 px-8">Zone ID</th>
                                            <th className="py-4 px-8">Logic</th>
                                            <th className="py-4 px-8 text-right">Dimension</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {frames.map(f => (
                                            <tr key={f.i} onClick={() => selectFrame(f.i)} className={`cursor-pointer transition-all hover:bg-slate-50 ${selectedFrameId === f.i ? 'bg-indigo-50/50' : ''}`}>
                                                <td className="py-4 px-8 text-[10px] font-black text-text uppercase">{f.i}</td>
                                                <td className="py-4 px-8">
                                                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border ${f.type === 'ticker' ? 'bg-sky-50 text-sky-600 border-sky-100' : f.type === 'widget' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                        {f.type}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-8 text-right text-[10px] font-bold text-slate-400 tabular-nums">{f.w}%×{f.h}%</td>
                                            </tr>
                                        ))}
                                        {frames.length === 0 && (
                                            <tr><td colSpan="3" className="py-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-[4px]">No Provisioned Layers</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            ) : (
                /* MANIFEST INVENTORY VIEW */
                <div className="h-full overflow-y-auto custom-scrollbar p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                        {templates.map(t => (
                            <div key={t._id} className="p-10 bg-white border border-slate-200 rounded-[48px] transition-all hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/5 group relative">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center border border-indigo-100 text-indigo-500">
                                        <LayoutIcon size={28} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => loadTemplate(t)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-110 transition-all"><Maximize size={20}/></button>
                                        <button onClick={() => deleteTemplate(t._id)} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-text uppercase tracking-tight truncate mb-2">{t.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[6px] mb-10 flex items-center gap-2">
                                    <Layers size={12}/> {safeParseJSON(t.layout).length} Layers Provisioned
                                </p>

                                <div className="aspect-video bg-slate-950 rounded-[32px] overflow-hidden border border-slate-900 relative shadow-inner p-1">
                                    {safeParseJSON(t.layout).map((f, idx) => (
                                        <div key={idx} className="absolute border border-white/20 bg-white/5 rounded-md" style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <div className="col-span-full py-60 text-center border-2 border-dashed border-slate-200 rounded-[60px]">
                                <p className="text-[12px] font-black text-slate-300 uppercase tracking-[16px]">No Protocols Compiled</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
       </div>
    </div>
  );
};

export default LayoutArchitect;
