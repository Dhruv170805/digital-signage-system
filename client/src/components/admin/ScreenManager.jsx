import React, { useState } from 'react';
import { Tv, Monitor, Trash2, Cpu, HardDrive, Zap, Copy, ExternalLink, RefreshCw, MapPin } from 'lucide-react';
import api from '../../services/api';
import { useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';
import Card from './Card';

const ScreenManager = ({ fetchData }) => {
  const { data: screens = [], refetch, isLoading } = useScreens();
  const [newScreen, setNewScreen] = useState({ name: '', location: '', resolution: '1920x1080' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const registerScreen = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/screens/register`, newScreen);
      toast.success('Screen Provisioned Successfully');
      setNewScreen({ name: '', location: '', resolution: '1920x1080' });
      refetch();
      if (fetchData) fetchData();
      
      // Prompt to copy token
      if (res.data.deviceToken) {
          navigator.clipboard.writeText(res.data.deviceToken);
          toast.success('Device Token copied to clipboard!', { icon: '🔑' });
      }
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const deleteScreen = async (id) => {
    if (!window.confirm('Are you sure? This will permanently de-authorize this screen.')) return;
    try {
      await api.delete(`/api/screens/${id}`);
      toast.success('Screen Terminated');
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error('Termination failed'); }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    toast.success('Token Copied');
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await refetch();
      setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
       {/* Provisioning Section */}
       <Card 
         className="lg:col-span-1" 
         title="Screen" 
         icon={Tv} 
         subtitle="Register New Screen"
       >
          <form onSubmit={registerScreen} className="space-y-6 mt-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Screen Identity</label>
               <input type="text" required className="nexus-input" placeholder="e.g. FRONT-DESK-01" value={newScreen.name} onChange={(e) => setNewScreen(p => ({ ...p, name: e.target.value }))}/>
             </div>
             
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Physical Location</label>
               <div className="relative">
                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input type="text" required className="nexus-input pl-10" placeholder="e.g. Main Lobby" value={newScreen.location} onChange={(e) => setNewScreen(p => ({ ...p, location: e.target.value }))}/>
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Native Resolution</label>
               <select className="nexus-input" value={newScreen.resolution} onChange={(e) => setNewScreen(p => ({ ...p, resolution: e.target.value }))}>
                  <option value="1920x1080">1080p (1920x1080)</option>
                  <option value="3840x2160">4K (3840x2160)</option>
                  <option value="1280x720">720p (1280x720)</option>
                  <option value="1080x1920">Portrait (1080x1920)</option>
               </select>
             </div>

             <button type="submit" className="nexus-btn-primary w-full py-4 font-black tracking-[4px] uppercase text-[11px] shadow-xl shadow-accent/20">
                AUTHORIZE SCREEN
             </button>
          </form>
       </Card>

       {/* Managed Screens Section */}
       <Card 
         className="lg:col-span-3" 
         title="Screen" 
         icon={Monitor} 
         subtitle={`Network Health: ${screens.filter(s => s.status === 'online').length}/${screens.length} Online`}
         actions={
             <button onClick={handleRefresh} className={`p-2 hover:bg-slate-100 rounded-xl transition-all ${isRefreshing ? 'animate-spin text-accent' : 'text-slate-400'}`}>
                 <RefreshCw size={18} />
             </button>
         }
       >
          <div className="overflow-hidden rounded-3xl border border-slate-200 mt-4">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-5 px-8">Screen Info</th>
                      <th className="py-5 px-8 text-center">Hardware Stats</th>
                      <th className="py-5 px-8">System Health</th>
                      <th className="py-5 px-8 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {isLoading ? (
                       <tr><td colSpan="4" className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-[6px] animate-pulse">Syncing Screen Inventory...</td></tr>
                   ) : screens.length === 0 ? (
                       <tr><td colSpan="4" className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-[6px]">No screens provisioned in this network</td></tr>
                   ) : (
                     screens.map(s => (
                       <tr key={s._id} className="group hover:bg-slate-50/80 transition-all duration-300">
                          <td className="py-6 px-8">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${s.status === 'online' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                   <Tv size={20} className={s.status === 'online' ? 'text-emerald-500' : 'text-slate-400'} />
                                </div>
                                <div>
                                   <p className="font-black text-text uppercase tracking-tighter text-base">{s.name}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.location}</span>
                                      <span className="text-slate-200">•</span>
                                      <span className="text-[9px] font-bold text-sky-500 uppercase tracking-widest tabular-nums">{s.resolution}</span>
                                   </div>
                                </div>
                             </div>
                          </td>
                          
                          <td className="py-6 px-8">
                             <div className="flex items-center justify-center gap-6">
                                <div className="text-center group/stat">
                                   <div className="flex items-center gap-1.5 justify-center text-slate-400 group-hover/stat:text-accent transition-colors">
                                      <Cpu size={12}/>
                                      <span className="text-[10px] font-black tabular-nums">{s.telemetry?.ramUsage || 0}%</span>
                                   </div>
                                   <p className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter mt-1">Memory</p>
                                </div>
                                <div className="text-center group/stat">
                                   <div className="flex items-center gap-1.5 justify-center text-slate-400 group-hover/stat:text-amber-500 transition-colors">
                                      <Zap size={12}/>
                                      <span className="text-[10px] font-black tabular-nums">{s.telemetry?.uptime ? Math.floor(s.telemetry.uptime / 3600) : 0}h</span>
                                   </div>
                                   <p className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter mt-1">Uptime</p>
                                </div>
                             </div>
                          </td>

                          <td className="py-6 px-8">
                             <div className="flex items-center gap-3">
                                <div className="relative">
                                   <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                   {s.status === 'online' && <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-40" />}
                                </div>
                                <div>
                                   <p className={`text-[10px] font-black uppercase tracking-widest ${s.status === 'online' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {s.status === 'online' ? 'Active Sync' : 'Offline'}
                                   </p>
                                   <p className="text-[9px] font-bold text-slate-400 mt-0.5 tabular-nums uppercase">
                                      {s.lastSeen ? new Date(s.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Standby'}
                                   </p>
                                </div>
                             </div>
                          </td>

                          <td className="py-6 px-8 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => copyToken(s.deviceToken)}
                                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-sky-600 hover:border-sky-100 hover:bg-sky-50 transition-all shadow-sm"
                                  title="Copy Authorization Token"
                                >
                                   <Copy size={14} />
                                </button>
                                <button 
                                  onClick={() => window.open(`/display?screenId=${s._id}`, '_blank')}
                                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 transition-all shadow-sm"
                                  title="Live Remote View"
                                >
                                   <ExternalLink size={14} />
                                </button>
                                <button 
                                  onClick={() => deleteScreen(s._id)}
                                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
                                  title="Terminate Connection"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>
                          </td>
                       </tr>
                     ))
                   )}
                </tbody>
             </table>
          </div>
       </Card>
    </div>
  );
};

export default ScreenManager;
