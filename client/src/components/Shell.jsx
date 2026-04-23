import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, CheckSquare, Calendar, Type, LayoutGrid, Users, 
  Tv, MonitorPlay, LogOut, Upload, FileText, Activity, History, Shield, User 
} from 'lucide-react';

const Shell = ({ children, role, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  
  const user = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }, []);

  const userName = user?.name || 'Authorized Personnel';

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'approve', label: 'Application', icon: CheckSquare },
    { id: 'schedule', label: 'Broadcast', icon: Calendar },
    { id: 'templates', label: 'Layout', icon: FileText },
    { id: 'ticker', label: 'Ticker', icon: Type },
    { id: 'screens', label: 'Screens', icon: Tv },
    { id: 'audit', label: 'History', icon: History },
    { id: 'live', label: 'Current Screen', icon: Tv },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Idle', icon: MonitorPlay },
  ];

  const userMenu = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'myfiles', label: 'History', icon: History },
    { id: 'live', label: 'Current Screen', icon: Tv },
  ];

  const menu = role === 'admin' ? adminMenu : userMenu;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <aside className="w-72 glass border-r border-white/5 flex flex-col shrink-0 z-30 m-4 rounded-[32px]">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent)] to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-[var(--accent)]/40 relative group">
              <Activity className="text-white w-6 h-6 animate-pulse" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-white uppercase leading-none">Nexus</h1>
              <p className="text-[10px] font-bold text-[var(--accent)] tracking-[4px] uppercase mt-1">Operations</p>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-live ${role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {role === 'admin' ? 'Root Terminal' : 'User Station'}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {menu.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-xl border border-white/10' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--accent)] rounded-r-full shadow-[0_0_15px_var(--accent)]" />
                )}
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-[var(--accent)] scale-110' : 'group-hover:scale-110 group-hover:text-white/80'}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 m-4 mt-0 rounded-[24px] bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
              {role === 'admin' ? <Shield size={18} className="text-blue-400" /> : <User size={18} className="text-emerald-400" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px] mb-0.5">Personnel</p>
              <p className="text-xs font-black text-white truncate uppercase">{userName}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-widest border border-rose-500/20"
          >
            <LogOut size={14} />
            Terminate
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative custom-scrollbar">
        <div className="relative h-full min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Shell;
