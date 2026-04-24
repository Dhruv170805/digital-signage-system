import React from 'react';
import { Tv, Calendar, Timer, CheckSquare, Activity, Monitor, ExternalLink, Plus, FileText } from 'lucide-react';

const Card = ({ children, className = "", title, icon, subtitle }) => {
  const Icon = icon;
  return (
    <div className={`glass-card p-8 animate-fade-in ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-accent shadow-inner">
                <Icon size={24} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-black text-text uppercase tracking-tighter leading-none">{title}</h3>
              {subtitle && <p className="text-[10px] font-bold text-text-dim uppercase tracking-[2px] mt-1.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

const StatWidget = ({ label, value, icon: Icon, color = "blue", trend }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400 group-hover:bg-sky-500/20',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20'
  };

  const currentStyles = colorMap[color] || colorMap.blue;
  const bgGlow = currentStyles.split(' ')[0];

  return (
    <div className="glass-card p-8 group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all ${bgGlow} opacity-50`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform ${currentStyles}`}>
            <Icon size={24} />
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
              {trend}
            </div>
          )}
        </div>
        <p className="text-[10px] font-black text-text-dim uppercase tracking-[3px] mb-2">{label}</p>
        <h2 className="text-4xl font-black text-text tracking-tighter tabular-nums">{value}</h2>
      </div>
    </div>
  );
};

const DashboardOverview = ({ screens, schedules, pendingMedia, media, setActiveTab }) => {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget 
          label="Active Terminals" 
          value={screens.filter(s => s.status === 'online').length} 
          icon={Tv} 
          trend={`${screens.length} TOTAL`} 
        />
        <StatWidget 
          label="Active Broadcasts" 
          value={schedules.length} 
          icon={Calendar} 
          color="emerald" 
        />
        <StatWidget 
          label="Pending Review" 
          value={pendingMedia.length} 
          icon={Timer} 
          color="amber" 
        />
        <StatWidget 
          label="Authorized Assets" 
          value={media.length} 
          icon={CheckSquare} 
          color="indigo" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card 
          className="lg:col-span-2" 
          title="Operational Status" 
          icon={Activity} 
          subtitle="Live Terminal Monitoring"
        >
          <div className="space-y-4">
            {screens.length === 0 ? (
              <div className="p-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[32px]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Monitor size={32} className="text-text-dim/30" />
                </div>
                <p className="text-[10px] font-black text-text-dim uppercase tracking-[4px]">No active units detected in network</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {screens.map(s => (
                  <div key={s.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[24px] flex items-center justify-between hover:bg-slate-100 transition-all group relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${s.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-50`} />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                        <Tv className="text-text-dim group-hover:text-text transition-colors" />
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-4 border-white ${s.status === 'online' ? 'bg-emerald-500 animate-live' : 'bg-rose-500'}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[2px] mb-1">{s.location}</p>
                        <p className="font-black text-text uppercase tracking-tighter">{s.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[8px] font-black text-text-dim uppercase tracking-widest mb-0.5">Network</p>
                        <p className="text-[10px] font-bold text-emerald-600 mono">100.2 KB/S</p>
                      </div>
                      <button className="p-3 bg-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-200">
                        <ExternalLink size={16} className="text-text-dim" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title="Quick Deploy" icon={Plus} subtitle="Rapid Operations Control">
           <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveTab('approve')} className="nexus-btn-primary flex items-center justify-between group h-16 px-6">
                 <span className="text-[10px] font-black uppercase tracking-[3px]">Moderate Content</span>
                 <CheckSquare size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setActiveTab('schedule')} className="nexus-btn-secondary flex items-center justify-between group h-16 px-6 bg-slate-50 border-slate-200 text-text hover:bg-slate-100">
                 <span className="text-[10px] font-black uppercase tracking-[3px]">Global Broadcast</span>
                 <Calendar size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setActiveTab('templates')} className="nexus-btn-secondary flex items-center justify-between group h-16 px-6 bg-slate-50 border-slate-200 text-text hover:bg-slate-100">
                 <span className="text-[10px] font-black uppercase tracking-[3px]">Architect UI</span>
                 <FileText size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
