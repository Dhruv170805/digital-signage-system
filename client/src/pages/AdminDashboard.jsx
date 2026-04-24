/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Shell from '../components/Shell';
import { 
  XCircle, Eye, Activity, LayoutGrid, CheckSquare, Calendar, FileText, 
  Type as TypeIcon, Tv, Monitor, MonitorPlay, Users as UsersIcon
} from 'lucide-react';

import DashboardOverview from '../components/admin/DashboardOverview';
import ModerationQueue from '../components/admin/ModerationQueue';
import BroadcastScheduler from '../components/admin/BroadcastScheduler';
import LayoutArchitect from '../components/admin/LayoutArchitect';
import TerminalManager from '../components/admin/TerminalManager';
import PersonnelDirectory from '../components/admin/PersonnelDirectory';
import TickerManager from '../components/admin/TickerManager';
import SystemSettings from '../components/admin/SystemSettings';
import AuditHistory from '../components/admin/AuditHistory';
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

  const fetchData = useCallback(async () => {
    refetchUsers();
    refetchMedia();
    refetchPending();
    refetchTemplates();
    refetchScreens();
    refetchTickers();
    refetchSettings();
    refetchSchedules();
  }, [
    refetchUsers, refetchMedia, refetchPending, refetchTemplates, 
    refetchScreens, refetchTickers, refetchSettings, refetchSchedules
  ]);

  const approvedMedia = media.filter(m => m.status === 'approved');

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-10 animate-fade-in">
            <DashboardOverview screens={screens} schedules={schedules} pendingMedia={pendingMedia} media={media} setActiveTab={setActiveTab} />
            <Card title="Network Activity" icon={Activity} subtitle="System Audit Records">
               <AuditHistory />
            </Card>
          </div>
        );
      case 'approve':
        return <ModerationQueue pendingMedia={pendingMedia} fetchData={fetchData} setPreviewFile={setPreviewFile} setShowPreview={setShowPreview} />;
      case 'schedule':
        return <BroadcastScheduler screens={screens} templates={templates} approvedMedia={approvedMedia} tickers={tickers} schedules={schedules} fetchData={fetchData} />;
      case 'templates':
        return <LayoutArchitect templates={templates} fetchData={fetchData} />;
      case 'screens':
        return <TerminalManager screens={screens} fetchData={fetchData} />;
      case 'users':
        return <PersonnelDirectory users={users} fetchData={fetchData} />;
      case 'ticker':
        return <TickerManager />;
      case 'settings':
        return <SystemSettings settings={settings} approvedMedia={approvedMedia} fetchData={fetchData} />;
      case 'audit':
        return <AuditHistory />;
      case 'live':
        return (
           <div className="animate-fade-in px-4">
              <div className="aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative group shadow-sky-500/5">
                 <iframe src="/display" className="w-full h-full border-none pointer-events-none scale-[1.001]" title="Live Preview" />
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <p className="text-text text-lg tracking-[12px] font-black animate-pulse uppercase">Monitoring Active</p>
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
      users: 'USERS', settings: 'IDLE', live: 'CURRENT SCREEN', audit: 'AUDIT'
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
      case 'live': return <Tv className="w-5 h-5 text-sky-400" />;
      case 'audit': return <Activity className="w-5 h-5 text-sky-400" />;
      default: return <Monitor className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <Shell role="admin" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-10 max-w-7xl mx-auto">
        <header className="mb-12 pb-8 flex justify-between items-end border-b border-slate-200 relative">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-500/10 rounded-lg">{getTabIcon()}</div>
            </div>
            <h1 className="text-8xl font-black tracking-tighter leading-none text-text uppercase">{getTabLabel()}</h1>
          </div>
        </header>
        {renderView()}
      </div>
      <PreviewModal isOpen={showPreview} onClose={() => { setShowPreview(false); setPreviewFile(null); }} file={previewFile} />
    </Shell>
  );
};

export default AdminDashboard;
