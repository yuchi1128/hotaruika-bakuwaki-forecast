import DetailClientView from '@/app/detail/[date]/DetailClientView';
import {
  MOCK_DATE,
  mockWeather,
  mockTide,
  mockPrediction,
} from '@/app/detail/[date]/mockData';
import { getLastUpdateTime } from '@/lib/utils';

const mockPredictionDates = [
  '2025-05-24',
  '2025-05-25',
  MOCK_DATE,
  '2025-05-27',
  '2025-05-28',
];

export default function DetailPreviewPage({ params }: { params: { date: string } }) {
  // URLのdateパラメータを使用しつつ、デモデータは固定
  const displayDate = params.date || MOCK_DATE;
  const lastUpdated = getLastUpdateTime();

  return (
    <DetailClientView
      date={displayDate}
      weather={mockWeather}
      tide={mockTide}
      prediction={mockPrediction}
      lastUpdatedISO={lastUpdated.toISOString()}
      isPreview={true}
      predictionDates={mockPredictionDates}
    />
  );
}
