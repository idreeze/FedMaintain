import api from './api';
import { ApiResponse } from '../types/assets';
import {
  FederatedClient,
  FederatedRound,
  FederatedModel,
  FederatedMetrics,
  ModelComparison,
  StartFederatedRoundRequest,
} from '../types/federated';

export const federatedService = {
  startRound: async (request?: StartFederatedRoundRequest): Promise<FederatedRound> => {
    const res = await api.post<ApiResponse<FederatedRound>>(
      '/api/federated/rounds/start',
      request || {}
    );
    return res.data.data;
  },

  getAllRounds: async (): Promise<FederatedRound[]> => {
    const res = await api.get<ApiResponse<FederatedRound[]>>('/api/federated/rounds');
    return res.data.data;
  },

  getRoundById: async (id: number): Promise<FederatedRound> => {
    const res = await api.get<ApiResponse<FederatedRound>>(`/api/federated/rounds/${id}`);
    return res.data.data;
  },

  getAllClients: async (): Promise<FederatedClient[]> => {
    const res = await api.get<ApiResponse<FederatedClient[]>>('/api/federated/clients');
    return res.data.data;
  },

  getClientById: async (id: string): Promise<FederatedClient> => {
    const res = await api.get<ApiResponse<FederatedClient>>(`/api/federated/clients/${id}`);
    return res.data.data;
  },

  getAllModels: async (): Promise<FederatedModel[]> => {
    const res = await api.get<ApiResponse<FederatedModel[]>>('/api/federated/models');
    return res.data.data;
  },

  getModelById: async (id: number): Promise<FederatedModel> => {
    const res = await api.get<ApiResponse<FederatedModel>>(`/api/federated/models/${id}`);
    return res.data.data;
  },

  getMetrics: async (): Promise<FederatedMetrics> => {
    const res = await api.get<ApiResponse<FederatedMetrics>>('/api/federated/metrics');
    return res.data.data;
  },

  getComparison: async (): Promise<ModelComparison> => {
    const res = await api.get<ApiResponse<ModelComparison>>('/api/federated/comparison');
    return res.data.data;
  },
};
