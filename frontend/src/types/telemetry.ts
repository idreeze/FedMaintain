export type SensorType =
  | 'TEMPERATURE'
  | 'VIBRATION'
  | 'CURRENT'
  | 'PRESSURE'
  | 'RPM'
  | 'ACOUSTIC'
  | 'FLOW_RATE'
  | 'VOLTAGE'
  | 'HUMIDITY'
  | 'OTHER';

export type SensorStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'FAULT';

export type SensorHealthState = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export type ReadingQuality = 'GOOD' | 'WARNING' | 'BAD';

export interface Sensor {
  id: number;
  machineId: number;
  machineCode: string;
  sensorCode: string;
  name: string;
  sensorType: SensorType;
  unit: string;
  samplingIntervalMs: number;
  status: SensorStatus;
  minOperatingValue?: number;
  maxOperatingValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  lastReadingTime?: string;
  lastReadingValue?: number;
  healthState: SensorHealthState;
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  time: string;
  sensorId: number;
  machineId: number;
  value: number;
  quality: ReadingQuality;
}

export interface LatestReadingItem {
  sensorCode: string;
  sensorType: SensorType;
  value: number | null;
  unit: string;
  timestamp: string | null;
  quality: ReadingQuality;
  status: SensorHealthState;
}

export interface MachineLatestReadingsResponse {
  machineId: number;
  machineCode: string;
  readings: LatestReadingItem[];
}

export interface SensorSummaryMetric {
  sensorCode: string;
  current: number | null;
  average: number;
  minimum: number;
  maximum: number;
  unit: string;
  latestTimestamp: string | null;
  status: SensorHealthState;
}

export interface TelemetrySummaryResponse {
  machineId: number;
  machineCode: string;
  sensors: Record<string, SensorSummaryMetric>;
}

export interface DashboardStats {
  totalPlants: number;
  totalAreas: number;
  totalMachines: number;
  activeMachines: number;
  maintenanceMachines: number;
  warningMachines: number;
  criticalMachines: number;
  decommissionedMachines: number;
  totalSensors: number;
  activeSensors: number;
  normalSensors: number;
  warningSensors: number;
  criticalSensors: number;
  offlineSensors: number;
}

export interface SimulatorStatus {
  running: boolean;
  mode: 'NORMAL' | 'DEGRADING' | 'CRITICAL' | 'FAILURE';
  totalTicks: number;
  totalReadingsGenerated: number;
}
