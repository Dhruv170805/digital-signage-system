import React from 'react';
import { Monitor, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Card from './Card';

const SystemSettings = ({ settings, setSettings, approvedMedia, fetchData }) => {
  const saveSettings = async (key, val) => {
    try {
      await api.post(`/api/settings`, { [key]: val });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const executeSystemReset = async () => {
    if (!window.confirm('CRITICAL: Permanently wipe all schedules and media records? This cannot be undone.')) return;
    try {
      await api.post(`/api/settings/wipe`, {});
      toast.success('System purged.');
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Reset failed.'); 
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      <Card 
        title="Idle Screen" 
        icon={Monitor} 
        subtitle="Default Content Configuration"
      >
        <div className="space-y-6 mt-4">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="text-xs font-bold uppercase tracking-widest text-text-dim mb-4 block">Global Default Media</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className="nexus-input" value={settings.idleWallpaperId || ''} onChange={(e) => saveSettings('idleWallpaperId', e.target.value)}>
                <option value="">System Default (Quotes)</option>
                {approvedMedia.map(m => <option key={m._id || m.id} value={m._id || m.id}>{m.fileName} ({m.fileType})</option>)}
              </select>
              <div className="flex items-center gap-3 px-4 py-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                <Info className="text-sky-600 shrink-0" size={16} />
                <p className="text-[10px] font-bold text-sky-600 uppercase leading-tight">This asset will play when no specific schedule is active.</p>
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
        <div className="flex items-center justify-between p-6 bg-rose-50 border border-rose-100 rounded-2xl mt-4">
          <div>
              <p className="font-bold text-rose-900">Reset Local Database</p>
              <p className="text-xs text-rose-600/60 uppercase font-black mt-1">Permanently wipe all schedules and media records</p>
          </div>
          <button onClick={executeSystemReset} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-rose-700 transition-all">Execute Reset</button>
        </div>
      </Card>
    </div>
  );
};

export default SystemSettings;
