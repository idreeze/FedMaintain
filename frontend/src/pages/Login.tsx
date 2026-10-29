import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, Loader2, Disc3 } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email address and security passkey.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 401) {
        setError('Invalid credentials. Please verify your email and password.');
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        setError('Unable to reach FedMaintain authentication service. Ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setTestAccount = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background circuit ambient effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="max-w-md w-full relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-500/20 mb-4 text-white border border-cyan-400/30">
            <Disc3 className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">FedMaintain</h1>
          <p className="text-sm text-cyan-400 font-mono font-medium tracking-wide mt-1">
            PREDICTIVE MAINTENANCE PLATFORM
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Federated Learning &amp; Digital Twin System for Semiconductor Manufacturing
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800/80">
            <h2 className="text-base font-semibold text-slate-200">Sign in to Operations Console</h2>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              TLS ENCRYPTED
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                OPERATOR / ENGINEER EMAIL
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@fedmaintain.com"
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all font-sans outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                PASSKEY
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-600 transition-all font-sans outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 p-0.5 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Development Quick Role Test Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5">
              Initial Development Accounts:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTestAccount('admin@fedmaintain.com', 'Admin@123')}
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-left transition-colors"
              >
                <span className="block font-bold text-[11px] text-purple-400">ADMIN</span>
                <span className="text-[9px] text-slate-400 font-mono truncate block">admin@fedmaintain.com</span>
              </button>
              <button
                type="button"
                onClick={() => setTestAccount('engineer@fedmaintain.com', 'Engineer@123')}
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-left transition-colors"
              >
                <span className="block font-bold text-[11px] text-cyan-400">ENGINEER</span>
                <span className="text-[9px] text-slate-400 font-mono truncate block">engineer@fedmaintain.com</span>
              </button>
              <button
                type="button"
                onClick={() => setTestAccount('operator@fedmaintain.com', 'Operator@123')}
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-left transition-colors"
              >
                <span className="block font-bold text-[11px] text-emerald-400">OPERATOR</span>
                <span className="text-[9px] text-slate-400 font-mono truncate block">operator@fedmaintain.com</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 font-mono">
          FedMaintain © 2026 · Semiconductor Predictive Maintenance Platform
        </p>
      </div>
    </div>
  );
};
