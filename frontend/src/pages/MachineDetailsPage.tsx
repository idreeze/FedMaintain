import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { telemetryService } from '../services/telemetryService';
import { Machine, MachineStatus } from '../types/assets';
import { Sensor, SensorType } from '../types/telemetry';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const MachineDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const machineId = Number(id);

  const [machine, setMachine] = useState<Machine | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Change State
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Add Sensor Modal State
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [sensorCode, setSensorCode] = useState('');
  const [sensorName, setSensorName] = useState('');
  const [sensorType, setSensorType] = useState<SensorType>('VIBRATION');
  const [sensorUnit, setSensorUnit] = useState('mm/s');
  const [minOpVal, setMinOpVal] = useState<string>('0');
  const [maxOpVal, setMaxOpVal] = useState<string>('15');
  const [warnThresh, setWarnThresh] = useState<string>('5');
  const [critThresh, setCritThresh] = useState<string>('8');
  const [submittingSensor, setSubmittingSensor] = useState(false);
  const [sensorModalError, setSensorModalError] = useState<string | null>(null);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  const loadMachineData = useCallback(async () => {
    if (isNaN(machineId)) return;
    try {
      setLoading(true);
      setError(null);
      const [machineData, sensorsData] = await Promise.all([
        assetService.getMachineById(machineId),
        telemetryService.getSensorsByMachineId(machineId),
      ]);
      setMachine(machineData);
      setSensors(sensorsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load machine details');
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    loadMachineData();
  }, [loadMachineData]);

  const handleStatusChange = async (newStatus: MachineStatus) => {
    if (!machine) return;
    try {
      setUpdatingStatus(true);
      const updated = await assetService.updateMachineStatus(machine.id, { status: newStatus });
      setMachine(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update machine status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingSensor(true);
      setSensorModalError(null);
      const body = {
        sensorCode,
        name: sensorName,
        sensorType,
        unit: sensorUnit,
        samplingIntervalMs: 1000,
        minOperatingValue: minOpVal ? parseFloat(minOpVal) : undefined,
        maxOperatingValue: maxOpVal ? parseFloat(maxOpVal) : undefined,
        warningThreshold: warnThresh ? parseFloat(warnThresh) : undefined,
        criticalThreshold: critThresh ? parseFloat(critThresh) : undefined,
      };
      await api.post(`/api/machines/${machineId}/sensors`, body);
      setIsSensorModalOpen(false);
      setSensorCode('');
      setSensorName('');
      await loadMachineData();
    } catch (err: any) {
      setSensorModalError(err.response?.data?.message || 'Failed to register sensor');
    } finally {
      setSubmittingSensor(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="space-y-4">
        <Link to="/machines" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
          ← Back to Machines
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || 'Machine not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm font-medium text-gray-500 space-x-2">
        <Link to="/machines" className="hover:text-indigo-600">Machines</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{machine.machineCode}</span>
      </nav>

      {/* Machine Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{machine.name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {machine.machineCode}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {machine.machineType}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  machine.criticality === 'CRITICAL'
                    ? 'bg-red-100 text-red-800'
                    : machine.criticality === 'HIGH'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {machine.criticality} CRITICALITY
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Located in <strong className="text-gray-700">{machine.plantName} ({machine.plantCode})</strong> •{' '}
              <strong className="text-gray-700">{machine.areaName} ({machine.areaCode})</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canEdit && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">State:</span>
                <select
                  disabled={updatingStatus}
                  value={machine.status}
                  onChange={(e) => handleStatusChange(e.target.value as MachineStatus)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="WARNING">WARNING</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/machines/${machine.id}/monitoring`}
                className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                Telemetry
              </Link>
              <Link
                to={`/machines/${machine.id}/features`}
                className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Features (P5)
              </Link>
              <Link
                to={`/machines/${machine.id}/predictions`}
                className="inline-flex items-center px-3 py-1.5 border border-cyan-600 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-sm"
              >
                RUL Forecast (P6)
              </Link>
              <Link
                to={`/machines/${machine.id}/health`}
                className="inline-flex items-center px-3 py-1.5 border border-emerald-600 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm"
              >
                Health & XAI (P7)
              </Link>
              <Link
                to={`/digital-twins/machine/${machine.id}`}
                className="inline-flex items-center px-3 py-1.5 border border-indigo-600 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm"
              >
                Digital Twin (P9)
              </Link>
            </div>
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block uppercase font-medium">Manufacturer</span>
            <span className="font-semibold text-gray-800 text-sm mt-0.5 block">{machine.manufacturer || 'Applied Materials'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-medium">Model Number</span>
            <span className="font-semibold text-gray-800 text-sm mt-0.5 block">{machine.modelNumber || 'Standard Config'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-medium">Serial Number</span>
            <span className="font-mono font-semibold text-gray-800 text-sm mt-0.5 block">{machine.serialNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-medium">Installed On</span>
            <span className="font-semibold text-gray-800 text-sm mt-0.5 block">
              {machine.installationDate ? new Date(machine.installationDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Catalog Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Connected Sensors & Industrial Telemetry</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              High-frequency sensors capturing temperature, vibration, current, pressure, and acoustic signals
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setIsSensorModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Attach Sensor
            </button>
          )}
        </div>

        {sensors.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No sensors attached to this machine yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Sensor Code</th>
                  <th className="px-6 py-3">Sensor Name & Type</th>
                  <th className="px-6 py-3">Health State</th>
                  <th className="px-6 py-3">Latest Reading</th>
                  <th className="px-6 py-3">Warning / Critical Limits</th>
                  <th className="px-6 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sensors.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-indigo-600">
                      {s.sensorCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{s.sensorType} ({s.unit})</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          s.healthState === 'NORMAL'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.healthState === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : s.healthState === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.healthState === 'NORMAL' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>}
                        {s.healthState}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.lastReadingValue != null ? (
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {s.lastReadingValue.toFixed(2)} {s.unit}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Awaiting stream</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <div>Warn: ≥ {s.warningThreshold ?? 'N/A'} {s.unit}</div>
                      <div className="text-red-600 font-medium">Crit: ≥ {s.criticalThreshold ?? 'N/A'} {s.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {s.lastReadingTime ? new Date(s.lastReadingTime).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attach Sensor Modal */}
      {isSensorModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Attach Sensor to {machine.machineCode}</h3>
              <button onClick={() => setIsSensorModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {sensorModalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-lg">
                {sensorModalError}
              </div>
            )}

            <form onSubmit={handleCreateSensor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Sensor Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`${machine.machineCode}-VIB-02`}
                  value={sensorCode}
                  onChange={(e) => setSensorCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Sensor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Secondary Vibration Sensor"
                  value={sensorName}
                  onChange={(e) => setSensorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Sensor Type *
                  </label>
                  <select
                    value={sensorType}
                    onChange={(e) => {
                      const val = e.target.value as SensorType;
                      setSensorType(val);
                      if (val === 'TEMPERATURE') setSensorUnit('°C');
                      else if (val === 'VIBRATION') setSensorUnit('mm/s');
                      else if (val === 'CURRENT') setSensorUnit('A');
                      else if (val === 'PRESSURE') setSensorUnit('psi');
                      else if (val === 'RPM') setSensorUnit('RPM');
                      else if (val === 'ACOUSTIC') setSensorUnit('dB');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="TEMPERATURE">Temperature</option>
                    <option value="VIBRATION">Vibration</option>
                    <option value="CURRENT">Current</option>
                    <option value="PRESSURE">Pressure</option>
                    <option value="RPM">RPM</option>
                    <option value="ACOUSTIC">Acoustic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={sensorUnit}
                    onChange={(e) => setSensorUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Min Operating Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={minOpVal}
                    onChange={(e) => setMinOpVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Max Operating Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={maxOpVal}
                    onChange={(e) => setMaxOpVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Warning Threshold
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={warnThresh}
                    onChange={(e) => setWarnThresh(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Critical Threshold
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={critThresh}
                    onChange={(e) => setCritThresh(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSensorModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSensor}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingSensor ? 'Attaching...' : 'Attach Sensor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MachineDetailsPage;
