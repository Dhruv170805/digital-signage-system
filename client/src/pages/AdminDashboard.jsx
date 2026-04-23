import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import toast from 'react-hot-toast';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Shell from '../components/Shell';
import { 
  Users as UsersIcon, CheckCircle, XCircle, Clock, 
  Play, Plus, Trash2, Settings as SettingsIcon, ExternalLink, Activity, 
  FileText, Calendar, LayoutGrid, Type as TypeIcon,
  Save, AlertCircle, Tv, Monitor, Palette, Info, Eye, CheckSquare, MonitorPlay, Lock, Timer, Send, RefreshCw, File
} from 'lucide-react';

import AuditHistory from '../components/admin/AuditHistory';

const Card = ({ children, className = "", title, icon: Icon, subtitle }) => (
  <div className={`glass-card p-8 animate-fade-in ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent)] shadow-inner">
              <Icon size={24} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{title}</h3>
            {subtitle && <p className="text-[10px] font-bold text-white/30 uppercase tracking-[2px] mt-1.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    )}
    {children}
  </div>
);

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
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-2">{label}</p>
        <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums">{value}</h2>
      </div>
    </div>
  );
};

const Badge = ({ label, type }) => {
  const colors = {
    admin: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    user: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    locked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    reset: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${colors[type] || 'bg-white/5 text-text/40 border-white/10'}`}>
      {label}
    </span>
  );
};

