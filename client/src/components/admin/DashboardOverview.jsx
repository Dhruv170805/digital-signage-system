import React from 'react';
import { Tv, Calendar, Activity, Monitor, FileText, Zap, ShieldCheck, Layers, Type as TypeIcon, ChevronRight, Users, History } from 'lucide-react';
import useSocketStore from '../../store/useSocketStore';

const DashboardOverview = ({ screens, schedules, pendingMedia, media, setActiveTab }) => {
  const connected = useSocketStore(state => state.connected);

  return (
    <div className="animate-fade-in h-full flex flex-col">
          
          {/* DASHBOARD HEADER */}
          <div className="bg-white p-10 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className={`${connected ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`} size={16} />
                        <span className={`text-[10px] font-black uppercase tracking-[4px] ${connected ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {connected ? 'System Status' : 'System Offline'}
                        </span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter text-text">Dashboard</h2>
                </div>

                <div className="flex gap-4">
                    <div className={`flex items-center gap-3 px-6 py-3 ${connected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'} border rounded-2xl transition-all`}>
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest font-black ${connected ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {connected ? 'System Online' : 'Connecting...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Screens Online', value: screens.filter(s => s.status === 'online').length, total: screens.length, icon: Tv, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', tab: 'screens' },
                    { label: 'Active Broadcasts', value: schedules.length, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tab: 'schedule' },
                    { label: 'Needs Approval', value: pendingMedia.length, icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tab: 'approve' },
                    { label: 'Media Library', value: media.length, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tab: 'schedule' }
                ].map((stat, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setActiveTab(stat.tab)}
                        className={`p-8 ${stat.bg} rounded-[32px] border ${stat.border} flex flex-col group hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer shadow-sm active:scale-95`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <stat.icon className={`${stat.color}`} size={28} />
                            <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                            <h4 className="text-3xl font-black text-slate-900 tabular-nums uppercase">
                                {stat.value} {stat.total !== undefined && <span className="text-sm font-bold text-slate-300 ml-1">/ {stat.total}</span>}
                            </h4>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="flex-1 overflow-hidden p-10 bg-slate-50/30 flex flex-col justify-center">
                
                <section className="max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <Zap className="text-indigo-600" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Quick Links</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Users', desc: 'Manage user access', tab: 'users', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
                            { label: 'History', desc: 'Trace system signals', tab: 'history', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
                            { label: 'Templates', desc: 'Create layout protocols', tab: 'templates', icon: FileText, color: 'text-sky-600', bg: 'bg-sky-100/50' },
                            { label: 'Tickers', desc: 'Configure live messages', tab: 'ticker', icon: TypeIcon, color: 'text-amber-600', bg: 'bg-amber-100/50' }
                        ].map(btn => (
                            <button 
                                key={btn.tab}
                                onClick={() => setActiveTab(btn.tab)}
                                className="p-10 bg-white border border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-center group hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-2 active:scale-95 shadow-sm"
                            >
                                <div className={`w-20 h-20 ${btn.bg} rounded-3xl flex items-center justify-center ${btn.color} transition-all group-hover:scale-110 group-hover:rotate-6 mb-8`}>
                                    <btn.icon size={36} />
                                </div>
                                <span className="text-[12px] font-black uppercase text-slate-900 tracking-[3px] mb-2 font-black">{btn.label}</span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity font-black">{btn.desc}</p>
                            </button>
                        ))}
                    </div>
                </section>
          </div>
       </div>
  );
};

export default DashboardOverview;
