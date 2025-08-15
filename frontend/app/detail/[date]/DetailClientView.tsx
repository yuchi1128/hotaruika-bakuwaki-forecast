'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Waves, Thermometer, Wind, Sun, Moon, Droplet, CloudRain, Snowflake, ArrowUp, ArrowDown, Cloudy, MapPin, Navigation } from 'lucide-react';
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceDot,
  ReferenceArea,
  ReferenceLine,
  Label,
  Area,
} from 'recharts';
import type { HourlyWeather, TideData } from './types';

// 月ごとの大まかな日の出・日の入り時刻
const monthlyDaylightHours = [
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

// --- ユーティリティ関数 ---
const getWeatherFromCode = (code: number, time: string): { description: string; icon: React.ReactNode } => {
  const date = new Date(time);
  const hour = date.getHours();
  const month = date.getMonth();

  const daylight = monthlyDaylightHours[month];
  const isDay = hour >= daylight.start && hour < daylight.end;

  if (code <= 1) {
    return { description: '晴れ', icon: isDay ? <Sun className="w-8 h-8 text-yellow-300" /> : <Moon className="w-8 h-8 text-yellow-200" /> };
  }
  if (code <= 3) {
    return { description: '曇り', icon: <Cloudy className="w-8 h-8 text-slate-400" /> };
  }
  if (code >= 45 && code <= 48) return { description: '霧', icon: <Cloudy className="w-8 h-8 text-slate-500" /> };
  if (code >= 51 && code <= 65) return { description: '雨', icon: <CloudRain className="w-8 h-8 text-blue-300" /> };
  if (code >= 66 && code <= 67) return { description: 'みぞれ', icon: <CloudRain className="w-8 h-8 text-blue-300" /> };
  if (code >= 71 && code <= 77) return { description: '雪', icon: <Snowflake className="w-8 h-8 text-white" /> };
  if (code >= 80 && code <= 82) return { description: 'にわか雨', icon: <CloudRain className="w-8 h-8 text-blue-300" /> };
  if (code >= 95 && code <= 99) return { description: '雷雨', icon: <CloudRain className="w-8 h-8 text-blue-300" /> };
  
  return { description: '不明', icon: <Cloudy className="w-8 h-8 text-slate-400" /> };
};

const getWindDirection = (degrees: number): string => {
  const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getMoonPhaseIcon = (age: number): React.ReactNode => {
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


function niceNum(range: number, round: boolean) {
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

function getNiceTicks(minIn: number, maxIn: number, targetCount = 6) {
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

function WeatherTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload as {
    index: number;
    hour: number;
    temperature: number;
    precipitation: number;
  };
  const tempEntry = payload.find((p) => p.dataKey === 'temperature');
  const precEntry = payload.find((p) => p.dataKey === 'precipitation');
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur-md p-3 shadow-xl">
      <div className="mb-2 text-sm text-slate-300">{`${d.hour}時`}</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: tempEntry?.color || '#fbbf24' }} />
          <span className="text-slate-200 text-sm">気温</span>
          <span className="font-semibold text-amber-300">
            {(tempEntry?.value as number)?.toFixed?.(1) ?? d.temperature.toFixed(1)}℃
          </span>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: precEntry?.color || '#60a5fa' }} />
          <span className="text-slate-200 text-sm">降水量</span>
          <span className="font-semibold text-sky-300">
            {(precEntry?.value as number)?.toFixed?.(1) ?? d.precipitation.toFixed(1)}mm
          </span>
        </div>
      </div>
    </div>
  );
}

function TideTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload as { time: string; level: number };
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur-md p-3 shadow-xl">
      <div className="mb-2 text-sm text-slate-300">{label ? `${Number(label.split(':')[0])}時` : ''}</div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
        <span className="text-slate-200 text-sm">潮位</span>
        <span className="font-semibold text-sky-300">{d.level}cm</span>
      </div>
    </div>
  );
}

interface DetailClientViewProps {
  date: string;
  weather: HourlyWeather[];
  tide: TideData;
}

