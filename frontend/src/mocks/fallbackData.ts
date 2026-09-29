import type { MapRegionData, RegionSummary, MatrixDay, EvolutionPoint } from '../api/types';

export const mockMapData: MapRegionData[] = [
  {
    region: 'Madhya Pradesh',
    forecast_rainfall_mm: 82,
    bust_probability: 0.78,
    reliability_status: 'Low',
    expected_error: 31,
    direction: 'Under-forecast',
  },
  {
    region: 'Maharashtra',
    forecast_rainfall_mm: 45,
    bust_probability: 0.25,
    reliability_status: 'Moderate',
    expected_error: 12,
    direction: 'Over-forecast',
  },
  {
    region: 'Kerala',
    forecast_rainfall_mm: 120,
    bust_probability: 0.15,
    reliability_status: 'High',
    expected_error: 15,
    direction: 'Under-forecast',
  }
];

export const mockRegionSummary: RegionSummary = {
  region: 'Madhya Pradesh',
  valid_time: '2026-08-06 00:00:00',
  forecast_rainfall_mm: 82,
  bust_probability: 0.78,
  expected_error: 31,
  lower_bound: 51,
  upper_bound: 113,
  direction: 'Under-forecast',
  reliability_status: 'Low',
  model_trust: 'Moderate',
};

export const mockMatrixData: MatrixDay[] = [
  { day: 1, forecast_rainfall_mm: 14, reliability_status: 'High', bust_probability: 0.1 },
  { day: 2, forecast_rainfall_mm: 18, reliability_status: 'High', bust_probability: 0.12 },
  { day: 3, forecast_rainfall_mm: 24, reliability_status: 'High', bust_probability: 0.15 },
  { day: 4, forecast_rainfall_mm: 36, reliability_status: 'Moderate', bust_probability: 0.25 },
  { day: 5, forecast_rainfall_mm: 82, reliability_status: 'Low', bust_probability: 0.78 },
  { day: 6, forecast_rainfall_mm: 96, reliability_status: 'Low', bust_probability: 0.85 },
  { day: 7, forecast_rainfall_mm: 74, reliability_status: 'Low', bust_probability: 0.65 },
  { day: 8, forecast_rainfall_mm: 52, reliability_status: 'Moderate', bust_probability: 0.35 },
  { day: 9, forecast_rainfall_mm: 28, reliability_status: 'High', bust_probability: 0.18 },
  { day: 10, forecast_rainfall_mm: 16, reliability_status: 'High', bust_probability: 0.1 },
];

export const mockEvolutionData: EvolutionPoint[] = [
  { lead_time_hours: 216, label: 'T-216h', forecast_rainfall_mm: 42 },
  { lead_time_hours: 192, label: 'T-192h', forecast_rainfall_mm: 45 },
  { lead_time_hours: 168, label: 'T-168h', forecast_rainfall_mm: 44 },
  { lead_time_hours: 144, label: 'T-144h', forecast_rainfall_mm: 48 },
  { lead_time_hours: 120, label: 'T-120h', forecast_rainfall_mm: 56 },
  { lead_time_hours: 96, label: 'T-96h', forecast_rainfall_mm: 65 },
  { lead_time_hours: 72, label: 'T-72h', forecast_rainfall_mm: 72 },
  { lead_time_hours: 48, label: 'T-48h', forecast_rainfall_mm: 81 },
  { lead_time_hours: 24, label: 'T-24h', forecast_rainfall_mm: 95 },
  { lead_time_hours: 0, label: 'Current', forecast_rainfall_mm: 107 },
];
