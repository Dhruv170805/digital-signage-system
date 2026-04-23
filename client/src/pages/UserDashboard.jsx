import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Shell from '../components/Shell';
import toast from 'react-hot-toast';
import { 
  Upload, FileText, Play, Image as ImageIcon, 
  CheckCircle2, Clock, XCircle, AlertCircle, 
  History, Send, Monitor, RefreshCw, Calendar, Tv, Timer, CheckCircle
} from 'lucide-react';

const Card = ({ children, className = "", title, icon: Icon, subtitle }) => (
  <div className={`glass-card p-8 animate-fade-in ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 shadow-inner">
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

const StatWidget = ({ label, value, icon: Icon, color = "blue" }) => (
  <div className="glass-card p-8 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-${color}-500/20`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-2">{label}</p>
      <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums">{value}</h2>
    </div>
  </div>
);

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [myFiles, setMyFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [requestedStartTime, setRequestedStartTime] = useState('');
  const [requestedEndTime, setRequestedEndTime] = useState('');
  
  const user = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetch = async () => {
      try {
        const [pendingRes, approvedRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL}/api/media/pending`, getAuthHeaders()),
          axios.get(`${import.meta.env.VITE_API_URL}/api/media`, getAuthHeaders())
        ]);

        if (isMounted) {
          const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.data : [];
          const approved = approvedRes.status === 'fulfilled' ? approvedRes.value.data : [];
          const combined = [...pending, ...approved];
          setMyFiles(combined.filter(f => f.uploaderId === user.id).sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        }
      } catch (err) { console.error(err); }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, [user, refreshKey]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !requestedStartTime || !requestedEndTime) {
        return toast.error('Please complete all upload parameters.');
    }
    setUploading(true);
    
    const formData = new FormData();
    formData.append('media', file);
    formData.append('requestedStartTime', requestedStartTime);
    formData.append('requestedEndTime', requestedEndTime);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/upload`, formData, getAuthHeaders());
      toast.success('Transmission Successful. Wait for Admin Approval.');
      setFile(null);
      setRequestedStartTime('');
      setRequestedEndTime('');
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transmission failed. Contact Operations.');
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/${id}/resubmit`, {}, getAuthHeaders());
      toast.success('Legacy asset re-submitted for approval.');
      setRefreshKey(prev => prev + 1);
      setActiveTab('myfiles');
    } catch (err) {
      toast.error('Re-submission failed.');
    }
  };

  const getTabLabel = () => {
    const labels = {
      upload: 'UPLOAD',
      myfiles: 'HISTORY',
      live: 'PREVIEW'
    };
    return labels[activeTab] || activeTab.toUpperCase();
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'upload': return <Upload className="w-6 h-6 text-blue-500" />;
      case 'myfiles': return <History className="w-6 h-6 text-blue-500" />;
      case 'live': return <Tv className="w-6 h-6 text-blue-500" />;
      default: return <Monitor className="w-6 h-6 text-blue-500" />;
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatWidget label="Submissions" value={myFiles.length} icon={Upload} />
               <StatWidget label="Approved" value={myFiles.filter(f => f.status === 'approved').length} icon={CheckCircle} color="emerald" />
               <StatWidget label="Pending" value={myFiles.filter(f => f.status === 'pending').length} icon={Timer} color="amber" />
            </div>

            <Card title="Asset Transmission" icon={Upload} subtitle="Broadcast Node Submission">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div 
                    className={`border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-center ${
                      file ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_50px_rgba(37,99,235,0.1)]' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                    }`}
                    onClick={() => document.getElementById('media-upload').click()}
                  >
                    <input id="media-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-white/5 border border-white/10 group-hover:scale-110 transition-transform relative z-10 shadow-2xl">
                      <Upload className={`w-8 h-8 ${file ? 'text-blue-500' : 'text-white/20'}`} />
                    </div>
                    {file ? (
                      <div className="space-y-2 relative z-10">
                        <p className="text-xl font-black text-white truncate max-w-xs mx-auto uppercase tracking-tighter">{file.name}</p>
                        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[4px]">{(file.size / 1024 / 1024).toFixed(2)} MB • VERIFIED</p>
                      </div>
                    ) : (
                      <div className="space-y-2 relative z-10">
                        <p className="text-xl font-black text-white uppercase tracking-tighter">Initialize Payload</p>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[2px]">PDF, MP4, WEBM, JPG</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[4px] ml-1">Protocol Timing</h3>
                    <form onSubmit={handleUpload} className="space-y-8">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-white/20 tracking-[2px] ml-1">Window Activation</label>
                          <input 
                            type="datetime-local" 
                            required 
                            className="nexus-input h-14" 
                            value={requestedStartTime} 
                            onChange={(e) => setRequestedStartTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-white/20 tracking-[2px] ml-1">Window Deactivation</label>
                          <input 
                            type="datetime-local" 
                            required 
                            className="nexus-input h-14" 
                            value={requestedEndTime} 
                            onChange={(e) => setRequestedEndTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <button type="submit" disabled={!file || !requestedStartTime || !requestedEndTime || uploading} className="nexus-btn-primary w-full h-16 flex items-center justify-center gap-4 group/btn rounded-[20px]">
                        {uploading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span className="text-xs font-black uppercase tracking-[4px]">Transmitting...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-black uppercase tracking-[4px]">Authorize Transmission</span>
                            <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'myfiles':
        return (
          <Card title="Operational History" icon={History} subtitle="Asset Transmission Logs">
            {myFiles.length === 0 ? (
              <div className="text-center py-32 bg-white/[0.02] border border-dashed border-white/5 rounded-[40px]">
                 <History className="w-20 h-20 mx-auto mb-6 text-white/5" />
                 <p className="font-black uppercase tracking-[6px] text-xs text-white/20">No transmission records detected</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[24px] border border-white/5 bg-black/20">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 text-[10px] uppercase font-black text-white/20 tracking-widest">
                      <th className="py-6 px-8">Payload Manifest</th>
                      <th className="py-6 px-8">Activation</th>
                      <th className="py-6 px-8">Security Window</th>
                      <th className="py-6 px-8 text-center">Status</th>
                      <th className="py-6 px-8 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myFiles.map(f => (
                      <tr key={f.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-8 px-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 transition-colors shadow-inner">
                               {f.fileType === 'pdf' && <FileText className="text-blue-400" size={24}/>}
                               {f.fileType === 'video' && <Play className="text-emerald-400" size={24}/>}
                               {f.fileType === 'image' && <ImageIcon className="text-indigo-400" size={24}/>}
                            </div>
                            <div>
                               <p className="text-base font-black text-white uppercase tracking-tighter">{f.fileName}</p>
                               <p className="text-[10px] font-black uppercase text-white/20 tracking-[2px] mt-1">{f.fileType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-8 px-8">
                          <p className="text-[11px] font-black text-white uppercase tabular-nums">{new Date(f.uploadedAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-black text-white/20 uppercase mt-1 tabular-nums">{new Date(f.uploadedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="py-8 px-8">
                          {f.requestedStartTime ? (
                            <div className="space-y-1.5">
                               <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-blue-400" /> ON: {new Date(f.requestedStartTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                               </p>
                               <p className="text-[9px] font-black text-rose-400/60 uppercase tracking-widest flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-rose-400" /> OFF: {new Date(f.requestedEndTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                               </p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-white/10 uppercase italic tracking-widest">Immediate Deployment</span>
                          )}
                        </td>
                        <td className="py-8 px-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-xl border ${
                              f.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              f.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                            }`}>{f.status}</span>
                            {f.status === 'rejected' && f.rejectionReason && (
                              <p className="text-[8px] font-black text-rose-500/40 uppercase max-w-[120px] leading-tight text-center">{f.rejectionReason}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-8 px-8 text-right">
                           <button 
                             onClick={() => handleResubmit(f.id)}
                             title="Protocol Re-Submission"
                             className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 rounded-2xl hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-90"
                           >
                             <RefreshCw size={20} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );

      case 'live':
        return (
           <div className="animate-fade-in px-4">
              <div className="aspect-video bg-black rounded-[60px] overflow-hidden border border-white/5 shadow-2xl relative group shadow-blue-500/5">
                 <iframe src="/display" className="w-full h-full border-none pointer-events-none scale-[1.001]" title="Live Preview" />
                 <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-md">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 animate-pulse-glow">
                       <Tv size={32} className="text-blue-500" />
                    </div>
                    <p className="text-white text-lg tracking-[16px] font-black uppercase">Live Monitoring</p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[4px] mt-4">Authorized Preview Only</p>
                 </div>
              </div>
           </div>
        );

      default: return null;
    }
  };

  return (
    <Shell role="user" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-12 max-w-7xl mx-auto">
        <header className="mb-16 relative">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                {getTabIcon()}
             </div>
             <div>
               <p className="text-[10px] tracking-[6px] font-black uppercase text-blue-500">Node Operator</p>
               <h1 className="text-6xl font-black tracking-tighter text-white leading-none uppercase mt-1">{getTabLabel()}</h1>
             </div>
          </div>
        </header>
        {renderView()}
      </div>
    </Shell>
  );
};

export default UserDashboard;
