import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Type, Video, Image as ImageIcon, Palette, MonitorPlay, Upload, RefreshCw, Zap, Plus, Layers, ShieldCheck, Globe, Smartphone, Monitor } from 'lucide-react';
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
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  
  const [draft, setDraft] = useState({
    name: '', targetType: 'all', targetIds: [], contentType: 'image',
    content: { url: '', text: '', bgColor: '#000000' },
    style: { fontSize: 4, color: '#ffffff', align: 'center', fontWeight: '900', background: 'transparent' },
    priority: 10, isActive: true
  });

  const fetchConfigs = async () => {
    try {
      const [configsRes, mediaRes, groupsRes] = await Promise.all([api.get('/api/idle'), api.get('/api/media'), api.get('/api/groups')]);
      setConfigs(Array.isArray(configsRes.data) ? configsRes.data : []);
      setMedia(Array.isArray(mediaRes.data) ? mediaRes.data : []);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
    } catch (err) { console.error('Sync failure:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
        const res = await api.post('/api/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Asset Indexing Complete');
        await fetchConfigs(); 
        const type = file.type.includes('video') ? 'video' : 'image';
        setDraft(prev => ({ ...prev, contentType: type, content: { ...prev.content, url: res.data.filePath } }));
    } catch (err) { toast.error('Ingestion failure'); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/idle', draft);
      toast.success('Idle Protocol Deployed');
      fetchConfigs(); setActiveTab('inventory');
      setDraft({ name: '', targetType: 'all', targetIds: [], contentType: 'image', content: { url: '', text: '', bgColor: '#000000' }, style: { fontSize: 4, color: '#ffffff', align: 'center', fontWeight: '900', background: 'transparent' }, priority: 10, isActive: true });
    } catch (err) { toast.error('Deployment failed'); }
  };

  const deleteConfig = async (id) => {
    if (!window.confirm('Purge protocol?')) return;
    try { await api.delete(`/api/idle/${id}`); toast.success('Protocol Purged'); fetchConfigs(); } catch (err) { toast.error('Purge failure'); }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
          
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2"><MonitorPlay className="text-indigo-600" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Fallback Engine</span></div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Idle Workspace</h2>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Design Studio</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Inventory ({configs.length})</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Global Fallback</p><h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">{configs.filter(c => c.targetType === 'all').length} <span className="text-xs text-slate-400 ml-1">SYSTEM-WIDE</span></h4></div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><Zap className="text-indigo-600" size={24} /></div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div><p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1">Targeted Protocols</p><h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">{configs.filter(c => c.targetType !== 'all').length} <span className="text-xs text-slate-400 ml-1">ACTIVE</span></h4></div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><Layers className="text-sky-600" size={24} /></div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div><p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Asset Library</p><h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">{media.length} <span className="text-xs text-slate-400 ml-1">INDEXED</span></h4></div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><ImageIcon className="text-rose-600" size={24} /></div>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-white">
            {activeTab === 'editor' ? (
                <form onSubmit={handleSave} className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-white">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Targeting Logic</h4>
                            <div className="space-y-6">
                                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Protocol Identifier</label><input type="text" required className="nexus-input bg-slate-50 border-slate-200" placeholder="e.g. LOBBY-DEFAULT-IDLE" value={draft.name} onChange={(e) => setDraft({...draft, name: e.target.value})}/></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Cluster Logic</label><select className="nexus-input bg-slate-50 border-slate-200" value={draft.targetType} onChange={(e) => setDraft({...draft, targetType: e.target.value, targetIds: [], priority: e.target.value === 'screen' ? 100 : e.target.value === 'group' ? 50 : 10})}><option value="all">Global System</option><option value="group">Cluster Group</option><option value="screen">Specific Node</option></select></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Priority</label><input type="number" className="nexus-input bg-slate-50 border-slate-200" value={draft.priority} onChange={(e) => setDraft({...draft, priority: Number(e.target.value)})}/></div>
                                </div>
                                {draft.targetType !== 'all' && (
                                    <div className="space-y-2 animate-fade-in"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Identity Selection</label><select multiple className="nexus-input h-32 custom-scrollbar text-xs font-bold bg-slate-50 border-slate-200" value={draft.targetIds} onChange={(e) => { const opts = Array.from(e.target.options); setDraft({...draft, targetIds: opts.filter(o => o.selected).map(o => o.value)}); }}>{draft.targetType === 'screen' ? screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>) : groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}</select></div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-sky-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-sky-600/30" /> Payload Definition</h4>
                            <div className="space-y-6">
                                <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    {['image', 'video', 'text', 'color'].map(t => (
                                        <button type="button" key={t} onClick={() => setDraft({...draft, contentType: t})} className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${draft.contentType === t ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                                    ))}
                                </div>
                                {(draft.contentType === 'image' || draft.contentType === 'video') && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="flex items-end gap-4">
                                            <div className="flex-1 space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Asset Trace</label><select className="nexus-input bg-white border-slate-200" value={draft.content.url} onChange={(e) => setDraft({...draft, content: {...draft.content, url: e.target.value}})}><option value="">Select Asset...</option>{media.filter(m => { if (!m || !m.mimeType) return false; return draft.contentType === 'image' ? m.mimeType.includes('image') : m.mimeType.includes('video'); }).map(m => (<option key={m._id} value={m.path}>{m.originalName}</option>))}</select></div>
                                            <div className="shrink-0"><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept={draft.contentType === 'image' ? "image/*" : "video/*"} /><button type="button" onClick={() => fileInputRef.current.click()} disabled={uploading} className="p-4 bg-white border border-slate-200 rounded-2xl text-sky-600 hover:bg-sky-50 transition-all shadow-sm">{uploading ? <RefreshCw className="animate-spin" size={20}/> : <Upload size={20}/>}</button></div>
                                        </div>
                                    </div>
                                )}
                                {draft.contentType === 'text' && (
                                    <div className="space-y-4 animate-fade-in"><textarea className="nexus-input min-h-[120px] resize-none text-lg font-black bg-white border-slate-200" placeholder="Static Fallback Message..." value={draft.content.text} onChange={(e) => setDraft({...draft, content: {...draft.content, text: e.target.value}})} /><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Scale (VW)</label><input type="number" className="nexus-input py-2 border-slate-200 bg-white" value={draft.style.fontSize} onChange={(e) => setDraft({...draft, style: {...draft.style, fontSize: e.target.value}})}/></div><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Hue</label><input type="color" className="w-full h-10 rounded-xl cursor-pointer bg-white p-1 border border-slate-200" value={draft.style.color} onChange={(e) => setDraft({...draft, style: {...draft.style, color: e.target.value}})}/></div></div></div>
                                )}
                                {draft.contentType === 'color' && (
                                    <div className="space-y-2 animate-fade-in"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Ambient Hue</label><input type="color" className="w-full h-16 rounded-[24px] cursor-pointer bg-white p-2 border border-slate-200 shadow-sm" value={draft.content.bgColor} onChange={(e) => setDraft({...draft, content: {...draft.content, bgColor: e.target.value}})}/></div>
                                )}
                                <button type="submit" className="nexus-btn-primary w-full py-6 text-[10px] tracking-[6px] uppercase shadow-2xl shadow-indigo-200 mt-4">DEPLOY FALLBACK PROTOCOL</button>
                            </div>
                        </section>
                    </div>
                </form>
            ) : (
                <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {configs.map(c => (
                            <div key={c._id} className={`p-8 bg-white border border-slate-200 rounded-[48px] transition-all hover:border-indigo-400 hover:shadow-2xl group flex flex-col ${!c.isActive && 'grayscale opacity-60'}`}>
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center border-2 transition-all ${c.isActive ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{c.contentType === 'image' ? <ImageIcon size={24}/> : c.contentType === 'video' ? <Video size={24}/> : c.contentType === 'text' ? <Type size={24}/> : <Palette size={24}/>}</div>
                                    <button onClick={() => deleteConfig(c._id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                                </div>
                                <div className="flex-1 space-y-2 mb-8">
                                    <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${c.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{c.contentType} Protocol</p></div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate leading-none" title={c.name}>{c.name}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-8 border-t border-slate-100 pt-8">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p><p className="text-[10px] font-black text-indigo-600 uppercase truncate">{c.targetType}</p></div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p><p className="text-[10px] font-black text-emerald-600 uppercase">{c.priority}</p></div>
                                </div>
                                <div className="p-5 bg-slate-100 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2"><Layers className="text-slate-400" size={14}/><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{c.targetIds?.length || 0} Nodes Linked</span></div><span className="text-[8px] font-bold text-slate-300 uppercase">{new Date(c.createdAt).toLocaleDateString()}</span></div>
                            </div>
                        ))}
                        {configs.length === 0 && <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-200 rounded-[60px] bg-white"><p className="text-[10px] font-black text-slate-300 uppercase tracking-[16px]">No Protocols Active</p></div>}
                    </div>
                </div>
            )}
          </div>
       </div>
  );
};

export default IdleScreenManager;
