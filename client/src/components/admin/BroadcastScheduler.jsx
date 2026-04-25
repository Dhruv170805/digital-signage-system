import React, { useState } from 'react';
import { Calendar, Activity, Trash2, AlertTriangle, Zap, Layers, Play, Settings, Monitor, Radio } from 'lucide-react';
import api from '../../services/api';
import { useScreens, useTemplates, useMedia, useTickers, useSchedules } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';

const BroadcastScheduler = ({ fetchData }) => {
  const { data: screens = [] } = useScreens();
  const [groups, setGroups] = useState([]);
  const { data: templates = [] } = useTemplates();
  const { data: media = [] } = useMedia();
  const { data: tickers = [] } = useTickers();
  const { data: schedules = [], refetch } = useSchedules();

  const [activeTab, setActiveTab] = useState('editor');

  const [newSchedule, setNewSchedule] = useState({ 
    targetType: 'all', 
    targetIds: [], 
    templateId: '', 
    mediaId: '', 
    startTime: '', 
    endTime: '', 
    priority: 1, 
    duration: 10 
  });
  const [mediaMapping, setMediaMapping] = useState({});

  const approvedMedia = media.filter(m => m.status === 'approved');

  const fetchGroups = async () => {
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data);
    } catch (err) { console.error('Failed to load groups'); }
  };

  React.useEffect(() => { fetchGroups(); }, []);

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
      toast.success('Transmission Deployed');
      setNewSchedule({ targetType: 'all', targetIds: [], templateId: '', mediaId: '', startTime: '', endTime: '', priority: 1, duration: 10 });
      setMediaMapping({});
      refetch();
      if (fetchData) fetchData();
      setActiveTab('inventory');
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Terminate this transmission?')) return;
    try {
      await api.delete(`/api/schedule/${id}`);
      toast.success('Transmission Terminated');
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Termination failed'); }
  };

  const selectedTemplate = templates.find(t => t.id === newSchedule.templateId || t._id === newSchedule.templateId);
  const layout = selectedTemplate ? safeParseJSON(selectedTemplate.layout) : [];

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          
          {/* HEADER */}
          <div className="bg-black/10 p-8 border-b border-white/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Radio className="text-rose-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-rose-500">Transmission Engine</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Broadcast Control</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Scheduling Studio
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Active Manifest ({schedules.length})
                    </button>
                </div>
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' ? (
                <form onSubmit={createSchedule} className="h-full flex flex-col lg:flex-row divide-x divide-slate-200/50">
                    
                    {/* LEFT PANE: Targeting & Timing */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-emerald-600/30" /> Targeting Logic
                            </h4>
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Target Cluster</label>
                                        <select className="nexus-input bg-slate-50" value={newSchedule.targetType} onChange={(e) => setNewSchedule(p => ({ ...p, targetType: e.target.value, targetIds: [] }))}>
                                            <option value="all">Global Broadcast</option>
                                            <option value="group">Screen Group</option>
                                            <option value="screen">Specific Screen</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Priority Override</label>
                                        <input type="number" min="1" required className="nexus-input bg-slate-50" value={newSchedule.priority} onChange={(e) => setNewSchedule(p => ({ ...p, priority: Number(e.target.value) }))}/>
                                    </div>
                                </div>

                                {newSchedule.targetType !== 'all' && (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Identity Selection</label>
                                        <select 
                                            multiple 
                                            className="nexus-input h-32 custom-scrollbar text-xs font-bold bg-slate-50" 
                                            value={newSchedule.targetIds} 
                                            onChange={(e) => {
                                                const options = Array.from(e.target.options);
                                                setNewSchedule(p => ({ ...p, targetIds: options.filter(o => o.selected).map(o => o.value) }));
                                            }}
                                        >
                                            {newSchedule.targetType === 'screen' ? (
                                                screens.map(s => <option key={s._id} value={s._id}>{s.name} • {s.location}</option>)
                                            ) : (
                                                groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)
                                            )}
                                        </select>
                                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Hold CMD/CTRL to select multiple</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-black uppercase text-amber-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-amber-600/30" /> Temporal Rules
                            </h4>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">From Date & Time</label>
                                        <input type="datetime-local" required className="nexus-input bg-slate-50" value={newSchedule.startTime} onChange={(e) => setNewSchedule(p => ({ ...p, startTime: e.target.value }))}/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">To Date & Time</label>
                                        <input type="datetime-local" required className="nexus-input bg-slate-50" value={newSchedule.endTime} onChange={(e) => setNewSchedule(p => ({ ...p, endTime: e.target.value }))}/>
                                    </div>
                                </div>
                                <div className="space-y-2 max-w-[50%] pr-4">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Display Duration (sec)</label>
                                    <input type="number" min="1" required className="nexus-input bg-slate-50" value={newSchedule.duration} onChange={(e) => setNewSchedule(p => ({ ...p, duration: Number(e.target.value) }))}/>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT PANE: Content & Payload */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-sky-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-sky-600/30" /> Content Payload
                            </h4>
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Architect Layout</label>
                                    <select className="nexus-input bg-white text-base font-bold" value={newSchedule.templateId} onChange={(e) => {
                                        setNewSchedule(p => ({ ...p, templateId: e.target.value, mediaId: '' }));
                                        setMediaMapping({});
                                    }}>
                                        <option value="">Standard Fullscreen Asset</option>
                                        {templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
                                    </select>
                                </div>

                                {!newSchedule.templateId ? (
                                    <div className="space-y-2 animate-fade-in">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Primary Media Asset</label>
                                        <select required className="nexus-input bg-white" value={newSchedule.mediaId} onChange={(e) => setNewSchedule(p => ({ ...p, mediaId: e.target.value }))}>
                                            <option value="">Select Asset...</option>
                                            {approvedMedia.map(m => <option key={m.id || m._id} value={m.id || m._id}>{m.fileName}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-fade-in">
                                        {/* Spatial Preview */}
                                        <div className="aspect-video bg-slate-950 rounded-3xl overflow-hidden relative border border-slate-900 shadow-2xl">
                                            <div className="absolute inset-0 grid opacity-10" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
                                                {[...Array(144)].map((_, i) => <div key={i} className="border-[0.5px] border-slate-700" />)}
                                            </div>
                                            {layout.map(z => {
                                                const isMapped = mediaMapping[z.i];
                                                return (
                                                    <div 
                                                        key={z.i} 
                                                        className={`absolute border flex items-center justify-center transition-all ${isMapped ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-slate-900/50 border-slate-700'}`}
                                                        style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                                                    >
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isMapped ? 'text-sky-300' : 'text-slate-600'}`}>{z.i}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Zone Mapping */}
                                        <div className="space-y-4 p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Layers size={14}/> Zone Mapping Protocol</p>
                                            {layout.map((z) => (
                                                <div key={z.i} className="space-y-1">
                                                    <label className="text-[9px] font-bold uppercase ml-1 opacity-50">Zone {z.i} {z.type === 'ticker' ? '(TICKER)' : ''}</label>
                                                    <select required className="nexus-input py-3 text-xs bg-slate-50" value={mediaMapping[z.i] || ''} onChange={(e) => setMediaMapping(p => ({ ...p, [z.i]: e.target.value }))}>
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
                                                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                                                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                                                    <p className="text-[9px] font-black text-amber-600 leading-tight uppercase tracking-widest">Performance Risk: High-density video decoding detected. May impact playback fluidity on lower-end nodes.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-10">
                                    <button type="submit" className="nexus-btn-primary w-full py-6 text-[10px] tracking-[6px] shadow-2xl uppercase">
                                        DEPLOY TRANSMISSION
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </form>
            ) : (
                /* INVENTORY VIEW */
                <div className="h-full overflow-y-auto custom-scrollbar p-10">
                    <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                    <th className="py-6 px-8">Payload</th>
                                    <th className="py-6 px-8">Target</th>
                                    <th className="py-6 px-8">Temporal Window</th>
                                    <th className="py-6 px-8 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {schedules.map(s => {
                                    const m = approvedMedia.find(am => (am.id === s.mediaId || am._id === s.mediaId));
                                    const t = templates.find(tm => (tm.id === s.templateId || tm._id === s.templateId));
                                    return (
                                        <tr key={s.id || s._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-6 px-8">
                                                <p className="font-black text-text uppercase text-sm tracking-tight">{t ? t.name : (m?.fileName || 'Asset Unknown')}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${t ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                                                        {t ? 'Layout Protocol' : (m?.fileType || 'Media Asset')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {s.isGlobal ? (
                                                        <span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-slate-100 text-slate-500 border-slate-200">Global System</span>
                                                    ) : s.screenId ? (
                                                        <span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-100">
                                                            {screens.find(sc => sc._id === s.screenId)?.name || 'Unknown Screen'}
                                                        </span>
                                                    ) : s.groupId ? (
                                                        <span className="px-3 py-1 rounded text-[8px] font-black uppercase border bg-amber-50 text-amber-600 border-amber-100">
                                                            {groups.find(gr => gr._id === s.groupId)?.name || 'Unknown Group'}
                                                        </span>
                                                    ) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                                    <div>
                                                        <p className="text-[11px] font-black tabular-nums text-slate-700">
                                                            {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                                            <span className="mx-2 opacity-30">→</span>
                                                            {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(s.startTime).toLocaleDateString()} - {new Date(s.endTime).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <button onClick={() => deleteSchedule(s.id || s._id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {schedules.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-32 text-center border-dashed border-2 border-slate-100 rounded-[32px] bg-slate-50/50">
                                            <Radio className="text-slate-300 mx-auto mb-4" size={40} />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">No Active Transmissions</p>
                                        </td>
                                    </tr>
                                )}
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
