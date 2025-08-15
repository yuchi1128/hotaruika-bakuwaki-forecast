import DetailClientView from './DetailClientView'; // クライアントコンポーネント
import type { HourlyWeather, TideData } from './types'; 

// --- データ取得関数 ---
async function fetchWeatherData(targetDate: string): Promise<HourlyWeather[]> {
  const startDate = targetDate;
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=36.76&longitude=137.24&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%2FTokyo&wind_speed_unit=ms&start_date=${startDate}&end_date=${endDateStr}`;
  const response = await fetch(weatherApiUrl, { next: { revalidate: 3600 } }); 
  if (!response.ok) throw new Error('気象データの取得に失敗');
  const apiData = await response.json();

  const formattedData: HourlyWeather[] = apiData.hourly.time.map((t: string, i: number) => ({
    time: t,
    temperature: apiData.hourly.temperature_2m[i],
    precipitation: apiData.hourly.precipitation[i],
    precipitation_probability: apiData.hourly.precipitation_probability[i],
    weather_code: apiData.hourly.weather_code[i],
    wind_speed: apiData.hourly.wind_speed_10m[i],
    wind_direction: apiData.hourly.wind_direction_10m[i],
  }));
  
  const startIndex = formattedData.findIndex(d => d.time === `${startDate}T00:00`);
  const endIndex = formattedData.findIndex(d => d.time === `${endDateStr}T04:00`);

  if (startIndex !== -1 && endIndex !== -1) {
    return formattedData.slice(startIndex, endIndex + 1);
  }

  return formattedData.slice(0, 24);
};

async function fetchTideData(targetDate: string): Promise<TideData> {
  const [year, month, day] = targetDate.split('-');
  const tideApiUrl = `https://tide736.net/api/get_tide.php?pc=16&hc=3&yr=${year}&mn=${month}&dy=${day}&rg=day`;
  const response = await fetch(tideApiUrl, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error('潮汐データの取得に失敗');
  const apiData = await response.json();
  return apiData.tide.chart[`${year}-${month}-${day}`];
};


// --- ページ本体 (サーバーコンポーネント) ---
export default async function DetailPage({ params }: { params: { date: string } }) {
  const { date } = params;

  try {
    const [weatherData, tideData] = await Promise.all([
      fetchWeatherData(date),
      fetchTideData(date),
    ]);

    return <DetailClientView date={date} weather={weatherData} tide={tideData} />;

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