export default function DetailClientView({ date, weather, tide }: DetailClientViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoverWeatherX, setHoverWeatherX] = useState<number | null>(null);
  const [hoverTideX, setHoverTideX] = useState<string | null>(null);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const router = useRouter();
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const helpDateObj = new Date(date);
  const helpNextDateObj = new Date(helpDateObj);
  helpNextDateObj.setDate(helpDateObj.getDate() + 1);

  const formatDateForHelp = (d: Date) => d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  
  const helpDate = formatDateForHelp(helpDateObj);
  const helpNextDate = formatDateForHelp(helpNextDateObj);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isTodayPage = date === todayStr;

  const weatherChartData = weather.map((w, index) => ({
    index,
    hour: new Date(w.time).getHours(),
    temperature: w.temperature,
    precipitation: w.precipitation,
  }));

  const weatherTicks = useMemo(() => {
    const step = isMobile ? 4 : 2;
    const ticks: number[] = [];
    for (let i = 0; i < weatherChartData.length; i++) {
      const h = weatherChartData[i]?.hour;
      if (typeof h === 'number' && h % step === 0) ticks.push(i);
    }
    const lastIdx = Math.max(0, weatherChartData.length - 1);
    if (lastIdx >= 0 && !ticks.includes(0)) ticks.unshift(0);
    if (lastIdx >= 0 && !ticks.includes(lastIdx)) ticks.push(lastIdx);
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [isMobile, weatherChartData]);

  const xAxisTickFormatter = (index: number) => {
    const dataPoint = weatherChartData[index];
    if (dataPoint) return `${dataPoint.hour}時`;
    return '';
  };

  const weatherTempTicks = useMemo(() => {
    const temps = weather.map((w) => w.temperature);
    if (temps.length === 0) return [];
    const min = Math.min(...temps) - 2;
    const max = Math.max(...temps) + 2;
    return getNiceTicks(min, max, isMobile ? 5 : 8);
  }, [weather, isMobile]);

  const weatherPrecipTicks = useMemo(() => {
    const precs = weather.map((w) => w.precipitation);
    const maxVal = precs.length ? Math.max(...precs) + 2 : 0;
    const min = 0;
    const max = Math.max(min, maxVal);
    const ticks = getNiceTicks(min, max, isMobile ? 5 : 8);
    const filtered = ticks.filter((t) => t >= 0);
    if (!filtered.includes(0)) filtered.unshift(0);
    return Array.from(new Set(filtered)).sort((a, b) => a - b);
  }, [weather, isMobile]);

  let currentDecimalIndex = -1;
  if (isTodayPage && weather.length > 0) {
    const startTime = new Date(weather[0].time).getTime();
    const nowTime = now.getTime();
    const lastTime = new Date(weather[weather.length - 1].time).getTime();
    if (nowTime >= startTime && nowTime <= lastTime) {
      const diffInMillis = nowTime - startTime;
      const diffInHours = diffInMillis / (1000 * 60 * 60);
      currentDecimalIndex = diffInHours;
    }
  }

  const tideChartData = tide.tide.map((t) => ({
    time: t.time,
    level: t.cm,
  }));

  const tideTicks = useMemo(() => {
    const step = isMobile ? 4 : 2;
    const hourPick: Record<number, string | undefined> = {};
    for (const d of tideChartData) {
      const [hStr, mStr] = d.time.split(':');
      const h = Number(hStr);
      const m = Number(mStr);
      if (hourPick[h] === undefined || m === 0) {
        hourPick[h] = d.time;
      }
    }
    const ticks: string[] = [];
    for (let h = 0; h < 24; h += step) {
      if (hourPick[h]) ticks.push(hourPick[h]!);
    }
    const first = tideChartData[0]?.time;
    const last = tideChartData[tideChartData.length - 1]?.time;
    if (first && !ticks.includes(first)) ticks.unshift(first);
    if (last && !ticks.includes(last)) ticks.push(last);
    return Array.from(new Set(ticks));
  }, [isMobile, tideChartData]);

  const tideYTicks = useMemo(() => {
    const levels = tideChartData.map((d) => d.level);
    if (levels.length === 0) return [];
    const min = Math.min(...levels) - 10;
    const max = Math.max(...levels) + 10;
    return getNiceTicks(min, max, isMobile ? 5 : 6);
  }, [tideChartData, isMobile]);

  const tideReferenceAreas: React.ReactNode[] = [];
  let currentTideTimeX: string | null = null;
  if (isTodayPage) {
    for (let i = tideChartData.length - 1; i >= 0; i--) {
      const [hour, minute] = tideChartData[i].time.split(':').map(Number);
      const pointDate = new Date(date);
      pointDate.setHours(hour, minute, 0, 0);
      if (pointDate < now) {
        currentTideTimeX = tideChartData[i].time;
        break;
      }
    }
    for (let i = 0; i < tideChartData.length - 1; i++) {
      const segmentEndTimeStr = tideChartData[i + 1].time;
      const [hour, minute] = segmentEndTimeStr.split(':').map(Number);
      const segmentEndDate = new Date(date);
      segmentEndDate.setHours(hour, minute, 0, 0);
      if (segmentEndDate < now) {
        tideReferenceAreas.push(
          <ReferenceArea
            key={`tide-area-${i}`}
            x1={tideChartData[i].time}
            x2={tideChartData[i + 1].time}
            stroke="none"
            fill="#64748b"
            fillOpacity={0.2}
          />
        );
      } else { break; }
    }
  }

  const renderLegendWithUnit = (value: string, entry: any) => {
    const { color } = entry;
    const unit = value === '気温' ? '(℃)' : '(mm)';
    return <span style={{ color }}>{`${value} ${unit}`}</span>;
  };
  
  const moonAgeValue = useMemo(() => parseFloat(tide.moon.age), [tide.moon.age]);


  return (
    <div className="min-h-screen relative z-10 p-4 sm:p-4 md:p-6 max-w-7xl mx-auto text-white safe-area">
      <header className="mb-4 sm:mb-6">
        <Button onClick={() => router.back()} variant="ghost" className="mb-2 text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Calendar className="text-blue-300" />
            {formattedDate}
          </h1>
          <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
            <DialogTrigger asChild>
              <button className="text-blue-300 hover:text-blue-100 transition-colors" aria-label="このページの説明を見る">
                <HelpCircle className="w-6 h-6" />
              </button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md bg-slate-800/80 border-blue-500/50 text-white shadow-lg backdrop-blur-md rounded-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-blue-200">
                  <HelpCircle className="w-5 h-5" />
                  <span>このページの見方</span>
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2 space-y-5 py-2 text-sm">
                <div className="flex items-start gap-3">
                  <Thermometer className="w-6 h-6 mt-1 text-blue-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">気象情報</h4>
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-white">{helpDate} 0時</strong> から <strong className="text-white">{helpNextDate} 4時</strong> までの28時間予報です。<br />
                      現在より過去は<strong className="text-amber-300">実績値</strong>、未来は<strong className="text-sky-300">予報値</strong>となります。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Waves className="w-6 h-6 mt-1 text-purple-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">潮汐情報</h4>
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-white">{helpDate}</strong> の1日分（0時〜24時）の潮位グラフです。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 mt-1 text-green-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">対象エリア</h4>
                    <ul className="text-slate-300 space-y-1">
                      <li><span className="font-semibold">気象：</span> 富山県 富山市</li>
                      <li><span className="font-semibold">潮汐：</span> 富山県 岩瀬浜付近</li>
                    </ul>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <main className="space-y-6 sm:space-y-8 pb-4 sm:pb-8">
        <div>
          <CardTitle className="text-lg sm:text-xl text-blue-100 mb-3 ml-1">時間ごとの予報</CardTitle>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <div className="flex">
              {weather.map((w, i) => {
                const itemDate = new Date(w.time);
                const hour = itemDate.getHours();
                const month = itemDate.getMonth();

                const daylight = monthlyDaylightHours[month];
                const isDay = hour >= daylight.start && hour < daylight.end;

                const nowHourStart = new Date(now);
                nowHourStart.setMinutes(0, 0, 0);

                const isPast = isTodayPage && itemDate < nowHourStart;

                const isCurrentHour =
                  isTodayPage &&
                  now >= itemDate &&
                  now < new Date(itemDate.getTime() + 60 * 60 * 1000);

                const windIndex = Math.round(w.wind_direction / 22.5) % 16;
                const roundedDegrees = windIndex * 22.5;

                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 w-20 sm:w-24 flex flex-col items-center justify-around p-2 sm:p-3 text-center h-48 sm:h-52 border-r border-white/10 last:border-r-0 transition-all duration-300 backdrop-blur-sm
                      ${isPast ? 'opacity-50' : ''}
                      ${isDay ? 'bg-sky-900/40 border-t-sky-500/70' : 'bg-slate-950/40 border-t-indigo-500/70'}
                      border-t-4`}
                  >
                    {/* 時刻＋現在バッジ */}
                    <div className="flex flex-col items-center justify-end h-8 pb-1">
                      {isCurrentHour && (
                        <p className="relative top-1 text-[11px] font-semibold text-red-300">現在</p>
                      )}
                      <p className={`font-semibold text-sm sm:text-lg ${isDay ? 'text-sky-100' : 'text-slate-300'}`}>
                        {itemDate.toLocaleTimeString('ja-JP', { hour: 'numeric' })}
                      </p>
                    </div>

                    {/* 天気アイコン */}
                    <div className="my-1 sm:my-2">
                      {getWeatherFromCode(w.weather_code, w.time).icon}
                    </div>

                    {/* 気温 */}
                    <p className="font-bold text-lg sm:text-xl">{w.temperature.toFixed(1)}℃</p>

                    {/* 降水量 */}
                    <div className="text-xs text-slate-300 flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-blue-400" />
                      <span>{w.precipitation.toFixed(1)}mm</span>
                    </div>

                    {/* 風速・風向 */}
                    <div className="flex flex-col items-center gap-1 text-xs text-slate-300">
                      <div className="flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                        <span>{w.wind_speed.toFixed(1)}m/s</span>
                      </div>
                      <Navigation
                        className="w-4 h-4 text-slate-400"
                        style={{ transform: `rotate(${roundedDegrees - 45 + 180}deg)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-slate-900/40 border-blue-500/20 h-full">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-blue-200 text-lg sm:text-xl lg:text-2xl">
                  <Thermometer /> 気温 & 降水量
                </CardTitle>
              </CardHeader>
              <CardContent className={`p-2 sm:p-0 sm:pt-2 transition-all duration-300 ${isMobile ? 'h-[280px]' : 'h-[400px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={weatherChartData}
                    margin={isMobile ? { top: 5, right: 8, left: 0, bottom: 5 } : { top: 5, right: 10, left: 0, bottom: 5 }}
                    onMouseMove={(state: any) => {
                      if (state && state.activeLabel !== undefined && state.activeLabel !== null) {
                        setHoverWeatherX(state.activeLabel as number);
                      }
                    }}
                    onMouseLeave={() => setHoverWeatherX(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="index"
                      tickFormatter={xAxisTickFormatter}
                      tick={{ fill: '#9ca3af' }}
                      fontSize={isMobile ? 10 : 12}
                      type="number"
                      ticks={weatherTicks}
                      domain={[0, Math.max(0, weatherChartData.length - 1)]}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke="#fbbf24"
                      tick={{ fill: '#fbbf24', fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 35 : 35}
                      ticks={weatherTempTicks}
                      domain={
                        weatherTempTicks.length
                          ? [weatherTempTicks[0], weatherTempTicks[weatherTempTicks.length - 1]]
                          : undefined
                      }
                      allowDecimals
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#60a5fa"
                      tick={{ fill: '#60a5fa', fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 25 : 25}
                      ticks={weatherPrecipTicks}
                      domain={
                        weatherPrecipTicks.length
                          ? [weatherPrecipTicks[0], weatherPrecipTicks[weatherPrecipTicks.length - 1]]
                          : undefined
                      }
                      allowDecimals
                    />
                    <Tooltip content={<WeatherTooltip />} cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4', strokeWidth: 1, strokeOpacity: 0.6 }} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }} formatter={renderLegendWithUnit} />
                    {isTodayPage && currentDecimalIndex !== -1 && (
                      <ReferenceArea yAxisId="left" x1={0} x2={currentDecimalIndex} stroke="none" fill="#64748b" fillOpacity={0.2} />
                    )}
                    {isTodayPage && currentDecimalIndex !== -1 && (
                      <ReferenceLine yAxisId="left" x={currentDecimalIndex} stroke="red" strokeDasharray="3 3">
                        <Label value="現在" position="insideTopRight" fill="#fff" fontSize={10} />
                      </ReferenceLine>
                    )}
                    {hoverWeatherX !== null && (
                      <ReferenceLine yAxisId="left" x={hoverWeatherX} stroke="#e5e7eb" strokeDasharray="4 4" strokeOpacity={0.7} />
                    )}
                    <Bar yAxisId="right" dataKey="precipitation" name="降水量" fill="#60a5fa" barSize={8} radius={[3, 3, 0, 0]} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temperature"
                      name="気温"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#fbbf24', stroke: '#0f172a', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-slate-900/40 border-purple-500/20 h-full">
              <CardHeader className="pb-2 sm:pb-3 lg:pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-200 text-lg sm:text-xl lg:text-2xl">
                  <Waves /> 潮汐情報
                </CardTitle>
              </CardHeader>
              <CardContent className={`flex flex-col p-0 ${isMobile ? 'h-[380px]' : 'h-[400px]'}`}>
                <div className="space-y-2 sm:space-y-3 mb-1 sm:mb-2 px-4 sm:px-6 pt-2 sm:pt-6">
                  <div className="flex items-center justify-center gap-6 sm:gap-9 bg-white/5 p-2 sm:p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl sm:text-4xl" role="img" aria-label={`月齢 ${moonAgeValue.toFixed(1)}`}>
                        {getMoonPhaseIcon(moonAgeValue)}
                      </span>
                      <div className="text-left leading-tight">
                        <p className="text-xs sm:text-sm text-slate-300">月齢</p>
                        <p className="text-lg sm:text-xl font-bold">{moonAgeValue.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="h-5 sm:h-6 w-px bg-white/15 mx-3 sm:mx-5" aria-hidden="true" />

                    <div className="inline-flex flex-col items-center leading-tight">
                      <p className="text-xs sm:text-sm text-slate-300">潮</p>
                      <p className="text-lg sm:text-xl font-bold">{tide.moon.title}</p>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 justify-center mt-2 flex-wrap">
                    {[
                      ...tide.flood.map(f => ({ ...f, type: '満潮' })),
                      ...tide.edd.map(e => ({ ...e, type: '干潮' })),
                    ]
                      .sort((a, b) => {
                        const getMinutes = (t: string) => {
                          const [h, m] = t.split(':').map(Number);
                          return h * 60 + m;
                        };
                        return getMinutes(a.time) - getMinutes(b.time);
                      })
                      .map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center px-2 py-1 bg-black/10 rounded min-w-[56px] max-w-[88px] h-10"
                          style={{ fontSize: '12px', lineHeight: 1.1 }}
                        >
                          <div className="flex-shrink-0 flex items-center justify-center h-full">
                            {t.type === '満潮' ? (
                              <ArrowUp className="w-4 h-4 text-yellow-300" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-cyan-300" />
                            )}
                          </div>
                          <div className="flex flex-col items-center justify-center ml-1">
                            <span className="font-semibold">{t.time}</span>
                            <span className="text-[11px] text-slate-500">{t.cm}cm</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex-grow min-h-0 -mt-1 sm:-mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={tideChartData}
                      margin={isMobile ? { top: 5, right: 15, left: 5, bottom: 15 } : { top: 5, right: 25, left: 10, bottom: 5 }}
                      onMouseMove={(state: any) => {
                        if (state && state.activeLabel) setHoverTideX(state.activeLabel as string);
                      }}
                      onMouseLeave={() => setHoverTideX(null)}
                    >
                      <defs>
                        <linearGradient id="tideAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                          <stop offset="70%" stopColor="#38bdf8" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis
                        dataKey="time"
                        ticks={tideTicks}
                        interval={0}
                        minTickGap={0}
                        tickFormatter={(t: string) => `${Number(t.split(':')[0])}時`}
                        tick={{ fill: '#9ca3af' }}
                        fontSize={isMobile ? 10 : 12}
                      />
                      <YAxis
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        unit="cm"
                        ticks={tideYTicks}
                        domain={tideYTicks.length ? [tideYTicks[0], tideYTicks[tideYTicks.length - 1]] : undefined}
                        width={isMobile ? 40 : 45}
                        allowDecimals
                      />
                      <Tooltip
                        content={<TideTooltip />}
                        cursor={{ stroke: '#a78bfa', strokeDasharray: '4 4', strokeWidth: 1, strokeOpacity: 0.6 }}
                      />
                      {tideReferenceAreas}
                      {isTodayPage && currentTideTimeX && (
                        <ReferenceLine x={currentTideTimeX} stroke="red" strokeDasharray="3 3">
                          <Label value="現在" position="insideTopRight" fill="#fff" fontSize={10} />
                        </ReferenceLine>
                      )}
                      {hoverTideX && <ReferenceLine x={hoverTideX} stroke="#e5e7eb" strokeDasharray="4 4" strokeOpacity={0.7} />}
                      <Area
                        type="monotone"
                        dataKey="level"
                        stroke="none"
                        fill="url(#tideAreaGradient)"
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="level"
                        name="潮位"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
                      />
                      
                      {tide.flood.map((t) => (
                        <ReferenceDot
                          key={`flood-${t.time}`}
                          xAxisId="0"
                          yAxisId="0"
                          x={t.time}
                          y={t.cm}
                          r={4}
                          fill="#facc15"
                          stroke="#fff"
                          isFront={true}
                        />
                      ))}
                      {tide.edd.map((t) => (
                        <ReferenceDot
                          key={`edd-${t.time}`}
                          xAxisId="0"
                          yAxisId="0"
                          x={t.time}
                          y={t.cm}
                          r={4}
                          fill="#38bdf8"
                          stroke="#fff"
                          isFront={true}
                        />
                      ))}

                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}