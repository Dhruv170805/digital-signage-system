import React from 'react';
import { Tv, Calendar, Timer, CheckSquare, Activity, Monitor, ExternalLink, Plus, FileText, Zap, Cpu, Wifi, ShieldCheck, ArrowUpRight } from 'lucide-react';

const StatWidget = ({ label, value, icon: Icon, color = "blue", trend }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/10',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/10',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-500 shadow-sky-500/10',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 shadow-indigo-500/10',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-rose-500/10'
  };

  const currentStyles = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-slate-200 p-8 rounded-[40px] group relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/50">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={`p-4 rounded-[20px] border shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3 ${currentStyles}`}>
            <Icon size={24} />
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
              {trend}
            </div>
          )}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black text-text tracking-tighter tabular-nums">{value}</h2>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-sky-500 transition-colors" />
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 text-slate-50 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
        <Icon size={140} />
      </div>
    </div>
  );
};

const DashboardOverview = ({ screens, schedules, pendingMedia, media, setActiveTab }) => {
  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* PRIMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatWidget 
          label="Nodes Online"
          value={screens.filter(s => s.status === 'online').length} 
          icon={Tv} 
          trend={`${screens.length} Provisioned`} 
          color="sky"
        />
        <StatWidget 
          label="Active Streams" 
          value={schedules.length} 
          icon={Zap} 
          color="amber" 
          trend="Live Manifest"
        />
        <StatWidget 
          label="Policy Queue" 
          value={pendingMedia.length} 
          icon={ShieldCheck} 
          color="rose" 
          trend={pendingMedia.length > 0 ? "Critical" : "Clear"}
        />
        <StatWidget 
          label="Asset Library" 
          value={media.length} 
          icon={Layers} 
          color="indigo" 
          trend="Synchronized"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* OPERATIONAL STATUS */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[48px] overflow-hidden flex flex-col shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 border border-sky-500/20">
                        <Activity size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text uppercase tracking-tight leading-none">Node Topology</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time Infrastructure Monitoring</p>
                    </div>
                </div>
                <button onClick={() => setActiveTab('screens')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">Map View</button>
            </div>

            <div className="flex-1 p-8 overflow-y-auto max-h-[500px] custom-scrollbar">
                {screens.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                        <Monitor size={40} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px]">Infrastructure Offline</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {screens.map(s => (
                            <div key={s._id} className="p-6 bg-slate-50/50 border border-slate-200 rounded-[32px] group hover:border-sky-500/30 transition-all relative overflow-hidden">
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${s.status === 'online' ? 'bg-white border-sky-100 shadow-lg shadow-sky-500/5' : 'bg-slate-100 border-slate-200 grayscale'}`}>
                                        <Tv size={24} className={s.status === 'online' ? 'text-sky-500' : 'text-slate-400'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{s.location || 'Unknown Node'}</p>
                                        </div>
                                        <h4 className="font-black text-text uppercase tracking-tight truncate text-base leading-none">{s.name}</h4>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex gap-1">
                                            <div className="px-2 py-1 rounded-md bg-white border border-slate-100 flex items-center gap-1">
                                                <Cpu size={10} className="text-slate-400"/>
                                                <span className="text-[8px] font-black text-slate-600 tabular-nums">42%</span>
                                            </div>
                                            <div className="px-2 py-1 rounded-md bg-white border border-slate-100 flex items-center gap-1">
                                                <Wifi size={10} className="text-emerald-500"/>
                                                <span className="text-[8px] font-black text-slate-600 tabular-nums">12ms</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => window.open(`/display?screenId=${s._id}`, '_blank')} className="p-2 bg-sky-500 text-white rounded-lg shadow-lg shadow-sky-500/20"><ArrowUpRight size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* RAPID ACTIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-[48px] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <Plus className="text-sky-400" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-sky-400">Quick Console</span>
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-10 leading-tight">Rapid Operations</h3>

                <div className="space-y-4">
                    {[
                        { label: 'Moderate Requests', tab: 'approve', icon: ShieldCheck, color: 'text-rose-400', bg: 'bg-rose-400/10' },
                        { label: 'Broadcast System', tab: 'schedule', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                        { label: 'Architect Studio', tab: 'templates', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                        { label: 'Network Inventory', tab: 'screens', icon: Monitor, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
                    ].map(btn => (
                        <button 
                            key={btn.tab}
                            onClick={() => setActiveTab(btn.tab)}
                            className="w-full p-6 bg-white/5 border border-white/5 rounded-[24px] flex items-center justify-between group/btn hover:bg-white/10 hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${btn.bg} rounded-xl flex items-center justify-center ${btn.color} transition-transform group-hover/btn:scale-110`}>
                                    <btn.icon size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-white tracking-[2px]">{btn.label}</span>
                            </div>
                            <ArrowUpRight className="text-white/20 group-hover/btn:text-white transition-all" size={18} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Auth Integrity</p>
                    <p className="text-[10px] font-bold text-sky-400 uppercase">Operational Protocol 1.0</p>
                </div>
                <ShieldCheck className="text-white/5" size={40} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
