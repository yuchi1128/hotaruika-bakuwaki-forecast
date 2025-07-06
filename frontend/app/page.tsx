'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Calendar, MapPin, Waves, Thermometer, Moon } from 'lucide-react';

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

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
  isLiked: boolean;
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
  const [authorName, setAuthorName] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    // 予測データの生成（実際のAPIに置き換え予定）
    const generatePredictions = () => {
      const today = new Date();
      const predictions: DayPrediction[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const moonAge = (date.getDate() + 15) % 29; // 簡易的な月齢計算
        const moonPhaseIndex = Math.floor(moonAge / 3.625);
        
        predictions.push({
          date,
          level: Math.floor(Math.random() * 6),
          temperature: Math.floor(Math.random() * 15) + 5, // 5-20度
          weather: ['晴れ', '曇り', '雨', '霧'][Math.floor(Math.random() * 4)],
          moonPhase: moonPhases[moonPhaseIndex] || '新月',
          moonAge: moonAge,
          precipitation: Math.floor(Math.random() * 50), // 0-50mm
          tideInfo: ['大潮', '中潮', '小潮', '長潮'][Math.floor(Math.random() * 4)],
        });
      }
      
      setPredictions(predictions);
    };

    // サンプルコメントの生成
    const generateComments = () => {
      const sampleComments: Comment[] = [
        {
          id: '1',
          author: '富山の漁師',
          content: '昨夜は素晴らしい身投げでした！海が青く光って幻想的でした。',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          likes: 12,
          replies: [
            {
              id: '1-1',
              author: 'ホタルイカ愛好家',
              content: '羨ましいです！写真はありますか？',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
              likes: 3,
              replies: [],
              isLiked: false,
            }
          ],
          isLiked: false,
        },
        {
          id: '2',
          author: '観光客A',
          content: '初めて見ましたが、本当に神秘的でした。また来年も来たいと思います。',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          likes: 8,
          replies: [],
          isLiked: true,
        },
      ];
      
      setComments(sampleComments);
    };

    generatePredictions();
    generateComments();
  }, []);

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

  const handleSubmitComment = () => {
    if (!newComment.trim() || !authorName.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: authorName,
      content: newComment,
      timestamp: new Date(),
      likes: 0,
      replies: [],
      isLiked: false,
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setAuthorName('');
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim() || !authorName.trim()) return;

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      author: authorName,
      content: replyContent,
      timestamp: new Date(),
      likes: 0,
      replies: [],
      isLiked: false,
    };

    setComments(comments.map(comment => 
      comment.id === parentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));
    
    setReplyContent('');
    setReplyTo(null);
  };

  const toggleLike = (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments(comments.map(comment => 
        comment.id === parentId 
          ? {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? { ...reply, isLiked: !reply.isLiked, likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1 }
                  : reply
              )
            }
          : comment
      ));
    } else {
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
          : comment
      ));
    }
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
              <Button
                onClick={handleSubmitComment}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!newComment.trim() || !authorName.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                投稿する
              </Button>
            </div>

            {/* コメント一覧 */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-slate-800/30 rounded-lg p-4 border border-purple-500/10">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                        {comment.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-purple-200">{comment.author}</span>
                        <span className="text-xs text-gray-400">{formatTime(comment.timestamp)}</span>
                      </div>
                      <p className="text-gray-200 mb-3">{comment.content}</p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLike(comment.id)}
                          className={`text-xs ${comment.isLiked ? 'text-pink-400' : 'text-gray-400'} hover:text-pink-300`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likes}
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
                              onClick={() => handleSubmitReply(comment.id)}
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
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="ml-6 bg-slate-700/20 rounded-lg p-3 border-l-2 border-blue-500/30">
                              <div className="flex items-start gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xs">
                                    {reply.author.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-blue-200 text-sm">{reply.author}</span>
                                    <span className="text-xs text-gray-400">{formatTime(reply.timestamp)}</span>
                                  </div>
                                  <p className="text-gray-200 text-sm mb-2">{reply.content}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleLike(reply.id, true, comment.id)}
                                    className={`text-xs ${reply.isLiked ? 'text-pink-400' : 'text-gray-400'} hover:text-pink-300`}
                                  >
                                    <Heart className={`w-3 h-3 mr-1 ${reply.isLiked ? 'fill-current' : ''}`} />
                                    {reply.likes}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
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