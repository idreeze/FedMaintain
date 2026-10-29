export type FederatedClientStatus = 'ACTIVE' | 'INACTIVE' | 'DROPPED';
export type FederatedRoundStatus = 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface FederatedClient {
  id: number;
  clientId: string;
  plantId?: number;
  plantCode: string;
  status: FederatedClientStatus;
  datasetSize: number;
  lastSeen: string;
  createdAt: string;
}

export interface FederatedRound {
  id: number;
  round: number;
  globalModel?: string;
  globalModelVersion?: string;
  participatingClients: number;
  trainingLoss?: number;
  mae?: number;
  rmse?: number;
  r2?: number;
  status: FederatedRoundStatus;
  startedAt: string;
  completedAt?: string;
}

export interface FederatedModel {
  id: number;
  modelName: string;
  version: string;
  roundNumber: number;
  algorithm: string;
  clientCount: number;
  sampleCount: number;
  artifactPath?: string;
  createdAt: string;
}

export interface FederatedMetrics {
  rounds: FederatedRound[];
  latestMae?: number;
  latestRmse?: number;
  latestR2?: number;
  latestTrainingLoss?: number;
  totalRounds: number;
  totalRoundsCompleted: number;
  activeClientsCount: number;
  totalClients: number;
}

export interface ModelComparison {
  centralizedModelVersion?: string;
  centralizedAlgorithm?: string;
  centralizedMae?: number;
  centralizedRmse?: number;
  centralizedR2?: number;
  federatedModelVersion?: string;
  federatedAlgorithm?: string;
  federatedMae?: number;
  federatedRmse?: number;
  federatedR2?: number;
  privacyStrategy?: string;
  evaluationMethodology?: string;
  factualSummary?: string;
}

export interface StartFederatedRoundRequest {
  participatingClientIds?: string[];
  epochsPerClient?: number;
  learningRate?: number;
  batchSize?: number;
}
