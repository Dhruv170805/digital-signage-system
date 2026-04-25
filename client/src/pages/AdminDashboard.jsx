/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Shell from '../components/Shell';
import { 
  XCircle, Eye, Activity, LayoutGrid, CheckSquare, Calendar, FileText, 
  Type as TypeIcon, Tv, Monitor, MonitorPlay, Users as UsersIcon, Settings as SettingsIcon, RefreshCw, Cpu
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
import Card from '../components/admin/Card';

import { 
  useScreens, useMedia, usePendingMedia, useTemplates, 
  useTickers, useSettings, useSchedules, useUsers 
} from '../hooks/useAdminData';

const PreviewModal = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;
  const src = file.filePath ? `${import.meta.env.VITE_API_URL}/${file.filePath}` : null;
  
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-12">
      <div className="relative w-full h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">{file.fileName}</h3>
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{file.fileType} • {new Date(file.uploadedAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
            <XCircle size={24} className="text-white"/>
          </button>
        </div>
        
        <div className="flex-1 bg-black/40 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
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
  
  // React Query Hooks
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
  const [monitorTarget, setMonitorTarget] = useState({ type: 'all', id: '' });
  const [groups, setGroups] = useState([]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data);
    } catch (err) { console.error('Failed to load clusters'); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchData = useCallback(async () => {
    refetchUsers();
    refetchMedia();
    refetchPending();
    refetchTemplates();
    refetchScreens();
    refetchTickers();
    refetchSettings();
    refetchSchedules();
    fetchGroups();
  }, [
    refetchUsers, refetchMedia, refetchPending, refetchTemplates, 
    refetchScreens, refetchTickers, refetchSettings, refetchSchedules, fetchGroups
  ]);


  const approvedMedia = media.filter(m => m.status === 'approved');

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-16 animate-fade-in h-full overflow-y-auto custom-scrollbar pb-20 pr-4">
            <DashboardOverview screens={screens} schedules={schedules} pendingMedia={pendingMedia} media={media} setActiveTab={setActiveTab} setMonitorTarget={setMonitorTarget} />
            
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 border border-sky-500/20">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text uppercase tracking-tight leading-none">Security & Audit Log</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Chronological Intelligence Manifest</p>
                    </div>
                </div>
                <SystemHistory limit={5} />
            </section>
          </div>
        );
      case 'approve':
        return <ModerationQueue fetchData={fetchData} setPreviewFile={setPreviewFile} setShowPreview={setShowPreview} />;
      case 'schedule':
        return <BroadcastScheduler screens={screens} templates={templates} approvedMedia={approvedMedia} tickers={tickers} schedules={schedules} fetchData={fetchData} />;
      case 'templates':
        return <LayoutArchitect templates={templates} fetchData={fetchData} />;
      case 'screens':
        return <ScreenManager screens={screens} fetchData={fetchData} />;
      case 'users':
        return <UserDirectory users={users} fetchData={fetchData} />;
      case 'ticker':
        return <TickerManager />;
      case 'settings':
        return <IdleScreenManager />;
      case 'system':
        return <SystemSettings fetchData={fetchData} />;

      case 'history':
        return <SystemHistory />;
      case 'live':
        const monitorUrl = monitorTarget.type === 'all' 
            ? '/display' 
            : monitorTarget.type === 'screen' 
                ? `/display?screenId=${monitorTarget.id}` 
                : `/display?groupId=${monitorTarget.id}`;

        return (
          <div className="animate-fade-in h-full flex flex-col">
            <div className="glass overflow-hidden flex flex-col h-full border-white/5 shadow-2xl rounded-[40px] bg-white/50">
              
              {/* HEADER */}
              <div className="bg-black/10 p-8 border-b border-white/5 shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="text-sky-500 animate-pulse" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-sky-500">Global Feed</span>
                        </div>
                        <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Monitoring Studio</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-2 p-1 bg-black/20 rounded-2xl border border-white/5">
                            <select 
                                className="bg-transparent border-none text-[10px] font-black uppercase text-text px-4 outline-none cursor-pointer"
                                value={monitorTarget.type}
                                onChange={(e) => setMonitorTarget({ type: e.target.value, id: '' })}
                            >
                                <option value="all">Global System</option>
                                <option value="group">Cluster View</option>
                                <option value="screen">Node View</option>
                            </select>
                            
                            {monitorTarget.type !== 'all' && (
                                <select 
                                    className="bg-white/10 border-none text-[10px] font-black uppercase text-sky-500 px-4 rounded-xl outline-none cursor-pointer py-2"
                                    value={monitorTarget.id}
                                    onChange={(e) => setMonitorTarget({ ...monitorTarget, id: e.target.value })}
                                >
                                    <option value="">Select Target...</option>
                                    {monitorTarget.type === 'screen' 
                                        ? screens.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                                        : groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)
                                    }
                                </select>
                            )}
                        </div>
                    </div>
                </div>
              </div>

              {/* LIVE MONITOR */}
              <div className="flex-1 p-10 overflow-hidden bg-slate-50/50">
                 <div className="h-full w-full bg-black rounded-[40px] overflow-hidden border-4 border-slate-900 shadow-2xl relative group shadow-sky-500/5">
                    <iframe key={monitorUrl} src={monitorUrl} className="w-full h-full border-none pointer-events-none scale-[1.001]" title="Live Feed Preview" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                    
                    <div className="absolute top-8 left-8 flex items-center gap-4">
                        <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-black uppercase text-white/80 tracking-widest">
                                {monitorTarget.type === 'all' ? 'Master Feed' : monitorTarget.type === 'screen' ? 'Node Feed' : 'Cluster Feed'}
                            </span>
                        </div>
                    </div>
                 </div>
              </div>

              {/* FOOTER */}
              <div className="p-8 border-t border-slate-200 bg-white flex items-center justify-center gap-12 shrink-0">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500"><Cpu size={14}/></div>
                      <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Compute Load</p>
                          <p className="text-xs font-black text-text tabular-nums uppercase">12.4%</p>
                      </div>
                  </div>
                  <div className="h-8 w-px bg-slate-100" />
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><RefreshCw size={14}/></div>
                      <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Consistency</p>
                          <p className="text-xs font-black text-text tabular-nums uppercase">60 FPS</p>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const getTabLabel = () => {
    const labels = {
      dashboard: 'DASHBOARD', approve: 'APPLICATION', schedule: 'BROADCAST',
      templates: 'LAYOUT', ticker: 'TICKER', screens: 'SCREENS',
      users: 'USERS', settings: 'IDLE SCREEN', live: 'CURRENT SCREEN', history: 'HISTORY',
      system: 'SYSTEM'
    };
    return labels[activeTab] || activeTab.toUpperCase();
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'dashboard': return <LayoutGrid className="w-5 h-5 text-sky-400" />;
      case 'approve': return <CheckSquare className="w-5 h-5 text-sky-400" />;
      case 'schedule': return <Calendar className="w-5 h-5 text-sky-400" />;
      case 'templates': return <FileText className="w-5 h-5 text-sky-400" />;
      case 'ticker': return <TypeIcon className="w-5 h-5 text-sky-400" />;
      case 'screens': return <Tv className="w-5 h-5 text-sky-400" />;
      case 'users': return <UsersIcon className="w-5 h-5 text-sky-400" />;
      case 'settings': return <MonitorPlay className="w-5 h-5 text-sky-400" />;
      case 'system': return <SettingsIcon className="w-5 h-5 text-sky-400" />;
      case 'live': return <Tv className="w-5 h-5 text-sky-400" />;
      case 'history': return <Activity className="w-5 h-5 text-sky-400" />;
      default: return <Monitor className="w-5 h-5 text-sky-400" />;
    }
  };

  const isStudioView = ['dashboard', 'approve', 'schedule', 'templates', 'ticker', 'users', 'settings', 'system', 'screens', 'history', 'live'].includes(activeTab);

  return (
    <Shell role="admin" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="h-full flex flex-col overflow-hidden">
        {!isStudioView && (
          <header className="p-10 pb-0 shrink-0">
            <div className="flex justify-between items-end pb-8 border-b border-slate-200">
              <div>
                  <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-sky-500/10 rounded-lg">{getTabIcon()}</div>
                  </div>
                  <h1 className="text-8xl font-black tracking-tighter leading-none text-text uppercase">{getTabLabel()}</h1>
              </div>
            </div>
          </header>
        )}

        <div className={`flex-1 overflow-hidden ${!isStudioView ? 'p-10 pt-4' : ''}`}>
            <div className={`h-full ${isStudioView ? 'max-w-full' : 'max-w-7xl mx-auto'}`}>
                {renderView()}
            </div>
        </div>
      </div>
      <PreviewModal isOpen={showPreview} onClose={() => { setShowPreview(false); setPreviewFile(null); }} file={previewFile} />
    </Shell>
  );
};

export default AdminDashboard;
