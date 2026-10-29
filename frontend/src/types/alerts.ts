export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertType =
  | 'RUL_THRESHOLD_BREACH'
  | 'RAPID_DEGRADATION'
  | 'ANOMALOUS_VIBRATION'
  | 'THERMAL_RUNAWAY'
  | 'PRESSURE_SPIKE'
  | 'CURRENT_OVERLOAD';

export interface Alert {
  id: number;
  machineId: number;
  machineCode?: string;
  predictionId?: number;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  triggerValue?: number;
  thresholdValue?: number;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

export interface AlertSummary {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  openAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
}
