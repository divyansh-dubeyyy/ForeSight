export type ReliabilityStatus = 'High' | 'Moderate' | 'Low';

export interface MapRegionData {
  region: string;
  forecast_rainfall_mm: number;
  bust_probability: number;
  reliability_status: ReliabilityStatus;
  expected_error: number;
  direction: 'Over-forecast' | 'Under-forecast';
}

export interface RegionSummary {
  region: string;
  valid_time: string;
  forecast_rainfall_mm: number;
  bust_probability: number;
  expected_error: number;
  lower_bound: number;
  upper_bound: number;
  direction: 'Over-forecast' | 'Under-forecast';
  reliability_status: ReliabilityStatus;
  model_trust: string;
}

export interface MatrixDay {
  day: number;
  forecast_rainfall_mm: number;
  reliability_status: ReliabilityStatus;
  bust_probability: number;
}

export interface EvolutionPoint {
  lead_time_hours: number;
  label: string;
  forecast_rainfall_mm: number;
}

export interface ReplayEvent {
  region: string;
  valid_time: string;
}

export interface ReplayState {
  lead_time_hours: number | string;
  issue_time?: string;
  forecast_rainfall_mm?: number;
  bust_probability?: number;
  expected_error?: number;
  direction?: string;
  lower_bound?: number;
  upper_bound?: number;
  reliability_status?: ReliabilityStatus;
  model_trust?: string;
  explanation?: any;
  evolution_history?: EvolutionPoint[];
  
  // Reveal fields
  actual_observed_rainfall_mm?: number;
  actual_error_mm?: number;
  was_bust?: boolean;
}

export interface ReplayData {
  region: string;
  valid_time: string;
  states: ReplayState[];
  reveal: ReplayState;
}
