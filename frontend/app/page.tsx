'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Calendar, MapPin, Waves, Thermometer, Moon, ThumbsUp, ThumbsDown, Image as ImageIcon } from 'lucide-react';

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
  temperature: number;
  weather: string;
  moonPhase: string;
  moonAge: number;
  precipitation: number;
  tideInfo: string;
}

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  label: string;
  created_at: string;
}

interface Reply {
  id: number;
  post_id: number;
  parent_reply_id: number | null;
  content: string;
  created_at: string;
  goodCount: number;
  badCount: number;
  myReaction: 'good' | 'bad' | null;
}

interface Comment extends Post {
  replies: Reply[];
  goodCount: number;
  badCount: number;
  myReaction: 'good' | 'bad' | null;
}

interface ForecastData {
  date: string;
  amount: number;
  condition: string;
}

const predictionLevels: PredictionLevel[] = [
  { level: 0, name: 'なし', description: '身投げは期待できません', color: 'text-gray-400', bgColor: 'bg-gray-800' },
  { level: 1, name: 'プチ湧き', description: '少し期待できるかも', color: 'text-blue-300', bgColor: 'bg-blue-900/30' },
  { level: 2, name: 'チョイ湧き', description: 'そこそこ期待できます', color: 'text-cyan-300', bgColor: 'bg-cyan-900/30' },
  { level: 3, name: '湧き', description: '良い身投げが期待できます', color: 'text-green-300', bgColor: 'bg-green-900/30' },
  { level: 4, name: '大湧き', description: '素晴らしい身投げが期待できます', color: 'text-yellow-300', bgColor: 'bg-yellow-900/30' },
  { level: 5, name: '爆湧き', description: '最高の身投げが期待できます！', color: 'text-pink-300', bgColor: 'bg-pink-900/30' },
];

const moonPhases = ['新月', '三日月', '上弦の月', '十三夜', '満月', '十六夜', '下弦の月', '二十六夜'];

