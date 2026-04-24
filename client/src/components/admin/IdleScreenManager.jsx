import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Plus, Trash2, Layers, Type, Video, Image as ImageIcon, Palette, Save, AlertTriangle, MonitorPlay, Upload, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';
import Card from './Card';

const IdleScreenManager = () => {
  const { data: screens = [] } = useScreens();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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
      const [configsRes, mediaRes] = await Promise.all([
        api.get('/api/idle'),
        api.get('/api/media')
      ]);
      setConfigs(configsRes.data);
      setMedia(mediaRes.data.filter(m => m.status === 'approved'));
    } catch (err) { toast.error('Failed to load configs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);
    
    setUploading(true);
    try {
        const res = await api.post('/api/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Asset Uploaded & Approved');
        await fetchConfigs(); // Refresh media list
        
        // Auto-select the new asset
        if (res.data.fileType === 'video') {
            setDraft(prev => ({ ...prev, contentType: 'video', content: { ...prev.content, url: res.data.filePath } }));
        } else {
            setDraft(prev => ({ ...prev, contentType: 'image', content: { ...prev.content, url: res.data.filePath } }));
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveConfig = async () => {
    if (!draft.name) return toast.error('Name is required');
    try {
      if (draft._id) {
        await api.put(`/api/idle/${draft._id}`, draft);
        toast.success('Config Updated');
      } else {
        await api.post('/api/idle', draft);
        toast.success('Config Created');
      }
      setDraft({
        name: '', targetType: 'all', targetIds: [], contentType: 'image',
        content: { url: '', text: '', bgColor: '#000000' },
        style: { fontSize: 4, color: '#ffffff', align: 'center', fontWeight: '900', background: 'transparent' },
        priority: 10, isActive: true
      });
      fetchConfigs();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
  };

  const deleteConfig = async (id) => {
    if (!window.confirm('Delete this idle configuration?')) return;
    try {
      await api.delete(`/api/idle/${id}`);
      toast.success('Config Deleted');
      fetchConfigs();
    } catch (err) { toast.error('Delete failed'); }
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form */}
        <Card title="Configure Idle Content" icon={Plus} subtitle="Define Fallback Behavior">
          <div className="space-y-6 mt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Configuration Name</label>
              <input type="text" className="nexus-input" placeholder="e.g. Welcome Screen" value={draft.name} onChange={(e) => setDraft({...draft, name: e.target.value})}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Content Type</label>
                <select className="nexus-input" value={draft.contentType} onChange={(e) => setDraft({...draft, contentType: e.target.value})}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="text">Big Text</option>
                  <option value="color">Solid Color</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Target Scope</label>
                <select className="nexus-input" value={draft.targetType} onChange={(e) => setDraft({...draft, targetType: e.target.value, targetIds: [], priority: e.target.value === 'screen' ? 100 : e.target.value === 'group' ? 50 : 10})}>
                  <option value="all">Global</option>
                  <option value="group">Group</option>
                  <option value="screen">Specific Screen</option>
                </select>
              </div>
            </div>

            {draft.targetType !== 'all' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Select {draft.targetType}s</label>
                {draft.targetType === 'screen' ? (
                    <select multiple className="nexus-input h-32" value={draft.targetIds} onChange={(e) => {
                        const options = Array.from(e.target.options);
                        setDraft({...draft, targetIds: options.filter(o => o.selected).map(o => o.value) });
                    }}>
                        {screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                ) : (
                    <input type="text" className="nexus-input" placeholder="Group IDs (comma separated)" value={draft.targetIds.join(', ')} onChange={(e) => setDraft({...draft, targetIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                )}
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Hold CMD/CTRL to select multiple</p>
              </div>
            )}

            {/* Content Source */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                {draft.contentType === 'text' ? (
                    <textarea 
                        className="nexus-input min-h-[100px] resize-none font-black uppercase" 
                        placeholder="Enter massive center text..."
                        value={draft.content.text}
                        onChange={(e) => setDraft({...draft, content: {...draft.content, text: e.target.value}})}
                    />
                ) : draft.contentType === 'color' ? (
                    <input type="color" className="w-full h-12 rounded-xl cursor-pointer border border-slate-200" value={draft.content.bgColor} onChange={(e) => setDraft({...draft, content: {...draft.content, bgColor: e.target.value}})} />
                ) : (
                    <div className="space-y-4">
                        <select className="nexus-input" value={draft.content.url} onChange={(e) => setDraft({...draft, content: {...draft.content, url: e.target.value}})}>
                            <option value="">Select Existing Asset...</option>
                            {media.filter(m => draft.contentType === 'video' ? m.fileType === 'video' : m.fileType === 'image').map(m => (
                                <option key={m._id} value={m.filePath}>{m.fileName}</option>
                            ))}
                        </select>
                        
                        <div className="relative">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept={draft.contentType === 'video' ? 'video/*' : 'image/*'} 
                                onChange={handleFileUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full py-3 bg-white border border-dashed border-slate-300 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:border-sky-500 hover:text-sky-500 transition-all flex items-center justify-center gap-2"
                            >
                                {uploading ? <RefreshCw className="animate-spin" size={14}/> : <Upload size={14}/>}
                                {uploading ? 'Processing...' : `Upload New ${draft.contentType}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {draft.contentType === 'text' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Size (vw)</label>
                        <input type="number" className="nexus-input" value={draft.style.fontSize} onChange={(e) => setDraft({...draft, style: {...draft.style, fontSize: parseInt(e.target.value)}})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Text Color</label>
                        <input type="color" className="w-full h-12 rounded-xl" value={draft.style.color} onChange={(e) => setDraft({...draft, style: {...draft.style, color: e.target.value}})}/>
                    </div>
                </div>
            )}

            <button onClick={saveConfig} className="nexus-btn-primary w-full py-4 tracking-[4px]">
               {draft._id ? 'UPDATE CONFIG' : 'ACTIVATE IDLE SCREEN'}
            </button>
          </div>
        </Card>

        {/* List View */}
        <Card className="lg:col-span-2" title="Active Idle Layers" icon={Layers} subtitle="Priority Resolved Fallbacks">
           <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                       <th className="py-4 px-6">Definition</th>
                       <th className="py-4 px-6">Target</th>
                       <th className="py-4 px-6">Type</th>
                       <th className="py-4 px-6 text-right">Ops</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {configs.map(c => (
                        <tr key={c._id} className="hover:bg-slate-50 transition-colors group">
                           <td className="py-6 px-6">
                              <p className="font-black text-text uppercase tracking-tighter">{c.name}</p>
                              <p className="text-[9px] font-bold text-sky-500 uppercase mt-1 tracking-widest">Priority {c.priority}</p>
                           </td>
                           <td className="py-6 px-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${c.targetType === 'screen' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : c.targetType === 'group' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                 {c.targetType === 'screen' ? `${c.targetIds?.length || 0} Screens` : c.targetType === 'group' ? `${c.targetIds?.length || 0} Groups` : 'Global'}
                              </span>
                           </td>
                           <td className="py-6 px-6">
                              <div className="flex items-center gap-2">
                                 {c.contentType === 'image' && <ImageIcon size={14} className="text-blue-500"/>}
                                 {c.contentType === 'video' && <Video size={14} className="text-rose-500"/>}
                                 {c.contentType === 'text' && <Type size={14} className="text-emerald-500"/>}
                                 {c.contentType === 'color' && <Palette size={14} className="text-purple-500"/>}
                                 <span className="text-[10px] font-black uppercase text-text-dim">{c.contentType}</span>
                              </div>
                           </td>
                           <td className="py-6 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                 <button onClick={() => setDraft(c)} className="p-2 bg-slate-100 rounded-xl hover:bg-sky-500 hover:text-white transition-all"><MonitorPlay size={14}/></button>
                                 <button onClick={() => deleteConfig(c._id)} className="p-2 bg-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                              </div>
                           </td>
                        </tr>
                    ))}
                    {configs.length === 0 && (
                        <tr><td colSpan="4" className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-[4px]">No override layers defined</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </Card>

      </div>
    </div>
  );
};

export default IdleScreenManager;
