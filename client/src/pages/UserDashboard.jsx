/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import api from '../services/api';
import Shell from '../components/Shell';
import useAuthStore from '../store/useAuthStore';
import { usePendingMedia, useMedia } from '../hooks/useAdminData';
import toast from 'react-hot-toast';
import Card from '../components/admin/Card';
import { 
  Upload, FileText, Play, Image as ImageIcon, 
  Clock, RefreshCw, Send, Monitor, Tv, Timer, CheckCircle, History
} from 'lucide-react';

const StatWidget = ({ label, value, icon: WidgetIcon, color = "blue" }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-600 group-hover:bg-blue-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 group-hover:bg-emerald-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-600 group-hover:bg-amber-500/20',
  };
  const currentStyles = colorMap[color] || colorMap.blue;
  const bgGlow = currentStyles.split(' ')[0];

  return (
    <div className="glass-card p-8 group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all ${bgGlow} opacity-50`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform ${currentStyles}`}>
            <WidgetIcon size={24} />
          </div>
        </div>
        <p className="text-[10px] font-black text-text-dim uppercase tracking-[3px] mb-2">{label}</p>
        <h2 className="text-4xl font-black text-text tracking-tighter tabular-nums">{value}</h2>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [requestedStartTime, setRequestedStartTime] = useState('');
  const [requestedEndTime, setRequestedEndTime] = useState('');
  
  const user = useAuthStore((state) => state.user);
  
  const { data: pendingMedia = [], refetch: refetchPending } = usePendingMedia();
  const { data: approvedMedia = [], refetch: refetchApproved } = useMedia();

  const myFiles = React.useMemo(() => {
    const combined = [...pendingMedia, ...approvedMedia];
    return combined
      .filter(f => (f.uploaderId === user?.id || f.uploadedBy === user?.id))
      .sort((a,b) => new Date(b.createdAt || b.uploadedAt) - new Date(a.createdAt || a.uploadedAt));
  }, [pendingMedia, approvedMedia, user?.id]);

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
      await api.post(`/api/media/upload`, formData);
      toast.success('Transmission Successful. Wait for Admin Approval.');
      setFile(null);
      setRequestedStartTime('');
      setRequestedEndTime('');
      refetchPending();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transmission failed. Contact Operations.');
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = async (id) => {
    try {
      await api.post(`/api/media/${id}/resubmit`, {});
      toast.success('Legacy asset re-submitted for approval.');
      refetchPending();
      refetchApproved();
      setActiveTab('myfiles');
    } catch {
      toast.error('Re-submission failed.');
    }
  };

  const getTabLabel = () => {
    const labels = { upload: 'UPLOAD', myfiles: 'HISTORY', live: 'PREVIEW' };
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

            <Card title="Asset Transmission" icon={Upload} subtitle="Broadcast Screen Submission">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-text">
                <div className="space-y-6">
                  <div 
                    className={`border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-center ${
                      file ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_50px_rgba(37,99,235,0.1)]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    onClick={() => document.getElementById('media-upload').click()}
                  >
                    <input id="media-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-slate-100 border border-slate-200 group-hover:scale-110 transition-transform relative z-10 shadow-inner">
                      <Upload className={`w-8 h-8 ${file ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    {file ? (
                      <div className="space-y-2 relative z-10">
                        <p className="text-xl font-black text-text truncate max-w-xs mx-auto uppercase tracking-tighter">{file.name}</p>
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[4px]">{(file.size / 1024 / 1024).toFixed(2)} MB • VERIFIED</p>
                      </div>
                    ) : (
                      <div className="space-y-2 relative z-10">
                        <p className="text-xl font-black text-text uppercase tracking-tighter">Initialize Payload</p>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">PDF, MP4, WEBM, JPG</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px] ml-1">Protocol Timing</h3>
                    <form onSubmit={handleUpload} className="space-y-8">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[2px] ml-1">Window Activation</label>
                          <input 
                            type="datetime-local" 
                            required 
                            className="nexus-input h-14" 
                            value={requestedStartTime} 
                            onChange={(e) => setRequestedStartTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[2px] ml-1">Window Deactivation</label>
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
                            <RefreshCw className="w-5 h-5 animate-spin text-white" />
                            <span className="text-xs font-black uppercase tracking-[4px] text-white">Transmitting...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-black uppercase tracking-[4px] text-white">Authorize Transmission</span>
                            <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform text-white" />
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
          <Card title="Operational History" icon={RefreshCw} subtitle="Asset Transmission Logs">
            {myFiles.length === 0 ? (
              <div className="text-center py-32 bg-slate-50 border border-dashed border-slate-200 rounded-[40px]">
                 <RefreshCw className="w-20 h-20 mx-auto mb-6 text-slate-300" />
                 <p className="font-black uppercase tracking-[6px] text-xs text-slate-500">No transmission records detected</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white text-text">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                      <th className="py-6 px-8">Payload Manifest</th>
                      <th className="py-6 px-8">Activation</th>
                      <th className="py-6 px-8">Security Window</th>
                      <th className="py-6 px-8 text-center">Status</th>
                      <th className="py-6 px-8 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myFiles.map(f => (
                      <tr key={f.id || f._id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-8 px-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-blue-500/30 transition-colors shadow-inner">
                               {f.fileType === 'pdf' && <FileText className="text-blue-600" size={24}/>}
                               {f.fileType === 'video' && <Play className="text-emerald-600" size={24}/>}
                               {f.fileType === 'image' && <ImageIcon className="text-indigo-600" size={24}/>}
                            </div>
                            <div>
                               <p className="text-base font-black text-text uppercase tracking-tighter">{f.fileName}</p>
                               <p className="text-[10px] font-black uppercase text-slate-500 tracking-[2px] mt-1">{f.fileType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-8 px-8">
                          <p className="text-[11px] font-black text-text uppercase tabular-nums">{new Date(f.createdAt || f.uploadedAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase mt-1 tabular-nums">{new Date(f.createdAt || f.uploadedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="py-8 px-8">
                          {f.requestedStartTime ? (
                            <div className="space-y-1.5">
                               <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-blue-600" /> ON: {new Date(f.requestedStartTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                               </p>
                               <p className="text-[9px] font-black text-rose-600/60 uppercase tracking-widest flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-rose-600" /> OFF: {new Date(f.requestedEndTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                               </p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">Immediate Deployment</span>
                          )}
                        </td>
                        <td className="py-8 px-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-xl border ${
                              f.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                              f.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                            }`}>{f.status}</span>
                            {f.status === 'rejected' && f.rejectionReason && (
                              <p className="text-[8px] font-black text-rose-600/40 uppercase max-w-[120px] leading-tight text-center">{f.rejectionReason}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-8 px-8 text-right">
                           <button 
                             onClick={() => handleResubmit(f.id || f._id)}
                             title="Protocol Re-Submission"
                             className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-90"
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
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
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
             <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                {getTabIcon()}
             </div>
             <div>
               <p className="text-[10px] tracking-[6px] font-black uppercase text-blue-600">Screen Operator</p>

               <h1 className="text-6xl font-black tracking-tighter text-text leading-none uppercase mt-1">{getTabLabel()}</h1>
             </div>
          </div>
        </header>
        {renderView()}
      </div>
    </Shell>
  );
};

export default UserDashboard;
