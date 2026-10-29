export type PlantStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export type AreaStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type MachineStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'WARNING' | 'CRITICAL' | 'DECOMMISSIONED';

export type MachineCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Plant {
  id: number;
  name: string;
  code: string;
  location: string;
  description?: string;
  status: PlantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionArea {
  id: number;
  plantId: number;
  plantCode: string;
  plantName: string;
  code: string;
  name: string;
  description?: string;
  status: AreaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Machine {
  id: number;
  areaId: number;
  areaCode: string;
  areaName: string;
  plantId: number;
  plantCode: string;
  plantName: string;
  machineCode: string;
  name: string;
  machineType: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  installationDate?: string;
  status: MachineStatus;
  criticality: MachineCriticality;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantRequest {
  name: string;
  code: string;
  location: string;
  description?: string;
  status?: PlantStatus;
}

export interface UpdatePlantRequest {
  name: string;
  location: string;
  description?: string;
  status?: PlantStatus;
}

export interface CreateAreaRequest {
  name: string;
  code: string;
  description?: string;
  status?: AreaStatus;
}

export interface UpdateAreaRequest {
  name: string;
  description?: string;
  status?: AreaStatus;
}

export interface CreateMachineRequest {
  machineCode: string;
  name: string;
  machineType: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  installationDate?: string;
  status?: MachineStatus;
  criticality: MachineCriticality;
  description?: string;
}

export interface UpdateMachineRequest {
  name: string;
  machineType: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  installationDate?: string;
  criticality: MachineCriticality;
  description?: string;
}

export interface MachineStatusUpdateRequest {
  status: MachineStatus;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}
