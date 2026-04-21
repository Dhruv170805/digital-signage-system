import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, CheckSquare, Calendar, Type, LayoutGrid, Users, 
  Tv, MonitorPlay, LogOut, Upload, FileText, Activity, History 
} from 'lucide-react';

const Shell = ({ children, role, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const userName = JSON.parse(localStorage.getItem('user'))?.name || 'User';

  const adminMenu = [
    { id: 'dashboard', label: 'Command Core', icon: LayoutGrid },
    { id: 'approve', label: 'Moderation', icon: CheckSquare },
    { id: 'schedule', label: 'Mission Dispatch', icon: Calendar },
    { id: 'templates', label: 'Architecture', icon: FileText },
    { id: 'ticker', label: 'Broadcast', icon: Type },
    { id: 'screens', label: 'Terminal Fleet', icon: Tv },
    { id: 'users', label: 'Personnel', icon: Users },
    { id: 'settings', label: 'Global Systems', icon: MonitorPlay },
  ];

  const userMenu = [
    { id: 'upload', label: 'Transmit Asset', icon: Upload },
    { id: 'myfiles', label: 'Registry History', icon: History },
    { id: 'live', label: 'Feed Preview', icon: MonitorPlay },
  ];

  const menu = role === 'admin' ? adminMenu : userMenu;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col shrink-0">
        <div className="p-8 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
              <Activity className="text-[var(--bg)] w-5 h-5" />
            </div>
            <span className="mono text-[var(--accent)] tracking-[3px] text-xs font-bold">NEXUS OS</span>
          </div>
          <p className="text-[var(--text-dim)] text-xs font-medium uppercase tracking-widest pl-11">
            {role === 'admin' ? 'HQ Control' : 'Operator'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]' 
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--card)] border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]'}`} />
              <span className={`text-sm font-medium ${activeTab === item.id ? '' : ''}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="mb-4 px-4">
            <p className="text-[var(--text-faint)] text-[10px] mono uppercase tracking-widest mb-1">Logged in as</p>
            <p className="text-[var(--text)] text-sm font-semibold truncate">{userName}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--red)]/70 hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-all mono text-xs uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Shell;
