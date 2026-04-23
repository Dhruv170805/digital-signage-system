import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Activity, XCircle, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6 relative overflow-hidden font-sans bg-drift text-white">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className={`relative w-full max-w-[480px] ${shaking ? 'animate-shake' : 'animate-fade-in'}`}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-8 px-6 py-2.5 bg-white/10 border border-white/20 rounded-full backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 animate-drift" />
            <Activity className="w-4 h-4 text-blue-400 relative z-10" />
            <span className="text-[10px] uppercase tracking-[6px] font-black text-white relative z-10">Nexus Operations</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">Identity</h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Secure Terminal Access Required</p>
        </div>

        <div className="glass p-12 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] border-white/10 relative group rounded-[40px] bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[40px]" />
          
          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[3px] text-white/60 font-black ml-1">Authentication ID</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="nexus-input pl-14 h-16 bg-white/[0.05] hover:bg-white/[0.08] transition-all border-white/10 focus:border-blue-500/50 rounded-2xl text-white placeholder:text-white/20" 
                  placeholder=" personnel@nexus.sys"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[3px] text-white/60 font-black ml-1">Security Key</label>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="nexus-input pl-14 h-16 bg-white/[0.05] hover:bg-white/[0.08] transition-all border-white/10 focus:border-blue-500/50 rounded-2xl text-white placeholder:text-white/20" 
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

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => setShowResetModal(true)}
              className="text-[10px] uppercase tracking-[3px] text-white/40 font-black hover:text-white transition-colors"
            >
              Request Access Reset
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700">
           <ShieldCheck size={20} className="text-white" />
           <Activity size={20} className="text-white" />
           <Lock size={20} className="text-white" />
        </div>

        {showResetModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="glass max-w-md w-full p-12 space-y-8 animate-fade-in relative rounded-[40px] border-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Access Recovery</h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[4px] mt-2">Protocol Override</p>
                </div>
                <button onClick={() => setShowResetModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all">
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed">Administrator verification is required for password recovery. Enter your registered email to transmit a clearance request.</p>
              
              <form onSubmit={handleResetRequest} className="space-y-6">
                <input 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="nexus-input h-16 rounded-2xl border-white/10" 
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
