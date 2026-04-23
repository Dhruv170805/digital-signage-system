import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, CheckSquare, Calendar, Type, LayoutGrid, Users, 
  Tv, MonitorPlay, LogOut, Upload, FileText, Activity, History 
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
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-[var(--border)] flex flex-col shrink-0 shadow-xl z-20">
        <div className="p-8 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="mono text-[var(--text)] tracking-[1px] text-xs font-black uppercase">Digital Signage</span>
          </div>
          <p className="text-[var(--text-dim)] text-[10px] font-black uppercase tracking-[2px] pl-11">
            {role === 'admin' ? 'Root Screen' : 'User Station'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]' 
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-slate-50 border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]'}`} />
              <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)] bg-slate-50/50">
          <div className="mb-4 px-4">
            <p className="text-[var(--text-faint)] text-[10px] mono uppercase tracking-widest mb-1">Personnel</p>
            <p className="text-[var(--text)] text-sm font-black truncate uppercase">{userName}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all mono text-[10px] font-black uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Shell;
