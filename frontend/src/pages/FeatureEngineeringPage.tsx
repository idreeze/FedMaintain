import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { featureService, DataQualityReport } from '../services/featureService';
import { assetService } from '../services/assetService';
import { Machine } from '../types/assets';
import { MachineFeature } from '../types/features';
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
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Database,
  Layers,
} from 'lucide-react';

export const FeatureEngineeringPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const machineId = Number(id);
  const { user } = useAuth();
  const canGenerate = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  const [machine, setMachine] = useState<Machine | null>(null);
  const [features, setFeatures] = useState<MachineFeature[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Generate Features Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [windowSize, setWindowSize] = useState(60);
  const [stepSize, setStepSize] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(machineId)) return;
    try {
      setLoading(true);
      setError(null);
      const [machineData, featurePage, qualityReport] = await Promise.all([
        assetService.getMachineById(machineId),
        featureService.getMachineFeatures(machineId, page, 20),
        featureService.getDataQuality(machineId).catch(() => null),
      ]);
      setMachine(machineData);
      setFeatures(featurePage.content);
      setTotalPages(featurePage.totalPages);
      setTotalElements(featurePage.totalElements);
      if (qualityReport) setDataQuality(qualityReport);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load feature engineering data');
    } finally {
      setLoading(false);
    }
  }, [machineId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      setGenSuccess(null);
      const res = await featureService.generateFeatures(machineId, {
        windowSizeSeconds: windowSize,
        stepSizeSeconds: stepSize,
      });
      setGenSuccess(`Successfully generated ${res.featuresGenerated} feature windows!`);
      setTimeout(() => {
        setIsModalOpen(false);
        setGenSuccess(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate features');
    } finally {
      setGenerating(false);
    }
  };

  const chartData = [...features]
    .reverse()
    .map((f) => ({
      time: f.windowEnd ? new Date(f.windowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '',
      tempMean: f.temperatureMean != null ? Number(f.temperatureMean.toFixed(2)) : 0,
      vibRms: f.vibrationRms != null ? Number(f.vibrationRms.toFixed(2)) : 0,
      pressureMean: f.pressureMean != null ? Number(f.pressureMean.toFixed(2)) : 0,
      currentMean: f.currentMean != null ? Number(f.currentMean.toFixed(2)) : 0,
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
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs font-mono text-slate-400 space-x-2">
            <Link to="/machines" className="hover:text-cyan-400">MACHINES</Link>
            <span>/</span>
            <Link to={`/machines/${machineId}`} className="hover:text-cyan-400">{machine?.machineCode || machineId}</Link>
            <span>/</span>
            <span className="text-cyan-300">FEATURE ENGINEERING (PHASE 5)</span>
          </nav>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            Engineered Features & Sliding Windows
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
          {canGenerate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              Generate Features
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium text-slate-400 gap-6">
        <Link to={`/machines/${machineId}`} className="pb-3 hover:text-slate-200">Machine Specs</Link>
        <Link to={`/machines/${machineId}/monitoring`} className="pb-3 hover:text-slate-200">Raw Telemetry</Link>
        <span className="pb-3 border-b-2 border-cyan-400 text-cyan-400 font-semibold flex items-center gap-1.5">
          <Sliders className="w-4 h-4" />
          Feature Engineering
        </span>
        <Link to={`/machines/${machineId}/predictions`} className="pb-3 hover:text-slate-200">RUL Predictions</Link>
        <Link to={`/machines/${machineId}/health`} className="pb-3 hover:text-slate-200">Health & XAI</Link>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {error}
        </div>
      )}

      {/* Data Quality Report Banner */}
      {dataQuality && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Telemetry Data Quality & Validation
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              Quality Score: {dataQuality.overallScore != null ? (dataQuality.overallScore * 100).toFixed(1) : '100.0'}%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block font-medium">Completeness</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {dataQuality.completeness != null ? (dataQuality.completeness * 100).toFixed(1) : '100.0'}%
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block font-medium">Validity</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {dataQuality.validity != null ? (dataQuality.validity * 100).toFixed(1) : '100.0'}%
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block font-medium">Timeliness</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {dataQuality.timeliness != null ? (dataQuality.timeliness * 100).toFixed(1) : '100.0'}%
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block font-medium">Anomaly Ratio</span>
              <span className="text-lg font-bold text-amber-400 mt-1 block">
                {dataQuality.anomalyRatio != null ? (dataQuality.anomalyRatio * 100).toFixed(2) : '0.00'}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Trends Chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Engineered Subsystem Features (Sliding Windows)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated mean and RMS statistics per sliding time window
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Windows: {totalElements}
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="tempMean" name="Temp Mean (°C)" stroke="#ef4444" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="vibRms" name="Vib RMS (mm/s)" stroke="#38bdf8" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="pressureMean" name="Pressure Mean (kPa)" stroke="#eab308" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="currentMean" name="Current Mean (A)" stroke="#a855f7" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Layers className="w-8 h-8 text-slate-600 mb-2" />
            No engineered feature windows computed yet for this machine.
            {canGenerate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium"
              >
                Generate Initial Windows
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feature Windows Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Feature Matrix Records
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Page {page + 1} of {Math.max(totalPages, 1)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Window End</th>
                <th className="py-3 px-4">Samples</th>
                <th className="py-3 px-4">Temp Mean (Trend)</th>
                <th className="py-3 px-4">Vib RMS (Max)</th>
                <th className="py-3 px-4">Pressure Mean</th>
                <th className="py-3 px-4">Current Mean</th>
                <th className="py-3 px-4">RPM Mean</th>
                <th className="py-3 px-4">Run ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {features.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-4 text-slate-200">
                    {new Date(f.windowEnd).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-cyan-400">{f.sampleCount}</td>
                  <td className="py-2.5 px-4">
                    {f.temperatureMean != null ? f.temperatureMean.toFixed(2) : 'N/A'}°C{' '}
                    <span className={`text-[10px] ${(f.temperatureTrend ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ({(f.temperatureTrend ?? 0) > 0 ? '+' : ''}{f.temperatureTrend != null ? f.temperatureTrend.toFixed(3) : '0.000'})
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    {f.vibrationRms != null ? f.vibrationRms.toFixed(2) : 'N/A'}{' '}
                    <span className="text-slate-500 text-[10px]">({f.vibrationMax != null ? f.vibrationMax.toFixed(2) : 'N/A'})</span>
                  </td>
                  <td className="py-2.5 px-4">{f.pressureMean != null ? f.pressureMean.toFixed(2) : 'N/A'} kPa</td>
                  <td className="py-2.5 px-4">{f.currentMean != null ? f.currentMean.toFixed(2) : 'N/A'} A</td>
                  <td className="py-2.5 px-4">{f.rpmMean != null ? f.rpmMean.toFixed(0) : 'N/A'}</td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">{f.runId || 'N/A'}</td>
                </tr>
              ))}
              {features.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No feature windows available. Click "Generate Features" to process raw telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-400 font-mono">
              Showing page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Generate Sliding Feature Windows
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Extract statistical aggregation features across resampled sensor telemetry.
            </p>

            {genSuccess ? (
              <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {genSuccess}
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Window Size (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={windowSize}
                    onChange={(e) => setWindowSize(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Recommended: 60s</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Step Size / Stride (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={stepSize}
                    onChange={(e) => setStepSize(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Recommended: 30s (50% overlap)</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                  >
                    {generating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {generating ? 'Processing Telemetry...' : 'Start Feature Extraction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureEngineeringPage;
