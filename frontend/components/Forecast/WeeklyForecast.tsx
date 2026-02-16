'use client';

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Calendar, Thermometer, Cloudy, Wind, Moon, ChevronRight } from "lucide-react";
import type { PredictionLevel, DayPrediction } from '@/lib/types';

const CAROUSEL_POSITION_KEY = 'weeklyForecastCarouselPosition';

interface WeeklyForecastProps {
  weekPredictions: DayPrediction[];
  predictionLevels: PredictionLevel[];
  formatDateForWeek: (date: Date) => string;
  renderHotaruikaIcons: (level: number, src: string, size?: string, animated?: boolean) => JSX.Element[];
  handleCardClick: (date: Date) => void;
}

const WeeklyForecast = ({
  weekPredictions,
  predictionLevels,
  formatDateForWeek,
  renderHotaruikaIcons,
  handleCardClick
}: WeeklyForecastProps) => {
  const setApi = useCallback((api: CarouselApi) => {
    if (!api) return;

    // 保存された位置を復元
    const savedPosition = sessionStorage.getItem(CAROUSEL_POSITION_KEY);
    if (savedPosition !== null) {
      const position = parseInt(savedPosition, 10);
      // 少し遅延させて確実に復元
      setTimeout(() => {
        api.scrollTo(position, true);
      }, 0);
    }

    // 位置が変更されたら保存
    const onSelect = () => {
      const currentIndex = api.selectedScrollSnap();
      sessionStorage.setItem(CAROUSEL_POSITION_KEY, currentIndex.toString());
    };

    api.on('select', onSelect);
  }, []);

  return (
    <Card className="mb-16 bg-transparent border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-xl md:text-2xl font-bold text白 flex items-center gap-3">
          <Calendar className="w-7 h-7 text-blue-300" />
          週間予報
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          setApi={setApi}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {weekPredictions.map((prediction, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                <div className="flex flex-col justify-between p-4 rounded-2xl border h-full border-blue-500/20 backdrop-blur-sm bg-white/5">
                  <div>
                    <p className="text-base font-semibold text-blue-200 mb-1 text-center">{formatDateForWeek(prediction.date)}</p>
                    <p className="text-xs text-blue-300 mb-2 text-center">深夜〜翌朝の予測</p>
                    <div className="mb-4 min-h-[5rem] flex flex-col justify-center">
                      {prediction.level === -1 ? (
                        <div className="flex flex-col justify-center items-center text-center">
                          <p className="text-lg font-bold text-gray-300">オフシーズン</p>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`
                            text-lg font-bold mb-3 text-center
                            ${predictionLevels[prediction.level].color}
                            ${prediction.level > 0 ? 'text-glow-normal' : 'text-glow-weak'}
                          `}
                          >
                            {predictionLevels[prediction.level].name}
                          </div>
                          <div className="flex justify-center items-center h-10">{renderHotaruikaIcons(prediction.level, '/hotaruika_aikon.png', 'w-8 h-8', false)}</div>
                        </>
                      )}
                    </div>
                    <div className="w-full space-y-2 text-xs text-gray-300">
                        <div className="grid grid-cols-2 items-center bg-white/5 px-2 py-1 rounded">
                          <div className="flex items-center">
                            <Thermometer className="w-4 h-4 inline mr-1.5 text-blue-400" />
                            <span>気温</span>
                          </div>
                          <div className="text-center">
                            <span className="font-medium">
                              <span className="text-orange-300">{prediction.temperature_max}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-blue-300">{prediction.temperature_min}</span>
                              <span className="text-gray-400 text-[11px] align-top">℃</span>
                            </span>
                          </div>
                        </div>
                      <div className="grid grid-cols-2 items-center bg-white/5 px-2 py-1 rounded">
                        <div className="flex items-center">
                          <Cloudy className="w-4 h-4 inline mr-1.5 text-blue-400" />
                          <span>天気</span>
                        </div>
                        <div className="text-center">
                          <span className="font-medium">{prediction.weather}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 items-center bg-white/5 px-2 py-1 rounded">
                        <div className="flex items-center">
                          <Wind className="w-4 h-4 inline mr-1.5 text-blue-400" />
                          <span>風向き</span>
                        </div>
                        <div className="text-center">
                          <span className="font-medium">{prediction.wind_direction}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 items-center bg-white/5 px-2 py-1 rounded">
                        <div className="flex items-center">
                          <Moon className="w-4 h-4 inline mr-1.5 text-blue-400" />
                          <span>月齢</span>
                        </div>
                        <div className="text-center">
                          <span className="font-medium">{prediction.moonAge.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 w-full flex justify-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(prediction.date);
                      }}
                      variant="ghost"
                      aria-label={`詳細: ${formatDateForWeek(prediction.date)}`}
                      title="この日の詳細を表示"
                      className="
                        group relative h-8 md:h-7 px-3 rounded-xl text-xs font-medium
                        bg-gradient-to-b from-white/10 to-white/[0.06]
                        border border-blue-400/30 text-blue-100
                        ring-1 ring-inset ring-blue-500/10
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]
                        backdrop-blur-md
                        transition-transform duration-150
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/45
                        active:bg-white/[0.07]
                        hover:bg-white/15
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>詳細</span>
                        <ChevronRight className="w-4 h-4 text-blue-300 transition-transform duration-150 group-hover:translate-x-[1px]" />
                      </span>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-12px] sm:left-[-20px] top-1/2 -translate-y-1/2 flex xl:hidden bg-slate-800/50 hover:bg-slate-700/80 border-slate-600 z-10" />
          <CarouselNext className="absolute right-[-12px] sm:right-[-20px] top-1/2 -translate-y-1/2 flex xl:hidden bg-slate-800/50 hover:bg-slate-700/80 border-slate-600 z-10" />
        </Carousel>
      </CardContent>
    </Card>
  );
};

export default WeeklyForecast;
