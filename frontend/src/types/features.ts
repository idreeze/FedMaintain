export interface MachineFeature {
  id: number;
  machineId: number;
  windowStart: string;
  windowEnd: string;
  sampleCount: number;
  temperatureMean: number;
  temperatureStd: number;
  temperatureMax: number;
  temperatureTrend: number;
  vibrationMean: number;
  vibrationStd: number;
  vibrationRms: number;
  vibrationMax: number;
  currentMean: number;
  currentStd: number;
  currentTrend: number;
  pressureMean: number;
  pressureStd: number;
  pressureMax: number;
  rpmMean: number;
  rpmStd: number;
  acousticMean: number;
  acousticRms: number;
  acousticMax: number;
  runId?: string;
  createdAt: string;
}

export interface GenerateFeaturesRequest {
  windowSizeSeconds?: number;
  stepSizeSeconds?: number;
  startTime?: string;
  endTime?: string;
}

export interface GenerateFeaturesResponse {
  machineId: number;
  featuresGenerated: number;
  windowSizeSeconds: number;
  stepSizeSeconds: number;
  message: string;
}
