'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Thermometer, Cloud, Droplets, Moon, Waves } from 'lucide-react';

interface PredictionLevel {
  level: number;
  name: string;
  description: string;
  color: string;
  bgColor: string;
}

interface DetailData {
  date: Date;
  level: number;
  temperature: number;
  weather: string;
  precipitation: number;
  moonPhase: string;
  tideInfo: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

const predictionLevels: PredictionLevel[] = [
  { level: 0, name: 'なし', description: '身投げは期待できません', color: 'text-gray-400', bgColor: 'bg-gray-800' },
  { level: 1, name: 'プチ湧き', description: '少し期待できるかも', color: 'text-blue-300', bgColor: 'bg-blue-900/30' },
  { level: 2, name: 'チョイ湧き', description: 'そこそこ期待できます', color: 'text-cyan-300', bgColor: 'bg-cyan-900/30' },
  { level: 3, name: '湧き', description: '良い身投げが期待できます', color: 'text-green-300', bgColor: 'bg-green-900/30' },
  { level: 4, name: '大湧き', description: '素晴らしい身投げが期待できます', color: 'text-yellow-300', bgColor: 'bg-yellow-900/30' },
  { level: 5, name: '爆湧き', description: '最高の身投げが期待できます！', color: 'text-pink-300', bgColor: 'bg-pink-900/30' },
];

interface DetailContentProps {
  date: string;
}

export default function DetailContent({ date }: DetailContentProps) {
  const router = useRouter();
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 詳細データの生成（実際のAPIに置き換え予定）
    const generateDetailData = () => {
      const targetDate = new Date(date);
      
      const data: DetailData = {
        date: targetDate,
        level: Math.floor(Math.random() * 6),
        temperature: Math.floor(Math.random() * 10) + 8,
        weather: ['晴れ', '曇り', '雨', '霧'][Math.floor(Math.random() * 4)],
        precipitation: Math.floor(Math.random() * 100),
        moonPhase: ['新月', '三日月', '上弦の月', '満月', '下弦の月'][Math.floor(Math.random() * 5)],
        tideInfo: ['大潮', '中潮', '小潮', '長潮', '若潮'][Math.floor(Math.random() * 5)],
        humidity: Math.floor(Math.random() * 40) + 60,
        windSpeed: Math.floor(Math.random() * 15) + 1,
        visibility: Math.floor(Math.random() * 20) + 5,
      };
      
      setDetailData(data);
      setLoading(false);
    };

    generateDetailData();
  }, [date]);

  const renderHotaruikaIcons = (level: number) => {
    return Array.from({ length: level }).map((_, index) => (
      <img
        key={index}
        src="/Gemini_Generated_Image_1035je1035je1035 (1).png"
        alt="ホタルイカ"
        className="w-8 h-8 floating hotaruika-glow"
        style={{ animationDelay: `${index * 0.5}s` }}
      />
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading || !detailData) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-blue-200">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const currentLevel = predictionLevels[detailData.level];

  return (
    <div className="min-h-screen relative z-10">
      {/* ヘッダー */}
      <header className="text-center py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="absolute left-4 top-8 text-blue-300 hover:text-blue-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            戻る
          </Button>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src="/Gemini_Generated_Image_1035je1035je1035 (1).png"
              alt="ホタルイカ"
              className="w-12 h-12 floating hotaruika-glow"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              詳細予報
            </h1>
            <img
              src="/Gemini_Generated_Image_1035je1035je1035 (1).png"
              alt="ホタルイカ"
              className="w-12 h-12 floating hotaruika-glow"
              style={{ animationDelay: '1s' }}
            />
          </div>
          <p className="text-xl text-blue-200">{formatDate(detailData.date)}</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* メイン予測カード */}
        <Card className="mb-8 glow-effect bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-200 mb-2">
              身投げ予測
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`inline-block px-8 py-6 rounded-2xl ${currentLevel.bgColor} mb-6`}>
              <div className={`text-5xl font-bold mb-4 ${currentLevel.color}`}>
                {currentLevel.name}
              </div>
              <div className="flex justify-center gap-2 mb-4">
                {renderHotaruikaIcons(detailData.level)}
              </div>
              <p className="text-xl text-gray-300">
                {currentLevel.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 詳細情報グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 気温 */}
          <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-orange-200 flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                気温
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-100 mb-2">
                {detailData.temperature}°C
              </div>
              <p className="text-sm text-orange-300">
                ホタルイカの活動に適した温度です
              </p>
            </CardContent>
          </Card>

          {/* 天気 */}
          <Card className="bg-gradient-to-br from-sky-900/30 to-blue-900/30 border-sky-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-sky-200 flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                天気
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sky-100 mb-2">
                {detailData.weather}
              </div>
              <p className="text-sm text-sky-300">
                観測条件に影響します
              </p>
            </CardContent>
          </Card>

          {/* 降水確率 */}
          <Card className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border-cyan-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-cyan-200 flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                降水確率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-100 mb-2">
                {detailData.precipitation}%
              </div>
              <p className="text-sm text-cyan-300">
                雨は観測の妨げになります
              </p>
            </CardContent>
          </Card>

          {/* 月齢 */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-purple-200 flex items-center gap-2">
                <Moon className="w-5 h-5" />
                月齢
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-100 mb-2">
                {detailData.moonPhase}
              </div>
              <p className="text-sm text-purple-300">
                月の明るさが身投げに影響
              </p>
            </CardContent>
          </Card>

          {/* 潮汐情報 */}
          <Card className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-emerald-200 flex items-center gap-2">
                <Waves className="w-5 h-5" />
                潮汐
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-100 mb-2">
                {detailData.tideInfo}
              </div>
              <p className="text-sm text-emerald-300">
                潮の満ち引きが重要な要素
              </p>
            </CardContent>
          </Card>

          {/* 湿度 */}
          <Card className="bg-gradient-to-br from-slate-900/30 to-gray-900/30 border-slate-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                湿度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-100 mb-2">
                {detailData.humidity}%
              </div>
              <p className="text-sm text-slate-300">
                海洋環境に影響
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 追加情報 */}
        <Card className="bg-gradient-to-br from-slate-900/40 to-blue-900/40 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-200">
              その他の観測条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-900/20 rounded-lg">
                  <span className="text-blue-300">風速</span>
                  <span className="text-white font-semibold">{detailData.windSpeed} m/s</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-900/20 rounded-lg">
                  <span className="text-blue-300">視界</span>
                  <span className="text-white font-semibold">{detailData.visibility} km</span>
                </div>
              </div>
              <div className="bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-200 mb-2">観測のポイント</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• 新月の夜は特に身投げが活発になります</li>
                  <li>• 風が弱く、視界が良好な日がおすすめ</li>
                  <li>• 大潮の時期は身投げ量が増加する傾向</li>
                  <li>• 気温が10-15°Cの時が最適です</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}