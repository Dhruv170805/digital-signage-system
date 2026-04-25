import React, { useState } from 'react';
import { useHistoryLogs } from '../../hooks/useAdminData';
import { 
  Search, Filter, User, Tv, AlertTriangle, 
  ShieldCheck, Download, History, Zap, Palette, Monitor, Activity, ShieldAlert, HardDrive, Clock
} from 'lucide-react';

const SystemHistory = ({ limit }) => {
  const { data: logs = [], isLoading: loading } = useHistoryLogs();
  const [filters, setFilters] = useState({ action: '', search: '', startDate: '', endDate: '' });

  const parseDetails = (details) => {
    if (!details) return {};
    try { return typeof details === 'string' ? JSON.parse(details) : details; } catch (e) { return {}; }
  };

  const filteredLogs = logs.filter(log => {
    if (!log) return false;
    if (filters.action) {
        const logAction = log.action?.toUpperCase() || '';
        const cat = filters.action.toUpperCase();
        if (cat === 'UPLOAD' && !logAction.includes('UPLOAD')) return false;
        if (cat === 'REJECT' && !logAction.includes('REJECT')) return false;
        if (cat === 'COMPLETED' && !logAction.includes('APPROVE')) return false;
        if (cat === 'DELETE' && !logAction.includes('DELETE') && !logAction.includes('WIPE')) return false;
    }
    if (filters.search) {
        const search = filters.search.toLowerCase();
        const operator = (log.userId?.name || 'automated system').toLowerCase();
        const entityType = (log.entity || '').toLowerCase();
        const details = parseDetails(log.details);
        const entityName = (details.name || details.filename || details.email || '').toLowerCase();
        if (!operator.includes(search) && !entityType.includes(search) && !entityName.includes(search)) return false;
    }
    return true;
  });

  const displayedLogs = limit ? filteredLogs.slice(0, limit) : filteredLogs;

  const getEntityData = (entity) => {
    const e = entity?.toUpperCase() || '';
    if (e.includes('USER')) return { icon: User, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' };
    if (e.includes('MEDIA')) return { icon: HardDrive, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (e.includes('SCREEN')) return { icon: Monitor, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    if (e.includes('TICKER')) return { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
    if (e.includes('LAYOUT') || e.includes('TEMPLATE')) return { icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' };
    return { icon: History, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' };
  };

  const getActionBadgeColor = (type) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('APPROVE')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (t.includes('REJECT') || t.includes('DELETE')) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (t.includes('UPDATE')) return 'bg-sky-50 text-sky-600 border-sky-100';
    return 'bg-slate-50 text-slate-400 border-slate-100';
  };

  const getEntityDisplayName = (log) => {
    const details = parseDetails(log.details);
    return details.name || details.filename || details.email || log.entity;
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
          
          <div className="bg-white p-8 border-b border-slate-200 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2"><History className="text-indigo-600" size={16} /><span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Audit Protocol</span></div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">System History</h2>
                </div>
                {!limit && (
                    <div className="flex gap-4 items-center">
                        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder="Trace Entity or Operator..." className="nexus-input pl-11 py-2.5 text-[11px] bg-slate-50 border-slate-200 w-64" value={filters.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}/></div>
                        <button onClick={() => {}} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"><Download size={18}/></button>
                    </div>
                )}
            </div>
            {!limit && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-fit">
                    {['', 'UPLOAD', 'REJECT', 'COMPLETED', 'DELETE'].map(cat => (
                        <button key={cat} onClick={() => setFilters(p => ({ ...p, action: cat }))} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filters.action === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {cat || 'ALL SIGNALS'}
                        </button>
                    ))}
                </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-white">
            <div className="h-full overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest"><th className="py-6 px-10">Entity Target</th><th className="py-6 px-10">Protocol</th><th className="py-6 px-10">Operator</th><th className="py-6 px-10 text-right">Timestamp</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-black uppercase tracking-[12px] animate-pulse">Syncing...</td></tr>
                            ) : displayedLogs.length === 0 ? (
                                <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-black uppercase tracking-[12px]">No Data</td></tr>
                            ) : (
                                displayedLogs.map(log => {
                                    const entityData = getEntityData(log.entity);
                                    return (
                                        <tr key={log._id || log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-8 px-10"><div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${entityData.bg} ${entityData.color} ${entityData.border}`}><entityData.icon size={20} /></div><div><p className="font-black text-xs text-slate-900 uppercase tracking-tight truncate max-w-[200px]">{getEntityDisplayName(log)}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] mt-1">{log.entity}</p></div></div></td>
                                            <td className="py-8 px-10"><span className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getActionBadgeColor(log.action)}`}>{log.action.toLowerCase().replace(/_/g, ' ')}</span></td>
                                            <td className="py-8 px-10"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px]">{log.userId?.name?.charAt(0) || 'S'}</div><p className="text-xs font-black text-slate-700 uppercase">{log.userId?.name || 'System'}</p></div></td>
                                            <td className="py-8 px-10 text-right"><p className="text-xs font-black text-slate-900 tabular-nums leading-none mb-2">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p></td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
       </div>
  );
};

export default SystemHistory;
