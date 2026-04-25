import React, { useState } from 'react';
import { Tv, Monitor, Trash2, Cpu, HardDrive, Zap, Copy, ExternalLink, RefreshCw, MapPin } from 'lucide-react';
import api from '../../services/api';
import { useScreens } from '../../hooks/useAdminData';
import toast from 'react-hot-toast';
import Card from './Card';

const ScreenManager = ({ fetchData }) => {
  const { data: screens = [], refetch, isLoading } = useScreens();
  const [groups, setGroups] = useState([]);
  const [newScreen, setNewScreen] = useState({ name: '', location: '', resolution: '1920x1080', groupId: '' });
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data);
    } catch (err) { console.error('Failed to load groups'); }
  };

  React.useEffect(() => { fetchGroups(); }, []);

  const registerScreen = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/screens/register`, newScreen);
      toast.success('Screen Provisioned Successfully');
      setNewScreen({ name: '', location: '', resolution: '1920x1080', groupId: '' });
      refetch();
      if (fetchData) fetchData();
      
      // Prompt to copy token
      if (res.data.deviceToken) {
          navigator.clipboard.writeText(res.data.deviceToken);
          toast.success('Device Token copied to clipboard!', { icon: '🔑' });
      }
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/groups', newGroup);
      toast.success('Group Created');
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (err) { toast.error('Failed to create group'); }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm('Delete group? Screens will be unassigned.')) return;
    try {
      await api.delete(`/api/groups/${id}`);
      toast.success('Group Deleted');
      fetchGroups();
      refetch();
    } catch (err) { toast.error('Failed to delete group'); }
  };

  const updateScreenGroup = async (screenId, groupId) => {
      try {
          await api.put(`/api/screens/${screenId}`, { groupId: groupId || null });
          toast.success('Screen Group Updated');
          refetch();
      } catch (err) { toast.error('Failed to update group'); }
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
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Provisioning Section */}
        <Card 
            className="lg:col-span-1" 
            title="Provision" 
            icon={Tv} 
            subtitle="Authorize Node"
        >
            <form onSubmit={registerScreen} className="space-y-6 mt-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Identity</label>
                    <input type="text" required className="nexus-input" placeholder="e.g. FRONT-DESK-01" value={newScreen.name} onChange={(e) => setNewScreen(p => ({ ...p, name: e.target.value }))}/>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Location</label>
                    <input type="text" required className="nexus-input" placeholder="e.g. Lobby" value={newScreen.location} onChange={(e) => setNewScreen(p => ({ ...p, location: e.target.value }))}/>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Initial Group</label>
                    <select className="nexus-input" value={newScreen.groupId} onChange={(e) => setNewScreen(p => ({ ...p, groupId: e.target.value }))}>
                        <option value="">Unassigned</option>
                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                    </select>
                </div>

                <button type="submit" className="nexus-btn-primary w-full py-4 font-black tracking-[4px] uppercase text-[11px]">
                    AUTHORIZE SCREEN
                </button>
            </form>
        </Card>

        {/* Groups Section */}
        <Card 
            className="lg:col-span-1" 
            title="Screen Groups" 
            icon={MapPin} 
            subtitle="Cluster Management"
        >
            <form onSubmit={createGroup} className="space-y-4 mt-4">
                <input type="text" required className="nexus-input py-2 text-xs" placeholder="Group Name" value={newGroup.name} onChange={(e) => setNewGroup(p => ({ ...p, name: e.target.value }))}/>
                <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Create Group</button>
            </form>

            <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {groups.map(g => (
                    <div key={g._id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group/g">
                        <span className="text-[10px] font-black text-text uppercase">{g.name}</span>
                        <button onClick={() => deleteGroup(g._id)} className="opacity-0 group-hover/g:opacity-100 text-rose-500 transition-opacity"><Trash2 size={12}/></button>
                    </div>
                ))}
            </div>
        </Card>

        {/* Managed Screens Section */}
        <Card 
            className="lg:col-span-2" 
            title="Network Inventory" 
            icon={Monitor} 
            subtitle={`Health: ${screens.filter(s => s.status === 'online').length}/${screens.length} Online`}
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
                        <th className="py-5 px-8">Screen</th>
                        <th className="py-5 px-8">Group assignment</th>
                        <th className="py-5 px-8 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {screens.map(s => (
                        <tr key={s._id} className="group hover:bg-slate-50/80 transition-all">
                            <td className="py-6 px-8">
                                <p className="font-black text-text uppercase text-xs">{s.name}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.location}</p>
                            </td>
                            <td className="py-6 px-8">
                                <select 
                                    className="bg-transparent border-none text-[10px] font-black uppercase text-sky-600 outline-none"
                                    value={s.groupId?._id || s.groupId || ''} 
                                    onChange={(e) => updateScreenGroup(s._id, e.target.value)}
                                >
                                    <option value="">No Group</option>
                                    {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                </select>
                            </td>
                            <td className="py-6 px-8 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => copyToken(s.deviceToken)} className="p-2 text-slate-400 hover:text-sky-600 transition-colors" title="Copy Token"><Copy size={14} /></button>
                                    <button onClick={() => deleteScreen(s._id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default ScreenManager;
