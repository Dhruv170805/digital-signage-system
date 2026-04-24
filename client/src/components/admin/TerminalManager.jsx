import React, { useState } from 'react';
import { Tv, Monitor } from 'lucide-react';
import api from '../../services/api';
import { useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';
import Card from './Card';

const TerminalManager = ({ fetchData }) => {
  const { data: screens = [], refetch } = useScreens();
  const [newScreen, setNewScreen] = useState({ name: '', location: '' });

  const registerScreen = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/screens/register`, newScreen);
      toast.success('Screen Registered');
      setNewScreen({ name: '', location: '' });
      refetch();
      if (fetchData) fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
       <Card 
         className="lg:col-span-1" 
         title="Provision Unit" 
         icon={Tv} 
         subtitle="Terminal Registration"
       >
          <form onSubmit={registerScreen} className="space-y-6">
             <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase ml-1 opacity-40">Screen ID / Name</label>
               <input type="text" required className="nexus-input" placeholder="e.g., LOBBY-SCREEN-01" value={newScreen.name} onChange={(e) => setNewScreen(p => ({ ...p, name: e.target.value }))}/>
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase ml-1 opacity-40">Physical Location</label>
               <input type="text" required className="nexus-input" placeholder="e.g., North Wing Entrance" value={newScreen.location} onChange={(e) => setNewScreen(p => ({ ...p, location: e.target.value }))}/>
             </div>
             <button type="submit" className="nexus-btn-primary w-full py-4 font-black tracking-widest uppercase">PROVISION SCREEN</button>
          </form>
       </Card>

       <Card 
         className="lg:col-span-3" 
         title="Managed Terminals" 
         icon={Monitor} 
         subtitle={`Network Inventory: ${screens.length} Nodes`}
       >
          <div className="overflow-hidden rounded-2xl border border-slate-200">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 text-[9px] font-black uppercase text-text-dim">
                      <th className="py-4 px-6">Identity</th>
                      <th className="py-4 px-6">Location</th>
                      <th className="py-4 px-6">System Status</th>
                      <th className="py-4 px-6">Last Activity</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {screens.map(s => (
                     <tr key={s._id || s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                           <p className="font-bold text-text uppercase text-sm tracking-tight">{s.name}</p>
                           <p className="text-[8px] font-bold text-sky-600/60 uppercase mt-0.5 tracking-widest">ID: {(s._id || s.id).slice(-8)}</p>
                        </td>
                        <td className="py-5 px-6 text-[10px] font-bold uppercase text-text-dim">{s.location}</td>
                        <td className="py-5 px-6">
                           <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                              <span className={`text-[10px] font-black uppercase ${s.status === 'online' ? 'text-emerald-600' : 'text-text-dim'}`}>{s.status}</span>
                           </div>
                        </td>
                        <td className="py-5 px-6 text-[10px] font-bold tabular-nums text-text-dim">
                           {s.lastPing ? new Date(s.lastPing).toLocaleTimeString() : 'NEVER'}
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

export default TerminalManager;
