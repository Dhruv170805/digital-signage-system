import React, { useState } from 'react';
import { useHistoryLogs } from '../../hooks/useAdminData';
import { 
  Search, Filter, User, Tv, AlertTriangle, 
  ShieldCheck, Download, History, Zap, Palette, Monitor, Activity, ShieldAlert, HardDrive
} from 'lucide-react';

const SystemHistory = ({ limit }) => {
  const { data: logs = [], isLoading: loading } = useHistoryLogs();
  const [filters, setFilters] = useState({
    action: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const parseDetails = (details) => {
    if (!details) return {};
    try {
      return typeof details === 'string' ? JSON.parse(details) : details;
    } catch (e) { return {}; }
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
        if (cat === 'PENDING') {
            const forbidden = ['APPROVE', 'REJECT', 'UPLOAD', 'DELETE'];
            if (forbidden.some(f => logAction.includes(f))) return false;
        }
    }

    if (filters.search) {
        const search = filters.search.toLowerCase();
        const operator = (log.userId?.name || 'automated system').toLowerCase();
        const entityType = (log.entity || '').toLowerCase();
        const details = parseDetails(log.details);
        const entityName = (details.name || details.filename || details.email || '').toLowerCase();
        if (!operator.includes(search) && !entityType.includes(search) && !entityName.includes(search)) return false;
    }
    
    if (log.createdAt) {
        const date = new Date(log.createdAt);
        const logDateLocal = date.toISOString().split('T')[0];
        if (filters.startDate && logDateLocal < filters.startDate) return false;
        if (filters.endDate && logDateLocal > filters.endDate) return false;
    }
    return true;
  });

  const displayedLogs = limit ? filteredLogs.slice(0, limit) : filteredLogs;

  const getEntityData = (entity) => {
    const e = entity?.toUpperCase() || '';
    if (e.includes('USER')) return { icon: User, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
    if (e.includes('MEDIA')) return { icon: HardDrive, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (e.includes('SCREEN')) return { icon: Monitor, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    if (e.includes('TICKER')) return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (e.includes('LAYOUT') || e.includes('TEMPLATE')) return { icon: Palette, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    return { icon: History, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
  };

  const formatActionLabel = (action) => {
    const a = action?.toUpperCase() || '';
    if (a.includes('APPROVE')) return 'authorized';
    if (a.includes('UPLOAD')) return 'ingested';
    if (a.includes('REJECT')) return 'rejected';
    if (a.includes('PENDING')) return 'pending';
    if (a.includes('CREATE')) return 'provisioned';
    if (a.includes('DELETE')) return 'purged';
    if (a.includes('UPDATE')) return 'calibrated';
    return a.toLowerCase().replace(/_/g, ' ');
  };

  const getActionBadgeColor = (type) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('APPROVE')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (t.includes('REJECT') || t.includes('DELETE')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (t.includes('UPDATE')) return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/10';
  };

  const getEntityDisplayName = (log) => {
    const details = parseDetails(log.details);
    return details.name || details.filename || details.email || log.entity;
  };

  return (
    <div className="space-y-6">
      {!limit && (
        <div className="bg-slate-50/50 border border-slate-200 p-8 rounded-[40px] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                        <Filter size={12}/> Logic Filter
                    </label>
                    <select className="nexus-input py-2.5 text-[11px] font-bold" value={filters.action} onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))}>
                        <option value="">ALL CLUSTERS</option>
                        <option value="UPLOAD">INGESTION</option>
                        <option value="REJECT">REJECTION</option>
                        <option value="COMPLETED">AUTHORIZATION</option>
                        <option value="DELETE">PURGE</option>
                    </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                        <Search size={12}/> Signal Search
                    </label>
                    <input type="text" placeholder="Operator, ID, or Entity..." className="nexus-input py-2.5 text-[11px]" value={filters.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}/>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilters({ action: '', search: '', startDate: '', endDate: '' })} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Clear</button>
                    <button onClick={() => {}} className="px-5 py-3 bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-600/20"><Download size={18}/></button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[48px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[9px] font-black uppercase text-slate-400 tracking-[3px]">
              <th className="py-6 px-10">Entity Target</th>
              <th className="py-6 px-10">Operation Protocol</th>
              {!limit && <th className="py-6 px-10">Operator Identity</th>}
              <th className="py-6 px-10 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-black uppercase tracking-[12px] animate-pulse">Synchronizing Logs...</td></tr>
            ) : displayedLogs.length === 0 ? (
              <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-black uppercase tracking-[12px]">Null Set Detected</td></tr>
            ) : (
              displayedLogs.map(log => {
                const entityData = getEntityData(log.entity);
                return (
                  <tr key={log._id || log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-8 px-10">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-sm ${entityData.bg} ${entityData.color} ${entityData.border}`}>
                          <entityData.icon size={20} />
                        </div>
                        <div>
                          <p className="font-black text-xs text-text uppercase tracking-tight truncate max-w-[180px]">{getEntityDisplayName(log)}</p>
                          <p className="text-[9px] font-bold text-sky-600 uppercase tracking-[2px] mt-1">
                            {log.entity} • {log.entityId ? log.entityId.slice(-6) : 'SYS'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-10">
                      <span className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getActionBadgeColor(log.action)}`}>
                          {formatActionLabel(log.action)}
                      </span>
                    </td>
                    {!limit && (
                        <td className="py-8 px-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                <User size={18} />
                                </div>
                                <div>
                                <p className="text-xs font-black text-text uppercase leading-none">{log.userId?.name || 'Auto Engine'}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{log.userId?.role || 'SYSTEM'}</p>
                                </div>
                            </div>
                        </td>
                    )}
                    <td className="py-8 px-10 text-right">
                      <p className="text-xs font-black text-text tabular-nums leading-none">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">
                        {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemHistory;
