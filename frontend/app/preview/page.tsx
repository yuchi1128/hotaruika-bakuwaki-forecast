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
  getPredictionLevel,
} from '@/lib/utils';
import type {
  DayPrediction,
  Comment,
  ForecastData,
  PaginatedPostsResponse,
} from '@/lib/types';
import { API_URL } from '@/lib/constants';

import LoadingScreen from '@/components/common/LoadingScreen';
import AppHeader from '@/components/common/AppHeader';
import AppFooter from '@/components/common/AppFooter';
import TodayForecast from '@/components/Forecast/TodayForecast';
import WeeklyForecast from '@/components/Forecast/WeeklyForecast';
import CommentSection from '@/components/Community/CommentSection';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

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

  // ページネーション用state
  const [totalComments, setTotalComments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchForecasts();
    fetchPosts({});
  }, []);

  const fetchForecasts = async () => {
    setLoading(true);
    setError(null);
    try {
      // 開発用にモックデータを使用する場合は、以下のコメントアウトを解除し、API取得部分をコメントアウトしてください。
      const mockData: ForecastData[] = [
        { date: "2025-05-26", predicted_amount: 1.4, moon_age: 18.3, weather_code: 63, temperature_max: 25.8, temperature_min: 18.6, precipitation_probability_max: 78, dominant_wind_direction: 356 },
        { date: "2025-05-27", predicted_amount: 0.1, moon_age: 19.3, weather_code: 80, temperature_max: 27.4, temperature_min: 19.2, precipitation_probability_max: 54, dominant_wind_direction: 287 },
        { date: "2025-05-28", predicted_amount: 0.6, moon_age: 20.3, weather_code: 3, temperature_max: 31.1, temperature_min: 24.2, precipitation_probability_max: 53, dominant_wind_direction: 283 },
        { date: "2025-05-29", predicted_amount: 0.8, moon_age: 21.3, weather_code: 51, temperature_max: 31, temperature_min: 21.9, precipitation_probability_max: 15, dominant_wind_direction: 63 },
        { date: "2025-05-30", predicted_amount: 1.0, moon_age: 22.3, weather_code: 63, temperature_max: 24.9, temperature_min: 23.4, precipitation_probability_max: 98, dominant_wind_direction: 120 },
        { date: "2025-05-31", predicted_amount: 1.3, moon_age: 23.3, weather_code: 80, temperature_max: 31.2, temperature_min: 23.6, precipitation_probability_max: 80, dominant_wind_direction: 224 },
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
          return {
            date,
            level: getPredictionLevel(forecast.predicted_amount, date),
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

  const fetchPosts = async (params: {
    label?: string | null;
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
  }) => {
    try {
      const { label, page = 1, limit = 30, search, sort = 'newest' } = params;
      let url = `${API_URL}/api/posts?include=replies&page=${page}&limit=${limit}&sort=${sort}`;
      if (label) {
        url += `&label=${encodeURIComponent(label)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: PaginatedPostsResponse = await response.json();
      const commentsWithReplies: Comment[] = data.posts.map((post) => ({
        ...post,
        replies: post.replies.map((reply) => ({
          ...reply,
          goodCount: reply.good_count,
          badCount: reply.bad_count,
          myReaction: getReaction('reply', reply.id),
        })),
        goodCount: post.good_count,
        badCount: post.bad_count,
        myReaction: getReaction('post', post.id),
      }));
      setComments(commentsWithReplies);
      setTotalComments(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
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
      await fetchPosts({});
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
      await fetchPosts({});
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
      await fetchPosts({});
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
          formatDateForWeek={formatDateForWeek}
          renderHotaruikaIcons={renderHotaruikaIcons}
          handleCardClick={handleCardClick}
        />

        <CommentSection
          comments={comments}
          totalComments={totalComments}
          totalPages={totalPages}
          currentPage={currentPage}
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