import React, { useState } from 'react';
import { Monitor, AlertCircle, Info, RefreshCw, Database, ShieldAlert, Cpu, HardDrive, Zap, Settings as SettingsIcon, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SystemSettings = ({ fetchData }) => {
  const [resetTargetType, setResetTargetType] = useState('all');
  const [resetTargetId, setResetTargetId] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); 
  
  const [resetChallenge, setResetChallenge] = useState('');
  const [wipeChallenge, setWipeChallenge] = useState('');

  const executeSystemReset = async () => {
    if (resetChallenge !== 'RESET') return toast.error('Security verification failed');
    if (!window.confirm('CRITICAL: Purge all active transmissions?')) return;
    try {
      await api.post(`/api/screens/reset`, { targetType: resetTargetType, targetId: resetTargetId });
      toast.success('System State Reset Synchronized');
      setResetChallenge('');
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const executeFullPurge = async () => {
    if (wipeChallenge !== 'WIPE SYSTEM') return toast.error('Security verification failed');
    if (!window.confirm('DANGER: Execute global system wipe? All data will be permanently deleted.')) return;
    try {
      await api.post(`/api/settings/wipe`);
      toast.success('Global System Purge Executed');
      window.location.reload();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          
          {/* HEADER */}
          <div className="bg-black/10 p-8 border-b border-white/5 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <SettingsIcon className="text-rose-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-rose-500">Root Infrastructure</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">System Configuration</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-black shadow-xl">
                        Maintenance Console
                    </button>
                </div>
            </div>

            {/* INTEGRATED SYSTEM TELEMETRY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-black/80 rounded-[32px] border border-white/10 flex items-center justify-between group overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Engine Status</p>
                        <h4 className="text-2xl font-black text-white tabular-nums uppercase">Operational</h4>
                    </div>
                    <Cpu className="text-blue-500/20 group-hover:scale-125 transition-transform" size={48} />
                </div>
                <div className="p-6 bg-black/80 rounded-[32px] border border-white/10 flex items-center justify-between group overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Database Sync</p>
                        <h4 className="text-2xl font-black text-white tabular-nums uppercase">Active</h4>
                    </div>
                    <Database className="text-emerald-500/20 group-hover:scale-125 transition-transform" size={48} />
                </div>
                <div className="p-6 bg-black/80 rounded-[32px] border border-white/10 flex items-center justify-between group overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Network Latency</p>
                        <h4 className="text-2xl font-black text-white tabular-nums uppercase">12ms</h4>
                    </div>
                    <Zap className="text-amber-500/20 group-hover:scale-125 transition-transform" size={48} />
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200/50">
                    
                    {/* LEFT: Maintenance Studio */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-sky-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-sky-600/30" /> Maintenance Studio
                            </h4>
                            <div className="p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm space-y-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <RefreshCw className="text-sky-500" size={18} />
                                        <h4 className="text-[10px] font-black uppercase text-sky-600 tracking-widest">Protocol: Reset</h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Clear all active assignments and force nodes back to standby states.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Target Cluster</label>
                                        <select className="nexus-input bg-slate-50" value={resetTargetType} onChange={(e) => setResetTargetType(e.target.value)}>
                                            <option value="all">Global System</option>
                                            <option value="screen">Specific Node ID</option>
                                        </select>
                                    </div>

                                    {resetTargetType === 'screen' && (
                                        <div className="space-y-2 animate-fade-in">
                                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Node Identifier</label>
                                            <input type="text" className="nexus-input bg-slate-50" placeholder="Enter node UUID..." value={resetTargetId} onChange={(e) => setResetTargetId(e.target.value)}/>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-4 border-t border-slate-100">
                                        <label className="text-[9px] font-black uppercase text-rose-500 ml-1 tracking-widest">Security Challenge</label>
                                        <input 
                                            type="text" 
                                            className="nexus-input bg-rose-50/30 border-rose-100 placeholder:text-rose-200 font-black text-center" 
                                            placeholder="TYPE 'RESET' TO AUTHORIZE" 
                                            value={resetChallenge} 
                                            onChange={(e) => setResetChallenge(e.target.value)}
                                        />
                                    </div>

                                    <button 
                                        disabled={resetChallenge !== 'RESET'}
                                        onClick={executeSystemReset} 
                                        className="w-full py-5 bg-sky-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[4px] hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20 disabled:opacity-30 disabled:grayscale"
                                    >
                                        EXECUTE RESET PROTOCOL
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT: Security Protocols */}
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-rose-600 mb-8 flex items-center gap-3">
                                <div className="w-6 h-px bg-rose-600/30" /> Security Protocols
                            </h4>
                            <div className="p-8 bg-rose-50 border border-rose-100 rounded-[40px] shadow-sm space-y-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShieldAlert className="text-rose-600" size={18} />
                                        <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Protocol: Purge</h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-rose-400 uppercase leading-relaxed italic">Warning: This action terminates the primary database manifest.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-white border border-rose-200 rounded-3xl flex items-start gap-4">
                                        <AlertTriangle className="text-rose-600 mt-1" size={20}/>
                                        <p className="text-[10px] font-black text-rose-700 leading-relaxed uppercase">Confirmed purge will delete all assets, schedules, layouts, and node authorizations permanently.</p>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t border-rose-200">
                                        <label className="text-[9px] font-black uppercase text-rose-600 ml-1 tracking-widest">Global Master Authorization</label>
                                        <input 
                                            type="text" 
                                            className="nexus-input bg-white border-rose-300 placeholder:text-rose-200 font-black text-center" 
                                            placeholder="TYPE 'WIPE SYSTEM' TO AUTHORIZE" 
                                            value={wipeChallenge} 
                                            onChange={(e) => setWipeChallenge(e.target.value)}
                                        />
                                    </div>

                                    <button 
                                        disabled={wipeChallenge !== 'WIPE SYSTEM'}
                                        onClick={executeFullPurge} 
                                        className="w-full py-5 bg-rose-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[4px] hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 disabled:opacity-30 disabled:grayscale"
                                    >
                                        CONFIRM SYSTEM WIPE
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
          </div>
       </div>
    </div>
  );
};

export default SystemSettings;
