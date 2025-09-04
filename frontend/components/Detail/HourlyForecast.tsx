'use client';

import { useRef, useState, useEffect } from 'react';
import { CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Wind, Droplet, Navigation, Sparkle } from 'lucide-react';
import type { HourlyWeather } from '@/app/detail/[date]/types';
import { monthlyDaylightHours, getWeatherInfo } from '@/lib/detail-utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HourlyForecastProps {
  weather: HourlyWeather[];
  date: string;
  now: Date;
  isTodayPage: boolean;
  isMobile: boolean;
}

export default function HourlyForecast({
  weather,
  date,
  now,
  isTodayPage,
  isMobile,
}: HourlyForecastProps) {
  const hourlyForecastRef = useRef<HTMLDivElement>(null);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = hourlyForecastRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.7;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const checkScrollButtons = () => {
    const container = hourlyForecastRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowScrollLeft(scrollLeft > 0);
    setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = hourlyForecastRef.current;
    if (!container) return;
    checkScrollButtons();
    container.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [weather, isMobile]);

  useEffect(() => {
    if (isTodayPage && hourlyForecastRef.current) {
      setTimeout(() => {
        const container = hourlyForecastRef.current;
        if (!container) return;
        const currentHourElement = container.querySelector('[data-is-current-hour="true"]');
        if (currentHourElement) {
          const element = currentHourElement as HTMLElement;
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const scrollLeft = elementRect.left - containerRect.left + container.scrollLeft;
          container.scrollTo({ left: scrollLeft, behavior: 'auto' });
        }
      }, 100);
    }
  }, [isTodayPage, weather, isMobile]);

  return (
    <div className="relative">
      <CardTitle className="mt-6 text-lg sm:text-xl text-blue-100 mb-3 ml-1">
        時間ごとの予報
      </CardTitle>

      {isMobile && showScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 bg-slate-800/50 hover:bg-slate-700/80 text-white p-1.5 sm:p-2 rounded-full shadow-lg backdrop-blur-sm transition-opacity duration-300"
        >
          <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      )}

      {/* モバイル時のみ viewport の内側に余白を確保してスクロールバーと内容の距離をとる */}
      <ScrollArea
        type="always"
        scrollHideDelay={0}
        showVertical={false}
        showHorizontal={true}
        viewportRef={hourlyForecastRef}
        viewportClassName={`hide-native-scrollbar ${isMobile ? 'pb-1' : ''}`}
        className="rounded-lg border border-white/10"
      >
        <div className="flex w-max">
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

            const isNextDay = itemDate.toDateString() !== new Date(date).toDateString();

            const { Icon, className } = getWeatherInfo(w.weather_code, w.time);

            return (
              <div
                key={i}
                data-is-current-hour={isCurrentHour}
                className={`flex-shrink-0 w-16 sm:w-24 flex flex-col items-center justify-around p-1.5 sm:p-3 text-center h-40 sm:h-52 border-r border-white/10 last:border-r-0 transition-all duration-300 backdrop-blur-sm
                  ${isDay ? 'bg-sky-900/40 border-t-sky-500/70' : 'bg-slate-950/40 border-t-indigo-500/70'}
                  border-t-4 ${isPast ? 'bg-slate-700/20 border-t-slate-500/50' : ''}`}
              >
                <div className={`flex flex-col items-center justify-around h-full w-full transition-all duration-300 ${
                  isPast 
                    ? 'opacity-50 saturate-55' 
                    : ''
                }`}>
                  <div className="flex flex-col items-center justify-end h-7 sm:h-8 pb-0.5 sm:pb-1">
                    {isCurrentHour && (
                      <p className="relative top-0.5 sm:top-1 text-[10px] sm:text-[11px] font-semibold text-red-300">
                        現在
                      </p>
                    )}
                    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-1">
                      {isNextDay && (
                        <span
                          className="justify-self-end transform origin-right scale-75 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 px-1 py-0.5 text-[11px]"
                          aria-label="翌日の予報"
                        >
                          翌
                        </span>
                      )}
                      <p
                        className={`col-start-2 font-semibold text-[13px] sm:text-lg ${
                          isDay ? 'text-sky-100' : 'text-slate-300'
                        }`}
                      >
                        {itemDate.toLocaleTimeString('ja-JP', { hour: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="relative my-1 sm:my-2 h-8 w-8 flex items-center justify-center scale-90 sm:scale-100">
                    {!isDay && w.weather_code <= 1 ? (
                      <div className="relative h-8 w-8">
                        <Icon className={`absolute bottom-0 left-0 w-7 h-7 ${className}`} />
                        <Sparkle className="absolute top-0.5 right-0.5 w-3 h-3 text-white" />
                        <Sparkle className="absolute top-3 right-[-2px] w-2 h-2 text-white" />
                      </div>
                    ) : (
                      <Icon className={`w-8 h-8 ${className}`} />
                    )}
                  </div>

                  <p className="font-bold text-base sm:text-xl">{w.temperature.toFixed(1)}℃</p>

                  <div className="text-[10px] sm:text-xs text-slate-300 flex items-center gap-1">
                    <Droplet className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                    <span>{w.precipitation.toFixed(1)}mm</span>
                  </div>

                  {/* ここにモバイル時のみ下マージンを追加して、スクロールバーとの距離を確保 */}
                  <div className="flex flex-col items-center gap-1 text-[10px] sm:text-xs text-slate-300 mb-1 sm:mb-0">
                    <div className="flex items-center gap-1">
                      <Wind className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{w.wind_speed.toFixed(1)}m/s</span>
                    </div>
                    <Navigation
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400"
                      style={{ transform: `rotate(${roundedDegrees - 45 + 180}deg)` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {isMobile && showScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 bg-slate-800/50 hover:bg-slate-700/80 text-white p-1.5 sm:p-2 rounded-full shadow-lg backdrop-blur-sm transition-opacity duration-300"
        >
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      )}
    </div>
  );
}