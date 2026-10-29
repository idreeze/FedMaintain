import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { digitalTwinService } from '../services/digitalTwinService';
import {
  DigitalTwinDetail,
  DigitalTwinSensorView,
  DigitalTwinTimelineEvent,
  DigitalTwinHistory,
  MachineOperatingState,
} from '../types/digitalTwin';
import { PageResponse } from '../types/assets';
import {
  RefreshCw,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Zap,
  Sliders,
  Calendar,
  Network,
  HelpCircle,
  Flame,
  Waves,
  Gauge,
} from 'lucide-react';

export const DigitalTwinDashboardPage: React.FC = () => {
  const { id, machineId } = useParams<{ id?: string; machineId?: string }>();

  const [twin, setTwin] = useState<DigitalTwinDetail | null>(null);
  const [sensors, setSensors] = useState<DigitalTwinSensorView[]>([]);
  const [timeline, setTimeline] = useState<DigitalTwinTimelineEvent[]>([]);
  const [history, setHistory] = useState<PageResponse<DigitalTwinHistory> | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sensors' | 'timeline' | 'history'>('sensors');

  const loadTwinData = useCallback(async (manualSync = false) => {
    try {
      if (manualSync) setSyncing(true);
      else setLoading(true);
      setError(null);

      // Fetch detail by twinId or machineId
      let detail: DigitalTwinDetail;
      if (id) {
        detail = await digitalTwinService.getDigitalTwinById(Number(id));
      } else if (machineId) {
        detail = await digitalTwinService.getDigitalTwinByMachineId(Number(machineId));
      } else {
        return;
      }
      setTwin(detail);

      // Fetch sensor view, timeline, history concurrently
      const [sensorsData, timelineData, historyData] = await Promise.all([
        digitalTwinService.getDigitalTwinSensors(detail.id).catch(() => []),
        digitalTwinService.getDigitalTwinTimeline(detail.id).catch(() => []),
        digitalTwinService.getDigitalTwinHistory(detail.id, 0, 20).catch(() => null),
      ]);

      setSensors(sensorsData);
      setTimeline(timelineData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load Digital Twin details');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [id, machineId]);

  useEffect(() => {
    loadTwinData();
    const interval = setInterval(() => {
      loadTwinData(true);
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [loadTwinData]);

  const handleForceSync = async () => {
    if (!twin) return;
    try {
      setSyncing(true);
      await digitalTwinService.syncDigitalTwin(twin.machineId);
      await loadTwinData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync digital twin');
    } finally {
      setSyncing(false);
    }
  };

  const getStateBadge = (state?: MachineOperatingState) => {
    if (!state) return null;
    switch (state) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            NORMAL OPERATION
          </span>
        );
      case 'DEGRADING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
            DEGRADING PERFORMANCE
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            MAINTENANCE WARNING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            CRITICAL HEALTH RISK
          </span>
        );
      case 'FAILURE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
            <AlertOctagon className="w-3.5 h-3.5 mr-1.5 text-red-400" />
            MACHINE FAILURE / SHUTDOWN
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Wrench className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            IN SCHEDULED MAINTENANCE
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/40">
            <WifiOff className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            OFFLINE (TELEMETRY STALE)
          </span>
        );
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TEMPERATURE':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'VIBRATION':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'CURRENT':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'PRESSURE':
        return <Gauge className="w-4 h-4 text-blue-400" />;
      case 'RPM':
        return <Activity className="w-4 h-4 text-indigo-400" />;
      default:
        return <Sliders className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return (
          <span className="inline-flex items-center text-xs font-medium text-amber-400">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Rising
          </span>
        );
      case 'DECREASING':
        return (
          <span className="inline-flex items-center text-xs font-medium text-blue-400">
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            Falling
          </span>
        );
      case 'STABLE':
        return (
          <span className="inline-flex items-center text-xs font-medium text-emerald-400">
            <Minus className="w-3.5 h-3.5 mr-1" />
            Stable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-xs font-medium text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Unknown
          </span>
        );
    }
  };

  if (loading && !twin) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mr-3" />
        <span className="text-lg">Synchronizing Digital Twin Cockpit...</span>
      </div>
    );
  }

  if (error || !twin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Digital Twin Error</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'Twin not found.'}</p>
        <Link
          to="/digital-twins"
          className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Twin Fleet
        </Link>
      </div>
    );
  }

  const state = twin.currentState || twin.state;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/digital-twins"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                {twin.twinCode}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">
                {twin.plantName} / {twin.areaName}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {twin.machineName}
              <span className="text-sm font-mono text-slate-400 font-normal">({twin.machineCode})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {twin.federatedModelVersion && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Network className="w-3.5 h-3.5 mr-1.5" />
              FL Active: {twin.federatedModelVersion}
            </span>
          )}

          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing...' : 'Force Synchronize'}
          </button>
        </div>
      </div>

      {/* State Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Current Operational State</span>
              {getStateBadge(state?.operatingState)}
            </div>
            <p className="text-sm text-slate-300 pt-1">
              {state?.stateExplanation || 'Deterministic state based on real-time sensor streams, health metrics, and alert triggers.'}
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 shrink-0">
            <div>Last Ingestion: <span className="text-slate-200">{state?.lastTelemetryTimestamp ? new Date(state.lastTelemetryTimestamp).toLocaleTimeString() : 'N/A'}</span></div>
            <div>Last Sync: <span className="text-slate-200">{state?.lastSyncTime ? new Date(state.lastSyncTime).toLocaleTimeString() : 'Pending'}</span></div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Machine Health */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium uppercase tracking-wider">Health Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {state?.healthScore !== null && state?.healthScore !== undefined ? Math.round(state.healthScore) : '—'}%
            </span>
            <span className="text-xs font-medium text-slate-400 uppercase">
              {state?.healthState || 'NORMAL'}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (state?.healthScore ?? 100) >= 80
                  ? 'bg-emerald-400'
                  : (state?.healthScore ?? 100) >= 60
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, state?.healthScore ?? 100))}%` }}
            />
          </div>
        </div>

        {/* Card 2: RUL Forecast */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium uppercase tracking-wider">Remaining Useful Life</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-cyan-400">
              {state?.rulHours !== null && state?.rulHours !== undefined ? `${state.rulHours.toFixed(1)}h` : '—'}
            </span>
            {state?.rulHours && (
              <span className="text-xs text-slate-400">
                (~{(state.rulHours / 24).toFixed(1)} days)
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Confidence: <span className="text-slate-200">{state?.rulConfidence ? `${Math.round(state.rulConfidence * 100)}%` : '85%'}</span>
          </div>
        </div>

        {/* Card 3: Active Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${(state?.openAlertsCount ?? state?.activeAlertCount ?? 0) > 0 ? 'text-amber-400' : 'text-white'}`}>
              {state?.openAlertsCount ?? state?.activeAlertCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">Open Incidents</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-3">
            <span className="text-red-400 font-medium">{state?.criticalAlertsCount ?? 0} Critical</span>
            <span className="text-amber-400 font-medium">{state?.warningAlertsCount ?? 0} Warning</span>
          </div>
        </div>

        {/* Card 4: Model & Features Pipeline */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium uppercase tracking-wider">Model Attribution</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-white truncate">
            {twin.federatedModelVersion ? twin.federatedModelVersion : 'Federated / Central ML'}
          </div>
          <div className="mt-2 text-xs text-slate-400 truncate">
            Window Ingested: <span className="text-slate-200">{state?.latestFeatureTimestamp ? new Date(state.latestFeatureTimestamp).toLocaleTimeString() : 'Current'}</span>
          </div>
        </div>
      </div>

      {/* Prescriptive Recommendations Alert (if available) */}
      {state?.activeRecommendations && (
        <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-xl flex items-start gap-3">
          <Wrench className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-indigo-200">Prescriptive Maintenance Action:</span>
            <p className="text-indigo-300/90 mt-0.5">{state.activeRecommendations}</p>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="border-b border-slate-800 flex items-center space-x-6">
        <button
          onClick={() => setActiveTab('sensors')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'sensors'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Live Sensors & Subsystems ({sensors.length})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'timeline'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Twin Event Timeline ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'history'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Historical State Snapshots
        </button>
      </div>

      {/* Tab 1: Live Sensors & Subsystems */}
      {activeTab === 'sensors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400">
              No telemetry sensors mapped for this digital twin.
            </div>
          ) : (
            sensors.map((s) => (
              <div
                key={s.sensorId}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                      {getSensorIcon(s.sensorType)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{s.sensorCode}</div>
                      <div className="text-xs text-slate-400">{s.sensorType}</div>
                    </div>
                  </div>
                  {getTrendBadge(s.trend)}
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white font-mono">
                      {s.value !== null ? s.value.toFixed(2) : '—'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 ml-1.5">{s.unit}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      s.status === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : s.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Reading:</span>
                  <span>{s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : 'N/A'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Twin Event Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No operational events recorded for this digital twin yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Bullet */}
                  <span
                    className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                      event.severity === 'CRITICAL'
                        ? 'bg-red-500'
                        : event.severity === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {event.eventType}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200">{event.title}</h4>
                    </div>
                    <span className="text-xs text-slate-500">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Historical State Snapshots */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operating State</th>
                  <th className="py-3 px-4">Health Score</th>
                  <th className="py-3 px-4">RUL Forecast</th>
                  <th className="py-3 px-4">Open Alerts</th>
                  <th className="py-3 px-4">State Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {!history || history.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No historical state transitions recorded. Snapshots are logged periodically and on state transitions.
                    </td>
                  </tr>
                ) : (
                  history.content.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">{getStateBadge(h.operatingState)}</td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {h.healthScore !== null ? `${Math.round(h.healthScore)}%` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                        {h.rulHours !== null ? `${h.rulHours.toFixed(1)}h` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={h.openAlertsCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {h.openAlertsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={h.stateReason}>
                        {h.stateReason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default DigitalTwinDashboardPage;
