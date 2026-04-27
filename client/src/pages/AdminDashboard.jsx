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
import LiveMonitor from '../components/admin/LiveMonitor';

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
      case 'live': return <LiveMonitor />;
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
