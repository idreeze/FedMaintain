export type DigitalTwinStatus = 'ACTIVE' | 'INACTIVE' | 'SYNCING' | 'ERROR';

export type MachineOperatingState =
  | 'NORMAL'
  | 'DEGRADING'
  | 'WARNING'
  | 'CRITICAL'
  | 'FAILURE'
  | 'MAINTENANCE'
  | 'OFFLINE';

export type SensorTrend = 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN';

export interface DigitalTwinSummary {
  id: number;
  twinCode: string;
  machineId: number;
  machineCode: string;
  machineName: string;
  machineType: string;
  operatingState: MachineOperatingState;
  healthScore: number | null;
  rulHours: number | null;
  openAlertsCount: number;
  lastSyncTime: string | null;
  status: DigitalTwinStatus;
}

export interface DigitalTwinState {
  id: number;
  digitalTwinId: number;
  machineId?: number;
  operatingState: MachineOperatingState;
  temperature?: number | null;
  vibration?: number | null;
  current?: number | null;
  pressure?: number | null;
  rpm?: number | null;
  acoustic?: number | null;
  healthScore: number | null;
  healthStatus?: string | null;
  healthState?: string | null;
  rulHours: number | null;
  rulStatus?: string | null;
  rulConfidence?: number | null;
  activeAlertCount?: number;
  openAlertsCount?: number;
  criticalAlertsCount?: number;
  warningAlertsCount?: number;
  lastTelemetryTimestamp: string | null;
  lastPredictionTimestamp?: string | null;
  latestFeatureTimestamp?: string | null;
  activeRecommendations?: string | null;
  lastSyncTime?: string | null;
  stateExplanation?: string | null;
  updatedAt?: string;
}

export interface DigitalTwinDetail {
  id: number;
  twinCode: string;
  machineId: number;
  machineCode: string;
  machineName: string;
  machineType: string;
  plantCode?: string;
  plantName: string;
  areaName: string;
  status: DigitalTwinStatus;
  state?: DigitalTwinState | null;
  currentState?: DigitalTwinState | null;
  createdAt: string;
  updatedAt: string;
  lastSynchronizedAt?: string | null;
  federatedModelVersion: string | null;
}

export interface DigitalTwinSensorView {
  sensorId: number;
  sensorCode: string;
  sensorType: string;
  value: number | null;
  unit: string;
  status: string;
  timestamp: string | null;
  trend: SensorTrend;
}

export interface DigitalTwinTimelineEvent {
  timestamp: string;
  eventType: 'STATE_CHANGE' | 'ALERT_CREATED' | 'ALERT_ACKNOWLEDGED' | 'ALERT_RESOLVED' | 'RUL_CHANGE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
}

export interface DigitalTwinHistory {
  id: number;
  digitalTwinId: number;
  timestamp: string;
  operatingState: MachineOperatingState;
  healthScore: number | null;
  rulHours: number | null;
  openAlertsCount: number;
  stateReason: string;
}
