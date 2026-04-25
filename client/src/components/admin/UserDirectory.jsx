import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Shield, Mail, Key, RefreshCw, Zap, ShieldCheck, ShieldAlert, ChevronRight, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UserDirectory = ({ users = [], fetchData }) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

  const registerUser = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/auth/register`, newUser);
      toast.success('Personnel Authorized');
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchData();
      setActiveTab('inventory');
    } catch (err) { toast.error(err.response?.data?.error || 'Authorization failed'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Terminate personnel access?')) return;
    try {
      await api.delete(`/api/auth/users/${id}`);
      toast.success('Access Terminated');
      fetchData();
    } catch (err) { toast.error('Termination failed'); }
  };

  const toggleUserLock = async (user) => {
    const isCurrentlyLocked = user.status === 'locked';
    try {
        const endpoint = `/api/auth/users/${user._id}/${isCurrentlyLocked ? 'unlock' : 'lock'}`;
        await api.post(endpoint);
        toast.success(`Personnel access ${isCurrentlyLocked ? 'restored' : 'suspended'}`);
        fetchData();
    } catch (err) { toast.error('Lock state update failed'); }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
          
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-indigo-600" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Human Resources</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Personnel Directory</h2>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Onboarding</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>Registry ({users.length})</button>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-white">
            {activeTab === 'editor' ? (
                <form onSubmit={registerUser} className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-white">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-indigo-600/30" /> Identity Protocol</h4>
                            <div className="space-y-8">
                                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Full Name</label><input type="text" required className="nexus-input bg-slate-50 border-slate-200" placeholder="Operator Name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})}/></div>
                                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Secure Email</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="email" required className="nexus-input bg-slate-50 pl-11 border-slate-200" placeholder="identity@nexus.engine" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}/></div></div>
                            </div>
                        </section>
                    </div>
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-emerald-600/30" /> Security Clearance</h4>
                            <div className="space-y-8">
                                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Access Tier</label><select className="nexus-input bg-white border-slate-200" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}><option value="user">Standard Operator</option><option value="admin">System Admin</option></select></div>
                                <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Password</label><div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="password" required className="nexus-input bg-white pl-11 border-slate-200" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}/></div></div>
                                <button type="submit" className="nexus-btn-primary w-full py-6 text-[10px] tracking-[6px] uppercase shadow-2xl shadow-indigo-200 mt-4">AUTHORIZE PERSONNEL</button>
                            </div>
                        </section>
                    </div>
                </form>
            ) : (
                <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                    <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest"><th className="py-6 px-8">Identity</th><th className="py-6 px-8">Tier</th><th className="py-6 px-8">Status</th><th className="py-6 px-8 text-right">Actions</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-6 px-8"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 font-black text-xs uppercase">{u.name.charAt(0)}</div><div><p className="font-black text-slate-900 uppercase text-sm tracking-tight">{u.name}</p><p className="text-[10px] font-bold text-slate-400 lowercase">{u.email}</p></div></div></td>
                                        <td className="py-6 px-8"><div className="flex items-center gap-2">{u.role === 'admin' ? <ShieldCheck className="text-emerald-500" size={14}/> : <Shield className="text-sky-500" size={14}/>}<span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${u.role === 'admin' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>{u.role}</span></div></td>
                                        <td className="py-6 px-8"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${u.status === 'locked' ? 'bg-rose-500' : 'bg-emerald-500'}`} /><span className={`text-[9px] font-black uppercase tracking-widest ${u.status === 'locked' ? 'text-rose-600' : 'text-emerald-600'}`}>{u.status === 'locked' ? 'Suspended' : 'Authorized'}</span></div></td>
                                        <td className="py-6 px-8 text-right"><div className="flex justify-end gap-2"><button onClick={() => toggleUserLock(u)} className={`p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${u.status === 'locked' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'}`}>{u.status === 'locked' ? <Key size={16}/> : <ShieldAlert size={16}/>}</button><button onClick={() => deleteUser(u._id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>
       </div>
  );
};

export default UserDirectory;
