import React, { useState, useEffect } from 'react';
import { CheckCircle, Eye, File, XCircle, Calendar, Play, Monitor, AlertTriangle, Layers, CheckSquare, Clock, ShieldCheck, Zap, Trash2, Maximize, Settings, MapPin, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { usePendingMedia, usePendingAssignments, useScreens } from '../../hooks/useAdminData';

const ModerationModal = ({ isOpen, onClose, item, type, onConfirm, screens, groups }) => {
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  
  const [editData, setEditData] = useState({
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
    priority: 1,
    duration: 10,
    targetType: 'all',
    targetId: ''
  });

  useEffect(() => {
    if (item) {
      if (type === 'media') {
        const start = item.requestedStartTime ? new Date(item.requestedStartTime) : new Date();
        const end = item.requestedEndTime ? new Date(item.requestedEndTime) : new Date(Date.now() + 86400000);
        
        setEditData({
            startTime: start.toTimeString().slice(0, 5),
            endTime: end.toTimeString().slice(0, 5),
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            priority: item.requestedPriority || 1,
            duration: item.requestedDuration || 10,
            targetType: item.requestedTargetType || 'all',
            targetId: item.requestedTargetId || ''
        });
      } else {
        setEditData({
            startTime: item.startTime || '00:00',
            endTime: item.endTime || '23:59',
            startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '',
            endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '',
            priority: item.priority || 1,
            duration: item.duration || 10,
            targetType: item.isGlobal ? 'all' : (item.screenId ? 'screen' : 'group'),
            targetId: item.screenId?._id || item.screenId || item.groupId?._id || item.groupId || ''
        });
      }
    }
  }, [item, type]);

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    if (action === 'reject' && !reason.trim()) {
      return toast.error('Handshake error: Rejection requires technical justification');
    }
    onConfirm(item._id || item.id, action, action === 'approve' ? editData : { reason });
  };

  const src = item.filePath ? `${import.meta.env.VITE_API_URL}/${item.filePath}` : null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-8">
      <div className="glass max-w-7xl w-full h-[90vh] flex flex-col animate-fade-in border-white/10 rounded-[60px] overflow-hidden bg-black/40">
        
        {/* MODAL HEADER */}
        <div className="p-8 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <ShieldCheck size={32} />
            </div>
            <div>
                <span className="text-[10px] font-black uppercase tracking-[4px] text-emerald-500 mb-1 block">Security Clearance</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                    {type === 'media' ? 'Asset Verification' : 'Protocol Clearance'}
                </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-5 bg-white/5 rounded-3xl hover:bg-rose-500 transition-all text-white shadow-2xl active:scale-95"><XCircle size={24}/></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-x divide-white/5">
            
            {/* LEFT: PREVIEW & USER SPECS */}
            <div className="lg:w-1/2 p-10 overflow-y-auto custom-scrollbar space-y-10 bg-black/40">
                <section>
                    <h4 className="text-[10px] font-black uppercase text-sky-500 mb-6 flex items-center gap-3">
                        <div className="w-6 h-px bg-sky-500/30" /> Real-time Payload Preview
                    </h4>
                    
                    <div className="aspect-video bg-black rounded-[40px] overflow-hidden border-4 border-white/5 shadow-2xl relative mb-8 group">
                        {type === 'media' ? (
                            item.fileType === 'video' ? (
                                <video src={src || undefined} controls autoPlay className="w-full h-full object-contain" />
                            ) : item.fileType === 'pdf' ? (
                                <iframe src={src ? `${src}#toolbar=0` : undefined} className="w-full h-full border-none bg-white" />
                            ) : (
                                <img src={src || undefined} className="w-full h-full object-contain" />
                            )
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-slate-900">
                                <Layers className="text-white/10" size={64} />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[6px]">Logic Manifest View</p>
                            </div>
                        )}
                        <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 text-[9px] font-black uppercase text-white/60 tracking-widest">Live Asset Data</div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] space-y-6">
                            <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-[3px]">Requested Specifications</h5>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Asset Name</span>
                                    <span className="text-[10px] font-black text-white uppercase truncate max-w-[150px]">{item.fileName || item.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Node Priority</span>
                                    <span className="text-[10px] font-black text-amber-500 uppercase">Level {type === 'media' ? (item.requestedPriority || 1) : (item.priority || 1)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Cycle Duration</span>
                                    <span className="text-[10px] font-black text-sky-400 uppercase tabular-nums">{type === 'media' ? (item.requestedDuration || 10) : (item.duration || 10)} SEC</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Target Cluster</span>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase">
                                        {type === 'media' ? (item.requestedTargetType || 'ALL') : (item.isGlobal ? 'ALL' : 'TARGETED')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] space-y-6">
                            <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-[3px]">Origin Protocol</h5>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-500 font-black">
                                        {(item.uploaderId?.name || item.userId?.name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase">{item.uploaderId?.name || item.userId?.name || 'Authorized Unit'}</p>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Operator Identity</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Ingestion Time</p>
                                    <p className="text-[10px] font-black text-white tabular-nums">{new Date(item.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* RIGHT: ADMINISTRATIVE CALIBRATION */}
            <div className="lg:w-1/2 p-10 overflow-y-auto custom-scrollbar space-y-10 bg-white/5">
                
                <section>
                    <div className="flex gap-2 p-2 bg-black/40 rounded-[32px] border border-white/10 mb-10">
                        <button onClick={() => setAction('approve')} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[6px] transition-all ${action === 'approve' ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}>Authorize & Calibrate</button>
                        <button onClick={() => setAction('reject')} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[4px] transition-all ${action === 'reject' ? 'bg-rose-500 text-white shadow-2xl shadow-rose-500/20' : 'text-slate-500 hover:text-white'}`}>Execute Rejection</button>
                    </div>

                    {action === 'approve' ? (
                        <div className="space-y-12 animate-fade-in">
                            {/* TARGETING CALIBRATION */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-emerald-500 mb-8 flex items-center gap-3">
                                    <div className="w-6 h-px bg-emerald-500/30" /> Node Targeting Protocol
                                </h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cluster Logic</label>
                                        <select className="nexus-input bg-black/20 border-white/10 text-white" value={editData.targetType} onChange={(e) => setEditData({...editData, targetType: e.target.value, targetId: ''})}>
                                            <option value="all">Global Broadcast</option>
                                            <option value="group">Cluster Group</option>
                                            <option value="screen">Specific Node</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Identity Lock</label>
                                        <select disabled={editData.targetType === 'all'} className="nexus-input bg-black/20 border-white/10 text-sky-500 disabled:opacity-20" value={editData.targetId} onChange={(e) => setEditData({...editData, targetId: e.target.value})}>
                                            <option value="">Select Identity...</option>
                                            {editData.targetType === 'screen' ? 
                                                screens.map(s => <option key={s._id} value={s._id}>{s.name} • {s.location}</option>) :
                                                groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)
                                            }
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* TEMPORAL CALIBRATION */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-amber-500 mb-8 flex items-center gap-3">
                                    <div className="w-6 h-px bg-amber-500/30" /> Temporal Synchronization
                                </h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Active Window Start</label>
                                        <input type="date" className="nexus-input bg-black/20 border-white/10 text-white" value={editData.startDate} onChange={(e) => setEditData({...editData, startDate: e.target.value})}/>
                                        <input type="time" className="nexus-input mt-2 bg-black/20 border-white/10 text-white" value={editData.startTime} onChange={(e) => setEditData({...editData, startTime: e.target.value})}/>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Active Window End</label>
                                        <input type="date" className="nexus-input bg-black/20 border-white/10 text-white" value={editData.endDate} onChange={(e) => setEditData({...editData, endDate: e.target.value})}/>
                                        <input type="time" className="nexus-input mt-2 bg-black/20 border-white/10 text-white" value={editData.endTime} onChange={(e) => setEditData({...editData, endTime: e.target.value})}/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 mt-10">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Display Duration (SEC)</label>
                                        <input type="number" min="1" className="nexus-input bg-black/20 border-white/10 text-sky-400 font-black" value={editData.duration} onChange={(e) => setEditData({...editData, duration: Number(e.target.value)})}/>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Stack Priority</label>
                                        <input type="number" min="1" className="nexus-input bg-black/20 border-white/10 text-amber-500 font-black" value={editData.priority} onChange={(e) => setEditData({...editData, priority: Number(e.target.value)})}/>
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <h4 className="text-[10px] font-black uppercase text-rose-500 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-rose-500/30" /> Non-Compliance Protocol
                            </h4>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Technical Rejection Reasoning</label>
                                <textarea 
                                    className="nexus-input min-h-[240px] p-8 resize-none text-white font-bold bg-black/20 border-white/10 placeholder:opacity-20" 
                                    placeholder="Enter non-compliance justification for operator review..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                            <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[40px]">
                                <p className="text-[10px] font-bold text-rose-400/60 uppercase leading-relaxed tracking-widest italic">Note: The system will log this protocol and transmit the reasoning to the initiating unit.</p>
                            </div>
                        </div>
                    )}
                </section>

                <div className="pt-10 flex gap-6">
                    <button 
                        onClick={handleConfirm}
                        className={`flex-1 py-7 rounded-[32px] font-black uppercase tracking-[8px] text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                    >
                        {action === 'approve' ? 'SYNCHRONIZE & DEPLOY' : 'EXECUTE PURGE'}
                        <ArrowRight size={20}/>
                    </button>
                    <button onClick={onClose} className="px-12 py-7 rounded-[32px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all active:scale-95">Abort</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ModerationQueue = ({ fetchData, setPreviewFile, setShowPreview }) => {
  const { data: pendingMedia = [], refetch: refetchMedia } = usePendingMedia();
  const { data: pendingSchedules = [], refetch: refetchSchedules } = usePendingAssignments();
  const { data: screens = [] } = useScreens();
  const [groups, setGroups] = useState([]);
  
  const [activeTab, setActiveTab] = useState('media');
  const [modItem, setModItem] = useState(null);
  const [showModModal, setShowModModal] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data);
    } catch (err) { console.error('Cluster sync failed'); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleModeration = async (id, action, data = {}) => {
    try {
      const endpoint = activeTab === 'media' ? `/api/media/${id}/${action}` : `/api/schedule/${id}/${action}`;
      await api.post(endpoint, data);
      setShowModModal(false);
      setModItem(null);
      toast.success(action === 'approve' ? 'Handshake Authorized' : 'Protocol Purged');
      refetchMedia();
      refetchSchedules();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Authorization failure'); }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          
          {/* HEADER */}
          <div className="bg-black/10 p-8 border-b border-white/5 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <CheckSquare className="text-blue-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-blue-500">Compliance Studio</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Application Workspace</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('media')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'media' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Assets <span className={`px-2 py-0.5 rounded-md text-[8px] ${pendingMedia.length > 0 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{pendingMedia.length}</span>
                    </button>
                    <button onClick={() => setActiveTab('schedule')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Schedules <span className={`px-2 py-0.5 rounded-md text-[8px] ${pendingSchedules.length > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{pendingSchedules.length}</span>
                    </button>
                </div>
            </div>
          </div>

          {/* WORKSPACE CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
            {activeTab === 'media' ? (
                (!pendingMedia || pendingMedia.length === 0) ? (
                    <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[40px]">
                      <div className="w-20 h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={32} />
                      </div>
                      <p className="text-slate-400 uppercase font-black tracking-[8px] text-[10px]">Compliance Buffer Clear</p>
                    </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {pendingMedia.map(m => (
                        <div key={m._id || m.id} className="p-8 bg-white border border-slate-200 rounded-[48px] transition-all hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 group relative flex flex-col">
                            <div className="aspect-video bg-slate-950 rounded-[32px] overflow-hidden mb-8 border border-slate-900 relative group-hover:border-slate-700 transition-all shadow-inner p-1">
                                {m.fileType === 'video' ? (
                                    <video src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}` : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700 rounded-[24px]" />
                                ) : m.fileType === 'pdf' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-[24px]">
                                        <File className="text-blue-500 opacity-40 mb-3" size={40} />
                                        <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Digital PDF</span>
                                    </div>
                                ) : (
                                    <img src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}` : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700 rounded-[24px]" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                    <button onClick={() => { setPreviewFile(m); setShowPreview(true); }} className="w-16 h-16 bg-white text-black rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"><Eye size={24}/></button>
                                </div>
                            </div>
                            
                            <div className="space-y-1 mb-8 flex-1">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 inline-block px-3 py-1 rounded-lg mb-3">
                                    {m.fileType} • {(m.uploaderId?.name || 'Unknown Unit').split(' ')[0]}
                                </p>
                                <h4 className="text-xl font-black truncate text-text uppercase tracking-tighter">{m.fileName}</h4>
                            </div>
                            
                            <div className="mt-auto grid grid-cols-2 gap-4 mb-8 border-t border-slate-100 pt-8">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Window Start</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tabular-nums">{m.requestedStartTime ? new Date(m.requestedStartTime).toLocaleDateString() : 'Immediate'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Window End</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tabular-nums">{m.requestedEndTime ? new Date(m.requestedEndTime).toLocaleDateString() : 'Unset'}</p>
                                </div>
                            </div>
            
                            <button onClick={() => { setModItem(m); setShowModModal(true); }} className="w-full py-5 bg-slate-50 border border-slate-200 text-blue-600 rounded-3xl text-[10px] font-black uppercase tracking-[4px] hover:bg-blue-600 hover:text-white transition-all shadow-sm">Authorize Asset</button>
                        </div>
                    ))}
                </div>
                )
            ) : (
                (!pendingSchedules || pendingSchedules.length === 0) ? (
                    <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[40px]">
                      <div className="w-20 h-20 bg-indigo-50 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-indigo-100">
                        <Calendar className="text-indigo-500" size={32} />
                      </div>
                      <p className="text-slate-400 uppercase font-black tracking-[8px] text-[10px]">Manifest Clearance Clear</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pendingSchedules.map(s => (
                            <div key={s._id || s.id} className="p-8 bg-white border border-slate-200 rounded-[40px] flex items-center justify-between group hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all">
                                <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 rounded-[24px] bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                        {s.templateId ? <Layers className="text-indigo-500" /> : <Play className="text-indigo-500" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.templateId ? 'Layout Protocol' : 'Standard Broadcast'}</p>
                                        <h4 className="text-2xl font-black text-text uppercase tracking-tighter">{s.name}</h4>
                                        <div className="flex items-center gap-4 mt-3">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase bg-slate-50 px-3 py-1 rounded-lg border border-slate-100"><Monitor size={12}/> {s.isGlobal ? 'Global' : (s.screenId?.name || 'Specific Node')}</span>
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 uppercase bg-orange-50 px-3 py-1 rounded-lg border border-orange-100"><AlertTriangle size={12}/> Priority {s.priority}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right pr-8 border-r border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-end items-center gap-1"><Clock size={10}/> Deployment Window</p>
                                        <p className="text-xs font-bold text-slate-600 tabular-nums mb-1">{new Date(s.startDate).toLocaleDateString()} — {new Date(s.endDate).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-black text-indigo-600 tabular-nums bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 inline-block">{s.startTime} — {s.endTime}</p>
                                    </div>
                                    <button onClick={() => { setModItem(s); setShowModModal(true); }} className="px-10 py-5 bg-indigo-600 text-white rounded-[20px] font-black uppercase text-[10px] tracking-[4px] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">Evaluate Request</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
          </div>
       </div>

      <ModerationModal 
        key={modItem?._id || modItem?.id} 
        isOpen={showModModal} 
        onClose={() => { setShowModModal(false); setModItem(null); }} 
        item={modItem} 
        type={activeTab}
        onConfirm={handleModeration} 
        screens={screens}
        groups={groups}
      />
    </div>
  );
};

export default ModerationQueue;
