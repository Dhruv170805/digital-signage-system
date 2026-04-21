import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Shell from '../components/Shell';
import { 
  Users as UsersIcon, CheckCircle, XCircle, Clock, 
  Play, Plus, Trash2, Settings as SettingsIcon, ExternalLink, Activity, 
  FileText, Calendar, LayoutGrid, Type as TypeIcon,
  Save, AlertCircle, Tv, Monitor, Palette, Info, Eye, CheckSquare, MonitorPlay, Lock, Timer, Send, RefreshCw
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`glass p-6 ${className}`}>{children}</div>
);

const Badge = ({ label, type }) => {
  const colors = {
    admin: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    user: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    locked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    reset: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${colors[type] || 'bg-white/5 text-white/40 border-white/10'}`}>
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
            <h3 className="text-xl font-black uppercase tracking-tighter">{file.fileName}</h3>
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{file.fileType} • {new Date(file.uploadedAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="flex-1 bg-black/40 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
          {file.fileType === 'video' ? (
            <video src={src} autoPlay controls className="w-full h-full object-contain" />
          ) : file.fileType === 'pdf' ? (
            <iframe src={`${src}#toolbar=0`} className="w-full h-full border-none" title={file.fileName} />
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
  const [startTime, setStartTime] = useState(file?.requestedStartTime ? new Date(file.requestedStartTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState(file?.requestedEndTime ? new Date(file.requestedEndTime).toISOString().slice(0, 16) : '');
  const [reason, setReason] = useState('');

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
      <div className="glass max-w-lg w-full p-10 space-y-8 animate-fade-in border-white/10">
        <div className="flex justify-between items-center pb-6 border-b border-white/5">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Asset Moderation</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle /></button>
        </div>

        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
          <button onClick={() => setAction('approve')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${action === 'approve' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Approve</button>
          <button onClick={() => setAction('reject')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${action === 'reject' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Reject</button>
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
          onClick={() => onConfirm(file.id, action, action === 'approve' ? { startTime, endTime } : { reason })}
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
  const [ticker, setTicker] = useState({ text: '', speed: 5, isActive: 1, fontSize: 'text-4xl', fontStyle: 'font-normal' });
  const [settings, setSettings] = useState({});
  const [schedules, setSchedules] = useState([]);
  
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [templateName, setTemplateName] = useState('');
  const [currentLayout, setCurrentLayout] = useState([]);
  const [newSchedule, setNewSchedule] = useState({ screenId: '', templateId: '', mediaId: '', startTime: '', endTime: '' });
  const [mediaMapping, setMediaMapping] = useState({});
  const [architectWidth, setArchitectWidth] = useState(0);
  const architectRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [modFile, setModFile] = useState(null);
  const [showModModal, setShowModModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [u, m, p, t, s, tk, st, sch] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media/pending`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/templates`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/screens`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedule`)
      ]);
      setUsers(u.data);
      setMedia(m.data);
      setPendingMedia(p.data);
      setTemplates(t.data);
      setScreens(s.data);
      setTicker(tk.data);
      setSettings(st.data);
      setSchedules(sch.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
    const interval = setInterval(fetchData, 30000); // 30s auto-fetch
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
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const saveTicker = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/ticker`, ticker);
      alert('Ticker Updated');
    } catch (err) { alert(err.message); }
  };

  const saveTemplate = async () => {
    if (!templateName) return alert('Enter Layout Name');
    
    // Check for duplicate name
    const isDuplicate = templates.some(t => t.name.toLowerCase() === templateName.trim().toLowerCase());
    if (isDuplicate) {
      return alert('A layout with this name already exists. Please choose a unique name.');
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/templates`, { name: templateName.trim(), layout: currentLayout });
      alert('Layout Saved');
      setTemplateName('');
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const provisionUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, newUser);
      alert('User Provisioned');
      setShowUserForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    const data = { ...newSchedule, mediaMapping: JSON.stringify(mediaMapping) };
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, data);
      alert('Broadcast Scheduled');
      setNewSchedule({ screenId: '', templateId: '', mediaId: '', startTime: '', endTime: '' });
      setMediaMapping({});
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Terminate Broadcast?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/schedule/${id}`);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const saveSettings = async (key, val) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, { [key]: val });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const unlockUser = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/unlock`);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const lockUser = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/lock`);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Purge personnel records?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}`);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const approveReset = async (id) => {
    const pw = prompt('Set Temporary Password:');
    if (!pw) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/approve-reset`, { newPassword: pw });
      alert('Password Updated');
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch { return fallback; }
  };

  const approvedMedia = media.filter(m => m.status === 'approved');

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
             <Card className="flex flex-col justify-between border-sky-500/20">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-sky-500/10 rounded-xl"><Tv className="text-sky-400 w-5 h-5"/></div>
                   <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Online</span>
                </div>
                <div className="mt-8">
                   <p className="text-5xl font-black tracking-tighter">{screens.filter(s => s.status === 'online').length}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Active Terminals</p>
                </div>
             </Card>
             <Card className="flex flex-col justify-between border-emerald-500/20">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-emerald-500/10 rounded-xl"><Calendar className="text-emerald-400 w-5 h-5"/></div>
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
                <div className="mt-8">
                   <p className="text-5xl font-black tracking-tighter">{schedules.length}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Live Broadcasts</p>
                </div>
             </Card>
             <Card className="flex flex-col justify-between border-amber-500/20">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-amber-500/10 rounded-xl"><CheckSquare className="text-amber-400 w-5 h-5"/></div>
                   <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Required</span>
                </div>
                <div className="mt-8">
                   <p className="text-5xl font-black tracking-tighter">{pendingMedia.length}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Pending Approvals</p>
                </div>
             </Card>
             <Card className="flex flex-col justify-between border-indigo-500/20">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-indigo-500/10 rounded-xl"><UsersIcon className="text-indigo-400 w-5 h-5"/></div>
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total</span>
                </div>
                <div className="mt-8">
                   <p className="text-5xl font-black tracking-tighter">{users.length}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Authorized Personnel</p>
                </div>
             </Card>
          </div>
        );

      case 'approve':
        return (
          <div className="animate-fade-in space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-8">Pending Verification Queue</h3>
            {pendingMedia.length === 0 ? (
               <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                 <CheckCircle className="mx-auto text-emerald-500 opacity-20 mb-4" size={48} />
                 <p className="text-slate-500 uppercase font-black tracking-[4px] text-xs">Clearance Queue Empty</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pendingMedia.map(m => (
                   <Card key={m.id} className="group relative">
                      <div className="aspect-video bg-black/60 rounded-xl overflow-hidden mb-6 border border-white/10 relative">
                         {m.fileType === 'video' ? <video src={`${import.meta.env.VITE_API_URL}/${m.filePath}`} className="w-full h-full object-cover opacity-50" /> : <img src={`${import.meta.env.VITE_API_URL}/${m.filePath}`} className="w-full h-full object-cover opacity-50" />}
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setPreviewFile(m); setShowPreview(true); }} className="p-4 bg-white text-black rounded-full shadow-2xl transform scale-75 group-hover:scale-100 transition-transform"><Eye size={20}/></button>
                         </div>
                      </div>
                      <h4 className="font-bold truncate text-white uppercase tracking-tight">{m.fileName}</h4>
                      <p className="text-[9px] font-black text-sky-400 mt-1 uppercase tracking-widest">{m.fileType} • {(m.uploaderId?.name || 'Unknown').split(' ')[0]}</p>
                      
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase">
                           <span>Requested Window:</span>
                        </div>
                        <div className="flex gap-2">
                           <div className="flex-1 bg-black/40 p-2 rounded-lg border border-white/5">
                              <p className="text-[7px] opacity-40 mb-1 tracking-tighter">START</p>
                              <p className="text-[9px] text-white tabular-nums">{m.requestedStartTime ? new Date(m.requestedStartTime).toLocaleDateString() : 'IMMEDIATE'}</p>
                           </div>
                           <div className="flex-1 bg-black/40 p-2 rounded-lg border border-white/5">
                              <p className="text-[7px] opacity-40 mb-1 tracking-tighter">END</p>
                              <p className="text-[9px] text-white tabular-nums">{m.requestedEndTime ? new Date(m.requestedEndTime).toLocaleDateString() : 'UNSET'}</p>
                           </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => { setModFile(m); setShowModModal(true); }}
                        className="w-full mt-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--accent)]/10"
                      >
                        Review Asset
                      </button>
                   </Card>
                 ))}
              </div>
            )}
          </div>
        );

      case 'schedule':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
             <Card className="lg:col-span-1 border-sky-500/10">
                <div className="flex items-center gap-3 mb-8">
                   <Calendar className="w-4 h-4 text-sky-400" />
                   <h3 className="text-xs font-bold uppercase tracking-wider">Broadcast System</h3>
                </div>
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
                       setNewSchedule(p => ({ ...p, templateId: e.target.value }));
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
                        {safeParse(templates.find(t => t.id === newSchedule.templateId)?.layout).map((z) => (
                          <div key={z.i} className="space-y-1">
                            <label className="text-[9px] font-bold uppercase ml-1 opacity-50">Zone {z.i}</label>
                            <select required className="nexus-input py-2 text-xs" value={mediaMapping[z.i] || ''} onChange={(e) => setMediaMapping(p => ({ ...p, [z.i]: e.target.value }))}>
                               <option value="">Select Asset</option>
                               {approvedMedia.map(m => <option key={m.id} value={m.id}>{m.fileName}</option>)}
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

             <Card className="lg:col-span-3 overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xs font-bold uppercase tracking-wider">Live Manifest</h3>
                   <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-[8px] font-black text-sky-400 uppercase animate-pulse">Sync Active</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/5 text-[9px] font-black uppercase text-slate-500">
                           <th className="py-4 px-6">Media / Template</th>
                           <th className="py-4 px-6">Terminal</th>
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
                                  <p className="font-bold text-white uppercase text-xs tracking-tight">{t ? t.name : (m?.fileName || 'Asset Unknown')}</p>
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
                                  <button onClick={() => deleteSchedule(s.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
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
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <Card className="lg:col-span-2">
               <h3 className="text-sm font-bold uppercase tracking-wider mb-8">Ticker Control</h3>
               <div className="space-y-8">
                  <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-[var(--border)]">
                     {['text', 'link'].map(t => (
                       <button key={t} onClick={() => setTicker(p => ({ ...p, type: t }))} className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${ticker.type === t ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
                     ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Message</label>
                    <textarea value={ticker.text} onChange={(e) => setTicker(p => ({ ...p, text: e.target.value }))} className="nexus-input min-h-[120px] resize-none" placeholder="Transmit high-priority alert..."/>
                  </div>
                  {ticker.type === 'link' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Data Source URL</label>
                      <input type="url" value={ticker.linkUrl} onChange={(e) => setTicker(p => ({ ...p, linkUrl: e.target.value }))} className="nexus-input" placeholder="https://external.feed/api/v1"/>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-[var(--border)] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase ml-1 opacity-50 flex justify-between">
                          <span>Transmission Speed</span>
                          <span className="text-sky-400">{ticker.speed}X</span>
                        </label>
                        <input type="range" min="1" max="10" value={ticker.speed} onChange={(e) => setTicker(p => ({ ...p, speed: parseInt(e.target.value) }))} className="w-full accent-[var(--accent)] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"/>
                      </div>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mt-4">
                      <p className="text-[10px] font-bold uppercase opacity-30 mb-2">Preview</p>
                      <div className="h-12 flex items-center overflow-hidden">
                        <div className="flex gap-12 whitespace-nowrap animate-ticker" style={{ animationDuration: ticker.isActive ? `${Math.max(5, 60 - ticker.speed * 5)}s` : '0s' }}>
                            <p className={`${ticker.fontSize} ${ticker.fontStyle}`}>
                                {ticker.text || 'BROADCAST ACTIVE // READY FOR DATA TRANSMISSION...'}
                            </p>
                            {/* Duplicated for loop */}
                            <p className={`${ticker.fontSize} ${ticker.fontStyle}`}>
                                {ticker.text || 'BROADCAST ACTIVE // READY FOR DATA TRANSMISSION...'}
                            </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={saveTicker} className="nexus-btn-primary w-full py-4 tracking-[4px]">Broadcast</button>
               </div>
            </Card>

            <Card>
               <h3 className="text-sm font-bold uppercase tracking-wider mb-8">Visual Formatting</h3>
               <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase ml-1 opacity-50 flex items-center gap-2"><Palette size={14}/> Font Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-4xl', 'text-6xl', 'text-8xl', 'text-9xl'].map(size => (
                        <button 
                          key={size}
                          onClick={() => setTicker(p => ({ ...p, fontSize: size }))}
                          className={`py-2 rounded-lg text-[10px] font-bold border ${ticker.fontSize === size ? 'bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]' : 'border-white/10 hover:border-white/30'}`}
                        >
                          {size.replace('text-', '').toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase ml-1 opacity-50 flex items-center gap-2"><TypeIcon size={14}/> Font Style</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'Thin', val: 'font-thin' },
                        { label: 'Normal', val: 'font-normal' },
                        { label: 'Medium', val: 'font-medium' },
                        { label: 'Semibold', val: 'font-semibold' },
                        { label: 'Bold', val: 'font-bold' },
                        { label: 'Extra Bold', val: 'font-extrabold' },
                        { label: 'Black', val: 'font-black' },
                        { label: 'Italic', val: 'italic' },
                        { label: 'Bold Italic', val: 'font-bold italic' }
                      ].map(style => (
                        <button 
                          key={style.val}
                          onClick={() => setTicker(p => ({ ...p, fontStyle: style.val }))}
                          className={`py-3 px-4 rounded-xl text-xs font-bold border text-left flex justify-between items-center ${ticker.fontStyle === style.val ? 'bg-white/10 border-white/30' : 'border-transparent hover:bg-white/5'}`}
                        >
                          {style.label}
                          {ticker.fontStyle === style.val && <CheckCircle size={14} className="text-sky-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
            </Card>
          </div>
        );

      case 'templates':
        const rowHeight = architectWidth > 0 ? (architectWidth / 12) * (9/16) : 50;
        return (
          <div className="space-y-8 animate-fade-in">
             <Card className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                   <div>
                     <h3 className="text-sm font-bold uppercase tracking-wider">Layout Architect</h3>
                     <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mt-1">Grid System: 12 x 12 Precision Mapping</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     <button onClick={() => setCurrentLayout([{ i: 'Main', x: 0, y: 0, w: 12, h: 12 }])} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">Fullscreen</button>
                     <button onClick={() => setCurrentLayout([{ i: 'Left', x: 0, y: 0, w: 6, h: 12 }, { i: 'Right', x: 6, y: 0, w: 6, h: 12 }])} className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase text-sky-400 hover:bg-sky-500 hover:text-white transition-all">50/50 V</button>
                     <button onClick={() => setCurrentLayout([{ i: 'Top', x: 0, y: 0, w: 12, h: 6 }, { i: 'Bottom', x: 0, y: 6, w: 12, h: 6 }])} className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase text-sky-400 hover:bg-sky-500 hover:text-white transition-all">50/50 H</button>
                     <button onClick={() => setCurrentLayout([{ i: 'TL', x: 0, y: 0, w: 6, h: 6 }, { i: 'TR', x: 6, y: 0, w: 6, h: 6 }, { i: 'BL', x: 0, y: 6, w: 6, h: 6 }, { i: 'BR', x: 6, y: 6, w: 6, h: 6 }])} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">Quad</button>
                     <button onClick={() => setCurrentLayout([{ i: 'Main', x: 0, y: 0, w: 9, h: 12 }, { i: 'Side', x: 9, y: 0, w: 3, h: 12 }])} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">Sidebar</button>
                     <button onClick={() => { if(window.confirm('Wipe current design?')) setCurrentLayout([]); }} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500 hover:text-white transition-all">Wipe</button>
                     <button onClick={() => setCurrentLayout([...currentLayout, { i: `Frame${currentLayout.length+1}`, x: 0, y: 0, w: 4, h: 4 }])} className="px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-sky-400 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">+ Add Frame</button>
                   </div>
                </div>
                <div ref={architectRef} className="bg-slate-950 border-4 border-white/10 rounded-[40px] relative overflow-hidden grid-bg shadow-[0_0_100px_rgba(0,0,0,0.5)] p-0" style={{ height: architectWidth > 0 ? (Math.floor(rowHeight) * 12) : 'auto', minHeight: '400px' }}>
                   {/* Grid Overlay for visual aid - Force 12x12 */}
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
                        
                        // 1. Clamp size first
                        w = Math.max(1, Math.min(Math.round(w), 12));
                        h = Math.max(1, Math.min(Math.round(h), 12));
                        
                        // 2. Clamp position based on size
                        if (x < 0) x = 0;
                        if (y < 0) y = 0;
                        if (x + w > 12) x = 12 - w;
                        if (y + h > 12) y = 12 - h;

                        return { i, x: Math.round(x), y: Math.round(y), w, h };
                      });
                      
                      const hasChanged = JSON.stringify(validatedLayout) !== JSON.stringify(currentLayout);
                      if (hasChanged) {
                        setCurrentLayout(validatedLayout);
                      }
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
                        <div key={z.i} className="bg-slate-900/90 border border-sky-500/30 backdrop-blur-md flex flex-col items-center justify-center text-white group overflow-hidden rounded-xl shadow-2xl transition-all hover:border-sky-400">
                           <div className="drag-handle w-full bg-sky-500/20 backdrop-blur-md text-sky-200 flex justify-between items-center px-3 py-1.5 font-black uppercase tracking-widest text-[9px] border-b border-sky-500/20 cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-2">
                                <div className="grid grid-cols-2 gap-0.5 opacity-40">
                                  {[...Array(4)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />)}
                                </div>
                                <span>{z.i}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentLayout(currentLayout.filter(item => item.i !== z.i));
                                }}
                                className="hover:text-rose-400 transition-colors p-1"
                              >
                                <XCircle size={14} />
                              </button>
                           </div>
                           
                           <div className="flex-1 flex flex-col items-center justify-center leading-none pointer-events-none p-4 w-full">
                              <div className="relative">
                                <span className="font-black text-3xl tracking-tighter text-white drop-shadow-2xl">{z.w} : {z.h}</span>
                                <div className="absolute -inset-2 bg-sky-500/10 blur-xl rounded-full -z-10" />
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <div className="h-px w-4 bg-sky-500/30" />
                                <span className="text-[8px] font-black text-sky-400/60 uppercase tracking-widest">{z.x}, {z.y}</span>
                                <div className="h-px w-4 bg-sky-500/30" />
                              </div>
                           </div>
                           
                           {/* Decorative Corner Handles */}
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
                <Card className="p-5">
                   <h3 className="text-[10px] font-black uppercase tracking-[2px] mb-4 pb-2 border-b border-white/10">Inspector</h3>
                   <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
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
                                 }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-sky-500/50"/>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase opacity-40">Height</label>
                                 <input type="number" min="1" max="12" value={z.h} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].h = parseInt(e.target.value) || 1;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-sky-500/50"/>
                              </div>
                           </div>
                        </div>
                      ))}
                      {currentLayout.length === 0 && <p className="text-[10px] font-bold text-center opacity-30 py-10 uppercase">No active zones detected</p>}
                   </div>
                </Card>

                <Card className="p-5">
                   <h3 className="text-[10px] font-black uppercase tracking-[2px] mb-4 pb-2 border-b border-white/10">Library</h3>
                   <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                      {templates.map(t => (
                        <div key={t.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                           <div>
                              <p className="text-[10px] font-extrabold truncate max-w-[120px] uppercase text-white">{t.name}</p>
                              <p className="text-[8px] font-bold text-sky-400 opacity-60 uppercase">{safeParse(t.layout).length} FRAMES</p>
                           </div>
                           <button onClick={() => setCurrentLayout(safeParse(t.layout))} className="text-[9px] font-black border border-white/20 px-3 py-1 rounded-lg hover:bg-white hover:text-black transition-all">LOAD</button>
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
              <Card className="max-w-xl mx-auto p-10">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-xl font-bold">New Personnel</h3>
                   <button onClick={() => setShowUserForm(false)} className="text-slate-500 hover:text-white"><XCircle size={24}/></button>
                </div>
                <form onSubmit={provisionUser} className="space-y-6">
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
              <Card>
                <div className="flex justify-between items-center mb-10">
                   <div>
                     <h3 className="text-xl font-bold">User</h3>
                     <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold mt-1">Total Authorized: {users.length}</p>
                   </div>
                   <button onClick={() => setShowUserForm(true)} className="nexus-btn-primary text-xs py-2 px-6 shadow-xl">+Add User</button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase font-black text-[var(--text-dim)]">
                        <th className="py-4 px-6">Identity</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">System Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-6 px-6">
                             <p className="font-bold text-lg leading-none">{u.name}</p>
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
                                {u.email !== JSON.parse(localStorage.getItem('user'))?.email && (
                                  <>
                                    {u.isLocked ? (
                                      <button onClick={() => unlockUser(u.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors" title="Unlock Account">
                                        <CheckCircle size={14}/>
                                      </button>
                                    ) : (
                                      <button onClick={() => lockUser(u.id)} className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-colors" title="Lock Account">
                                        <Lock size={14}/>
                                      </button>
                                    )}
                                    <button onClick={() => deleteUser(u.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Delete User">
                                      <Trash2 size={14}/>
                                    </button>
                                  </>
                                )}
                                {u.passwordResetRequested && (
                                  <button onClick={() => approveReset(u.id)} className="p-2 bg-sky-500/10 text-sky-400 rounded-lg hover:bg-sky-500 hover:text-white transition-colors" title="Approve Reset">
                                    <Clock size={14}/>
                                  </button>
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
            <Card>
              <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                <Monitor className="text-sky-400" />
                Idle Screen
              </h3>
              <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 block">Global Default Media (Idle Wallpaper)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                      className="nexus-input" 
                      value={settings.idleWallpaperId || ''} 
                      onChange={(e) => saveSettings('idleWallpaperId', e.target.value)}
                    >
                      <option value="">System Default (Quotes)</option>
                      {approvedMedia.map(m => (
                        <option key={m.id} value={m.id}>{m.fileName} ({m.fileType})</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-3 px-4 py-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                      <Info className="text-sky-400 shrink-0" size={16} />
                      <p className="text-[10px] font-bold text-sky-400 uppercase leading-tight">This asset will play on all terminals when no specific schedule is active.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-rose-500/20">
               <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-rose-400">
                <AlertCircle />
                System Maintenance
              </h3>
              <div className="flex items-center justify-between p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                <div>
                   <p className="font-bold text-rose-200">Reset Local Database</p>
                   <p className="text-xs text-rose-500/60 uppercase font-black mt-1">Permanently wipe all schedules and media records</p>
                </div>
                <button className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase hover:bg-rose-600 transition-all">Execute Reset</button>
              </div>
            </Card>
          </div>
        );
      case 'live':
        return (
           <div className="animate-fade-in px-4">
              <div className="flex justify-between items-center mb-8">
              </div>
              <div className="aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative group shadow-sky-500/5">
                 <iframe src="/display" className="w-full h-full border-none pointer-events-none scale-[1.001]" title="Live Preview" />
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <p className="text-white text-lg tracking-[12px] font-black animate-pulse uppercase">Monitoring Active</p>
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
              <div className="p-2 bg-sky-500/20 rounded-lg">
                {getTabIcon()}
              </div>
            </div>
            <h1 className="text-8xl font-black tracking-tighter leading-none text-white uppercase">{getTabLabel()}</h1>
          </div>
        </header>
        {renderView()}
      </div>
      <PreviewModal 
        isOpen={showPreview} 
        onClose={() => { setShowPreview(false); setPreviewFile(null); }} 
        file={previewFile} 
      />
      <ModerationModal
        key={modFile?.id}
        isOpen={showModModal}
        onClose={() => { setShowModModal(false); setModFile(null); }}
        file={modFile}
        onConfirm={handleModeration}
      />
    </Shell>
  );
};

export default AdminDashboard;
