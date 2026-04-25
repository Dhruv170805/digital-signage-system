import React, { useState, useEffect } from 'react';
import { CheckCircle, Eye, File, XCircle, Calendar, Play, Monitor, AlertTriangle, Layers, CheckSquare, Clock, ShieldCheck, Zap, Trash2, Maximize, Settings, MapPin, ArrowRight, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { usePendingMedia, usePendingAssignments, useScreens } from '../../hooks/useAdminData';

const ModerationModal = ({ isOpen, onClose, item, type, onConfirm, screens, groups }) => {
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  
  const [editData, setEditData] = useState({
    startTime: '', endTime: '', startDate: '', endDate: '',
    priority: 1, duration: 10, targetType: 'all', targetId: ''
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
    if (action === 'reject' && !reason.trim()) return toast.error('Rejection requires justification');
    onConfirm(item._id || item.id, action, action === 'approve' ? editData : { reason });
  };

  const src = item.filePath ? `${import.meta.env.VITE_API_URL}/${item.filePath}`.replace(/([^:]\/)\/+/g, "$1") : null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
      <div className="glass max-w-7xl w-full h-[90vh] flex flex-col animate-fade-in border-white/20 rounded-[60px] overflow-hidden bg-white shadow-2xl">
        
        <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm"><ShieldCheck size={32} /></div>
            <div>
                <span className="text-[10px] font-black uppercase tracking-[4px] text-emerald-600 mb-1 block">Security Protocol</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">{type === 'media' ? 'Asset Audit' : 'Protocol Clearance'}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-5 bg-slate-100 rounded-3xl hover:bg-rose-500 hover:text-white transition-all text-slate-400 shadow-sm active:scale-95"><XCircle size={24}/></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-x divide-slate-200">
            <div className="lg:w-1/2 p-10 overflow-y-auto custom-scrollbar space-y-10 bg-slate-50/30">
                <section>
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-6 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Ingestion Preview</h4>
                    <div className="aspect-video bg-slate-950 rounded-[40px] overflow-hidden border-8 border-slate-900 shadow-2xl relative mb-8 group">
                        {type === 'media' ? (
                            item.fileType === 'video' ? <video src={src || undefined} controls autoPlay className="w-full h-full object-contain" /> :
                            item.fileType === 'pdf' ? <iframe src={src ? `${src}#toolbar=0` : undefined} className="w-full h-full border-none bg-white" title="pdf" /> :
                            <img src={src || undefined} className="w-full h-full object-contain" alt="preview" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-slate-900"><Layers className="text-white/10" size={64} /><p className="text-[10px] font-black text-white/20 uppercase tracking-[6px]">Logic Manifest</p></div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm space-y-6">
                            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px]">Requested Specs</h5>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3"><span className="text-[9px] font-bold text-slate-400 uppercase">Identity</span><span className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[120px]">{item.fileName || item.name}</span></div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3"><span className="text-[9px] font-bold text-slate-400 uppercase">Priority</span><span className="text-[10px] font-black text-amber-600 uppercase">Level {type === 'media' ? (item.requestedPriority || 1) : (item.priority || 1)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 uppercase">Cycle</span><span className="text-[10px] font-black text-sky-600 uppercase tabular-nums">{type === 'media' ? (item.requestedDuration || 10) : (item.duration || 10)} SEC</span></div>
                            </div>
                        </div>
                        <div className="p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm space-y-6">
                            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px]">Origin Trace</h5>
                            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600"><User size={20}/></div><div><p className="text-[10px] font-black text-slate-900 uppercase">{item.uploaderId?.name || item.userId?.name || 'Unit'}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operator</p></div></div>
                            <div className="pt-4 border-t border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Timestamp</p><p className="text-[10px] font-black text-slate-700 tabular-nums">{new Date(item.createdAt).toLocaleString()}</p></div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="lg:w-1/2 p-10 overflow-y-auto custom-scrollbar space-y-10 bg-white">
                <div className="flex gap-2 p-2 bg-slate-100 rounded-[32px] border border-slate-200 mb-10">
                    <button onClick={() => setAction('approve')} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[6px] transition-all ${action === 'approve' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Authorize</button>
                    <button onClick={() => setAction('reject')} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[4px] transition-all ${action === 'reject' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Reject</button>
                </div>

                {action === 'approve' ? (
                    <div className="space-y-12 animate-fade-in">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-emerald-600/30" /> Node Targeting</h4>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Logic</label><select className="nexus-input bg-slate-50 border-slate-200" value={editData.targetType} onChange={(e) => setEditData({...editData, targetType: e.target.value, targetId: ''})}><option value="all">Global Broadcast</option><option value="group">Cluster Group</option><option value="screen">Specific Node</option></select></div>
                                <div className="space-y-3"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Identity Lock</label><select disabled={editData.targetType === 'all'} className="nexus-input bg-slate-50 border-slate-200 text-sky-600 font-black disabled:opacity-20" value={editData.targetId} onChange={(e) => setEditData({...editData, targetId: e.target.value})}><option value="">Select Identity...</option>{editData.targetType === 'screen' ? screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>) : groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}</select></div>
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-amber-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-amber-600/30" /> Sync Window</h4>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Launch</label><input type="date" className="nexus-input bg-slate-50 border-slate-200" value={editData.startDate} onChange={(e) => setEditData({...editData, startDate: e.target.value})}/><input type="time" className="nexus-input mt-2 bg-slate-50 border-slate-200" value={editData.startTime} onChange={(e) => setEditData({...editData, startTime: e.target.value})}/></div>
                                <div className="space-y-3"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Terminate</label><input type="date" className="nexus-input bg-slate-50 border-slate-200" value={editData.endDate} onChange={(e) => setEditData({...editData, endDate: e.target.value})}/><input type="time" className="nexus-input mt-2 bg-slate-50 border-slate-200" value={editData.endTime} onChange={(e) => setEditData({...editData, endTime: e.target.value})}/></div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        <h4 className="text-[10px] font-black uppercase text-rose-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-rose-600/30" /> Rejection Protocol</h4>
                        <textarea className="nexus-input min-h-[240px] p-8 bg-slate-50 border-slate-200 font-bold" placeholder="Justification..." value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                )}

                <div className="pt-10 flex gap-6 mt-auto">
                    <button onClick={handleConfirm} className={`flex-1 py-7 rounded-[32px] font-black uppercase tracking-[8px] text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}>{action === 'approve' ? 'AUTHORIZE & DEPLOY' : 'EXECUTE PURGE'}<ArrowRight size={20}/></button>
                    <button onClick={onClose} className="px-12 py-7 rounded-[32px] bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all">Abort</button>
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

  useEffect(() => {
    const fetchGroups = async () => { try { const res = await api.get('/api/groups'); setGroups(res.data); } catch (e) {} };
    fetchGroups();
  }, []);

  const handleModeration = async (id, action, data = {}) => {
    try {
      const endpoint = activeTab === 'media' ? `/api/media/${id}/${action}` : `/api/schedule/${id}/${action}`;
      await api.post(endpoint, data);
      setShowModModal(false); setModItem(null);
      toast.success('Protocol Processed');
      refetchMedia(); refetchSchedules();
      if (fetchData) fetchData();
    } catch (err) { toast.error('Processing failed'); }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="flex flex-col h-full overflow-hidden">
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2"><CheckSquare className="text-indigo-600" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Compliance Hub</span></div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Moderation Studio</h2>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button onClick={() => setActiveTab('media')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'media' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Assets ({pendingMedia.length})</button>
                    <button onClick={() => setActiveTab('schedule')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'schedule' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Schedules ({pendingSchedules.length})</button>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
            {activeTab === 'media' ? (
                (!pendingMedia || pendingMedia.length === 0) ? (
                    <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[60px] bg-white"><div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><CheckCircle className="text-emerald-500" size={32} /></div><p className="text-slate-400 uppercase font-black tracking-[8px] text-[10px]">Compliance Buffer Clear</p></div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {pendingMedia.map(m => (
                        <div key={m._id || m.id} className="p-8 bg-white border border-slate-200 rounded-[48px] transition-all hover:border-indigo-400 hover:shadow-2xl group flex flex-col">
                            <div className="aspect-video bg-slate-950 rounded-[32px] overflow-hidden mb-8 border-4 border-slate-900 relative shadow-inner">
                                {m.fileType === 'video' ? <video src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}`.replace(/([^:]\/)\/+/g, "$1") : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" /> :
                                 m.fileType === 'pdf' ? <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900"><File className="text-indigo-500/40 mb-3" size={40} /><span className="text-[10px] font-black text-indigo-500/40 uppercase">PDF</span></div> :
                                <img src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}`.replace(/([^:]\/)\/+/g, "$1") : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" alt="p" />}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0"><button onClick={() => { setPreviewFile(m); setShowPreview(true); }} className="w-16 h-16 bg-white text-black rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"><Eye size={24}/></button></div>
                            </div>
                            <div className="space-y-1 mb-8 flex-1"><p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg inline-block mb-3">{m.fileType} • {m.uploaderId?.name || 'User'}</p><h4 className="text-xl font-black truncate text-slate-900 uppercase tracking-tighter">{m.fileName}</h4></div>
                            <button onClick={() => { setModItem(m); setShowModModal(true); }} className="w-full py-5 bg-slate-50 border border-slate-200 text-indigo-600 rounded-3xl text-[10px] font-black uppercase tracking-[4px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Evaluate Asset</button>
                        </div>
                    ))}
                </div>
                )
            ) : (
                (!pendingSchedules || pendingSchedules.length === 0) ? (
                    <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[60px] bg-white"><div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Calendar className="text-indigo-600" size={32} /></div><p className="text-slate-400 uppercase font-black tracking-[8px] text-[10px]">Manifest Clearance Clear</p></div>
                ) : (
                    <div className="space-y-6">
                        {pendingSchedules.map(s => (
                            <div key={s._id || s.id} className="p-8 bg-white border border-slate-200 rounded-[40px] flex items-center justify-between group hover:border-indigo-400 hover:shadow-2xl transition-all">
                                <div className="flex items-center gap-8"><div className="w-16 h-16 rounded-[24px] bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">{s.templateId ? <Layers size={28}/> : <Play size={28}/>}</div><div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">{s.templateId ? 'Protocol' : 'Broadcast'}</p><h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{s.name}</h4><div className="flex items-center gap-4 mt-3"><span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5"><Monitor size={12}/> {s.isGlobal ? 'Global' : 'Targeted'}</span><span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 flex items-center gap-1.5"><AlertTriangle size={12}/> Priority {s.priority}</span></div></div></div>
                                <div className="flex items-center gap-8"><div className="text-right pr-8 border-r border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex justify-end items-center gap-1"><Clock size={10}/> Deployment</p><p className="text-[10px] font-black text-indigo-600 tabular-nums bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{s.startTime} — {s.endTime}</p></div><button onClick={() => { setModItem(s); setShowModModal(true); }} className="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[4px] hover:bg-indigo-700 shadow-xl transition-all">Evaluate Request</button></div>
                            </div>
                        ))}
                    </div>
                )
            )}
          </div>
       </div>

      <ModerationModal key={modItem?._id || modItem?.id} isOpen={showModModal} onClose={() => { setShowModModal(false); setModItem(null); }} item={modItem} type={activeTab} onConfirm={handleModeration} screens={screens} groups={groups} />
    </div>
  );
};

export default ModerationQueue;
