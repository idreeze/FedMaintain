export interface RulPrediction {
  id: number;
  machineId: number;
  featureId?: number;
  predictedRulHours: number;
  confidenceLower: number;
  confidenceUpper: number;
  modelVersion: string;
  healthScore: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  predictionTime: string;
  createdAt: string;
}

export interface ModelVersion {
  id: number;
  modelName: string;
  version: string;
  algorithm: string;
  trainingRounds?: number;
  mae?: number;
  rmse?: number;
  r2?: number;
  status: 'ACTIVE' | 'CANDIDATE' | 'ARCHIVED' | 'TRAINING';
  createdAt: string;
}

export interface TrainModelRequest {
  modelName?: string;
  algorithm?: string;
  epochs?: number;
}
