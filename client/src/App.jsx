import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import DisplayScreen from './pages/DisplayScreen';
import useAuthStore from './store/useAuthStore';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  if (!token) return <Navigate to="/login" />;
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} />;
  }
  return children;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { setToken, setUser, logout } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        setToken(res.data.accessToken);
        
        // We need user details to properly restore state, so decoding the token or fetching user is needed.
        // Let's decode the JWT token from the access token.
        const base64Url = res.data.accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        setUser({ id: payload.id, role: payload.role, status: payload.status });
      } catch (err) {
        logout();
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [setToken, setUser, logout]);

  if (isInitializing) {
    return <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center"><div className="animate-pulse">Initializing Nexus Security...</div></div>;
  }

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'nexus-toast',
          duration: 4000,
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '12px'
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/user/*" 
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<DisplayScreen />} />
        <Route path="/display" element={<DisplayScreen />} />
        
        {/* Redirect empty paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
