import React, { useState, useEffect } from 'react';
import { Radio, Calendar, Play, Layers, AlertTriangle, Monitor, Trash2, Copy, Zap, Clock, Plus, GripVertical, Settings, ChevronRight, History as HistoryIcon, XCircle, Info, ExternalLink, Download, ShieldCheck, FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../../services/api';
import { useScreens, useTemplates, useMedia, useTickers, useSchedules, useActiveSchedules, useHistoryLogs } from '../../hooks/useAdminData';
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

const HistoryDetailModal = ({ log, isOpen, onClose }) => {
    if (!isOpen || !log) return null;
    const details = (() => {
        try { return typeof log.details === 'string' ? JSON.parse(log.details) : log.details; }
        catch (e) { return {}; }
    })();

    const getDetailedManifest = () => {
        const files = [];
        if (details.mediaMapping) {
            const mapping = typeof details.mediaMapping === 'string' ? JSON.parse(details.mediaMapping) : details.mediaMapping;
            Object.entries(mapping).forEach(([zoneId, zoneItems]) => {
                if (Array.isArray(zoneItems)) {
                    zoneItems.forEach(item => files.push({
                        name: item.fileName || item.text || 'Unknown Asset',
                        zone: zoneId,
                        start: item.startTime || details.startTime || '00:00',
                        end: item.endTime || details.endTime || '23:59',
                        dateStart: item.startDate || details.startDate,
                        dateEnd: item.endDate || details.endDate,
                        priority: item.priority || details.priority || 1,
                        duration: item.duration || details.duration || 10,
                        filePath: item.filePath,
                        fileType: item.fileType
                    }));
                }
            });
        } 
        else if (details.mediaId || details.name) {
            files.push({
                name: details.name || details.fileName || 'Primary Asset',
                zone: 'Main',
                start: details.startTime || '00:00',
                end: details.endTime || '23:59',
                dateStart: details.startDate,
                dateEnd: details.endDate,
                priority: details.priority || 1,
                duration: details.duration || 10,
                filePath: details.filePath,
                fileType: details.fileType || 'media'
            });
        }
        return files;
    };

    const getPriorityLabel = (p) => {
        if (p >= 10) return 'High';
        if (p >= 5) return 'Medium';
        return 'Low';
    };

    const manifest = getDetailedManifest();

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-3xl rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white shadow-2xl">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{details.name || 'Schedule Details'}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">File History • Record</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                    <section className="grid grid-cols-3 gap-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Screen Name/Group</p>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{details.targetType === 'all' ? 'All Screens' : details.targetType === 'group' ? 'Screen Group' : 'Specific Screen'}</p>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Template</p>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{details.templateId ? 'Custom Layout' : 'Full Screen'}</p>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">System Priority</p>
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{getPriorityLabel(details.priority || 1)}</p>
                        </div>
                    </section>

                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <Layers size={16} className="text-indigo-600" />
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[6px]">BROADCAST DETAILS</h4>
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">{manifest.length} Files in Queue</span>
                        </div>

                        <div className="space-y-10">
                            {manifest.length > 0 ? (
                                Object.entries(manifest.reduce((acc, item) => {
                                    if (!acc[item.zone]) acc[item.zone] = [];
                                    acc[item.zone].push(item);
                                    return acc;
                                }, {})).map(([zone, items]) => (
                                    <div key={zone} className="space-y-6">
                                        <div className="flex items-center gap-4 ml-2">
                                            <div className="px-3 py-1 bg-slate-900 rounded-lg text-[9px] font-black text-white uppercase tracking-[4px]">Zone: {zone}</div>
                                        </div>
                                        <div className="space-y-4">
                                            {items.map((f, i) => (
                                                <div key={i} className="p-8 bg-white border border-slate-100 rounded-[32px] hover:border-indigo-400 transition-all group shadow-sm relative overflow-hidden">
                                                    <div className="flex flex-col gap-8">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-6">
                                                                <div className="relative">
                                                                    {f.fileType === 'image' && f.filePath ? (
                                                                        <div className="w-20 h-20 rounded-[24px] bg-slate-100 bg-cover bg-center border border-slate-100" style={{backgroundImage: `url(${getMediaUrl(f.filePath)})`}} />
                                                                    ) : (
                                                                        <div className="w-20 h-20 rounded-[24px] bg-slate-900 flex items-center justify-center text-white">
                                                                            {f.fileType === 'pdf' ? <FileText size={32} /> : <Play size={32} />}
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-[12px] font-black shadow-xl border-2 border-white">
                                                                        {i + 1}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[2px]">Order #{i+1}</span>
                                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">• {f.fileType || 'File'}</span>
                                                                    </div>
                                                                    <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-none mb-2">{f.name}</h5>
                                                                    <div className="flex items-center gap-3">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.filePath ? 'External File' : 'System Message'}</p>
                                                                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">• Priority Level {f.priority}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">{getPriorityLabel(f.priority)}</div>
                                                                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{f.duration}S Time</div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-10 pt-8 border-t border-slate-50">
                                                            <div className="space-y-3">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Play Dates</p>
                                                                <p className="text-xs font-black text-slate-900 uppercase tabular-nums tracking-tighter">
                                                                    {f.dateStart ? new Date(f.dateStart).toLocaleDateString() : 'Starts Now'} <span className="text-slate-300 mx-3">→</span> {f.dateEnd ? new Date(f.dateEnd).toLocaleDateString() : 'No End Date'}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Play Times</p>
                                                                <p className="text-xs font-black text-slate-900 uppercase tabular-nums tracking-tighter">
                                                                    {f.start} <span className="text-slate-300 mx-3">→</span> {f.end}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[48px] bg-slate-50/30">
                                    {(log.action === 'REGISTER' || log.action === 'RESET') ? (
                                        <>
                                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
                                                <Zap className="text-amber-500 animate-pulse" size={40} />
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">System Event</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] max-w-sm mx-auto leading-relaxed">
                                                This log is for a system {log.action.toLowerCase()} command. No files were shown during this time.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Info className="text-slate-200 mx-auto mb-4" size={40} />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No information available for this history entry.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex items-center gap-6 p-10 bg-slate-950 rounded-[40px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck size={120} className="text-white" />
                        </div>
                        <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center text-white font-black text-xl border border-white/10 shadow-inner">
                            {log.userId?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[6px] mb-2">Created By</p>
                            <p className="text-xl font-black text-white uppercase tracking-tight">{log.userId?.name || 'System Admin'}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Date & Time: {new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                    <button onClick={onClose} className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[6px] hover:bg-black transition-all shadow-xl hover:shadow-slate-200">Close</button>
                </div>
            </div>
        </div>
    );
};

const BroadcastHistory = () => {
    const { data: logs = [], isLoading } = useHistoryLogs();
    const { data: screens = [] } = useScreens();
    const [selectedLog, setSelectedLog] = useState(null);

    const broadcastLogs = logs.filter(log => 
        log.entity === 'Assignment' || 
        (log.entity === 'Screen' && (log.action === 'RESET' || log.action === 'REGISTER'))
    );

    const getScreenName = (log) => {
        try {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            if (details.targetType === 'all') return 'All Screens';
            if (details.target) return details.target;
            if (log.entityId) {
                const screen = screens.find(s => s._id === log.entityId);
                if (screen) return screen.name;
            }
            return 'Multiple Screens';
        } catch (e) { return 'Unknown Screen'; }
    };

    const getPayloadInfo = (log) => {
        try {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            return details.name || 'System Broadcast';
        } catch (e) { return 'Broadcast Information'; }
    };

    const getPriorityLabel = (p) => {
        if (p >= 10) return 'High';
        if (p >= 5) return 'Medium';
        return 'Low';
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
            <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                            <th className="py-6 px-10">Screen Name</th>
                            <th className="py-6 px-10">Files in Broadcast</th>
                            <th className="py-6 px-10">Status</th>
                            <th className="py-6 px-10 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-black uppercase tracking-[12px] animate-pulse">Loading...</td></tr>
                        ) : broadcastLogs.length === 0 ? (
                            <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-black uppercase tracking-[12px]">No History Found</td></tr>
                        ) : (
                            broadcastLogs.map(log => {
                                const details = (() => {
                                    try { return typeof log.details === 'string' ? JSON.parse(log.details) : log.details; }
                                    catch (e) { return {}; }
                                })();
                                return (
                                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedLog(log)}>
                                    <td className="py-8 px-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Monitor size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-xs text-slate-900 uppercase tracking-tight">{getScreenName(log)}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[2px] mt-1">Screen ID: {log.entityId?.slice(-6) || 'SYS'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-8 px-10">
                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{getPayloadInfo(log)}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {details.priority && <span className="text-indigo-600 mr-2">{getPriorityLabel(details.priority)} Priority •</span>}
                                            History ID #{log._id.slice(-4)}
                                        </p>
                                    </td>
                                    <td className="py-8 px-10">
                                        <span className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                                            log.action === 'SCHEDULE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            log.action === 'TERMINATE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                            {log.action === 'SCHEDULE' ? 'STARTED' : log.action === 'TERMINATE' ? 'STOPPED' : log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="py-8 px-10 text-right">
                                        <p className="text-xs font-black text-slate-900 tabular-nums leading-none mb-2">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
            <HistoryDetailModal log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
};

const BroadcastScheduler = ({ fetchData }) => {
  const { data: screens = [] } = useScreens();
  const [groups, setGroups] = useState([]);
  const { data: templates = [] } = useTemplates();
  const { data: media = [] } = useMedia();
  const { data: tickers = [] } = useTickers();
  const { data: allSchedules = [], refetch: refetchAll } = useSchedules();
  const { data: activeSchedules = [], refetch: refetchActive } = useActiveSchedules();

  const [activeTab, setActiveTab] = useState('editor');
  const [libraryTab, setLibraryTab] = useState('media');
  const [dragOverZone, setDragOverZone] = useState(null);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  const schedules = activeSchedules;
  const refetch = () => { refetchAll(); refetchActive(); };

  const [newSchedule, setNewSchedule] = useState(() => {
    const now = Date.now();
    return { targetType: 'all', targetIds: [], templateId: '', mediaId: '', startTime: '09:00', endTime: '18:00', startDate: new Date(now).toISOString().slice(0, 10), endDate: new Date(now + 31536000000).toISOString().slice(0, 10), priority: 1, duration: 10 };
  });

  const [mediaMapping, setMediaMapping] = useState({});
  const [selectedFrame, setSelectedFrame] = useState(null);
  const approvedMedia = media.filter(m => m.status === 'approved');

  useEffect(() => {
    const fetchGroups = async () => { try { const res = await api.get('/api/groups'); setGroups(res.data); } catch { } };
    fetchGroups();
  }, []);

  const safeParseJSON = (data, fallback = []) => { if (!data) return fallback; if (typeof data === 'object') return data; try { return JSON.parse(data); } catch { return fallback; } };

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

  const deleteMedia = async (id) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await api.delete(`/api/media/${id}`);
      toast.success('File deleted');
      refetch();
      if (fetchData) fetchData();
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const handleDragStart = (e, item, type, sourceZoneId = null) => { e.dataTransfer.setData('application/json', JSON.stringify({ ...item, type, sourceZoneId })); e.dataTransfer.effectAllowed = 'move'; setIsDraggingGlobal(true); };
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
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div><div className="flex items-center gap-3 mb-2"><Radio className="text-rose-500" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-rose-500">MAIN DASHBOARD</span></div><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">BROADCAST CENTER</h2></div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>EDITOR</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>ACTIVE SCHEDULES ({schedules.length})</button>
                    <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>History</button>
                </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0 bg-white">
            {activeTab === 'editor' ? (
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
                    <div className="lg:w-1/4 flex flex-col h-full bg-slate-50/50"><div className="p-6 border-b border-slate-200 bg-white/80"><h4 className="text-[10px] font-black uppercase text-indigo-600 mb-4 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Library</h4><div className="flex gap-2 p-1 bg-slate-100 rounded-xl"><button type="button" onClick={() => setLibraryTab('media')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${libraryTab === 'media' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-50'}`}>Media</button><button type="button" onClick={() => setLibraryTab('tickers')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${libraryTab === 'tickers' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-50'}`}>Tickers</button></div></div><div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">{libraryTab === 'media' ? approvedMedia.map(m => (<div key={m.id || m._id} draggable onDragStart={(e) => handleDragStart(e, m, 'media')} onDragEnd={handleDragEnd} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 transition-all flex items-center gap-3 group"><GripVertical size={14} className="text-slate-300 group-hover:text-indigo-400" />{m.fileType === 'image' && <div className="w-8 h-8 rounded bg-slate-100 bg-cover bg-center" style={{backgroundImage: `url(${getMediaUrl(m.filePath)})`}} />}{m.fileType === 'video' && <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-500"><Play size={14}/></div>}{m.fileType === 'pdf' && <div className="w-8 h-8 rounded bg-rose-100 flex items-center justify-center text-rose-500"><Layers size={14}/></div>}<div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-slate-700 truncate">{m.fileName}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Ingested {new Date(m.createdAt).toLocaleDateString()}</p></div><button type="button" onClick={(e) => { e.stopPropagation(); deleteMedia(m.id || m._id); }} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button></div>)) : tickers.map(t => (<div key={t.id || t._id} draggable onDragStart={(e) => handleDragStart(e, t, 'ticker')} onDragEnd={handleDragEnd} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 transition-all flex items-center gap-3 group"><GripVertical size={14} className="text-slate-300 group-hover:text-indigo-400" /><div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-600"><Zap size={14}/></div><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-slate-700 truncate">{t.text}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Ticker Engine</p></div></div>))}</div></div>
                    <div className="flex-1 flex flex-col h-full bg-[#F1F5F9] min-w-0"><div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between z-10"><h4 className="text-[10px] font-black uppercase text-sky-600 flex items-center gap-3"><div className="w-6 h-px bg-sky-600/30" /> Templates</h4><select className="nexus-input py-2 text-xs bg-slate-50 w-64 border-slate-200" value={newSchedule.templateId} onChange={(e) => { setNewSchedule(p => ({ ...p, templateId: e.target.value, mediaId: '' })); setMediaMapping({}); setSelectedFrame(null); }}><option value="">FULL SCREEN</option>{templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}</select></div><div className="flex-1 flex items-center justify-center p-8 overflow-auto custom-scrollbar relative">{!newSchedule.templateId ? (<div className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-[40px] flex items-center justify-center bg-white flex-col gap-4 shadow-xl transition-all hover:border-sky-400 group" onDragOver={(e) => handleDragOver(e, 'Main')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, 'Main')} onClick={() => setSelectedFrame('Main')}>{mediaMapping['Main']?.length > 0 ? (<div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[32px]">{mediaMapping['Main'][0].fileType === 'image' && mediaMapping['Main'][0].filePath ? (
                                        <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all" style={{backgroundImage: `url(${getMediaUrl(mediaMapping['Main'][0].filePath)})`}} />
                                    ) : mediaMapping['Main'][0].fileType === 'pdf' ? (
                                        <div className="absolute inset-0 bg-rose-50 flex items-center justify-center">
                                            <FileText size={48} className="text-rose-200" />
                                        </div>
                                    ) : mediaMapping['Main'][0].fileType === 'video' ? (
                                        <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                                            <Play size={48} className="text-indigo-200" />
                                        </div>
                                    ) : null}<div className="relative z-10 flex flex-col items-center gap-1 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/20 shadow-xl"><p className="text-[18px] font-black text-slate-900 mb-2">{mediaMapping['Main'].length} Assets Queued</p><button type="button" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-200">Configure Screen</button></div></div>) : (<><Monitor className="text-slate-300 group-hover:text-sky-400 transition-colors" size={64} /><p className="text-[12px] font-black text-slate-400 uppercase tracking-[4px] group-hover:text-sky-500 transition-colors">Drop Assets Here</p></>)}</div>) : (<div className="w-full aspect-video bg-slate-900 rounded-[40px] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.1)] border-8 border-slate-900">{layout.map(z => { const isSelected = selectedFrame === z.i; return (<div key={z.i} style={{ position: 'absolute', left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`, zIndex: z.zIndex || 1 }} className={`border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden ${isSelected ? 'border-sky-400 bg-sky-400/10 shadow-[inset_0_0_40px_rgba(56,189,248,0.2)]' : (dragOverZone === z.i ? 'border-amber-400 bg-amber-400/20' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-500')}`} onDragOver={(e) => handleDragOver(e, z.i)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, z.i)} onClick={() => setSelectedFrame(z.i)}>{mediaMapping[z.i]?.length > 0 ? (<div className="relative w-full h-full flex items-center justify-center">{mediaMapping[z.i][0].fileType === 'image' && mediaMapping[z.i][0].filePath ? (
                                                    <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all" style={{backgroundImage: `url(${getMediaUrl(mediaMapping[z.i][0].filePath)})`}} />
                                                ) : mediaMapping[z.i][0].fileType === 'pdf' ? (
                                                    <div className="absolute inset-0 bg-rose-50 flex items-center justify-center">
                                                        <FileText size={20} className="text-rose-200" />
                                                    </div>
                                                ) : mediaMapping[z.i][0].fileType === 'video' ? (
                                                    <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                                                        <Play size={20} className="text-indigo-200" />
                                                    </div>
                                                ) : null}<div className="relative z-10 flex flex-col items-center gap-1"><p className="text-[10px] font-black text-white bg-sky-500 px-2 py-0.5 rounded-full shadow-lg">{mediaMapping[z.i].length} Queue</p><p className="text-[9px] font-black text-white uppercase truncate max-w-full px-2.5 py-1 bg-slate-900 rounded-md shadow-2xl border border-white/10">{mediaMapping[z.i][0].fileName}</p></div></div>) : (<><Layers size={20} className={isSelected ? 'text-sky-400' : 'text-slate-600'} /><span className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-sky-400' : 'text-slate-600'}`}>{z.i}</span></>)}</div>); })}</div>)}</div></div>
                    <div className="lg:w-[32%] flex flex-col h-full bg-white border-l border-slate-200"><div className="p-6 border-b border-slate-200 flex-shrink-0"><h4 className="text-[10px] font-black uppercase text-rose-600 mb-4 flex items-center gap-3"><div className="w-6 h-px bg-rose-600/30" /> Screen Selection</h4><div className="space-y-4"><div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">GROUP</label><select className="nexus-input py-2 text-xs bg-slate-50 border-slate-200" value={newSchedule.targetType} onChange={(e) => setNewSchedule(p => ({ ...p, targetType: e.target.value, targetIds: [] }))}><option value="all">Global System</option><option value="group">Screen Group</option><option value="screen">Specific Screen</option></select></div>{newSchedule.targetType !== 'all' && (<div className="space-y-2 animate-fade-in"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Selection</label><select multiple className="nexus-input h-24 custom-scrollbar text-[10px] font-bold bg-slate-50 border-slate-200" value={newSchedule.targetIds} onChange={(e) => { const options = Array.from(e.target.options); setNewSchedule(p => ({ ...p, targetIds: options.filter(o => o.selected).map(o => o.value) })); }}>{newSchedule.targetType === 'screen' ? screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>) : groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}</select></div>)}<div className="grid grid-cols-2 gap-2"><AppleDateInput label="From Date" value={newSchedule.startDate} onChange={(val) => setNewSchedule(p => ({ ...p, startDate: val }))} /><AppleDateInput label="To Date" value={newSchedule.endDate} onChange={(val) => setNewSchedule(p => ({ ...p, endDate: val }))} /></div><div className="grid grid-cols-2 gap-2"><AppleTimeInput label="From Time" value={newSchedule.startTime} onChange={(val) => setNewSchedule(p => ({ ...p, startTime: val }))} /><AppleTimeInput label="To Time" value={newSchedule.endTime} onChange={(val) => setNewSchedule(p => ({ ...p, endTime: val }))} /></div><div className="flex gap-2"><div className="flex-1 space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Priority</label><select className="nexus-input py-2 text-xs bg-slate-50 border-slate-200 font-black uppercase" value={newSchedule.priority} onChange={(e) => setNewSchedule(p => ({ ...p, priority: Number(e.target.value) }))}><option value="1">Low</option><option value="5">Medium</option><option value="10">High</option></select></div><div className="flex-1 space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Rotation (s)</label><input type="number" className="nexus-input py-2 text-xs bg-slate-50 border-slate-200" value={newSchedule.duration} onChange={(e) => setNewSchedule(p => ({ ...p, duration: parseInt(e.target.value) || 10 }))} /></div></div><button onClick={createSchedule} className="nexus-btn-primary w-full py-4 text-[10px] tracking-[6px] shadow-xl uppercase mt-4 group">Make it Live <Zap size={14} className="inline ml-1 group-hover:animate-pulse"/></button></div></div><div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar"><div className="flex items-center gap-3 mb-6"><Settings size={14} className="text-slate-400"/><h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[2px]">File Scheduling</h4></div>{selectedFrame ? (mediaMapping[selectedFrame]?.length > 0 ? (<div className="space-y-4">{mediaMapping[selectedFrame].map((item, index) => (<div key={item.uid} className="p-5 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-indigo-400 transition-all group/item relative overflow-hidden">
    <div className="absolute top-2 right-2 z-10">
         <button type="button" onClick={() => removeMappedItem(selectedFrame, item.uid)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/item:opacity-100"><Trash2 size={14}/></button>
    </div>
    
    <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Queue Position #{index + 1}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">• {item.fileType}</span>
        </div>
        <p className="text-[12px] font-black text-slate-900 uppercase leading-tight pr-8">{item.fileName}</p>
    </div>

    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block ml-1">Priority</label>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer" value={item.priority} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'priority', Number(e.target.value))}>
                    <option value="1">Low</option>
                    <option value="5">Medium</option>
                    <option value="10">High</option>
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block ml-1">Duration</label>
                <div className="relative">
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-black focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={item.duration} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'duration', parseInt(e.target.value) || 10)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400 uppercase">Sec</span>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
            <div className="space-y-2">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[2px] flex items-center gap-2 px-1"><Calendar size={10}/> FROM DATE → TO DATE</label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input type="date" className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold focus:border-indigo-400 outline-none" value={item.startDate} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'startDate', e.target.value)} />
                    <span className="text-slate-300 font-bold">→</span>
                    <input type="date" className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold focus:border-indigo-400 outline-none" value={item.endDate} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'endDate', e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[8px] font-black text-rose-600 uppercase tracking-[2px] flex items-center gap-2 px-1"><Clock size={10}/> FROM TIME → TO TIME</label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input type="time" className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold focus:border-rose-400 outline-none" value={item.startTime} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'startTime', e.target.value)} />
                    <span className="text-slate-300 font-bold">→</span>
                    <input type="time" className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold focus:border-rose-400 outline-none" value={item.endTime} onChange={(e) => updateMappedItem(selectedFrame, item.uid, 'endTime', e.target.value)} />
                </div>
            </div>
        </div>
    </div>
</div>))}</div>) : (<div className="h-40 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 gap-2"><Layers size={24} className="opacity-20"/><p className="text-[8px] font-black uppercase tracking-widest">Zone {selectedFrame} Empty</p></div>)) : (<div className="h-40 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 gap-2"><Monitor size={24} className="opacity-20"/><p className="text-[8px] font-black uppercase tracking-widest">Select Zone</p></div>)}</div></div>
                </div>
            ) : activeTab === 'inventory' ? (
                <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                    <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest"><th className="py-6 px-8">CONTENT</th><th className="py-6 px-8">Screen Name</th><th className="py-6 px-8">Window</th><th className="py-6 px-8 text-right">Actions</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedules.map(s => { const t = templates.find(tm => (tm.id === s.templateId || tm._id === s.templateId)); return (<tr key={s.id || s._id} className="hover:bg-slate-50/50 transition-colors group"><td className="py-6 px-8"><p className="font-black text-slate-900 uppercase text-sm tracking-tight">{s.name || (t ? t.name : 'Asset Broadcast')}</p><div className="flex items-center gap-2 mt-1"><span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${t ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>{t ? 'Layout' : 'Media'}</span></div></td><td className="py-6 px-8"><div className="flex flex-wrap gap-1 max-w-[200px]">{s.isGlobal ? (<span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-slate-100 text-slate-500 border-slate-200">Global</span>) : s.screenId ? (<span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-100">{screens.find(sc => sc._id === s.screenId)?.name || 'Screen'}</span>) : s.groupId ? (<span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-amber-50 text-amber-600 border-amber-100">{groups.find(gr => gr._id === s.groupId)?.name || 'Group'}</span>) : 'N/A'}</div></td><td className="py-6 px-8"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><div><p className="text-[11px] font-black tabular-nums text-slate-700">{s.startTime} <span className="mx-2 opacity-30">→</span> {s.endTime}</p><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</p></div></div></td><td className="py-6 px-8 text-right"><button onClick={() => deleteSchedule(s.id || s._id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button></td></tr>); })}
                                {schedules.length === 0 && (<tr><td colSpan="4" className="py-32 text-center bg-slate-50/20"><Radio className="text-slate-300 mx-auto mb-4" size={40} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">No Active Broadcasts</p></td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <BroadcastHistory />
            )}
          </div>
       </div>
    </div>
  );
};

export default BroadcastScheduler;
