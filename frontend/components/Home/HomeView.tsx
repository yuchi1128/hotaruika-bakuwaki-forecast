'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatDateForWeek,
  formatDate,
  formatTime,
  getOffSeasonMessage,
} from '@/lib/utils';

import { useForecast } from '@/hooks/useForecast';
import { usePosts } from '@/hooks/usePosts';
import { useReactions } from '@/hooks/useReactions';

import LoadingScreen from '@/components/common/LoadingScreen';
import AppHeader from '@/components/common/AppHeader';
import AppFooter from '@/components/common/AppFooter';
import TodayForecast from '@/components/Forecast/TodayForecast';
import WeeklyForecast from '@/components/Forecast/WeeklyForecast';
import CommentSection from '@/components/Community/CommentSection';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface HomeViewProps {
  mode: 'production' | 'preview';
}

export default function HomeView({ mode }: HomeViewProps) {
  const router = useRouter();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const { predictions, loading, error, lastUpdated } = useForecast(mode);
  const {
    comments,
    setComments,
    totalComments,
    totalPages,
    currentPage,
    isSubmitting,
    fetchPosts,
    createPost,
    createReply,
  } = usePosts();
  const { handleReaction } = useReactions(setComments, fetchPosts);

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
    const basePath = mode === 'preview' ? '/preview' : '';
    router.push(`${basePath}/detail/${dateString}`);
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
      <Dialog open={isSubmitting}>
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
          handleReaction={handleReaction}
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
