import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { healthApi, HealthCheckResult, DbHealthResult } from '../api/healthApi';
import { telemetryService } from '../services/telemetryService';
import { assetService } from '../services/assetService';
import { DashboardStats } from '../types/telemetry';
import { Machine } from '../types/assets';
import api from '../services/api';
import {
  Server,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ShieldCheck,
  Cpu,
  Layers,
  Radio,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TestResult {
  endpoint: string;
  status: number | null;
  message: string;
  success: boolean | null;
  timestamp: string;
}

const MOCK_TELEMETRY = [
  { time: '00:00', pressure: 44.2, vibration: 1.4, temperature: 51.1 },
  { time: '04:00', pressure: 44.8, vibration: 1.5, temperature: 52.4 },
  { time: '08:00', pressure: 45.1, vibration: 1.6, temperature: 53.0 },
  { time: '12:00', pressure: 44.9, vibration: 1.5, temperature: 52.6 },
  { time: '16:00', pressure: 46.2, vibration: 1.8, temperature: 54.2 },
  { time: '20:00', pressure: 45.0, vibration: 1.6, temperature: 52.9 },
  { time: '24:00', pressure: 44.6, vibration: 1.5, temperature: 52.2 },
];

export const Dashboard: React.FC = () => {
  const { user, role } = useAuth();

  const [backendHealth, setBackendHealth] = useState<HealthCheckResult>({
    isConnected: false,
    latencyMs: 0,
  });
  const [dbHealth, setDbHealth] = useState<DbHealthResult>({
    isConnected: false,
    status: 'Checking...',
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentMachines, setRecentMachines] = useState<Machine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');
  const [autoPoll, setAutoPoll] = useState(true);

  // Security endpoint testing state
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const runHealthAndStatsChecks = async () => {
    setRefreshing(true);
    try {
      const [bHealth, dHealth, stats, machinesRes] = await Promise.all([
        healthApi.checkBackendHealth(),
        healthApi.checkDatabaseHealth(),
        telemetryService.getDashboardStats().catch(() => null),
        assetService.getMachines({ size: 5, sortBy: 'machineCode', direction: 'asc' }).catch(() => null),
      ]);
      setBackendHealth(bHealth);
      setDbHealth(dHealth);
      if (stats) setDashboardStats(stats);
      if (machinesRes) setRecentMachines(machinesRes.content);
      setLastCheck(new Date().toLocaleTimeString());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    runHealthAndStatsChecks();
    if (!autoPoll) return;
    const interval = setInterval(runHealthAndStatsChecks, 6000);
    return () => clearInterval(interval);
  }, [autoPoll]);

  const testSecurityEndpoint = async (endpoint: string) => {
    setTestingEndpoint(endpoint);
    try {
      const response = await api.get(endpoint);
      setTestResult({
        endpoint,
        status: response.status,
        message: response.data?.message || 'Access granted',
        success: true,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      const status = err.response?.status || 500;
      const msg =
        err.response?.data?.message ||
        (status === 403
          ? 'Access Forbidden (403): Role has insufficient authority'
          : err.message || 'Request failed');
      setTestResult({
        endpoint,
        status,
        message: msg,
        success: false,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero / Platform Overview Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#131d33] to-[#0c182b] border border-slate-800 p-6 lg:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
                PHASES 1 - 4 OPERATIONAL
              </span>
              <span className="text-slate-400 text-xs font-mono">
                TELEMETRY &amp; ASSET DIGITAL TWIN
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
              FedMaintain
            </h1>
            <h2 className="text-base lg:text-lg font-semibold text-cyan-400 mt-1">
              Industrial Asset Hierarchy &amp; In-Situ Telemetry · Welcome, {user?.name || 'Engineer'}
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mt-1.5 leading-relaxed">
              Predictive Maintenance for Semiconductor Manufacturing. Providing plant asset hierarchies, high-frequency TimescaleDB hypertable ingestion, and real-time equipment telemetry pipelines.
            </p>
          </div>

          {/* Quick Refresh Toolbar */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={runHealthAndStatsChecks}
                disabled={refreshing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Probing...' : 'Refresh Status'}</span>
              </button>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 font-mono cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPoll}
                  onChange={(e) => setAutoPoll(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Auto (6s)</span>
              </label>
            </div>
            {lastCheck && (
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last verified: {lastCheck}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Asset & Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/plants"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Fabs</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900">
            {dashboardStats?.totalPlants ?? '--'}
          </div>
          <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">
            {dashboardStats?.totalAreas ?? '--'} Production Bays →
          </span>
        </Link>

        <Link
          to="/machines"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cleanroom Tools</span>
            <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900">
            {dashboardStats?.totalMachines ?? '--'}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {dashboardStats?.activeMachines ?? '--'} Operational Tools
          </div>
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Industrial Sensors</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900">
            {dashboardStats?.totalSensors ?? '--'}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {dashboardStats?.normalSensors ?? '--'} Normal • {dashboardStats?.warningSensors ?? 0} Warn
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telemetry Engine</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-black text-gray-900">
            TimescaleDB
          </div>
          <span className="text-xs text-purple-600 font-mono mt-1 inline-block">
            MQTT 1883 • Hypertable
          </span>
        </div>
      </div>

      {/* Cleanroom Equipment Quick Access Fleet */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Semiconductor Machine Fleet Overview</h3>
            <p className="text-xs text-gray-500">Real-time status of critical cleanroom processing equipment</p>
          </div>
          <Link to="/machines" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All Tools →
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {recentMachines.map((m) => (
            <div key={m.id} className="p-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm font-bold text-indigo-600">{m.machineCode}</span>
                  <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      m.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : m.status === 'MAINTENANCE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {m.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      m.criticality === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : m.criticality === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {m.criticality}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {m.plantCode} • {m.areaName} • {m.manufacturer || 'Applied Materials'}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Link
                  to={`/machines/${m.id}/monitoring`}
                  className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                  Live Telemetry
                </Link>
                <Link
                  to={`/machines/${m.id}`}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Status Cards: Backend & Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backend Status Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  backendHealth.isConnected
                    ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-400'
                    : 'bg-rose-950/50 border-rose-800/80 text-rose-400'
                }`}
              >
                <Server className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Backend Status
                </p>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {backendHealth.isConnected ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> Connected
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-5 h-5" /> Disconnected
                    </span>
                  )}
                </h3>
              </div>
            </div>
            <span
              className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
                backendHealth.isConnected
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              {backendHealth.latencyMs}ms latency
            </span>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">SERVICE</span>
              <span className="text-slate-200 font-medium">
                {backendHealth.data?.service || 'FedMaintain Backend'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">VERSION</span>
              <span className="text-slate-200 font-medium">
                {backendHealth.data?.version || '1.0.0'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ENDPOINT</span>
              <span className="text-cyan-400 font-mono">GET /api/health</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">FRAMEWORK</span>
              <span className="text-slate-200">Spring Boot 3.3 · Java 21</span>
            </div>
          </div>
        </div>

        {/* Database Status Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  dbHealth.isConnected
                    ? 'bg-cyan-950/50 border-cyan-800/80 text-cyan-400'
                    : 'bg-rose-950/50 border-rose-800/80 text-rose-400'
                }`}
              >
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Database &amp; Telemetry Store
                </p>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {dbHealth.isConnected ? (
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> Connected
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-5 h-5" /> Disconnected
                    </span>
                  )}
                </h3>
              </div>
            </div>
            <span
              className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
                dbHealth.isConnected
                  ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              PostgreSQL 16
            </span>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">TIME-SERIES HYPERTABLE</span>
              <span className="text-slate-200 font-medium">sensor_readings</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">HEALTH PROBE</span>
              <span className="text-cyan-400 font-mono">/actuator/health</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ASSET HIERARCHY</span>
              <span className="text-slate-200">Plant → Area → Machine</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">TELEMETRY PIPELINE</span>
              <span className="text-emerald-400">Paho MQTT + TimescaleDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Layer & Role-Based Authorization Verification Panel */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Role-Based Authorization Probe (Live Security Tests)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify backend Spring Security authorization directly with your active JWT token.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Active Role:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-xs font-bold">
              {role}
            </span>
          </div>
        </div>

        {/* Test Endpoints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Admin Endpoint */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 font-mono">ROLE_ADMIN</span>
                <span className="text-[10px] font-mono text-slate-400">Strict</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">GET /api/test/admin</p>
              <p className="text-[11px] text-slate-400 mt-1">Requires ADMIN role only.</p>
            </div>
            <button
              onClick={() => testSecurityEndpoint('/api/test/admin')}
              disabled={Boolean(testingEndpoint)}
              className="mt-4 w-full py-1.5 px-3 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Play className="w-3 h-3" /> Test Admin API
            </button>
          </div>

          {/* Engineer Endpoint */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-400 font-mono">ROLE_ENGINEER</span>
                <span className="text-[10px] font-mono text-slate-400">Admin + Engineer</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">GET /api/test/engineer</p>
              <p className="text-[11px] text-slate-400 mt-1">Requires ADMIN or ENGINEER.</p>
            </div>
            <button
              onClick={() => testSecurityEndpoint('/api/test/engineer')}
              disabled={Boolean(testingEndpoint)}
              className="mt-4 w-full py-1.5 px-3 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Play className="w-3 h-3" /> Test Engineer API
            </button>
          </div>

          {/* Operator Endpoint */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 font-mono">ROLE_OPERATOR</span>
                <span className="text-[10px] font-mono text-slate-400">All Roles</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">GET /api/test/operator</p>
              <p className="text-[11px] text-slate-400 mt-1">Requires ADMIN, ENGINEER, or OPERATOR.</p>
            </div>
            <button
              onClick={() => testSecurityEndpoint('/api/test/operator')}
              disabled={Boolean(testingEndpoint)}
              className="mt-4 w-full py-1.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Play className="w-3 h-3" /> Test Operator API
            </button>
          </div>
        </div>

        {/* Live Test Result Banner */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs font-mono flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/70 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {testResult.endpoint} · Status {testResult.status}
                </span>
                <span className="text-[10px] text-slate-400">{testResult.timestamp}</span>
              </div>
              <p className="mt-1 text-slate-200">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Semiconductor Equipment Telemetry Preview (TimescaleDB Ingestion Ready) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Chemical Mechanical Planarization (CMP) In-Situ Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Live multi-parameter sensor stream stored in TimescaleDB hypertable
            </p>
          </div>
          <Link
            to="/machines/1/monitoring"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-full transition-colors"
          >
            Open CMP-001 Live Monitor →
          </Link>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_TELEMETRY}>
              <defs>
                <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" />
              <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="pressure"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pressureGrad)"
                name="Slurry Delivery (psi)"
              />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#tempGrad)"
                name="Spindle Temp (°C)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
