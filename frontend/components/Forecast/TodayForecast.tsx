import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HelpCircle,
  RefreshCw,
  Clock,
  Lightbulb,
  Thermometer,
  Cloudy,
  Wind,
  Moon,
  ChevronRight,
} from 'lucide-react';
import type { DayPrediction } from '@/lib/types';
import { predictionLevels } from '@/lib/utils';

interface TodayForecastProps {
  todayPrediction: DayPrediction;
  lastUpdated: Date | null;
  handleCardClick: (date: Date) => void;
  formatDate: (date: Date) => string;
  getOffSeasonMessage: (date: Date) => string;
  renderHotaruikaIcons: (level: number, src: string, size?: string, animated?: boolean) => JSX.Element[];
  isHelpDialogOpen: boolean;
  setIsHelpDialogOpen: (isOpen: boolean) => void;
}

const TodayForecast = ({
  todayPrediction,
  lastUpdated,
  handleCardClick,
  formatDate,
  getOffSeasonMessage,
  renderHotaruikaIcons,
  isHelpDialogOpen,
  setIsHelpDialogOpen
}: TodayForecastProps) => {
  const todayIcons = todayPrediction ? renderHotaruikaIcons(todayPrediction.level, '/hotaruika_aikon.png', 'w-16 h-16 md:w-20 md:h-20') : [];

  return (
    <Card className="mb-8 glow-effect bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 border border-blue-500/30 rounded-3xl shadow-2xl">
      <CardHeader className="text-center pt-8 pb-6">
        <div className="flex justify-center items-center gap-2 mb-1">
          <CardTitle className="text-2xl md:text-3xl font-bold text-white">今日の予報</CardTitle>

          <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
            <DialogTrigger asChild>
              <button className="text-blue-300 hover:text-blue-100 transition-colors" aria-label="予報の説明を見る">
                <HelpCircle className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md bg-slate-800/80 border-blue-500/50 text-white shadow-lg backdrop-blur-md rounded-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-blue-200">
                  <HelpCircle className="w-5 h-5" />
                  <span>予報の説明</span>
                </DialogTitle>
                <DialogDescription className="sr-only">予報の見方や更新タイミングについて説明します。</DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-5 py-2 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 mt-1 text-blue-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-2">予報の時間区分</h4>
                    <div className="space-y-3 text-slate-300">
                      <p>このサイトでは、ホタルイカの身投げが深夜から明け方にかけて発生するため、日付の切り替えを<strong className="text-white">朝5時</strong>に行っています。</p>
                      <div className="grid gap-1">
                        <p className="font-semibold text-slate-200">
                          <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded text-xs">05:00〜23:59</span> の閲覧時
                        </p>
                        <p className="pl-3 border-l-2 border-blue-400">
                          <strong className="text-white">今夜から翌朝にかけて</strong>の予報です。
                        </p>
                      </div>
                      <div className="grid gap-1">
                        <p className="font-semibold text-slate-200">
                          <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded text-xs">00:00〜04:59</span> の閲覧時
                        </p>
                        <p className="pl-3 border-l-2 border-blue-400">
                          <strong className="text-white">現在の朝</strong>の予報です。
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 pt-1">※気温・天気などの気象データは、予報対象日の日中のデータです。</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <RefreshCw className="w-6 h-6 mt-1 text-green-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">予報の更新</h4>
                    <p className="text-slate-300 leading-relaxed">
                      次の時刻に更新されます：<br />
                      <span className="font-mono text-white">05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00, 02:00</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 mt-1 text-yellow-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">予測の表示</h4>
                    <div className="text-slate-300 leading-relaxed space-y-2">
                      <p>予測はシーズン期間（2月〜5月）のみ行われ、期間外は「オフシーズン」と表示されます。</p>
                      <p>
                        予測レベルは以下の6段階です：<br />
                        <span className="mr-1">「<span className="text-gray-300 font-semibold">湧きなし</span>」</span>
                        <span className="mr-1">「<span className="text-blue-300 font-semibold">プチ湧き</span>」</span>
                        <span className="mr-1">「<span className="text-cyan-300 font-semibold">チョイ湧き</span>」</span>
                        <br className="sm:hidden" />
                        <span className="mr-1">「<span className="text-green-300 font-semibold">湧き</span>」</span>
                        <span className="mr-1">「<span className="text-yellow-300 font-semibold">大湧き</span>」</span>
                        <span className="mr-1">「<span className="text-pink-300 font-semibold">爆湧き</span>」</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-blue-300">{formatDate(todayPrediction.date)}</p>
        {todayPrediction.level !== -1 && lastUpdated && (
          <div className="flex items-center justify-center gap-1 text-xs text-blue-200/80 mt-1">
            <RefreshCw className="w-3 h-3" />
            <span>最終更新 {lastUpdated.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="text-center px-4 pb-8">
        {todayPrediction.level === -1 ? (
          <div className="inline-block px-4 sm:px-8 py-4 rounded-2xl bg-gray-500/20 border border-gray-400/20 backdrop-blur-sm mb-6">
            <div className="flex flex-col justify-center items-center min-h-[160px] md:min-h-[180px]">
              <p className="text-3xl md:text-4xl font-bold text-gray-300">オフシーズン</p>
              <p className="text-sm text-gray-400 mt-2 px-4">{getOffSeasonMessage(todayPrediction.date)}</p>
            </div>
          </div>
        ) : (
          <div className={`inline-block px-4 sm:px-8 py-4 rounded-2xl ${predictionLevels[todayPrediction.level].bgColor} mb-6`}>
            {todayPrediction.level > 0 && (
              <div
                className={`
                text-3xl md:text-4xl font-bold mb-2
                ${predictionLevels[todayPrediction.level].color}
                ${todayPrediction.level > 0 ? 'text-glow-normal' : 'text-glow-weak'}
              `}
              >
                {predictionLevels[todayPrediction.level].name}
              </div>
            )}

            <div className="mb-4">
              {todayPrediction.level === 5 ? (
                <>
                  <div className="flex flex-col items-center sm:hidden">
                    <div className="flex justify-center gap-2">{todayIcons.slice(0, 3)}</div>
                    <div className="flex justify-center gap-2 -mt-3">{todayIcons.slice(3, 5)}</div>
                  </div>
                  <div className="hidden sm:flex justify-center gap-2">{todayIcons}</div>
                </>
              ) : (
                <div className="flex justify-center items-center gap-2 min-h-[80px] md:min-h-[96px]">
                  {todayPrediction.level > 0 ? (
                    todayIcons
                  ) : (
                    <div
                      className={`
                      text-3xl md:text-4xl font-bold mb-2
                      ${predictionLevels[todayPrediction.level].color}
                      ${todayPrediction.level > 0 ? 'text-glow-normal' : 'text-glow-weak'}
                    `}
                    >
                      {predictionLevels[todayPrediction.level].name}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-lg text-gray-300">{predictionLevels[todayPrediction.level].description}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
            <div className="flex items-center text-blue-300 mb-1">
              <Thermometer className="w-5 h-5 mr-1.5" />
              <p className="text-sm font-medium">気温</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">
              <span className="text-orange-300">{todayPrediction.temperature_max}</span>
              <span className="text-gray-400">/</span>
              <span className="text-blue-300">{todayPrediction.temperature_min}</span>
              <span className="text-gray-400 text-[17px] align-top">℃</span>
            </p>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
            <div className="flex items-center text-blue-300 mb-1">
              <Cloudy className="w-5 h-5 mr-1.5" />
              <p className="text-sm font-medium">天気</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{todayPrediction.weather}</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
            <div className="flex items-center text-blue-300 mb-1">
              <Wind className="w-5 h-5 mr-1.5" />
              <p className="text-sm font-medium">風向き</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{todayPrediction.wind_direction}</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
            <div className="flex items-center text-blue-300 mb-1">
              <Moon className="w-5 h-5 mr-1.5" />
              <p className="text-sm font-medium">月齢</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{todayPrediction.moonAge.toFixed(1)}</p>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => handleCardClick(todayPrediction.date)}
            variant="ghost"
            aria-label={`詳細を見る: ${formatDate(todayPrediction.date)}`}
            title="この日の詳細を表示"
            className="
              group relative h-10 md:h-9 px-4 rounded-xl text-xs font-medium
              bg-gradient-to-b from-white/10 to-white/[0.06]
              border border-blue-400/30 text-blue-100
              ring-1 ring-inset ring-blue-500/10
              shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]
              backdrop-blur-md
              transition-[background,border-color,box-shadow] duration-200
              hover:from-white/[0.12] hover:to-white/[0.06]
              hover:border-blue-300/40
              hover:ring-blue-400/15
              hover:shadow-[0_0_10px_-4px_rgba(56,189,248,0.28)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50
              active:bg-white/[0.08]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <span className="inline-flex items-center gap-1.5">
              <span>詳細を見る</span>
              <ChevronRight className="w-4 h-4 text-blue-300 transition-transform duration-200 group-hover:translate-x-[1px]" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayForecast;
