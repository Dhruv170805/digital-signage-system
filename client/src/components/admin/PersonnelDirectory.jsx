import React, { useState } from 'react';
import { Users as UsersIcon, Plus, CheckCircle, Lock, Trash2, Clock } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import Card from './Card';

const Badge = ({ label, type }) => {
  const colors = {
    admin: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    user: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    locked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    reset: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${colors[type] || 'bg-slate-100 text-text-dim border-slate-200'}`}>
      {label}
    </span>
  );
};

const PersonnelDirectory = ({ users, fetchData }) => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const loggedInUser = useAuthStore((state) => state.user);

  const provisionUser = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/auth/register`, newUser);
      toast.success('User Provisioned');
      setShowUserForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const unlockUser = async (id) => {
    try {
      await api.post(`/api/auth/users/${id}/unlock`, {});
      toast.success('Account Unlocked');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const lockUser = async (id) => {
    try {
      await api.post(`/api/auth/users/${id}/lock`, {});
      toast.success('Account Locked');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Purge personnel records?')) return;
    try {
      await api.delete(`/api/auth/users/${id}`);
      toast.success('Record Purged');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const approveReset = async (id) => {
    const pw = prompt('Set Temporary Password:');
    if (!pw) return;
    try {
      await api.post(`/api/auth/users/${id}/approve-reset`, { newPassword: pw });
      toast.success('Password Updated');
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Reset failed.'); 
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {showUserForm ? (
        <Card 
          className="max-w-xl mx-auto p-10" 
          title="Personnel Provisioning" 
          icon={Plus} 
          subtitle="New Station Operator"
        >
          <form onSubmit={provisionUser} className="space-y-6 mt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Legal Name</label>
              <input type="text" required className="nexus-input" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Secure Email</label>
              <input type="email" required className="nexus-input" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Password</label>
              <input type="password" required className="nexus-input" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Clearance Level</label>
              <select className="nexus-input" value={newUser.role} onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}>
                <option value="user">Standard User</option>
                <option value="admin">Root Administrator</option>
              </select>
            </div>
            <button type="submit" className="nexus-btn-primary w-full py-4 mt-4 font-black tracking-widest uppercase">PROVISION ACCOUNT</button>
            <button type="button" onClick={() => setShowUserForm(false)} className="w-full text-[10px] font-black uppercase tracking-widest text-text-dim mt-2 hover:text-text transition-colors">Cancel</button>
          </form>
        </Card>
      ) : (
        <Card 
          title="Personnel Directory" 
          icon={UsersIcon} 
          subtitle={`Total Authorized: ${users.length} Operators`}
        >
          <div className="flex justify-end mb-8 mt-[-60px]">
             <button onClick={() => setShowUserForm(true)} className="nexus-btn-primary text-xs py-2 px-6 shadow-xl">+ Add User</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-black text-text-dim">
                  <th className="py-4 px-6">Identity</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">System Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u._id || u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-6 px-6">
                       <p className="font-bold text-lg leading-none text-text">{u.name}</p>
                       <p className="text-[10px] font-bold text-text-dim uppercase tracking-tighter mt-1">{u.email}</p>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-2">
                        <Badge label={u.role} type={u.role}/>
                        {u.isLocked && <Badge label="Locked" type="locked"/>}
                        {u.passwordResetRequested && <Badge label="Reset Requested" type="reset"/>}
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                           <span className="text-[10px] font-black uppercase text-text-dim">{u.status}</span>
                        </div>
                        <div className="flex gap-2">
                          {u.email !== loggedInUser?.email && (
                            <>
                              {u.isLocked ? (
                                <button onClick={() => unlockUser(u.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors" title="Unlock Account"><CheckCircle size={14}/></button>
                              ) : (
                                <button onClick={() => lockUser(u.id)} className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-colors" title="Lock Account"><Lock size={14}/></button>
                              )}
                              <button onClick={() => deleteUser(u.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Delete User"><Trash2 size={14}/></button>
                            </>
                          )}
                          {u.passwordResetRequested && (
                            <button onClick={() => approveReset(u.id)} className="p-2 bg-sky-500/10 text-sky-600 rounded-lg hover:bg-sky-500 hover:text-white transition-colors" title="Approve Reset"><Clock size={14}/></button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PersonnelDirectory;