const PreviewModal = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;
  const src = `${import.meta.env.VITE_API_URL}/${file.filePath}`;
  
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-12">
      <div className="relative w-full h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-text">{file.fileName}</h3>
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{file.fileType} • {new Date(file.uploadedAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-xl hover:bg-rose-500 hover:text-text transition-all">
            <XCircle size={24} className="text-text"/>
          </button>
        </div>
        
        <div className="flex-1 bg-black/40 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
          {file.fileType === 'video' ? (
            <video src={src} autoPlay controls className="w-full h-full object-contain" />
          ) : file.fileType === 'pdf' ? (
            <iframe src={`${src}#toolbar=0`} className="w-full h-full border-none bg-white" title={file.fileName} />
          ) : (
            <img src={src} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
};

const ModerationModal = ({ isOpen, onClose, file, onConfirm }) => {
  const [action, setAction] = useState('approve');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (file) {
      setStartTime(file.requestedStartTime ? new Date(file.requestedStartTime).toISOString().slice(0, 16) : '');
      setEndTime(file.requestedEndTime ? new Date(file.requestedEndTime).toISOString().slice(0, 16) : '');
      setReason('');
      setAction('approve');
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const handleConfirm = () => {
    if (action === 'reject' && !reason.trim()) {
      return toast.error('Please provide a reason for rejection.');
    }
    onConfirm(file.id, action, action === 'approve' ? { startTime, endTime } : { reason });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
      <div className="glass max-w-lg w-full p-10 space-y-8 animate-fade-in border-white/10">
        <div className="flex justify-between items-center pb-6 border-b border-white/5">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-text">Asset Moderation</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-text"><XCircle /></button>
        </div>

        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
          <button onClick={() => setAction('approve')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${action === 'approve' ? 'bg-emerald-500 text-text' : 'text-slate-500 hover:text-slate-300'}`}>Approve</button>
          <button onClick={() => setAction('reject')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${action === 'reject' ? 'bg-rose-500 text-text' : 'text-slate-500 hover:text-slate-300'}`}>Reject</button>
        </div>

        <div className="space-y-6">
          {action === 'approve' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Override From</label>
                  <input type="datetime-local" className="nexus-input py-3 text-xs" value={startTime} onChange={(e) => setStartTime(e.target.value)}/>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Override TO</label>
                  <input type="datetime-local" className="nexus-input py-3 text-xs" value={endTime} onChange={(e) => setEndTime(e.target.value)}/>
                </div>
              </div>
              <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                <p className="text-[10px] font-bold text-sky-400 uppercase leading-tight">Approving will make this asset available in the Broadcast System for deployment.</p>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Reason for Rejection</label>
              <textarea 
                className="nexus-input min-h-[120px] py-4 resize-none" 
                placeholder="Enter technical reason for non-compliance..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <button 
          onClick={handleConfirm}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[4px] shadow-2xl transition-all active:scale-95 ${action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
        >
          {action === 'approve' ? 'Authorize Asset' : 'Execute Rejection'}
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [media, setMedia] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [screens, setScreens] = useState([]);
  const [tickers, setTickers] = useState([]);
  const [ticker, setTicker] = useState({ text: '', speed: 5, isActive: 1, fontSize: 'text-4xl', fontStyle: 'font-normal' });
  const [draftTicker, setDraftTicker] = useState({ text: '', speed: 5, isActive: 1, fontSize: 'text-4xl', fontStyle: 'font-normal' });
  const [isTickerDirty, setIsTickerDirty] = useState(false);
  const [settings, setSettings] = useState({});
  const [schedules, setSchedules] = useState([]);
  
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [templateName, setTemplateName] = useState('');
  const [currentLayout, setCurrentLayout] = useState([]);
  const [newSchedule, setNewSchedule] = useState({ screenId: '', templateId: '', mediaId: '', startTime: '', endTime: '' });
  const [newScreen, setNewScreen] = useState({ name: '', location: '' });
  const [mediaMapping, setMediaMapping] = useState({});
  const [architectWidth, setArchitectWidth] = useState(0);
  const architectRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [modFile, setModFile] = useState(null);
  const [showModModal, setShowModModal] = useState(false);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const results = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media/pending`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/templates`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/screens`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedule`)
      ]);

      if (results[0].status === 'fulfilled') setUsers(results[0].value.data);
      if (results[1].status === 'fulfilled') setMedia(results[1].value.data);
      if (results[2].status === 'fulfilled') setPendingMedia(results[2].value.data);
      if (results[3].status === 'fulfilled') setTemplates(results[3].value.data);
      if (results[4].status === 'fulfilled') setScreens(results[4].value.data);
      if (results[5].status === 'fulfilled') {
        setTickers(results[5].value.data);
      }
      if (results[6].status === 'fulfilled') setSettings(results[6].value.data);
      if (results[7].status === 'fulfilled') setSchedules(results[7].value.data);
    } catch (err) { 
      console.error('Fetch Error:', err);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!architectRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setArchitectWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(architectRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  const handleModeration = async (id, action, data = {}) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/${id}/${action}`, data);
      setShowModModal(false);
      setModFile(null);
      toast.success(action === 'approve' ? 'Asset authorized.' : 'Asset rejected.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const registerScreen = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/screens/register`, newScreen);
      toast.success('Screen Registered');
      setNewScreen({ name: '', location: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const saveTicker = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/ticker`, draftTicker);
      toast.success('Ticker Updated');
      setIsTickerDirty(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const saveTemplate = async () => {
    if (!templateName) return toast.error('Enter Layout Name');
    
    const isDuplicate = templates.some(t => t.name.toLowerCase() === templateName.trim().toLowerCase());
    if (isDuplicate) {
      return toast.error('Layout name must be unique.');
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/templates`, { name: templateName.trim(), layout: currentLayout });
      toast.success('Layout Saved');
      setTemplateName('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const provisionUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, newUser);
      toast.success('User Provisioned');
      setShowUserForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    const data = { ...newSchedule, mediaMapping: JSON.stringify(mediaMapping) };
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, data);
      toast.success('Broadcast Scheduled');
      setNewSchedule({ screenId: '', templateId: '', mediaId: '', startTime: '', endTime: '' });
      setMediaMapping({});
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Terminate Broadcast?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/schedule/${id}`);
      toast.success('Broadcast Terminated');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const saveSettings = async (key, val) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, { [key]: val });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const unlockUser = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/unlock`);
      toast.success('Account Unlocked');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const lockUser = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/lock`);
      toast.success('Account Locked');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Purge personnel records?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}`);
      toast.success('Record Purged');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const approveReset = async (id) => {
    const pw = prompt('Set Temporary Password:');
    if (!pw) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/approve-reset`, { newPassword: pw });
      toast.success('Password Updated');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const executeSystemReset = async () => {
    if (!window.confirm('CRITICAL: Permanently wipe all schedules and media records? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/wipe`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('System purged.');
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Reset failed.'); 
    }
  };

  const safeParseJSON = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch { return fallback; }
  };

  const approvedMedia = media.filter(m => m.status === 'approved');

  const getLoggedInUser = () => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
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
                    <div className="p-20 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[32px]">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Monitor size={32} className="text-white/20" />
                      </div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[4px]">No active units detected in network</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {screens.map(s => (
                        <div key={s.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-[24px] flex items-center justify-between hover:bg-white/5 transition-all group relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${s.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-50`} />
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                              <Tv className="text-white/40 group-hover:text-white transition-colors" />
                              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-4 border-[#0B1220] ${s.status === 'online' ? 'bg-emerald-500 animate-live' : 'bg-rose-500'}`} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px] mb-1">{s.location}</p>
                              <p className="font-black text-white uppercase tracking-tighter">{s.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Network</p>
                              <p className="text-[10px] font-bold text-emerald-400 mono">100.2 KB/S</p>
                            </div>
                            <button className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                              <ExternalLink size={16} className="text-white/40" />
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
                    <button onClick={() => setActiveTab('schedule')} className="nexus-btn-secondary flex items-center justify-between group h-16 px-6 bg-white/5 border-white/10 text-white hover:bg-white/10">
                       <span className="text-[10px] font-black uppercase tracking-[3px]">Global Broadcast</span>
                       <Calendar size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => setActiveTab('templates')} className="nexus-btn-secondary flex items-center justify-between group h-16 px-6 bg-white/5 border-white/10 text-white hover:bg-white/10">
                       <span className="text-[10px] font-black uppercase tracking-[3px]">Architect UI</span>
                       <FileText size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </Card>
            </div>

            <Card title="Network Activity" icon={Activity} subtitle="System Audit Records">
               <AuditHistory logs={[]} />
            </Card>
          </div>
        );

      case 'approve':
        return (
          <div className="animate-fade-in space-y-10 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Moderation Queue</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[4px] mt-2">Required Asset Clearances</p>
              </div>
              <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-amber-400 uppercase tracking-widest">
                {pendingMedia.length} Pending
              </div>
            </div>

            {pendingMedia.length === 0 ? (
               <div className="text-center py-32 bg-white/[0.02] rounded-[40px] border border-dashed border-white/5">
                 <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/10">
                   <CheckCircle className="text-emerald-500 opacity-40" size={32} />
                 </div>
                 <p className="text-white/20 uppercase font-black tracking-[6px] text-xs">Clearance Queue Empty</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {pendingMedia.map(m => (
                   <div key={m.id} className="glass-card p-6 group relative overflow-hidden transition-all duration-500 hover:scale-[1.02]">
                      <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6 border border-white/5 relative group-hover:border-white/20 transition-all">
                         {m.fileType === 'video' ? (
                           <video src={`${import.meta.env.VITE_API_URL}/${m.filePath}`} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
                         ) : m.fileType === 'pdf' ? (
                           <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                              <File className="text-blue-500 opacity-40 mb-3" size={40} />
                              <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Digital PDF</span>
                           </div>
                         ) : (
                           <img src={`${import.meta.env.VITE_API_URL}/${m.filePath}`} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                            <button onClick={() => { setPreviewFile(m); setShowPreview(true); }} className="w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"><Eye size={24}/></button>
                         </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{m.fileType} • {(m.uploaderId?.name || 'Unknown').split(' ')[0]}</p>
                        <h4 className="text-lg font-black truncate text-white uppercase tracking-tighter">{m.fileName}</h4>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[8px] font-black text-white/20 mb-2 uppercase tracking-widest leading-none">Window Start</p>
                           <p className="text-[10px] font-black text-white uppercase tracking-tighter tabular-nums">{m.requestedStartTime ? new Date(m.requestedStartTime).toLocaleDateString() : 'Immediate'}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[8px] font-black text-white/20 mb-2 uppercase tracking-widest leading-none">Window End</p>
                           <p className="text-[10px] font-black text-white uppercase tracking-tighter tabular-nums">{m.requestedEndTime ? new Date(m.requestedEndTime).toLocaleDateString() : 'Unset'}</p>
                        </div>
                      </div>

                      <button onClick={() => { setModFile(m); setShowModModal(true); }} className="w-full mt-6 py-4 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-blue-600 hover:text-white transition-all duration-300">Evaluate Asset</button>
                   </div>
                 ))}
              </div>
            )}
          </div>
        );

      case 'schedule':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
             <Card 
               className="lg:col-span-1" 
               title="Broadcast System" 
               icon={Calendar} 
               subtitle="Transmission Control"
             >
                <form onSubmit={createSchedule} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Screen</label>
                     <select className="nexus-input" value={newSchedule.screenId} onChange={(e) => setNewSchedule(p => ({ ...p, screenId: e.target.value }))}>
                        <option value="">Broadcast to All</option>
                        {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Layout</label>
                     <select className="nexus-input" value={newSchedule.templateId} onChange={(e) => {
                       setNewSchedule(p => ({ ...p, templateId: e.target.value, mediaId: '' }));
                       setMediaMapping({});
                     }}>
                        <option value="">Standard Fullscreen</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                   </div>

                   {!newSchedule.templateId ? (
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Files</label>
                       <select required className="nexus-input" value={newSchedule.mediaId} onChange={(e) => setNewSchedule(p => ({ ...p, mediaId: e.target.value }))}>
                          <option value="">Select Asset</option>
                          {approvedMedia.map(m => <option key={m.id} value={m.id}>{m.fileName}</option>)}
                       </select>
                     </div>
                   ) : (
                     <div className="space-y-4 p-4 border border-[var(--border)] bg-black/20 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-center border-b border-[var(--border)] pb-2 mb-4">Zone Mapping</p>
                        {safeParseJSON(templates.find(t => t.id === newSchedule.templateId)?.layout).map((z) => (
                          <div key={z.i} className="space-y-1">
                            <label className="text-[9px] font-bold uppercase ml-1 opacity-50">Zone {z.i}</label>
                            <select required className="nexus-input py-2 text-xs" value={mediaMapping[z.i] || ''} onChange={(e) => setMediaMapping(p => ({ ...p, [z.i]: e.target.value }))}>
                               <option value="">Select {z.type === 'ticker' ? 'Ticker' : 'Media Asset'}</option>
                               {z.type === 'ticker' ? (
                                   tickers.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.text}</option>)
                               ) : (
                                   approvedMedia.map(m => <option key={m.id} value={m.id}>{m.fileName}</option>)
                               )}
                            </select>
                          </div>
                        ))}
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-1 opacity-50">From Date & Time</label>
                        <input type="datetime-local" required className="nexus-input text-xs" value={newSchedule.startTime} onChange={(e) => setNewSchedule(p => ({ ...p, startTime: e.target.value }))}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-1 opacity-50">To Date & Time</label>
                        <input type="datetime-local" required className="nexus-input text-xs" value={newSchedule.endTime} onChange={(e) => setNewSchedule(p => ({ ...p, endTime: e.target.value }))}/>
                      </div>
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full tracking-[2px]">Broadcast</button>
                </form>
             </Card>

             <Card 
               className="lg:col-span-3 overflow-hidden" 
               title="Live Manifest" 
               icon={Activity} 
               subtitle="Active Broadcast Queue"
             >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/5 text-[9px] font-black uppercase text-slate-500">
                           <th className="py-4 px-6">Media / Template</th>
                           <th className="py-4 px-6">Screen</th>
                           <th className="py-4 px-6">Active Window</th>
                           <th className="py-4 px-6 text-right">Operations</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {schedules.map(s => {
                          const m = approvedMedia.find(am => am.id === s.mediaId);
                          const t = templates.find(tm => tm.id === s.templateId);
                          const scr = screens.find(sc => sc.id === s.screenId);
                          return (
                            <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                               <td className="py-5 px-6">
                                  <p className="font-bold text-text uppercase text-xs tracking-tight">{t ? t.name : (m?.fileName || 'Asset Unknown')}</p>
                                  <p className="text-[8px] font-bold text-sky-400/60 uppercase mt-1 tracking-widest">{t ? 'MULTI-FRAME ARRAY' : (m?.fileType || 'MEDIA')}</p>
                               </td>
                               <td className="py-5 px-6 text-[10px] font-black uppercase text-slate-400">{scr ? scr.name : 'GLOBAL'}</td>
                               <td className="py-5 px-6">
                                  <div className="flex items-center gap-3">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                     <p className="text-[10px] font-bold tabular-nums text-slate-300">
                                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                        <span className="mx-2 opacity-20">→</span>
                                        {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </p>
                                  </div>
                               </td>
                               <td className="py-5 px-6 text-right">
                                  <button onClick={() => deleteSchedule(s.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-text transition-all"><Trash2 size={14}/></button>
                               </td>
                            </tr>
                          );
                        })}
                     </tbody>
                  </table>
                </div>
             </Card>
          </div>
        );

      case 'ticker':
        return <TickerManager />;

      case 'screens':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
             <Card 
               className="lg:col-span-1" 
               title="Provision Unit" 
               icon={Tv} 
               subtitle="Terminal Registration"
             >
                <form onSubmit={registerScreen} className="space-y-6">
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-40">Screen ID / Name</label>
                     <input type="text" required className="nexus-input" placeholder="e.g., LOBBY-SCREEN-01" value={newScreen.name} onChange={(e) => setNewScreen(p => ({ ...p, name: e.target.value }))}/>
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-40">Physical Location</label>
                     <input type="text" required className="nexus-input" placeholder="e.g., North Wing Entrance" value={newScreen.location} onChange={(e) => setNewScreen(p => ({ ...p, location: e.target.value }))}/>
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full py-4 font-black tracking-widest uppercase">PROVISION SCREEN</button>
                </form>
             </Card>

             <Card 
               className="lg:col-span-3" 
               title="Managed Terminals" 
               icon={Monitor} 
               subtitle={`Network Inventory: ${screens.length} Nodes`}
             >
                <div className="overflow-hidden rounded-2xl border border-white/10">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-white/5 text-[9px] font-black uppercase text-slate-500">
                            <th className="py-4 px-6">Identity</th>
                            <th className="py-4 px-6">Location</th>
                            <th className="py-4 px-6">System Status</th>
                            <th className="py-4 px-6">Last Activity</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {screens.map(s => (
                           <tr key={s.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-5 px-6">
                                 <p className="font-bold text-text uppercase text-sm tracking-tight">{s.name}</p>
                                 <p className="text-[8px] font-bold text-sky-400/60 uppercase mt-0.5 tracking-widest">ID: {s.id.slice(-8)}</p>
                              </td>
                              <td className="py-5 px-6 text-[10px] font-bold uppercase text-slate-400">{s.location}</td>
                              <td className="py-5 px-6">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                                    <span className={`text-[10px] font-black uppercase ${s.status === 'online' ? 'text-emerald-400' : 'text-slate-500'}`}>{s.status}</span>
                                 </div>
                              </td>
                              <td className="py-5 px-6 text-[10px] font-bold tabular-nums text-slate-500">
                                 {s.lastPing ? new Date(s.lastPing).toLocaleTimeString() : 'NEVER'}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </div>
        );
      case 'audit':
        return <AuditHistory />;
      case 'templates':
        const rowHeight = architectWidth > 0 ? (architectWidth / 12) * (9/16) : 50;
        return (
          <div className="space-y-8 animate-fade-in">
             <Card 
               className="w-full" 
               title="Layout Architect" 
               icon={Palette} 
               subtitle="Grid System: 12 x 12 Precision Mapping"
             >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 mt-2">
                   <div className="flex flex-wrap gap-2">
                     <button onClick={() => setCurrentLayout([{ i: 'Main', x: 0, y: 0, w: 12, h: 12 }])} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-text transition-all">Fullscreen</button>
                     <button onClick={() => setCurrentLayout([{ i: 'Left', x: 0, y: 0, w: 6, h: 12 }, { i: 'Right', x: 6, y: 0, w: 6, h: 12 }])} className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase text-sky-400 hover:bg-sky-500 hover:text-text transition-all">50/50 V</button>
                     <button onClick={() => setCurrentLayout([{ i: 'Top', x: 0, y: 0, w: 12, h: 6 }, { i: 'Bottom', x: 0, y: 6, w: 12, h: 6 }])} className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase text-sky-400 hover:bg-sky-500 hover:text-text transition-all">50/50 H</button>
                     <button onClick={() => setCurrentLayout([{ i: 'TL', x: 0, y: 0, w: 6, h: 6 }, { i: 'TR', x: 6, y: 0, w: 6, h: 6 }, { i: 'BL', x: 0, y: 6, w: 6, h: 6 }, { i: 'BR', x: 6, y: 6, w: 6, h: 6 }])} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-500 hover:text-text transition-all">Quad</button>
                     <button onClick={() => setCurrentLayout([{ i: 'Main', x: 0, y: 0, w: 9, h: 12 }, { i: 'Side', x: 9, y: 0, w: 3, h: 12 }])} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-text transition-all">Sidebar</button>
                     <button onClick={() => { if(window.confirm('Wipe current design?')) setCurrentLayout([]); }} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500 hover:text-text transition-all">Wipe</button>
                     <button onClick={() => setCurrentLayout([...currentLayout, { i: `Frame${currentLayout.length+1}`, x: 0, y: 0, w: 4, h: 4 }])} className="px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-sky-400 hover:text-text transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">+ Add Frame</button>
                   </div>
                </div>
                <div ref={architectRef} className="bg-slate-950 border-4 border-white/10 rounded-[40px] relative overflow-hidden grid-bg shadow-[0_0_100px_rgba(0,0,0,0.5)] p-0" style={{ height: architectWidth > 0 ? (Math.floor(rowHeight) * 12) : 'auto', minHeight: '400px' }}>
                   <div className="absolute inset-0 grid pointer-events-none opacity-20" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
                      {[...Array(144)].map((_, i) => (
                        <div key={i} className="border-[0.5px] border-white/10" />
                      ))}
                   </div>

                   <GridLayout 
                    className="layout" 
                    layout={currentLayout.map(item => ({ ...item, maxW: 12, maxH: 12, minW: 1, minH: 1 }))} 
                    cols={12} 
                    rowHeight={Math.floor(rowHeight)} 
                    width={architectWidth} 
                    maxRows={12}
                    onLayoutChange={(newLayout) => {
                      const validatedLayout = newLayout.map(item => {
                        let { x, y, w, h, i } = item;
                        w = Math.max(1, Math.min(Math.round(w), 12));
                        h = Math.max(1, Math.min(Math.round(h), 12));
                        if (x < 0) x = 0;
                        if (y < 0) y = 0;
                        if (x + w > 12) x = 12 - w;
                        if (y + h > 12) y = 12 - h;
                        return { i, x: Math.round(x), y: Math.round(y), w, h };
                      });
                      const hasChanged = JSON.stringify(validatedLayout) !== JSON.stringify(currentLayout);
                      if (hasChanged) setCurrentLayout(validatedLayout);
                    }} 
                    margin={[0, 0]} 
                    draggableHandle=".drag-handle"
                    resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n']}
                    compactType={null}
                    preventCollision={false}
                    isDraggable={true}
                    isResizable={true}
                    isBounded={true}
                  >
                      {currentLayout.map(z => (
                        <div key={z.i} className="bg-slate-900/90 border border-sky-500/30 backdrop-blur-md flex flex-col items-center justify-center text-text group overflow-hidden rounded-xl shadow-2xl transition-all hover:border-sky-400">
                           <div className="drag-handle w-full bg-sky-500/20 backdrop-blur-md text-sky-200 flex justify-between items-center px-3 py-1.5 font-black uppercase tracking-widest text-[9px] border-b border-sky-500/20 cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-2">
                                <div className="grid grid-cols-2 gap-0.5 opacity-40">
                                  {[...Array(4)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />)}
                                </div>
                                <span>{z.i}</span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setCurrentLayout(currentLayout.filter(item => item.i !== z.i)); }} className="hover:text-rose-400 transition-colors p-1">
                                <XCircle size={14} />
                              </button>
                           </div>
                           <div className="flex-1 flex flex-col items-center justify-center leading-none pointer-events-none p-4 w-full">
                              <div className="relative">
                                <span className="font-black text-3xl tracking-tighter text-text drop-shadow-2xl">{z.w} : {z.h}</span>
                                <div className="absolute -inset-2 bg-sky-500/10 blur-xl rounded-full -z-10" />
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <div className="h-px w-4 bg-sky-500/30" />
                                <span className="text-[8px] font-black text-sky-400/60 uppercase tracking-widest">{z.x}, {z.y}</span>
                                <div className="h-px w-4 bg-sky-500/30" />
                              </div>
                           </div>
                           <div className="absolute bottom-0 right-0 w-4 h-4 p-1 pointer-events-none opacity-40 group-hover:opacity-100">
                              <div className="w-full h-full border-r-2 border-b-2 border-sky-400 rounded-br-sm" />
                           </div>
                        </div>
                      ))}
                   </GridLayout>
                </div>
                <div className="mt-8 flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                   <input type="text" placeholder="Layout Name" className="nexus-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)}/>
                   <button onClick={saveTemplate} className="nexus-btn-primary whitespace-nowrap px-10 tracking-[2px]">Save</button>
                </div>
             </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card 
                  className="p-8" 
                  title="Inspector" 
                  icon={Info} 
                  subtitle="Frame Coordinate Control"
                >
                   <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar mt-2">
                      {currentLayout.map((z, idx) => (
                        <div key={z.i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="font-black text-xs text-sky-400">{z.i.toUpperCase()}</span>
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase opacity-40">Width</label>
                                 <input type="number" min="1" max="12" value={z.w} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].w = parseInt(e.target.value) || 1;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-sky-500/50 text-text"/>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase opacity-40">Height</label>
                                 <input type="number" min="1" max="12" value={z.h} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].h = parseInt(e.target.value) || 1;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-sky-500/50 text-text"/>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>

                <Card 
                  className="p-8" 
                  title="Library" 
                  icon={FileText} 
                  subtitle="Saved Layout Manifest"
                >
                   <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar mt-2">
                      {templates.map(t => (
                        <div key={t.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                           <div>
                              <p className="text-[10px] font-extrabold truncate max-w-[120px] uppercase text-text">{t.name}</p>
                              <p className="text-[8px] font-bold text-sky-400 opacity-60 uppercase">{safeParseJSON(t.layout).length} FRAMES</p>
                           </div>
                           <button onClick={() => setCurrentLayout(safeParseJSON(t.layout))} className="text-[9px] font-black border border-white/20 px-3 py-1 rounded-lg hover:bg-white hover:text-black transition-all text-text">LOAD</button>
                        </div>
                      ))}
                   </div>
                </Card>
             </div>
          </div>
        );

      case 'users':
        return (
          <div className="animate-fade-in max-w-5xl mx-auto">
            {showUserForm ? (
              <Card 
                className="max-w-xl mx-auto p-10" 
                title="Personnel Provisioning" 
                icon={Plus} 
                subtitle="New Station Operator"
              >
                <form onSubmit={provisionUser} className="space-y-6 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Legal Name</label>
                    <input type="text" required className="nexus-input" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Secure Email</label>
                    <input type="email" required className="nexus-input" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Password</label>
                    <input type="password" required className="nexus-input" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Clearance Level</label>
                    <select className="nexus-input" value={newUser.role} onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}>
                      <option value="user">Standard User</option>
                      <option value="admin">Root Administrator</option>
                    </select>
                  </div>
                  <button type="submit" className="nexus-btn-primary w-full py-4 mt-4 font-black tracking-widest uppercase">PROVISION ACCOUNT</button>
                </form>
              </Card>
            ) : (
              <Card 
                title="Personnel Directory" 
                icon={UsersIcon} 
                subtitle={`Total Authorized: ${users.length} Operators`}
              >
                <div className="flex justify-end mb-8 mt-[-60px]">
                   <button onClick={() => setShowUserForm(true)} className="nexus-btn-primary text-xs py-2 px-6 shadow-xl">+ Add User</button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase font-black text-text-dim">
                        <th className="py-4 px-6">Identity</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">System Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-6 px-6">
                             <p className="font-bold text-lg leading-none text-text">{u.name}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{u.email}</p>
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex flex-col gap-2">
                              <Badge label={u.role} type={u.role}/>
                              {u.isLocked && <Badge label="Locked" type="locked"/>}
                              {u.passwordResetRequested && <Badge label="Reset Requested" type="reset"/>}
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                 <span className="text-[10px] font-black uppercase text-slate-400">{u.status}</span>
                              </div>
                              <div className="flex gap-2">
                                {u.email !== getLoggedInUser()?.email && (
                                  <>
                                    {u.isLocked ? (
                                      <button onClick={() => unlockUser(u.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-text transition-colors" title="Unlock Account"><CheckCircle size={14}/></button>
                                    ) : (
                                      <button onClick={() => lockUser(u.id)} className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-text transition-colors" title="Lock Account"><Lock size={14}/></button>
                                    )}
                                    <button onClick={() => deleteUser(u.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-text transition-colors" title="Delete User"><Trash2 size={14}/></button>
                                  </>
                                )}
                                {u.passwordResetRequested && (
                                  <button onClick={() => approveReset(u.id)} className="p-2 bg-sky-500/10 text-sky-400 rounded-lg hover:bg-sky-500 hover:text-text transition-colors" title="Approve Reset"><Clock size={14}/></button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <Card 
              title="Idle Screen" 
              icon={Monitor} 
              subtitle="Default Content Configuration"
            >
              <div className="space-y-6 mt-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 block">Global Default Media</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select className="nexus-input" value={settings.idleWallpaperId || ''} onChange={(e) => saveSettings('idleWallpaperId', e.target.value)}>
                      <option value="">System Default (Quotes)</option>
                      {approvedMedia.map(m => <option key={m.id} value={m.id}>{m.fileName} ({m.fileType})</option>)}
                    </select>
                    <div className="flex items-center gap-3 px-4 py-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                      <Info className="text-sky-400 shrink-0" size={16} />
                      <p className="text-[10px] font-bold text-sky-400 uppercase leading-tight">This asset will play when no specific schedule is active.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              className="border-rose-500/20" 
              title="System Maintenance" 
              icon={AlertCircle} 
              subtitle="Critical Operations"
            >
              <div className="flex items-center justify-between p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl mt-4">
                <div>
                   <p className="font-bold text-rose-200">Reset Local Database</p>
                   <p className="text-xs text-rose-500/60 uppercase font-black mt-1">Permanently wipe all schedules and media records</p>
                </div>
                <button onClick={executeSystemReset} className="px-6 py-2.5 bg-rose-500 text-text rounded-xl font-black text-[10px] uppercase hover:bg-rose-600 transition-all">Execute Reset</button>
              </div>
            </Card>
          </div>
        );
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
      dashboard: 'DASHBOARD',
      approve: 'APPLICATION',
      schedule: 'BROADCAST',
      templates: 'LAYOUT',
      ticker: 'TICKER',
      screens: 'SCREENS',
      users: 'USERS',
      settings: 'IDLE',
      live: 'CURRENT SCREEN'
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
      default: return <Monitor className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <Shell role="admin" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-10 max-w-7xl mx-auto">
        <header className="mb-12 pb-8 flex justify-between items-end border-b border-white/10 relative">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-500/20 rounded-lg">{getTabIcon()}</div>
            </div>
            <h1 className="text-8xl font-black tracking-tighter leading-none text-text uppercase">{getTabLabel()}</h1>
          </div>
        </header>
        {renderView()}
      </div>
      <PreviewModal isOpen={showPreview} onClose={() => { setShowPreview(false); setPreviewFile(null); }} file={previewFile} />
      <ModerationModal key={modFile?.id} isOpen={showModModal} onClose={() => { setShowModModal(false); setModFile(null); }} file={modFile} onConfirm={handleModeration} />
    </Shell>
  );
};

export default AdminDashboard;
