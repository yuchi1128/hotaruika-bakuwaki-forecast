import DetailClientView from './DetailClientView';
import type { HourlyWeather, TideData } from './types';
import { ShieldAlert } from 'lucide-react';

// --- データ取得関数 ---
async function fetchDetailData(date: string): Promise<{ weather: HourlyWeather[], tide: TideData }> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const apiUrl = `${apiBaseUrl}/api/detail/${date}`;

  const response = await fetch(apiUrl, { next: { revalidate: 3600 } });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`詳細データの取得に失敗: ${response.status} ${errorBody}`);
  }

  const apiData = await response.json();

  const weatherData: HourlyWeather[] = apiData.weather.hourly.time.map((t: string, i: number) => ({
    time: t,
    temperature: apiData.weather.hourly.temperature_2m[i],
    precipitation: apiData.weather.hourly.precipitation[i],
    precipitation_probability: apiData.weather.hourly.precipitation_probability[i],
    weather_code: apiData.weather.hourly.weather_code[i],
    wind_speed: apiData.weather.hourly.wind_speed_10m[i],
    wind_direction: apiData.weather.hourly.wind_direction_10m[i],
  }));

  const [year, month, day] = date.split('-');
  const tideData: TideData = apiData.tide.tide.chart[`${year}-${month}-${day}`];

  const startDate = date;
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString().split('T')[0];

  const startIndex = weatherData.findIndex(d => d.time === `${startDate}T00:00`);
  const endIndex = weatherData.findIndex(d => d.time === `${endDateStr}T04:00`);

  const slicedWeatherData = (startIndex !== -1 && endIndex !== -1) 
    ? weatherData.slice(startIndex, endIndex + 1)
    : weatherData.slice(0, 24);

  return { weather: slicedWeatherData, tide: tideData };
}

// --- 最終更新日時取得関数 ---
const getLastUpdateTime = (): Date => {
  const now = new Date();
  const updateHours = [2, 5, 8, 11, 14, 17, 20, 23];
  const currentHour = now.getHours();

  const lastUpdateHourToday = [...updateHours].reverse().find((hour) => currentHour >= hour);

  const lastUpdateDate = new Date(now);

  if (lastUpdateHourToday !== undefined) {
    lastUpdateDate.setHours(lastUpdateHourToday, 0, 0, 0);
  } else {
    lastUpdateDate.setDate(now.getDate() - 1);
    lastUpdateDate.setHours(23, 0, 0, 0);
  }
  return lastUpdateDate;
};

// --- ページ本体 (サーバーコンポーネント) ---
export default async function DetailPage({ params }: { params: { date: string } }) {
  const { date } = params;

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
    const { weather, tide } = await fetchDetailData(date);
    const lastUpdated = getLastUpdateTime();

    return <DetailClientView 
      date={date} 
      weather={weather} 
      tide={tide} 
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