import axios from 'axios';
import type { MapRegionData, RegionSummary, MatrixDay, EvolutionPoint, ReplayEvent, ReplayData } from './types';
import { mockMapData, mockRegionSummary, mockMatrixData, mockEvolutionData } from '../mocks/fallbackData';

const API_BASE = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

export const api = {
  async getMapData(leadDay: number = 5): Promise<MapRegionData[]> {
    try {
      const { data } = await apiClient.get<MapRegionData[]>(`/map?lead_day=${leadDay}`);
      return data.length ? data : mockMapData;
    } catch (error) {
      console.warn('API getMapData failed, using fallback data', error);
      return mockMapData;
    }
  },

  async getRegionSummary(region: string, leadDay: number = 5): Promise<RegionSummary> {
    try {
      const { data } = await apiClient.get<RegionSummary>(`/region/${region}?lead_day=${leadDay}`);
      return data;
    } catch (error) {
      console.warn('API getRegionSummary failed, using fallback data', error);
      return mockRegionSummary;
    }
  },

  async getMatrix(region: string): Promise<MatrixDay[]> {
    try {
      const { data } = await apiClient.get<MatrixDay[]>(`/matrix?region=${region}`);
      return data.length ? data : mockMatrixData;
    } catch (error) {
      console.warn('API getMatrix failed, using fallback data', error);
      return mockMatrixData;
    }
  },

  async getEvolution(region: string): Promise<EvolutionPoint[]> {
    try {
      const { data } = await apiClient.get<EvolutionPoint[]>(`/evolution/${region}`);
      return data.length ? data : mockEvolutionData;
    } catch (error) {
      console.warn('API getEvolution failed, using fallback data', error);
      return mockEvolutionData;
    }
  },

  async getReplayEvents(): Promise<ReplayEvent[]> {
    try {
      const { data } = await apiClient.get<ReplayEvent[]>('/replay/events');
      return data;
    } catch (error) {
      console.warn('API getReplayEvents failed, using fallback', error);
      return [{ region: 'Madhya Pradesh', valid_time: '2023-12-31' }];
    }
  },

  async getReplayData(region: string, validTime: string): Promise<ReplayData | null> {
    try {
      const { data } = await apiClient.get<ReplayData>(`/replay?region=${region}&valid_time=${validTime}`);
      return data;
    } catch (error) {
      console.warn('API getReplayData failed', error);
      return null; // Handle missing replay more gracefully in component
    }
  }
};
