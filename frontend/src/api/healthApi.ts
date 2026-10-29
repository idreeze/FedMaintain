import api from '../services/api';
import { ActuatorHealthResponse, HealthResponse } from '../types/auth';

export interface HealthCheckResult {
  isConnected: boolean;
  latencyMs: number;
  data?: HealthResponse;
  error?: string;
}

export interface DbHealthResult {
  isConnected: boolean;
  status: string;
  error?: string;
}

export const healthApi = {
  async checkBackendHealth(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    try {
      const response = await api.get<HealthResponse>('/api/health');
      const latencyMs = Math.round(performance.now() - startTime);
      if (response.data && response.data.status === 'UP') {
        return {
          isConnected: true,
          latencyMs,
          data: response.data,
        };
      }
      return {
        isConnected: false,
        latencyMs,
        error: `Unexpected status: ${response.data?.status}`,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        isConnected: false,
        latencyMs,
        error: err.message || 'Connection refused',
      };
    }
  },

  async checkDatabaseHealth(): Promise<DbHealthResult> {
    try {
      const response = await api.get<ActuatorHealthResponse>('/actuator/health');
      const dbStatus = response.data?.components?.db?.status;
      if (dbStatus === 'UP') {
        return {
          isConnected: true,
          status: 'Connected (TimescaleDB / PostgreSQL)',
        };
      }
      return {
        isConnected: false,
        status: dbStatus || 'Disconnected',
        error: 'Database component not UP',
      };
    } catch (err: any) {
      return {
        isConnected: false,
        status: 'Disconnected',
        error: err.message || 'Unable to probe database health via actuator',
      };
    }
  },
};
