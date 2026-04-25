/* eslint-disable no-unused-vars */
import React, { useState, useCallback } from 'react';
import api from '../services/api';
import Shell from '../components/Shell';
import useAuthStore from '../store/useAuthStore';
import { usePendingMedia, useMedia, useScreens } from '../hooks/useAdminData';
import toast from 'react-hot-toast';
import { 
  Upload, FileText, Play, Image as ImageIcon, Layers, XCircle, Eye,
  Clock, RefreshCw, Send, Monitor, Tv, Timer, CheckCircle, History, ChevronRight, Activity, ShieldCheck, Zap, Globe, Smartphone
} from 'lucide-react';

const PreviewModal = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;
  const src = file.filePath ? `${import.meta.env.VITE_API_URL}/${file.filePath}`.replace(/([^:]\/)\/+/g, "$1") : null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-12">
      <div className="relative w-full h-full max-w-6xl flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-2xl">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">{file.fileName || file.originalName}</h3>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{file.fileType || file.mimeType} • {new Date(file.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-100 rounded-2xl hover:bg-rose-500 hover:text-white transition-all text-slate-400">
            <XCircle size={24}/>
          </button>
        </div>
        
        <div className="flex-1 bg-black rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl relative">
          {file.fileType === 'video' || (file.mimeType && file.mimeType.includes('video')) ? (
            <video src={src || undefined} autoPlay controls className="w-full h-full object-contain" />
          ) : file.fileType === 'pdf' || (file.mimeType && file.mimeType.includes('pdf')) ? (
            <iframe src={src ? `${src}#toolbar=0` : undefined} className="w-full h-full border-none bg-white" title={file.fileName} />
          ) : (
            <img src={src || undefined} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
};

const AppleTimeInput = ({ value, onChange, label }) => {
    const [h, m] = (value || "00:00").split(':');
    const updateTime = (newH, newM) => {
        const cleanH = newH.replace(/\D/g, '').slice(0, 2);
        const cleanM = newM.replace(/\D/g, '').slice(0, 2);
        let finalH = cleanH === '' ? '00' : cleanH;
        let finalM = cleanM === '' ? '00' : cleanM;
        if (parseInt(finalH) > 23) finalH = '23';
        if (parseInt(finalM) > 59) finalM = '59';
        onChange(`${finalH.padStart(2, '0')}:${finalM.padStart(2, '0')}`);
    };
    return (
        <div className="space-y-1.5 flex-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">{label}</label>
            <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm group focus-within:border-indigo-500 transition-all h-10">
                <input type="text" className="w-8 text-center bg-transparent font-black text-[11px] outline-none text-slate-900" value={h} onChange={(e) => updateTime(e.target.value, m)} onBlur={(e) => updateTime(e.target.value.padStart(2, '0'), m)} />
                <span className="text-slate-300 font-bold">:</span>
                <input type="text" className="w-8 text-center bg-transparent font-black text-[11px] outline-none text-slate-900" value={m} onChange={(e) => updateTime(h, e.target.value)} onBlur={(e) => updateTime(h, e.target.value.padStart(2, '0'))} />
            </div>
        </div>
    );
};

const StatWidget = ({ label, value, icon: WidgetIcon, color = "indigo" }) => {
  const colorMap = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  };
  const theme = colorMap[color] || colorMap.indigo;
  return (
    <div className={`p-8 ${theme.bg} rounded-[32px] border ${theme.border} flex flex-col group hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer shadow-sm`}>
        <div className="flex items-center justify-between mb-4"><WidgetIcon className={`${theme.text}`} size={28} /><ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" /></div>
        <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p><h4 className="text-3xl font-black text-slate-900 tabular-nums uppercase">{value}</h4></div>
    </div>
  );
};

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [requestedStartDate, setRequestedStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [requestedStartTime, setRequestedStartTime] = useState('09:00');
  const [requestedEndDate, setRequestedEndDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [requestedEndTime, setRequestedEndTime] = useState('18:00');
  
  const [requestedPriority, setRequestedPriority] = useState(1);
  const [requestedDuration, setRequestedDuration] = useState(10);
  const [requestedTargetType, setRequestedTargetType] = useState('all');
  const [requestedTargetId, setRequestedTargetId] = useState('');
  const [groups, setGroups] = useState([]);
  
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { data: pendingMedia = [], refetch: refetchPending } = usePendingMedia();
  const { data: approvedMedia = [], refetch: refetchApproved } = useMedia();
  const { data: screens = [] } = useScreens();

  React.useEffect(() => {
    const fetchGroups = async () => { try { const res = await api.get('/api/groups'); setGroups(res.data); } catch (e) {} };
    fetchGroups();
  }, []);

  const myFiles = React.useMemo(() => {
    const combined = [...pendingMedia, ...approvedMedia];
    return combined
      .filter(f => (f.uploaderId?._id === user?.id || f.uploaderId === user?.id || f.uploadedBy === user?.id))
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pendingMedia, approvedMedia, user?.id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Initialize payload first');
    setUploading(true);
    
    const formData = new FormData();
    formData.append('media', file);
    formData.append('requestedStartTime', `${requestedStartDate}T${requestedStartTime}`);
    formData.append('requestedEndTime', `${requestedEndDate}T${requestedEndTime}`);
    formData.append('requestedPriority', requestedPriority);
    formData.append('requestedDuration', requestedDuration);
    formData.append('requestedTargetType', requestedTargetType);
    formData.append('requestedTargetId', requestedTargetId);

    try {
      await api.post(`/api/media/upload`, formData);
      toast.success('Asset Ingested');
      setFile(null); refetchPending(); refetchApproved(); setActiveTab('myfiles');
    } catch (err) { toast.error(err.response?.data?.error || 'Sync failed'); }
    finally { setUploading(false); }
  };

  const handleResubmit = async (id) => {
    try { await api.post(`/api/media/${id}/resubmit`, {}); toast.success('Re-Submitted'); refetchPending(); refetchApproved(); } catch { toast.error('Failed'); }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
            <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-white">
                <section>
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Ingestion Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"><StatWidget label="Total Ingested" value={myFiles.length} icon={Layers} /><StatWidget label="Active Protocols" value={myFiles.filter(f => f.status === 'approved').length} icon={CheckCircle} color="emerald" /></div>
                    <div className={`border-4 border-dashed rounded-[48px] p-16 text-center transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-center min-h-[300px] ${file ? 'border-indigo-500 bg-indigo-50 shadow-2xl shadow-indigo-500/10' : 'border-slate-100 hover:border-indigo-300 hover:bg-slate-50'}`} onClick={() => document.getElementById('media-upload').click()}>
                        <input id="media-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-white border border-slate-200 group-hover:rotate-12 transition-all shadow-xl"><Upload className={`w-10 h-10 ${file ? 'text-indigo-600' : 'text-slate-300'}`} /></div>
                        {file ? (<div className="space-y-2"><p className="text-2xl font-black text-slate-900 truncate max-w-xs mx-auto uppercase tracking-tighter">{file.name}</p><p className="text-indigo-600 text-[10px] font-black uppercase tracking-[4px]">{(file.size / 1024 / 1024).toFixed(2)} MB • READY</p></div>) : (<div className="space-y-2"><p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Initialize Payload</p><p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px]">PDF, MP4, WEBM, JPG, PNG</p></div>)}
                    </div>
                </section>
            </div>
            <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-8 bg-slate-50/50">
                <section>
                    <h4 className="text-[10px] font-black uppercase text-sky-600 mb-6 flex items-center gap-3"><div className="w-6 h-px bg-sky-600/30" /> Sync Parameters</h4>
                    <form onSubmit={handleUpload} className="space-y-6 p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm">
                        <div className="space-y-6">
                            <div className="space-y-4"><h5 className="text-[10px] font-black uppercase text-indigo-600 ml-1 tracking-[2px]">Targeting Protocol</h5><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Node Cluster</label><select className="nexus-input bg-slate-50 border-slate-200 text-[10px] h-10" value={requestedTargetType} onChange={(e) => setRequestedTargetType(e.target.value)}><option value="all">Global System</option><option value="group">Cluster Group</option><option value="screen">Specific Node</option></select></div><div className="space-y-1.5"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Identity Lock</label><select disabled={requestedTargetType === 'all'} className="nexus-input bg-slate-50 border-slate-200 text-[10px] h-10 disabled:opacity-20" value={requestedTargetId} onChange={(e) => setRequestedTargetId(e.target.value)}><option value="">Select Target...</option>{requestedTargetType === 'screen' ? screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>) : groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}</select></div></div></div>
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <h5 className="text-[10px] font-black uppercase text-amber-600 ml-1 tracking-[2px]">Temporal Sync</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Launch Date</label><input type="date" required className="nexus-input bg-slate-50 border-slate-200 text-[10px] h-10" value={requestedStartDate} onChange={(e) => setRequestedStartDate(e.target.value)}/></div>
                                    <AppleTimeInput label="Launch Time" value={requestedStartTime} onChange={setRequestedStartTime} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Terminate Date</label><input type="date" required className="nexus-input bg-slate-50 border-slate-200 text-[10px] h-10" value={requestedEndDate} onChange={(e) => setRequestedEndDate(e.target.value)}/></div>
                                    <AppleTimeInput label="Terminate Time" value={requestedEndTime} onChange={setRequestedEndTime} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Priority</label><input type="number" min="1" max="100" required className="nexus-input bg-slate-50 border-slate-200 text-[10px] h-10" value={requestedPriority} onChange={(e) => setRequestedPriority(Number(e.target.value))}/></div>
                                    <div className="space-y-1.5"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Cycle (Sec)</label><input type="number" min="1" required className="nexus-input bg-slate-50 border-slate-200 text-[10px] h-10" value={requestedDuration} onChange={(e) => setRequestedDuration(Number(e.target.value))}/></div>
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={!file || (requestedTargetType !== 'all' && !requestedTargetId) || uploading} className="nexus-btn-primary w-full py-5 flex items-center justify-center gap-4 shadow-xl shadow-indigo-500/10"><span className="text-[9px] font-black uppercase tracking-[4px]">AUTHORIZE TRANSMISSION</span><Send className="w-4 h-4" /></button>
                    </form>
                </section>
            </div>
          </div>
        );
      case 'myfiles':
        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                {myFiles.length === 0 ? (<div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[60px] bg-white"><History className="w-20 h-20 mx-auto mb-6 text-slate-200" /><p className="font-black uppercase tracking-[8px] text-[10px] text-slate-400">Null Set Detected</p></div>) : (
                <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-[3px]"><th className="py-6 px-10">Manifest</th><th className="py-6 px-10">Targeting</th><th className="py-6 px-10">Sync Window</th><th className="py-6 px-10">Status</th><th className="py-6 px-10 text-right">Ops</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {myFiles.map(f => (
                        <tr key={f.id || f._id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-8 px-10"><div className="flex items-center gap-5"><div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-indigo-300 transition-colors shadow-inner">{f.fileType === 'pdf' || (f.mimeType && f.mimeType.includes('pdf')) ? <FileText className="text-indigo-600" size={24}/> : f.fileType === 'video' || (f.mimeType && f.mimeType.includes('video')) ? <Play className="text-emerald-600" size={24}/> : <ImageIcon className="text-sky-600" size={24}/>}</div><div><p className="text-base font-black text-slate-900 uppercase tracking-tighter">{f.fileName || f.originalName}</p><p className="text-[9px] font-black uppercase text-slate-400 tracking-[2px] mt-1">{f.fileType || 'Asset'}</p></div></div></td>
                            <td className="py-8 px-10"><div className="flex items-center gap-3">{f.requestedTargetType === 'all' ? <Globe className="text-slate-400" size={14} /> : f.requestedTargetType === 'screen' ? <Smartphone className="text-sky-500" size={14} /> : <Layers className="text-indigo-500" size={14} />}<div><p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{f.requestedTargetType}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{f.requestedTargetId ? (screens.find(s => s._id === f.requestedTargetId)?.name || groups.find(g => g._id === f.requestedTargetId)?.name || 'Linked') : 'System Wide'}</p></div></div></td>
                            <td className="py-8 px-10"><div className="space-y-1.5"><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> ON: {new Date(f.requestedStartTime).toLocaleDateString([], {month:'short', day:'numeric'})} {new Date(f.requestedStartTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p><p className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> OFF: {new Date(f.requestedEndTime).toLocaleDateString([], {month:'short', day:'numeric'})} {new Date(f.requestedEndTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div></td>
                            <td className="py-8 px-10"><div className="flex flex-col items-start gap-2"><span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-xl border ${f.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : f.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.status}</span>{f.status === 'rejected' && f.rejectionReason && (<div className="p-3 bg-rose-50 border border-rose-100 rounded-xl mt-1 max-w-[200px]"><p className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-tight">Reason: {f.rejectionReason}</p></div>)}</div></td>
                            <td className="py-8 px-10 text-right"><div className="flex justify-end gap-2"><button onClick={() => { setPreviewFile(f); setShowPreview(true); }} className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"><Eye size={20} /></button><button onClick={() => handleResubmit(f.id || f._id)} className="p-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"><RefreshCw size={20} /></button></div></td>
                        </tr>))}
                    </tbody></table>
                </div>)}
            </div>
        );
      case 'live':
        return (<div className="h-full overflow-hidden p-10 bg-slate-50/30 flex items-center justify-center"><div className="relative w-full max-w-6xl"><div className="absolute -inset-4 bg-indigo-500/10 rounded-[60px] blur-3xl opacity-50" /><div className="aspect-video bg-slate-950 rounded-[48px] overflow-hidden border-[8px] border-slate-900 shadow-2xl relative group"><iframe src="/display" className="w-full h-full border-none pointer-events-none scale-[1.001]" title="Live Preview" /><div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-md"><div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center mb-8 border border-white/20 shadow-2xl"><Activity size={40} className="text-white animate-pulse" /></div><p className="text-white text-xl tracking-[20px] font-black uppercase">Live Signal</p><p className="text-[10px] text-white/40 font-black uppercase tracking-[6px] mt-6">Authorized Preview Pipeline</p></div></div></div></div>);
      default: return null;
    }
  };

  return (
    <Shell role="user" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="h-full flex flex-col">
          <div className="bg-white p-8 border-b border-slate-200 shrink-0"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"><div><div className="flex items-center gap-3 mb-2"><Activity className="text-indigo-600" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Operations Hub</span></div><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Operator Console</h2></div><div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200"><button onClick={() => setActiveTab('upload')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'upload' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Ingestion Studio</button><button onClick={() => setActiveTab('myfiles')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'myfiles' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Registry</button><button onClick={() => setActiveTab('live')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Live Monitor</button></div></div></div>
          <div className="flex-1 overflow-hidden min-h-0 bg-white">{renderView()}</div>
      </div>
      <PreviewModal isOpen={showPreview} onClose={() => { setShowPreview(false); setPreviewFile(null); }} file={previewFile} />
    </Shell>
  );
};

export default UserDashboard;