export default function Home() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<DayPrediction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState(''); // This will be removed later when user authentication is implemented
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('その他');
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<string | null>(null);

  useEffect(() => {
    fetchForecasts();
  }, []); // Run only once on component mount

  useEffect(() => {
    fetchPosts();
  }, [selectedFilterLabel]); // Re-fetch posts when filter changes

  const fetchForecasts = async () => {
    try {
      const response = await fetch('http://backend:8080/api/forecasts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ForecastData[] = await response.json();
      
      const mappedPredictions: DayPrediction[] = data.map(forecast => {
        const date = new Date(forecast.date);
        // Ensure date is valid before proceeding
        if (isNaN(date.getTime())) {
          console.error("Invalid date received from API:", forecast.date);
          return null; // Or handle error appropriately
        }

        const moonAge = (date.getDate() + 15) % 29; // 簡易的な月齢計算
        const moonPhaseIndex = Math.floor(moonAge / 3.625);

        let level = 0;
        if (forecast.amount > 150) {
          level = 5;
        } else if (forecast.amount > 100) {
          level = 4;
        } else if (forecast.amount > 50) {
          level = 3;
        } else if (forecast.amount > 20) {
          level = 2;
        } else if (forecast.amount > 0) {
          level = 1;
        }

        return {
          date,
          level,
          temperature: Math.floor(Math.random() * 15) + 5, // Mock temperature
          weather: forecast.condition,
          moonPhase: moonPhases[moonPhaseIndex] || '新月',
          moonAge: moonAge,
          precipitation: Math.floor(Math.random() * 50), // Mock precipitation
          tideInfo: ['大潮', '中潮', '小潮', '長潮'][Math.floor(Math.random() * 4)], // Mock tide info
        };
      }).filter(p => p !== null) as DayPrediction[]; // Filter out any null predictions

      setPredictions(mappedPredictions);
    } catch (error) {
      console.error("Failed to fetch forecasts:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      let url = 'http://backend:8080/api/posts';
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
        // For now, mock goodCount, badCount, myReaction for posts
        return {
          ...post,
          replies: replies.map(reply => ({
            ...reply,
            goodCount: Math.floor(Math.random() * 10),
            badCount: Math.floor(Math.random() * 2),
            myReaction: null,
          })),
          goodCount: Math.floor(Math.random() * 100),
          badCount: Math.floor(Math.random() * 10),
          myReaction: null,
        };
      }));
      setComments(commentsWithReplies);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchRepliesForPost = async (postId: number): Promise<Reply[]> => {
    try {
      const response = await fetch(`http://backend:8080/api/posts/${postId}/replies`);
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

  const createPost = async (content: string, label: string, imageBase64: string | null) => {
    try {
      const response = await fetch('http://backend:8080/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, label, image_url: imageBase64 }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // After successful creation, re-fetch posts to update the list
      fetchPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const createReply = async (targetId: number, type: 'post' | 'reply', content: string) => {
    try {
      const endpoint = type === 'post' ? `/api/posts/${targetId}/replies` : `/api/replies/${targetId}/replies`;
      const response = await fetch(`http://backend:8080${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // After successful creation, re-fetch posts to update the list
      fetchPosts();
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const createReaction = async (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => {
    try {
      const endpoint = type === 'post' ? `/api/posts/${targetId}/reaction` : `/api/replies/${targetId}/reaction`;
      const response = await fetch(`http://backend:8080${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // After successful reaction, re-fetch posts to update the list
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
        await createPost(newComment, selectedLabel, imageBase64);
        setNewComment('');
        setAuthorName('');
        setSelectedImage(null);
        setSelectedLabel('その他');
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
    } else {
      await createPost(newComment, selectedLabel, null);
      setNewComment('');
      setAuthorName('');
      setSelectedImage(null);
      setSelectedLabel('その他');
    }
  };

  const handleSubmitReply = async (targetId: number, type: 'post' | 'reply') => {
    if (!replyContent.trim() || !authorName.trim()) return;

    await createReply(targetId, type, replyContent);
    
    setReplyContent('');
    setReplyTo(null);
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
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const todayPrediction = predictions[0];
  const weekPredictions = predictions.slice(1);

  const renderReplies = (replies: Reply[], level: number = 0) => {
    return replies.map(reply => (
      <div key={reply.id} className={`ml-${level * 6} bg-slate-700/20 rounded-lg p-3 border-l-2 border-blue-500/30 mt-3`}>
        <div className="flex items-start gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xs">
              {reply.content.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-blue-200 text-sm">{reply.id}</span> {/* Temporarily using ID as author */} 
              <span className="text-xs text-gray-400">{formatTime(new Date(reply.created_at))}</span>
            </div>
            <p className="text-gray-200 text-sm mb-2">
              {reply.parent_reply_id && (
                <span className="text-blue-300 mr-1">@{reply.parent_reply_id}</span>
              )}
              {reply.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'good')}
              className={`text-xs ${reply.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover:text-green-300`}
            >
              <ThumbsUp className={`w-3 h-3 mr-1 ${reply.myReaction === 'good' ? 'fill-current' : ''}`} />
              {reply.goodCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'bad')}
              className={`text-xs ${reply.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
            >
              <ThumbsDown className={`w-3 h-3 mr-1 ${reply.myReaction === 'bad' ? 'fill-current' : ''}`} />
              {reply.badCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(replyTo === reply.id ? null : reply.id)}
              className="text-xs text-gray-400 hover:text-blue-300"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              返信
            </Button>
            {replyTo === reply.id && (
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-blue-500/20">
                <Input
                  placeholder="お名前"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="mb-2 bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                />
                <Textarea
                  placeholder="返信を書く..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="mb-2 bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(reply.id, 'reply')}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!replyContent.trim() || !authorName.trim()}
                  >
                    返信
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* ヘッダー */}
      <header className="text-center py-12 px-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            ホタルイカ爆湧き予報
          </h1>
        </div>
        <p className="text-xl text-blue-200 mb-2">富山湾の神秘を予測</p>
        <div className="flex items-center justify-center gap-2 text-sm text-blue-300">
          <MapPin className="w-4 h-4" />
          <span>富山湾</span>
          <Waves className="w-4 h-4 ml-4" />
          <span>リアルタイム予測</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* 今日の予測 */}
        {todayPrediction && (
          <Card 
            className="mb-8 glow-effect clickable-card bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30"
            onClick={() => handleCardClick(todayPrediction.date)}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-blue-200 mb-2">
                今日の予測
              </CardTitle>
              <p className="text-blue-300">{formatDate(todayPrediction.date)}</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className={`inline-block px-8 py-4 rounded-2xl ${predictionLevels[todayPrediction.level].bgColor} mb-6`}>
                <div className={`text-4xl font-bold mb-2 ${predictionLevels[todayPrediction.level].color}`}>
                  {predictionLevels[todayPrediction.level].name}
                </div>
                <div className="flex justify-center gap-2 mb-4">
                  {renderHotaruikaIcons(todayPrediction.level, '/hotaruika_aikon.png', 'w-24 h-24')}
                </div>
                <p className="text-lg text-gray-300">
                  {predictionLevels[todayPrediction.level].description}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-blue-900/30 rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Thermometer className="w-4 h-4 text-blue-300 mr-1" />
                    <p className="text-sm text-blue-300">気温</p>
                  </div>
                  <p className="text-xl font-bold text-white">{todayPrediction.temperature}°C</p>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300">天気</p>
                  <p className="text-xl font-bold text-white">{todayPrediction.weather}</p>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Moon className="w-4 h-4 text-blue-300 mr-1" />
                    <p className="text-sm text-blue-300">月齢</p>
                  </div>
                  <p className="text-lg font-bold text-white">{todayPrediction.moonAge.toFixed(1)}</p>
                  <p className="text-xs text-blue-200">{todayPrediction.moonPhase}</p>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300">潮汐</p>
                  <p className="text-xl font-bold text-white">{todayPrediction.tideInfo}</p>
                </div>
              </div>
              <p className="text-sm text-blue-300 mt-4">クリックで詳細を表示</p>
            </CardContent>
          </Card>
        )}

        {/* 週間予測 */}
        <Card className="mb-8 bg-gradient-to-br from-slate-900/40 to-blue-900/40 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-200 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              週間予測
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekPredictions.map((prediction, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border clickable-card ${predictionLevels[prediction.level].bgColor} border-blue-500/20 hover:border-blue-400/40 transition-all duration-300`}
                  onClick={() => handleCardClick(prediction.date)}
                >
                  <div className="text-center">
                    <p className="text-sm text-blue-300 mb-2">
                      {formatDate(prediction.date)}
                    </p>
                    <div className={`text-lg font-bold mb-2 ${predictionLevels[prediction.level].color}`}>
                      {predictionLevels[prediction.level].name}
                    </div>
                    <div className="flex justify-center gap-1 mb-3">
                      {renderHotaruikaIcons(prediction.level, '/hotaruika_aikon.png', 'w-8 h-8', false)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>
                        <Thermometer className="w-3 h-3 inline mr-1" />
                        {prediction.temperature}°C
                      </div>
                      <div>{prediction.weather}</div>
                      <div>
                        <Moon className="w-3 h-3 inline mr-1" />
                        {prediction.moonAge.toFixed(1)}
                      </div>
                      <div>{prediction.tideInfo}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 口コミ掲示板 */}
        <Card className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-200 flex items-center gap-2">
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
                  className="bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
                />
              </div>
              <Textarea
                placeholder="ホタルイカの身投げについて教えてください..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-4 bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
                rows={3}
              />
              <div className="flex items-center gap-2 mb-4">
                <label htmlFor="image-upload" className="cursor-pointer flex items-center text-gray-400 hover:text-gray-200">
                  <ImageIcon className="w-5 h-5 mr-1" />
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
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-300">ラベル:</span>
                <Button
                  variant={selectedLabel === '現地情報' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLabel('現地情報')}
                  className={selectedLabel === '現地情報' ? "bg-purple-600 hover:bg-purple-700" : "border-purple-500 text-purple-300 hover:bg-purple-900/20"}
                >
                  現地情報
                </Button>
                <Button
                  variant={selectedLabel === 'その他' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLabel('その他')}
                  className={selectedLabel === 'その他' ? "bg-purple-600 hover:bg-purple-700" : "border-purple-500 text-purple-300 hover:bg-purple-900/20"}
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
            <div className="mb-4 flex items-center gap-2">
              <span className="text-gray-300">表示フィルター:</span>
              <Button
                variant={selectedFilterLabel === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilterLabel(null)}
                className={selectedFilterLabel === null ? "bg-blue-600 hover:bg-blue-700" : "border-blue-500 text-blue-300 hover:bg-blue-900/20"}
              >
                全て
              </Button>
              <Button
                variant={selectedFilterLabel === '現地情報' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilterLabel('現地情報')}
                className={selectedFilterLabel === '現地情報' ? "bg-blue-600 hover:bg-blue-700" : "border-blue-500 text-blue-300 hover:bg-blue-900/20"}
                >
                現地情報
              </Button>
              <Button
                variant={selectedFilterLabel === 'その他' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilterLabel('その他')}
                className={selectedFilterLabel === 'その他' ? "bg-blue-600 hover:bg-blue-700" : "border-blue-500 text-blue-300 hover:bg-blue-900/20"}
              >
                その他
              </Button>
            </div>

            {/* コメント一覧 */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-slate-800/30 rounded-lg p-4 border border-purple-500/10">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                        {comment.content.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-purple-200">{comment.id}</span> {/* Temporarily using ID as author */} 
                        <span className="text-xs text-gray-400">{formatTime(new Date(comment.created_at))}</span>
                        <Badge variant="secondary" className="bg-purple-700/50 text-purple-200">{comment.label}</Badge>
                      </div>
                      <p className="text-gray-200 mb-3">{comment.content}</p>
                      {comment.image_url && (
                        <img src={`http://backend:8080${comment.image_url}`} alt="投稿画像" className="max-w-xs max-h-48 object-contain rounded-lg mb-3" />
                      )}
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(comment.id, 'post', 'good')}
                          className={`text-xs ${comment.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover:text-green-300`}
                        >
                          <ThumbsUp className={`w-4 h-4 mr-1 ${comment.myReaction === 'good' ? 'fill-current' : ''}`} />
                          {comment.goodCount}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(comment.id, 'post', 'bad')}
                          className={`text-xs ${comment.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
                        >
                          <ThumbsDown className={`w-4 h-4 mr-1 ${comment.myReaction === 'bad' ? 'fill-current' : ''}`} />
                          {comment.badCount}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          className="text-xs text-gray-400 hover:text-blue-300"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          返信
                        </Button>
                      </div>

                      {/* 返信フォーム */}
                      {replyTo === comment.id && (
                        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-blue-500/20">
                          <Input
                            placeholder="お名前"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="mb-2 bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                          />
                          <Textarea
                            placeholder="返信を書く..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="mb-2 bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id, 'post')}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={!replyContent.trim() || !authorName.trim()}
                            >
                              返信
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReplyTo(null)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 返信一覧 */}
                      {comment.replies.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {renderReplies(comment.replies)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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