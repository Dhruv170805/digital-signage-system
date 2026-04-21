import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import Shell from '../components/Shell';
import { 
  Users as UsersIcon, CheckCircle, XCircle, Clock, 
  Play, Plus, Trash2, Settings, ExternalLink, Activity, 
  FileText, Calendar, LayoutGrid, Type as TypeIcon,
  Save, AlertCircle, Tv
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`glass p-6 ${className}`}>{children}</div>
);

const Badge = ({ label, type }) => {
  const colors = {
    approved: 'bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/30',
    pending: 'bg-[var(--orange)]/10 text-[var(--orange)] border-[var(--orange)]/30',
    rejected: 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/30',
    admin: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
    user: 'bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] mono font-bold uppercase tracking-wider border ${colors[type] || ''}`}>
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
  const [ticker, setTicker] = useState({ text: '', speed: 5, type: 'text', linkUrl: '', isActive: 1 });
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [approvedMedia, setApprovedMedia] = useState([]);
  const [screens, setScreens] = useState([]);
  
  const [newScreen, setNewScreen] = useState({ name: '', location: '' });
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [currentLayout, setCurrentLayout] = useState([{ i: 'zone1', x: 0, y: 0, w: 12, h: 6 }]);
  const [templateName, setTemplateName] = useState('');
  const [newSchedule, setNewSchedule] = useState({
    mediaId: '', templateId: '', startTime: '', endTime: '', duration: 10, screenId: ''
  });
  const [mediaMapping, setMediaMapping] = useState({});

  const fetchStats = useCallback(async () => {
    try {
      const [media, users, screens] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/media`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/screens`)
      ]);
      setStats({ media: media.data.length, pending: 0, users: users.data.length, screens: screens.data.length });
    } catch (err) { console.error(err); }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/media/pending`);
      setPendingMedia(res.data);
      setStats(prev => ({ ...prev, pending: res.data.length }));
    } catch (err) { console.error(err); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`);
      setUsers(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchTicker = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ticker`);
      setTicker(prev => ({ ...prev, ...res.data }));
    } catch (err) { console.error(err); }
  }, []);

  const fetchApprovedMedia = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/media`);
      setApprovedMedia(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/templates`);
      setTemplates(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedule`);
      setSchedules(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchScreens = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens`);
      setScreens(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchStats(), fetchPending(), fetchUsers(), fetchTicker(),
        fetchApprovedMedia(), fetchTemplates(), fetchSchedules(), fetchScreens()
      ]);
    };
    init();
  }, [fetchStats, fetchPending, fetchUsers, fetchTicker, fetchApprovedMedia, fetchTemplates, fetchSchedules, fetchScreens]);

  const handleModeration = async (id, action) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/${id}/${action}`);
      fetchPending();
      fetchApprovedMedia();
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
      fetchTemplates();
    } catch (err) { alert(err.message); }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, { ...newSchedule, mediaMapping });
      alert('Schedule Created');
      fetchSchedules();
      setNewSchedule({ mediaId: '', templateId: '', startTime: '', endTime: '', duration: 10, screenId: '' });
      setMediaMapping({});
    } catch (err) { alert(err.message); }
  };

  const registerScreen = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/screens/register`, newScreen);
      alert('Screen Registered');
      setNewScreen({ name: '', location: '' });
      fetchScreens();
      fetchStats();
    } catch (err) { alert(err.message); }
  };

  const provisionUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, newUser);
      alert('User Provisioned');
      setShowUserForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Inventory', value: stats.media, icon: Activity },
                { label: 'Pending', value: stats.pending, icon: Clock },
                { label: 'Personnel', value: stats.users, icon: UsersIcon },
                { label: 'Terminals', value: stats.screens, icon: Tv },
              ].map((s, i) => (
                <Card key={i} className="flex justify-between items-end border-b-8 border-b-[var(--border)]">
                  <div>
                    <p className="text-5xl font-black mb-1">{s.value}</p>
                    <p className="text-[var(--text-dim)] text-[10px] uppercase mono tracking-[2px] font-bold">{s.label}</p>
                  </div>
                  <s.icon className="w-6 h-6 opacity-20" />
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <AlertCircle className="w-4 h-4" />
                   <h3 className="mono text-[10px] font-bold uppercase tracking-[2px]">System Alerts</h3>
                </div>
                <div className="space-y-4">
                  {pendingMedia.length > 0 ? (
                    <div className="p-6 bg-[var(--accent-alt)] border-2 border-[var(--border)] flex items-center gap-6">
                      <Clock className="w-8 h-8" />
                      <div>
                        <p className="font-black text-lg uppercase leading-tight">Attention Required</p>
                        <p className="text-sm mono font-bold uppercase">{pendingMedia.length} Pending Approvals in Queue</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-[var(--border)] flex items-center gap-6">
                      <CheckCircle className="w-8 h-8 text-[var(--green)]" />
                      <div>
                        <p className="font-black text-lg uppercase leading-tight">Status: Nominal</p>
                        <p className="text-sm mono font-bold uppercase text-[var(--text-dim)]">All systems executing as expected</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <Play className="w-4 h-4" />
                   <h3 className="mono text-[10px] font-bold uppercase tracking-[2px]">Broadcast Status</h3>
                </div>
                <div className="bg-[var(--surface)] border-2 border-[var(--border)] p-8 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent-alt)]" />
                  <div className="flex gap-12 whitespace-nowrap animate-ticker" style={{ animationDuration: `${(100 - ticker.speed * 10)}s` }}>
                    <span className="mono text-2xl font-black">
                      {ticker.text || 'SYSTEM_READY_FOR_BROADCAST...'}
                    </span>
                    <span className="mono text-2xl font-black">
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
             <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-6">Moderation Queue</h3>
             {pendingMedia.length === 0 ? <p className="text-[var(--text-dim)] text-center py-10">No pending requests.</p> : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-[var(--border)]">
                       <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] px-4">Asset</th>
                       <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] px-4">Uploader</th>
                       <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] px-4">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {pendingMedia.map(m => (
                       <tr key={m.id} className="border-b border-[var(--border)]/30">
                         <td className="py-4 px-4 text-sm font-medium">{m.fileName}</td>
                         <td className="py-4 px-4 text-xs text-[var(--text-dim)] mono">{m.uploaderName}</td>
                         <td className="py-4 px-4 flex gap-2">
                           <button onClick={() => handleModeration(m.id, 'approve')} className="p-2 bg-[var(--green)]/10 text-[var(--green)] rounded hover:bg-[var(--green)]/20"><CheckCircle size={16}/></button>
                           <button onClick={() => handleModeration(m.id, 'reject')} className="p-2 bg-[var(--red)]/10 text-[var(--red)] rounded hover:bg-[var(--red)]/20"><XCircle size={16}/></button>
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
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">Provision Terminal</h3>
                <form onSubmit={registerScreen} className="space-y-6">
                   <input type="text" required className="nexus-input" placeholder="Screen Name" value={newScreen.name} onChange={(e) => setNewScreen(p => ({ ...p, name: e.target.value }))}/>
                   <input type="text" className="nexus-input" placeholder="Location" value={newScreen.location} onChange={(e) => setNewScreen(p => ({ ...p, location: e.target.value }))}/>
                   <button type="submit" className="nexus-btn-primary w-full flex items-center justify-center gap-2"><Plus size={16}/> REGISTER</button>
                </form>
             </Card>
             <Card className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {screens.map(s => (
                     <div key={s.id} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                        <h4 className="text-lg font-medium">{s.name}</h4>
                        <p className="text-[10px] mono text-[var(--text-dim)] mb-4">{s.location}</p>
                        <a href={`/display?screenId=${s.id}`} target="_blank" className="block text-center bg-black py-2 rounded mono text-[10px] border border-[var(--border)] hover:border-[var(--accent)] transition-all">Launch Screen</a>
                     </div>
                   ))}
                </div>
             </Card>
          </div>
        );

      case 'schedule': {
        const selectedTemplate = templates.find(t => t.id === parseInt(newSchedule.templateId));
        const zones = selectedTemplate ? safeParse(selectedTemplate.layout) : [];

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <Card>
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <Calendar className="w-4 h-4" />
                   <h3 className="mono text-[10px] font-bold uppercase tracking-[2px]">Dispatch Schedule</h3>
                </div>
                <form onSubmit={createSchedule} className="space-y-6">
                   <div>
                     <label className="mono text-[10px] font-bold uppercase mb-2 block">Target Terminal</label>
                     <select className="nexus-input" value={newSchedule.screenId} onChange={(e) => setNewSchedule(p => ({ ...p, screenId: e.target.value }))}>
                        <option value="">Broadcast to All</option>
                        {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                   </div>

                   <div>
                     <label className="mono text-[10px] font-bold uppercase mb-2 block">Layout Template</label>
                     <select className="nexus-input" value={newSchedule.templateId} onChange={(e) => {
                       setNewSchedule(p => ({ ...p, templateId: e.target.value }));
                       setMediaMapping({});
                     }}>
                        <option value="">Fullscreen (No Template)</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                   </div>

                   {!newSchedule.templateId ? (
                     <div>
                       <label className="mono text-[10px] font-bold uppercase mb-2 block">Primary Asset</label>
                       <select required className="nexus-input" value={newSchedule.mediaId} onChange={(e) => setNewSchedule(p => ({ ...p, mediaId: e.target.value }))}>
                          <option value="">Select Asset</option>
                          {approvedMedia.map(m => <option key={m.id} value={m.id}>{m.fileName}</option>)}
                       </select>
                     </div>
                   ) : (
                     <div className="space-y-4 p-4 border-2 border-[var(--border)] bg-[var(--surface)]">
                        <p className="mono text-[10px] font-black uppercase text-center border-b border-[var(--border)] pb-2 mb-4">Zone Assignments</p>
                        {zones.map((z) => (
                          <div key={z.i}>
                            <label className="mono text-[9px] font-bold uppercase mb-1 block">Zone {z.i}</label>
                            <select required className="nexus-input py-2 text-xs" value={mediaMapping[z.i] || ''} onChange={(e) => setMediaMapping(p => ({ ...p, [z.i]: e.target.value }))}>
                               <option value="">Select Asset</option>
                               {approvedMedia.map(m => <option key={m.id} value={m.id}>{m.fileName}</option>)}
                            </select>
                          </div>
                        ))}
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mono text-[10px] font-bold uppercase mb-2 block">Start</label>
                        <input type="datetime-local" required className="nexus-input text-xs" value={newSchedule.startTime} onChange={(e) => setNewSchedule(p => ({ ...p, startTime: e.target.value }))}/>
                      </div>
                      <div>
                        <label className="mono text-[10px] font-bold uppercase mb-2 block">End</label>
                        <input type="datetime-local" required className="nexus-input text-xs" value={newSchedule.endTime} onChange={(e) => setNewSchedule(p => ({ ...p, endTime: e.target.value }))}/>
                      </div>
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full tracking-[4px]">INITIATE_TRANSMISSION</button>
                </form>
             </Card>
             <Card className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[var(--border)]">
                   <Clock className="w-4 h-4" />
                   <h3 className="mono text-[10px] font-bold uppercase tracking-[2px]">Active Manifest</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b-2 border-[var(--border)]">
                           <th className="pb-4 mono text-[10px] font-bold uppercase px-4">Content</th>
                           <th className="pb-4 mono text-[10px] font-bold uppercase px-4">Window</th>
                           <th className="pb-4 mono text-[10px] font-bold uppercase px-4 text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody>
                        {schedules.map(s => {
                          const isLive = new Date() >= new Date(s.startTime) && new Date() <= new Date(s.endTime);
                          return (
                            <tr key={s.id} className="border-b border-[var(--border)]/30 hover:bg-[var(--surface)] transition-colors">
                              <td className="py-4 px-4">
                                <p className="text-sm font-black uppercase">{s.templateName || s.fileName}</p>
                                <p className="text-[10px] mono text-[var(--text-dim)] uppercase">{s.screenName || 'All Terminals'}</p>
                              </td>
                              <td className="py-4 px-4 mono text-[10px] font-bold">
                                 {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                 <br/>
                                 <span className="text-[var(--text-faint)]">TO</span> {new Date(s.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className={`px-3 py-1 text-[9px] mono font-black border-2 ${isLive ? 'bg-[var(--accent-alt)] border-[var(--border)]' : 'border-[var(--muted)] text-[var(--text-faint)]'}`}>
                                  {isLive ? 'LIVE_NOW' : 'SCHEDULED'}
                                </span>
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
          <Card className="max-w-2xl animate-fade-in">
             <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">Ticker Control</h3>
             <div className="space-y-6">
                <div className="flex gap-2 p-1 bg-black rounded border border-[var(--border)]">
                   {['text', 'link'].map(t => (
                     <button key={t} onClick={() => setTicker(p => ({ ...p, type: t }))} className={`flex-1 py-2 rounded mono text-[10px] uppercase transition-all ${ticker.type === t ? 'bg-[var(--accent)] text-black font-bold' : 'text-dim'}`}>{t}</button>
                   ))}
                </div>
                <textarea value={ticker.text} onChange={(e) => setTicker(p => ({ ...p, text: e.target.value }))} className="nexus-input min-h-[100px]" placeholder="Broadcast message..."/>
                {ticker.type === 'link' && <input type="url" value={ticker.linkUrl} onChange={(e) => setTicker(p => ({ ...p, linkUrl: e.target.value }))} className="nexus-input" placeholder="https://..."/>}
                <input type="range" min="1" max="10" value={ticker.speed} onChange={(e) => setTicker(p => ({ ...p, speed: parseInt(e.target.value) }))} className="w-full accent-[var(--accent)]"/>
                <button onClick={saveTicker} className="nexus-btn-primary w-full">DEPLOY TO NETWORK</button>
             </div>
          </Card>
        );

      case 'templates':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
             <Card className="lg:col-span-3">
                <div className="flex justify-between items-center mb-8">
                   <div>
                     <h3 className="mono text-xs font-bold uppercase tracking-[2px]">Layout Architect</h3>
                     <p className="text-[10px] mono text-[var(--text-dim)] uppercase mt-1">Grid System: 12 x 12 Units</p>
                   </div>
                   <button onClick={() => setCurrentLayout([...currentLayout, { i: `z${currentLayout.length+1}`, x: 0, y: 0, w: 4, h: 4 }])} className="px-3 py-1 bg-white/5 border border-[var(--border)] rounded mono text-[10px] uppercase text-[var(--accent)] hover:bg-[var(--accent-alt)] hover:text-black transition-all">+ Add Zone</button>
                </div>
                <div className="bg-black/50 border-2 border-[var(--border)] rounded-none aspect-video relative overflow-hidden grid-bg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                   <GridLayout 
                    className="layout" 
                    layout={currentLayout} 
                    cols={12} 
                    rowHeight={40} 
                    width={900} 
                    maxRows={12}
                    onLayoutChange={setCurrentLayout} 
                    margin={[2, 2]}
                    resizeHandles={['s', 'e', 'se', 'sw', 'nw', 'ne', 'w', 'n']}
                    compactType={null}
                    preventCollision={true}
                  >
                      {currentLayout.map(z => (
                        <div key={z.i} className="bg-white border-2 border-[var(--border)] flex flex-col items-center justify-center mono text-[10px] text-[var(--accent)] group overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           <div className="bg-[var(--border)] text-white w-full flex justify-between items-center px-2 py-0.5 font-bold uppercase tracking-tighter text-[8px]">
                              <span>{z.i}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentLayout(currentLayout.filter(item => item.i !== z.i));
                                }}
                                className="hover:text-[var(--red)] transition-colors"
                              >
                                <XCircle size={10} />
                              </button>
                           </div>
                           <div className="flex-1 flex flex-col items-center justify-center leading-none">
                              <span className="font-black text-xs">{z.w}x{z.h}</span>
                              <span className="text-[8px] opacity-40">POS: {z.x},{z.y}</span>
                           </div>
                        </div>
                      ))}
                   </GridLayout>
                </div>
                <div className="mt-8 flex gap-4 items-center bg-[var(--surface)] p-4 border-2 border-[var(--border)]">
                   <input type="text" placeholder="Template Name" className="nexus-input py-2" value={templateName} onChange={(e) => setTemplateName(e.target.value)}/>
                   <button onClick={saveTemplate} className="nexus-btn-primary whitespace-nowrap py-2 px-8">SAVE_TEMPLATE</button>
                </div>
             </Card>

             <div className="space-y-6">
                <Card className="p-4">
                   <h3 className="mono text-[10px] font-bold uppercase tracking-[2px] mb-4 pb-2 border-b border-[var(--border)]">Zone Inspector</h3>
                   <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {currentLayout.map((z, idx) => (
                        <div key={z.i} className="p-3 bg-black/5 border border-[var(--border)] space-y-2">
                           <div className="flex justify-between items-center">
                              <span className="mono text-[10px] font-black">{z.i}</span>
                              <span className="text-[8px] mono opacity-50 uppercase">Size Control</span>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <div>
                                 <label className="text-[8px] mono uppercase block opacity-50">Width (W)</label>
                                 <input type="number" min="1" max="12" value={z.w} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].w = parseInt(e.target.value) || 1;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-white border border-[var(--border)] px-1 py-0.5 mono text-[10px]"/>
                              </div>
                              <div>
                                 <label className="text-[8px] mono uppercase block opacity-50">Height (H)</label>
                                 <input type="number" min="1" max="12" value={z.h} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].h = parseInt(e.target.value) || 1;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-white border border-[var(--border)] px-1 py-0.5 mono text-[10px]"/>
                              </div>
                              <div>
                                 <label className="text-[8px] mono uppercase block opacity-50">X-Pos</label>
                                 <input type="number" min="0" max={12-z.w} value={z.x} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].x = parseInt(e.target.value) || 0;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-white border border-[var(--border)] px-1 py-0.5 mono text-[10px]"/>
                              </div>
                              <div>
                                 <label className="text-[8px] mono uppercase block opacity-50">Y-Pos</label>
                                 <input type="number" min="0" max={12-z.h} value={z.y} onChange={(e) => {
                                    const next = [...currentLayout];
                                    next[idx].y = parseInt(e.target.value) || 0;
                                    setCurrentLayout(next);
                                 }} className="w-full bg-white border border-[var(--border)] px-1 py-0.5 mono text-[10px]"/>
                              </div>
                           </div>
                        </div>
                      ))}
                      {currentLayout.length === 0 && <p className="text-[10px] mono text-center opacity-30 py-4 uppercase">No active zones</p>}
                   </div>
                </Card>

                <Card className="p-4">
                   <h3 className="mono text-[10px] font-bold uppercase tracking-[2px] mb-4 pb-2 border-b border-[var(--border)]">Saved Layouts</h3>
                   <div className="space-y-2">
                      {templates.map(t => (
                        <div key={t.id} className="p-3 bg-white/5 border border-[var(--border)] flex justify-between items-center group hover:bg-[var(--accent-alt)]/10 transition-colors">
                           <div>
                              <p className="text-[10px] font-bold truncate max-w-[100px]">{t.name}</p>
                              <p className="text-[8px] mono opacity-50">{safeParse(t.layout).length} ZONES</p>
                           </div>
                           <button onClick={() => setCurrentLayout(safeParse(t.layout))} className="text-[8px] mono font-bold border border-[var(--border)] px-1 hover:bg-black hover:text-white">LOAD</button>
                        </div>
                      ))}
                   </div>
                </Card>
             </div>
          </div>
        );

      case 'users':
        return (
          <div className="animate-fade-in">
            {showUserForm ? (
              <Card className="max-w-xl mx-auto">
                <form onSubmit={provisionUser} className="space-y-4">
                  <input type="text" required className="nexus-input" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}/>
                  <input type="email" required className="nexus-input" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}/>
                  <input type="password" required className="nexus-input" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}/>
                  <select className="nexus-input" value={newUser.role} onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}>
                    <option value="user">Operator</option><option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="nexus-btn-primary w-full">PROVISION</button>
                </form>
              </Card>
            ) : (
              <Card>
                <div className="flex justify-between items-center mb-8"><h3 className="mono text-xs font-bold uppercase tracking-[2px]">Personnel</h3><button onClick={() => setShowUserForm(true)} className="nexus-btn-primary text-xs">+ Provision</button></div>
                <table className="w-full text-left">
                  <thead><tr className="border-b border-[var(--border)]"><th className="pb-4 mono text-[10px] px-4">User</th><th className="pb-4 mono text-[10px] px-4">Role</th><th className="pb-4 mono text-[10px] px-4">Status</th></tr></thead>
                  <tbody>{users.map(u => <tr key={u.id} className="border-b border-[var(--border)]/30"><td className="py-4 px-4 text-sm">{u.name}</td><td className="py-4 px-4"><Badge label={u.role} type={u.role}/></td><td className="py-4 px-4 text-xs mono">{u.status}</td></tr>)}</tbody>
                </table>
              </Card>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <Shell role="admin" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-10 max-w-7xl mx-auto">
        <header className="mb-12 pb-8 border-b-4 border-[var(--border)] flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5" />
              <span className="mono text-[10px] tracking-[4px] font-bold">STATION: HQ_CONTROL_PLANE</span>
            </div>
            <h1 className="text-7xl font-black tracking-tighter text-[var(--text)] leading-none">OPERATIONS</h1>
          </div>
          <div className="text-right mono text-[10px] font-bold">
             <p>SYSTEM STATUS: OPTIMAL</p>
             <p className="text-[var(--text-dim)]">BUILD 4.0.2_STABLE</p>
          </div>
        </header>
        {renderView()}
      </div>
    </Shell>
  );
};

export default AdminDashboard;
