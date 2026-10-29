import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { healthService } from '../services/healthService';
import { assetService } from '../services/assetService';
import { Machine } from '../types/assets';
import { MachineHealth, ExplanationResponse, RecommendationResponse } from '../types/health';
import { Alert } from '../types/alerts';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Zap,
  Gauge,
  Waves,
  Wrench,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

export const MachineHealthPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const machineId = Number(id);

  const [machine, setMachine] = useState<Machine | null>(null);
  const [health, setHealth] = useState<MachineHealth | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(machineId)) return;
    try {
      setLoading(true);
      setError(null);
      const [machineData, healthData, explanationData, recData, alertsData] = await Promise.all([
        assetService.getMachineById(machineId),
        healthService.getMachineHealth(machineId).catch(() => null),
        healthService.getLatestExplanation(machineId).catch(() => null),
        healthService.getRecommendations(machineId).catch(() => null),
        healthService.getMachineAlerts(machineId).catch(() => []),
      ]);
      setMachine(machineData);
      setHealth(healthData);
      setExplanation(explanationData);
      setRecommendations(recData);
      setAlerts(alertsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load machine health & explainability data');
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !machine) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500';
    if (score >= 60) return 'text-cyan-400 border-cyan-500';
    if (score >= 40) return 'text-amber-400 border-amber-500';
    return 'text-red-400 border-red-500';
  };

  const getSubsystemScore = (key: string): number => {
    if (!health?.subsystemScores) return 100;
    return Math.round(health.subsystemScores[key] ?? 100);
  };

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs font-mono text-slate-400 space-x-2">
            <Link to="/machines" className="hover:text-cyan-400">MACHINES</Link>
            <span>/</span>
            <Link to={`/machines/${machineId}`} className="hover:text-cyan-400">{machine?.machineCode || machineId}</Link>
            <span>/</span>
            <span className="text-cyan-300">HEALTH & EXPLAINABILITY (PHASE 7)</span>
          </nav>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Machine Health Index & Explainable AI
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Machine: <span className="text-slate-200 font-semibold">{machine?.name} ({machine?.machineCode})</span> • Cleanroom: {machine?.areaName}
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium text-slate-400 gap-6">
        <Link to={`/machines/${machineId}`} className="pb-3 hover:text-slate-200">Machine Specs</Link>
        <Link to={`/machines/${machineId}/monitoring`} className="pb-3 hover:text-slate-200">Raw Telemetry</Link>
        <Link to={`/machines/${machineId}/features`} className="pb-3 hover:text-slate-200">Feature Engineering</Link>
        <Link to={`/machines/${machineId}/predictions`} className="pb-3 hover:text-slate-200">RUL Predictions</Link>
        <span className="pb-3 border-b-2 border-cyan-400 text-cyan-400 font-semibold flex items-center gap-1.5">
          <Activity className="w-4 h-4" />
          Health & XAI
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {error}
        </div>
      )}

      {/* Top Health Index Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Health Gauge */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-mono uppercase text-slate-400 mb-2">Overall Machine Health</span>
          <div className="relative flex items-center justify-center my-3">
            <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center ${getHealthColor(health?.healthScore ?? 100)}`}>
              <span className="text-3xl font-black text-white">{health ? Math.round(health.healthScore) : 100}</span>
              <span className="text-[10px] font-mono text-slate-400">/ 100</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold mt-1 ${
              health?.status === 'HEALTHY'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : health?.status === 'DEGRADED'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : health?.status === 'WARNING'
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-red-950 text-red-400 border border-red-800'
            }`}
          >
            {health?.status || 'HEALTHY'}
          </span>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            RUL: {health?.rulHours ? `${health.rulHours.toFixed(1)} hrs remaining` : 'No active forecast'}
          </p>
        </div>

        {/* Subsystem Health Breakdown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 md:col-span-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Subsystem Health Diagnostics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-400" /> Thermal Subsystem
                </span>
                <span className="font-mono font-bold text-white">{getSubsystemScore('thermal')}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${getSubsystemScore('thermal')}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" /> Vibration Dynamics
                </span>
                <span className="font-mono font-bold text-white">{getSubsystemScore('vibration')}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${getSubsystemScore('vibration')}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Electrical System
                </span>
                <span className="font-mono font-bold text-white">{getSubsystemScore('electrical')}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${getSubsystemScore('electrical')}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" /> Vacuum & Pressure
                </span>
                <span className="font-mono font-bold text-white">{getSubsystemScore('pressure')}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${getSubsystemScore('pressure')}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explainability / Root Cause Contributors */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Explainable AI (XAI) Feature Attribution & Baselines
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked deviation from baseline operating envelope
            </p>
          </div>
          {explanation && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/60">
              {explanation.explanationSummary}
            </span>
          )}
        </div>

        {(() => {
          const factors = (explanation as any)?.factors || (explanation as any)?.explanations || [];
          if (factors.length === 0) {
            return (
              <div className="text-center py-6 text-slate-500 text-xs">
                No XAI feature attribution records found for current prediction.
              </div>
            );
          }
          return (
            <div className="space-y-3">
              {factors.map((item: any, i: number) => {
                const name = item.feature || item.featureName || `Feature ${i + 1}`;
                const val = item.value ?? item.featureValue;
                const base = item.baseline ?? item.baselineValue;
                const dev = item.deviationPercentage ?? 0;
                const lvl = (item.level || item.contributionLevel || 'LOW').toUpperCase();
                const dir = item.direction || 'STABLE';
                return (
                  <div
                    key={i}
                    className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          lvl === 'HIGH'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : lvl === 'MEDIUM'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {lvl} IMPACT
                      </span>
                      <span className="font-semibold text-white font-mono">{name}</span>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-slate-400">
                      <span>
                        Observed: <strong className="text-white">{val != null ? Number(val).toFixed(2) : 'N/A'}</strong>
                      </span>
                      <span>
                        Baseline: <strong className="text-slate-300">{base != null ? Number(base).toFixed(2) : 'N/A'}</strong>
                      </span>
                      <span
                        className={`flex items-center gap-1 font-bold ${
                          dev > 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {dir === 'INCREASING' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : dir === 'DECREASING' ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                        {dev > 0 ? '+' : ''}
                        {Number(dev).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Prescriptive Recommendations & Active Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prescriptive Recommendations */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Prescriptive Maintenance Actions
          </h2>
          {(() => {
            const recList = Array.isArray(recommendations?.recommendations) ? recommendations.recommendations : [];
            if (recList.length === 0) {
              return (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  Machine operating within standard parameters. No maintenance recommended.
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {recList.map((rec: any, i: number) => {
                  const isStr = typeof rec === 'string';
                  const title = isStr ? rec : (rec.title || `Action ${i + 1}`);
                  const desc = isStr ? '' : rec.description;
                  const priority = isStr ? ((recommendations as any)?.priority || 'MEDIUM') : (rec.priority || 'MEDIUM');
                  const downtime = isStr ? null : rec.estimatedDowntimeHours;
                  const spares = (!isStr && Array.isArray(rec.recommendedSpares)) ? rec.recommendedSpares : [];

                  return (
                    <div key={i} className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-white">{title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            priority === 'CRITICAL'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : priority === 'HIGH'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {priority}
                        </span>
                      </div>
                      {desc && <p className="text-xs text-slate-400 mt-1">{desc}</p>}
                      {(downtime != null || spares.length > 0) && (
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                          {downtime != null && <span>Downtime Est: <strong className="text-white">{downtime} hrs</strong></span>}
                          {spares.length > 0 && <span>Spares: <strong className="text-cyan-400">{spares.join(', ')}</strong></span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Machine Alerts */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Active Machine Alerts
            </h2>
            <Link to="/alerts" className="text-xs text-cyan-400 hover:text-cyan-300">
              View All Alerts →
            </Link>
          </div>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{a.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        a.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-slate-400">{a.description}</p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    Trigger: {a.triggerValue != null ? a.triggerValue.toFixed(1) : 'N/A'} (Limit: {a.thresholdValue != null ? a.thresholdValue.toFixed(1) : 'N/A'})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              Zero active alerts for this machine.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineHealthPage;
