'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveReaction, getReaction, removeReaction } from '@/lib/client-utils';
import {
  getWeatherFromCode,
  getWindDirection,
  getLastUpdateTime,
  formatDateForWeek,
  formatDate,
  formatTime,
  getOffSeasonMessage,
} from '@/lib/utils';

import LoadingScreen from '@/components/common/LoadingScreen';
import AppHeader from '@/components/common/AppHeader';
import AppFooter from '@/components/common/AppFooter';
import TodayForecast from '@/components/Forecast/TodayForecast';
import WeeklyForecast from '@/components/Forecast/WeeklyForecast';
import CommentSection from '@/components/Community/CommentSection';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Interfaces
interface PredictionLevel {
  level: number;
  name: string;
  description: string;
  color: string;
  bgColor: string;
}

interface DayPrediction {
  date: Date;
  level: number;
  temperature_max: number;
  temperature_min: number;
  weather: string;
  moonAge: number;
  wind_direction: string;
}

interface Post {
  id: number;
  username: string;
  content: string;
  image_urls: string[];
  label: string;
  created_at: string;
  good_count: number;
  bad_count: number;
}

interface Reply {
  id: number;
  post_id: number;
  parent_reply_id: number | null;
  username: string;
  content: string;
  created_at: string;
  good_count: number;
  bad_count: number;
  myReaction: 'good' | 'bad' | null;
  parent_username?: string;
}

interface Comment extends Post {
  replies: Reply[];
  goodCount: number;
  badCount: number;
  myReaction: 'good' | 'bad' | null;
}

interface ForecastData {
  date: string;
  predicted_amount: number;
  moon_age: number;
  weather_code: number;
  temperature_max: number;
  temperature_min: number;
  precipitation_probability_max: number;
  dominant_wind_direction: number;
}

const predictionLevels: PredictionLevel[] = [
  { level: 0, name: '湧きなし', description: '身投げは期待できません', color: 'text-gray-300', bgColor: 'bg-gray-500/20 border border-gray-400/20 backdrop-blur-sm' },
  { level: 1, name: 'プチ湧き', description: '少し期待できるかも', color: 'text-blue-300', bgColor: 'bg-blue-500/[.14] border border-blue-400/20 backdrop-blur-sm' },
  { level: 2, name: 'チョイ湧き', description: 'そこそこ期待できます', color: 'text-cyan-300', bgColor: 'bg-cyan-500/[.14] border border-cyan-400/20 backdrop-blur-sm' },
  { level: 3, name: '湧き', description: '良い身投げが期待できます', color: 'text-green-300', bgColor: 'bg-green-500/[.14] border border-green-400/20 backdrop-blur-sm' },
  { level: 4, name: '大湧き', description: '素晴らしい身投げが期待できます！！', color: 'text-yellow-300', bgColor: 'bg-yellow-500/[.14] border border-yellow-400/20 backdrop-blur-sm' },
  { level: 5, name: '爆湧き', description: '今季トップクラスの身投げが期待できます！！！', color: 'text-pink-300', bgColor: 'bg-pink-500/[.14] border border-pink-400/20 backdrop-blur-sm' },
];

