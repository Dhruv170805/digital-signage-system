import React, { useState, useEffect } from 'react';
import { Tv, Monitor, Trash2, Cpu, HardDrive, Zap, Copy, ExternalLink, RefreshCw, MapPin, Radio, ShieldCheck, Layers, Plus, Activity, ArrowUpRight, Power, ChevronRight, Globe, Lock } from 'lucide-react';
import api from '../../services/api';
import { useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';

const ScreenManager = ({ fetchData }) => {
  const { data: screens = [], refetch, isLoading } = useScreens();
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [newScreen, setNewScreen] = useState({ 
    name: '', location: '', resolution: '1920x1080', groupId: '',
    ipAddress: '', dns: '8.8.8.8', gateway: '', subnet: '255.255.255.0'
  });
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const fetchGroups = async () => {
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data);
    } catch (err) { console.error('Failed to load clusters'); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const registerScreen = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/screens/register`, newScreen);
      toast.success('Node Authorized');
      setNewScreen({ name: '', location: '', resolution: '1920x1080', groupId: '', ipAddress: '', dns: '8.8.8.8', gateway: '', subnet: '255.255.255.0' });
      refetch();
      if (fetchData) fetchData();
      if (res.data.deviceToken) {
          navigator.clipboard.writeText(res.data.deviceToken);
          toast.success('Authorization Key copied!', { icon: '🔑' });
      }
      setActiveTab('inventory');
    } catch (err) { toast.error(err.response?.data?.error || 'Authorization failed'); }
  };

  const toggleScreenActive = async (screenId, currentStatus) => {
    try {
        await api.put(`/api/screens/${screenId}`, { isActive: !currentStatus });
        toast.success(`Node ${!currentStatus ? 'Activated' : 'Suspended'}`);
        refetch();
    } catch (err) { toast.error('State toggle failed'); }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/groups', newGroup);
      toast.success('Cluster Protocol Established');
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (err) { toast.error('Cluster initialization failed'); }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm('Dissolve this cluster?')) return;
    try {
      await api.delete(`/api/groups/${id}`);
      toast.success('Cluster Dissolved');
      fetchGroups();
      refetch();
    } catch (err) { toast.error('Dissolution failed'); }
  };

  const updateScreenGroup = async (screenId, groupId) => {
      try {
          await api.put(`/api/screens/${screenId}`, { groupId: groupId || null });
          toast.success('Node Recalibrated');
          refetch();
      } catch (err) { toast.error('Target sync failed'); }
  };

  const deleteScreen = async (id) => {
    if (!window.confirm('Terminate this node?')) return;
    try {
      await api.delete(`/api/screens/${id}`);
      toast.success('Node Purged');
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error('Termination failed'); }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    toast.success('Key Copied');
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
          
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="text-indigo-600" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Topology Engine</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Network Workspace</h2>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Network Studio</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Inventory ({screens.length})</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div>
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Network Integrity</p>
                        <h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">{screens.filter(s => s.status === 'online').length} / {screens.length} <span className="text-xs text-slate-400 font-bold ml-1">ONLINE</span></h4>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><Zap className="text-indigo-600" size={24} /></div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div>
                        <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1">Clusters Defined</p>
                        <h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">{groups.length} <span className="text-xs text-slate-400 font-bold ml-1">ZONES</span></h4>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><Layers className="text-sky-600" size={24} /></div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div>
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Security Tier</p>
                        <h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">RSA-4096 <span className="text-xs text-slate-400 font-bold ml-1">ENABLED</span></h4>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><Lock className="text-rose-600" size={24} /></div>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' ? (
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-white">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Node Provisioning</h4>
                            <form onSubmit={registerScreen} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Terminal Identity</label>
                                    <input type="text" required className="nexus-input bg-slate-50 border-slate-200" placeholder="e.g. NORTH-DISPLAY-01" value={newScreen.name} onChange={(e) => setNewScreen({...newScreen, name: e.target.value})}/>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Location Tag</label><div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" required className="nexus-input bg-slate-50 pl-11 border-slate-200" placeholder="e.g. Main Lobby" value={newScreen.location} onChange={(e) => setNewScreen({...newScreen, location: e.target.value})}/></div></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Protocol Res</label><select className="nexus-input bg-slate-50 border-slate-200" value={newScreen.resolution} onChange={(e) => setNewScreen({...newScreen, resolution: e.target.value})}><option value="1920x1080">1080p Standard</option><option value="3840x2160">4K Ultra</option><option value="1080x1920">1080p Vertical</option></select></div>
                                </div>
                                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Cluster Assignment</label><select className="nexus-input bg-slate-50 border-slate-200" value={newScreen.groupId} onChange={(e) => setNewScreen({...newScreen, groupId: e.target.value})}><option value="">Unassigned Root</option>{groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}</select></div>
                                <button type="submit" className="nexus-btn-primary w-full py-5 text-[10px] tracking-[6px] uppercase shadow-2xl shadow-indigo-200">AUTHORIZE PROTOCOL</button>
                            </form>
                        </section>
                    </div>
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-emerald-600/30" /> Cluster Architecture</h4>
                            <form onSubmit={createGroup} className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm space-y-4">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cluster Identifier</label>
                                <div className="flex gap-2">
                                    <input type="text" required className="nexus-input flex-1 border-slate-200" placeholder="New Cluster Name..." value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}/>
                                    <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Create</button>
                                </div>
                            </form>
                            <div className="space-y-3 mt-8">
                                {groups.map(g => (
                                    <div key={g._id} className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between group hover:border-emerald-300 transition-all shadow-sm">
                                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><Layers size={18} /></div><div><p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{g.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Zone</p></div></div>
                                        <button onClick={() => deleteGroup(g._id)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            ) : (
                <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {screens.map(s => (
                            <div key={s._id} className={`p-8 bg-white border rounded-[48px] transition-all hover:shadow-2xl group flex flex-col ${s.isActive ? 'border-slate-200 hover:border-indigo-300' : 'border-rose-100 opacity-70 grayscale'}`}>
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center border-2 transition-all ${!s.isActive ? 'bg-rose-50 border-rose-100 text-rose-400' : s.status === 'online' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}><Tv size={28} /></div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => toggleScreenActive(s._id, s.isActive)} className={`p-3 rounded-2xl shadow-lg transition-all ${s.isActive ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}><Power size={16}/></button>
                                        <button onClick={() => copyToken(s.deviceToken)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all"><Copy size={16}/></button>
                                        <button onClick={() => window.open(`/display?screenId=${s._id}`, '_blank')} className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"><ArrowUpRight size={16}/></button>
                                        <button onClick={() => deleteScreen(s._id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${!s.isActive ? 'bg-rose-400' : s.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.location || 'Root'}</p></div>
                                        {s.ipAddress && <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{s.ipAddress}</span>}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter truncate">{s.name}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-[24px]">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cluster</p>
                                        <select className="w-full bg-transparent border-none text-[10px] font-black uppercase text-indigo-600 outline-none p-0 cursor-pointer" value={s.groupId?._id || s.groupId || ''} onChange={(e) => updateScreenGroup(s._id, e.target.value)}>
                                            <option value="">Root Hub</option>{groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-[24px]"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Resolution</p><p className="text-[10px] font-black text-slate-700 tabular-nums">{s.resolution}</p></div>
                                </div>
                                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5"><Cpu size={12} className="text-slate-400" /><span className="text-[10px] font-black text-slate-600">{s.telemetry?.ramUsage || 0}%</span></div>
                                        <div className="flex items-center gap-1.5"><Zap size={12} className="text-amber-500" /><span className="text-[10px] font-black text-slate-600">{s.telemetry?.uptime ? Math.floor(s.telemetry.uptime / 3600) : 0}h</span></div>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">{s.lastSeen ? new Date(s.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
       </div>
  );
};

export default ScreenManager;
