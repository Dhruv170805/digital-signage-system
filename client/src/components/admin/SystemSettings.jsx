import React, { useState } from 'react';
import { Monitor, AlertCircle, Info, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Card from './Card';
import { useScreens } from '../../hooks/useAdminData';

const SystemSettings = ({ settings, setSettings, approvedMedia, fetchData }) => {
  const { data: screens = [] } = useScreens();
  const [resetTargetType, setResetTargetType] = useState('all');
  const [resetTargetId, setResetTargetId] = useState('');
  
  const [idleTargetType, setIdleTargetType] = useState('all');
  const [idleTargetId, setIdleTargetId] = useState('');
  const [selectedIdleMedia, setIdleMedia] = useState(settings.idleWallpaperId || '');

  const saveSettings = async (key, val) => {
    try {
      await api.post(`/api/settings`, { [key]: val });
      fetchData();
      toast.success('Global Idle Media Updated');
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const updateScreenIdleMedia = async () => {
    try {
      if (idleTargetType === 'all') {
        await saveSettings('idleWallpaperId', selectedIdleMedia);
      } else if (idleTargetType === 'screen') {
        if (!idleTargetId) return toast.error('Select a screen');
        await api.put(`/api/screens/${idleTargetId}`, { idleMediaId: selectedIdleMedia || null });
        toast.success('Screen Idle Media Updated');
        fetchData();
      } else if (idleTargetType === 'group') {
          // Bulk update screens in group (or we could add idleMediaId to ScreenGroup)
          // For simplicity, let's update all screens with this groupId
          const groupScreens = screens.filter(s => s.groupId?._id === idleTargetId || s.groupId === idleTargetId);
          await Promise.all(groupScreens.map(s => 
            api.put(`/api/screens/${s._id}`, { idleMediaId: selectedIdleMedia || null })
          ));
          toast.success('Group Idle Media Updated');
          fetchData();
      }
      
      const screenService = require('../../../../server/src/services/screenService'); // This is client side, can't require server service.
      // We should rely on the backend to broadcast.
    } catch (err) { toast.error(err.response?.data?.error || err.message); }
  };

  const executeSystemReset = async () => {
    if (!window.confirm('CRITICAL: Reset the selected target? This will clear assignments and stop playback.')) return;
    try {
      await api.post(`/api/screens/reset`, { targetType: resetTargetType, targetId: resetTargetId });
      toast.success('Reset executed successfully.');
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Reset failed.'); 
    }
  };

  const executeSystemWipe = async () => {
    if (!window.confirm('CRITICAL: Permanently wipe all schedules and media records? This cannot be undone.')) return;
    try {
      await api.post(`/api/settings/wipe`, {});
      toast.success('System purged.');
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Wipe failed.'); 
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      <Card 
        title="Idle Transmission" 
        icon={Monitor} 
        subtitle="Default Content & Static Messaging"
      >
        <div className="space-y-6 mt-4">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-[32px] space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <p className="font-bold text-text uppercase text-xs">Targeted Content</p>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">Assign fallback media to specific screens</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Select Media</label>
                  <select className="nexus-input" value={selectedIdleMedia} onChange={(e) => setIdleMedia(e.target.value)}>
                    <option value="">System Default (Quotes)</option>
                    {approvedMedia.map(m => <option key={m._id || m.id} value={m._id || m.id}>{m.fileName} ({m.fileType})</option>)}
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Target Scope</label>
                  <select className="nexus-input" value={idleTargetType} onChange={(e) => { setIdleTargetType(e.target.value); setIdleTargetId(''); }}>
                    <option value="all">Global (All Screens)</option>
                    <option value="screen">Specific Screen</option>
                    <option value="group">Screen Group</option>
                  </select>
               </div>

               {idleTargetType === 'screen' && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Choose Screen</label>
                    <select className="nexus-input" value={idleTargetId} onChange={(e) => setIdleTargetId(e.target.value)}>
                        <option value="">Select Target...</option>
                        {screens.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                    </select>
                </div>
               )}

               {idleTargetType === 'group' && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Group Identifier</label>
                    <input type="text" placeholder="Group ID" className="nexus-input" value={idleTargetId} onChange={(e) => setIdleTargetId(e.target.value)} />
                </div>
               )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
               <div className="flex items-center gap-3 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl max-w-md">
                 <Info className="text-sky-600 shrink-0" size={14} />
                 <p className="text-[9px] font-bold text-sky-600 uppercase leading-tight">Idle content triggers automatically when no broadcasts are scheduled for the target.</p>
               </div>
               <button onClick={updateScreenIdleMedia} className="nexus-btn-primary px-8 tracking-[2px]">Apply Configuration</button>
            </div>
          </div>
        </div>
      </Card>

      <Card 
        className="border-rose-500/20" 
        title="System Reset" 
        icon={RefreshCw} 
        subtitle="Clear Assignments & Stop Playback"
      >
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl mt-4 space-y-6">
          <div>
              <p className="font-bold text-rose-900">Targeted Reset</p>
              <p className="text-xs text-rose-600/60 uppercase font-black mt-1">Select scope to clear active playback loop</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase ml-1 opacity-50 text-rose-900">Reset Scope</label>
               <select className="nexus-input border-rose-200 focus:border-rose-500" value={resetTargetType} onChange={(e) => { setResetTargetType(e.target.value); setResetTargetId(''); }}>
                 <option value="all">Global (All Screens)</option>
                 <option value="screen">Specific Screen</option>
                 <option value="group">Screen Group</option>
               </select>
            </div>
            
            {resetTargetType === 'screen' && (
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase ml-1 opacity-50 text-rose-900">Select Screen</label>
                 <select className="nexus-input border-rose-200 focus:border-rose-500" value={resetTargetId} onChange={(e) => setResetTargetId(e.target.value)}>
                   <option value="">Choose Screen...</option>
                   {screens.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                 </select>
              </div>
            )}

            {resetTargetType === 'group' && (
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase ml-1 opacity-50 text-rose-900">Select Group</label>
                 <input type="text" placeholder="Group ID" className="nexus-input border-rose-200 focus:border-rose-500" value={resetTargetId} onChange={(e) => setResetTargetId(e.target.value)} />
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-2 border-t border-rose-200/50">
             <button onClick={executeSystemReset} disabled={resetTargetType !== 'all' && !resetTargetId} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20">
               Execute Reset
             </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-rose-50 border border-rose-100 rounded-2xl mt-6">
          <div>
              <p className="font-bold text-rose-900">Database Purge (Factory Reset)</p>
              <p className="text-[10px] text-rose-600/60 uppercase font-black mt-1">Permanently wipe ALL schedules and media records</p>
          </div>
          <button onClick={executeSystemWipe} className="px-6 py-2.5 bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase hover:bg-rose-800 shadow-xl transition-all">Execute Purge</button>
        </div>
      </Card>
    </div>
  );
};

export default SystemSettings;
