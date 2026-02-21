import type { ForecastData } from '@/lib/types';
import { apiFetch } from './client';

export async function fetchPredictions(): Promise<ForecastData[]> {
  return apiFetch<ForecastData[]>('/api/prediction');
}
