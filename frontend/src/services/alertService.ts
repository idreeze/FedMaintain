import api from './api';
import { ApiResponse, PageResponse } from '../types/assets';
import { Alert, AlertSummary, AlertSeverity, AlertStatus, AlertType } from '../types/alerts';

export interface AlertFilterParams {
  machineId?: number;
  status?: AlertStatus;
  severity?: AlertSeverity;
  alertType?: AlertType;
  page?: number;
  size?: number;
}

export const alertService = {
  getAlerts: async (params?: AlertFilterParams): Promise<PageResponse<Alert>> => {
    const res = await api.get<ApiResponse<PageResponse<Alert>>>('/api/alerts', {
      params,
    });
    return res.data.data;
  },

  getAlertSummary: async (): Promise<AlertSummary> => {
    const res = await api.get<ApiResponse<AlertSummary>>('/api/alerts/summary');
    return res.data.data;
  },

  getAlertById: async (id: number): Promise<Alert> => {
    const res = await api.get<ApiResponse<Alert>>(`/api/alerts/${id}`);
    return res.data.data;
  },

  acknowledgeAlert: async (id: number): Promise<Alert> => {
    const res = await api.post<ApiResponse<Alert>>(`/api/alerts/${id}/acknowledge`);
    return res.data.data;
  },

  resolveAlert: async (id: number): Promise<Alert> => {
    const res = await api.post<ApiResponse<Alert>>(`/api/alerts/${id}/resolve`);
    return res.data.data;
  },
};
