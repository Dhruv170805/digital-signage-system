import React, { useState, useEffect } from 'react';
import { Radio, Calendar, Play, Layers, AlertTriangle, Monitor, Trash2, Copy, Zap, Clock, Plus, GripVertical, Settings, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../../services/api';
import { useScreens, useTemplates, useMedia, useTickers, useSchedules } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const getMediaUrl = (filePath) => {
  if (!filePath) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${apiBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
};

const PDFThumbnail = ({ url }) => {
    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white">
            <Document 
                file={url} 
                loading={<div className="animate-pulse flex flex-col items-center gap-2"><Layers size={20} className="text-slate-300"/><span className="text-[8px] font-black text-slate-400 uppercase">Loading PDF...</span></div>}
                error={<div className="flex flex-col items-center gap-2"><AlertTriangle size={20} className="text-rose-500"/><span className="text-[8px] font-black text-rose-500 uppercase">PDF Error</span></div>}
            >
                <Page 
                    pageNumber={1} 
                    width={300} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-2xl"
                />
            </Document>
        </div>
    );
};

const AppleDateInput = ({ value, onChange, label }) => {
    const [y, m, d] = (value || "2026-01-01").split('-');
    const [localY, setLocalY] = useState(y);
    const [localM, setLocalM] = useState(m);
    const [localD, setLocalD] = useState(d);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        const [newY, newM, newD] = (value || "2026-01-01").split('-');
        setLocalY(newY);
        setLocalM(newM);
        setLocalD(newD);
        setPrevValue(value);
    }

    const handleBlur = () => {
        let finalY = localY.replace(/\D/g, '').padStart(4, '20');
        let finalM = localM.replace(/\D/g, '').padStart(2, '0');
        let finalD = localD.replace(/\D/g, '').padStart(2, '0');
        if (parseInt(finalM) > 12) finalM = '12';
        if (parseInt(finalD) > 31) finalD = '31';
        onChange(`${finalY}-${finalM}-${finalD}`);
    };
    return (
        <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-500 ml-1">{label}</label>
            <div className="flex items-center justify-center bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm group focus-within:border-indigo-500 transition-all h-10">
                <input type="text" className="w-10 text-center bg-transparent font-black text-[11px] outline-none text-slate-900" value={localY} maxLength={4} onChange={(e) => setLocalY(e.target.value.replace(/\D/g, ''))} onBlur={handleBlur} />
                <span className="text-slate-300 font-bold">/</span>
                <input type="text" className="w-7 text-center bg-transparent font-black text-[11px] outline-none text-slate-900" value={localM} maxLength={2} onChange={(e) => setLocalM(e.target.value.replace(/\D/g, ''))} onBlur={handleBlur} />
                <span className="text-slate-300 font-bold">/</span>
                <input type="text" className="w-7 text-center bg-transparent font-black text-[11px] outline-none text-slate-900" value={localD} maxLength={2} onChange={(e) => setLocalD(e.target.value.replace(/\D/g, ''))} onBlur={handleBlur} />
            </div>
        </div>
    );
};

const AppleTimeInput = ({ value, onChange, label }) => {
    const [h, m] = (value || "00:00").split(':');
    const [localH, setLocalH] = useState(h);
    const [localM, setLocalM] = useState(m);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        const [newH, newM] = (value || "00:00").split(':');
        setLocalH(newH);
        setLocalM(newM);
        setPrevValue(value);
    }

    const handleBlur = () => {
        let finalH = localH.replace(/\D/g, '').padStart(2, '0');
        let finalM = localM.replace(/\D/g, '').padStart(2, '0');
        if (parseInt(finalH) > 23) finalH = '23';
        if (parseInt(finalM) > 59) finalM = '59';
        onChange(`${finalH}:${finalM}`);
    };
    return (
        <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-500 ml-1">{label}</label>
            <div className="flex items-center justify-center bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm group focus-within:border-indigo-500 transition-all h-10">
                <input type="text" className="w-8 text-center bg-transparent font-black text-[11px] outline-none text-slate-900" value={localH} maxLength={2} onChange={(e) => setLocalH(e.target.value.replace(/\D/g, ''))} onBlur={handleBlur} />
                <span className="text-slate-300 font-bold">:</span>
                <input type="text" className="w-8 text-center bg-transparent font-black text-[11px] outline-none text-slate-900" value={localM} maxLength={2} onChange={(e) => setLocalM(e.target.value.replace(/\D/g, ''))} onBlur={handleBlur} />
            </div>
        </div>
    );
};

