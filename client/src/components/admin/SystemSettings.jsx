import React, { useState } from 'react';
import { Monitor, AlertCircle, Info, RefreshCw, Database, ShieldAlert, Cpu, HardDrive, Zap, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SystemSettings = ({ fetchData }) => {
  const [resetTargetType, setResetTargetType] = useState('all');
  const [resetTargetId, setResetTargetId] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // Using editor for consistent Tab look

  const executeSystemReset = async () => {
    if (!window.confirm('CRITICAL: Purge all active transmissions and reset target state?')) return;
    try {
      await api.post(`/api/screens/reset`, { targetType: resetTargetType, targetId: resetTargetId });
      toast.success('System State Reset Synchronized');
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const executeFullPurge = async () => {
    if (!window.confirm('DANGER: Execute global system wipe? All media, schedules, and configurations will be permanently deleted.')) return;
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
          <div className="bg-black/10 p-8 border-b border-white/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <SettingsIcon className="text-rose-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-rose-500">Root Infrastructure</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">System Configuration</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-text'}`}>
                        Maintenance Console
                    </button>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  
                  {/* SYSTEM RESET */}
                  <section className="p-10 bg-white border border-slate-200 rounded-[40px] shadow-sm space-y-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                            <RefreshCw className="text-sky-500" size={18} />
                            <h4 className="text-[10px] font-black uppercase text-sky-600 tracking-widest">Operation: Reset</h4>
                        </div>
                        <p className="text-xl font-black text-text uppercase tracking-tight">Transmission Reset</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">Clear all active assignments and stop playback for specific targets.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Target Cluster</label>
                            <select className="nexus-input bg-slate-50" value={resetTargetType} onChange={(e) => setResetTargetType(e.target.value)}>
                                <option value="all">Global System</option>
                                <option value="screen">Specific Screen ID</option>
                            </select>
                        </div>

                        {resetTargetType === 'screen' && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Screen Identifier</label>
                                <input type="text" className="nexus-input bg-slate-50" placeholder="Enter screen UUID..." value={resetTargetId} onChange={(e) => setResetTargetId(e.target.value)}/>
                            </div>
                        )}

                        <button onClick={executeSystemReset} className="w-full py-5 bg-sky-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[4px] hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20">
                            EXECUTE RESET PROTOCOL
                        </button>
                      </div>
                  </section>

                  {/* DANGER ZONE */}
                  <section className="p-10 bg-rose-50 border border-rose-100 rounded-[40px] shadow-sm space-y-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldAlert className="text-rose-600" size={18} />
                            <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Operation: Purge</h4>
                        </div>
                        <p className="text-xl font-black text-rose-600 uppercase tracking-tight">Core System Wipe</p>
                        <p className="text-[10px] font-bold text-rose-400 uppercase mt-2 leading-relaxed italic">Warning: This action is irreversible. All data will be destroyed.</p>
                      </div>

                      <div className="pt-10">
                        <div className="p-6 bg-white/50 border border-rose-200 rounded-3xl mb-8 flex items-start gap-4">
                            <AlertTriangle className="text-rose-600 mt-1" size={20}/>
                            <p className="text-[10px] font-black text-rose-700 leading-relaxed uppercase">Initiating this command will terminate all active nodes and clear the primary database manifest.</p>
                        </div>
                        <button onClick={executeFullPurge} className="w-full py-5 bg-rose-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[4px] hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20">
                            CONFIRM SYSTEM WIPE
                        </button>
                      </div>
                  </section>

              </div>

              {/* SYSTEM STATS PLACEHOLDER */}
              <section className="p-10 bg-black rounded-[40px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50" />
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="space-y-4">
                          <div className="flex items-center gap-3">
                              <Cpu className="text-blue-500" size={16}/>
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Engine Status</span>
                          </div>
                          <p className="text-4xl font-black text-white uppercase tracking-tighter">Operational</p>
                          <div className="h-1 w-20 bg-blue-500 rounded-full" />
                      </div>
                      <div className="space-y-4">
                          <div className="flex items-center gap-3">
                              <Database className="text-emerald-500" size={16}/>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Database Sync</span>
                          </div>
                          <p className="text-4xl font-black text-white uppercase tracking-tighter">Active</p>
                          <div className="h-1 w-20 bg-emerald-500 rounded-full" />
                      </div>
                      <div className="space-y-4">
                          <div className="flex items-center gap-3">
                              <Zap className="text-amber-500" size={16}/>
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Network Latency</span>
                          </div>
                          <p className="text-4xl font-black text-white uppercase tracking-tighter">12ms</p>
                          <div className="h-1 w-20 bg-amber-500 rounded-full" />
                      </div>
                  </div>
              </section>

          </div>
       </div>
    </div>
  );
};

export default SystemSettings;
