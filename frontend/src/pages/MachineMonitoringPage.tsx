import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { assetService } from '../services/assetService';
import { telemetryService } from '../services/telemetryService';
import { Machine } from '../types/assets';
import { Sensor, SensorReading, SimulatorStatus } from '../types/telemetry';

export const MachineMonitoringPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const machineId = Number(id);

  const [machine, setMachine] = useState<Machine | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [readingsBySensor, setReadingsBySensor] = useState<Record<number, SensorReading[]>>({});
  const [simulatorStatus, setSimulatorStatus] = useState<SimulatorStatus | null>(null);
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h'>('1h');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [simModeUpdating, setSimModeUpdating] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (isNaN(machineId)) return;
    try {
      const now = new Date();
      let start = new Date(now.getTime() - 60 * 60 * 1000); // default 1h
      if (timeRange === '15m') start = new Date(now.getTime() - 15 * 60 * 1000);
      else if (timeRange === '6h') start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      else if (timeRange === '24h') start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [machineData, sensorsData, simData] = await Promise.all([
        assetService.getMachineById(machineId),
        telemetryService.getSensorsByMachineId(machineId),
        telemetryService.getSimulatorStatus().catch(() => null),
      ]);

      setMachine(machineData);
      setSensors(sensorsData);
      if (simData) setSimulatorStatus(simData);

      // Fetch historical readings for each sensor
      const readingsMap: Record<number, SensorReading[]> = {};
      await Promise.all(
        sensorsData.map(async (s) => {
          try {
            const data = await telemetryService.getReadingsBySensor(s.id, {
              start: start.toISOString(),
              end: now.toISOString(),
              limit: 200,
            });
            readingsMap[s.id] = data;
          } catch {
            readingsMap[s.id] = [];
          }
        })
      );
      setReadingsBySensor(readingsMap);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to refresh telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [machineId, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchData();
      }, 3000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, fetchData]);

  const handleModeChange = async (mode: 'NORMAL' | 'DEGRADING' | 'CRITICAL' | 'FAILURE') => {
    try {
      setSimModeUpdating(true);
      await telemetryService.setSimulatorMode(mode);
      await telemetryService.triggerSimulatorTick();
      await fetchData();
    } catch (err) {
      console.error('Failed to update simulator mode:', err);
    } finally {
      setSimModeUpdating(false);
    }
  };

  const handleManualTick = async () => {
    try {
      setSimModeUpdating(true);
      await telemetryService.triggerSimulatorTick();
      await fetchData();
    } catch (err) {
      console.error('Failed to trigger simulator tick:', err);
    } finally {
      setSimModeUpdating(false);
    }
  };

  const formatTimeTick = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  if (loading && !machine) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Machine not found. <Link to="/machines" className="underline font-bold">Back to Machines</Link>
      </div>
    );
  }

  // Find specific sensors for charts
  const tempSensor = sensors.find((s) => s.sensorType === 'TEMPERATURE');
  const vibSensor = sensors.find((s) => s.sensorType === 'VIBRATION');
  const curSensor = sensors.find((s) => s.sensorType === 'CURRENT');
  const pressSensor = sensors.find((s) => s.sensorType === 'PRESSURE');
  const rpmSensor = sensors.find((s) => s.sensorType === 'RPM');
  const acousticSensor = sensors.find((s) => s.sensorType === 'ACOUSTIC');

  const vibReadings = vibSensor ? (readingsBySensor[vibSensor.id] || []) : [];
  const tempReadings = tempSensor ? (readingsBySensor[tempSensor.id] || []) : [];
  const curReadings = curSensor ? (readingsBySensor[curSensor.id] || []) : [];
  const pressReadings = pressSensor ? (readingsBySensor[pressSensor.id] || []) : [];
  const rpmReadings = rpmSensor ? (readingsBySensor[rpmSensor.id] || []) : [];
  const acousticReadings = acousticSensor ? (readingsBySensor[acousticSensor.id] || []) : [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Live Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-gray-500 space-x-2 uppercase tracking-wider">
            <Link to="/machines" className="hover:text-indigo-600">Machines</Link>
            <span>/</span>
            <Link to={`/machines/${machine.id}`} className="hover:text-indigo-600">{machine.machineCode}</Link>
            <span>/</span>
            <span className="text-indigo-600 font-bold">Live Monitoring</span>
          </nav>
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-bold text-gray-900">{machine.name}</h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold">
              {machine.machineCode}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                machine.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {machine.status}
            </span>
          </div>
        </div>

        {/* Live Status & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Switch */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-gray-50 border-gray-300 text-gray-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1.5 ${
                autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            ></span>
            {autoRefresh ? 'Live Stream Active (3s)' : 'Stream Paused'}
          </button>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-xs font-semibold">
            {(['15m', '1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData()}
            className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-50"
            title="Refresh now"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Simulator Control Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                Semiconductor Telemetry Simulator
              </h3>
              {simulatorStatus && (
                <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                  Mode: <strong className="text-white">{simulatorStatus.mode}</strong> • {simulatorStatus.totalReadingsGenerated} Readings
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Inject drift and failure modes to evaluate threshold triggers and digital twin alerting in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Inject Mode:</span>
            {(['NORMAL', 'DEGRADING', 'CRITICAL', 'FAILURE'] as const).map((mode) => (
              <button
                key={mode}
                disabled={simModeUpdating}
                onClick={() => handleModeChange(mode)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  simulatorStatus?.mode === mode
                    ? mode === 'NORMAL'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : mode === 'DEGRADING'
                      ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                      : mode === 'CRITICAL'
                      ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                      : 'bg-red-600 text-white ring-2 ring-red-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}

            <button
              disabled={simModeUpdating}
              onClick={handleManualTick}
              className="ml-2 inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Trigger Tick
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {sensors.map((sensor) => {
          const val = sensor.lastReadingValue;
          const isCrit = sensor.healthState === 'CRITICAL';
          const isWarn = sensor.healthState === 'WARNING';

          return (
            <div
              key={sensor.id}
              className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
                isCrit
                  ? 'border-red-300 bg-red-50/20'
                  : isWarn
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 truncate">{sensor.sensorType}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                ></span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-gray-900">
                {val != null ? val.toFixed(1) : '--'}{' '}
                <span className="text-xs font-normal text-gray-500">{sensor.unit}</span>
              </div>
              <div className="mt-1 text-xs text-gray-400 truncate">
                {sensor.sensorCode}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Vibration Chart with Critical/Warning Reference Lines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Platen & Spindle Vibration</h3>
              <p className="text-xs text-gray-500">Threshold alerts: Warning at 5.0 mm/s, Critical at 8.0 mm/s</p>
            </div>
            {vibSensor?.lastReadingValue != null && (
              <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {vibSensor.lastReadingValue.toFixed(2)} mm/s
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vibReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tickFormatter={formatTimeTick} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 10 }} unit=" mm/s" />
                <Tooltip
                  labelFormatter={(lbl) => new Date(lbl).toLocaleTimeString()}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} mm/s`, 'Vibration']}
                />
                <ReferenceLine y={5.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warn 5.0', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={8.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Crit 8.0', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Vibration"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Temperature Chart with Threshold Lines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Process Temperature</h3>
              <p className="text-xs text-gray-500">Warning threshold at 75°C, Critical alarm at 85°C</p>
            </div>
            {tempSensor?.lastReadingValue != null && (
              <span className="font-mono text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                {tempSensor.lastReadingValue.toFixed(1)} °C
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tickFormatter={formatTimeTick} tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} unit=" °C" />
                <Tooltip
                  labelFormatter={(lbl) => new Date(lbl).toLocaleTimeString()}
                  formatter={(val: any) => [`${Number(val).toFixed(1)} °C`, 'Temperature']}
                />
                <ReferenceLine y={75.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warn 75°C', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={85.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Crit 85°C', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Temperature"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Motor Current Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Spindle Motor Current</h3>
              <p className="text-xs text-gray-500">Operating limit: Warning at 30A, Critical at 40A</p>
            </div>
            {curSensor?.lastReadingValue != null && (
              <span className="font-mono text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {curSensor.lastReadingValue.toFixed(1)} A
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tickFormatter={formatTimeTick} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 10 }} unit=" A" />
                <Tooltip
                  labelFormatter={(lbl) => new Date(lbl).toLocaleTimeString()}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} A`, 'Current']}
                />
                <ReferenceLine y={30.0} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={40.0} stroke="#ef4444" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Current"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Slurry / Chamber Pressure Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Process Line Pressure</h3>
              <p className="text-xs text-gray-500">Slurry flow delivery / vacuum chamber pressure</p>
            </div>
            {pressSensor?.lastReadingValue != null && (
              <span className="font-mono text-sm font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                {pressSensor.lastReadingValue.toFixed(1)} psi
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pressReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tickFormatter={formatTimeTick} tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} unit=" psi" />
                <Tooltip
                  labelFormatter={(lbl) => new Date(lbl).toLocaleTimeString()}
                  formatter={(val: any) => [`${Number(val).toFixed(1)} psi`, 'Pressure']}
                />
                <ReferenceLine y={60.0} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={75.0} stroke="#ef4444" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Pressure"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Motor RPM Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Polishing Head Rotation (RPM)</h3>
              <p className="text-xs text-gray-500">Motor rotation speed and torque stability</p>
            </div>
            {rpmSensor?.lastReadingValue != null && (
              <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {rpmSensor.lastReadingValue.toFixed(0)} RPM
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rpmReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tickFormatter={formatTimeTick} tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} unit=" RPM" />
                <Tooltip
                  labelFormatter={(lbl) => new Date(lbl).toLocaleTimeString()}
                  formatter={(val: any) => [`${Number(val).toFixed(0)} RPM`, 'Speed']}
                />
                <ReferenceLine y={2200.0} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={2500.0} stroke="#ef4444" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="RPM"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Acoustic Emission Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pad Acoustic Emission</h3>
              <p className="text-xs text-gray-500">Micro-friction and wafer contact acoustics</p>
            </div>
            {acousticSensor?.lastReadingValue != null && (
              <span className="font-mono text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                {acousticSensor.lastReadingValue.toFixed(1)} dB
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={acousticReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tickFormatter={formatTimeTick} tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} unit=" dB" />
                <Tooltip
                  labelFormatter={(lbl) => new Date(lbl).toLocaleTimeString()}
                  formatter={(val: any) => [`${Number(val).toFixed(1)} dB`, 'Acoustic']}
                />
                <ReferenceLine y={75.0} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={90.0} stroke="#ef4444" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Acoustic"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="text-right text-xs text-gray-400">
        Telemetry stream timestamp: {lastRefreshed.toLocaleTimeString()} • Powered by TimescaleDB Hypertable & Paho MQTT Ingestion
      </div>
    </div>
  );
};
export default MachineMonitoringPage;