export default function Home() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<DayPrediction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const pendingReactions = useRef(new Set<string>());

  useEffect(() => {
    fetchForecasts();
    fetchPosts();
  }, []);

  const fetchForecasts = async () => {
    setLoading(true);
    setError(null);
    try {
      // 開発用にモックデータを使用する場合は、以下のコメントアウトを解除し、API取得部分をコメントアウトしてください。
      const mockData: ForecastData[] = [
        { date: "2025-05-26", predicted_amount: 1.3, moon_age: 18.3, weather_code: 63, temperature_max: 25.8, temperature_min: 24.6, precipitation_probability_max: 78, dominant_wind_direction: 356 },
        { date: "2025-05-27", predicted_amount: 0.1, moon_age: 19.3, weather_code: 80, temperature_max: 27.4, temperature_min: 25.2, precipitation_probability_max: 54, dominant_wind_direction: 287 },
        { date: "2025-05-28", predicted_amount: 0.3, moon_age: 20.3, weather_code: 3, temperature_max: 31.1, temperature_min: 24.2, precipitation_probability_max: 53, dominant_wind_direction: 283 },
        { date: "2025-05-29", predicted_amount: 0.6, moon_age: 21.3, weather_code: 51, temperature_max: 31, temperature_min: 21.9, precipitation_probability_max: 15, dominant_wind_direction: 63 },
        { date: "2025-05-30", predicted_amount: 0.9, moon_age: 22.3, weather_code: 63, temperature_max: 24.9, temperature_min: 23.4, precipitation_probability_max: 98, dominant_wind_direction: 120 },
        { date: "2025-05-31", predicted_amount: 1.2, moon_age: 23.3, weather_code: 80, temperature_max: 31.2, temperature_min: 23.6, precipitation_probability_max: 80, dominant_wind_direction: 224 },
        { date: "2025-06-01", predicted_amount: 1.1, moon_age: 24.3, weather_code: 63, temperature_max: 25.8, temperature_min: 24.6, precipitation_probability_max: 78, dominant_wind_direction: 356 },
      ];
      const data = mockData;
      const mappedPredictions: DayPrediction[] = data
        .map((forecast) => {
          const date = new Date(forecast.date);
          if (isNaN(date.getTime())) {
            console.error('Invalid date received from API:', forecast.date);
            return null;
          }
          const month = date.getMonth();
          const isSeason = month >= 1 && month <= 4;
          let level = -1;
          if (isSeason) {
            if (forecast.predicted_amount >= 1.4) {
              level = 5;
            } else if (forecast.predicted_amount >= 1.15) {
              level = 4;
            } else if (forecast.predicted_amount >= 0.9) {
              level = 3;
            } else if (forecast.predicted_amount >= 0.65) {
              level = 2;
            } else if (forecast.predicted_amount >= 0.4) {
              level = 1;
            } else {
              level = 0;
            }
          }
          return {
            date,
            level,
            temperature_max: forecast.temperature_max,
            temperature_min: forecast.temperature_min,
            weather: getWeatherFromCode(forecast.weather_code),
            moonAge: forecast.moon_age,
            wind_direction: getWindDirection(forecast.dominant_wind_direction),
          };
        })
        .filter((p) => p !== null) as DayPrediction[];
      setPredictions(mappedPredictions);
      setLastUpdated(getLastUpdateTime());
    } catch (error) {
      console.error('Failed to fetch forecasts:', error);
      setError('データの取得に失敗しました。しばらくしてから再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (label?: string | null) => {
    try {
      let url = `${API_URL}/api/posts`;
      if (label) {
        url += `?label=${encodeURIComponent(label)}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Post[] = await response.json();
      const commentsWithReplies: Comment[] = await Promise.all(
        data.map(async (post) => {
          const replies = await fetchRepliesForPost(post.id);
          return {
            ...post,
            replies: replies.map((reply) => ({
              ...reply,
              goodCount: reply.good_count,
              badCount: reply.bad_count,
              myReaction: getReaction('reply', reply.id),
            })),
            goodCount: post.good_count,
            badCount: post.bad_count,
            myReaction: getReaction('post', post.id),
          };
        })
      );
      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const fetchRepliesForPost = async (postId: number): Promise<Reply[]> => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/replies`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Reply[] = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to fetch replies for post ${postId}:`, error);
      return [];
    }
  };

  const createPost = async (username: string, content: string, label: string, imageBase64s: string[]) => {
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, content, label, image_urls: imageBase64s }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
        setIsSubmittingComment(false);
    }
  };

  const createReply = async (targetId: number, type: 'post' | 'reply', username: string, content: string) => {
    try {
      const endpoint = type === 'post' ? `/api/posts/${targetId}/replies` : `/api/replies/${targetId}/replies`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, content }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchPosts();
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const createReaction = async (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => {
    const key = `${type}_${targetId}`;

    // 既に処理中またはリアクション済みの場合は何もしない（連打防止）
    if (pendingReactions.current.has(key) || getReaction(type, targetId) !== null) {
      return;
    }

    // 処理中としてマーク（同期的に即座に設定）
    pendingReactions.current.add(key);

    // APIリクエスト前にLocalStorageを更新してボタンを即座に無効化
    saveReaction(type, targetId, reactionType);

    // UIを即座に更新
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (type === 'post' && comment.id === targetId) {
          return {
            ...comment,
            myReaction: reactionType,
            goodCount: reactionType === 'good' ? comment.goodCount + 1 : comment.goodCount,
            badCount: reactionType === 'bad' ? comment.badCount + 1 : comment.badCount,
          };
        }
        if (type === 'reply') {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === targetId
                ? {
                    ...reply,
                    myReaction: reactionType,
                    good_count: reactionType === 'good' ? reply.good_count + 1 : reply.good_count,
                    bad_count: reactionType === 'bad' ? reply.bad_count + 1 : reply.bad_count,
                  }
                : reply
            ),
          };
        }
        return comment;
      })
    );

    try {
      const endpoint = type === 'post' ? `/api/posts/${targetId}/reaction` : `/api/replies/${targetId}/reaction`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to create reaction:', error);
      // API失敗時はLocalStorageをクリアしてサーバーから最新状態を取得
      removeReaction(type, targetId);
      await fetchPosts();
    } finally {
      // 処理完了後にpendingから削除
      pendingReactions.current.delete(key);
    }
  };

  const renderHotaruikaIcons = (level: number, src: string, size = 'w-8 h-8', animated = true) => {
    if (level <= 0) return [];
    return Array.from({ length: level }).map((_, index) => (
      <img
        key={index}
        src={src}
        alt="ホタルイカ"
        className={`${size} ${animated ? 'floating' : ''} [filter:drop-shadow(0_0_0.5rem_rgba(255,255,255,0.8))]`}
        style={{ animationDelay: `${index * 0.5}s` }}
      />
    ));
  };

  const handleCardClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    if (dateString === '2025-05-26') {
      router.push(`/preview/detail/${dateString}`);
    } else {
      router.push(`/detail/${dateString}`);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  const todayPrediction = predictions[0];
  const weekPredictions = predictions.slice(1);

  return (
    <div className="min-h-screen relative z-10">
       <Dialog open={isSubmittingComment}>
        <DialogContent
          showCloseButton={false}
          className="w-auto bg-slate-800/80 border-blue-500/50 text-white shadow-lg backdrop-blur-md rounded-lg flex items-center justify-center p-6"
        >
          <DialogTitle className="sr-only">送信中</DialogTitle>
          <DialogDescription className="sr-only">送信しています。しばらくお待ちください。</DialogDescription>
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-300" />
          <span>投稿中です...</span>
        </DialogContent>
      </Dialog>

      <AppHeader />

      <div className="main-container max-w-6xl mx-auto px-3 sm:px-4 pb-12">
        {todayPrediction && (
          <TodayForecast 
            todayPrediction={todayPrediction}
            predictionLevels={predictionLevels}
            lastUpdated={lastUpdated}
            handleCardClick={handleCardClick}
            formatDate={formatDate}
            getOffSeasonMessage={getOffSeasonMessage}
            renderHotaruikaIcons={renderHotaruikaIcons}
            isHelpDialogOpen={isHelpDialogOpen}
            setIsHelpDialogOpen={setIsHelpDialogOpen}
          />
        )}

        <WeeklyForecast 
          weekPredictions={weekPredictions}
          predictionLevels={predictionLevels}
          formatDateForWeek={formatDateForWeek}
          renderHotaruikaIcons={renderHotaruikaIcons}
          handleCardClick={handleCardClick}
        />

        <CommentSection 
          comments={comments}
          handleReaction={createReaction}
          formatTime={formatTime}
          createReply={createReply}
          createPost={createPost}
          fetchPosts={fetchPosts}
        />
      </div>

      <AppFooter />
    </div>
  );
}