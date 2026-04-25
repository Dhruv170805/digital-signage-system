import React from 'react';
import { Tv, Calendar, Activity, Monitor, FileText, Zap, ShieldCheck, Layers, Type as TypeIcon } from 'lucide-react';

const DashboardOverview = ({ screens, schedules, pendingMedia, media, setActiveTab }) => {
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

          {/* STUDIO CONTENT - Centered single-row focus */}
          <div className="flex-1 overflow-hidden p-10 bg-slate-50/50 flex flex-col justify-center">
                
                {/* HORIZONTAL RAPID OPERATIONS (Static Focus) */}
                <section className="max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <Zap className="text-amber-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">System Rapid Operations</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-[48px] p-12 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50" />
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                            {[
                                { label: 'Moderate Requests', tab: 'approve', icon: ShieldCheck, color: 'text-rose-400', bg: 'bg-rose-400/10' },
                                { label: 'Broadcast System', tab: 'schedule', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                                { label: 'Architect Studio', tab: 'templates', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                                { label: 'Ticker Studio', tab: 'ticker', icon: TypeIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
                            ].map(btn => (
                                <button 
                                    key={btn.tab}
                                    onClick={() => setActiveTab(btn.tab)}
                                    className="p-8 bg-white/5 border border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center group/btn hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                                >
                                    <div className={`w-16 h-16 ${btn.bg} rounded-3xl flex items-center justify-center ${btn.color} transition-transform group-hover/btn:rotate-12 mb-6 shadow-2xl`}>
                                        <btn.icon size={32} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-white tracking-[3px]">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
          </div>
       </div>
    </div>
  );
};

export default DashboardOverview;
