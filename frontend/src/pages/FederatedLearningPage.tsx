import React, { useEffect, useState, useCallback } from 'react';
import { federatedService } from '../services/federatedService';
import {
  FederatedClient,
  FederatedRound,
  FederatedModel,
  FederatedMetrics,
  ModelComparison,
} from '../types/federated';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Network,
  Play,
  Layers,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Building,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const FederatedLearningPage: React.FC = () => {
  const { user } = useAuth();
  const canTrigger = user?.role === 'ADMIN';

  const [rounds, setRounds] = useState<FederatedRound[]>([]);
  const [clients, setClients] = useState<FederatedClient[]>([]);
  const [models, setModels] = useState<FederatedModel[]>([]);
  const [metrics, setMetrics] = useState<FederatedMetrics | null>(null);
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingRound, setStartingRound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [roundsData, clientsData, modelsData, metricsData, compData] = await Promise.all([
        federatedService.getAllRounds().catch(() => []),
        federatedService.getAllClients().catch(() => []),
        federatedService.getAllModels().catch(() => []),
        federatedService.getMetrics().catch(() => null),
        federatedService.getComparison().catch(() => null),
      ]);
      setRounds(roundsData);
      setClients(clientsData);
      setModels(modelsData);
      if (metricsData) setMetrics(metricsData);
      if (compData) setComparison(compData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load federated learning data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartRound = async () => {
    try {
      setStartingRound(true);
      setError(null);
      setSuccessMsg(null);
      const newRound = await federatedService.startRound();
      setSuccessMsg(`Federated Round #${newRound.round} completed successfully with ${newRound.participatingClients} clients!`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to execute federated round');
    } finally {
      setStartingRound(false);
    }
  };

  const lossChartData = [...rounds].reverse().map((r) => ({
    round: `R${r.round}`,
    loss: r.trainingLoss != null ? Number(r.trainingLoss.toFixed(4)) : null,
    mae: r.mae != null ? Number(r.mae.toFixed(2)) : null,
    rmse: r.rmse != null ? Number(r.rmse.toFixed(2)) : null,
    r2: r.r2 != null ? Number(r.r2.toFixed(3)) : null,
  }));

  if (loading && rounds.length === 0 && clients.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs font-mono text-slate-400 space-x-2">
            <span className="text-slate-500">DECENTRALIZED AI</span>
            <span>/</span>
            <span className="text-cyan-300">FEDERATED LEARNING OPERATIONS (PHASE 8)</span>
          </nav>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Network className="w-6 h-6 text-cyan-400" />
            Federated Averaging (FedAvg) Orchestrator
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Privacy-preserving collaborative training across distributed semiconductor fabs with zero raw telemetry sharing
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
          {canTrigger && (
            <button
              onClick={handleStartRound}
              disabled={startingRound}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {startingRound ? 'Aggregating Client Weights...' : 'Trigger Federated Round'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block font-medium">Total Rounds</span>
          <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
            {metrics ? metrics.totalRounds : rounds.length}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-emerald-900/40 rounded-xl p-3.5">
          <span className="text-emerald-400 block font-medium">Completed Rounds</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
            {metrics ? metrics.totalRoundsCompleted : rounds.filter((r) => r.status === 'COMPLETED').length}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-cyan-900/40 rounded-xl p-3.5">
          <span className="text-cyan-400 block font-medium">Active Clients</span>
          <span className="text-2xl font-extrabold text-cyan-400 mt-1 block font-mono">
            {metrics ? metrics.activeClientsCount : clients.filter((c) => c.status === 'ACTIVE').length}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block font-medium">Global MAE (hrs)</span>
          <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
            {metrics?.latestMae != null ? metrics.latestMae.toFixed(2) : 'N/A'}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block font-medium">Global RMSE</span>
          <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
            {metrics?.latestRmse != null ? metrics.latestRmse.toFixed(2) : 'N/A'}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-purple-900/40 rounded-xl p-3.5">
          <span className="text-purple-400 block font-medium">Global R² Score</span>
          <span className="text-2xl font-extrabold text-purple-400 mt-1 block font-mono">
            {metrics?.latestR2 != null ? metrics.latestR2.toFixed(3) : 'N/A'}
          </span>
        </div>
      </div>

      {/* Centralized vs Federated Comparison Banner */}
      {comparison && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Empirical Parity: Centralized vs Federated Learning
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              {comparison.privacyStrategy || 'Differential Privacy & Local Weight Aggregation'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono uppercase text-[10px]">Centralized Model (Baseline)</span>
              <div className="text-sm font-bold text-white mt-1 font-mono">{comparison.centralizedModelVersion || 'CENTRAL_BASELINE'}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center font-mono">
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 text-[10px] block">MAE</span>
                  <span className="text-white font-bold">{comparison.centralizedMae?.toFixed(2) ?? 'N/A'}h</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 text-[10px] block">RMSE</span>
                  <span className="text-white font-bold">{comparison.centralizedRmse?.toFixed(2) ?? 'N/A'}h</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 text-[10px] block">R²</span>
                  <span className="text-emerald-400 font-bold">{comparison.centralizedR2?.toFixed(3) ?? 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-lg border border-cyan-800/40">
              <span className="text-cyan-400 block font-mono uppercase text-[10px]">Federated Global Model (FedAvg)</span>
              <div className="text-sm font-bold text-cyan-300 mt-1 font-mono">{comparison.federatedModelVersion || 'FED_AVG_LATEST'}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center font-mono">
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 text-[10px] block">MAE</span>
                  <span className="text-white font-bold">{comparison.federatedMae?.toFixed(2) ?? 'N/A'}h</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 text-[10px] block">RMSE</span>
                  <span className="text-white font-bold">{comparison.federatedRmse?.toFixed(2) ?? 'N/A'}h</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 text-[10px] block">R²</span>
                  <span className="text-emerald-400 font-bold">{comparison.federatedR2?.toFixed(3) ?? 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-mono">
            Note: {comparison.factualSummary || 'Federated model demonstrates statistical parity with centralized training while preserving total client data privacy.'}
          </p>
        </div>
      )}

      {/* Convergence Line Chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Federated Convergence Dynamics across Rounds
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking global training loss and validation MAE per aggregation round
            </p>
          </div>
        </div>

        {lossChartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lossChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="round" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="loss" name="Training Loss" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="mae" name="Validation MAE (hrs)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="rmse" name="Validation RMSE" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
            No federated round history available yet.
          </div>
        )}
      </div>

      {/* Two-Column: Clients Table & Global Models Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participating Clients Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Participating Fab Clients (Silo Isolation)
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {clients.length} Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Client ID</th>
                  <th className="py-2.5 px-3">Plant</th>
                  <th className="py-2.5 px-3">Samples</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{c.clientId}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{c.plantCode}</td>
                    <td className="py-2.5 px-3">{c.datasetSize.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(c.lastSeen).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No federated clients registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Model History Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Global Model Version Artifacts
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {models.length} Versions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Round</th>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Clients</th>
                  <th className="py-2.5 px-3">Samples</th>
                  <th className="py-2.5 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">{m.version}</td>
                    <td className="py-2.5 px-3">Round #{m.roundNumber}</td>
                    <td className="py-2.5 px-3 text-slate-400">{m.algorithm}</td>
                    <td className="py-2.5 px-3">{m.clientCount}</td>
                    <td className="py-2.5 px-3">{m.sampleCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No global model versions aggregated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FederatedLearningPage;
