'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HourlyWeather, TideData } from './types';
import DetailPageHeader from '@/components/Detail/DetailPageHeader';
import HourlyForecast from '@/components/Detail/HourlyForecast';
import ForecastCharts from '@/components/Detail/ForecastCharts';

interface DetailClientViewProps {
  date: string;
  weather: HourlyWeather[];
  tide: TideData;
  lastUpdatedISO: string;
}

export default function DetailClientView({
  date,
  weather,
  tide,
  lastUpdatedISO,
}: DetailClientViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const lastUpdated = new Date(lastUpdatedISO);
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const now = useMemo(() => new Date(), []);

  const isTodayPage = useMemo(() => {
    if (!weather || weather.length === 0) return false;
    const startTime = new Date(weather[0].time).getTime();
    const endTime = new Date(weather[weather.length - 1].time).getTime() + 60 * 60 * 1000;
    const nowTime = now.getTime();
    return nowTime >= startTime && nowTime < endTime;
  }, [weather, now]);

  return (
    <div className="min-h-screen relative z-10 p-4 sm:p-4 md:p-6 max-w-7xl mx-auto text-white safe-area">
      <DetailPageHeader
        formattedDate={formattedDate}
        lastUpdated={lastUpdated}
        onBack={() => router.back()}
        date={date}
      />
      <main className="space-y-6 sm:space-y-8 pb-4 sm:pb-8">
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
