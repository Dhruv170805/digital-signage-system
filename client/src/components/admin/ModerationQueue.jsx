import React, { useState } from 'react';
import { CheckCircle, Eye, File, XCircle, Calendar, Play, Monitor, AlertTriangle, Layers } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { usePendingMedia, usePendingAssignments } from '../../hooks/useAdminData';

const ModerationModal = ({ isOpen, onClose, item, type, onConfirm }) => {
  const [action, setAction] = useState('approve');
  const [startTime, setStartTime] = useState(item?.requestedStartTime || item?.startTime ? new Date(item.requestedStartTime || item.startTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState(item?.requestedEndTime || item?.endTime ? new Date(item.requestedEndTime || item.endTime).toISOString().slice(0, 16) : '');
  const [reason, setReason] = useState('');

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    if (action === 'reject' && !reason.trim()) {
      return toast.error('Please provide a reason for rejection.');
    }
    onConfirm(item._id || item.id, action, action === 'approve' ? { startTime, endTime } : { reason });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
      <div className="glass max-w-lg w-full p-10 space-y-8 animate-fade-in border-white/10">
        <div className="flex justify-between items-center pb-6 border-b border-white/5">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
            {type === 'media' ? 'Asset Authorization' : 'Schedule Clearance'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><XCircle /></button>
        </div>

        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
          <button onClick={() => setAction('approve')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${action === 'approve' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Approve</button>
          <button onClick={() => setAction('reject')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${action === 'reject' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Reject</button>
        </div>

        <div className="space-y-6">
          {action === 'approve' ? (
            <>
              {type === 'media' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Override From</label>
                    <input type="datetime-local" className="nexus-input py-3 text-xs" value={startTime} onChange={(e) => setStartTime(e.target.value)}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Override TO</label>
                    <input type="datetime-local" className="nexus-input py-3 text-xs" value={endTime} onChange={(e) => setEndTime(e.target.value)}/>
                  </div>
                </div>
              )}
              <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                <p className="text-[10px] font-bold text-sky-400 uppercase leading-tight">
                  {type === 'media' 
                    ? 'Approving will make this asset available in the Broadcast System for deployment.' 
                    : 'Approving will instantly push this schedule to the targeted screens.'}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Reason for Rejection</label>
              <textarea 
                className="nexus-input min-h-[120px] py-4 resize-none text-slate-800 font-bold" 
                placeholder="Enter technical reason for non-compliance..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <button 
          onClick={handleConfirm}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[4px] shadow-2xl transition-all active:scale-95 ${action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
        >
          {action === 'approve' ? 'Authorize Deployment' : 'Execute Rejection'}
        </button>
      </div>
    </div>
  );
};

const ModerationQueue = ({ fetchData, setPreviewFile, setShowPreview }) => {
  const { data: pendingMedia = [], refetch: refetchMedia } = usePendingMedia();
  const { data: pendingSchedules = [], refetch: refetchSchedules } = usePendingAssignments();
  
  const [activeTab, setActiveTab] = useState('media');
  const [modItem, setModItem] = useState(null);
  const [showModModal, setShowModModal] = useState(false);

  const handleModeration = async (id, action, data = {}) => {
    try {
      const endpoint = activeTab === 'media' ? `/api/media/${id}/${action}` : `/api/schedule/${id}/${action}`;
      await api.post(endpoint, data);
      setShowModModal(false);
      setModItem(null);
      toast.success(action === 'approve' ? 'Request authorized.' : 'Request rejected.');
      refetchMedia();
      refetchSchedules();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  return (
    <div className="animate-fade-in space-y-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-text uppercase tracking-tighter">Moderation Engine</h3>
          <p className="text-[10px] font-bold text-text-dim uppercase tracking-[4px] mt-2">Required Multi-Level Clearances</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setActiveTab('media')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'media' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                Media ({pendingMedia.length})
            </button>
            <button onClick={() => setActiveTab('schedule')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'schedule' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                Schedules ({pendingSchedules.length})
            </button>
        </div>
      </div>

      {activeTab === 'media' ? (
        pendingMedia.length === 0 ? (
            <div className="text-center py-32 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/10">
                <CheckCircle className="text-emerald-500 opacity-40" size={32} />
              </div>
              <p className="text-text-dim uppercase font-black tracking-[6px] text-xs">Media Queue Empty</p>
            </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pendingMedia.map(m => (
                <div key={m._id || m.id} className="glass-card p-6 group relative overflow-hidden transition-all duration-500 hover:scale-[1.02]">
                   <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6 border border-slate-200 relative group-hover:border-slate-300 transition-all">
                      {m.fileType === 'video' ? (
                        <video src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}` : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
                      ) : m.fileType === 'pdf' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                           <File className="text-blue-500 opacity-40 mb-3" size={40} />
                           <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Digital PDF</span>
                        </div>
                      ) : (
                        <img src={m.filePath ? `${import.meta.env.VITE_API_URL}/${m.filePath}` : undefined} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                         <button onClick={() => { setPreviewFile(m); setShowPreview(true); }} className="w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"><Eye size={24}/></button>
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{m.fileType} • {(m.uploaderId?.name || 'Unknown').split(' ')[0]}</p>
                     <h4 className="text-lg font-black truncate text-text uppercase tracking-tighter">{m.fileName}</h4>
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <p className="text-[8px] font-black text-text-dim mb-2 uppercase tracking-widest leading-none">Window Start</p>
                        <p className="text-[10px] font-black text-text uppercase tracking-tighter tabular-nums">{m.requestedStartTime ? new Date(m.requestedStartTime).toLocaleDateString() : 'Immediate'}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <p className="text-[8px] font-black text-text-dim mb-2 uppercase tracking-widest leading-none">Window End</p>
                        <p className="text-[10px] font-black text-text uppercase tracking-tighter tabular-nums">{m.requestedEndTime ? new Date(m.requestedEndTime).toLocaleDateString() : 'Unset'}</p>
                     </div>
                   </div>
   
                   <button onClick={() => { setModItem(m); setShowModModal(true); }} className="w-full mt-6 py-4 bg-blue-600/10 border border-blue-600/20 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-blue-600 hover:text-white transition-all duration-300">Evaluate Asset</button>
                </div>
              ))}
           </div>
         )
      ) : (
        pendingSchedules.length === 0 ? (
            <div className="text-center py-32 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-indigo-500/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/10">
                <Calendar className="text-indigo-500 opacity-40" size={32} />
              </div>
              <p className="text-text-dim uppercase font-black tracking-[6px] text-xs">Schedule Queue Empty</p>
            </div>
         ) : (
            <div className="space-y-4">
                {pendingSchedules.map(s => (
                    <div key={s._id || s.id} className="p-8 bg-white border border-slate-200 rounded-[32px] flex items-center justify-between group hover:border-indigo-500 transition-all">
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                              {s.templateId ? <Layers className="text-indigo-500" /> : <Play className="text-indigo-500" />}
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.templateId ? 'Multi-Frame Layout' : 'Standard Media'}</p>
                              <h4 className="text-xl font-black text-text uppercase tracking-tighter">{s.name}</h4>
                              <div className="flex items-center gap-4 mt-2">
                                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase"><Monitor size={12}/> {s.isGlobal ? 'Global Broadcast' : (s.screenId?.name || 'Specific Screen')}</span>
                                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase"><AlertTriangle size={12}/> Priority {s.priority}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="text-right pr-8 border-r border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled Window</p>
                              <p className="text-xs font-bold text-text tabular-nums">{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</p>
                              <p className="text-[10px] font-black text-indigo-600 tabular-nums">{s.startTime} — {s.endTime}</p>
                           </div>
                           <button onClick={() => { setModItem(s); setShowModModal(true); }} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[4px] hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">Review Schedule</button>
                        </div>
                    </div>
                ))}
            </div>
         )
      )}

      <ModerationModal 
        key={modItem?._id || modItem?.id} 
        isOpen={showModModal} 
        onClose={() => { setShowModModal(false); setModItem(null); }} 
        item={modItem} 
        type={activeTab}
        onConfirm={handleModeration} 
      />
    </div>
  );
};

export default ModerationQueue;
