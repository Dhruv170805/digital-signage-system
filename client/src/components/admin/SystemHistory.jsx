import React, { useState } from 'react';
import { useHistoryLogs } from '../../hooks/useAdminData';
import { 
  Search, Filter, Calendar, User, Tv, 
  ArrowUpRight, ArrowDownLeft, AlertTriangle, 
  RotateCcw, ShieldCheck, Download, History, RefreshCw, Layers, HardDrive, Zap, Palette, Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';

const SystemHistory = () => {
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
    } catch (e) {
      return {};
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!log) return false;

    // 1. Category Filter Mapping
    if (filters.action) {
        const logAction = log.action?.toUpperCase() || '';
        const cat = filters.action.toUpperCase();
        
        if (cat === 'UPLOAD' && !logAction.includes('UPLOAD')) return false;
        if (cat === 'REJECT' && !logAction.includes('REJECT')) return false;
        if (cat === 'COMPLETED' && !logAction.includes('APPROVE')) return false;
        if (cat === 'DELETE' && !logAction.includes('DELETE') && !logAction.includes('WIPE') && !logAction.includes('TERMINATE')) return false;
        if (cat === 'PENDING') {
            const forbidden = ['APPROVE', 'REJECT', 'UPLOAD', 'DELETE', 'TERMINATE', 'WIPE', 'WIPE_SYSTEM', 'UPDATE_SETTINGS'];
            const isForbidden = forbidden.some(f => logAction.includes(f));
            if (isForbidden) return false;
        }
    }

    // 2. Text Search
    if (filters.search) {
        const search = filters.search.toLowerCase();
        const operator = (log.userId?.name || 'automated system').toLowerCase();
        const entityType = (log.entity || '').toLowerCase();
        const details = parseDetails(log.details);
        const entityName = (details.name || details.filename || details.email || '').toLowerCase();
        
        if (!operator.includes(search) && !entityType.includes(search) && !entityName.includes(search)) {
            return false;
        }
    }
    
    // 3. Date Filtering
    if (log.createdAt) {
        const date = new Date(log.createdAt);
        if (!isNaN(date.getTime())) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const logDateLocal = `${y}-${m}-${d}`;
            
            if (filters.startDate && logDateLocal < filters.startDate) return false;
            if (filters.endDate && logDateLocal > filters.endDate) return false;
        }
    }
    
    return true;
  });

  const getEntityData = (entity) => {
    const e = entity?.toUpperCase() || '';
    if (e.includes('USER')) return { emoji: '👤', color: 'border-sky-500', bg: 'bg-sky-50' };
    if (e.includes('MEDIA')) return { emoji: '🖼️', color: 'border-emerald-500', bg: 'bg-emerald-50' };
    if (e.includes('SCREEN')) return { emoji: '🖥️', color: 'border-indigo-500', bg: 'bg-indigo-50' };
    if (e.includes('TICKER')) return { emoji: '🎫', color: 'border-amber-500', bg: 'bg-amber-50' };
    if (e.includes('LAYOUT') || e.includes('TEMPLATE')) return { emoji: '🎨', color: 'border-purple-500', bg: 'bg-purple-50' };
    return { emoji: '📜', color: 'border-slate-400', bg: 'bg-slate-50' };
  };

  const formatActionLabel = (action) => {
    const a = action?.toUpperCase() || '';
    if (a.includes('APPROVE')) return 'approved';
    if (a.includes('UPLOAD')) return 'uploaded';
    if (a.includes('REJECT')) return 'rejected';
    if (a.includes('PENDING')) return 'pending';
    if (a.includes('CREATE') || a.includes('REGISTER')) return 'created';
    if (a.includes('DELETE') || a.includes('TERMINATE') || a.includes('WIPE')) return 'deleted';
    if (a.includes('UPDATE')) return 'updated';
    if (a.includes('SCHEDULE')) return 'scheduled';
    if (a.includes('RESET')) return 'reset';
    return a.toLowerCase().replace(/_/g, ' ');
  };

  const getActionBadgeColor = (type) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('APPROVE') || t.includes('REGISTER')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (t.includes('REJECT') || t.includes('RESET') || t.includes('WIPE') || t.includes('DELETE')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (t.includes('UPDATE')) return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    if (t.includes('SCHEDULE')) return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/10';
  };

  const getEntityDisplayName = (log) => {
    const details = parseDetails(log.details);
    return details.name || details.filename || details.email || log.entity;
  };

  const formatReason = (details) => {
    if (!details) return 'Routine operational procedure.';
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      if (typeof parsed === 'object') {
        if (parsed.reason) return parsed.reason;
        return Object.entries(parsed)
          .filter(([key]) => !['name', 'filename', 'email', 'status'].includes(key))
          .map(([key, val]) => `${key}: ${val}`)
          .join(' | ') || 'Administrative synchronization.';
      }
    } catch (e) {}
    return 'System procedure.';
  };

  const exportToCSV = () => {
    try {
      const headers = ['Action', 'Entity', 'Entity ID', 'Operator', 'Reason', 'Timestamp'];
      const rows = filteredLogs.map(log => [
        log.action,
        log.entity,
        log.entityId || 'SYSTEM',
        log.userId?.name || 'SYSTEM',
        formatReason(log.details).replace(/,/g, ';'),
        new Date(log.createdAt).toLocaleString()
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `nexus_history_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('History exported successfully');
    } catch (err) { toast.error('Export failed'); }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Precision Aligned Filter Bar */}
      <div className="glass p-10 border-white/5 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-end">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                    <Filter size={12}/> Event Category
                </label>
                <select 
                    className="nexus-input h-[58px] py-0 text-sm font-bold uppercase" 
                    value={filters.action}
                    onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))}
                >
                    <option value="">ALL EVENTS</option>
                    <option value="UPLOAD">UPLOADED</option>
                    <option value="REJECT">REJECTED</option>
                    <option value="COMPLETED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="DELETE">DELETED</option>
                </select>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                    <Search size={12}/> Search Term
                </label>
                <input 
                    type="text"
                    placeholder="Operator or ID..."
                    className="nexus-input h-[58px] py-0 text-sm"
                    value={filters.search}
                    onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                />
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                    <Calendar size={12}/> From Date
                </label>
                <input 
                    type="date" 
                    className="nexus-input h-[58px] py-0 text-sm"
                    value={filters.startDate}
                    onChange={(e) => setFilters(p => ({ ...p, startDate: e.target.value }))}
                />
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                    <Calendar size={12}/> To Date
                </label>
                <input 
                    type="date" 
                    className="nexus-input h-[58px] py-0 text-sm"
                    value={filters.endDate}
                    onChange={(e) => setFilters(p => ({ ...p, endDate: e.target.value }))}
                />
            </div>

            <div className="flex gap-4 h-[58px]">
                <button 
                    onClick={() => setFilters({ action: '', search: '', startDate: '', endDate: '' })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-black transition-all"
                >
                    Reset
                </button>
                <button 
                    onClick={exportToCSV}
                    disabled={filteredLogs.length === 0}
                    className="px-6 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-sky-600/20"
                    title="Export CSV"
                >
                    <Download size={22}/>
                </button>
            </div>
        </div>
      </div>

      {/* Timeline Table */}
      <div className="glass overflow-hidden border-white/5 shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
              <th className="py-6 px-8">USER/Event ID</th>
              <th className="py-6 px-8">Event Type</th>
              <th className="py-6 px-8">Operator Name</th>
              <th className="py-6 px-8">Reason</th>
              <th className="py-6 px-8 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="5" className="py-24 text-center text-slate-500 font-black uppercase tracking-[6px] animate-pulse">Synchronizing History...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="5" className="py-24 text-center text-slate-500 font-black uppercase tracking-[6px]">No records match criteria</td></tr>
            ) : (
              filteredLogs.map(log => {
                const entityData = getEntityData(log.entity);
                return (
                  <tr key={log._id || log.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-8 px-8">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all shadow-sm ${entityData.bg} ${entityData.color}`}>
                          <span className="text-2xl filter drop-shadow-sm">{entityData.emoji}</span>
                        </div>
                        <div className="max-w-[200px]">
                          <p className="font-black text-sm text-text uppercase tracking-tight truncate">{getEntityDisplayName(log)}</p>
                          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mt-1">
                            {log.entity} • {log.entityId ? log.entityId.slice(-8) : 'SYSTEM'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-8">
                      <span className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getActionBadgeColor(log.action)}`}>
                          {formatActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="py-8 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                          <User size={18} className="text-sky-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-200 uppercase tracking-tighter leading-none">{log.userId?.name || 'Automated System'}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 tracking-widest">{log.userId?.role || 'SYSTEM'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-8">
                      <p className="text-[11px] font-medium text-slate-400 max-w-md italic leading-relaxed">
                        {formatReason(log.details)}
                      </p>
                    </td>
                    <td className="py-8 px-8 text-right">
                      <p className="text-xs font-black text-slate-200 tabular-nums uppercase leading-none">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 tracking-widest">
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
