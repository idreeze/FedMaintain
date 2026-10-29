import api from './api';
import {
  Plant,
  CreatePlantRequest,
  UpdatePlantRequest,
  ProductionArea,
  CreateAreaRequest,
  UpdateAreaRequest,
  Machine,
  CreateMachineRequest,
  UpdateMachineRequest,
  MachineStatusUpdateRequest,
  PageResponse,
  MachineStatus,
  MachineCriticality,
} from '../types/assets';

export const assetService = {
  // Plant endpoints
  getAllPlants: async (): Promise<Plant[]> => {
    const response = await api.get<Plant[]>('/api/plants');
    return response.data;
  },

  getPlantById: async (id: number): Promise<Plant> => {
    const response = await api.get<Plant>(`/api/plants/${id}`);
    return response.data;
  },

  createPlant: async (request: CreatePlantRequest): Promise<Plant> => {
    const response = await api.post<Plant>('/api/plants', request);
    return response.data;
  },

  updatePlant: async (id: number, request: UpdatePlantRequest): Promise<Plant> => {
    const response = await api.put<Plant>(`/api/plants/${id}`, request);
    return response.data;
  },

  deletePlant: async (id: number): Promise<void> => {
    await api.delete(`/api/plants/${id}`);
  },

  // Production Area endpoints
  getAreasByPlantId: async (plantId: number): Promise<ProductionArea[]> => {
    const response = await api.get<ProductionArea[]>(`/api/plants/${plantId}/areas`);
    return response.data;
  },

  getAreaById: async (id: number): Promise<ProductionArea> => {
    const response = await api.get<ProductionArea>(`/api/areas/${id}`);
    return response.data;
  },

  createArea: async (plantId: number, request: CreateAreaRequest): Promise<ProductionArea> => {
    const response = await api.post<ProductionArea>(`/api/plants/${plantId}/areas`, request);
    return response.data;
  },

  updateArea: async (id: number, request: UpdateAreaRequest): Promise<ProductionArea> => {
    const response = await api.put<ProductionArea>(`/api/areas/${id}`, request);
    return response.data;
  },

  deleteArea: async (id: number): Promise<void> => {
    await api.delete(`/api/areas/${id}`);
  },

  // Machine endpoints
  getMachines: async (params?: {
    search?: string;
    plantId?: number;
    areaId?: number;
    status?: MachineStatus;
    criticality?: MachineCriticality;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
  }): Promise<PageResponse<Machine>> => {
    const response = await api.get<PageResponse<Machine>>('/api/machines', { params });
    return response.data;
  },

  getMachineById: async (id: number): Promise<Machine> => {
    const response = await api.get<Machine>(`/api/machines/${id}`);
    return response.data;
  },

  createMachine: async (areaId: number, request: CreateMachineRequest): Promise<Machine> => {
    const response = await api.post<Machine>(`/api/areas/${areaId}/machines`, request);
    return response.data;
  },

  updateMachine: async (id: number, request: UpdateMachineRequest): Promise<Machine> => {
    const response = await api.put<Machine>(`/api/machines/${id}`, request);
    return response.data;
  },

  updateMachineStatus: async (id: number, request: MachineStatusUpdateRequest): Promise<Machine> => {
    const response = await api.patch<Machine>(`/api/machines/${id}/status`, request);
    return response.data;
  },

  decommissionMachine: async (id: number): Promise<void> => {
    await api.delete(`/api/machines/${id}`);
  },
};
