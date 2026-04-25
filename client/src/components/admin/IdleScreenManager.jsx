import React, { useState, useEffect } from 'react';
import { Trash2, Type, Video, Image as ImageIcon, Palette, MonitorPlay } from 'lucide-react';
import api from '../../services/api';
import { useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';

const IdleScreenManager = () => {
  const { data: screens = [] } = useScreens();
  const [groups, setGroups] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');
  
  const [draft, setDraft] = useState({
    name: '',
    targetType: 'all',
    targetIds: [],
    contentType: 'image',
    content: { url: '', text: '', bgColor: '#000000' },
    style: { fontSize: 4, color: '#ffffff', align: 'center', fontWeight: '900', background: 'transparent' },
    priority: 10,
    isActive: true
  });

  const fetchConfigs = async () => {
    try {
      const [configsRes, mediaRes, groupsRes] = await Promise.all([
        api.get('/api/idle'),
        api.get('/api/media'),
        api.get('/api/groups')
      ]);
      setConfigs(Array.isArray(configsRes.data) ? configsRes.data : []);
      setMedia(Array.isArray(mediaRes.data) ? mediaRes.data : []);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
    } catch (err) { 
      console.error('Data synchronization failed:', err);
      toast.error('Data synchronization failed'); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/idle', draft);
      toast.success('Idle Protocol Deployed');
      fetchConfigs();
      setActiveTab('inventory');
      setDraft({
        name: '', targetType: 'all', targetIds: [], contentType: 'image',
        content: { url: '', text: '', bgColor: '#000000' },
        style: { fontSize: 4, color: '#ffffff', align: 'center', fontWeight: '900', background: 'transparent' },
        priority: 10, isActive: true
      });
    } catch (err) { toast.error('Deployment failed'); }
  };

  const deleteConfig = async (id) => {
    if (!window.confirm('Purge this idle configuration?')) return;
    try {
      await api.delete(`/api/idle/${id}`);
      toast.success('Protocol Purged');
      fetchConfigs();
    } catch (err) { toast.error('Purge failed'); }
  };

  if (loading) return <div className="p-10 animate-pulse text-[10px] font-black uppercase tracking-[4px]">Synchronizing...</div>;

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          
          {/* HEADER */}
          <div className="bg-black/10 p-8 border-b border-white/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <MonitorPlay className="text-emerald-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-emerald-500">Fallback Engine</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Idle Workspace</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Studio
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Active Idle ({configs.length})
                    </button>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' ? (
                <form onSubmit={handleSave} className="h-full flex flex-col lg:flex-row divide-x divide-slate-200/50">
                    
                    {/* LEFT: Target & Logic */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-emerald-600/30" /> Targeting Logic
                            </h4>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Identity</label>
                                    <input type="text" required className="nexus-input bg-slate-50" placeholder="e.g. LOBBY-FALLBACK-PROTO" value={draft.name} onChange={(e) => setDraft({...draft, name: e.target.value})}/>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Screen</label>
                                        <select className="nexus-input bg-slate-50" value={draft.targetType} onChange={(e) => setDraft({...draft, targetType: e.target.value, targetIds: [], priority: e.target.value === 'screen' ? 100 : e.target.value === 'group' ? 50 : 10})}>
                                            <option value="all">Broadcast All</option>
                                            <option value="group">Screen Group</option>
                                            <option value="screen">Specific Screen</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Priority</label>
                                        <input type="number" className="nexus-input bg-slate-50" value={draft.priority} onChange={(e) => setDraft({...draft, priority: Number(e.target.value)})}/>
                                    </div>
                                </div>

                                {draft.targetType !== 'all' && (
                                    <div className="space-y-2 animate-fade-in">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Identity Selection</label>
                                        <select multiple className="nexus-input h-32 custom-scrollbar text-xs font-bold" value={draft.targetIds} onChange={(e) => {
                                            const opts = Array.from(e.target.options);
                                            setDraft({...draft, targetIds: opts.filter(o => o.selected).map(o => o.value)});
                                        }}>
                                            {draft.targetType === 'screen' ? 
                                                screens.map(s => <option key={s._id} value={s._id}>{s.name} ({s.screenId})</option>) :
                                                groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)
                                            }
                                        </select>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT: Content Definition */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-sky-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-sky-600/30" /> Content Definition
                            </h4>
                            <div className="space-y-6">
                                <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-200">
                                    {['image', 'video', 'text', 'color'].map(t => (
                                        <button type="button" key={t} onClick={() => setDraft({...draft, contentType: t})} 
                                            className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${draft.contentType === t ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-text'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                {(draft.contentType === 'image' || draft.contentType === 'video') && (
                                    <div className="space-y-2 animate-fade-in">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Asset Payload</label>
                                        <select className="nexus-input bg-white" value={draft.content.url} onChange={(e) => setDraft({...draft, content: {...draft.content, url: e.target.value}})}>
                                            <option value="">Select Asset...</option>
                                            {media.filter(m => {
                                                if (!m.mimeType) return false;
                                                return draft.contentType === 'image' ? m.mimeType.includes('image') : m.mimeType.includes('video');
                                            }).map(m => (
                                                <option key={m._id} value={m.path}>{m.fileName || m.originalName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {draft.contentType === 'text' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <textarea className="nexus-input min-h-[100px] resize-none text-base font-black bg-white" placeholder="Enter fallback message..." value={draft.content.text} onChange={(e) => setDraft({...draft, content: {...draft.content, text: e.target.value}})} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase">Size (VW)</label>
                                                <input type="number" className="nexus-input py-2" value={draft.style.fontSize} onChange={(e) => setDraft({...draft, style: {...draft.style, fontSize: Number(e.target.value)}})}/>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase">Color</label>
                                                <input type="color" className="w-full h-10 rounded-xl cursor-pointer bg-white p-1 border border-slate-200" value={draft.style.color} onChange={(e) => setDraft({...draft, style: {...draft.style, color: e.target.value}})}/>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {draft.contentType === 'color' && (
                                    <div className="space-y-2 animate-fade-in">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Background Hue</label>
                                        <input type="color" className="w-full h-16 rounded-[24px] cursor-pointer bg-white p-2 border border-slate-200 shadow-sm" value={draft.content.bgColor} onChange={(e) => setDraft({...draft, content: {...draft.content, bgColor: e.target.value}})}/>
                                    </div>
                                )}

                                <button type="submit" className="nexus-btn-primary w-full py-6 text-[10px] tracking-[6px] uppercase shadow-2xl mt-8">
                                    DEPLOY PROTOCOL
                                </button>
                            </div>
                        </section>
                    </div>
                </form>
            ) : (
                /* INVENTORY */
                <div className="h-full overflow-y-auto custom-scrollbar p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {configs.map(c => (
                            <div key={c._id} className="p-8 bg-white border border-slate-200 rounded-[40px] transition-all hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/5 group relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 text-emerald-500">
                                        {c.contentType === 'image' ? <ImageIcon size={20}/> : 
                                         c.contentType === 'video' ? <Video size={20}/> : 
                                         c.contentType === 'color' ? <Palette size={20}/> :
                                         <Type size={20}/>}
                                    </div>
                                    <button onClick={() => deleteConfig(c._id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                                </div>
                                <h3 className="text-lg font-black text-text uppercase tracking-tight truncate">{c.name}</h3>
                                <div className="flex flex-wrap gap-2 mt-4 border-t border-slate-100 pt-6">
                                    <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[8px] font-black text-slate-500 uppercase tracking-widest">{c.targetType}</span>
                                    <span className="px-3 py-1 rounded-lg bg-sky-50 border border-sky-100 text-[8px] font-black text-sky-600 uppercase tracking-widest">Priority {c.priority}</span>
                                </div>
                            </div>
                        ))}
                        {configs.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50">
                                <MonitorPlay className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">No Fallback Protocols Defined</p>
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

export default IdleScreenManager;
