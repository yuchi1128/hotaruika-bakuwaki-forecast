export interface HourlyWeather {
  time: string;
  temperature: number;
  precipitation: number;
  precipitation_probability: number;
  weather_code: number;
  wind_speed: number;
  wind_direction: number;
}

// 潮汐イベント（満潮・干潮）の型
interface TideEvent {
  time: string;
  cm: number;
  isNextDay: boolean;
  fullTime: string;
}

// 潮汐グラフのデータポイントの型
interface TideChartEntry {
  time: string;
  cm: number;
  isNextDay: boolean;
  fullTime: string;
}

export interface TideData {
  moon: { age: string; title: string; };
  sun: { rise: string; set: string; }
  flood: TideEvent[];
  edd: TideEvent[];
  tide: TideChartEntry[];
}

export interface Prediction {
  date: string;
  predicted_amount: number;
  moon_age: number;
  weather_code: number;
  temperature_max: number;
  temperature_min: number;
  precipitation_probability_max: number;
  dominant_wind_direction: number;
}