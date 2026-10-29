export interface SubsystemScores {
  thermal?: number;
  vibration?: number;
  electrical?: number;
  pressure?: number;
  [key: string]: number | undefined;
}

export interface MachineHealth {
  machineId: number;
  healthScore: number;
  status: 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL';
  rulHours: number;
  confidenceLower: number;
  confidenceUpper: number;
  subsystemScores: SubsystemScores;
  topContributingFactors: string[];
  calculatedAt: string;
}

export interface ExplanationItem {
  id: number;
  featureName: string;
  featureValue: number;
  baselineValue: number;
  deviationPercentage: number;
  contributionLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  direction: 'INCREASING' | 'DECREASING' | 'NEUTRAL';
}

export interface ExplanationResponse {
  predictionId: number;
  machineId: number;
  predictedRulHours: number;
  healthScore: number;
  status: string;
  explanations: ExplanationItem[];
  explanationSummary: string;
}

export interface RecommendationItem {
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedDowntimeHours: number;
  recommendedSpares: string[];
}

export interface RecommendationResponse {
  machineId: number;
  machineCode: string;
  healthScore: number;
  status: string;
  recommendations: RecommendationItem[];
}
