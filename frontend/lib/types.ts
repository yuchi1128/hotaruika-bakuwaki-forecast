// 予測レベル
export interface PredictionLevel {
  level: number;
  name: string;
  description: string;
  color: string;
  bgColor: string;
}

// 日別予測
export interface DayPrediction {
  date: Date;
  level: number;
  temperature_max: number;
  temperature_min: number;
  weather: string;
  moonAge: number;
  wind_direction: string;
}

// APIからの予報データ
export interface ForecastData {
  date: string;
  predicted_amount: number;
  moon_age: number;
  weather_code: number;
  temperature_max: number;
  temperature_min: number;
  precipitation_probability_max: number;
  dominant_wind_direction: number;
}

// 投稿
export interface Post {
  id: number;
  username: string;
  content: string;
  image_urls: string[];
  label: string;
  created_at: string;
  good_count: number;
  bad_count: number;
}

// 返信
export interface Reply {
  id: number;
  post_id: number;
  parent_reply_id: number | null;
  username: string;
  content: string;
  label?: string;
  created_at: string;
  good_count: number;
  bad_count: number;
  myReaction: 'good' | 'bad' | null;
  parent_username?: string;
}

// コメント（投稿 + 返信 + リアクション情報）
export interface Comment extends Post {
  replies: Reply[];
  goodCount: number;
  badCount: number;
  myReaction: 'good' | 'bad' | null;
}

// ページネーションレスポンス
export interface PaginatedPostsResponse {
  posts: (Post & { replies: Reply[] })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
