import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import Shell from '../components/Shell';
import { 
  Users as UsersIcon, CheckCircle, XCircle, Clock, 
  Play, Plus, Trash2, Settings as SettingsIcon, ExternalLink, Activity, 
  FileText, Calendar, LayoutGrid, Type as TypeIcon,
  Save, AlertCircle, Tv, Monitor, Palette, Info
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`glass p-6 ${className}`}>{children}</div>
);

const Badge = ({ label, type }) => {
  const colors = {
    approved: 'bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20',
    pending: 'bg-[var(--orange)]/10 text-[var(--orange)] border-[var(--orange)]/20',
    rejected: 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20',
    admin: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20',
    user: 'bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[type] || ''}`}>
      {label}
    </span>
  );
};

const safeParse = (data, fallback = []) => {
  if (!data) return fallback;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ media: 0, pending: 0, users: 0, screens: 0 });
  const [pendingMedia, setPendingMedia] = useState([]);
  const [users, setUsers] = useState([]);
  const [ticker, setTicker] = useState({ text: '', speed: 5, type: 'text', linkUrl: '', isActive: 1, fontSize: 'text-4xl', fontStyle: 'normal' });
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [approvedMedia, setApprovedMedia] = useState([]);
  const [screens, setScreens] = useState([]);
  const [settings, setSettings] = useState({ idleWallpaperId: '' });
  
  const [newScreen, setNewScreen] = useState({ name: '', location: '' });
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [currentLayout, setCurrentLayout] = useState([{ i: 'zone1', x: 0, y: 0, w: 12, h: 6 }]);
  const [templateName, setTemplateName] = useState('');
  const [newSchedule, setNewSchedule] = useState({
    mediaId: '', templateId: '', startTime: '', endTime: '', duration: 10, screenId: ''
  });
  const [mediaMapping, setMediaMapping] = useState({});
  const architectRef = useRef(null);
  const [architectWidth, setArchitectWidth] = useState(800);

  useEffect(() => {
    if (!architectRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setArchitectWidth(entry.contentRect.width - 16);
        }
      }
    });
    observer.observe(architectRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    try {
      const [mediaRes, usersRes, screensRes, tickerRes, templatesRes, schedulesRes, pendingRes, settingsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/screens`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/templates`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedule`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/media/pending`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings`)
      ]);

      setApprovedMedia(mediaRes.data);
      setUsers(usersRes.data);
      setScreens(screensRes.data);
      setTicker(prev => ({ ...prev, ...tickerRes.data }));
      setTemplates(templatesRes.data);
      setSchedules(schedulesRes.data);
      setPendingMedia(pendingRes.data);
      setSettings(settingsRes.data);
      setStats({ 
        media: mediaRes.data.length, 
        pending: pendingRes.data.length, 
        users: usersRes.data.length, 
        screens: screensRes.data.length 
      });
    } catch (err) { console.error(err); }
  }, []);

  const saveSettings = async (key, value) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, { key, value });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const terminateBroadcast = async (id) => {
    if (!window.confirm('Terminate this broadcast mission?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/schedule/${id}`);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModeration = async (id, action) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/${id}/${action}`);
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
    if (!templateName) return alert('Enter template name');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/templates`, { name: templateName, layout: currentLayout });
      alert('Template Saved');
      setTemplateName('');
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, { ...newSchedule, mediaMapping });
      alert('Schedule Created');
      setNewSchedule({ mediaId: '', templateId: '', startTime: '', endTime: '', duration: 10, screenId: '' });
      setMediaMapping({});
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const registerScreen = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/screens/register`, newScreen);
      alert('Screen Registered');
      setNewScreen({ name: '', location: '' });
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

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'total file', value: stats.media, icon: FileText, color: 'text-sky-400' },
                { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
                { label: 'Users', value: stats.users, icon: UsersIcon, color: 'text-indigo-400' },
                { label: 'Screens', value: stats.screens, icon: Tv, color: 'text-emerald-400' },
              ].map((s, i) => (
                <Card key={i} className="flex justify-between items-center glass-hover">
                  <div>
                    <p className="text-4xl font-extrabold mb-1">{s.value}</p>
                    <p className="text-[var(--text-dim)] text-[10px] uppercase font-bold tracking-wider">{s.label}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white/5 ${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <AlertCircle className="w-4 h-4 text-sky-400" />
                   <h3 className="text-xs font-bold uppercase tracking-wider">System Intelligence</h3>
                </div>
                <div className="space-y-4">
                  {pendingMedia.length > 0 ? (
                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-6">
                      <div className="p-4 bg-amber-500/20 rounded-full">
                        <Clock className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight text-amber-200">Attention Required</p>
                        <p className="text-sm font-medium text-amber-500/80 uppercase">{pendingMedia.length} Pending Approvals in Queue</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-6">
                      <div className="p-4 bg-emerald-500/20 rounded-full">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight text-emerald-200">Status: Normal</p>
                        <p className="text-sm font-medium text-emerald-500/80 uppercase">All systems executing as expected</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <Play className="w-4 h-4 text-sky-400" />
                   <h3 className="text-xs font-bold uppercase tracking-wider">Broadcast Stream</h3>
                </div>
                <div className="bg-black/40 border border-[var(--border)] rounded-2xl p-8 overflow-hidden relative min-h-[140px] flex items-center">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />
                  <div className="flex gap-12 whitespace-nowrap animate-ticker w-full" style={{ animationDuration: `${(100 - ticker.speed * 10)}s` }}>
                    <span className={`font-bold ${ticker.fontSize} ${ticker.fontStyle === 'italic' ? 'italic' : ''} ${ticker.fontStyle === 'bold' ? 'font-black' : ''}`}>
                      {ticker.text || 'SYSTEM_READY_FOR_BROADCAST...'}
                    </span>
                    <span className={`font-bold ${ticker.fontSize} ${ticker.fontStyle === 'italic' ? 'italic' : ''} ${ticker.fontStyle === 'bold' ? 'font-black' : ''}`}>
                      {ticker.text || 'SYSTEM_READY_FOR_BROADCAST...'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'approve':
        return (
          <Card className="animate-fade-in">
             <h3 className="text-sm font-bold uppercase tracking-wider mb-6">Application Console</h3>
             {pendingMedia.length === 0 ? <div className="text-center py-20 opacity-40"><Info className="w-12 h-12 mx-auto mb-4" /><p>No pending requests.</p></div> : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-[var(--border)] text-[10px] uppercase text-[var(--text-dim)] font-bold">
                       <th className="pb-4 px-4">Asset</th>
                       <th className="pb-4 px-4">Uploader</th>
                       <th className="pb-4 px-4">Requested Window</th>
                       <th className="pb-4 px-4">Type</th>
                       <th className="pb-4 px-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                     {pendingMedia.map(m => (
                       <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                         <td className="py-4 px-4 text-sm font-semibold">{m.fileName}</td>
                         <td className="py-4 px-4 text-xs text-[var(--text-dim)]">{m.uploaderName}</td>
                         <td className="py-4 px-4">
                            {m.requestedStartTime ? (
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-sky-400 uppercase">START: {new Date(m.requestedStartTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                                 <p className="text-[9px] font-black text-rose-400 uppercase">END: {new Date(m.requestedEndTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600 italic">No Window</span>
                            )}
                         </td>
                         <td className="py-4 px-4"><span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-white/5 rounded">{m.fileType}</span></td>
                         <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleModeration(m.id, 'approve')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20"><CheckCircle size={18}/></button>
                              <button onClick={() => handleModeration(m.id, 'reject')} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20"><XCircle size={18}/></button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </Card>
        );

      case 'screens':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <Card>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-8">Provision Screen</h3>
                <form onSubmit={registerScreen} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Identity</label>
                     <input type="text" required className="nexus-input" placeholder="Screen Name" value={newScreen.name} onChange={(e) => setNewScreen(p => ({ ...p, name: e.target.value }))}/>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Deployment Zone</label>
                     <input type="text" className="nexus-input" placeholder="Location" value={newScreen.location} onChange={(e) => setNewScreen(p => ({ ...p, location: e.target.value }))}/>
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full flex items-center justify-center gap-2"><Plus size={18}/> REGISTER TERMINAL</button>
                </form>
             </Card>
             <Card className="lg:col-span-2">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-8">Active Fleet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {screens.map(s => (
                     <div key={s.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl glass-hover">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-bold">{s.name}</h4>
                            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{s.location}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${s.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                        </div>
                        <a href={`/display?screenId=${s.id}`} target="_blank" rel="noreferrer" className="block text-center bg-[var(--accent)]/10 text-[var(--accent)] py-2.5 rounded-xl text-xs font-bold border border-[var(--accent)]/20 hover:bg-[var(--accent)] hover:text-white transition-all">Launch Feed</a>
                     </div>
                   ))}
                </div>
             </Card>
          </div>
        );

      case 'schedule': {
        const selectedTemplate = templates.find(t => t.id === newSchedule.templateId);
        const zones = selectedTemplate ? safeParse(selectedTemplate.layout) : [];

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <Card>
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <Calendar className="w-4 h-4 text-sky-400" />
                   <h3 className="text-xs font-bold uppercase tracking-wider">Broadcast System</h3>
                </div>
                <form onSubmit={createSchedule} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Target Deployment</label>
                     <select className="nexus-input" value={newSchedule.screenId} onChange={(e) => setNewSchedule(p => ({ ...p, screenId: e.target.value }))}>
                        <option value="">Broadcast to All</option>
                        {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Layout Architecture</label>
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
                       <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Primary Asset</label>
                       <select required className="nexus-input" value={newSchedule.mediaId} onChange={(e) => setNewSchedule(p => ({ ...p, mediaId: e.target.value }))}>
                          <option value="">Select Asset</option>
                          {approvedMedia.map(m => <option key={m.id} value={m.id}>{m.fileName}</option>)}
                       </select>
                     </div>
                   ) : (
                     <div className="space-y-4 p-4 border border-[var(--border)] bg-black/20 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-center border-b border-[var(--border)] pb-2 mb-4">Zone Mapping</p>
                        {zones.map((z) => (
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
                        <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Activation Time</label>
                        <input type="datetime-local" required className="nexus-input text-xs" value={newSchedule.startTime} onChange={(e) => setNewSchedule(p => ({ ...p, startTime: e.target.value }))}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Deactivation Time</label>
                        <input type="datetime-local" required className="nexus-input text-xs" value={newSchedule.endTime} onChange={(e) => setNewSchedule(p => ({ ...p, endTime: e.target.value }))}/>
                      </div>
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full tracking-[2px]">INITIATE BROADCAST</button>
                </form>
             </Card>
             <Card className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <Clock className="w-4 h-4 text-sky-400" />
                   <h3 className="text-xs font-bold uppercase tracking-wider">Broadcast log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-dim)]">
                           <th className="pb-4 px-4">Content Manifest</th>
                           <th className="pb-4 px-4">Active Window</th>
                           <th className="pb-4 px-4 text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border)]">
                        {schedules.map(s => {
                          const isLive = new Date() >= new Date(s.startTime) && new Date() <= new Date(s.endTime);
                          return (
                            <tr key={s.id} className="group hover:bg-white/5 transition-colors">
                              <td className="py-5 px-4">
                                <p className="text-sm font-bold text-white">{s.templateName || s.fileName}</p>
                                <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{s.screenName || 'Global Feed'}</p>
                              </td>
                              <td className="py-5 px-4 font-mono text-[10px]">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-emerald-400 font-bold">START:</span>
                                    <span>{new Date(s.startTime).toLocaleString()}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-rose-400 font-bold">END:</span>
                                    <span>{new Date(s.endTime).toLocaleString()}</span>
                                 </div>
                              </td>
                              <td className="py-5 px-4 text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`px-3 py-1 text-[9px] font-black rounded-full border ${isLive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                    {isLive ? 'LIVE' : 'SCHEDULED'}
                                  </span>
                                  <button 
                                    onClick={() => terminateBroadcast(s.id)}
                                    className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all group"
                                    title="Terminate Broadcast"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </div>
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
      }

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
                    <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Stream Message</label>
                    <textarea value={ticker.text} onChange={(e) => setTicker(p => ({ ...p, text: e.target.value }))} className="nexus-input min-h-[120px] resize-none" placeholder="Transmit high-priority alert..."/>
                  </div>
                  {ticker.type === 'link' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Data Source URL</label>
                      <input type="url" value={ticker.linkUrl} onChange={(e) => setTicker(p => ({ ...p, linkUrl: e.target.value }))} className="nexus-input" placeholder="https://external.feed/api/v1"/>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--border)]">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase ml-1 opacity-50 flex justify-between">
                        <span>Transmission Speed</span>
                        <span className="text-sky-400">{ticker.speed}X</span>
                      </label>
                      <input type="range" min="1" max="10" value={ticker.speed} onChange={(e) => setTicker(p => ({ ...p, speed: parseInt(e.target.value) }))} className="w-full accent-[var(--accent)] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"/>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase ml-1 opacity-50">Network Priority</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setTicker(p => ({ ...p, isActive: p.isActive ? 0 : 1 }))}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${ticker.isActive ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                        >
                          {ticker.isActive ? 'ACTIVE_TRANSMISSION' : 'OFFLINE'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button onClick={saveTicker} className="nexus-btn-primary w-full py-4 tracking-[4px]">DEPLOY_TO_NETWORK</button>
               </div>
            </Card>

            <Card>
               <h3 className="text-sm font-bold uppercase tracking-wider mb-8">Visual Formatting</h3>
               <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase ml-1 opacity-50 flex items-center gap-2"><Palette size={14}/> Typography Scale</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['text-xl', 'text-2xl', 'text-4xl', 'text-6xl'].map(size => (
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
                    <label className="text-[10px] font-bold uppercase ml-1 opacity-50 flex items-center gap-2"><TypeIcon size={14}/> Font Weight & Style</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'Standard Protocol', val: 'normal' },
                        { label: 'High Emphasis (Bold)', val: 'bold' },
                        { label: 'Technical Alert (Italic)', val: 'italic' }
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

                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mt-4">
                    <p className="text-[10px] font-bold uppercase opacity-30 mb-2">Real-time Preview</p>
                    <div className="h-12 flex items-center overflow-hidden">
                       <p className={`whitespace-nowrap ${ticker.fontSize} ${ticker.fontStyle === 'bold' ? 'font-black' : ''} ${ticker.fontStyle === 'italic' ? 'italic' : ''}`}>
                          {ticker.text || 'BROADCASTING...'}
                       </p>
                    </div>
                  </div>
               </div>
            </Card>
          </div>
        );

      case 'templates':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
             <Card className="lg:col-span-3">
                <div className="flex justify-between items-center mb-8">
                   <div>
                     <h3 className="text-sm font-bold uppercase tracking-wider">Layout Architect</h3>
                     <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mt-1">Grid System: 12 x 12 Logic</p>
                   </div>
                   <button onClick={() => setCurrentLayout([...currentLayout, { i: `z${currentLayout.length+1}`, x: 0, y: 0, w: 4, h: 4 }])} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase hover:bg-[var(--accent)] hover:text-white transition-all">+ ADD ZONE</button>
                </div>
                <div ref={architectRef} className="bg-black/60 border border-white/10 rounded-3xl aspect-video relative overflow-hidden grid-bg p-2 shadow-inner">
                   <GridLayout 
                    className="layout" 
                    layout={currentLayout} 
                    cols={12} 
                    rowHeight={architectWidth / 12 * (9/16)} 
                    width={architectWidth} 
                    maxRows={12}
                    onLayoutChange={(newLayout) => {
                      setCurrentLayout(newLayout.map(item => ({
                        ...item,
                        x: Math.round(item.x),
                        y: Math.round(item.y),
                        w: Math.round(item.w),
                        h: Math.round(item.h)
                      })));
                    }} 
                    margin={[4, 4]}
                    resizeHandles={['s', 'e', 'se', 'sw', 'nw', 'ne', 'w', 'n']}
                    compactType={null}
                    preventCollision={true}
                    isDraggable={true}
                    isResizable={true}
                  >
                      {currentLayout.map(z => (
                        <div key={z.i} className="bg-white/95 border border-white flex flex-col items-center justify-center text-[var(--bg)] group overflow-hidden rounded-lg shadow-2xl cursor-move">
                           <div className="bg-slate-900 text-white w-full flex justify-between items-center px-2 py-1 font-bold uppercase tracking-tighter text-[9px]">
                              <span>{z.i}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentLayout(currentLayout.filter(item => item.i !== z.i));
                                }}
                                className="hover:text-rose-400 transition-colors"
                              >
                                <XCircle size={12} />
                              </button>
                           </div>
                           <div className="flex-1 flex flex-col items-center justify-center leading-none pointer-events-none">
                              <span className="font-extrabold text-lg">{z.w}x{z.h}</span>
                              <span className="text-[9px] font-bold opacity-40 uppercase mt-1">{z.x},{z.y}</span>
                           </div>
                        </div>
                      ))}
                   </GridLayout>
                </div>
                <div className="mt-8 flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                   <input type="text" placeholder="Layout Template Identity" className="nexus-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)}/>
                   <button onClick={saveTemplate} className="nexus-btn-primary whitespace-nowrap px-10 tracking-[2px]">SAVE_ARCHITECTURE</button>
                </div>
             </Card>

             <div className="space-y-6">
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
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase opacity-40">X Axis</label>
                                 <input type="number" min="0" max={12-z.w} value={z.x} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].x = parseInt(e.target.value) || 0;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-sky-500/50"/>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase opacity-40">Y Axis</label>
                                 <input type="number" min="0" max={12-z.h} value={z.y} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].y = parseInt(e.target.value) || 0;
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
                   <div className="space-y-2">
                      {templates.map(t => (
                        <div key={t.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                           <div>
                              <p className="text-[10px] font-extrabold truncate max-w-[120px] uppercase">{t.name}</p>
                              <p className="text-[8px] font-bold text-sky-400 opacity-60 uppercase">{safeParse(t.layout).length} ZONES</p>
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
                      <option value="user">Operational Officer</option>
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
                   <button onClick={() => setShowUserForm(true)} className="nexus-btn-primary text-xs py-2 px-6 shadow-xl">+ NEW PERSONNEL</button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase font-black text-[var(--text-dim)]">
                        <th className="py-4 px-6">Identity</th>
                        <th className="py-4 px-6">Clearance</th>
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
                          <td className="py-6 px-6"><Badge label={u.role} type={u.role}/></td>
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                               <span className="text-[10px] font-black uppercase text-slate-400">{u.status || 'ACTIVE'}</span>
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
      default: return null;
    }
  };

  return (
    <Shell role="admin" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-10 max-w-7xl mx-auto">
        <header className="mb-12 pb-8 flex justify-between items-end border-b border-white/10 relative">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-500/20 rounded-lg">
                <Monitor className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <h1 className="text-8xl font-black tracking-tighter leading-none text-white">DASHBOARD</h1>
          </div>
        </header>
        {renderView()}
      </div>
    </Shell>
  );
};

export default AdminDashboard;
