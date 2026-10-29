import api from './api';
import { ApiResponse, PageResponse } from '../types/assets';
import { RulPrediction, ModelVersion, TrainModelRequest } from '../types/predictions';

export const rulService = {
  predictRul: async (machineId: number): Promise<RulPrediction> => {
    const res = await api.post<ApiResponse<RulPrediction>>(`/api/ml/predict/${machineId}`);
    return res.data.data;
  },

  getLatestRul: async (machineId: number): Promise<RulPrediction> => {
    const res = await api.get<ApiResponse<RulPrediction>>(`/api/machines/${machineId}/rul/latest`);
    return res.data.data;
  },

  getHistoricalRul: async (
    machineId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<RulPrediction>> => {
    const res = await api.get<ApiResponse<PageResponse<RulPrediction>>>(
      `/api/machines/${machineId}/rul`,
      { params: { page, size } }
    );
    return res.data.data;
  },

  getRecentRul: async (machineId: number): Promise<RulPrediction[]> => {
    const res = await api.get<ApiResponse<RulPrediction[]>>(`/api/machines/${machineId}/rul/recent`);
    return res.data.data;
  },

  getAllModels: async (): Promise<ModelVersion[]> => {
    const res = await api.get<ApiResponse<ModelVersion[]>>('/api/ml/models');
    return res.data.data;
  },

  getActiveModel: async (): Promise<ModelVersion> => {
    const res = await api.get<ApiResponse<ModelVersion>>('/api/ml/models/active');
    return res.data.data;
  },

  trainModel: async (request?: TrainModelRequest): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/api/ml/train/rul', request || {});
    return res.data.data;
  },
};
