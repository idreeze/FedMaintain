import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rulService } from '../services/rulService';
import { assetService } from '../services/assetService';
import { Machine } from '../types/assets';
import { RulPrediction, ModelVersion } from '../types/predictions';
import { useAuth } from '../context/AuthContext';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import {
  LineChart as LineChartIcon,
  Play,
  Clock,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const RulPredictionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const machineId = Number(id);
  const { user } = useAuth();
  const canPredict = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  const [machine, setMachine] = useState<Machine | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<RulPrediction | null>(null);
  const [historicalPredictions, setHistoricalPredictions] = useState<RulPrediction[]>([]);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(machineId)) return;
    try {
      setLoading(true);
      setError(null);
      const [machineData, latest, history, allModels] = await Promise.all([
        assetService.getMachineById(machineId),
        rulService.getLatestRul(machineId).catch(() => null),
        rulService.getHistoricalRul(machineId, 0, 30).catch(() => ({ content: [] })),
        rulService.getAllModels().catch(() => []),
      ]);
      setMachine(machineData);
      if (latest) setLatestPrediction(latest);
      setHistoricalPredictions(history.content || []);
      setModels(allModels);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load RUL prediction data');
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePredict = async () => {
    try {
      setPredicting(true);
      setError(null);
      const res = await rulService.predictRul(machineId);
      setLatestPrediction(res);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate RUL prediction');
    } finally {
      setPredicting(false);
    }
  };

  const chartData = [...historicalPredictions]
    .reverse()
    .map((p) => ({
      time: new Date(p.predictionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rul: p.predictedRulHours != null ? Number(p.predictedRulHours.toFixed(1)) : 0,
      lower: p.confidenceLower != null ? Number(p.confidenceLower.toFixed(1)) : 0,
      upper: p.confidenceUpper != null ? Number(p.confidenceUpper.toFixed(1)) : 0,
      health: p.healthScore != null ? Number(p.healthScore.toFixed(0)) : 0,
    }));

  if (loading && !machine) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs font-mono text-slate-400 space-x-2">
            <Link to="/machines" className="hover:text-cyan-400">MACHINES</Link>
            <span>/</span>
            <Link to={`/machines/${machineId}`} className="hover:text-cyan-400">{machine?.machineCode || machineId}</Link>
            <span>/</span>
            <span className="text-cyan-300">RUL INFERENCE (PHASE 6)</span>
          </nav>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <LineChartIcon className="w-6 h-6 text-cyan-400" />
            Remaining Useful Life (RUL) Forecasting
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Machine: <span className="text-slate-200 font-semibold">{machine?.name} ({machine?.machineCode})</span> • Cleanroom: {machine?.areaName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {canPredict && (
            <button
              onClick={handlePredict}
              disabled={predicting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {predicting ? 'Running Inference...' : 'Run RUL Prediction'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium text-slate-400 gap-6">
        <Link to={`/machines/${machineId}`} className="pb-3 hover:text-slate-200">Machine Specs</Link>
        <Link to={`/machines/${machineId}/monitoring`} className="pb-3 hover:text-slate-200">Raw Telemetry</Link>
        <Link to={`/machines/${machineId}/features`} className="pb-3 hover:text-slate-200">Feature Engineering</Link>
        <span className="pb-3 border-b-2 border-cyan-400 text-cyan-400 font-semibold flex items-center gap-1.5">
          <LineChartIcon className="w-4 h-4" />
          RUL Predictions
        </span>
        <Link to={`/machines/${machineId}/health`} className="pb-3 hover:text-slate-200">Health & XAI</Link>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {error}
        </div>
      )}

      {/* Hero Stats Card */}
      {latestPrediction ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-500" />
            <span className="text-xs font-mono uppercase text-slate-400">Predicted RUL</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {latestPrediction.predictedRulHours != null ? latestPrediction.predictedRulHours.toFixed(1) : 'N/A'}{' '}
              <span className="text-sm font-normal text-slate-400">hours</span>
            </div>
            <p className="text-[11px] font-mono text-cyan-400 mt-2">
              [{latestPrediction.confidenceLower != null ? latestPrediction.confidenceLower.toFixed(1) : '0'}h –{' '}
              {latestPrediction.confidenceUpper != null ? latestPrediction.confidenceUpper.toFixed(1) : '0'}h] 90% CI
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
            <span className="text-xs font-mono uppercase text-slate-400">Health Score</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {latestPrediction.healthScore != null ? latestPrediction.healthScore.toFixed(0) : 'N/A'}{' '}
              <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                latestPrediction.status === 'NORMAL'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                  : latestPrediction.status === 'WARNING'
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                  : 'bg-red-950/80 text-red-400 border border-red-800'
              }`}
            >
              STATUS: {latestPrediction.status}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-purple-500" />
            <span className="text-xs font-mono uppercase text-slate-400">Active Model</span>
            <div className="text-lg font-bold text-white mt-2 truncate font-mono">
              {latestPrediction.modelVersion || 'BASELINE_REGRESSION'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Java Tribuo Linear SGD
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-slate-600" />
            <span className="text-xs font-mono uppercase text-slate-400">Last Prediction</span>
            <div className="text-sm font-semibold text-white mt-2">
              {new Date(latestPrediction.predictionTime).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Synchronized with telemetry
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
          <Clock className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No RUL Inferences Generated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Extract features from raw telemetry first, then run model inference to forecast Remaining Useful Life.
          </p>
          {canPredict && (
            <button
              onClick={handlePredict}
              disabled={predicting}
              className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
            >
              Run First Prediction
            </button>
          )}
        </div>
      )}

      {/* Trajectory Curve Chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-cyan-400" />
              Remaining Useful Life Degradation Trajectory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Predicted operational hours remaining with 90% confidence bounds
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Critical Threshold: 24h • Warning: 72h
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRul" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <ReferenceLine y={24} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (24h)', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={72} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning (72h)', fill: '#f59e0b', fontSize: 10 }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="#0284c7" fillOpacity={0.15} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#0f172a" fillOpacity={1} />
                <Line type="monotone" dataKey="rul" name="Predicted RUL (h)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3, fill: '#06b6d4' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
            No trajectory history available yet.
          </div>
        )}
      </div>

      {/* Model Registry Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Model Registry & Performance Benchmarks
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Active Engine: Java Tribuo SGD
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">MAE (hrs)</th>
                <th className="py-3 px-4">RMSE (hrs)</th>
                <th className="py-3 px-4">R² Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-4 font-semibold text-white">{m.modelName}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{m.version}</td>
                  <td className="py-2.5 px-4 text-slate-400">{m.algorithm}</td>
                  <td className="py-2.5 px-4">{m.mae != null ? m.mae.toFixed(2) : 'N/A'}</td>
                  <td className="py-2.5 px-4">{m.rmse != null ? m.rmse.toFixed(2) : 'N/A'}</td>
                  <td className="py-2.5 px-4 text-emerald-400">{m.r2 != null ? m.r2.toFixed(3) : 'N/A'}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'ACTIVE'
                          ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {models.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No models registered in the catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RulPredictionsPage;
