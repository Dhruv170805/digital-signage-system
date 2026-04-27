import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Monitor, Tv, Zap, Clock, Calendar, History as HistoryIcon, 
  ChevronRight, Search, Filter, AlertCircle, PlayCircle, Clock4, CheckCircle2,
  XCircle, Info, ExternalLink, RefreshCw, Layers, Globe
} from 'lucide-react';
import { useLiveStatus, useGroups } from '../../hooks/useAdminData';
import useSocketStore from '../../store/useSocketStore';

const StatusBadge = ({ status }) => {
  const config = {
    online: { color: 'bg-emerald-500', text: 'Live', icon: <Zap size={10} className="fill-current" /> },
    offline: { color: 'bg-slate-400', text: 'Idle', icon: <Clock size={10} /> },
    scheduled: { color: 'bg-amber-500', text: 'Scheduled', icon: <Calendar size={10} /> },
    error: { color: 'bg-rose-500', text: 'Error', icon: <AlertCircle size={10} /> }
  };

  const s = config[status] || config.offline;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${s.color} text-white text-[9px] font-black uppercase tracking-widest shadow-lg`}>
      {s.icon}
      {s.text}
    </div>
  );
};

const ScreenCard = ({ screen, onPreview, onDetail }) => {
  const currentItem = screen.current && screen.current.length > 0 ? screen.current[0] : null;
  const isOnline = screen.status === 'online';
  
  // Progress calculation
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!currentItem) {
        setProgress(0);
        return;
    }
    const duration = currentItem.duration || 10;
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) return 0;
            return prev + (100 / (duration * 10)); // 100ms steps
        });
    }, 100);
    return () => clearInterval(interval);
  }, [currentItem]);

  return (
    <div 
      className="bg-white border border-slate-200 rounded-[32px] overflow-hidden hover:border-indigo-500 hover:shadow-2xl transition-all group flex flex-col h-full"
    >
      {/* Visual Header - Click for Preview */}
      <div 
        onClick={(e) => { e.stopPropagation(); onPreview(screen); }}
        className="aspect-video bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-zoom-in"
      >
        {isOnline ? (
          <div className="absolute inset-0">
             <iframe 
                src={`/display?token=${screen.deviceToken}&preview=true`} 
                className="w-[1920px] h-[1080px] absolute top-0 left-0 origin-top-left border-none pointer-events-none opacity-40 grayscale-[0.5] group-hover:opacity-80 group-hover:grayscale-0 transition-all duration-700" 
                style={{ transform: 'scale(0.2)' }} 
                title={screen.screenName} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/20 scale-90 group-hover:scale-100 transition-all">
                    <PlayCircle size={32} className="text-white" />
                </div>
            </div>
          </div>
        ) : (
          <Tv className="text-white/10" size={48} />
        )}
        
        <div className="absolute top-4 right-4">
          <StatusBadge status={isOnline ? (currentItem ? 'online' : 'scheduled') : 'offline'} />
        </div>

        {currentItem && (
            <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[4px] mb-1">Now Playing</p>
                <h4 className="text-white text-sm font-black uppercase tracking-tight truncate">{currentItem.name}</h4>
                <div className="mt-3 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
            </div>
        )}
      </div>

      {/* Detail Area - Click for Info */}
      <div 
        onClick={(e) => { e.stopPropagation(); onDetail(screen); }}
        className="p-6 flex-1 flex flex-col justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{screen.screenName}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{screen.location}</p>
          </div>
          <button className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
            <Info size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4 py-3 border-t border-slate-100">
             <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime</span>
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight tabular-nums">
                     {screen.telemetry?.uptime ? `${Math.floor(screen.telemetry.uptime / 3600)}h ${Math.floor((screen.telemetry.uptime % 3600) / 60)}m` : '0h 0m'}
                 </span>
             </div>
             <div className="w-px h-6 bg-slate-100" />
             <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue</span>
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight tabular-nums">{screen.queue?.length || 0} Scheduled</span>
             </div>
        </div>
      </div>
    </div>
  );
};

const DetailPanel = ({ screen, isOpen, onClose }) => {
  if (!screen) return null;

  const getPriorityLabel = (p) => {
    if (p >= 100) return 'High';
    if (p >= 10) return 'High'; // Handle both scales
    if (p >= 50) return 'Medium';
    if (p >= 5) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.1)] z-[100] transform transition-transform duration-500 ease-in-out flex flex-col border-l border-slate-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <Monitor className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{screen.screenName}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Control Screen • {screen.location}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all">
          <XCircle size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
        {/* CURRENTLY PLAYING */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <PlayCircle className="text-indigo-600" size={18} />
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[4px]">Live Broadcast</h3>
          </div>
          
          {screen.current && screen.current.length > 0 ? (
            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap size={64} className="text-indigo-600" />
                </div>
                <div className="relative z-10">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[4px] mb-2">Active Rule</p>
                    <h4 className="text-xl font-black text-indigo-900 uppercase tracking-tight mb-4">{screen.current[0].name}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/50 rounded-2xl border border-indigo-100/50">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">File Type</p>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{screen.current[0].mediaId?.fileType || 'Template'}</p>
                        </div>
                        <div className="p-3 bg-white/50 rounded-2xl border border-indigo-100/50">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{getPriorityLabel(screen.current[0].priority || 1)} Priority</p>
                        </div>
                        <div className="p-3 bg-white/50 rounded-2xl border border-indigo-100/50">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Window</p>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{screen.current[0].startTime} - {screen.current[0].endTime}</p>
                        </div>
                        <div className="p-3 bg-white/50 rounded-2xl border border-indigo-100/50">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rotation</p>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{screen.current[0].duration}s Interval</p>
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
              <Clock4 className="mb-3 opacity-20" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[4px]">System Standby</p>
            </div>
          )}
        </section>

        {/* UPCOMING QUEUE */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="text-amber-500" size={18} />
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[4px]">Upcoming Queue</h3>
            </div>
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 uppercase">{screen.queue?.length || 0} Items</span>
          </div>

          <div className="space-y-3">
            {screen.queue && screen.queue.length > 0 ? screen.queue.map((item, idx) => (
              <div key={item._id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <span className="text-xs font-black">#{idx + 1}</span>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{item.name}</p>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Start: {item.startTime} • {getPriorityLabel(item.priority)} Priority</p>
                   </div>
                </div>
                <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[8px] font-black text-slate-400 uppercase">Queued</div>
              </div>
            )) : (
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center py-4">No upcoming scheduled items</p>
            )}
          </div>
        </section>

        {/* RECENT HISTORY */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <HistoryIcon className="text-slate-400" size={18} />
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[4px]">System Logs</h3>
          </div>

          <div className="space-y-4">
            {screen.history && screen.history.length > 0 ? screen.history.map((log) => (
              <div key={log._id} className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                    <div className="w-px flex-1 bg-slate-100 my-1" />
                </div>
                <div className="flex-1 pb-4">
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-none mb-1">{log.action}</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">{new Date(log.createdAt).toLocaleString()}</p>
                   {log.details && (
                     <div className="p-2 bg-slate-50 rounded-lg text-[8px] font-mono text-slate-400 break-all">
                       {log.details}
                     </div>
                   )}
                </div>
              </div>
            )) : (
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center py-4">No recent history logs</p>
            )}
          </div>
        </section>
      </div>

      <div className="p-8 border-t border-slate-200 bg-slate-50">
         <button onClick={() => window.open(`/display?token=${screen.deviceToken}`, '_blank')} className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-black transition-all shadow-xl">
            <ExternalLink size={14} /> Remote Signal Preview
         </button>
      </div>
    </div>
  );
};

const PreviewModal = ({ screen, isOpen, onClose }) => {
  if (!isOpen || !screen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 animate-fade-in">
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={onClose} />
        <div className="relative w-full max-w-7xl aspect-video bg-black rounded-[40px] overflow-hidden border-4 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="absolute top-8 left-8 z-10">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                        <h3 className="text-white text-sm font-black uppercase tracking-widest">{screen.screenName}</h3>
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[4px]">{screen.location} • LIVE FEED</p>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 z-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all border border-white/10"
            >
                <XCircle size={24} />
            </button>

            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <iframe 
                    src={`/display?token=${screen.deviceToken}&preview=true`} 
                    className="w-full h-full border-none shadow-2xl" 
                    title={screen.screenName} 
                />
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-4">
                <div className="bg-black/40 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Activity className="text-indigo-400" size={16} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Signal Health: Optimal</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-3">
                        <Clock4 className="text-sky-400" size={16} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Latency: 24ms</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const LiveMonitor = () => {
  const { data: status = [], refetch, isLoading } = useLiveStatus();
  const { data: groups = [] } = useGroups();
  const { socket } = useSocketStore();
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [previewScreen, setPreviewScreen] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    if (!socket) return;
    socket.on('screenStatusUpdate', () => refetch());
    socket.on('manifestUpdate', () => refetch());
    return () => {
      socket.off('screenStatusUpdate');
      socket.off('manifestUpdate');
    };
  }, [socket, refetch]);

  const filteredScreens = useMemo(() => {
    return status.filter(s => {
      const matchesSearch = s.screenName.toLowerCase().includes(search.toLowerCase()) || 
                           s.location.toLowerCase().includes(search.toLowerCase());
      
      let matchesFilter = true;
      if (filter === 'online') matchesFilter = s.status === 'online';
      else if (filter === 'offline') matchesFilter = s.status === 'offline';
      else if (filter === 'live') matchesFilter = s.current && s.current.length > 0;
      else if (filter === 'global') matchesFilter = s.current?.some(item => item.isGlobal);

      let matchesGroup = true;
      if (selectedGroup !== 'all') {
          matchesGroup = s.groupId === selectedGroup;
      }
      
      return matchesSearch && matchesFilter && matchesGroup;
    });
  }, [status, search, filter, selectedGroup]);

  return (
    <div className="h-full flex flex-col bg-slate-50/30">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 border-b border-slate-200 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Activity className="text-indigo-600 animate-pulse" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">MAIN DASHBOARD</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Live Broadcast Wall</h2>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {status.filter(s => s.status === 'online').length} Active Screens
                </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={16} />
                    <input 
                        type="text" 
                        placeholder="SEARCH SCREENS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="nexus-input w-64 pl-12 h-12 text-[10px] font-black tracking-widest bg-slate-50 border-slate-200"
                    />
                </div>
                <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {['all', 'online', 'live', 'offline', 'global'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => { setFilter(f); if (f === 'global') setSelectedGroup('all'); }}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                    <Layers size={14} className="ml-2 text-slate-400" />
                    <select 
                        value={selectedGroup} 
                        onChange={(e) => { setSelectedGroup(e.target.value); if (e.target.value !== 'all') setFilter('all'); }}
                        className="bg-transparent text-[9px] font-black uppercase tracking-widest text-slate-700 outline-none pr-4 cursor-pointer"
                    >
                        <option value="all">ANY GROUP</option>
                        {groups.map(g => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={() => refetch()} 
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:rotate-180"
                    title="Force Resync"
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
        {isLoading ? (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[6px]">Syncing Status</p>
                </div>
            </div>
        ) : filteredScreens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {filteredScreens.map(screen => (
                    <ScreenCard 
                        key={screen.screenId} 
                        screen={screen} 
                        onPreview={setPreviewScreen}
                        onDetail={setSelectedScreen}
                    />
                ))}
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-40 border-2 border-dashed border-slate-200 rounded-[60px] bg-white mx-auto max-w-4xl">
                <Tv size={64} className="opacity-10 mb-6" />
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-[12px]">No Screens Found</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">Adjust filters or register new screens</p>
            </div>
        )}

        <DetailPanel 
            screen={selectedScreen} 
            isOpen={!!selectedScreen} 
            onClose={() => setSelectedScreen(null)} 
        />

        <PreviewModal 
            screen={previewScreen} 
            isOpen={!!previewScreen} 
            onClose={() => setPreviewScreen(null)} 
        />
      </div>

      {/* OVERLAY FOR PANEL */}
      {selectedScreen && (
          <div 
            onClick={() => setSelectedScreen(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity animate-fade-in" 
          />
      )}
    </div>
  );
};

export default LiveMonitor;
