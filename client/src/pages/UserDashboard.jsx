import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Shell from '../components/Shell';
import { 
  Upload, FileText, Play, Image as ImageIcon, 
  CheckCircle2, Clock, XCircle, AlertCircle 
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
          setMyFiles(combined.filter(f => f.uploaderId === user.id));
        }
      } catch (err) { console.error(err); }
    };
    fetch();
    return () => { isMounted = false; };
  }, [user.id, refreshKey]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('media', file);
    formData.append('uploaderId', user.id);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/upload`, formData);
      setMsg({ text: 'Asset transmitted successfully. Awaiting clearance.', type: 'success' });
      setFile(null);
      // To refresh, we can just trigger a re-fetch by updating a dummy state if needed,
      // or we can just call the same logic. Since we moved it to useEffect, 
      // let's just use a simple state to trigger it.
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setMsg({ text: 'Transmission failed: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="max-w-3xl animate-fade-in">
            <Card>
              <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8 text-[var(--accent)]">Asset Submission</h3>
              <form onSubmit={handleUpload} className="space-y-8">
                <div 
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    file ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]/40'
                  }`}
                  onClick={() => document.getElementById('media-upload').click()}
                >
                  <input id="media-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  <div className="bg-[var(--surface)] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
                    <Upload className={`w-8 h-8 ${file ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`} />
                  </div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-[var(--text)] font-semibold">{file.name}</p>
                      <p className="text-[var(--text-dim)] text-xs mono uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB • READY</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[var(--text)] font-medium">Select safety assets</p>
                      <p className="text-[var(--text-dim)] text-xs">PDF, MP4, WEBM, or JPG</p>
                    </div>
                  )}
                </div>

                {msg.text && (
                   <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
                     msg.type === 'success' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--red)]/10 text-[var(--red)]'
                   }`}>
                     {msg.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                     <p className="text-sm font-medium">{msg.text}</p>
                   </div>
                )}

                <button type="submit" disabled={!file || uploading} className="nexus-btn-primary w-full">
                  {uploading ? 'TRANSMITTING...' : 'START UPLOAD'}
                </button>
              </form>
            </Card>
          </div>
        );

      case 'myfiles':
        return (
          <Card className="animate-fade-in">
            <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-8">Submission Records</h3>
            {myFiles.length === 0 ? (
              <div className="text-center py-16 opacity-30 px-4">
                 <p className="mono uppercase tracking-widest text-xs">No assets detected</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] px-4">Asset</th>
                      <th className="pb-4 mono text-[10px] uppercase text-[var(--text-dim)] px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFiles.map(f => (
                      <tr key={f.id} className="border-b border-[var(--border)]/30">
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[var(--surface)] rounded-xl flex items-center justify-center border border-[var(--border)]">
                               {f.fileType === 'pdf' && <FileText className="text-[var(--blue)]" size={18}/>}
                               {f.fileType === 'video' && <Play className="text-[var(--accent)]" size={18}/>}
                               {f.fileType === 'image' && <ImageIcon className="text-[var(--green)]" size={18}/>}
                            </div>
                            <div>
                               <p className="text-sm font-medium">{f.fileName}</p>
                               <p className="text-[10px] mono uppercase text-[var(--text-dim)]">{f.fileType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <span className={`text-[10px] mono font-bold uppercase ${
                            f.status === 'approved' ? 'text-[var(--green)]' :
                            f.status === 'pending' ? 'text-[var(--orange)]' : 'text-[var(--red)]'
                          }`}>{f.status}</span>
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
              <h3 className="mono text-xs font-bold uppercase tracking-[2px] mb-6">Live System Preview</h3>
              <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl relative group">
                 <iframe src="/display" className="w-full h-full border-none pointer-events-none" title="Live Preview" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="mono text-[var(--accent)] text-lg tracking-[8px] animate-pulse">MONITORING FEED</p>
                 </div>
              </div>
           </div>
        );

      default: return null;
    }
  };

  return (
    <Shell role="user" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-10">
        <header className="mb-12">
          <h1 className="text-6xl font-light tracking-tighter text-[var(--text)]">Nexus Station</h1>
          <p className="text-[var(--text-dim)] mt-4 max-w-lg text-lg">Broadcast safety assets and factory updates.</p>
        </header>
        {renderView()}
      </div>
    </Shell>
  );
};

export default UserDashboard;
