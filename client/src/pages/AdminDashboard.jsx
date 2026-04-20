import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GridLayout from 'react-grid-layout';
import Shell from '../components/Shell';
import { 
  Users as UsersIcon, CheckCircle, XCircle, Clock, 
  Play, Plus, Trash2, Settings, ExternalLink, Activity, 
  FileText, Calendar, LayoutGrid, Type as TypeIcon,
  Save, AlertCircle
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
  
  // Screen Form State
  const [newScreen, setNewScreen] = useState({ name: '', location: '' });

  // Template Editor State
  const [currentLayout, setCurrentLayout] = useState([
    { i: 'zone1', x: 0, y: 0, w: 12, h: 6 }
  ]);
  const [templateName, setTemplateName] = useState('');

  // Scheduling State
  const [newSchedule, setNewSchedule] = useState({
    mediaId: '',
    templateId: '',
    startTime: '',
    endTime: '',
    duration: 10,
    screenId: ''
  });

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/media`);
      const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`);
      const screensRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens`);
      setStats({
        media: res.data.length,
        pending: 0,
        users: usersRes.data.length,
        screens: screensRes.data.length
      });
    } catch (err) { console.error(err); }
  };

  const fetchScreens = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/screens`);
      setScreens(res.data);
    } catch (err) { console.error(err); }
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

  useEffect(() => {
    const init = async () => {
      await fetchStats();
      await fetchPending();
      await fetchUsers();
      await fetchTicker();
      await fetchApprovedMedia();
      await fetchTemplates();
      await fetchSchedules();
      await fetchScreens();
    };
    init();
  }, []);

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
      alert('Ticker Updated and Transmitted');
    } catch (err) { alert(err.message); }
  };

  const saveTemplate = async () => {
    if (!templateName) return alert('Enter template name');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/templates`, {
        name: templateName,
        layout: currentLayout
      });
      alert('Template Saved');
      setTemplateName('');
      fetchTemplates();
    } catch (err) { alert(err.message); }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, newSchedule);
      alert('Broadcast Scheduled Successfully');
      fetchSchedules();
      setNewSchedule({ mediaId: '', templateId: '', startTime: '', endTime: '', duration: 10 });
    } catch (err) { alert(err.message); }
  };

  const addZone = () => {
    if (currentLayout.length >= 3) return alert('Maximum 3 zones allowed per template');
    const newId = `zone${currentLayout.length + 1}`;
    setCurrentLayout([...currentLayout, { i: newId, x: 0, y: currentLayout.length * 2, w: 12, h: 2 }]);
  };

  const removeZone = (id) => {
    setCurrentLayout(currentLayout.filter(z => z.i !== id));
  };

  // User Provisioning State
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

  const provisionUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, newUser);
      alert('Personnel Access Provisioned');
      setShowUserForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Assets', value: stats.media, color: 'text-[var(--blue)]', icon: Activity },
                { label: 'Pending Review', value: stats.pending, color: 'text-[var(--orange)]', icon: Clock },
                { label: 'Platform Users', value: stats.users, color: 'text-[var(--accent)]', icon: UsersIcon },
                { label: 'Server Up-time', value: '99.9%', color: 'text-[var(--green)]', icon: Settings },
              ].map((s, i) => (
                <Card key={i} className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-light mb-1">{s.value}</p>
                    <p className="text-[var(--text-dim)] text-xs uppercase mono tracking-widest">{s.label}</p>
                  </div>
                  <s.icon className={`w-5 h-5 ${s.color} opacity-40`} />
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-6 text-[var(--accent)]">System Alerts</h3>
                <div className="space-y-4">
                  {pendingMedia.length > 0 ? (
                    <div className="p-4 bg-[var(--orange)]/5 border border-[var(--orange)]/20 rounded-lg flex items-center gap-4">
                      <Clock className="w-5 h-5 text-[var(--orange)]" />
                      <div>
                        <p className="text-sm font-medium">Pending Moderation Required</p>
                        <p className="text-xs text-[var(--text-dim)]">{pendingMedia.length} assets are waiting for your approval.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--green)]/5 border border-[var(--green)]/20 rounded-lg flex items-center gap-4">
                      <CheckCircle className="w-5 h-5 text-[var(--green)]" />
                      <div>
                        <p className="text-sm font-medium">All Systems Clear</p>
                        <p className="text-xs text-[var(--text-dim)]">Everything is running smoothly on the factory floor.</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-6 text-[var(--accent)]">Live Ticker Preview</h3>
                <div className="bg-black rounded-lg p-4 overflow-hidden border border-[var(--border)]">
                  <div className="flex gap-10 whitespace-nowrap animate-ticker" style={{ animationDuration: `${(100 - ticker.speed * 10)}s` }}>
                    <span className={`mono text-[var(--accent)] text-lg ${ticker.type === 'link' ? 'underline decoration-dotted' : ''}`}>
                      {ticker.text || 'NEXUS SYSTEM BROADCAST ACTIVE...'}
                    </span>
                    <span className={`mono text-[var(--accent)] text-lg ${ticker.type === 'link' ? 'underline decoration-dotted' : ''}`}>
                      {ticker.text || 'NEXUS SYSTEM BROADCAST ACTIVE...'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'approve':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-6">Moderation Queue</h3>
              {pendingMedia.length === 0 ? (
                <p className="text-[var(--text-dim)] text-center py-10">No pending requests at this time.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Asset</th>
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Uploader</th>
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Date</th>
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMedia.map(m => (
                        <tr key={m.id} className="border-b border-[var(--border)]/30 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[var(--surface)] rounded flex items-center justify-center text-[var(--text-dim)]">
                                {m.fileType === 'pdf' ? <FileText size={18}/> : <Play size={18}/>}
                              </div>
                              <span className="text-sm font-medium">{m.fileName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs text-[var(--text-dim)] mono">{m.uploaderName}</td>
                          <td className="py-4 px-4 text-xs text-[var(--text-dim)] mono">{new Date(m.uploadedAt).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => handleModeration(m.id, 'approve')} className="p-2 bg-[var(--green)]/10 text-[var(--green)] rounded-lg hover:bg-[var(--green)]/20 transition-all">
                                <CheckCircle size={16} />
                              </button>
                              <button onClick={() => handleModeration(m.id, 'reject')} className="p-2 bg-[var(--red)]/10 text-[var(--red)] rounded-lg hover:bg-[var(--red)]/20 transition-all">
                                <XCircle size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        );

      case 'ticker':
        return (
          <div className="max-w-2xl animate-fade-in">
            <Card>
              <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">Ticker Configuration</h3>
              <div className="space-y-6">
                <div className="flex gap-4 p-1 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                   <button 
                     onClick={() => setTicker(prev => ({ ...prev, type: 'text' }))}
                     className={`flex-1 py-2 rounded-md mono text-[10px] uppercase tracking-widest transition-all ${ticker.type === 'text' ? 'bg-[var(--accent)] text-[var(--bg)] font-bold' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}
                   >
                     Text Message
                   </button>
                   <button 
                     onClick={() => setTicker(prev => ({ ...prev, type: 'link' }))}
                     className={`flex-1 py-2 rounded-md mono text-[10px] uppercase tracking-widest transition-all ${ticker.type === 'link' ? 'bg-[var(--accent)] text-[var(--bg)] font-bold' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}
                   >
                     Hyperlink
                   </button>
                </div>

                <div>
                  <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">
                    {ticker.type === 'text' ? 'Announcement Message' : 'Link Display Text'}
                  </label>
                  <textarea 
                    value={ticker.text} 
                    onChange={(e) => setTicker(prev => ({ ...prev, text: e.target.value }))}
                    className="nexus-input min-h-[80px] resize-none"
                    placeholder="Enter message to scroll..."
                  />
                </div>

                {ticker.type === 'link' && (
                  <div className="animate-fade-in">
                    <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2 text-[var(--accent)]">Destination URL</label>
                    <input 
                      type="url"
                      value={ticker.linkUrl} 
                      onChange={(e) => setTicker(prev => ({ ...prev, linkUrl: e.target.value }))}
                      className="nexus-input"
                      placeholder="https://corp.nexus.in/safety-protocol"
                    />
                  </div>
                )}

                <div>
                  <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-4">Transmission Speed: {ticker.speed}x</label>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={ticker.speed} 
                    onChange={(e) => setTicker(prev => ({ ...prev, speed: parseInt(e.target.value) }))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={saveTicker} className="nexus-btn-primary flex-1">DEPLOY TO NETWORK</button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'templates':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <Card className="lg:col-span-2">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="mono text-xs font-bold uppercase tracking-[2px]">Layout Architect</h3>
                   <div className="flex gap-2">
                      <button onClick={addZone} className="px-3 py-1 bg-[var(--surface)] border border-[var(--border)] rounded mono text-[10px] uppercase tracking-widest hover:border-[var(--accent)] text-[var(--accent)]">
                        + Add Zone
                      </button>
                   </div>
                </div>
                
                <div className="bg-black/50 border border-[var(--border)] rounded-xl relative overflow-hidden aspect-video">
                  <GridLayout 
                    className="layout" 
                    layout={currentLayout} 
                    cols={12} 
                    rowHeight={30} 
                    width={800}
                    onLayoutChange={(l) => setCurrentLayout(l)}
                    margin={[5, 5]}
                  >
                    {currentLayout.map(zone => (
                      <div key={zone.i} className="bg-[var(--accent)]/10 border-2 border-[var(--accent)]/40 rounded flex flex-col items-center justify-center relative group text-center">
                        <span className="mono text-[10px] font-bold text-[var(--accent)] uppercase">{zone.i}</span>
                        <button 
                          onClick={() => removeZone(zone.i)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--red)]/20 text-[var(--red)] p-1 rounded"
                        >
                          <XCircle size={10}/>
                        </button>
                      </div>
                    ))}
                  </GridLayout>
                </div>

                <div className="mt-8 flex gap-4">
                   <input 
                     type="text" 
                     placeholder="Template Name (e.g. Triple Alert)" 
                     className="nexus-input" 
                     value={templateName}
                     onChange={(e) => setTemplateName(e.target.value)}
                   />
                   <button onClick={saveTemplate} className="nexus-btn-primary whitespace-nowrap px-8">SAVE TEMPLATE</button>
                </div>
             </Card>

             <Card>
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-6">Saved Blueprints</h3>
                <div className="space-y-4">
                   {templates.length === 0 ? (
                     <p className="text-[var(--text-faint)] text-center py-10 mono text-[10px]">No templates stored</p>
                   ) : (
                     templates.map(t => (
                       <div key={t.id} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex justify-between items-center">
                          <div>
                             <p className="text-sm font-medium">{t.name}</p>
                             <p className="text-[10px] mono text-[var(--text-dim)] uppercase tracking-widest">{JSON.parse(t.layout || '[]').length} Zones</p>
                          </div>
                          <button className="text-[var(--text-dim)] hover:text-[var(--red)]">
                             <Trash2 size={14}/>
                          </button>
                       </div>
                     ))
                   )}
                </div>
             </Card>
          </div>
        );

      case 'schedule':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <Card className="lg:col-span-1">
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">New Transmission</h3>
                <form onSubmit={createSchedule} className="space-y-6">
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Target Screen</label>
                      <select 
                        className="nexus-input"
                        value={newSchedule.screenId}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, screenId: e.target.value }))}
                      >
                         <option value="">Broadcast to All Screens</option>
                         {screens.map(s => (
                           <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                         ))}
                      </select>
                   </div>
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Select Asset</label>
                      <select 
                        required
                        className="nexus-input"
                        value={newSchedule.mediaId}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, mediaId: e.target.value }))}
                      >
                         <option value="">Choose approved media...</option>
                         {approvedMedia.map(m => (
                           <option key={m.id} value={m.id}>{m.fileName}</option>
                         ))}
                      </select>
                   </div>
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Apply Template (Optional)</label>
                      <select 
                        className="nexus-input"
                        value={newSchedule.templateId}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, templateId: e.target.value }))}
                      >
                         <option value="">Full Screen (Default)</option>
                         {templates.map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                         ))}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">From</label>
                         <input 
                           type="datetime-local" required className="nexus-input text-xs"
                           value={newSchedule.startTime}
                           onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                         />
                      </div>
                      <div>
                         <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">To</label>
                         <input 
                           type="datetime-local" required className="nexus-input text-xs"
                           value={newSchedule.endTime}
                           onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                         />
                      </div>
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full">INITIATE SCHEDULE</button>
                </form>
             </Card>

             <Card className="lg:col-span-2">
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">Operational Calendar</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-[var(--border)]">
                         <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Asset</th>
                         <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Target</th>
                         <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Window</th>
                         <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Status</th>
                       </tr>
                     </thead>
                     <tbody>
                        {schedules.map(s => {
                          const now = new Date();
                          const start = new Date(s.startTime);
                          const end = new Date(s.endTime);
                          const isLive = now >= start && now <= end;
                          
                          return (
                            <tr key={s.id} className="border-b border-[var(--border)]/30">
                              <td className="py-4 px-4">
                                 <p className="text-sm font-medium">{s.fileName}</p>
                                 <p className="text-[10px] mono text-[var(--text-faint)] uppercase">{s.templateName || 'FULL'}</p>
                              </td>
                              <td className="py-4 px-4 mono text-[10px] text-[var(--accent)] uppercase font-bold">
                                 {s.screenName || 'ALL SCREENS'}
                              </td>
                              <td className="py-4 px-4 mono text-[10px] text-[var(--text-dim)]">
                                 {start.toLocaleDateString()} {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} <br/> — {end.toLocaleDateString()} {end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </td>
                              <td className="py-4 px-4">
                                 <div className={`flex items-center gap-2 ${isLive ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--text-faint)]'}`} />
                                    <span className="mono text-[10px] uppercase font-bold tracking-widest">{isLive ? 'LIVE' : 'QUEUE'}</span>
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

      case 'screens':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <Card>
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">Provision Terminal</h3>
                <form onSubmit={registerScreen} className="space-y-6">
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Screen Name</label>
                      <input 
                        type="text" required className="nexus-input" 
                        placeholder="e.g. Lobby South TV"
                        value={newScreen.name}
                        onChange={(e) => setNewScreen(prev => ({ ...prev, name: e.target.value }))}
                      />
                   </div>
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Location</label>
                      <input 
                        type="text" className="nexus-input" 
                        placeholder="e.g. Ground Floor Entrance"
                        value={newScreen.location}
                        onChange={(e) => setNewScreen(prev => ({ ...prev, location: e.target.value }))}
                      />
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full flex items-center justify-center gap-2">
                     <Plus size={16}/> REGISTER TERMINAL
                   </button>
                </form>
             </Card>

             <Card className="lg:col-span-2">
                <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">Terminal Network</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {screens.map(s => (
                     <div key={s.id} className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl relative group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-[var(--accent)] border border-[var(--border)]">
                              <Tv size={20}/>
                           </div>
                           <div className={`px-2 py-0.5 rounded text-[8px] mono font-bold uppercase tracking-widest ${s.status === 'online' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--text-faint)]/10 text-[var(--text-faint)]'}`}>
                              {s.status}
                           </div>
                        </div>
                        <h4 className="text-lg font-medium mb-1">{s.name}</h4>
                        <p className="text-xs text-[var(--text-dim)] mono uppercase tracking-widest mb-6">{s.location}</p>
                        
                        <div className="flex gap-2">
                           <a 
                             href={`/display?screenId=${s.id}`} 
                             target="_blank" 
                             className="flex-1 bg-black py-2 rounded-md mono text-[10px] uppercase tracking-widest font-bold text-center border border-[var(--border)] hover:border-[var(--accent)] transition-all"
                           >
                             Launch
                           </a>
                           <button className="px-3 bg-black py-2 rounded-md border border-[var(--border)] hover:border-[var(--red)] text-[var(--text-dim)] hover:text-[var(--red)]">
                             <Trash2 size={14}/>
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </Card>
          </div>
        );

      case 'preview':
        return (
          <div className="h-full animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="mono text-xs font-bold uppercase tracking-[2px]">Live Display Stream</h3>
                <a href="/display" target="_blank" className="flex items-center gap-2 text-xs mono text-[var(--accent)] hover:underline">
                  OPEN IN FULL SCREEN <ExternalLink size={12}/>
                </a>
             </div>
             <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl relative">
                <iframe src="/display" className="w-full h-full border-none pointer-events-none" />
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                   <div className="text-center">
                     <p className="mono text-[var(--accent)] text-lg mb-2 tracking-[4px]">MONITORING ACTIVE</p>
                     <p className="text-[var(--text-dim)] text-xs">Real-time view of factory transmission</p>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6 animate-fade-in">
            {showUserForm ? (
              <Card className="max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="mono text-xs font-bold uppercase tracking-[2px]">Initialize Personnel Access</h3>
                   <button onClick={() => setShowUserForm(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                     <XCircle size={18}/>
                   </button>
                </div>
                <form onSubmit={provisionUser} className="space-y-4">
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Full Name</label>
                      <input 
                        type="text" required className="nexus-input" 
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      />
                   </div>
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Email Address</label>
                      <input 
                        type="email" required className="nexus-input" 
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      />
                   </div>
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Temporary Access Key</label>
                      <input 
                        type="password" required className="nexus-input" 
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      />
                   </div>
                   <div>
                      <label className="mono text-[10px] uppercase tracking-widest text-[var(--text-dim)] block mb-2">Clearance Level</label>
                      <select 
                        className="nexus-input"
                        value={newUser.role}
                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                      >
                         <option value="user">Standard Operator</option>
                         <option value="admin">HQ Administrator</option>
                      </select>
                   </div>
                   <button type="submit" className="nexus-btn-primary w-full">PROVISION ACCOUNT</button>
                </form>
              </Card>
            ) : (
              <Card>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="mono text-xs font-bold uppercase tracking-[2px]">Platform Personnel</h3>
                  <button 
                    onClick={() => setShowUserForm(true)}
                    className="nexus-btn-primary px-4 py-2 text-xs flex items-center gap-2"
                  >
                    <Plus size={14}/> PROVISION USER
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">User</th>
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Identity</th>
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Role</th>
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Status</th>
                        <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] tracking-widest px-4">Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-[var(--border)]/30">
                          <td className="py-4 px-4 font-medium">{u.name}</td>
                          <td className="py-4 px-4 text-xs text-[var(--text-dim)] mono">{u.email}</td>
                          <td className="py-4 px-4">
                            <Badge label={u.role} type={u.role} />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`} />
                              <span className="text-xs uppercase mono">{u.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <button className="text-[var(--text-dim)] hover:text-[var(--red)] transition-all">
                              <Trash2 size={16} />
                            </button>
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

      default:
        return <div className="text-[var(--text-dim)]">Section under construction...</div>;
    }
  };

  return (
    <Shell role="admin" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-10">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-full inline-block">
                <span className="mono text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest">NEXUS CORE V4.0</span>
             </div>
             <div className="px-3 py-1 bg-[var(--green)]/10 border border-[var(--green)]/30 rounded-full inline-block">
                <span className="mono text-[var(--green)] text-[10px] font-bold uppercase tracking-widest">ENCRYPTED CONNECTION</span>
             </div>
          </div>
          <h1 className="text-5xl font-light tracking-tight text-[var(--text)]">HQ Control Plane</h1>
          <p className="text-[var(--text-dim)] mt-2">Manage factory broadcast assets and personnel governance.</p>
        </header>

        {renderView()}
      </div>
    </Shell>
  );
};

export default AdminDashboard;
