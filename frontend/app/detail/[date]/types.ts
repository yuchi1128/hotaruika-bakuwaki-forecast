export interface HourlyWeather {
  time: string;
  temperature: number;
  precipitation: number;
  precipitation_probability: number;
  weather_code: number;
  wind_speed: number;
  wind_direction: number;
}

export interface TideData {
  moon: { age: string; title: string; };
  sun: { rise: string; set: string; }
  flood: { time:string; cm: number; }[];
  edd: { time: string; cm: number; }[];
  tide: { time: string; cm: number; }[];
}