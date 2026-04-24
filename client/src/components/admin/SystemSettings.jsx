import React, { useState } from 'react';
import { Monitor, AlertCircle, Info, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Card from './Card';
import { useScreens } from '../../hooks/useAdminData';

const SystemSettings = ({ fetchData }) => {
  const { data: screens = [] } = useScreens();
  const [resetTargetType, setResetTargetType] = useState('all');
  const [resetTargetId, setResetTargetId] = useState('');
  
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