const BroadcastScheduler = ({ fetchData }) => {
  const { data: screens = [] } = useScreens();
  const [groups, setGroups] = useState([]);
  const { data: templates = [] } = useTemplates();
  const { data: media = [] } = useMedia();
  const { data: tickers = [] } = useTickers();
  const { data: schedules = [], refetch } = useSchedules();

  const [activeTab, setActiveTab] = useState('editor');
  const [libraryTab, setLibraryTab] = useState('media');
  const [dragOverZone, setDragOverZone] = useState(null);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  const [newSchedule, setNewSchedule] = useState(() => {
    const now = Date.now();
    return { 
      targetType: 'all', targetIds: [], templateId: '', mediaId: '',
      startTime: '09:00', endTime: '18:00', 
      startDate: new Date(now).toISOString().slice(0, 10), 
      endDate: new Date(now + 31536000000).toISOString().slice(0, 10),
      priority: 1, duration: 10 
    };
  });

  const [mediaMapping, setMediaMapping] = useState({});
  const [selectedFrame, setSelectedFrame] = useState(null);

  const approvedMedia = media.filter(m => m.status === 'approved');

  useEffect(() => {
    const fetchGroups = async () => { try { const res = await api.get('/api/groups'); setGroups(res.data); } catch { } };
    fetchGroups();
  }, []);

  const safeParseJSON = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    const data = { ...newSchedule, mediaMapping: JSON.stringify(mediaMapping) };
    try {
      await api.post(`/api/schedule`, data);
      toast.success('Deployed');
      setNewSchedule(() => {
        const now = Date.now();
        return { targetType: 'all', targetIds: [], templateId: '', mediaId: '', startTime: '09:00', endTime: '18:00', startDate: new Date(now).toISOString().slice(0, 10), endDate: new Date(now + 31536000000).toISOString().slice(0, 10), priority: 1, duration: 10 };
      });
      setMediaMapping({}); setSelectedFrame(null); refetch(); if (fetchData) fetchData(); setActiveTab('inventory');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Terminate?')) return;
    try { await api.delete(`/api/schedule/${id}`); toast.success('Terminated'); refetch(); if (fetchData) fetchData(); } catch { toast.error('Failed'); }
  };

  const handleDragStart = (e, item, type, sourceZoneId = null) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ ...item, type, sourceZoneId }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingGlobal(true);
  };
  const handleDragEnd = () => { setIsDraggingGlobal(false); setDragOverZone(null); };
  const handleDragOver = (e, zoneId) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverZone !== zoneId) setDragOverZone(zoneId); };
  const handleDragLeave = () => setDragOverZone(null);
  const handleDrop = (e, zoneId) => {
    e.preventDefault(); setIsDraggingGlobal(false); setDragOverZone(null);
    const data = e.dataTransfer.getData('application/json'); if (!data) return;
    const item = JSON.parse(data);
    let alreadyExists = false;
    Object.entries(mediaMapping).forEach(([fid, frameItems]) => { if (fid !== item.sourceZoneId && frameItems.some(fi => fi.mediaId === (item.id || item._id || item.mediaId))) alreadyExists = true; });
    if (alreadyExists) { toast.error('Duplicate file.'); return; }
    setMediaMapping(prev => {
        const newMapping = { ...prev };
        if (item.sourceZoneId && item.uid) newMapping[item.sourceZoneId] = newMapping[item.sourceZoneId].filter(i => i.uid !== item.uid);
        const frameItems = newMapping[zoneId] || [];
        newMapping[zoneId] = [...frameItems, { uid: item.uid || Math.random().toString(36).substr(2, 9), mediaId: item.id || item._id || item.mediaId, fileName: item.fileName || item.text || 'Unknown', fileType: item.fileType || item.type || 'text', filePath: item.filePath || '', type: item.type, duration: item.duration || 10, priority: item.priority || 1, startTime: item.startTime || '00:00', endTime: item.endTime || '23:59', startDate: item.startDate || new Date().toISOString().slice(0, 10), endDate: item.endDate || new Date(Date.now() + 31536000000).toISOString().slice(0, 10) }];
        return newMapping;
    });
    setSelectedFrame(zoneId);
  };

  const removeMappedItem = (zoneId, uid) => setMediaMapping(prev => ({ ...prev, [zoneId]: prev[zoneId].filter(i => i.uid !== uid) }));
  const updateMappedItem = (zoneId, uid, field, value) => setMediaMapping(prev => ({ ...prev, [zoneId]: prev[zoneId].map(i => i.uid === uid ? { ...i, [field]: value } : i) }));
  const selectedTemplate = templates.find(t => (t.id === newSchedule.templateId || t._id === newSchedule.templateId));
  const layout = selectedTemplate ? safeParseJSON(selectedTemplate.layout) : [];

  return (
    <div className="animate-fade-in h-full flex flex-col bg-[#F8FAFC]">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          <div className="bg-white p-8 border-b border-slate-200 shrink-0"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"><div><div className="flex items-center gap-3 mb-2"><Radio className="text-rose-500" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-rose-500">Master Control</span></div><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Broadcast Hub</h2></div><div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200"><button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Omni Studio</button><button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Live Manifest ({schedules.length})</button></div></div></div>
          <div className="flex-1 overflow-hidden min-h-0 bg-white">
            {activeTab === 'editor' ? (
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
                    <div className="lg:w-1/4 flex flex-col h-full bg-slate-50/50"><div className="p-6 border-b border-slate-200 bg-white/80"><h4 className="text-[10px] font-black uppercase text-indigo-600 mb-4 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Library</h4><div className="flex gap-2 p-1 bg-slate-100 rounded-xl"><button type="button" onClick={() => setLibraryTab('media')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${libraryTab === 'media' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-50'}`}>Media</button><button type="button" onClick={() => setLibraryTab('tickers')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${libraryTab === 'tickers' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-50'}`}>Tickers</button></div></div><div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">{libraryTab === 'media' ? approvedMedia.map(m => (<div key={m.id || m._id} draggable onDragStart={(e) => handleDragStart(e, m, 'media')} onDragEnd={handleDragEnd} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 transition-all flex items-center gap-3 group"><GripVertical size={14} className="text-slate-300 group-hover:text-indigo-400" />{m.fileType === 'image' && <div className="w-8 h-8 rounded bg-slate-100 bg-cover bg-center" style={{backgroundImage: `url(${getMediaUrl(m.filePath)})`}} />}{m.fileType === 'video' && <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-500"><Play size={14}/></div>}{m.fileType === 'pdf' && <div className="w-8 h-8 rounded bg-rose-100 flex items-center justify-center text-rose-500"><Layers size={14}/></div>}<div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-slate-700 truncate">{m.fileName}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{m.fileType}</p></div></div>)) : tickers.map(t => (<div key={t.id || t._id} draggable onDragStart={(e) => handleDragStart(e, t, 'ticker')} onDragEnd={handleDragEnd} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 transition-all flex items-center gap-3 group"><GripVertical size={14} className="text-slate-300 group-hover:text-indigo-400" /><div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-500"><Clock size={14}/></div><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-slate-700 truncate">{t.text}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ticker</p></div></div>))}</div></div>
                    <div className="flex-1 flex flex-col h-full bg-[#F1F5F9] min-w-0"><div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between z-10"><h4 className="text-[10px] font-black uppercase text-sky-600 flex items-center gap-3"><div className="w-6 h-px bg-sky-600/30" /> Spatial Canvas</h4><select className="nexus-input py-2 text-xs bg-slate-50 w-64 border-slate-200" value={newSchedule.templateId} onChange={(e) => { setNewSchedule(p => ({ ...p, templateId: e.target.value, mediaId: '' })); setMediaMapping({}); setSelectedFrame(null); }}><option value="">Standard Fullscreen</option>{templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}</select></div><div className="flex-1 flex items-center justify-center p-8 overflow-auto custom-scrollbar relative">{!newSchedule.templateId ? (<div className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-[40px] flex items-center justify-center bg-white flex-col gap-4 shadow-xl transition-all hover:border-sky-400 group" onDragOver={(e) => handleDragOver(e, 'Main')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, 'Main')} onClick={() => setSelectedFrame('Main')}>{mediaMapping['Main']?.length > 0 ? (<div className="text-center animate-fade-in"><p className="text-[18px] font-black text-indigo-600 mb-2">{mediaMapping['Main'].length} Assets Queued</p><button type="button" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-200">Configure Node</button></div>) : (<><Monitor className="text-slate-300 group-hover:text-sky-400 transition-colors" size={64} /><p className="text-[12px] font-black text-slate-400 uppercase tracking-[4px] group-hover:text-sky-500 transition-colors">Drop Assets Here</p></>)}</div>) : (<div className="w-full aspect-video bg-slate-900 rounded-[40px] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.1)] border-8 border-slate-900">{layout.map(z => { const frameItems = mediaMapping[z.i] || []; const isSelected = selectedFrame === z.i; const isOver = dragOverZone === z.i; const previewItem = frameItems[0]; return (<div key={z.i} draggable={frameItems.length > 0} onDragStart={(e) => frameItems.length > 0 && handleDragStart(e, frameItems[0], frameItems[0].type, z.i)} onDragEnd={handleDragEnd} onDragOver={(e) => handleDragOver(e, z.i)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, z.i)} onClick={() => setSelectedFrame(z.i)} className={`absolute border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${isSelected ? 'ring-4 ring-sky-500 z-40 shadow-[0_0_40px_rgba(14,165,233,0.6)]' : ''} ${isOver ? 'scale-[1.02] border-sky-400 bg-sky-500/20 z-50 shadow-2xl' : isDraggingGlobal ? 'border-indigo-400/50 bg-indigo-500/5 animate-pulse z-30' : ''} ${frameItems.length > 0 ? 'bg-black border-indigo-500/30' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`} style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`, zIndex: isOver ? 100 : (isSelected ? 40 : (z.zIndex || 1)) }}>{previewItem && (<div className="absolute inset-0 w-full h-full bg-black">{previewItem.fileType === 'image' && <img src={getMediaUrl(previewItem.filePath)} className="w-full h-full object-cover" alt="p" />}{previewItem.fileType === 'video' && <video src={getMediaUrl(previewItem.filePath)} className="w-full h-full object-cover" autoPlay muted loop playsInline />}{previewItem.fileType === 'pdf' && <PDFThumbnail url={getMediaUrl(previewItem.filePath)} />}<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" /></div>)}<div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center pointer-events-none w-full">{previewItem ? (<p className="text-[16px] font-black text-white uppercase tracking-tighter drop-shadow-2xl line-clamp-2 leading-none mb-1">{previewItem.fileName}</p>) : (<span className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">Empty</span>)}<div className="flex items-center gap-2"><span className="px-3 py-1 bg-white text-black rounded-lg text-[8px] font-black uppercase tracking-[2px] shadow-2xl">ID: {z.i}</span>{frameItems.length > 1 && (<span className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[8px] font-black uppercase tracking-[2px] shadow-2xl">+{frameItems.length - 1} QUEUE</span>)}</div></div></div>);})}</div>)}</div></div>
                    <div className="lg:w-[32%] flex flex-col h-full bg-white border-l border-slate-200"><div className="p-6 border-b border-slate-200 flex-shrink-0"><h4 className="text-[10px] font-black uppercase text-rose-600 mb-4 flex items-center gap-3"><div className="w-6 h-px bg-rose-600/30" /> Global Targeting</h4><div className="space-y-4"><div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Cluster</label><select className="nexus-input py-2 text-xs bg-slate-50 border-slate-200" value={newSchedule.targetType} onChange={(e) => setNewSchedule(p => ({ ...p, targetType: e.target.value, targetIds: [] }))}><option value="all">Global System</option><option value="group">Screen Group</option><option value="screen">Specific Node</option></select></div>{newSchedule.targetType !== 'all' && (<div className="space-y-2 animate-fade-in"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Selection</label><select multiple className="nexus-input h-24 custom-scrollbar text-[10px] font-bold bg-slate-50 border-slate-200" value={newSchedule.targetIds} onChange={(e) => { const options = Array.from(e.target.options); setNewSchedule(p => ({ ...p, targetIds: options.filter(o => o.selected).map(o => o.value) })); }}>{newSchedule.targetType === 'screen' ? screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>) : groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}</select></div>)}<div className="grid grid-cols-2 gap-2"><AppleDateInput label="Start Date" value={newSchedule.startDate} onChange={(val) => setNewSchedule(p => ({ ...p, startDate: val }))} /><AppleDateInput label="End Date" value={newSchedule.endDate} onChange={(val) => setNewSchedule(p => ({ ...p, endDate: val }))} /></div><div className="grid grid-cols-2 gap-2"><AppleTimeInput label="Start Time" value={newSchedule.startTime} onChange={(val) => setNewSchedule(p => ({ ...p, startTime: val }))} /><AppleTimeInput label="End Time" value={newSchedule.endTime} onChange={(val) => setNewSchedule(p => ({ ...p, endTime: val }))} /></div><button type="button" onClick={createSchedule} className="nexus-btn-primary w-full py-4 text-[10px] tracking-[6px] shadow-xl uppercase mt-2">DEPLOY TRANSMISSION</button></div></div><div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">{selectedFrame ? (<div className="space-y-6 animate-fade-in"><h4 className="text-[10px] font-black uppercase text-amber-600 flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-4 h-px bg-amber-600/30" /> Node {selectedFrame}</span><span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black">{mediaMapping[selectedFrame]?.length || 0} Assets</span></h4>{(!mediaMapping[selectedFrame] || mediaMapping[selectedFrame].length === 0) ? (<div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Drag & Drop Assets<br/>to this Node</p></div>) : (<div className="space-y-4">{mediaMapping[selectedFrame].map((item, idx) => (<div key={item.uid} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm hover:shadow-lg transition-all"><div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2 truncate"><span className="w-5 h-5 bg-indigo-600 text-white flex items-center justify-center rounded-full text-[10px] font-black">{idx + 1}</span><span className="text-[11px] font-bold text-slate-700 truncate">{item.fileName}</span></div><button type="button" onClick={() => removeMappedItem(selectedFrame, item.uid)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={14}/></button></div><div className="p-4 space-y-3"><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-500">Sec</label><input type="number" min="1" className="nexus-input py-1.5 px-2 text-[10px] bg-slate-50" value={item.duration} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'duration', Number(e.target.value))} /></div><div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-500">Pri</label><select className="nexus-input py-1.5 px-2 text-[10px] font-black uppercase bg-slate-50" value={item.priority} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'priority', Number(e.target.value))}><option value="1">Low</option><option value="5">Med</option><option value="10">High</option></select></div></div><div className="grid grid-cols-2 gap-3"><AppleTimeInput label="Start" value={item.startTime} onChange={(val) => updateMappedItem(selectedFrame, item.uid, 'startTime', val)} /><AppleTimeInput label="End" value={item.endTime} onChange={(val) => updateMappedItem(selectedFrame, item.uid, 'endTime', val)} /></div><div className="grid grid-cols-2 gap-3"><AppleDateInput label="From" value={item.startDate} onChange={(val) => updateMappedItem(selectedFrame, item.uid, 'startDate', val)} /><AppleDateInput label="To" value={item.endDate} onChange={(val) => updateMappedItem(selectedFrame, item.uid, 'endDate', val)} /></div></div></div>))}</div>)}</div>) : (<div className="h-full flex flex-col items-center justify-center opacity-30 animate-pulse"><Monitor size={48} className="mb-4 text-slate-400" /><p className="text-[10px] font-black uppercase tracking-[4px] text-center text-slate-500">Select Node</p></div>)}</div></div>
                </div>
            ) : (
                <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                    <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest"><th className="py-6 px-8">Payload</th><th className="py-6 px-8">Target</th><th className="py-6 px-8">Window</th><th className="py-6 px-8 text-right">Actions</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedules.map(s => { const m = approvedMedia.find(am => (am.id === s.mediaId || am._id === s.mediaId)); const t = templates.find(tm => (tm.id === s.templateId || tm._id === s.templateId)); return (<tr key={s.id || s._id} className="hover:bg-slate-50/50 transition-colors group"><td className="py-6 px-8"><p className="font-black text-slate-900 uppercase text-sm tracking-tight">{t ? t.name : (m?.fileName || 'Omni Broadcast')}</p><div className="flex items-center gap-2 mt-1"><span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${t ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>{t ? 'Layout' : (m?.fileType || 'Asset')}</span></div></td><td className="py-6 px-8"><div className="flex flex-wrap gap-1 max-w-[200px]">{s.isGlobal ? (<span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-slate-100 text-slate-500 border-slate-200">Global</span>) : s.screenId ? (<span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-100">{screens.find(sc => sc._id === s.screenId)?.name || 'Screen'}</span>) : s.groupId ? (<span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-amber-50 text-amber-600 border-amber-100">{groups.find(gr => gr._id === s.groupId)?.name || 'Group'}</span>) : 'N/A'}</div></td><td className="py-6 px-8"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><div><p className="text-[11px] font-black tabular-nums text-slate-700">{s.startTime} <span className="mx-2 opacity-30">→</span> {s.endTime}</p><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</p></div></div></td><td className="py-6 px-8 text-right"><button onClick={() => deleteSchedule(s.id || s._id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button></td></tr>); })}
                                {schedules.length === 0 && (<tr><td colSpan="4" className="py-32 text-center bg-slate-50/20"><Radio className="text-slate-300 mx-auto mb-4" size={40} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">No Active Transmissions</p></td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>
       </div>
    </div>
  );
};

export default BroadcastScheduler;
