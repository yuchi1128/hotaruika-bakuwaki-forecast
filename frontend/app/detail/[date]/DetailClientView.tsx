'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HourlyWeather, TideData, Prediction } from './types';
import DetailPageHeader from '@/components/Detail/DetailPageHeader';
import HourlyForecast from '@/components/Detail/HourlyForecast';
import ForecastCharts from '@/components/Detail/ForecastCharts';
import BakuwakiIndexDisplay from '@/components/Detail/BakuwakiIndexDisplay';
import { getBakuwakiLevelInfo } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface DetailClientViewProps {
  date: string;
  weather: HourlyWeather[];
  tide: TideData;
  prediction: Prediction | null;
  lastUpdatedISO: string;
}

export default function DetailClientView({
  date,
  weather,
  tide,
  prediction,
  lastUpdatedISO,
}: DetailClientViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const [predictionDates, setPredictionDates] = useState<string[]>([]);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/prediction`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const dates = data.map((p: any) => p.date.split('T')[0]);
        setPredictionDates(dates);
      } catch (error) {
        console.error('Failed to fetch forecasts:', error);
      }
    };

    fetchForecasts();
  }, []);

  const lastUpdated = new Date(lastUpdatedISO);
  const formattedDate = useMemo(() => {
    const dt = new Date(date);
    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    const day = dt.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[dt.getDay()];
    return `${year}年${month}月${day}日(${weekday})`;
  }, [date]);

  const now = useMemo(() => new Date(), []);

  const isTodayPage = useMemo(() => {
    if (!weather || weather.length === 0) return false;
    const startTime = new Date(weather[0].time).getTime();
    const endTime = new Date(weather[weather.length - 1].time).getTime() + 60 * 60 * 1000;
    const nowTime = now.getTime();
    return nowTime >= startTime && nowTime < endTime;
  }, [weather, now]);

  const bakuwakiInfo = useMemo(() => {
    const targetDate = new Date(date);
    // 予報データがない場合でも、日付からシーズンオフかどうかを判断するために、predicted_amountを0として関数を呼び出す
    // const amount = prediction ? prediction.predicted_amount : 0;

    // 確認用の一時的な値
    const amount = 1.75;

    return getBakuwakiLevelInfo(amount, targetDate);
  }, [prediction, date]);

  return (
    <div className="min-h-screen relative z-10 p-4 sm:p-4 md:p-6 max-w-7xl mx-auto text-white safe-area">
      <DetailPageHeader
        formattedDate={formattedDate}
        lastUpdated={lastUpdated}
        onBack={() => router.push('/')}
        date={date}
        predictionDates={predictionDates}
      />
      <main className="space-y-6 sm:space-y-8 pb-4 sm:pb-8">
        {bakuwakiInfo && (
          <BakuwakiIndexDisplay 
            bakuwakiIndex={bakuwakiInfo.bakuwakiIndex}
            level={bakuwakiInfo.level}
            name={bakuwakiInfo.name}
            description={bakuwakiInfo.description}
            isMobile={isMobile}
          />
        )}
        <HourlyForecast
          weather={weather}
          date={date}
          now={now}
          isTodayPage={isTodayPage}
          isMobile={isMobile}
        />
        <ForecastCharts
          weather={weather}
          tide={tide}
          date={date}
          now={now}
          isTodayPage={isTodayPage}
          isMobile={isMobile}
        />
      </main>
    </div>
  );
}