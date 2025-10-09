import DetailClientView from './DetailClientView';
import type { HourlyWeather, TideData, Prediction } from './types';
import { ShieldAlert } from 'lucide-react';
import { mockWeather, mockTide, mockPrediction, MOCK_DATE } from './mockData';
import { getLastUpdateTime } from '@/lib/utils';

// --- データ取得関数 ---
async function fetchDetailData(date: string): Promise<{ weather: HourlyWeather[], tide: TideData, prediction: Prediction | null }> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const apiUrl = `${apiBaseUrl}/api/detail/${date}`;

  const response = await fetch(apiUrl, { next: { revalidate: 3600 } });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`詳細データの取得に失敗: ${response.status} ${errorBody}`);
  }

  const apiData = await response.json();

  // --- 気象データの処理 (28時間分) ---
  const weatherData: HourlyWeather[] = apiData.weather.hourly.time.map((t: string, i: number) => ({
    time: t,
    temperature: apiData.weather.hourly.temperature_2m[i],
    precipitation: apiData.weather.hourly.precipitation[i],
    precipitation_probability: apiData.weather.hourly.precipitation_probability[i],
    weather_code: apiData.weather.hourly.weather_code[i],
    wind_speed: apiData.weather.hourly.wind_speed_10m[i],
    wind_direction: apiData.weather.hourly.wind_direction_10m[i],
  }));

  const startDate = date;
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString().split('T')[0];

  const startIndex = weatherData.findIndex(d => d.time === `${startDate}T00:00`);
  const endIndex = weatherData.findIndex(d => d.time === `${endDateStr}T04:00`);

  const slicedWeatherData = (startIndex !== -1 && endIndex !== -1) 
    ? weatherData.slice(startIndex, endIndex + 1)
    : weatherData.slice(0, 24); // フォールバック

  // --- 潮汐データの処理 (28時間分) ---
  const [year, month, day] = date.split('-');
  const baseDate = new Date(date);
  const nextDate = new Date(baseDate);
  nextDate.setDate(baseDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split('T')[0];
  const [nextYear, nextMonth, nextDay] = nextDateStr.split('-');

  // APIから当日と翌日の潮汐データを取得 (安全なアクセス)
  const todayTideSource = apiData?.tide?.tide?.chart?.[`${year}-${month}-${day}`];
  const nextDayTideSource = apiData?.nextTide?.tide?.chart?.[`${nextYear}-${nextMonth}-${nextDay}`];

  // データソースが存在しない場合は、クラッシュを避け空のデータを返す
  if (!todayTideSource || !nextDayTideSource) {
    return {
      weather: slicedWeatherData,
      tide: {
        moon: { age: 'N/A', title: '' },
        sun: { rise: '', set: '' },
        tide: [],
        flood: [],
        edd: [],
      },
      prediction: apiData.prediction,
    };
  }

  // isNextDayとfullTimeプロパティを付与するヘルパー関数
  const processTideEvents = (events: any[], isNextDay: boolean, dateString: string) => {
    return events.map((e: any) => ({
      ...e,
      isNextDay,
      fullTime: `${dateString}T${e.time}`,
    }));
  };

  // グラフ用データ (tide)
  const todayTideChart = processTideEvents(todayTideSource.tide, false, date)
    .filter((t: any) => t.time !== '24:00'); // 24:00のデータを重複回避のため除外

  const nextDayTideChart = processTideEvents(nextDayTideSource.tide, true, nextDateStr)
    .filter((t: any) => {
      const [hour] = t.time.split(':').map(Number);
      return hour <= 4; // 翌日の4時まで
    });

  // 満潮 (flood)
  const todayFlood = processTideEvents(todayTideSource.flood, false, date)
    .filter((t: any) => t.time !== '24:00');

  const nextDayFlood = processTideEvents(nextDayTideSource.flood, true, nextDateStr)
    .filter((f: any) => {

      const [hour, minute] = f.time.split(':').map(Number);
      return hour < 4 || (hour === 4 && minute === 0);
    });

  // 干潮 (edd)
  const todayEdd = processTideEvents(todayTideSource.edd, false, date)
    .filter((t: any) => t.time !== '24:00');
    
  const nextDayEdd = processTideEvents(nextDayTideSource.edd, true, nextDateStr)
    .filter((e: any) => {
      const [hour, minute] = e.time.split(':').map(Number);
      return hour < 4 || (hour === 4 && minute === 0);
    });

  // 最終的なTideDataオブジェクトを構築
  const tideData: TideData = {
    ...todayTideSource, // moon や title などの基本情報を引き継ぐ
    tide: [...todayTideChart, ...nextDayTideChart],
    flood: [...todayFlood, ...nextDayFlood],
    edd: [...todayEdd, ...nextDayEdd],
  };

  return { weather: slicedWeatherData, tide: tideData, prediction: apiData.prediction };
}

// --- ページ本体 (サーバーコンポーネント) ---
export default async function DetailPage({ params }: { params: { date: string } }) {
  const { date } = params;

  if (date === MOCK_DATE) {
    const lastUpdated = getLastUpdateTime();
    return <DetailClientView 
      date={date} 
      weather={mockWeather} 
      tide={mockTide} 
      prediction={mockPrediction}
      lastUpdatedISO={lastUpdated.toISOString()} 
    />;
  }

  // --- 日付の妥当性チェック ---
  const now = new Date();
  const targetDate = new Date(date);
  now.setHours(0, 0, 0, 0);

  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 1); // 昨日

  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 7); // 6日後

  if (targetDate < startDate || targetDate > endDate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto bg-slate-900/70 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-xl text-center p-8 space-y-6">
          <div className="flex justify-center">
            <ShieldAlert className="w-12 h-12 text-blue-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">
              データ範囲外です
            </h2>
            <p className="text-slate-400 max-w-sm mx-auto">
              予報データは今日から1週間後までの範囲で表示できます。
            </p>
          </div>
          <a 
            href="/" 
            className="inline-block bg-slate-800 text-white px-6 py-2 rounded-full font-medium hover:bg-slate-700 transition-colors border border-slate-600"
          >
            ホームに戻る
          </a>
        </div>
      </div>
    );
  }

  // --- データ取得と画面表示 ---
  try {
    const { weather, tide, prediction } = await fetchDetailData(date);
    const lastUpdated = getLastUpdateTime();

    return <DetailClientView 
      date={date} 
      weather={weather} 
      tide={tide} 
      prediction={prediction}
      lastUpdatedISO={lastUpdated.toISOString()} 
    />;

  } catch (error) {
    console.error(error);
    return (
       <div className="min-h-screen flex flex-col items-center justify-center text-red-400 p-4">
        <h2 className="text-2xl font-bold mb-4">データ取得エラー</h2>
        <p className="mb-6">予報データの取得に失敗しました。時間をおいて再読み込みしてください。</p>
        <a href="/" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
          ホームに戻る
        </a>
      </div>
    )
  }
}