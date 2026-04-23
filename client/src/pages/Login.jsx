import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Mail, Lock, ArrowRight, ShieldCheck, Activity, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('admin@corp.in');
  const [password, setPassword] = useState('admin123');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/request-reset`, { email: resetEmail });
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
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
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className={`relative w-full max-w-[440px] ${shaking ? 'animate-shake' : 'animate-fade-in'}`}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md shadow-2xl">
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] uppercase tracking-[4px] font-black text-white/80">Digital Screen Intelligence</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-3">Welcome</h1>
        </div>

        <div className="glass p-10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] border-white/10 relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
          
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-slate-500 font-black ml-1">User ID</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-sky-400 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="nexus-input pl-12 bg-black/40 hover:bg-black/60 transition-colors" 
                  placeholder="name@corp.in"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-slate-500 font-black ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-sky-400 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="nexus-input pl-12 bg-black/40 hover:bg-black/60 transition-colors" 
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="nexus-btn-primary w-full flex items-center justify-center gap-3 py-4 group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              <span className="tracking-[2px] font-black uppercase text-sm">
                {loading ? 'Decrypting...' : 'Log In'}
              </span>
              {!loading && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowResetModal(true)}
              className="text-[10px] uppercase tracking-[2px] text-slate-500 font-black hover:text-sky-400 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {showResetModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="glass max-w-md w-full p-10 space-y-6 animate-fade-in relative">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Password Reset</h3>
                <button onClick={() => setShowResetModal(false)}><XCircle className="text-slate-500 hover:text-white" /></button>
              </div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Enter your email to request a manual password reset by the system administrator.</p>
              
              <form onSubmit={handleResetRequest} className="space-y-4">
                <input 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="nexus-input" 
                  placeholder="admin@corp.in"
                  required
                />
                <button type="submit" disabled={resetLoading} className="nexus-btn-primary w-full py-4 uppercase font-black tracking-widest text-xs">
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
