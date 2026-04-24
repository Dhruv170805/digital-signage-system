import React, { useState } from 'react';
import { Calendar, Activity, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useScreens, useTemplates, useMedia, useTickers, useSchedules } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';
import Card from './Card';

const BroadcastScheduler = ({ fetchData }) => {
  const { data: screens = [] } = useScreens();
  const { data: templates = [] } = useTemplates();
  const { data: media = [] } = useMedia();
  const { data: tickers = [] } = useTickers();
  const { data: schedules = [], refetch } = useSchedules();

  const [newSchedule, setNewSchedule] = useState({ screenId: '', templateId: '', mediaId: '', startTime: '', endTime: '', priority: 1, duration: 10 });
  const [mediaMapping, setMediaMapping] = useState({});

  const approvedMedia = media.filter(m => m.status === 'approved');

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
      toast.success('Broadcast Scheduled');
      setNewSchedule({ screenId: '', templateId: '', mediaId: '', startTime: '', endTime: '', priority: 1, duration: 10 });
      setMediaMapping({});
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Terminate Broadcast?')) return;
    try {
      await api.delete(`/api/schedule/${id}`);
      toast.success('Broadcast Terminated');
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const selectedTemplate = templates.find(t => t.id === newSchedule.templateId || t._id === newSchedule.templateId);
  const layout = selectedTemplate ? safeParseJSON(selectedTemplate.layout) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in text-text">
       <Card 
         className="lg:col-span-1" 
         title="Broadcast System" 
         icon={Calendar} 
         subtitle="Transmission Control"
       >
          <form onSubmit={createSchedule} className="space-y-6">
             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Screen</label>
               <select className="nexus-input" value={newSchedule.screenId} onChange={(e) => setNewSchedule(p => ({ ...p, screenId: e.target.value }))}>
                  <option value="">Broadcast to All</option>
                  {screens.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Layout</label>
               <select className="nexus-input" value={newSchedule.templateId} onChange={(e) => {
                 setNewSchedule(p => ({ ...p, templateId: e.target.value, mediaId: '' }));
                 setMediaMapping({});
               }}>
                  <option value="">Standard Fullscreen</option>
                  {templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
               </select>
             </div>

             {!newSchedule.templateId ? (
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Files</label>
                 <select required className="nexus-input" value={newSchedule.mediaId} onChange={(e) => setNewSchedule(p => ({ ...p, mediaId: e.target.value }))}>
                    <option value="">Select Asset</option>
                    {approvedMedia.map(m => <option key={m.id || m._id} value={m.id || m._id}>{m.fileName}</option>)}
                 </select>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 shadow-2xl">
                     <div className="absolute inset-0 grid opacity-10" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
                        {[...Array(144)].map((_, i) => <div key={i} className="border-[0.5px] border-slate-700" />)}
                     </div>
                     {layout.map(z => {
                        const isMapped = mediaMapping[z.i];
                        return (
                          <div 
                            key={z.i} 
                            className={`absolute border flex items-center justify-center transition-all cursor-help ${isMapped ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-slate-900/50 border-slate-700'}`}
                            style={{
                                left: `${z.x}%`,
                                top: `${z.y}%`,
                                width: `${z.w}%`,
                                height: `${z.h}%`
                            }}
                            title={`Zone: ${z.i}`}
                          >
                             <span className={`text-[10px] font-black uppercase ${isMapped ? 'text-sky-300' : 'text-slate-600'}`}>{z.i}</span>
                          </div>
                        );
                     })}
                  </div>

                  <div className="space-y-4 p-4 border border-slate-200 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-center border-b border-slate-200 pb-2 mb-4 text-text-dim">Zone Mapping</p>
                    {layout.map((z) => (
                      <div key={z.i} className="space-y-1">
                        <label className="text-[9px] font-bold uppercase ml-1 opacity-50">Zone {z.i} {z.type === 'ticker' ? '(TICKER)' : ''}</label>
                        <select required className="nexus-input py-2 text-xs" value={mediaMapping[z.i] || ''} onChange={(e) => setMediaMapping(p => ({ ...p, [z.i]: e.target.value }))}>
                           <option value="">Select {z.type === 'ticker' ? 'Ticker' : 'Media Asset'}</option>
                           {z.type === 'ticker' ? (
                               tickers.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.text}</option>)
                           ) : (
                               approvedMedia.map(m => <option key={m.id || m._id} value={m.id || m._id}>{m.fileName}</option>)
                           )}
                        </select>
                      </div>
                    ))}

                    {Object.values(mediaMapping).filter(id => {
                        const m = approvedMedia.find(am => (am.id === id || am._id === id));
                        return m?.fileType === 'video';
                    }).length > 2 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[9px] font-bold text-amber-700 leading-tight uppercase">Performance Risk: High-density video decoding detected.</p>
                        </div>
                    )}
                  </div>
               </div>
             )}

             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase ml-1 opacity-50">From Date & Time</label>
                  <input type="datetime-local" required className="nexus-input" value={newSchedule.startTime} onChange={(e) => setNewSchedule(p => ({ ...p, startTime: e.target.value }))}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase ml-1 opacity-50">To Date & Time</label>
                  <input type="datetime-local" required className="nexus-input" value={newSchedule.endTime} onChange={(e) => setNewSchedule(p => ({ ...p, endTime: e.target.value }))}/>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Duration (sec)</label>
                  <input type="number" min="1" required className="nexus-input" value={newSchedule.duration} onChange={(e) => setNewSchedule(p => ({ ...p, duration: Number(e.target.value) }))}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Priority Level</label>
                  <input type="number" min="1" required className="nexus-input" value={newSchedule.priority} onChange={(e) => setNewSchedule(p => ({ ...p, priority: Number(e.target.value) }))}/>
                </div>
             </div>

             <button type="submit" className="nexus-btn-primary w-full tracking-[2px]">Broadcast</button>
          </form>
       </Card>

       <Card 
         className="lg:col-span-3 overflow-hidden" 
         title="Live Manifest" 
         icon={Activity} 
         subtitle="Active Broadcast Queue"
       >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase text-text-dim">
                     <th className="py-4 px-6">Media / Template</th>
                     <th className="py-4 px-6">Screen</th>
                     <th className="py-4 px-6">Active Window</th>
                     <th className="py-4 px-6 text-right">Operations</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {schedules.map(s => {
                    const m = approvedMedia.find(am => (am.id === s.mediaId || am._id === s.mediaId));
                    const t = templates.find(tm => (tm.id === s.templateId || tm._id === s.templateId));
                    const scr = screens.find(sc => (sc.id === s.screenId || sc._id === s.screenId));
                    return (
                      <tr key={s.id || s._id} className="hover:bg-slate-50 transition-colors group">
                         <td className="py-5 px-6">
                            <p className="font-bold text-text uppercase text-xs tracking-tight">{t ? t.name : (m?.fileName || 'Asset Unknown')}</p>
                            <p className="text-[8px] font-bold text-sky-600/60 uppercase mt-1 tracking-widest">{t ? 'MULTI-FRAME ARRAY' : (m?.fileType || 'MEDIA')}</p>
                         </td>
                         <td className="py-5 px-6 text-[10px] font-black uppercase text-text-dim">{scr ? scr.name : 'GLOBAL'}</td>
                         <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               <p className="text-[10px] font-bold tabular-nums text-text">
                                  {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                  <span className="mx-2 opacity-20">→</span>
                                  {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                         </td>
                         <td className="py-5 px-6 text-right">
                            <button onClick={() => deleteSchedule(s.id || s._id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
          </div>
       </Card>
    </div>
  );
};

export default BroadcastScheduler;
