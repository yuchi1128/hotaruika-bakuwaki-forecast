'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, Waves, ArrowUp, ArrowDown } from 'lucide-react';
import {
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
import type { HourlyWeather, TideData } from '@/app/detail/[date]/types';
import { getNiceTicks, getMoonPhaseIcon } from '@/lib/detail-utils';

// --- Tooltip Components ---
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

// --- Main Component ---
interface ForecastChartsProps {
  weather: HourlyWeather[];
  tide: TideData;
  date: string;
  now: Date;
  isTodayPage: boolean;
  isMobile: boolean;
}

export default function ForecastCharts({
  weather,
  tide,
  date,
  now,
  isTodayPage,
  isMobile,
}: ForecastChartsProps) {
  const [hoverWeatherX, setHoverWeatherX] = useState<number | null>(null);
  const [hoverTideX, setHoverTideX] = useState<string | null>(null);

  // Weather Chart Logic
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
    if (!dataPoint) return '';
    const pointDate = new Date(weather[index].time);
    const baseDate = new Date(date);
    const isNextDay = pointDate.toDateString() !== baseDate.toDateString();
    return `${isNextDay ? '翌' : ''}${dataPoint.hour}時`;
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

  const nextMidnightIndex = useMemo(() => {
    if (!weather.length) return -1;
    const baseDateStr = new Date(date).toDateString();
    for (let i = 0; i < weather.length; i++) {
      const d = new Date(weather[i].time);
      if (d.toDateString() !== baseDateStr && d.getHours() === 0) {
        return i;
      }
    }
    return -1;
  }, [weather, date]);

  const hasNextMidnightTick = useMemo(
    () => nextMidnightIndex >= 0 && weatherTicks.includes(nextMidnightIndex),
    [nextMidnightIndex, weatherTicks]
  );

  // Tide Chart Logic
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
      } else {
        break;
      }
    }
  }

  const renderLegendWithUnit = (value: string, entry: any) => {
    const { color } = entry;
    const unit = value === '気温' ? '(℃)' : '(mm)';
    return <span style={{ color }}>{`${value} ${unit}`}</span>;
  };

  const moonAgeValue = useMemo(() => parseFloat(tide.moon.age), [tide.moon.age]);

  return (
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
                  interval={0}
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
                {nextMidnightIndex >= 0 && !hasNextMidnightTick && (
                  <ReferenceLine
                    yAxisId="left"
                    x={nextMidnightIndex}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeOpacity={0.2}
                  />
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
                  margin={isMobile ? { top: 10, right: 15, left: 5, bottom: 15 } : { top: 12, right: 25, left: 10, bottom: 8 }}
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
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={false} />
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
                    yAxisId="0"
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
                  {tideYTicks.map((y) => (
                    <ReferenceLine
                      key={`tide-y-${y}`}
                      yAxisId="0"
                      y={y}
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                      strokeOpacity={0.2}
                      isFront
                    />
                  ))}
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
                      isFront
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
                      isFront
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
