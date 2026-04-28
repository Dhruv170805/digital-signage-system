import React, { useState } from 'react';
import { 
  Music, Plus, Play, Trash2, ListMusic, Calendar, Radio, 
  Upload, CheckCircle, Clock, Volume2, ShieldAlert, X, Send,
  GripVertical, ChevronRight, Search, ShieldCheck, ArrowRight, Zap,
  Activity, Layers, Power, Edit2
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAudios, useAudioPlaylists, useAudioAssignments, useScreens, useGroups } from '../../hooks/useAdminData';
import useSocketStore from '../../store/useSocketStore';

const AudioBroadcastManager = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const { socket } = useSocketStore();
  const [systemVolume, setSystemVolume] = useState(80);

  const { data: audios = [], refetch: refetchAudios } = useAudios();
  const { data: playlists = [], refetch: refetchPlaylists } = useAudioPlaylists();
  const { data: assignments = [], refetch: refetchAssignments } = useAudioAssignments();
  const { data: screens = [] } = useScreens();
  const { data: groups = [] } = useGroups();

  const handleVolumeChange = (newVol) => {
    setSystemVolume(newVol);
    if (socket) {
      socket.emit('audio:volume', { targetType: 'all', volume: newVol });
    }
  };

  const handleAction = (action) => {
    if (socket) {
        socket.emit('audio:control', { targetType: 'all', action });
        toast.success(`Broadcasting ${action} command`);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);
    
    setUploading(true);
    try {
      await api.post('/api/audio/upload', formData);
      toast.success('Audio uploaded successfully');
      refetchAudios();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteAudio = async (id) => {
    if (!window.confirm('Delete Audio?')) return;
    try {
      await api.delete(`/api/audio/${id}`);
      toast.success('Deleted');
      refetchAudios();
    } catch {
      toast.error('Delete failed');
    }
  };

  const renderLibrary = () => (
    <div className="space-y-10 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100"><Music size={28} /></div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Sound Library</h3>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[4px] mt-2 flex items-center gap-2"><div className="w-4 h-px bg-slate-200" /> Manage audio assets</div>
                </div>
            </div>
            <label className="nexus-btn-primary flex items-center gap-4 cursor-pointer py-6 px-10 group shadow-xl hover:shadow-indigo-500/20 transition-all">
                <Upload size={20} className="group-hover:translate-y-[-2px] transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-[4px]">Upload Stream</span>
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} disabled={uploading} />
            </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {audios.map(audio => (
                <div key={audio._id} className="p-8 bg-white border border-slate-200 rounded-[48px] shadow-sm hover:border-indigo-400 hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => deleteAudio(audio._id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner group-hover:scale-110 transition-all">
                            <Zap size={32} fill="currentColor" className="opacity-20" />
                            <Music size={32} className="absolute" />
                        </div>
                        <div className="space-y-2 w-full">
                            <h4 className="font-black text-slate-900 uppercase tracking-tighter truncate text-sm px-2">{audio.originalName}</h4>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{Math.floor(audio.duration)} SEC</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{audio.mimeType.split('/')[1]}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 tabular-nums uppercase">{new Date(audio.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderPlaylists = () => (
    <div className="space-y-10 animate-fade-in">
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100"><ListMusic size={28} /></div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Logic Sequences</h3>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[4px] mt-2 flex items-center gap-2"><div className="w-4 h-px bg-slate-200" /> Programmed Audio Logic</div>
                </div>
            </div>
            <button onClick={() => setShowPlaylistModal(true)} className="nexus-btn-primary flex items-center gap-4 py-6 px-10 shadow-xl hover:shadow-indigo-500/20 transition-all">
                <Plus size={20} />
                <span className="text-[11px] font-black uppercase tracking-[4px]">Architect Sequence</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {playlists.map(playlist => (
                <div key={playlist._id} className="p-10 bg-white border border-slate-200 rounded-[50px] shadow-sm hover:shadow-2xl transition-all group border-l-[12px] border-l-amber-500">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors"><Layers size={28} /></div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{playlist.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                     <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">{playlist.audios?.length || 0} TRACKS</span>
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300" /> {playlist.loopType} MODE</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <button onClick={async () => {
                                 await api.delete(`/api/audio-playlists/${playlist._id}`);
                                 refetchPlaylists();
                             }} className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={20}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {playlist.audios?.slice(0, 4).map((track, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all group/item">
                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover/item:text-amber-600 group-hover/item:border-amber-200 transition-all">{idx+1}</div>
                                <p className="text-[11px] font-black text-slate-600 truncate uppercase flex-1 tracking-tight">{track.originalName}</p>
                                <Music size={14} className="text-slate-200 group-hover/item:text-amber-400 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-10 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100"><Calendar size={28} /></div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Broadcast Matrix</h3>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[4px] mt-2 flex items-center gap-2"><div className="w-4 h-px bg-slate-200" /> Active transmission schedule</div>
                </div>
            </div>
            <button onClick={() => setShowAssignModal(true)} className="nexus-btn-primary flex items-center gap-4 py-6 px-10 shadow-xl hover:shadow-indigo-500/20 transition-all">
                <Radio size={20} />
                <span className="text-[11px] font-black uppercase tracking-[4px]">Deploy Signal</span>
            </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-[50px] overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-[4px]">
                        <th className="py-8 px-12">Signal Identity</th>
                        <th className="py-8 px-12">Target</th>
                        <th className="py-8 px-12">Sync Window</th>
                        <th className="py-8 px-12">Priority</th>
                        <th className="py-8 px-12 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {assignments.map(a => (
                        <tr key={a._id} className="hover:bg-slate-50/50 transition-all group">
                            <td className="py-10 px-12">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><Activity size={22}/></div>
                                    <div>
                                        <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none">{a.name}</p>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[2px] mt-2 flex items-center gap-2"><Layers size={12}/> {a.playlistId?.name}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-10 px-12">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">{a.targetType}</span>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] truncate max-w-[200px]">
                                        {a.targetType === 'all' ? 'Universal Broadcast' : 
                                         (a.targetType === 'screen' ? screens.find(s=>s._id===a.targetId)?.name : groups.find(g=>g._id===a.targetId)?.name) || 'Unknown Target'}
                                    </p>
                                </div>
                            </td>
                            <td className="py-10 px-12">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Clock size={12} />
                                        <p className="text-[11px] font-black uppercase tabular-nums tracking-tighter">{a.startTime} — {a.endTime}</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.startDate).toLocaleDateString()}</p>
                                </div>
                            </td>
                            <td className="py-10 px-12">
                                <span className={`px-5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-[3px] shadow-sm ${
                                    a.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    a.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                    {a.priority}
                                </span>
                            </td>
                            <td className="py-10 px-12 text-right">
                                <button onClick={async () => {
                                    await api.delete(`/api/audio-assignments/${a._id}`);
                                    refetchAssignments();
                                }} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all"><Trash2 size={20}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className="animate-fade-in h-full flex flex-col">
        <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Radio className="text-indigo-600" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Broadcast Center</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Audio Management</h2>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    {[
                        { id: 'inventory', label: `Library (${audios.length})` },
                        { id: 'playlists', label: `Playlists (${playlists.length})` },
                        { id: 'schedule', label: `Schedule (${assignments.length})` }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative group p-1 bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500">
                <div className="relative bg-black rounded-[28px] h-24 overflow-hidden flex items-center justify-between px-10 shadow-inner border border-white/5 transition-all duration-500">
                    <div className="absolute top-2 left-6 z-20">
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[3px]">Active Transmission Monitor</span>
                    </div>
                    
                    <div className="flex items-center gap-6 z-10">
                        <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <button onClick={() => handleAction('play')} className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/40 transition-all border border-emerald-500/20"><Play size={16} fill="currentColor" /></button>
                            <button onClick={() => handleAction('pause')} className="p-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/40 transition-all border border-rose-500/20"><X size={16} strokeWidth={4} /></button>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="space-y-1">
                             <div className="flex items-center gap-2 text-indigo-400">
                                 <Activity size={12} className="animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Signal Online</span>
                             </div>
                             <p className="text-[8px] font-bold text-white/40 uppercase tracking-[4px]">Uplink Synchronization Active</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 z-10">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-[4px] mb-2">Network intensity</p>
                            <div className="flex items-center gap-4 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10">
                                <Volume2 size={16} className="text-indigo-400" />
                                <input 
                                    type="range" 
                                    className="w-32 accent-indigo-500 cursor-pointer h-1 opacity-60 hover:opacity-100 transition-opacity" 
                                    value={systemVolume} 
                                    onChange={(e) => handleVolumeChange(Number(e.target.value))} 
                                />
                                <span className="text-[10px] font-black text-white tabular-nums w-8 text-right">{systemVolume}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none z-0" />
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
            {activeTab === 'inventory' && renderLibrary()}
            {activeTab === 'playlists' && renderPlaylists()}
            {activeTab === 'schedule' && renderSchedule()}
        </div>

        {showPlaylistModal && <PlaylistModal onClose={() => setShowPlaylistModal(false)} audios={audios} onSave={() => { setShowPlaylistModal(false); refetchPlaylists(); }} />}
        {showAssignModal && <AssignmentModal onClose={() => setShowAssignModal(false)} playlists={playlists} screens={screens} groups={groups} onSave={() => { setShowAssignModal(false); refetchAssignments(); }} />}
    </div>
  );
};

// --- Modals (Consolidated Studio Theme) ---
const PlaylistModal = ({ onClose, audios, onSave }) => {
    const [name, setName] = useState('');
    const [selectedAudios, setSelectedAudios] = useState([]);
    const [loopType, setLoopType] = useState('sequential');

    const toggleAudio = (id) => {
        setSelectedAudios(prev => prev.includes(id) ? prev.filter(a=>a!==id) : [...prev, id]);
    };

    const handleSave = async () => {
        if (!name || selectedAudios.length === 0) return toast.error('Security protocol requires valid input');
        try {
            await api.post('/api/audio-playlists', { name, audios: selectedAudios, loopType });
            toast.success('Sequence Protocol Established');
            onSave();
        } catch { toast.error('Encryption Failed'); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex items-center justify-center p-8 animate-fade-in">
            <div className="bg-white rounded-[60px] max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border-white/20 border">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm"><Layers size={32} /></div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-amber-600 mb-1 block">Logic Architect</span>
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">New Sequence</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-5 bg-slate-100 rounded-3xl hover:bg-rose-500 hover:text-white transition-all text-slate-400 active:scale-95 shadow-sm"><X size={24} /></button>
                </div>
                
                <div className="flex-1 overflow-hidden flex divide-x divide-slate-100">
                    <div className="w-2/5 p-10 bg-slate-50/50 space-y-10 overflow-y-auto custom-scrollbar">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-6 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Core Specs</h4>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Playlist Name</label>
                                    <input className="nexus-input bg-white border-slate-200 h-16 text-lg font-black uppercase" placeholder="Input Name..." value={name} onChange={e=>setName(e.target.value)} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Playback Logic</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['sequential', 'shuffle', 'loop'].map(type => (
                                            <button key={type} onClick={()=>setLoopType(type)} className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${loopType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>{type}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 flex items-center gap-3"><div className="w-6 h-px bg-slate-300" /> Manifest Summary</h4>
                            <div className="p-6 bg-white border border-slate-200 rounded-[32px] space-y-4">
                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 uppercase">Selected Tracks</span><span className="text-[11px] font-black text-slate-900">{selectedAudios.length} UNITS</span></div>
                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 uppercase">Estimated Airtime</span><span className="text-[11px] font-black text-indigo-600">{selectedAudios.reduce((acc, id) => acc + (audios.find(a=>a._id===id)?.duration || 0), 0).toFixed(0)} SEC</span></div>
                            </div>
                        </section>
                    </div>

                    <div className="w-3/5 p-10 bg-white overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Asset Selection</h4>
                        <div className="grid grid-cols-1 gap-4">
                            {audios.map(a => (
                                <button key={a._id} onClick={() => toggleAudio(a._id)} className={`p-5 rounded-[28px] border text-left transition-all flex items-center gap-6 group/item ${
                                    selectedAudios.includes(a._id) ? 'bg-indigo-50 border-indigo-400 shadow-md ring-4 ring-indigo-50' : 'bg-white border-slate-100 hover:border-slate-300'
                                }`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedAudios.includes(a._id) ? 'bg-indigo-600 text-white shadow-lg rotate-12' : 'bg-slate-100 text-slate-400'}`}><Music size={20}/></div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[11px] font-black uppercase text-slate-900 block truncate tracking-tight">{a.originalName}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{Math.floor(a.duration)} SEC • BROADCAST READY</span>
                                    </div>
                                    {selectedAudios.includes(a._id) && <CheckCircle size={20} className="text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-10 border-t border-slate-100 flex gap-6 bg-white shrink-0">
                    <button onClick={handleSave} className="flex-1 py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] font-black uppercase tracking-[8px] text-sm shadow-2xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-4 active:scale-95">ESTABLISH SEQUENCE <ArrowRight size={20}/></button>
                    <button onClick={onClose} className="px-14 py-8 bg-slate-100 rounded-[32px] font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200 transition-all">Abort</button>
                </div>
            </div>
        </div>
    );
};

const AssignmentModal = ({ onClose, playlists, screens, groups, onSave }) => {
    const [data, setData] = useState({
        name: '', playlistId: '', targetType: 'all', targetId: '',
        startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        startTime: '09:00', endTime: '18:00', priority: 'low', volume: 100
    });

    const handleSave = async () => {
        if (!data.name || !data.playlistId) return toast.error('Security protocol requires valid identity');
        try {
            await api.post('/api/audio-assignments', data);
            toast.success('Transmission Deployed');
            onSave();
        } catch { toast.error('Transmission Failure'); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex items-center justify-center p-8 animate-fade-in">
            <div className="bg-white rounded-[60px] max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl border-white/20 border">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm"><Radio size={32} /></div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-emerald-600 mb-1 block">Transmission Protocol</span>
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">New Assignment</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-5 bg-slate-100 rounded-3xl hover:bg-rose-500 hover:text-white transition-all text-slate-400 active:scale-95 shadow-sm"><X size={24} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                    <section className="space-y-8">
                         <h4 className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Mission Identity</h4>
                         <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Assignment Name</label>
                                <input className="nexus-input bg-slate-50 h-16 font-black uppercase" placeholder="Input Name..." value={data.name} onChange={e=>setData({...data, name: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Logic Sequence</label>
                                <select className="nexus-input bg-slate-50 h-16 font-black text-indigo-600" value={data.playlistId} onChange={e=>setData({...data, playlistId: e.target.value})}>
                                    <option value="">SELECT SEQUENCE...</option>
                                    {playlists.map(p => <option key={p._id} value={p._id}>{p.name.toUpperCase()}</option>)}
                                </select>
                            </div>
                         </div>
                    </section>

                    <section className="space-y-8">
                         <h4 className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-3"><div className="w-6 h-px bg-emerald-600/30" /> Target Lock</h4>
                         <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Strategy</label>
                                <select className="nexus-input bg-slate-50 h-16 font-black" value={data.targetType} onChange={e=>setData({...data, targetType: e.target.value, targetId: ''})}>
                                    <option value="all">GLOBAL BROADCAST</option>
                                    <option value="group">SCREEN GROUP</option>
                                    <option value="screen">SPECIFIC UNIT</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Identity Confirmation</label>
                                <select className="nexus-input bg-slate-50 h-16 font-black text-sky-600 disabled:opacity-30" value={data.targetId} onChange={e=>setData({...data, targetId: e.target.value})} disabled={data.targetType==='all'}>
                                    <option value="">SELECT TARGET...</option>
                                    {data.targetType === 'screen' ? screens.map(s=><option key={s._id} value={s._id}>{s.name.toUpperCase()}</option>) : groups.map(g=><option key={g._id} value={g._id}>{g.name.toUpperCase()}</option>)}
                                </select>
                            </div>
                         </div>
                    </section>

                    <section className="space-y-8">
                         <h4 className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-3"><div className="w-6 h-px bg-amber-600/30" /> Time Dimension</h4>
                         <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 block">Active Period</label>
                                <div className="grid grid-cols-2 gap-4">
                                     <input type="date" className="nexus-input bg-slate-50 h-14 font-bold" value={data.startDate} onChange={e=>setData({...data, startDate: e.target.value})} />
                                     <input type="date" className="nexus-input bg-slate-50 h-14 font-bold" value={data.endDate} onChange={e=>setData({...data, endDate: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 block">Sync Window</label>
                                <div className="grid grid-cols-2 gap-4">
                                     <input type="time" className="nexus-input bg-slate-50 h-14 font-bold" value={data.startTime} onChange={e=>setData({...data, startTime: e.target.value})} />
                                     <input type="time" className="nexus-input bg-slate-50 h-14 font-bold" value={data.endTime} onChange={e=>setData({...data, endTime: e.target.value})} />
                                </div>
                            </div>
                         </div>
                    </section>

                    <section className="space-y-8">
                         <h4 className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-3"><div className="w-6 h-px bg-slate-900/30" /> Command Logic</h4>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Priority Hierarchy</label>
                            <div className="grid grid-cols-3 gap-4">
                                {['low', 'medium', 'high'].map(p => (
                                    <button key={p} onClick={()=>setData({...data, priority: p})} className={`py-6 rounded-3xl border text-[11px] font-black uppercase tracking-[4px] transition-all ${data.priority === p ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-200'}`}>{p}</button>
                                ))}
                            </div>
                         </div>
                    </section>
                </div>
                
                <div className="p-10 border-t border-slate-100 flex gap-6 bg-white shrink-0">
                    <button onClick={handleSave} className="flex-1 py-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[32px] font-black uppercase tracking-[8px] text-sm shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-4 active:scale-95">DEPLOY SIGNAL <Send size={20}/></button>
                    <button onClick={onClose} className="px-14 py-8 bg-slate-100 rounded-[32px] font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200 transition-all">Abort</button>
                </div>
            </div>
        </div>
    );
};

export default AudioBroadcastManager;
