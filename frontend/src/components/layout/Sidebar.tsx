import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Factory,
  Cpu,
  Activity,
  LineChart,
  Binary,
  Network,
  Wrench,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  Disc3,
  Sliders,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  phase: string;
  adminOnly?: boolean;
  engineerAndAbove?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, phase: 'Phases 1-4' },
  { name: 'Plants', path: '/plants', icon: Factory, phase: 'Phase 3' },
  { name: 'Machines', path: '/machines', icon: Cpu, phase: 'Phase 3' },
  { name: 'Live Telemetry', path: '/machines/1/monitoring', icon: Activity, phase: 'Phase 4' },
  { name: 'Features', path: '/machines/1/features', icon: Sliders, phase: 'Phase 5' },
  { name: 'RUL Predictions', path: '/machines/1/predictions', icon: LineChart, phase: 'Phase 6' },
  { name: 'Health & XAI', path: '/machines/1/health', icon: ShieldCheck, phase: 'Phase 7' },
  { name: 'Alerts & Workflows', path: '/alerts', icon: Wrench, phase: 'Phase 7' },
  { name: 'Federated Learning', path: '/federated', icon: Network, phase: 'Phase 8', engineerAndAbove: true },
  { name: 'Digital Twins', path: '/digital-twins', icon: Binary, phase: 'Phase 9' },
  { name: 'Fab Analytics', path: '/analytics', icon: BarChart3, phase: 'Phase 10', engineerAndAbove: true },
  { name: 'User Management', path: '/users', icon: Users, phase: 'Admin', adminOnly: true },
  { name: 'Settings', path: '/settings', icon: Settings, phase: 'Admin', adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) {
      return role === 'ADMIN';
    }
    if (item.engineerAndAbove) {
      return role === 'ADMIN' || role === 'ENGINEER';
    }
    // Operator sees Dashboard, Machines, Sensors, Predictions, Digital Twin, Maintenance
    return true;
  });

  return (
    <aside className="w-64 bg-[#0d1424] border-r border-slate-800 flex flex-col shrink-0">
      {/* Brand & Wafer Fab Badge */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Disc3 className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              FedMaintain
            </h1>
            <p className="text-[11px] font-mono text-cyan-400 tracking-wider">FAB PREDICTIVE OS</p>
          </div>
        </div>
      </div>

      {/* Role Context Pill */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Active Policy</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
            <ShieldCheck className="w-3 h-3" />
            {role || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 transition-colors group-hover:text-cyan-400" />
                <span>{item.name}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                {item.phase}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Version Footnote */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span>Semiconductor v1.0</span>
        <span className="text-cyan-400">Phases 1-8 Complete</span>
      </div>
    </aside>
  );
};
