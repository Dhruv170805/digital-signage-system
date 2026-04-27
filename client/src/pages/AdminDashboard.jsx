/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Shell from '../components/Shell';
import { 
  XCircle, Activity, LayoutGrid, CheckSquare, Calendar, FileText, 
  Type as TypeIcon, Tv, Settings as SettingsIcon, History, Monitor, Zap
} from 'lucide-react';

import DashboardOverview from '../components/admin/DashboardOverview';
import ModerationQueue from '../components/admin/ModerationQueue';
import BroadcastScheduler from '../components/admin/BroadcastScheduler';
import LayoutArchitect from '../components/admin/LayoutArchitect';
import ScreenManager from '../components/admin/ScreenManager';
import UserDirectory from '../components/admin/UserDirectory';
import TickerManager from '../components/admin/TickerManager';
import IdleScreenManager from '../components/admin/IdleScreenManager';
import SystemSettings from '../components/admin/SystemSettings';
import SystemHistory from '../components/admin/SystemHistory';

import { 
  useScreens, useMedia, usePendingMedia, useTemplates, 
  useTickers, useSettings, useSchedules, useUsers 
} from '../hooks/useAdminData';
import useSocketStore from '../store/useSocketStore';

const PreviewModal = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;
  const src = file.filePath ? `${import.meta.env.VITE_API_URL}/${file.filePath}`.replace(/([^:]\/)\/+/g, "$1") : null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-12">
      <div className="relative w-full h-full max-w-6xl flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-2xl">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">{file.fileName}</h3>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{file.fileType} • {new Date(file.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-100 rounded-2xl hover:bg-rose-500 hover:text-white transition-all text-slate-400">
            <XCircle size={24}/>
          </button>
        </div>
        
        <div className="flex-1 bg-black rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl relative">
          {file.fileType === 'video' ? (
            <video src={src || undefined} autoPlay controls className="w-full h-full object-contain" />
          ) : file.fileType === 'pdf' ? (
            <iframe src={src ? `${src}#toolbar=0` : undefined} className="w-full h-full border-none bg-white" title={file.fileName} />
          ) : (
            <img src={src || undefined} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [liveMode, setLiveMode] = useState('gallery'); // gallery, group, screen
  const [liveTargetId, setLiveTargetId] = useState('');
  
  const { data: users = [], refetch: refetchUsers } = useUsers();
  const { data: media = [], refetch: refetchMedia } = useMedia();
  const { data: pendingMedia = [], refetch: refetchPending } = usePendingMedia();
  const { data: templates = [], refetch: refetchTemplates } = useTemplates();
  const { data: screens = [], refetch: refetchScreens } = useScreens();
  const { data: tickers = [], refetch: refetchTickers } = useTickers();
  const { data: settings = {}, refetch: refetchSettings } = useSettings();
  const { data: schedules = [], refetch: refetchSchedules } = useSchedules();

  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [groups, setGroups] = useState([]);

  const { socket, connect, disconnect } = useSocketStore();

  useEffect(() => {
    // Only connect if no socket exists
    if (!socket) {
      connect();
    }
    // DO NOT return disconnect() here to prevent the "Double Invoke" loop 
    // that breaks the handshake in React DEV mode. 
    // The store's internal cleanup handles stale sockets.
  }, [connect, socket]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('screenStatusUpdate', (data) => {
      console.log('📡 Real-time monitoring pulse:', data);
      refetchScreens();
    });

    return () => socket.off('screenStatusUpdate');
  }, [socket, refetchScreens]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data);
    } catch (err) { console.error('Failed to load clusters'); }
  }, []);

  useEffect(() => { 
    fetchGroups();
  }, [fetchGroups]);

  const fetchData = useCallback(async () => {
    refetchUsers(); refetchMedia(); refetchPending(); refetchTemplates();
    refetchScreens(); refetchTickers(); refetchSettings(); refetchSchedules();
    fetchGroups();
  }, [refetchUsers, refetchMedia, refetchPending, refetchTemplates, refetchScreens, refetchTickers, refetchSettings, refetchSchedules, fetchGroups]);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="h-full overflow-hidden flex flex-col">
            <DashboardOverview screens={screens} schedules={schedules} pendingMedia={pendingMedia} media={media} setActiveTab={setActiveTab} />
          </div>
        );
      case 'approve': return <ModerationQueue fetchData={fetchData} setPreviewFile={setPreviewFile} setShowPreview={setShowPreview} />;
      case 'schedule': return <BroadcastScheduler fetchData={fetchData} />;
      case 'templates': return <LayoutArchitect fetchData={fetchData} />;
      case 'screens': return <ScreenManager fetchData={fetchData} />;
      case 'users': return <UserDirectory users={users} fetchData={fetchData} />;
      case 'ticker': return <TickerManager />;
      case 'settings': return <IdleScreenManager />;
      case 'system': return <SystemSettings fetchData={fetchData} />;
      case 'history': return <SystemHistory />;
      case 'live': {
        const onlineScreens = screens.filter(s => s.status === 'online');
        
        // Logical Fix: Gallery mode should ALWAYS be strictly online screens.
        // Group and Single modes can show specific targets regardless of status if requested.
        let filteredScreens = [];
        if (liveMode === 'gallery') {
            filteredScreens = onlineScreens;
        } else if (liveMode === 'group') {
            filteredScreens = onlineScreens.filter(s => s.groupId?._id === liveTargetId || s.groupId === liveTargetId);
        } else if (liveMode === 'screen') {
            filteredScreens = screens.filter(s => s._id === liveTargetId);
        }

        return (
            <div className="h-full overflow-hidden flex flex-col bg-slate-50/30">
                {/* LIVE SUB-NAV */}
                <div className="bg-white p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 mb-1">
                            <Activity className="text-indigo-600 animate-pulse" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Signal Monitor</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Live Broadcast Wall</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{onlineScreens.length} Active Signals Detected</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                            <button onClick={() => { setLiveMode('gallery'); setLiveTargetId(''); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${liveMode === 'gallery' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Gallery</button>
                            <button onClick={() => { setLiveMode('group'); setLiveTargetId(''); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${liveMode === 'group' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Group</button>
                            <button onClick={() => { setLiveMode('screen'); setLiveTargetId(''); }} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${liveMode === 'screen' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Single</button>
                        </div>

                        {liveMode !== 'gallery' && (
                            <select 
                                className="nexus-input w-64 h-12 text-[10px] font-black uppercase bg-white border-slate-200"
                                value={liveTargetId}
                                onChange={(e) => setLiveTargetId(e.target.value)}
                            >
                                <option value="">{liveMode === 'group' ? 'Select Group...' : 'Select Screen...'}</option>
                                {liveMode === 'group' ? groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>) : screens.map(s => <option key={s._id} value={s._id}>{s.name} {s.status !== 'online' ? '(Offline)' : ''}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {filteredScreens.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-40 border-2 border-dashed border-slate-200 rounded-[60px] bg-white">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                <Tv size={40} className="opacity-20" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[8px]">No Active Signals Detected</p>
                        </div>
                    ) : (
                        <div className={`grid gap-12 ${liveMode === 'screen' ? 'grid-cols-1 max-w-6xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                            {filteredScreens.map(s => (
                                <div 
                                    key={s._id} 
                                    className={`flex flex-col gap-6 animate-fade-in ${liveMode === 'gallery' ? 'cursor-pointer group/card' : ''}`}
                                    onClick={() => {
                                        if (liveMode === 'gallery') {
                                            setLiveMode('screen');
                                            setLiveTargetId(s._id);
                                        }
                                    }}
                                >
                                    <div className="aspect-video bg-slate-950 rounded-[40px] overflow-hidden border-[6px] border-slate-900 shadow-2xl relative group" style={{ containerType: 'inline-size' }}>
                                        {s.deviceToken ? (
                                            <iframe 
                                                src={`/display?token=${s.deviceToken}&preview=true`} 
                                                className="w-[1920px] h-[1080px] absolute top-0 left-0 origin-top-left border-none pointer-events-none" 
                                                style={{ transform: 'scale(calc(100cqi / 1920))' }}
                                                title={s.name} 
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                                                <XCircle className="text-rose-500 mb-2" size={32} />
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Unauthorized Node</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-sm">
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                                                {liveMode === 'gallery' ? <Zap className="text-white fill-white" size={24} /> : <Monitor className="text-white" size={24} />}
                                            </div>
                                            <p className="text-white text-xs font-black uppercase tracking-[4px]">{liveMode === 'gallery' ? 'Open Signal' : s.name}</p>
                                            <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mt-2">{s.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-6 py-4 bg-white border border-slate-200 rounded-[24px] shadow-sm group-hover/card:border-indigo-500 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{s.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Signal Online</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase tabular-nums">{s.resolution}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
      }
      default: return null;
    }
  };

  return (
    <Shell role="admin" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="h-full w-full overflow-hidden">
        {renderView()}
      </div>
      <PreviewModal isOpen={showPreview} onClose={() => { setShowPreview(false); setPreviewFile(null); }} file={previewFile} />
    </Shell>
  );
};

export default AdminDashboard;
