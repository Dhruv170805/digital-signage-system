import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Calendar, User, Tv, 
  ArrowUpRight, ArrowDownLeft, AlertTriangle, 
  RotateCcw, ShieldCheck, Download, History
} from 'lucide-react';

const AuditHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/audit?${params.toString()}`);
      setLogs(res.data);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const getActionIcon = (type) => {
    switch (type) {
      case 'APPROVE': return <ShieldCheck className="text-emerald-500" size={16} />;
      case 'REJECT': return <AlertTriangle className="text-rose-500" size={16} />;
      case 'TERMINATE': return <RotateCcw className="text-amber-500" size={16} />;
      case 'SCHEDULE': return <Calendar className="text-sky-500" size={16} />;
      default: return <History className="text-slate-400" size={16} />;
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
            value={filters.actionType}
            onChange={(e) => setFilters(p => ({ ...p, actionType: e.target.value }))}
          >
            <option value="">All Events</option>
            <option value="UPLOAD">Upload</option>
            <option value="APPROVE">Approval</option>
            <option value="REJECT">Rejection</option>
            <option value="SCHEDULE">Scheduling</option>
            <option value="TERMINATE">Termination</option>
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

        <button 
          onClick={() => setFilters({ actionType: '', entityType: '', startDate: '', endDate: '' })}
          className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-black transition-all"
        >
          Reset Filters
        </button>
      </div>

      {/* Timeline Table */}
      <div className="glass overflow-hidden border-white/5 shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
              <th className="py-5 px-8">Timeline Event</th>
              <th className="py-5 px-8">Initiated By</th>
              <th className="py-5 px-8">Reason / Context</th>
              <th className="py-5 px-8 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="4" className="py-20 text-center text-slate-500 font-black uppercase tracking-[4px] animate-pulse">Synchronizing Logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="4" className="py-20 text-center text-slate-500 font-black uppercase tracking-[4px]">No audit records found</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 group-hover:border-white/20 transition-all shadow-inner">
                        {getActionIcon(log.actionType)}
                      </div>
                      <div>
                        <p className="font-black text-xs text-text uppercase tracking-tight">{log.actionType}</p>
                        <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mt-1">
                          {log.entityType}: {log.entityId ? log.entityId.slice(-8) : 'SYSTEM'}
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
                      {log.reason || 'Routine operational procedure.'}
                    </p>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <p className="text-[11px] font-black text-slate-300 tabular-nums uppercase leading-none">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest">
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
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
