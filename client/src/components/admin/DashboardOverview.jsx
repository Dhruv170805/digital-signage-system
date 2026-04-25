import React from 'react';
import { Tv, Calendar, Timer, CheckSquare, Activity, Monitor, ExternalLink, Plus, FileText, Zap, Cpu, Wifi, ShieldCheck, ArrowUpRight, Layers, History as HistoryIcon } from 'lucide-react';

const DashboardOverview = ({ screens, schedules, pendingMedia, media, setActiveTab, setMonitorTarget }) => {
  return (
    <div className="animate-fade-in h-full flex flex-col">
       <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
          
          {/* STUDIO HEADER */}
          <div className="bg-black/10 p-8 border-b border-white/5 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-sky-500 animate-pulse" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-sky-500">System Pulse</span>
                    </div>
                    <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Command Dashboard</h2>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl border border-white/10">
                    <button className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-black shadow-xl">
                        Overview Studio
                    </button>
                </div>
            </div>

            {/* INTEGRATED TELEMETRY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Nodes Online', value: screens.filter(s => s.status === 'online').length, total: screens.length, icon: Tv, color: 'text-sky-500', bg: 'bg-sky-500/20' },
                    { label: 'Live Streams', value: schedules.length, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/20' },
                    { label: 'Policy Queue', value: pendingMedia.length, icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-500/20' },
                    { label: 'Asset Library', value: media.length, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/20' }
                ].map((stat, idx) => (
                    <div key={idx} className="p-5 bg-black/80 rounded-[32px] border border-white/10 flex items-center justify-between group overflow-hidden">
                        <div className="relative z-10">
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
                            <h4 className="text-2xl font-black text-white tabular-nums uppercase">
                                {stat.value} {stat.total && <span className="text-xs text-white/20">/ {stat.total}</span>}
                            </h4>
                        </div>
                        <stat.icon className={`${stat.bg} ${stat.color} p-2 rounded-xl group-hover:scale-110 transition-transform`} size={32} />
                    </div>
                ))}
            </div>
          </div>

          {/* STUDIO CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-50/50">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* NODE TOPOLOGY */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-3">
                                <div className="w-6 h-px bg-slate-200" /> Infrastructure Topology
                            </h4>
                            <button onClick={() => setActiveTab('screens')} className="text-[9px] font-black uppercase text-sky-600 hover:text-sky-700 transition-colors">View All Nodes</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {screens.slice(0, 6).map(s => (
                                <div key={s._id} className="p-6 bg-white border border-slate-200 rounded-[32px] group hover:border-sky-500/30 transition-all relative overflow-hidden shadow-sm">
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${s.status === 'online' ? 'bg-white border-sky-100 shadow-lg shadow-sky-500/5' : 'bg-slate-50 border-slate-100 grayscale'}`}>
                                            <Tv size={20} className={s.status === 'online' ? 'text-sky-500' : 'text-slate-400'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{s.location || 'Hub Root'}</p>
                                            </div>
                                            <h4 className="font-black text-text uppercase tracking-tight truncate text-base leading-none">{s.name}</h4>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setMonitorTarget({ type: 'screen', id: s._id });
                                                setActiveTab('live');
                                            }} 
                                            className="p-2 bg-slate-50 text-slate-400 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <ArrowUpRight size={14}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {screens.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white">
                                    <Monitor size={40} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">Topology Offline</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RAPID ACTIONS */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-3 px-2">
                            <div className="w-6 h-px bg-slate-200" /> Rapid Operations
                        </h4>
                        
                        <div className="bg-slate-900 border border-slate-800 rounded-[48px] p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50" />
                            <div className="relative z-10 space-y-4">
                                {[
                                    { label: 'Moderate Requests', tab: 'approve', icon: ShieldCheck, color: 'text-rose-400', bg: 'bg-rose-400/10' },
                                    { label: 'Broadcast System', tab: 'schedule', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                                    { label: 'Architect Studio', tab: 'templates', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                                    { label: 'Event Workspace', tab: 'history', icon: HistoryIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
                                ].map(btn => (
                                    <button 
                                        key={btn.tab}
                                        onClick={() => setActiveTab(btn.tab)}
                                        className="w-full p-5 bg-white/5 border border-white/5 rounded-[24px] flex items-center justify-between group/btn hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${btn.bg} rounded-xl flex items-center justify-center ${btn.color} transition-transform group-hover/btn:scale-110`}>
                                                <btn.icon size={18} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-white tracking-[2px]">{btn.label}</span>
                                        </div>
                                        <ArrowUpRight className="text-white/20 group-hover/btn:text-white transition-all" size={16} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-sky-500" size={16} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security Pulse</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Engine Uptime</span>
                                    <span className="text-[10px] font-black text-text uppercase">99.9%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sync Latency</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase">12ms</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
          </div>
       </div>
    </div>
  );
};

export default DashboardOverview;
