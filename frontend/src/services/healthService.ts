import api from './api';
import { ApiResponse } from '../types/assets';
import { MachineHealth, ExplanationResponse, RecommendationResponse } from '../types/health';
import { Alert } from '../types/alerts';

export const healthService = {
  getMachineHealth: async (machineId: number): Promise<MachineHealth> => {
    const res = await api.get<ApiResponse<MachineHealth>>(`/api/machines/${machineId}/health`);
    return res.data.data;
  },

  getLatestExplanation: async (machineId: number): Promise<ExplanationResponse> => {
    const res = await api.get<ApiResponse<ExplanationResponse>>(
      `/api/machines/${machineId}/explanations/latest`
    );
    return res.data.data;
  },

  getRecommendations: async (machineId: number): Promise<RecommendationResponse> => {
    const res = await api.get<ApiResponse<RecommendationResponse>>(
      `/api/machines/${machineId}/recommendations`
    );
    return res.data.data;
  },

  getMachineAlerts: async (machineId: number): Promise<Alert[]> => {
    const res = await api.get<ApiResponse<Alert[]>>(`/api/machines/${machineId}/alerts`);
    return res.data.data;
  },
};
