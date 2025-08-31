import { type ReactNode } from 'react';
import { Sun, Moon, Cloudy, CloudRain, Snowflake } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// 月ごとの大まかな日の出・日の入り時刻
export const monthlyDaylightHours = [
  { month: 0, start: 7, end: 17 }, // 1月
  { month: 1, start: 7, end: 18 }, // 2月
  { month: 2, start: 6, end: 18 }, // 3月
  { month: 3, start: 5, end: 19 }, // 4月
  { month: 4, start: 5, end: 19 }, // 5月
  { month: 5, start: 4, end: 20 }, // 6月
  { month: 6, start: 5, end: 20 }, // 7月
  { month: 7, start: 5, end: 19 }, // 8月
  { month: 8, start: 6, end: 18 }, // 9月
  { month: 9, start: 6, end: 17 }, // 10月
  { month: 10, start: 7, end: 17 }, // 11月
  { month: 11, start: 7, end: 17 }, // 12月
];

export const getWeatherInfo = (code: number, time: string): { description: string; Icon: LucideIcon; className: string } => {
  const date = new Date(time);
  const hour = date.getHours();
  const month = date.getMonth();

  const daylight = monthlyDaylightHours[month];
  const isDay = hour >= daylight.start && hour < daylight.end;

  if (code <= 1) {
    return { description: '晴れ', Icon: isDay ? Sun : Moon, className: isDay ? 'text-yellow-300' : 'text-white' };
  }
  if (code <= 3) {
    return { description: '曇り', Icon: Cloudy, className: 'text-slate-400' };
  }
  if (code >= 45 && code <= 48) return { description: '霧', Icon: Cloudy, className: 'text-slate-500' };
  if (code >= 51 && code <= 65) return { description: '雨', Icon: CloudRain, className: 'text-blue-300' };
  if (code >= 66 && code <= 67) return { description: 'みぞれ', Icon: CloudRain, className: 'text-blue-300' };
  if (code >= 71 && code <= 77) return { description: '雪', Icon: Snowflake, className: 'text-white' };
  if (code >= 80 && code <= 82) return { description: 'にわか雨', Icon: CloudRain, className: 'text-blue-300' };
  if (code >= 95 && code <= 99) return { description: '雷雨', Icon: CloudRain, className: 'text-blue-300' };
  
  return { description: '不明', Icon: Cloudy, className: 'text-slate-400' };
};

export const getWindDirection = (degrees: number): string => {
  const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const getMoonPhaseIcon = (age: number): ReactNode => {
  if (age < 1.8456 || age >= 27.684) return '🌑'; // New Moon (新月)
  if (age < 5.5368) return '🌒'; // Waxing Crescent (三日月)
  if (age < 9.228) return '🌓'; // First Quarter (上弦の月)
  if (age < 12.9192) return '🌔'; // Waxing Gibbous
  if (age < 16.6104) return '🌕'; // Full Moon (満月)
  if (age < 20.3016) return '🌖'; // Waning Gibbous
  if (age < 23.9928) return '🌗'; // Last Quarter (下弦の月)
  if (age < 27.684) return '🌘'; // Waning Crescent (有明月)
  return '🌑'; // デフォルト
};

export function niceNum(range: number, round: boolean) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * Math.pow(10, exponent);
}

export function getNiceTicks(minIn: number, maxIn: number, targetCount = 6) {
  let min = Math.min(minIn, maxIn);
  let max = Math.max(minIn, maxIn);

  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) {
    const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(max) || 1)));
    const step = mag || 1;
    const ticks = [max - 2 * step, max - step, max, max + step, max + 2 * step];
    return ticks.sort((a, b) => a - b);
  }

  const range = niceNum(max - min, false);
  const step = niceNum(range / (targetCount - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  const roundTo = (v: number) => parseFloat(v.toFixed(decimals));

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(roundTo(v));
  }
  return ticks;
}