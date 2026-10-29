import api from './api';
import {
  Sensor,
  SensorReading,
  MachineLatestReadingsResponse,
  TelemetrySummaryResponse,
  DashboardStats,
  SimulatorStatus,
} from '../types/telemetry';

export const telemetryService = {
  // Sensor endpoints
  getSensorsByMachineId: async (machineId: number): Promise<Sensor[]> => {
    const response = await api.get<Sensor[]>(`/api/machines/${machineId}/sensors`);
    return response.data;
  },

  getSensorById: async (id: number): Promise<Sensor> => {
    const response = await api.get<Sensor>(`/api/sensors/${id}`);
    return response.data;
  },

  // Telemetry readings
  getReadingsBySensor: async (
    sensorId: number,
    params?: { start?: string; end?: string; limit?: number }
  ): Promise<SensorReading[]> => {
    const response = await api.get<SensorReading[]>(`/api/sensors/${sensorId}/readings`, { params });
    return response.data;
  },

  getReadingsByMachine: async (
    machineId: number,
    params?: { start?: string; end?: string; limit?: number }
  ): Promise<SensorReading[]> => {
    const response = await api.get<SensorReading[]>(`/api/machines/${machineId}/readings`, { params });
    return response.data;
  },

  getLatestReadingBySensor: async (sensorId: number): Promise<SensorReading | null> => {
    const response = await api.get<SensorReading>(`/api/sensors/${sensorId}/latest`);
    return response.data;
  },

  getLatestReadingsByMachine: async (machineId: number): Promise<MachineLatestReadingsResponse> => {
    const response = await api.get<MachineLatestReadingsResponse>(`/api/machines/${machineId}/latest-readings`);
    return response.data;
  },

  getTelemetrySummary: async (machineId: number): Promise<TelemetrySummaryResponse> => {
    const response = await api.get<TelemetrySummaryResponse>(`/api/machines/${machineId}/telemetry/summary`);
    return response.data;
  },

  // Dashboard Aggregates
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  },

  // Simulator Control
  getSimulatorStatus: async (): Promise<SimulatorStatus> => {
    const response = await api.get<SimulatorStatus>('/api/simulator/status');
    return response.data;
  },

  setSimulatorMode: async (mode: 'NORMAL' | 'DEGRADING' | 'CRITICAL' | 'FAILURE'): Promise<void> => {
    await api.post(`/api/simulator/mode/${mode}`);
  },

  startSimulator: async (): Promise<void> => {
    await api.post('/api/simulator/start');
  },

  stopSimulator: async (): Promise<void> => {
    await api.post('/api/simulator/stop');
  },

  triggerSimulatorTick: async (): Promise<void> => {
    await api.post('/api/simulator/tick');
  },
};
