import api from './api';
import { ApiResponse, PageResponse } from '../types/assets';
import { MachineFeature, GenerateFeaturesRequest, GenerateFeaturesResponse } from '../types/features';

export interface DataQualityReport {
  machineId: number;
  overallScore: number;
  completeness: number;
  validity: number;
  timeliness: number;
  anomalyRatio: number;
  issuesSummary: string[];
}

export const featureService = {
  getMachineFeatures: async (
    machineId: number,
    page: number = 0,
    size: number = 20,
    startTime?: string,
    endTime?: string
  ): Promise<PageResponse<MachineFeature>> => {
    const params: Record<string, any> = { page, size };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const res = await api.get<ApiResponse<PageResponse<MachineFeature>>>(
      `/api/machines/${machineId}/features`,
      { params }
    );
    return res.data.data;
  },

  getLatestFeature: async (machineId: number): Promise<MachineFeature> => {
    const res = await api.get<ApiResponse<MachineFeature>>(
      `/api/machines/${machineId}/features/latest`
    );
    return res.data.data;
  },

  generateFeatures: async (
    machineId: number,
    request?: GenerateFeaturesRequest
  ): Promise<GenerateFeaturesResponse> => {
    const res = await api.post<ApiResponse<GenerateFeaturesResponse>>(
      `/api/features/generate/${machineId}`,
      request || {}
    );
    return res.data.data;
  },

  getDataQuality: async (machineId: number): Promise<DataQualityReport> => {
    const res = await api.get<ApiResponse<DataQualityReport>>(
      `/api/machines/${machineId}/data-quality`
    );
    return res.data.data;
  },
};
