import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Activity, XCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (token && user) {
      navigate(user.role === 'admin' ? '/admin' : '/user');
    }
  }, [token, user, navigate]);

  const [email, setEmail] = useState('admin@corp.in');
  const [password, setPassword] = useState('admin123');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await api.post(`/api/auth/request-reset`, { email: resetEmail });
      toast.success('Reset request sent to administrator.');
      setShowResetModal(false);
      setResetEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post(`/api/auth/login`, { email, password });
      useAuthStore.getState().setToken(response.data.accessToken);
      useAuthStore.getState().setUser(response.data.user);
      
      toast.success(`Access Granted: Welcome ${response.data.user.name}`);
      
      const role = response.data.user.role;
      navigate(role === 'admin' ? '/admin' : '/user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Access Denied.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6 relative overflow-hidden font-sans bg-drift text-text">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className={`relative w-full max-w-[480px] ${shaking ? 'animate-shake' : 'animate-fade-in'}`}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-8 px-6 py-2.5 bg-slate-100 border border-slate-200/60 rounded-full backdrop-blur-xl shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 animate-drift" />
            <Activity className="w-4 h-4 text-accent relative z-10" />
            <span className="text-[10px] uppercase tracking-[6px] font-black text-text-dim relative z-10">Nexus Operations</span>
          </div>
          <h1 className="text-6xl font-black text-text tracking-tighter mb-4 uppercase">Identity</h1>
          <p className="text-[10px] font-black text-text-dim uppercase tracking-[4px]">Secure Screen Access Required</p>
        </div>

        <div className="glass p-12 shadow-[0_32px_64px_-20px_rgba(15,23,42,0.15)] border-slate-200/60 relative group rounded-[40px] bg-white/70">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[40px]" />
          
          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[3px] text-text-faint font-black ml-1">Authentication ID</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-accent transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="nexus-input pl-14 h-16 bg-slate-50 hover:bg-slate-100/80 transition-all border-slate-200 focus:border-accent/50 rounded-2xl text-text placeholder:text-slate-400" 
                  placeholder=" user@nexus.sys"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[3px] text-text-faint font-black ml-1">Security Key</label>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-accent transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="nexus-input pl-14 h-16 bg-slate-50 hover:bg-slate-100/80 transition-all border-slate-200 focus:border-accent/50 rounded-2xl text-text placeholder:text-slate-400" 
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="nexus-btn-primary w-full h-16 flex items-center justify-center gap-4 group/btn relative overflow-hidden rounded-2xl"
            >
              <span className="tracking-[4px] font-black uppercase text-xs text-white">
                {loading ? 'Verifying...' : 'Initialize Session'}
              </span>
              {!loading && <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform text-white" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <button 
              onClick={() => setShowResetModal(true)}
              className="text-[10px] uppercase tracking-[3px] text-text-faint font-black hover:text-text transition-colors"
            >
              Request Access Reset
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700">
           <ShieldCheck size={20} className="text-text" />
           <Activity size={20} className="text-text" />
           <Lock size={20} className="text-text" />
        </div>

        {showResetModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="glass max-w-md w-full p-12 space-y-8 animate-fade-in relative rounded-[40px] border-slate-200/60 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-text uppercase tracking-tighter leading-none">Access Recovery</h3>
                  <p className="text-[10px] font-bold text-accent uppercase tracking-[4px] mt-2">Protocol Override</p>
                </div>
                <button onClick={() => setShowResetModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-white transition-all">
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-[10px] text-text-dim uppercase font-black tracking-widest leading-relaxed">Administrator verification is required for password recovery. Enter your registered email to transmit a clearance request.</p>
              
              <form onSubmit={handleResetRequest} className="space-y-6">
                <input 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="nexus-input h-16 rounded-2xl border-slate-200" 
                  placeholder="admin@corp.in"
                  required
                />
                <button type="submit" disabled={resetLoading} className="nexus-btn-primary w-full h-16 uppercase font-black tracking-[4px] text-xs rounded-2xl">
                  {resetLoading ? 'Transmitting...' : 'Send Request'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
