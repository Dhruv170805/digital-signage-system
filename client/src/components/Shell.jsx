import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { 
  BarChart3, CheckSquare, Calendar, Type, LayoutGrid, Users, 
  Tv, MonitorPlay, LogOut, Upload, FileText, Activity, History, Shield, User, Settings, Radio
} from 'lucide-react';

const Shell = ({ children, role, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);

  const userName = user?.name || 'Authorized User';

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'approve', label: 'Approvals', icon: CheckSquare },
    { id: 'schedule', label: 'Schedules', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'ticker', label: 'Tickers', icon: Type },
    { id: 'audio', label: 'Audio', icon: Radio },
    { id: 'screens', label: 'Screens', icon: Tv },
    { id: 'history', label: 'History', icon: History },
    { id: 'live', label: 'Live View', icon: Tv },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Idle Mode', icon: MonitorPlay },
    { id: 'system', label: 'Settings', icon: Settings },
  ];

  const userMenu = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'history', label: 'History', icon: History },
    { id: 'live', label: 'Live View', icon: Tv },
  ];

  const menu = role === 'admin' ? adminMenu : userMenu;

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      logoutStore();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans selection:bg-accent selection:text-white text-text p-4 gap-4">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none bg-bg">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <aside className="w-72 bg-white/90 backdrop-blur-3xl border border-slate-200 flex flex-col shrink-0 z-30 rounded-[40px] shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-accent/20 relative group">
              <Activity className="text-white w-6 h-6 animate-pulse" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-text uppercase leading-none">Nexus</h1>
              <p className="text-[10px] font-bold text-accent tracking-[4px] uppercase mt-1">Control</p>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-slate-100/50 border border-slate-200/60 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-live ${role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {role === 'admin' ? 'Administrator' : 'Operator'}
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
                    ? 'bg-slate-100 text-text shadow-sm border border-slate-200/60' 
                    : 'text-slate-400 hover:text-text hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                )}
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-accent scale-110' : 'group-hover:scale-110 group-hover:text-slate-600'}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 m-4 mt-0 rounded-[32px] bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
              {role === 'admin' ? <Shield size={18} className="text-blue-500" /> : <User size={18} className="text-emerald-500" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-0.5">Account</p>
              <p className="text-xs font-black text-text truncate uppercase">{userName}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-widest border border-rose-500/20"
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-hidden relative rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-200 bg-white/90 backdrop-blur-3xl">
        {children}
      </main>
    </div>
  );
};

export default Shell;
