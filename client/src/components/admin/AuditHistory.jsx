import React, { useState } from 'react';
import { useAuditLogs } from '../../hooks/useAdminData';
import { 
  Search, Filter, Calendar, User, Tv, 
  ArrowUpRight, ArrowDownLeft, AlertTriangle, 
  RotateCcw, ShieldCheck, Download, History, RefreshCw, Layers, HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';

const AuditHistory = () => {
  const { data: logs = [], isLoading: loading } = useAuditLogs();
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: ''
  });

  const filteredLogs = logs.filter(log => {
    // 1. Action Filter (Case-Insensitive for backward compatibility)
    if (filters.action && log.action?.toUpperCase() !== filters.action.toUpperCase()) return false;
    
    // 2. Date Filtering using local date strings (YYYY-MM-DD)
    const logDateLocal = new Date(log.createdAt).toLocaleDateString('en-CA');
    
    if (filters.startDate && logDateLocal < filters.startDate) return false;
    if (filters.endDate && logDateLocal > filters.endDate) return false;
    
    return true;
  });

  const getActionIcon = (type) => {
    switch (type) {
      case 'APPROVE': return <ShieldCheck className="text-emerald-500" size={16} />;
      case 'REJECT': return <AlertTriangle className="text-rose-500" size={16} />;
      case 'TERMINATE': return <RotateCcw className="text-amber-500" size={16} />;
      case 'SCHEDULE': return <Calendar className="text-sky-500" size={16} />;
      case 'UPLOAD': return <Download className="text-blue-500" size={16} />;
      case 'REGISTER': return <Tv className="text-indigo-500" size={16} />;
      case 'UPDATE': return <RefreshCw className="text-emerald-500" size={16} />;
      case 'RESET': return <AlertTriangle className="text-rose-600" size={16} />;
      case 'CREATE_TICKER': return <ArrowUpRight className="text-sky-400" size={16} />;
      case 'CREATE_LAYOUT': return <Layers className="text-purple-500" size={16} />;
      case 'WIPE_SYSTEM': return <HardDrive className="text-rose-700" size={16} />;
      default: return <History className="text-slate-400" size={16} />;
    }
  };

  const formatDetails = (details) => {
    if (!details) return 'Routine operational procedure.';
    try {
      const parsed = JSON.parse(details);
      if (typeof parsed === 'object') {
        // Prioritize explicit reason if it exists (e.g. rejection reason)
        if (parsed.reason) return parsed.reason;
        
        return Object.entries(parsed)
          .map(([key, val]) => `${key}: ${val}`)
          .join(' | ');
      }
    } catch (e) {}
    return details;
  };

  const exportToCSV = () => {
    try {
      const headers = ['Action', 'Entity', 'Entity ID', 'Operator', 'Reason', 'Timestamp'];
      const rows = filteredLogs.map(log => [
        log.action,
        log.entity,
        log.entityId || 'SYSTEM',
        log.userId?.name || 'SYSTEM',
        formatDetails(log.details).replace(/,/g, ';'),
        new Date(log.createdAt).toLocaleString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `nexus_audit_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Audit log exported successfully');
    } catch (err) {
      toast.error('Failed to export logs');
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Filter Bar */}
      <div className="glass p-6 flex flex-wrap gap-6 items-end border-white/5 shadow-2xl">
        <div className="space-y-1.5 flex-1 min-w-[180px]">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Event Type</label>
          <select 
            className="nexus-input py-2.5" 
            value={filters.action}
            onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))}
          >
            <option value="">All Events</option>
            <option value="UPLOAD">Upload</option>
            <option value="APPROVE">Approval</option>
            <option value="REJECT">Rejection</option>
            <option value="SCHEDULE">Scheduling</option>
            <option value="TERMINATE">Termination</option>
            <option value="REGISTER">Terminal Registration</option>
            <option value="UPDATE">System Update</option>
            <option value="RESET">Terminal Reset</option>
            <option value="CREATE_TICKER">Ticker Created</option>
            <option value="CREATE_LAYOUT">Layout Created</option>
            <option value="WIPE_SYSTEM">System Purge</option>
          </select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[180px]">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-1">From Date</label>
          <input 
            type="date" 
            className="nexus-input py-2.5"
            value={filters.startDate}
            onChange={(e) => setFilters(p => ({ ...p, startDate: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-[180px]">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-1">To Date</label>
          <input 
            type="date" 
            className="nexus-input py-2.5"
            value={filters.endDate}
            onChange={(e) => setFilters(p => ({ ...p, endDate: e.target.value }))}
          />
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => setFilters({ action: '', entity: '', startDate: '', endDate: '' })}
                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-black transition-all"
            >
                Reset
            </button>
            <button 
                onClick={exportToCSV}
                disabled={filteredLogs.length === 0}
                className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-sky-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-sky-600/20"
            >
                <Download size={14}/> Export CSV
            </button>
        </div>
      </div>

      {/* Timeline Table */}
      <div className="glass overflow-hidden border-white/5 shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
              <th className="py-5 px-8">Timeline Event</th>
              <th className="py-5 px-8">Operator Name</th>
              <th className="py-5 px-8">Reason</th>
              <th className="py-5 px-8 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="4" className="py-20 text-center text-slate-500 font-black uppercase tracking-[4px] animate-pulse">Synchronizing Logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="4" className="py-20 text-center text-slate-500 font-black uppercase tracking-[4px]">No audit records found</td></tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id || log._id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 group-hover:border-white/20 transition-all shadow-inner">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <p className="font-black text-xs text-text uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mt-1">
                          {log.entity}: {log.entityId ? log.entityId.slice(-8) : 'SYSTEM'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                        <User size={14} className="text-sky-400" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter leading-none">{log.userId?.name || 'Automated System'}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{log.userId?.role || 'SYSTEM'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <p className="text-[10px] font-medium text-slate-400 max-w-md italic">
                      {formatDetails(log.details)}
                    </p>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <p className="text-[11px] font-black text-slate-300 tabular-nums uppercase leading-none">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest">
                      {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditHistory;
