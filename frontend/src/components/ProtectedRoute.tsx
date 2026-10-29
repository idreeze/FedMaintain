import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import { ShieldAlert, Cpu } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center text-slate-300">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-14 h-14 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <Cpu className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
        </div>
        <p className="text-sm font-mono tracking-wider text-cyan-400/80">AUTHENTICATING SECURE SESSION...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied (403)</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your current role (<span className="text-cyan-400 font-mono font-semibold">{role}</span>) does not have authorization to view this semiconductor manufacturing module.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            Return to Operations Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
