import React, { useState, useEffect } from 'react';
import { Tv, Monitor, Trash2, Cpu, HardDrive, Zap, Copy, ExternalLink, RefreshCw, MapPin, Radio, ShieldCheck, Layers, Plus, Activity, ArrowUpRight, Power } from 'lucide-react';
import api from '../../services/api';
import { useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';

const ScreenManager = ({ fetchData }) => {
  const { data: screens = [], refetch, isLoading } = useScreens();
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'inventory'
  const [newScreen, setNewScreen] = useState({ 
    name: '', location: '', resolution: '1920x1080', groupId: '',
    ipAddress: '', dns: '8.8.8.8', gateway: '', subnet: '255.255.255.0'
  });
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      setNewScreen({ 
        name: '', location: '', resolution: '1920x1080', groupId: '',
        ipAddress: '', dns: '8.8.8.8', gateway: '', subnet: '255.255.255.0'
      });
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
    if (!window.confirm('Dissolve this cluster? Nodes will be unassigned.')) return;
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
          toast.success('Node Target Recalibrated');
          refetch();
      } catch (err) { toast.error('Target sync failed'); }
  };

  const deleteScreen = async (id) => {
    if (!window.confirm('Terminate this node? This will permanently de-authorize the terminal.')) return;
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

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await refetch();
      setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          
          {/* HEADER */}
          <div className="bg-black/10 p-8 border-b border-white/5 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-emerald-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-emerald-500">Topology Engine</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Network Workspace</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Network Studio
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Device Inventory ({screens.length})
                    </button>
                </div>
            </div>

            {/* LIVE TELEMETRY SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-black/80 rounded-[32px] border border-white/10 flex items-center justify-between group overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Network Integrity</p>
                        <h4 className="text-2xl font-black text-white tabular-nums uppercase">{screens.filter(s => s.status === 'online').length} / {screens.length} <span className="text-xs text-white/40">Active Nodes</span></h4>
                    </div>
                    <Zap className="text-emerald-500/20 group-hover:scale-125 transition-transform" size={48} />
                </div>
                <div className="p-6 bg-black/80 rounded-[32px] border border-white/10 flex items-center justify-between group overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-1">Clusters Defined</p>
                        <h4 className="text-2xl font-black text-white tabular-nums uppercase">{groups.length} <span className="text-xs text-white/40">Active Zones</span></h4>
                    </div>
                    <Layers className="text-sky-500/20 group-hover:scale-125 transition-transform" size={48} />
                </div>
                <div className="p-6 bg-black/80 rounded-[32px] border border-white/10 flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Security Tier</p>
                        <h4 className="text-2xl font-black text-white tabular-nums uppercase">RSA-4096 <span className="text-xs text-white/40">Authorized</span></h4>
                    </div>
                    <ShieldCheck className="text-rose-500/20 group-hover:scale-125 transition-transform" size={48} />
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' ? (
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200/50">
                    
                    {/* LEFT: Node Provisioning */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-sky-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-sky-600/30" /> Node Provisioning
                            </h4>
                            <form onSubmit={registerScreen} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Screen Identity</label>
                                    <input type="text" required className="nexus-input bg-slate-50" placeholder="e.g. NORTH-HUB-01" value={newScreen.name} onChange={(e) => setNewScreen({...newScreen, name: e.target.value})}/>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Geographic Tag</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input type="text" required className="nexus-input bg-slate-50 pl-11" placeholder="e.g. Main Lobby" value={newScreen.location} onChange={(e) => setNewScreen({...newScreen, location: e.target.value})}/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Native Res</label>
                                        <select className="nexus-input bg-slate-50" value={newScreen.resolution} onChange={(e) => setNewScreen({...newScreen, resolution: e.target.value})}>
                                            <option value="1920x1080">1080p Full HD</option>
                                            <option value="3840x2160">4K Ultra HD</option>
                                            <option value="1280x720">720p HD Ready</option>
                                            <option value="1080x1920">Vertical 1080p</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Initial Cluster Assignment</label>
                                    <select className="nexus-input bg-slate-50" value={newScreen.groupId} onChange={(e) => setNewScreen({...newScreen, groupId: e.target.value})}>
                                        <option value="">Unassigned Root</option>
                                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                    </select>
                                </div>

                                <section className="pt-4 border-t border-slate-200 space-y-4">
                                    <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Network Configuration</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-slate-500 uppercase">Static IP</label>
                                            <input type="text" className="nexus-input py-2 text-xs bg-white" placeholder="0.0.0.0" value={newScreen.ipAddress} onChange={(e) => setNewScreen({...newScreen, ipAddress: e.target.value})}/>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-slate-500 uppercase">Primary DNS</label>
                                            <input type="text" className="nexus-input py-2 text-xs bg-white" placeholder="8.8.8.8" value={newScreen.dns} onChange={(e) => setNewScreen({...newScreen, dns: e.target.value})}/>
                                        </div>
                                    </div>
                                </section>

                                <button type="submit" className="nexus-btn-primary w-full py-5 text-[10px] tracking-[6px] uppercase shadow-2xl">
                                    AUTHORIZE NODE
                                </button>
                            </form>
                        </section>
                    </div>

                    {/* RIGHT: Cluster Architecture */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-emerald-600/30" /> Cluster Architecture
                            </h4>
                            <form onSubmit={createGroup} className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm space-y-4">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Protocol Name</label>
                                <div className="flex gap-2">
                                    <input type="text" required className="nexus-input flex-1" placeholder="Enter Cluster Identifier..." value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}/>
                                    <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Create</button>
                                </div>
                            </form>

                            <div className="space-y-3 mt-8">
                                {groups.map(g => (
                                    <div key={g._id} className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between group/g hover:border-emerald-300 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                                <Layers size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-text uppercase tracking-tight">{g.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Cluster Protocol</p>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteGroup(g._id)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/g:opacity-100"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            ) : (
                /* DEVICE INVENTORY GRID */
                <div className="h-full overflow-y-auto custom-scrollbar p-10">
                    {screens.length === 0 ? (
                        <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[40px]">
                            <Tv className="text-slate-200 mx-auto mb-6" size={48} />
                            <p className="text-slate-400 uppercase font-black tracking-[8px] text-[10px]">No Nodes Provisioned</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {screens.map(s => (
                            <div key={s._id} className={`p-8 bg-white border rounded-[48px] transition-all hover:shadow-2xl group relative flex flex-col ${s.isActive ? 'border-slate-200 hover:border-sky-300 shadow-sky-500/5' : 'border-rose-100 bg-rose-50/30 opacity-70 grayscale'}`}>
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center border-2 transition-all ${!s.isActive ? 'bg-rose-100 border-rose-200 text-rose-400' : s.status === 'online' ? 'bg-sky-50 border-sky-100 text-sky-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                        <Tv size={28} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => toggleScreenActive(s._id, s.isActive)} className={`p-3 rounded-2xl shadow-xl transition-all ${s.isActive ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`} title={s.isActive ? "Deactivate" : "Activate"}>
                                            <Power size={16}/>
                                        </button>
                                        <button onClick={() => copyToken(s.deviceToken)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-sky-600 hover:border-sky-200 transition-all shadow-xl shadow-slate-200/50"><Copy size={16}/></button>
                                        <button onClick={() => window.open(`/display?screenId=${s._id}`, '_blank')} className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-110 transition-all"><ArrowUpRight size={16}/></button>
                                        <button onClick={() => deleteScreen(s._id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${!s.isActive ? 'bg-rose-400' : s.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`} />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.location || 'Unknown Node'}</p>
                                        </div>
                                        {s.ipAddress && <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{s.ipAddress}</span>}
                                    </div>
                                    <h3 className="text-2xl font-black text-text uppercase tracking-tighter truncate">{s.name}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-[24px]">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cluster</p>
                                        <select 
                                            className="w-full bg-transparent border-none text-[10px] font-black uppercase text-sky-600 outline-none p-0 h-4 cursor-pointer"
                                            value={s.groupId?._id || s.groupId || ''} 
                                            onChange={(e) => updateScreenGroup(s._id, e.target.value)}
                                        >
                                            <option value="">Root Hub</option>
                                            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-[24px]">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Resolution</p>
                                        <p className="text-[10px] font-black text-slate-600 tabular-nums uppercase">{s.resolution}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Cpu size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-600 tabular-nums">{s.telemetry?.ramUsage || 0}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Zap size={14} className="text-amber-500" />
                                            <span className="text-[10px] font-black text-slate-600 tabular-nums">{s.telemetry?.uptime ? Math.floor(s.telemetry.uptime / 3600) : 0}h</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tabular-nums">
                                        {s.lastSeen ? new Date(s.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            )}
          </div>
       </div>
    </div>
  );
};

export default ScreenManager;
