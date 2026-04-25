import React, { useState, useEffect } from 'react';
import { CheckCircle, Eye, File, XCircle, Calendar, Play, Monitor, AlertTriangle, Layers, CheckSquare, Clock, ShieldCheck, Zap, Trash2, Maximize, Settings, MapPin } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { usePendingMedia, usePendingAssignments, useScreens } from '../../hooks/useAdminData';

const ModerationModal = ({ isOpen, onClose, item, type, onConfirm, screens, groups }) => {
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  
  // Data Overrides
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
        setEditData({
            startTime: item.requestedStartTime ? new Date(item.requestedStartTime).toISOString().slice(0, 16) : '',
            endTime: item.requestedEndTime ? new Date(item.requestedEndTime).toISOString().slice(0, 16) : '',
            priority: 1,
            duration: 10,
            targetType: 'all',
            targetId: ''
        });
      } else {
        setEditData({
            startTime: item.startTime || '',
            endTime: item.endTime || '',
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
      return toast.error('Technical reason required for rejection');
    }
    onConfirm(item._id || item.id, action, action === 'approve' ? editData : { reason });
  };

  const src = item.filePath ? `${import.meta.env.VITE_API_URL}/${item.filePath}` : null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-8">
      <div className="glass max-w-6xl w-full h-[90vh] flex flex-col animate-fade-in border-white/10 rounded-[48px] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-8 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="text-emerald-500" size={16} />
                <span className="text-[10px] font-black uppercase tracking-[4px] text-emerald-500">Security Clearance</span>
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-white">
                {type === 'media' ? 'Asset Verification' : 'Schedule Protocol'}
            </h3>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl hover:bg-rose-500 transition-all text-white shadow-xl"><XCircle/></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-x divide-white/5">
            
            {/* LEFT: Preview & Status */}
            <div className="lg:w-2/5 p-10 overflow-y-auto custom-scrollbar space-y-8 bg-black/40">
                <section>
                    <h4 className="text-[10px] font-black uppercase text-sky-500 mb-6 flex items-center gap-3">
                        <div className="w-6 h-px bg-sky-500/30" /> Payload Intelligence
                    </h4>
                    
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative mb-6">
                        {type === 'media' ? (
                            item.fileType === 'video' ? (
                                <video src={src || undefined} controls autoPlay className="w-full h-full object-contain" />
                            ) : item.fileType === 'pdf' ? (
                                <iframe src={src ? `${src}#toolbar=0` : undefined} className="w-full h-full border-none bg-white" />
                            ) : (
                                <img src={src || undefined} className="w-full h-full object-contain" />
                            )
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                                <Layers className="text-white/20" size={48} />
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Structural Manifest View</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] space-y-4">
                        <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Source Identifier</p>
                            <p className="text-sm font-black text-text uppercase">{item.fileName || item.name}</p>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-4">
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Requested By</p>
                                <p className="text-[10px] font-bold text-sky-400 uppercase">{item.uploaderId?.name || item.userId?.name || 'Authorized Unit'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Security Tier</p>
                                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20 text-[8px] font-black uppercase">Standard</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* RIGHT: Administrative Overrides */}
            <div className="lg:w-3/5 p-10 overflow-y-auto custom-scrollbar space-y-10 bg-white/5">
                
                <section>
                    <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/10 mb-10">
                        <button onClick={() => setAction('approve')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[4px] transition-all ${action === 'approve' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}>Deploy</button>
                        <button onClick={() => setAction('reject')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[4px] transition-all ${action === 'reject' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'text-slate-500 hover:text-white'}`}>Reject</button>
                    </div>

                    {action === 'approve' ? (
                        <div className="space-y-10 animate-fade-in">
                            {/* TARGETING OVERRIDE */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-emerald-500 mb-6 flex items-center gap-3">
                                    <div className="w-6 h-px bg-emerald-500/30" /> Targeting Override
                                </h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Cluster Logic</label>
                                        <select className="nexus-input bg-black/20 border-white/10" value={editData.targetType} onChange={(e) => setEditData({...editData, targetType: e.target.value, targetId: ''})}>
                                            <option value="all">Global Broadcast</option>
                                            <option value="group">Screen Group</option>
                                            <option value="screen">Specific Screen</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Identity Lock</label>
                                        <select disabled={editData.targetType === 'all'} className="nexus-input bg-black/20 border-white/10 disabled:opacity-20" value={editData.targetId} onChange={(e) => setEditData({...editData, targetId: e.target.value})}>
                                            <option value="">Select Target...</option>
                                            {editData.targetType === 'screen' ? 
                                                screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>) :
                                                groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)
                                            }
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* TEMPORAL OVERRIDE */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-amber-500 mb-6 flex items-center gap-3">
                                    <div className="w-6 h-px bg-amber-500/30" /> Temporal Calibration
                                </h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Window Start</label>
                                        <input type={type === 'media' ? 'datetime-local' : 'time'} className="nexus-input bg-black/20 border-white/10" value={editData.startTime} onChange={(e) => setEditData({...editData, startTime: e.target.value})}/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Window End</label>
                                        <input type={type === 'media' ? 'datetime-local' : 'time'} className="nexus-input bg-black/20 border-white/10" value={editData.endTime} onChange={(e) => setEditData({...editData, endTime: e.target.value})}/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Display duration (sec)</label>
                                        <input type="number" min="1" className="nexus-input bg-black/20 border-white/10" value={editData.duration} onChange={(e) => setEditData({...editData, duration: Number(e.target.value)})}/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Stack Priority</label>
                                        <input type="number" min="1" className="nexus-input bg-black/20 border-white/10" value={editData.priority} onChange={(e) => setEditData({...editData, priority: Number(e.target.value)})}/>
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <h4 className="text-[10px] font-black uppercase text-rose-500 mb-6 flex items-center gap-3">
                                <div className="w-6 h-px bg-rose-500/30" /> Rejection Protocol
                            </h4>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Technical Justification</label>
                                <textarea 
                                    className="nexus-input min-h-[200px] py-6 resize-none text-white font-bold bg-black/20 border-white/10" 
                                    placeholder="Provide detailed non-compliance reasoning..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                            <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[32px]">
                                <p className="text-[10px] font-bold text-rose-500/60 uppercase leading-relaxed tracking-widest italic">Note: This reasoning will be transmitted back to the operator unit for corrective action.</p>
                            </div>
                        </div>
                    )}
                </section>

                <div className="pt-10 flex gap-4">
                    <button 
                        onClick={handleConfirm}
                        className={`flex-1 py-6 rounded-3xl font-black uppercase tracking-[6px] text-xs shadow-2xl transition-all active:scale-95 ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                    >
                        {action === 'approve' ? 'SYNCHRONIZE & DEPLOY' : 'EXECUTE REJECTION'}
                    </button>
                    <button onClick={onClose} className="px-10 py-6 rounded-3xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">Abort</button>
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
    } catch (err) { console.error('Failed to load groups'); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleModeration = async (id, action, data = {}) => {
    try {
      const endpoint = activeTab === 'media' ? `/api/media/${id}/${action}` : `/api/schedule/${id}/${action}`;
      await api.post(endpoint, data);
      setShowModModal(false);
      setModItem(null);
      toast.success(action === 'approve' ? 'Identity Authorized' : 'Protocol Rejected');
      refetchMedia();
      refetchSchedules();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Handshake failure'); }
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
                pendingMedia.length === 0 ? (
                    <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[40px]">
                      <div className="w-20 h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={32} />
                      </div>
                      <p className="text-slate-400 uppercase font-black tracking-[8px] text-[10px]">Compliance Buffer Clear</p>
                    </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {pendingMedia.map(m => (
                        <div key={m._id || m.id} className="p-8 bg-white border border-slate-200 rounded-[40px] transition-all hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 group relative flex flex-col">
                            <div className="aspect-video bg-slate-950 rounded-3xl overflow-hidden mb-8 border border-slate-900 relative group-hover:border-slate-700 transition-all shadow-inner p-1">
                                {m.fileType === 'video' ? (
                                    <video src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}` : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700 rounded-2xl" />
                                ) : m.fileType === 'pdf' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl">
                                        <File className="text-blue-500 opacity-40 mb-3" size={40} />
                                        <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Digital PDF</span>
                                    </div>
                                ) : (
                                    <img src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}` : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700 rounded-2xl" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                    <button onClick={() => { setModItem(m); setShowModModal(true); }} className="w-16 h-16 bg-white text-black rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"><Maximize size={24}/></button>
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
