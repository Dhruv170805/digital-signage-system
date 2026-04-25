import React, { useState } from 'react';
import { Monitor, AlertCircle, Info, RefreshCw, Database, ShieldAlert, Cpu, HardDrive, Zap, Settings as SettingsIcon, AlertTriangle, ShieldCheck, Activity, Globe, Smartphone, Lock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SystemSettings = ({ fetchData }) => {
  const [resetTargetType, setResetTargetType] = useState('all');
  const [resetTargetId, setResetTargetId] = useState('');
  const [resetChallenge, setResetChallenge] = useState('');
  const [wipeChallenge, setWipeChallenge] = useState('');

  const executeSystemReset = async () => {
    if (resetChallenge !== 'RESET') return toast.error('Security handshake failed');
    if (!window.confirm('Wipe active streams?')) return;
    try {
      await api.post(`/api/screens/reset`, { targetType: resetTargetType, targetId: resetTargetId });
      toast.success('Protocol Reset Complete');
      setResetChallenge('');
    } catch (err) { toast.error('Reset failed'); }
  };

  const executeFullPurge = async () => {
    if (wipeChallenge !== 'WIPE SYSTEM') return toast.error('Master authorization failed');
    if (!window.confirm('Execute Global System Wipe? This cannot be undone.')) return;
    try {
      await api.post(`/api/settings/wipe`);
      toast.success('System Purged');
      window.location.reload();
    } catch (err) { toast.error('Purge failure'); }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
          
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2"><SettingsIcon className="text-rose-600" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-rose-600">Root Access</span></div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-text">System Settings</h2>
                </div>
                <div className="px-6 py-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl"><span className="text-[10px] font-black uppercase text-white tracking-[2px]">Admin Maintenance Mode</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Engine Latency</p><h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">12ms <span className="text-xs text-slate-400 font-bold ml-1">STABLE</span></h4></div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><Activity className="text-indigo-600" size={24} /></div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div><p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1">Storage Cluster</p><h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">94% <span className="text-xs text-slate-400 font-bold ml-1">FREE</span></h4></div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><Database className="text-sky-600" size={24} /></div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-center justify-between group">
                    <div><p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Sync Integrity</p><h4 className="text-2xl font-black text-slate-900 tabular-nums uppercase">Active <span className="text-xs text-slate-400 font-bold ml-1">LOCKED</span></h4></div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:rotate-12 transition-transform"><ShieldCheck className="text-rose-600" size={24} /></div>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-white">
                <div className="h-full flex flex-col lg:flex-row divide-x divide-slate-200">
                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-white">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-sky-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-sky-600/30" /> Maintenance Protocol</h4>
                            <div className="p-10 bg-slate-50 border border-slate-200 rounded-[48px] shadow-inner space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Target Cluster</label><select className="nexus-input bg-white border-slate-200" value={resetTargetType} onChange={(e) => setResetTargetType(e.target.value)}><option value="all">Global Network</option><option value="screen">Specific Node ID</option></select></div>
                                    {resetTargetType === 'screen' && (<div className="space-y-2 animate-fade-in"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Node identifier</label><input type="text" className="nexus-input bg-white border-slate-200" placeholder="UUID Trace..." value={resetTargetId} onChange={(e) => setResetTargetId(e.target.value)}/></div>)}
                                    <div className="space-y-2 pt-6 border-t border-slate-200"><label className="text-[9px] font-black uppercase text-rose-600 ml-1 tracking-[4px]">Access Challenge</label><input type="text" className="nexus-input bg-white border-rose-100 placeholder:text-rose-200 font-black text-center text-lg" placeholder="TYPE 'RESET'" value={resetChallenge} onChange={(e) => setResetChallenge(e.target.value)}/></div>
                                    <button disabled={resetChallenge !== 'RESET'} onClick={executeSystemReset} className="w-full py-6 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[6px] hover:bg-black transition-all shadow-2xl disabled:opacity-20">EXECUTE RESET PROTOCOL</button>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="lg:w-1/2 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
                        <section>
                            <h4 className="text-[10px] font-black uppercase text-rose-600 mb-8 flex items-center gap-3"><div className="w-6 h-px bg-rose-600/30" /> Master Purge Protocol</h4>
                            <div className="p-10 bg-rose-50 border border-rose-100 rounded-[48px] shadow-inner space-y-8">
                                <div className="p-6 bg-white border border-rose-200 rounded-3xl flex items-start gap-4 shadow-sm text-text"><AlertTriangle className="text-rose-600 shrink-0" size={24}/><p className="text-[11px] font-black text-rose-900 leading-relaxed uppercase">Attention: Global purge will permanently delete all metadata, assets, layouts, and cluster protocols.</p></div>
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-rose-600 ml-1 tracking-[4px]">Master Authorization</label><input type="text" className="nexus-input bg-white border-rose-200 placeholder:text-rose-200 font-black text-center text-lg" placeholder="TYPE 'WIPE SYSTEM'" value={wipeChallenge} onChange={(e) => setWipeChallenge(e.target.value)}/></div>
                                    <button disabled={wipeChallenge !== 'WIPE SYSTEM'} onClick={executeFullPurge} className="w-full py-6 bg-rose-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[6px] hover:bg-rose-700 transition-all shadow-2xl shadow-rose-200 disabled:opacity-20">AUTHORIZE SYSTEM WIPE</button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
          </div>
       </div>
  );
};

export default SystemSettings;
