import type { HourlyWeather, TideData, Prediction } from './types';

export const MOCK_DATE = '2025-05-26';

export const mockPrediction: Prediction = {
  date: `${MOCK_DATE}T00:00:00Z`,
  predicted_amount: 1.5, // 爆湧きレベル
  moon_age: 28.5,
  weather_code: 1,
  temperature_max: 18,
  temperature_min: 12,
  precipitation_probability_max: 0,
  dominant_wind_direction: 16,
};

const weatherData: HourlyWeather[] = [];
const startDate = new Date(MOCK_DATE + 'T00:00:00Z');
// 28時間分のデータを生成
for (let i = 0; i < 28; i++) {
    const d = new Date(startDate);
    d.setUTCHours(d.getUTCHours() + i);
    weatherData.push({
        time: d.toISOString().substring(0, 16),
        temperature: 15 + Math.sin((i - 10) * Math.PI / 12) * 3, // 日中の気温が少し高くなるように調整
        precipitation: 0,
        precipitation_probability: 0,
        weather_code: i > 6 && i < 18 ? 1 : 2, // 日中は晴れ、夜は曇り
        wind_speed: 2.5,
        wind_direction: 16,
    });
}
export const mockWeather = weatherData;

// --- 潮汐デモデータの生成ロジックを修正 ---

// 1. まず連続した潮位グラフデータを生成
const tideChartRawData = Array.from({ length: 28 * 2 }, (_, i) => {
  const hour = i / 2;
  const d = new Date(MOCK_DATE + "T00:00:00Z");
  d.setUTCHours(d.getUTCHours() + hour);
  const angle = (hour - 1.5) * Math.PI / 6; // 1:30に満潮となるようなcos波
  const cm = 70 + Math.cos(angle) * 50;
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`;
  return {
    time,
    cm: Math.round(cm),
    isNextDay: d.getUTCDate() > new Date(MOCK_DATE).getUTCDate(),
    fullTime: d.toISOString(),
  };
});

// 2. 生成したグラフデータから満潮・干潮のイベントを抽出
const floodEvents = [];
const eddEvents = [];

for (let i = 1; i < tideChartRawData.length - 1; i++) {
  const prev = tideChartRawData[i-1].cm;
  const curr = tideChartRawData[i].cm;
  const next = tideChartRawData[i+1].cm;

  // 極大値（満潮）
  if (curr > prev && curr > next) {
    floodEvents.push(tideChartRawData[i]);
  }

  // 極小値（干潮）
  if (curr < prev && curr < next) {
    eddEvents.push(tideChartRawData[i]);
  }
}

export const mockTide: TideData = {
  moon: { age: '28.5', title: '新月' },
  sun: { rise: '04:30', set: '19:00' },
  flood: floodEvents,
  edd: eddEvents,
  tide: tideChartRawData,
};