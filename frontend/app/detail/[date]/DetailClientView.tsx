'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Waves, Thermometer, Wind, Sun, Moon, Droplet, CloudRain, Snowflake, ArrowUp, ArrowDown, Cloudy } from 'lucide-react';
import { LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceDot, ReferenceArea, ReferenceLine, Label, LegendType } from 'recharts';
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


// --- Propsの型定義 ---
interface DetailClientViewProps {
  date: string;
  weather: HourlyWeather[];
  tide: TideData;
}

// --- メインコンポーネント ---
export default function DetailClientView({ date, weather, tide }: DetailClientViewProps) {
  const [isMobile, setIsMobile] = useState(false);

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

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isTodayPage = date === todayStr;

  const weatherChartData = weather.map((w, index) => ({
    index: index,
    hour: new Date(w.time).getHours(),
    temperature: w.temperature,
    precipitation: w.precipitation,
  }));
  
  const xAxisTickFormatter = (index: number) => {
    const dataPoint = weatherChartData[index];
    if (dataPoint) {
      return `${dataPoint.hour}時`;
    }
    return '';
  };
  
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

  const tideChartData = tide.tide.map(t => ({
      time: t.time,
      level: t.cm,
  }));
  
  const tideReferenceAreas = [];
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
          <ReferenceArea key={`tide-area-${i}`} x1={tideChartData[i].time} x2={tideChartData[i + 1].time} stroke="none" fill="#64748b" fillOpacity={0.2}/>
        );
      } else { break; }
    }
  }

  const renderLegendWithUnit = (value: string, entry: any) => {
    const { color } = entry;
    const unit = value === '気温' ? '(℃)' : '(mm)';
    return <span style={{ color }}>{`${value} ${unit}`}</span>;
  };


  return (
    <div className="min-h-screen relative z-10 p-4 sm:p-4 md:p-6 max-w-7xl mx-auto text-white safe-area">
      <header className="mb-4 sm:mb-6">
        <Button onClick={() => router.back()} variant="ghost" className="mb-2 text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-3">
          <Calendar className="text-blue-300"/>
          {formattedDate}
        </h1>
      </header>
      
      <main className="space-y-6 sm:space-y-8 pb-4 sm:pb-8">
        <div>
          <CardTitle className="text-lg sm:text-xl text-blue-100 mb-3 ml-1">時間ごとの予報</CardTitle>
          <div className="overflow-x-auto rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex">
              {weather.map((w, i) => {
                const isPast = isTodayPage && new Date(w.time) < now;
                return (
                  <div key={i} className={`flex-shrink-0 w-20 sm:w-24 flex flex-col items-center justify-between p-2 sm:p-3 text-center h-44 sm:h-48 border-r border-white/10 last:border-r-0 transition-opacity ${isPast ? 'opacity-50' : ''}`}>
                    <p className="font-semibold text-sm sm:text-lg">{new Date(w.time).toLocaleTimeString('ja-JP', { hour: '2-digit' })}時</p>
                    <div className="my-1 sm:my-2">{getWeatherFromCode(w.weather_code, w.time).icon}</div>
                    <p className="font-bold text-lg sm:text-xl">{w.temperature.toFixed(1)}℃</p>
                    <div className="text-xs text-slate-300 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-400" /><span>{w.precipitation.toFixed(1)}mm</span></div>
                    <div className="text-xs text-slate-300 flex items-center gap-1"><Wind className="w-3 h-3 text-gray-400" /><span>{getWindDirection(w.wind_direction)}</span></div>
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
                         margin={isMobile 
                           ? { top: 5, right: 8, left: 0, bottom: 5 } 
                           : { top: 5, right: 10, left: 0, bottom: 5 }
                         }
                       >
                           <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                           <XAxis 
                             dataKey="index" 
                             tickFormatter={xAxisTickFormatter} 
                             tick={{ fill: '#9ca3af' }} 
                             fontSize={10} 
                             interval={isMobile ? 3 : 2}
                             type="number"
                             domain={[0, 23]}
                           />
                           <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            stroke="#fbbf24" 
                            tick={{ fill: '#fbbf24', fontSize: 10 }} 
                            width={isMobile ? 35 : 35}
                            domain={['dataMin - 2', 'dataMax + 2']}
                          />
                           <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#60a5fa" 
                            tick={{ fill: '#60a5fa', fontSize: 10 }} 
                            width={isMobile ? 25 : 25}
                            domain={[0, 'dataMax + 2']}
                          />
                           <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                           <Legend wrapperStyle={{fontSize: isMobile ? "12px" : "14px"}} formatter={renderLegendWithUnit} />
                           {isTodayPage && currentDecimalIndex !== -1 && (
                            <ReferenceArea yAxisId="left" x1={0} x2={currentDecimalIndex} stroke="none" fill="#64748b" fillOpacity={0.2} />
                           )}
                           {isTodayPage && currentDecimalIndex !== -1 && (
                             <ReferenceLine yAxisId="left" x={currentDecimalIndex} stroke="red" strokeDasharray="3 3">
                               <Label value="現在" position="insideTopRight" fill="#fff" fontSize={10} />
                             </ReferenceLine>
                           )}
                           <Bar yAxisId="right" dataKey="precipitation" name="降水量" fill="#60a5fa" barSize={8} />
                           <Line yAxisId="left" type="monotone" dataKey="temperature" name="気温" stroke="#fbbf24" strokeWidth={2} dot={false}/>
                       </ComposedChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-slate-900/40 border-purple-500/20 h-full">
                <CardHeader className="pb-2 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-purple-200 text-lg sm:text-xl lg:text-2xl">
                    <Waves /> 潮汐情報
                  </CardTitle>
                </CardHeader>
                <CardContent className={`flex flex-col p-0 ${isMobile ? 'h-[380px]' : 'h-[400px]'}`}>
                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 px-4 sm:px-6 pt-2 sm:pt-6">
                      <div className="flex justify-around items-center text-center bg-white/5 p-2 sm:p-3 rounded-lg">
                          <div><p className="text-xs sm:text-sm text-slate-300">月齢</p><p className="text-lg sm:text-xl font-bold">{parseFloat(tide.moon.age).toFixed(1)}</p></div>
                          <div><p className="text-xs sm:text-sm text-slate-300">潮</p><p className="text-lg sm:text-xl font-bold">{tide.moon.title}</p></div>
                      </div>

                      <div className="flex text-xs sm:text-sm">
                        {/* 満潮 */}
                        <div className="w-1/2 space-y-1">
                          {tide.flood.map((f, i) => (
                            <div key={i} className="flex items-center gap-1 sm:gap-2">
                              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
                              <span className="font-semibold text-xs">満潮</span>
                              <span className="tabular-nums text-xs sm:text-sm">{f.time}</span>
                              <span className="text-slate-300 text-xs">({f.cm}cm)</span>
                            </div>
                          ))}
                        </div>

                        {/* 干潮 */}
                        <div className="w-1/2 space-y-1">
                          {tide.edd.map((e, i) => (
                            <div key={i} className="flex items-center gap-1 sm:gap-2">
                              <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                              <span className="font-semibold text-xs">干潮</span>
                              <span className="tabular-nums text-xs sm:text-sm">{e.time}</span>
                              <span className="text-slate-300 text-xs">({e.cm}cm)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-grow min-h-0">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={tideChartData}
                            margin={isMobile
                              ? { top: 5, right: 15, left: 5, bottom: 15 }
                              : { top: 5, right: 25, left: 10, bottom: 5 }
                            }
                          >
                              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                              <XAxis 
                                dataKey="time" 
                                tick={{ fill: '#9ca3af' }} 
                                fontSize={isMobile ? 10 : 12} 
                                interval={isMobile ? 11 : 7} 
                              />
                              <YAxis 
                                tick={{ fill: '#9ca3af', fontSize: 10 }} 
                                unit="cm" 
                                domain={['dataMin - 10', 'dataMax + 10']}
                                width={isMobile ? 40 : 45}
                              />
                              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                               {tideReferenceAreas}
                               {isTodayPage && currentTideTimeX && (
                                <ReferenceLine x={currentTideTimeX} stroke="red" strokeDasharray="3 3">
                                  <Label value="現在" position="insideTopRight" fill="#fff" fontSize={10} />
                                </ReferenceLine>
                               )}
                              <Line type="monotone" dataKey="level" name="潮位" stroke="#38bdf8" strokeWidth={2} dot={false} />
                              {tide.flood.map(t => <ReferenceDot key={t.time} x={t.time} y={t.cm} r={4} fill="#38bdf8" stroke="#fff" isFront={true} />)}
                              {tide.edd.map(t => <ReferenceDot key={t.time} x={t.time} y={t.cm} r={4} fill="#facc15" stroke="#fff" isFront={true} />)}
                          </LineChart>
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