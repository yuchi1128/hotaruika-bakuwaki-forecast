'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Send, Calendar, MapPin, Waves, Thermometer, Moon, ThumbsUp, ThumbsDown, Image as ImageIcon, Wind } from 'lucide-react';
import CommentItem from '@/components/CommentItem';
import { saveReaction, getReaction } from '@/lib/utils';
import { Skeleton } from "@/components/ui/skeleton"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


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
  image_url: string | null;
  label: string;
  created_at: string;
  good_count: number;
  bad_count: number;
}

interface Reply {
  id: number;
  post_id: number;
  parent_reply_id: number | null;
  username:string;
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
  { level: 4, name: '大湧き', description: '素晴らしい身投げが期待できます', color: 'text-yellow-300', bgColor: 'bg-yellow-500/[.14] border border-yellow-400/20 backdrop-blur-sm' },
  { level: 5, name: '爆湧き', description: '最高の身投げが期待できます！', color: 'text-pink-300', bgColor: 'bg-pink-500/[.14] border border-pink-400/20 backdrop-blur-sm' },
];

const getWeatherFromCode = (code: number): string => {
  const weatherMap: { [key: number]: string } = {
    0: '快晴',
    1: '晴れ',
    2: '晴れ',
    3: '曇り',
    4: '煙霧',
    5: 'もや',
    10: '霧',
    11: '地霧',
    12: '地霧',
    17: '雷電',
    18: 'スコール',
    20: '霧雨',
    21: '雨',
    22: '雪',
    23: '雨と雪',
    24: '着氷性の雨',
    25: 'しゅう雨',
    26: 'しゅう雪',
    27: 'しゅうひょう',
    41: '霧（薄）',
    42: '霧（薄）',
    43: '霧（濃）',
    44: '霧（濃）',
    45: '霧（濃）',
    46: '霧（濃）',
    47: '霧（濃）',
    48: '霧（濃）',
    49: '霧（濃）',
    51: '霧雨（弱）',
    53: '霧雨（並）',
    55: '霧雨（強）',
    61: '雨（弱）',
    63: '雨（並）',
    65: '雨（強）',
    71: '雪（弱）',
    73: '雪（並）',
    75: '雪（強）',
    80: 'しゅう雨（弱）',
    81: 'しゅう雨（並）',
    82: 'しゅう雨（強）',
    95: '雷電',
    97: '雷電（ひょう）'
  };
  return weatherMap[code] || '不明';
};

