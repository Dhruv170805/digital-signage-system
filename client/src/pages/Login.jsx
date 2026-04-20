import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('admin@corp.in');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const role = response.data.user.role;
      navigate(role === 'admin' ? '/admin' : '/user');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Cinematic Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[100px]" />
      
      <div className={`relative w-full max-w-md ${shaking ? 'animate-shake' : 'animate-fade-in'}`}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <span className="mono text-[var(--accent)] text-[10px] uppercase tracking-[4px] font-bold">NEXUS SIGNAGE OS</span>
          </div>
          <h1 className="text-4xl font-light text-[var(--text)] tracking-tight mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>Welcome Back</h1>
          <p className="text-[var(--text-dim)] text-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Enter your credentials to access HQ Control
          </p>
        </div>

        <div className="glass p-10 animate-fade-in shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mono text-[10px] uppercase tracking-[2px] text-[var(--text-dim)] mb-2 block font-bold">Identity</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="nexus-input pl-12" 
                  placeholder="name@corp.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mono text-[10px] uppercase tracking-[2px] text-[var(--text-dim)] mb-2 block font-bold">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="nexus-input pl-12" 
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-[var(--red)] text-xs mono animate-fade-in font-medium">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="nexus-btn-primary w-full flex items-center justify-center gap-2 group"
            >
              {loading ? 'AUTHENTICATING...' : 'LOGIN TO OS'}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[var(--border)] text-center">
            <p className="text-[var(--text-faint)] text-[10px] mono uppercase tracking-wider">
              Protected by Nexus Security Protocol v4.0
            </p>
          </div>
        </div>

        {/* Tip */}
        <div className="text-center mt-8 animate-fade-in opacity-50" style={{ animationDelay: '0.6s' }}>
          <p className="text-[var(--text-dim)] text-[10px] mono uppercase tracking-widest">
            {email.includes('admin') ? 'ADMIN ACCESS DETECTED' : 'STANDARD OPERATOR MODE'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
