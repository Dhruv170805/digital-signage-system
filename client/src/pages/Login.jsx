import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5005/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Signage Admin</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your displays</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition transform hover:scale-[1.02]">
            Login
          </button>
        </form>

        <div className="mt-6 border-t pt-6">
          <p className="text-xs text-center text-gray-500 mb-3 font-medium uppercase tracking-wider">Development Tools</p>
          <button 
            onClick={async () => {
              try {
                await axios.post('http://localhost:5005/api/auth/setup-admin', {
                  email: 'admin@test.com',
                  password: 'password123'
                });
                alert('Default Admin Created!\nEmail: admin@test.com\nPass: password123');
              } catch (err) {
                alert('Failed. Is your Database connected? Check .env file.');
              }
            }}
            className="w-full bg-gray-100 text-gray-600 text-sm font-bold py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Create Default Admin Account
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          Make sure your MSSQL server is running!
        </div>
      </div>
    </div>
  );
};

export default Login;
