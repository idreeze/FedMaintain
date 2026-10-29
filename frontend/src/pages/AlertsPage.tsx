import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { alertService, AlertFilterParams } from '../services/alertService';
import { Alert, AlertSummary, AlertSeverity, AlertStatus } from '../types/alerts';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Filter,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const canManageAlerts = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | ''>('');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: AlertFilterParams = { page, size: 15 };
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;

      const [alertsPage, summaryData] = await Promise.all([
        alertService.getAlerts(params),
        alertService.getAlertSummary().catch(() => null),
      ]);

      setAlerts(alertsPage.content);
      setTotalPages(alertsPage.totalPages);
      setTotalElements(alertsPage.totalElements);
      if (summaryData) setSummary(summaryData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load maintenance alerts');
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcknowledge = async (id: number) => {
    try {
      await alertService.acknowledgeAlert(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertService.resolveAlert(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve alert');
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs font-mono text-slate-400 space-x-2">
            <span className="text-slate-500">OPERATIONS</span>
            <span>/</span>
            <span className="text-cyan-300">PREDICTIVE MAINTENANCE ALERTS (PHASE 7)</span>
          </nav>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            Predictive Maintenance Alerts & Workflows
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated threshold breaches, rapid degradation warnings, and machine risk notifications
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

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 block font-medium">Total Alerts</span>
            <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
              {summary.totalAlerts}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-red-900/40 rounded-xl p-3.5">
            <span className="text-red-400 block font-medium">Critical Alerts</span>
            <span className="text-2xl font-extrabold text-red-400 mt-1 block font-mono">
              {summary.criticalAlerts}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-amber-900/40 rounded-xl p-3.5">
            <span className="text-amber-400 block font-medium">Warnings</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block font-mono">
              {summary.warningAlerts}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-cyan-900/40 rounded-xl p-3.5">
            <span className="text-cyan-400 block font-medium">Open</span>
            <span className="text-2xl font-extrabold text-cyan-400 mt-1 block font-mono">
              {summary.openAlerts}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-purple-900/40 rounded-xl p-3.5">
            <span className="text-purple-400 block font-medium">Acknowledged</span>
            <span className="text-2xl font-extrabold text-purple-400 mt-1 block font-mono">
              {summary.acknowledgedAlerts}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-emerald-900/40 rounded-xl p-3.5">
            <span className="text-emerald-400 block font-medium">Resolved</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
              {summary.resolvedAlerts}
            </span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider">Filters:</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value as AlertSeverity | '');
              setPage(0);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as AlertStatus | '');
              setPage(0);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          {(severityFilter || statusFilter) && (
            <button
              onClick={() => {
                setSeverityFilter('');
                setStatusFilter('');
                setPage(0);
              }}
              className="text-xs text-slate-400 hover:text-white underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {alerts.length} of {totalElements} alerts
        </span>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert Details</th>
                <th className="py-3 px-4">Machine</th>
                <th className="py-3 px-4">Trigger / Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                {canManageAlerts && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {alerts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        a.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : a.severity === 'WARNING'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-white">{a.title}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{a.description}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Type: {a.alertType}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <Link
                      to={`/machines/${a.machineId}`}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      {a.machineCode || `Machine #${a.machineId}`}
                    </Link>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    {a.triggerValue != null ? a.triggerValue.toFixed(1) : 'N/A'}{' '}
                    <span className="text-slate-500 text-[10px]">
                      (Limit: {a.thresholdValue != null ? a.thresholdValue.toFixed(1) : 'N/A'})
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        a.status === 'OPEN'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                          : a.status === 'ACKNOWLEDGED'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {a.status}
                    </span>
                    {a.acknowledgedBy && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        by {a.acknowledgedBy}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>

                  {canManageAlerts && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2.5 py-1 bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded text-[11px] font-medium transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        {a.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 rounded text-[11px] font-medium transition"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {alerts.length === 0 && (
                <tr>
                  <td colSpan={canManageAlerts ? 7 : 6} className="py-10 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                    No alerts matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
              Page {page + 1} of {totalPages}
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
    </div>
  );
};

export default AlertsPage;