const getWindDirection = (degrees: number): string => {
  const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export default function Home() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<DayPrediction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('その他');
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForecasts();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedFilterLabel]);

  const fetchForecasts = async () => {
    setLoading(true);
    setError(null);
    try {

      // 開発用にモックデータを使用する場合は、以下のコメントアウトを解除し、API取得部分をコメントアウトしてください。
      const mockData: ForecastData[] = [
        { date: "2025-08-08", predicted_amount: 1.3, moon_age: 14.3, weather_code: 55, temperature_max: 29.6, temperature_min: 22.6, precipitation_probability_max: 88, dominant_wind_direction: 218 },
        { date: "2025-08-09", predicted_amount: 0.3, moon_age: 15.3, weather_code: 51, temperature_max: 31, temperature_min: 21.9, precipitation_probability_max: 15, dominant_wind_direction: 63 },
        { date: "2025-08-10", predicted_amount: 0.6, moon_age: 16.3, weather_code: 63, temperature_max: 24.9, temperature_min: 23.4, precipitation_probability_max: 98, dominant_wind_direction: 120 },
        { date: "2025-08-11", predicted_amount: 0.8, moon_age: 17.3, weather_code: 80, temperature_max: 31.2, temperature_min: 23.6, precipitation_probability_max: 80, dominant_wind_direction: 224 },
        { date: "2025-08-12", predicted_amount: 1.1, moon_age: 18.3, weather_code: 63, temperature_max: 25.8, temperature_min: 24.6, precipitation_probability_max: 78, dominant_wind_direction: 356 },
        { date: "2025-08-13", predicted_amount: 1.3, moon_age: 19.3, weather_code: 80, temperature_max: 27.4, temperature_min: 25.2, precipitation_probability_max: 54, dominant_wind_direction: 287 },
        { date: "2025-08-14", predicted_amount: 0.0, moon_age: 20.3, weather_code: 3, temperature_max: 31.1, temperature_min: 24.2, precipitation_probability_max: 53, dominant_wind_direction: 283 },
      ];
      const data = mockData;
      

      // // 本番環境ではこちらのAPIからデータを取得します。
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict/week`);
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      // const data: ForecastData[] = await response.json();
      
      
      const mappedPredictions: DayPrediction[] = data.map(forecast => {
        const date = new Date(forecast.date);
        if (isNaN(date.getTime())) {
          console.error("Invalid date received from API:", forecast.date);
          return null;
        }

        let level = 0;
        if (forecast.predicted_amount >= 1.25) {
          level = 5; // 爆湧き
        } else if (forecast.predicted_amount >= 1.0) {
          level = 4; // 大湧き
        } else if (forecast.predicted_amount >= 0.75) {
          level = 3; // 湧き
        } else if (forecast.predicted_amount >= 0.5) {
          level = 2; // チョイ湧き
        } else if (forecast.predicted_amount >= 0.25) {
          level = 1; // プチ湧き
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
      }).filter(p => p !== null) as DayPrediction[];

      setPredictions(mappedPredictions);
    } catch (error) {
      console.error("Failed to fetch forecasts:", error);
      setError('データの取得に失敗しました。しばらくしてから再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      let url = 'http://localhost:8080/api/posts';
      if (selectedFilterLabel) {
        url += `?label=${selectedFilterLabel}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Post[] = await response.json();
      
      const commentsWithReplies: Comment[] = await Promise.all(data.map(async post => {
        const replies = await fetchRepliesForPost(post.id);
        return {
          ...post,
          replies: replies.map(reply => ({
            ...reply,
            goodCount: reply.good_count,
            badCount: reply.bad_count,
            myReaction: getReaction('reply', reply.id),
          })),
          goodCount: post.good_count,
          badCount: post.bad_count,
          myReaction: getReaction('post', post.id),
        };
      }));
      setComments(commentsWithReplies);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchRepliesForPost = async (postId: number): Promise<Reply[]> => {
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${postId}/replies`);
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

  const createPost = async (username: string, content: string, label: string, imageBase64: string | null) => {
    try {
      const response = await fetch('http://localhost:8080/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, content, label, image_url: imageBase64 }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const createReply = async (targetId: number, type: 'post' | 'reply', username: string, content: string) => {
    try {
      const endpoint = type === 'post' ? `/api/posts/${targetId}/replies` : `/api/replies/${targetId}/replies`;
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, content }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPosts();
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const createReaction = async (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => {
    try {
      const endpoint = type === 'post' ? `/api/posts/${targetId}/reaction` : `/api/replies/${targetId}/reaction`;
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      saveReaction(type, targetId, reactionType);
      fetchPosts();
    } catch (error) {
      console.error("Failed to create reaction:", error);
    }
  };

  const renderHotaruikaIcons = (level: number, src: string, size = 'w-8 h-8', animated = true) => {
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
    router.push(`/detail/${dateString}`);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !authorName.trim()) return;

    let imageBase64: string | null = null;
    if (selectedImage) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        imageBase64 = reader.result as string;
        await createPost(authorName, newComment, selectedLabel, imageBase64);
        setNewComment('');
        setAuthorName('');
        setSelectedImage(null);
        setSelectedLabel('その他');
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
    } else {
      await createPost(authorName, newComment, selectedLabel, null);
      setNewComment('');
      setAuthorName('');
      setSelectedImage(null);
      setSelectedLabel('その他');
    }
  };

  

  const handleReaction = (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => {
    createReaction(targetId, type, reactionType);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (date: Date) => {
    const datePart = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const timePart = date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${datePart} ${timePart}`;
  };

  const todayPrediction = predictions[0];
  const weekPredictions = predictions.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen relative z-10">
        <header className="text-center py-12 px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              ホタルイカ爆湧き予報
            </h1>
          </div>
          <p className="text-base md:text-lg text-blue-200 mb-1">富山湾の神秘を予測</p>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-300">
            <MapPin className="w-3 h-3" />
            <span>富山湾</span>
            <Waves className="w-3 h-3 ml-3" />
            <span>リアルタイム予測</span>
          </div>
        </header>
        <div className="main-container max-w-6xl mx-auto px-3 sm:px-4 pb-12">
          <Card className="mb-8 glow-effect clickable-card bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
            <CardHeader className="text-center">
              <Skeleton className="h-8 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </CardHeader>
            <CardContent className="text-center">
              <Skeleton className="h-48 w-full mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="mb-8 bg-gradient-to-br from-slate-900/40 to-blue-900/40 border-blue-500/20">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  const todayIcons = todayPrediction ? renderHotaruikaIcons(todayPrediction.level, '/hotaruika_aikon.png', 'w-16 h-16 md:w-20 md:h-20') : [];


  return (
    <div className="min-h-screen relative z-10">
      {/* ヘッダー */}
      <header className="text-center py-12 px-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            ホタルイカ爆湧き予報
          </h1>
        </div>
        <p className="text-base md:text-lg text-blue-200 mb-1">富山湾の神秘を予測</p>
        <div className="flex items-center justify-center gap-2 text-xs text-blue-300">
          <MapPin className="w-3 h-3" />
          <span>富山湾</span>
          <Waves className="w-3 h-3 ml-3" />
          <span>リアルタイム予測</span>
        </div>

      </header>

      <div className="main-container max-w-6xl mx-auto px-3 sm:px-4 pb-12">
        {/* 今日の予測 */}
        {todayPrediction && (
          <Card
            className="mb-8 glow-effect clickable-card bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 border border-blue-500/30 rounded-3xl shadow-2xl hover:shadow-blue-400/20 transition-all duration-300 transform hover:-translate-y-1"
            onClick={() => handleCardClick(todayPrediction.date)}
          >
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-1">
                今日の予報
              </CardTitle>
              <p className="text-blue-300">{formatDate(todayPrediction.date)}</p>
            </CardHeader>
            <CardContent className="text-center px-4 pb-8">
              <div className={`inline-block px-4 sm:px-8 py-4 rounded-2xl ${predictionLevels[todayPrediction.level].bgColor} mb-6`}>
                <div className={`text-3xl md:text-4xl font-bold mb-2 ${predictionLevels[todayPrediction.level].color}`}>
                  {predictionLevels[todayPrediction.level].name}
                </div>

                <div className="mb-4">
                  {todayPrediction.level === 5 ? (
                    <>
                      <div className="flex flex-col items-center sm:hidden">
                        <div className="flex justify-center gap-2">
                          {todayIcons.slice(0, 3)}
                        </div>
                        <div className="flex justify-center gap-2 -mt-3">
                          {todayIcons.slice(3, 5)}
                        </div>
                      </div>
                      <div className="hidden sm:flex justify-center gap-2">
                        {todayIcons}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-center items-center gap-2 min-h-[80px] md:min-h-[96px]">
                      {todayIcons}
                    </div>
                  )}
                </div>

                <p className="text-lg text-gray-300">
                  {predictionLevels[todayPrediction.level].description}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center text-blue-300 mb-1">
                    <Thermometer className="w-5 h-5 mr-1.5" />
                    <p className="text-sm font-medium">気温</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{`${todayPrediction.temperature_max}℃/${todayPrediction.temperature_min}℃`}</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center text-blue-300 mb-1">
                    <Waves className="w-5 h-5 mr-1.5" />
                    <p className="text-sm font-medium">天気</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{todayPrediction.weather}</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center text-blue-300 mb-1">
                    <Moon className="w-5 h-5 mr-1.5" />
                    <p className="text-sm font-medium">月齢</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{todayPrediction.moonAge.toFixed(1)}</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center text-blue-300 mb-1">
                    <Wind className="w-5 h-5 mr-1.5" />
                    <p className="text-sm font-medium">風</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{todayPrediction.wind_direction}</p>
                </div>
              </div>
              <p className="text-sm text-blue-300 mt-6 opacity-70 hover:opacity-100 transition-opacity">
                クリックで詳細を見る
              </p>
            </CardContent>
          </Card>
        )}

        {/* 週間予測 */}
        <Card className="mb-16 bg-transparent border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-7 h-7 text-blue-300" />
              週間予報
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {weekPredictions.map((prediction, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                    <div
                      className={`flex flex-col items-center p-4 rounded-2xl border clickable-card h-full border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 backdrop-blur-sm bg-white/5`}
                      onClick={() => handleCardClick(prediction.date)}
                    >
                      <p className="text-base font-semibold text-blue-200 mb-2">
                        {formatDate(prediction.date)}
                      </p>
                      <div className={`text-lg font-bold mb-3 ${predictionLevels[prediction.level].color}`}>
                        {predictionLevels[prediction.level].name}
                      </div>
                      <div className="flex justify-center items-center h-10 mb-4">
                        {renderHotaruikaIcons(prediction.level, '/hotaruika_aikon.png', 'w-8 h-8', false)}
                      </div>
                      <div className="w-full space-y-2 text-xs text-gray-300">
                        <div className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                          <div className="flex items-center">
                            <Thermometer className="w-4 h-4 inline mr-1.5 text-blue-400" />
                            <span>気温</span>
                          </div>
                          <span className="font-medium">{`${prediction.temperature_max}℃/${prediction.temperature_min}℃`}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                          <div className="flex items-center">
                            <Waves className="w-4 h-4 inline mr-1.5 text-blue-400" />
                            <span>天気</span>
                          </div>
                          <span className="font-medium">{prediction.weather}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                          <div className="flex items-center">
                            <Moon className="w-4 h-4 inline mr-1.5 text-blue-400" />
                            <span>月齢</span>
                          </div>
                          <span className="font-medium">{prediction.moonAge.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                          <div className="flex items-center">
                            <Wind className="w-4 h-4 inline mr-1.5 text-blue-400" />
                            <span>風</span>
                          </div>
                          <span className="font-medium">{prediction.wind_direction}</span>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-12px] sm:left-[-20px] top-1/2 -translate-y-1/2 flex xl:hidden bg-slate-800/50 hover:bg-slate-700/80 border-slate-600 z-10" />
              <CarouselNext className="absolute right-[-12px] sm:right-[-20px] top-1/2 -translate-y-1/2 flex xl:hidden bg-slate-800/50 hover:bg-slate-700/80 border-slate-600 z-10" />
            </Carousel>
          </CardContent>
        </Card>

        {/* 口コミ掲示板 */}
        <Card className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold text-purple-200 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              みんなの口コミ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* コメント投稿フォーム */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  placeholder="お名前"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="h-9 bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
                />
              </div>
              <Textarea
                placeholder="ホタルイカについてご自由にお書きください！　現地の情報の場合、場所と一緒にお書きください！"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-4 bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
                rows={5}
              />
              <div className="flex items-center gap-2 mb-4">
                <label htmlFor="image-upload" className="cursor-pointer flex items-center text-sm md:text-base text-gray-400 hover:text-gray-200">
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                  画像を選択
                </label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {selectedImage && <span className="text-sm text-gray-300">{selectedImage.name}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="text-gray-300 text-xs font-bold">ラベル：</span>
                <Button
                  variant={selectedLabel === '現地情報' ? 'default' : 'outline'}
                  onClick={() => setSelectedLabel('現地情報')}
                  className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm ${selectedLabel === '現地情報' ? "bg-purple-600 hover:bg-purple-700" : "border-purple-500 text-purple-300 hover:bg-purple-900/20"}`}
                >
                  現地情報
                </Button>
                <Button
                  variant={selectedLabel === 'その他' ? 'default' : 'outline'}
                  onClick={() => setSelectedLabel('その他')}
                  className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm ${selectedLabel === 'その他' ? "bg-purple-600 hover:bg-purple-700" : "border-purple-500 text-purple-300 hover:bg-purple-900/20"}`}
                >
                  その他
                </Button>
              </div>
              <Button
                onClick={handleSubmitComment}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!newComment.trim() || !authorName.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                投稿する
              </Button>
            </div>

            {/* ラベルフィルター */}
            <div className="mb-7 flex flex-wrap items-center gap-2">
              <span className="text-gray-300 text-xs font-bold">フィルター：</span>
              <Button
                variant={selectedFilterLabel === null ? 'default' : 'outline'}
                onClick={() => setSelectedFilterLabel(null)}
                className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm ${selectedFilterLabel === null ? "bg-blue-600 hover:bg-blue-700" : "border-blue-500 text-blue-300 hover:bg-blue-900/20"}`}
              >
                全て
              </Button>
              <Button
                variant={selectedFilterLabel === '現地情報' ? 'default' : 'outline'}
                onClick={() => setSelectedFilterLabel('現地情報')}
                className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm ${selectedFilterLabel === '現地情報' ? "bg-blue-600 hover:bg-blue-700" : "border-blue-500 text-blue-300 hover:bg-blue-900/20"}`}
                >
                現地情報
              </Button>
              <Button
                variant={selectedFilterLabel === 'その他' ? 'default' : 'outline'}
                onClick={() => setSelectedFilterLabel('その他')}
                className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm ${selectedFilterLabel === 'その他' ? "bg-blue-600 hover:bg-blue-700" : "border-blue-500 text-blue-300 hover:bg-blue-900/20"}`}
              >
                その他
              </Button>
            </div>

            {/* コメント一覧 */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  handleReaction={handleReaction}
                  formatTime={formatTime}
                  createReply={createReply}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フッター */}
      <footer className="text-center py-8 text-gray-400 border-t border-blue-500/20">
        <p className="mb-2">© 2024 ホタルイカ身投げ予測サイト</p>
        <p className="text-sm">富山湾の神秘をお届けします</p>
      </footer>
    </div>
  );
}