'use client';

import { useState, useEffect } from 'react';
import { fetchPredictions as apiFetchPredictions } from '@/lib/api/forecast';
import {
  getWeatherFromCode,
  getWindDirection,
  getLastUpdateTime,
  getPredictionLevel,
} from '@/lib/utils';
import type { DayPrediction, ForecastData } from '@/lib/types';

const MOCK_FORECASTS: ForecastData[] = [
  { date: "2025-05-26", predicted_amount: 1.4, moon_age: 18.3, weather_code: 63, temperature_max: 25.8, temperature_min: 18.6, precipitation_probability_max: 78, dominant_wind_direction: 356 },
  { date: "2025-05-27", predicted_amount: 0.1, moon_age: 19.3, weather_code: 80, temperature_max: 27.4, temperature_min: 19.2, precipitation_probability_max: 54, dominant_wind_direction: 287 },
  { date: "2025-05-28", predicted_amount: 0.6, moon_age: 20.3, weather_code: 3, temperature_max: 31.1, temperature_min: 24.2, precipitation_probability_max: 53, dominant_wind_direction: 283 },
  { date: "2025-05-29", predicted_amount: 0.8, moon_age: 21.3, weather_code: 51, temperature_max: 31, temperature_min: 21.9, precipitation_probability_max: 15, dominant_wind_direction: 63 },
  { date: "2025-05-30", predicted_amount: 1.0, moon_age: 22.3, weather_code: 63, temperature_max: 24.9, temperature_min: 23.4, precipitation_probability_max: 98, dominant_wind_direction: 120 },
  { date: "2025-05-31", predicted_amount: 1.3, moon_age: 23.3, weather_code: 80, temperature_max: 31.2, temperature_min: 23.6, precipitation_probability_max: 80, dominant_wind_direction: 224 },
  { date: "2025-06-01", predicted_amount: 1.1, moon_age: 24.3, weather_code: 63, temperature_max: 25.8, temperature_min: 24.6, precipitation_probability_max: 78, dominant_wind_direction: 356 },
];

function mapForecasts(data: ForecastData[]): DayPrediction[] {
  return data
    .map((forecast) => {
      const date = new Date(forecast.date);
      if (isNaN(date.getTime())) {
        console.error('Invalid date received from API:', forecast.date);
        return null;
      }
      return {
        date,
        level: getPredictionLevel(forecast.predicted_amount, date),
        temperature_max: forecast.temperature_max,
        temperature_min: forecast.temperature_min,
        weather: getWeatherFromCode(forecast.weather_code),
        moonAge: forecast.moon_age,
        wind_direction: getWindDirection(forecast.dominant_wind_direction),
      };
    })
    .filter((p) => p !== null) as DayPrediction[];
}

export function useForecast(mode: 'production' | 'preview') {
  const [predictions, setPredictions] = useState<DayPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchForecasts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = mode === 'preview'
          ? MOCK_FORECASTS
          : await apiFetchPredictions();
        setPredictions(mapForecasts(data));
        setLastUpdated(getLastUpdateTime());
      } catch (error) {
        console.error('Failed to fetch forecasts:', error);
        setError('データの取得に失敗しました。しばらくしてから再度お試しください。');
      } finally {
        setLoading(false);
      }
    };
    fetchForecasts();
  }, [mode]);

  return { predictions, loading, error, lastUpdated };
}
