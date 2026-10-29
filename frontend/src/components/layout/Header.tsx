import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Radio } from 'lucide-react';
import { healthApi } from '../../api/healthApi';

export const Header: React.FC = () => {
  const { user, role, logout } = useAuth();
  const [time, setTime] = useState<string>('');
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkLiveHealth = async () => {
      const result = await healthApi.checkBackendHealth();
      setBackendUp(result.isConnected);
    };
    checkLiveHealth();
    const healthInterval = setInterval(checkLiveHealth, 8000);
    return () => clearInterval(healthInterval);
  }, []);

  const getRoleBadgeStyle = (userRole?: string) => {
    switch (userRole) {
      case 'ADMIN':
        return 'bg-purple-950/80 border-purple-800/80 text-purple-300';
      case 'ENGINEER':
        return 'bg-cyan-950/80 border-cyan-800/80 text-cyan-300';
      case 'OPERATOR':
        return 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <header className="h-16 bg-[#0d1424] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      {/* Left site context */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                backendUp === true ? 'bg-emerald-400' : backendUp === false ? 'bg-rose-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                backendUp === true ? 'bg-emerald-500' : backendUp === false ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            FAB-01 CLEANROOM · BAY-4
          </span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="text-xs font-mono text-slate-400">{time} UTC</span>
      </div>

      {/* Right controls and User profile */}
      <div className="flex items-center space-x-4">
        {/* User Card */}
        <div className="flex items-center space-x-3 pl-3 pr-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="w-7 h-7 rounded-md bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">{user?.name || 'Authenticated User'}</span>
            <span className="text-[10px] text-slate-400 font-mono leading-tight">{user?.email || ''}</span>
          </div>
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${getRoleBadgeStyle(
              role || ''
            )}`}
          >
            <Shield className="w-2.5 h-2.5" />
            {role || 'USER'}
          </span>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Sign Out of Session"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/60 text-xs font-medium transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
