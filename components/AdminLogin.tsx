import React, { useState } from 'react';

interface AuthData {
  token: string;
  role: string;
  userId: string;
  username: string;
  plan: string;
  credits: number;
  maxCredits: number;
}

const AdminLogin: React.FC<{ onLogin: (authData: AuthData) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      // Store complete auth data in localStorage
      const authData: AuthData = {
        token: data.token,
        role: data.role,
        userId: data.userId,
        username: data.username,
        plan: data.plan,
        credits: data.credits,
        maxCredits: data.maxCredits
      };
      localStorage.setItem('brandpilot_auth', JSON.stringify(authData));
      
      // Store preference
      if (rememberMe) {
        localStorage.setItem('brandpilot_remember', 'true');
      } else {
        localStorage.removeItem('brandpilot_remember');
      }
      
      onLogin(authData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 text-center">Admin Login</h2>
        <div className="mb-6 flex items-center">
          <input 
            type="checkbox" 
            id="rememberMe" 
            checked={rememberMe} 
            onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 cursor-pointer">
            Keep me logged in (7 days)
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2 text-slate-700">Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-slate-700">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
        </div>
        {error && <div className="mb-4 text-rose-600 text-sm font-bold text-center">{error}</div>}
        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 transition-all" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
