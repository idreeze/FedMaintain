import api from './api';
import { ApiResponse, PageResponse } from '../types/assets';
import {
  DigitalTwinSummary,
  DigitalTwinDetail,
  DigitalTwinState,
  DigitalTwinSensorView,
  DigitalTwinTimelineEvent,
  DigitalTwinHistory,
} from '../types/digitalTwin';

export const digitalTwinService = {
  getDigitalTwins: async (): Promise<DigitalTwinSummary[]> => {
    const res = await api.get<ApiResponse<DigitalTwinSummary[]>>('/api/digital-twins');
    return res.data.data;
  },

  getDigitalTwinById: async (id: number): Promise<DigitalTwinDetail> => {
    const res = await api.get<ApiResponse<DigitalTwinDetail>>(`/api/digital-twins/${id}`);
    return res.data.data;
  },

  getDigitalTwinByMachineId: async (machineId: number): Promise<DigitalTwinDetail> => {
    const res = await api.get<ApiResponse<DigitalTwinDetail>>(`/api/digital-twins/machine/${machineId}`);
    return res.data.data;
  },

  syncDigitalTwin: async (machineId: number): Promise<DigitalTwinState> => {
    const res = await api.post<ApiResponse<DigitalTwinState>>(`/api/digital-twins/${machineId}/sync`);
    return res.data.data;
  },

  getDigitalTwinSensors: async (id: number): Promise<DigitalTwinSensorView[]> => {
    const res = await api.get<ApiResponse<DigitalTwinSensorView[]>>(`/api/digital-twins/${id}/sensors`);
    return res.data.data;
  },

  getDigitalTwinTimeline: async (id: number): Promise<DigitalTwinTimelineEvent[]> => {
    const res = await api.get<ApiResponse<DigitalTwinTimelineEvent[]>>(`/api/digital-twins/${id}/timeline`);
    return res.data.data;
  },

  getDigitalTwinHistory: async (id: number, page = 0, size = 20): Promise<PageResponse<DigitalTwinHistory>> => {
    const res = await api.get<ApiResponse<PageResponse<DigitalTwinHistory>>>(`/api/digital-twins/${id}/history`, {
      params: { page, size },
    });
    return res.data.data;
  },
};
