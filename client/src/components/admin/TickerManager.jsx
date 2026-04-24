import React, { useState } from 'react';
import api from '../../services/api';
import { useTickers, useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';
import { Type, Play, Pause, Trash2, Edit2, Zap, MoveRight, Layers, Clock } from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`glass p-6 ${className}`}>{children}</div>
);

const TickerManager = () => {
    const { data: tickers = [], refetch: refetchTickers } = useTickers();
    const { data: screens = [] } = useScreens();
    
    const [draftTicker, setDraftTicker] = useState({
        text: '', type: 'text', linkUrl: '', 
        fontFamily: 'sans-serif', fontSize: 'text-4xl', fontWeight: 'normal', fontStyle: 'normal',
        color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.4)', padding: '0px 24px',
        direction: 'right-left', speed: 50, loopControl: 'infinite',
        targetType: 'global', targetIds: [], priority: 10,
        startTime: '00:00', endTime: '23:59', isActive: 1
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/api/ticker/${editId}`, draftTicker);
                toast.success('Ticker Updated');
            } else {
                await api.post(`/api/ticker`, draftTicker);
                toast.success('Ticker Created');
            }
            refetchTickers();
            handleCancel();
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Failed to save ticker'); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this ticker?')) return;
        try {
            await api.delete(`/api/ticker/${id}`);
            toast.success('Ticker Deleted');
            refetchTickers();
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Failed to delete ticker'); 
        }
    };

    const handleToggle = async (id, isActive) => {
        try {
            await api.put(`/api/ticker/${id}/toggle`, { isActive });
            refetchTickers();
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Failed to toggle status'); 
        }
    };

    const handleEdit = (t) => {
        setDraftTicker(t);
        setEditId(t._id || t.id);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditId(null);
        setDraftTicker({
            text: '', type: 'text', linkUrl: '', 
            fontFamily: 'sans-serif', fontSize: 'text-4xl', fontWeight: 'normal', fontStyle: 'normal',
            color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.4)', padding: '0px 24px',
            direction: 'right-left', speed: 50, loopControl: 'infinite',
            targetType: 'global', targetIds: [], priority: 10,
            startTime: '00:00', endTime: '23:59', isActive: 1
        });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in text-text">
            {/* Editor Panel */}
            <Card className="xl:col-span-1 border-indigo-500/20">
                <div className="flex items-center gap-3 mb-8">
                    <Type className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                        {isEditing ? 'Edit Ticker' : 'Create Ticker'}
                    </h3>
                </div>
                <form onSubmit={handleSave} className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* Content */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 border-b border-white/10 pb-1">1. Content</h4>
                        <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-slate-700">
                            {['text', 'api'].map(t => (
                                <button type="button" key={t} onClick={() => setDraftTicker({ ...draftTicker, type: t })} 
                                    className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${draftTicker.type === t ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Message / Endpoint</label>
                            <textarea required value={draftTicker.text} onChange={(e) => setDraftTicker({ ...draftTicker, text: e.target.value })} 
                                className="nexus-input min-h-[80px] resize-none" placeholder={draftTicker.type === 'api' ? 'https://api.url/data' : 'Enter message here...'}/>
                        </div>
                    </div>

                    {/* Styling */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-pink-400 border-b border-white/10 pb-1 mt-6">2. Aesthetics</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Text Color</label>
                                <input type="color" value={draftTicker.color} onChange={(e) => setDraftTicker({ ...draftTicker, color: e.target.value })} className="w-full h-10 bg-transparent rounded cursor-pointer"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Background</label>
                                <input type="text" value={draftTicker.backgroundColor} onChange={(e) => setDraftTicker({ ...draftTicker, backgroundColor: e.target.value })} className="nexus-input text-xs" placeholder="rgba/hex"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Font Size</label>
                                <select className="nexus-input text-xs" value={draftTicker.fontSize} onChange={(e) => setDraftTicker({ ...draftTicker, fontSize: e.target.value })}>
                                    {['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-4xl', 'text-6xl', 'text-8xl'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Weight</label>
                                <select className="nexus-input text-xs" value={draftTicker.fontWeight} onChange={(e) => setDraftTicker({ ...draftTicker, fontWeight: e.target.value })}>
                                    <option value="normal">Normal</option>
                                    <option value="semibold">Semi Bold</option>
                                    <option value="bold">Bold</option>
                                    <option value="black">Black</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Animation */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-amber-400 border-b border-white/10 pb-1 mt-6">3. Animation</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Direction</label>
                                <select className="nexus-input text-xs" value={draftTicker.direction} onChange={(e) => setDraftTicker({ ...draftTicker, direction: e.target.value })}>
                                    <option value="right-left">Right to Left</option>
                                    <option value="left-right">Left to Right</option>
                                    <option value="vertical">Vertical Scroll</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Speed (px/s)</label>
                                <input type="number" value={draftTicker.speed} onChange={(e) => setDraftTicker({ ...draftTicker, speed: Number(e.target.value) })} className="nexus-input text-xs"/>
                            </div>
                        </div>
                    </div>

                    {/* Targeting & Priority */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-emerald-400 border-b border-white/10 pb-1 mt-6">4. Targeting & Rules</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Target</label>
                                <select className="nexus-input text-xs" value={draftTicker.targetType} onChange={(e) => setDraftTicker({ ...draftTicker, targetType: e.target.value })}>
                                    <option value="global">Global (All)</option>
                                    <option value="screen">Specific Screen</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Priority</label>
                                <input type="number" value={draftTicker.priority} onChange={(e) => setDraftTicker({ ...draftTicker, priority: Number(e.target.value) })} className="nexus-input text-xs"/>
                            </div>
                        </div>
                        {draftTicker.targetType === 'screen' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Select Screen</label>
                                <select multiple className="nexus-input text-xs h-24" value={draftTicker.targetIds} onChange={(e) => {
                                    const options = Array.from(e.target.options);
                                    setDraftTicker({ ...draftTicker, targetIds: options.filter(o => o.selected).map(o => o.value) });
                                }}>
                                    {screens.map(s => <option key={s._id || s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Time From</label>
                                <input type="time" value={draftTicker.startTime} onChange={(e) => setDraftTicker({ ...draftTicker, startTime: e.target.value })} className="nexus-input text-xs"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Time To</label>
                                <input type="time" value={draftTicker.endTime} onChange={(e) => setDraftTicker({ ...draftTicker, endTime: e.target.value })} className="nexus-input text-xs"/>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button type="submit" className="nexus-btn-primary flex-1 tracking-[2px]">{isEditing ? 'Save Changes' : 'Create'}</button>
                        {isEditing && (
                            <button type="button" onClick={handleCancel} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase">Cancel</button>
                        )}
                    </div>
                </form>
            </Card>

            {/* List Panel */}
            <Card className="xl:col-span-2">
                <div className="flex items-center gap-3 mb-8">
                    <Layers className="w-5 h-5 text-sky-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text">Managed Tickers</h3>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-[9px] font-black uppercase text-slate-500">
                                <th className="py-4 px-6">Message</th>
                                <th className="py-4 px-6">Targeting</th>
                                <th className="py-4 px-6">Rules</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tickers.map(t => (
                                <tr key={t._id || t.id} className={`hover:bg-white/5 transition-colors ${!t.isActive ? 'opacity-50' : ''}`}>
                                    <td className="py-5 px-6">
                                        <p className="font-bold text-text uppercase text-xs tracking-tight truncate max-w-[200px]">{t.text}</p>
                                        <p className="text-[8px] font-bold text-sky-400 uppercase mt-1 tracking-widest flex items-center gap-2">
                                            {t.type} <MoveRight size={8}/> {t.direction} <MoveRight size={8}/> {t.speed}px/s
                                        </p>
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${t.targetType === 'global' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                                            {t.targetType}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold text-orange-600 flex items-center gap-1"><Zap size={10}/> Pri: {t.priority}</span>
                                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1"><Clock size={10}/> {t.startTime} - {t.endTime}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleToggle(t._id || t.id, !t.isActive)} className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 transition-all">
                                                {t.isActive ? <Pause size={14}/> : <Play size={14}/>}
                                            </button>
                                            <button onClick={() => handleEdit(t)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all">
                                                <Edit2 size={14}/>
                                            </button>
                                            <button onClick={() => handleDelete(t._id || t.id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-all">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TickerManager;
