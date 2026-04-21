import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Shell from '../components/Shell';
import { 
  Upload, FileText, Play, Image as ImageIcon, 
  CheckCircle2, Clock, XCircle, AlertCircle, 
  History, Send, Monitor, RefreshCw, Calendar, Tv
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`glass p-8 ${className}`}>{children}</div>
);

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [myFiles, setMyFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [requestedStartTime, setRequestedStartTime] = useState('');
  const [requestedEndTime, setRequestedEndTime] = useState('');
  
  const user = React.useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const [pendingRes, approvedRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/media/pending`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/media`)
        ]);
        if (isMounted) {
          const combined = [...pendingRes.data, ...approvedRes.data];
          setMyFiles(combined.filter(f => f.uploaderId === user.id).sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        }
      } catch (err) { console.error(err); }
    };
    fetch();
    const interval = setInterval(fetch, 30000); // 30s auto-fetch
    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, [user.id, refreshKey]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !requestedStartTime || !requestedEndTime) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('media', file);
    formData.append('uploaderId', user.id);
    formData.append('requestedStartTime', requestedStartTime);
    formData.append('requestedEndTime', requestedEndTime);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/upload`, formData);
      setMsg({ text: 'Wait for Admin Approval', type: 'success' });
      setFile(null);
      setRequestedStartTime('');
      setRequestedEndTime('');
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setMsg({ text: 'Transmission failed: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };

  const handleResubmit = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/${id}/resubmit`);
      setMsg({ text: 'Legacy asset re-submitted for approval.', type: 'success' });
      setRefreshKey(prev => prev + 1);
      setActiveTab('myfiles');
    } catch (err) {
      setMsg({ text: 'Re-submission failed: ' + err.message, type: 'error' });
    } finally {
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };

  const getTabLabel = () => {
    const labels = {
      upload: 'UPLOAD',
      myfiles: 'HISTORY',
      live: 'CURRENT SCREEN'
    };
    return labels[activeTab] || activeTab.toUpperCase();
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'upload': return <Upload className="w-5 h-5 text-sky-400" />;
      case 'myfiles': return <History className="w-5 h-5 text-sky-400" />;
      case 'live': return <Tv className="w-5 h-5 text-sky-400" />;
      default: return <Monitor className="w-5 h-5 text-sky-400" />;
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="animate-fade-in max-w-2xl mx-auto pb-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Upload size={120} />
              </div>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Upload</h3>
                  <div 
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group ${
                      file ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_30px_rgba(56,189,248,0.05)]' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                    onClick={() => document.getElementById('media-upload').click()}
                  >
                    <input id="media-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                      <Upload className={`w-5 h-5 ${file ? 'text-[var(--accent)]' : 'text-white'}`} />
                    </div>
                    {file ? (
                      <div className="space-y-1">
                        <p className="text-base font-bold text-white truncate max-w-xs mx-auto">{file.name}</p>
                        <p className="text-sky-400 text-[9px] font-black uppercase tracking-[4px]">{(file.size / 1024 / 1024).toFixed(2)} MB • VERIFIED</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-base font-bold text-white">Select File</p>
                        <p className="text-slate-500 text-[10px] font-medium">PDF, MP4, WEBM, or JPG</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Schedule</h3>
                  <form onSubmit={handleUpload} className="space-y-6">
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                            <Calendar size={12} className="text-sky-400" />
                            From Date & Time
                          </label>
                          <input 
                            type="datetime-local" 
                            required 
                            className="nexus-input py-3" 
                            value={requestedStartTime} 
                            onChange={(e) => setRequestedStartTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                            <Clock size={12} className="text-rose-400" />
                            To Date & Time
                          </label>
                          <input 
                            type="datetime-local" 
                            required 
                            className="nexus-input py-3" 
                            value={requestedEndTime} 
                            onChange={(e) => setRequestedEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {msg.text && (
                      <div className={`p-3 rounded-xl flex items-center gap-3 animate-fade-in border ${
                        msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {msg.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                        <p className="text-[10px] font-bold uppercase tracking-wider">{msg.text}</p>
                      </div>
                    )}

                    <button type="submit" disabled={!file || !requestedStartTime || !requestedEndTime || uploading} className="nexus-btn-primary w-full py-4 text-base flex items-center justify-center gap-3">
                      {uploading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          UPLOADING...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Upload
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'myfiles':
        return (
          <Card className="animate-fade-in">
            <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-xl font-bold">History</h3>
                <p className="text-xs text-[var(--text-dim)] uppercase tracking-[4px] font-bold mt-1">History</p>
              </div>
              <History className="text-sky-400 opacity-20" size={32} />
            </div>
            {myFiles.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                 <History className="w-16 h-16 mx-auto mb-4" />
                 <p className="font-bold uppercase tracking-widest text-sm">No historical data found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-black text-slate-500">
                      <th className="pb-4 px-4">Asset Manifest</th>
                      <th className="pb-4 px-4">Transmission</th>
                      <th className="pb-4 px-4">Requested Window</th>
                      <th className="pb-4 px-4 text-center">Status</th>
                      <th className="pb-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myFiles.map(f => (
                      <tr key={f.id} className="group hover:bg-white/5 transition-colors">
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[var(--accent)]/30 transition-colors">
                               {f.fileType === 'pdf' && <FileText className="text-sky-400" size={20}/>}
                               {f.fileType === 'video' && <Play className="text-emerald-400" size={20}/>}
                               {f.fileType === 'image' && <ImageIcon className="text-indigo-400" size={20}/>}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">{f.fileName}</p>
                               <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{f.fileType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <p className="text-[10px] font-bold text-white uppercase">{new Date(f.uploadedAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(f.uploadedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="py-6 px-4">
                          {f.requestedStartTime ? (
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-sky-400 uppercase">FROM: {new Date(f.requestedStartTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                               <p className="text-[9px] font-black text-rose-400 uppercase">TO: {new Date(f.requestedEndTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600 italic">No Window Requested</span>
                          )}
                        </td>
                        <td className="py-6 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                              f.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              f.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>{f.status}</span>
                            {f.status === 'rejected' && f.rejectionReason && (
                              <p className="text-[8px] font-bold text-rose-400 uppercase max-w-[100px] leading-tight mt-1">{f.rejectionReason}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-6 px-4 text-right">
                           <button 
                             onClick={() => handleResubmit(f.id)}
                             title="Re-submit Legacy Asset"
                             className="p-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-[var(--accent)] hover:border-transparent hover:text-white transition-all active:scale-95"
                           >
                             <RefreshCw size={18} />
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

  const Info = ({ size, className }) => <AlertCircle size={size} className={className} />;

  return (
    <Shell role="user" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-10 max-w-6xl mx-auto">
        <header className="mb-8 relative">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-sky-500/20 rounded-lg">
                {getTabIcon()}
             </div>
             <span className="text-[10px] tracking-[6px] font-black uppercase opacity-60">User</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-white leading-none uppercase">{getTabLabel()}</h1>
        </header>
        {renderView()}
      </div>
    </Shell>
  );
};

export default UserDashboard;
