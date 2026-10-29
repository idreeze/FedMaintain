import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { digitalTwinService } from '../services/digitalTwinService';
import { DigitalTwinSummary, MachineOperatingState } from '../types/digitalTwin';
import {
  Binary,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  WifiOff,
  ArrowRight,
  ShieldCheck,
  Clock,
  Search,
} from 'lucide-react';

export const DigitalTwinsListPage: React.FC = () => {
  const [twins, setTwins] = useState<DigitalTwinSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');

  const fetchTwins = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await digitalTwinService.getDigitalTwins();
      setTwins(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load Digital Twins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTwins();
    const interval = setInterval(() => {
      fetchTwins(true);
    }, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [fetchTwins]);

  const getStateBadge = (state: MachineOperatingState) => {
    switch (state) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            NORMAL
          </span>
        );
      case 'DEGRADING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
            DEGRADING
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
            WARNING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 animate-pulse">
            <AlertOctagon className="w-3 h-3 mr-1 text-orange-400" />
            CRITICAL
          </span>
        );
      case 'FAILURE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertOctagon className="w-3 h-3 mr-1 text-red-400" />
            FAILURE
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Wrench className="w-3 h-3 mr-1 text-purple-400" />
            MAINTENANCE
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <WifiOff className="w-3 h-3 mr-1 text-slate-400" />
            OFFLINE
          </span>
        );
    }
  };

  const filteredTwins = twins.filter((t) => {
    const matchesSearch =
      t.twinCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.machineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.machineType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState =
      selectedStateFilter === 'ALL' || t.operatingState === selectedStateFilter;

    return matchesSearch && matchesState;
  });

  const normalCount = twins.filter((t) => t.operatingState === 'NORMAL').length;
  const warningCount = twins.filter((t) => t.operatingState === 'WARNING' || t.operatingState === 'DEGRADING').length;
  const criticalCount = twins.filter((t) => t.operatingState === 'CRITICAL' || t.operatingState === 'FAILURE').length;
  const offlineCount = twins.filter((t) => t.operatingState === 'OFFLINE' || t.operatingState === 'MAINTENANCE').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Digital Twin Fleet Cockpit
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Phase 9
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Operational state representations synchronized from telemetry, ML features, RUL forecasts, and maintenance alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchTwins(true)}
            disabled={refreshing}
            className="inline-flex items-center px-3.5 py-2 border border-slate-700 hover:border-slate-600 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            {refreshing ? 'Syncing...' : 'Sync Fleet'}
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Twins</span>
            <div className="text-2xl font-bold text-white mt-1">{twins.length}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Binary className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Normal / Healthy</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{normalCount}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Degrading / Warning</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{warningCount}</div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical / Maint.</span>
            <div className="text-2xl font-bold text-orange-400 mt-1">{criticalCount + offlineCount}</div>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400 border border-orange-500/20">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search twins, machines, types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'NORMAL', 'DEGRADING', 'WARNING', 'CRITICAL', 'MAINTENANCE', 'OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStateFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStateFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Twin Cards Grid */}
      {loading && twins.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-3 text-cyan-400" />
          <span>Synchronizing Digital Twins...</span>
        </div>
      ) : filteredTwins.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800/80 rounded-2xl">
          <Binary className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Digital Twins Found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or state filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTwins.map((twin) => {
            const healthVal = twin.healthScore !== null ? Math.round(twin.healthScore) : null;
            return (
              <div
                key={twin.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group shadow-lg shadow-black/20"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">
                        {twin.twinCode}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mt-0.5">
                        {twin.machineName}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        {twin.machineCode} • {twin.machineType}
                      </span>
                    </div>
                    {getStateBadge(twin.operatingState)}
                  </div>

                  {/* Health Gauge & RUL */}
                  <div className="mt-5 grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        Health Score
                      </div>
                      <div className="mt-1 text-xl font-bold text-white flex items-baseline gap-1">
                        {healthVal !== null ? `${healthVal}%` : 'N/A'}
                        {healthVal !== null && (
                          <span
                            className={`text-xs font-normal ${
                              healthVal >= 80 ? 'text-emerald-400' : healthVal >= 60 ? 'text-amber-400' : 'text-red-400'
                            }`}
                          >
                            {healthVal >= 80 ? 'Good' : healthVal >= 60 ? 'Degraded' : 'Risk'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Est. RUL
                      </div>
                      <div className="mt-1 text-xl font-bold text-white flex items-baseline gap-1">
                        {twin.rulHours !== null ? `${twin.rulHours.toFixed(1)}h` : 'N/A'}
                        {twin.rulHours !== null && (
                          <span className="text-xs font-normal text-slate-400">
                            ({(twin.rulHours / 24).toFixed(0)}d)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operational Details */}
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80" />
                        Active Alerts
                      </span>
                      <span
                        className={`font-semibold ${
                          twin.openAlertsCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {twin.openAlertsCount} Open
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400/80" />
                        Twin Status
                      </span>
                      <span className="font-mono text-slate-300">{twin.status}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Synced: {twin.lastSyncTime ? new Date(twin.lastSyncTime).toLocaleTimeString() : 'Pending'}
                  </span>

                  <Link
                    to={`/digital-twins/${twin.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-cyan-600/20 gap-1"
                  >
                    Open Cockpit
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default DigitalTwinsListPage;
