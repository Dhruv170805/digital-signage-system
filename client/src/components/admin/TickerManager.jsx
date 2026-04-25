import React, { useState } from 'react';
import api from '../../services/api';
import { useTickers, useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';
import { Type, Play, Pause, Trash2, Edit2, Zap, MoveRight, Layers, Clock, Power, RefreshCw } from 'lucide-react';
import TickerEngine from '../display/TickerEngine';

const TickerManager = () => {
    const { data: tickers = [], refetch: refetchTickers } = useTickers();
    const { data: screens = [] } = useScreens();
    const [groups, setGroups] = useState([]);
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'inventory'
    
    const [draftTicker, setDraftTicker] = useState({
        text: '', type: 'text', linkUrl: '', 
        fontFamily: 'sans-serif', fontSize: 'text-2xl', fontWeight: 'bold', fontStyle: 'normal',
        color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.8)', padding: '12px 40px',
        direction: 'right-left', speed: 60, loopControl: 'infinite',
        targetType: 'all', targetIds: [], priority: 10,
        startTime: '00:00', endTime: '23:59', isActive: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/api/groups');
            setGroups(res.data);
        } catch (err) { console.error('Failed to load groups'); }
    };

    React.useEffect(() => { fetchGroups(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/api/ticker/${editId}`, draftTicker);
                toast.success('Configuration Synchronized');
            } else {
                await api.post(`/api/ticker`, draftTicker);
                toast.success('Transmission Active');
            }
            refetchTickers();
            handleCancel();
            setActiveTab('inventory');
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Handshake failed'); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Terminate this transmission?')) return;
        try {
            await api.delete(`/api/ticker/${id}`);
            toast.success('Ticker Purged');
            refetchTickers();
        } catch (err) { 
            toast.error('Deletion failure'); 
        }
    };

    const handleToggle = async (id, isActive) => {
        try {
            await api.put(`/api/ticker/${id}/toggle`, { isActive });
            refetchTickers();
        } catch (err) { toast.error('Status sync failure'); }
    };

    const handleEdit = (t) => {
        setDraftTicker(t);
        setEditId(t._id || t.id);
        setIsEditing(true);
        setActiveTab('editor');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditId(null);
        setDraftTicker({
            text: '', type: 'text', linkUrl: '', 
            fontFamily: 'sans-serif', fontSize: 'text-2xl', fontWeight: 'bold', fontStyle: 'normal',
            color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.8)', padding: '12px 40px',
            direction: 'right-left', speed: 60, loopControl: 'infinite',
            targetType: 'all', targetIds: [], priority: 10,
            startTime: '00:00', endTime: '23:59', isActive: true
        });
    };

    return (
        <div className="animate-fade-in h-full flex flex-col">
            <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
                
                {/* Unified Header & Live Monitor */}
                <div className="bg-black/10 p-8 border-b border-white/5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Zap className="text-sky-500" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[4px] text-sky-500">Live Engine</span>
                            </div>
                            <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Ticker Workspace</h2>
                        </div>

                        <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                            <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                                Design Studio
                            </button>
                            <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                                Managed Streams ({tickers.length})
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
                        <div className="relative h-20 bg-black rounded-2xl border border-white/10 overflow-hidden flex items-center shadow-inner">
                            {draftTicker.text || draftTicker.linkUrl ? (
                                <TickerEngine ticker={draftTicker} />
                            ) : (
                                <div className="w-full text-center text-[10px] font-black uppercase text-slate-700 tracking-[10px] animate-pulse">
                                    Awaiting Input Signal
                                </div>
                            )}
                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/80 to-transparent pointer-events-none z-10" />
                            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/80 to-transparent pointer-events-none z-10" />
                        </div>
                    </div>
                </div>

                {/* Content Workspace */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'editor' ? (
                        <form onSubmit={handleSave} className="h-full flex flex-col lg:flex-row divide-x divide-slate-200/50">
                            {/* Left Pane: Primary Config */}
                            <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                <section>
                                    <h4 className="text-[10px] font-black uppercase text-sky-600 mb-6 flex items-center gap-3">
                                        <div className="w-6 h-px bg-sky-600/30" /> Content Definition
                                    </h4>
                                    <div className="space-y-6">
                                        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                                            {['text', 'api'].map(t => (
                                                <button type="button" key={t} onClick={() => setDraftTicker({ ...draftTicker, type: t })} 
                                                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${draftTicker.type === t ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                                    {t === 'text' ? 'Static Message' : 'Live Data API'}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Payload Source</label>
                                            {draftTicker.type === 'api' ? (
                                                <input required type="url" value={draftTicker.linkUrl} onChange={(e) => setDraftTicker({ ...draftTicker, linkUrl: e.target.value })} 
                                                    className="nexus-input text-sm" placeholder="https://api.external-source.com/v1/feed"/>
                                            ) : (
                                                <textarea required value={draftTicker.text} onChange={(e) => setDraftTicker({ ...draftTicker, text: e.target.value })} 
                                                    className="nexus-input min-h-[120px] resize-none text-base font-bold" placeholder="Enter broadcast message here..."/>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-6 flex items-center gap-3">
                                        <div className="w-6 h-px bg-emerald-600/30" /> Targeting Logic
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Target Cluster</label>
                                            <select className="nexus-input" value={draftTicker.targetType} onChange={(e) => setDraftTicker({ ...draftTicker, targetType: e.target.value, targetIds: [] })}>
                                                <option value="all">Global Broadcast</option>
                                                <option value="group">Specific Group</option>
                                                <option value="screen">Specific Screen</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Priority Override</label>
                                            <input type="number" value={draftTicker.priority} onChange={(e) => setDraftTicker({ ...draftTicker, priority: Number(e.target.value) })} className="nexus-input"/>
                                        </div>
                                    </div>
                                    {draftTicker.targetType !== 'all' && (
                                        <div className="mt-6 space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Identity Selection</label>
                                            <select multiple className="nexus-input h-32 custom-scrollbar text-xs font-bold" value={draftTicker.targetIds} onChange={(e) => {
                                                const options = Array.from(e.target.options);
                                                setDraftTicker({ ...draftTicker, targetIds: options.filter(o => o.selected).map(o => o.value) });
                                            }}>
                                                {draftTicker.targetType === 'screen' ? (
                                                    screens.map(s => <option key={s._id} value={s._id}>{s.name} • {s.location}</option>)
                                                ) : (
                                                    groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)
                                                )}
                                            </select>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Right Pane: Aesthetics & Timing */}
                            <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                                <section>
                                    <h4 className="text-[10px] font-black uppercase text-pink-600 mb-6 flex items-center gap-3">
                                        <div className="w-6 h-px bg-pink-600/30" /> Visual Identity
                                    </h4>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Typography</label>
                                                <select className="nexus-input" value={draftTicker.fontFamily} onChange={(e) => setDraftTicker({ ...draftTicker, fontFamily: e.target.value })}>
                                                    <option value="sans-serif">System Sans</option>
                                                    <option value="'Plus Jakarta Sans', sans-serif">Jakarta Sans (Premium)</option>
                                                    <option value="'JetBrains Mono', monospace">Terminal Mono</option>
                                                    <option value="'Bebas Neue', sans-serif">Bebas Neue (Impact)</option>
                                                    <option value="'Orbitron', sans-serif">Orbitron (Future)</option>
                                                    <option value="'Montserrat', sans-serif">Montserrat (Geometric)</option>
                                                    <option value="'Oswald', sans-serif">Oswald (Compact)</option>
                                                    <option value="'Playfair Display', serif">Playfair (Serif)</option>
                                                    <option value="'Roboto', sans-serif">Roboto (Modern)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Weight</label>
                                                <select className="nexus-input" value={draftTicker.fontWeight} onChange={(e) => setDraftTicker({ ...draftTicker, fontWeight: e.target.value })}>
                                                    <option value="normal">Standard</option>
                                                    <option value="bold">Bold</option>
                                                    <option value="900">Black</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Scale (Size)</label>
                                                <select className="nexus-input" value={draftTicker.fontSize} onChange={(e) => setDraftTicker({ ...draftTicker, fontSize: e.target.value })}>
                                                    {['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-4xl', 'text-6xl', 'text-8xl'].map(s => <option key={s} value={s}>{s.replace('text-', '').toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Hue</label>
                                                <input type="color" value={draftTicker.color} onChange={(e) => setDraftTicker({ ...draftTicker, color: e.target.value })} className="w-full h-12 bg-white rounded-2xl cursor-pointer border border-slate-200 p-1"/>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Speed Control</label>
                                                <input type="range" min="10" max="200" value={draftTicker.speed} onChange={(e) => setDraftTicker({ ...draftTicker, speed: Number(e.target.value) })} className="w-full h-12 accent-pink-600 opacity-70 hover:opacity-100 transition-opacity"/>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-black uppercase text-amber-600 mb-6 flex items-center gap-3">
                                        <div className="w-6 h-px bg-amber-600/30" /> Temporal Rules
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Window Start</label>
                                            <input type="time" value={draftTicker.startTime} onChange={(e) => setDraftTicker({ ...draftTicker, startTime: e.target.value })} className="nexus-input"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Window End</label>
                                            <input type="time" value={draftTicker.endTime} onChange={(e) => setDraftTicker({ ...draftTicker, endTime: e.target.value })} className="nexus-input"/>
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-10 flex gap-4">
                                    <button type="submit" className="nexus-btn-primary flex-1 py-5 text-xs tracking-[4px]">
                                        {isEditing ? 'COMMIT UPDATES' : 'LAUNCH STREAM'}
                                    </button>
                                    {isEditing && (
                                        <button type="button" onClick={handleCancel} className="px-10 py-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all">Abort</button>
                                    )}
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* Inventory View */
                        <div className="h-full overflow-y-auto custom-scrollbar p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {tickers.map(t => (
                                    <div key={t._id} className={`p-8 bg-white border border-slate-200 rounded-[32px] transition-all hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5 group relative ${!t.isActive ? 'opacity-40 grayscale' : ''}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${t.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {t.isActive ? 'Active Stream' : 'Offline'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                <button onClick={() => handleToggle(t._id, !t.isActive)} className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-slate-400 transition-all"><Power size={14}/></button>
                                                <button onClick={() => handleEdit(t)} className="p-3 bg-sky-50 hover:bg-sky-600 hover:text-white rounded-xl text-sky-600 transition-all"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDelete(t._id)} className="p-3 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl text-rose-600 transition-all"><Trash2 size={14}/></button>
                                            </div>
                                        </div>

                                        <p className="text-lg font-black text-text uppercase tracking-tight line-clamp-2 mb-4 leading-tight">
                                            {t.type === 'api' ? t.linkUrl : t.text}
                                        </p>

                                        <div className="flex flex-wrap gap-2 items-center border-t border-slate-100 pt-6">
                                            <div className="px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-lg text-[8px] font-black text-sky-600 uppercase tracking-widest">
                                                {t.targetType}
                                            </div>
                                            <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-[8px] font-black text-orange-600 uppercase tracking-widest">
                                                Priority {t.priority}
                                            </div>
                                            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                {t.startTime} - {t.endTime}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {tickers.length === 0 && (
                                    <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[12px]">No Streams Provisioned</p>
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

export default TickerManager;
