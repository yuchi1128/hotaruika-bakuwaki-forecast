'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import CustomSelect from '@/components/CustomSelect';
import { MessageCircle, Send, Image as ImageIcon, X, Search, Loader2 } from 'lucide-react';
import CommentItem from '@/components/CommentItem';

// Interfaces
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

// Props
interface CommentSectionProps {
  comments: Comment[];
  handleReaction: (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => void;
  formatTime: (date: Date) => string;
  createReply: (targetId: number, type: 'post' | 'reply', username: string, content: string) => Promise<void>;
  createPost: (username: string, content: string, label: string, imageBase64s: string[]) => Promise<void>;
  fetchPosts: (label?: string | null) => void;
}

const CommentSection = ({ 
  comments,
  handleReaction,
  formatTime,
  createReply,
  createPost,
  fetchPosts
}: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>('現地情報');
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'good' | 'bad'>('newest');
  const COMMENTS_PER_PAGE = 30;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const sortOptions = [
    { value: 'newest', label: '新しい順' },
    { value: 'oldest', label: '古い順' },
    { value: 'good', label: '高評価順' },
    { value: 'bad', label: '低評価順' },
  ];

  useEffect(() => {
    fetchPosts(selectedFilterLabel);
  }, [selectedFilterLabel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilterLabel, searchQuery, sortOrder]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      if (selectedImages.length + files.length > 4) {
        alert('写真は最大4枚までです。');
        const remainingSlots = 4 - selectedImages.length;
        if (remainingSlots > 0) {
          setSelectedImages(prev => [...prev, ...files.slice(0, remainingSlots)]);
        }
      } else {
        setSelectedImages(prev => [...prev, ...files]);
      }
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !authorName.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      let imageBase64s: string[] = [];
      if (selectedImages.length > 0) {
        imageBase64s = await Promise.all(
          selectedImages.map(file => {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = error => reject(error);
            });
          })
        );
      }
      await createPost(authorName, newComment, selectedLabel, imageBase64s);
      setNewComment('');
      setAuthorName('');
      setSelectedImages([]);
      setSelectedLabel('現地情報');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
  const filteredComments = useMemo(() => {
    if (!normalizedQuery) return comments;
    return comments.filter((c) => {
      const targets: string[] = [
        c.username ?? '',
        c.content ?? '',
        ...c.replies.flatMap((r) => [r.username ?? '', r.content ?? '']),
      ];
      return targets.some((t) => (t || '').toLowerCase().includes(normalizedQuery));
    });
  }, [comments, normalizedQuery]);

  const sortedComments = useMemo(() => {
    const arr = filteredComments.slice();
    switch (sortOrder) {
      case 'newest':
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'good':
        arr.sort((a, b) => b.goodCount - a.goodCount || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'bad':
        arr.sort((a, b) => b.badCount - a.badCount || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    return arr;
  }, [filteredComments, sortOrder]);

  useEffect(() => {
    const totalPagesCalc = Math.max(1, Math.ceil(sortedComments.length / COMMENTS_PER_PAGE));
    if (currentPage > totalPagesCalc) {
      setCurrentPage(totalPagesCalc);
    }
  }, [sortedComments.length, currentPage]);

  const totalComments = sortedComments.length;
  const totalPages = Math.max(1, Math.ceil(totalComments / COMMENTS_PER_PAGE));
  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
  const endIndex = Math.min(startIndex + COMMENTS_PER_PAGE, totalComments);
  const paginatedComments = useMemo(() => sortedComments.slice(startIndex, endIndex), [sortedComments, startIndex, endIndex]);

  return (
    <Card className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-purple-200 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          みんなの口コミ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* コメント投稿フォーム */}
        <div className="mb-9 p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="お名前"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="h-8 text-sx bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
            />
          </div>
          <Textarea
            placeholder="ホタルイカについてご自由にお書きください！"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-4 text-sx bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
            rows={5}
          />
          <div className="mb-4">
            <label htmlFor="image-upload" className="cursor-pointer flex items-center text-sm md:text-base text-gray-400 hover:text-gray-200 mb-2">
              <ImageIcon className="w-4 h-4 md:w-5 md:h-5 mr-1" />
              <span>画像を選択 ({selectedImages.length}/4)</span>
            </label>
            <Input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={selectedImages.length >= 4} />
            {selectedImages.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img src={URL.createObjectURL(image)} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                    <button onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="text-gray-300 text-xs font-bold">ラベル：</span>

            <Button
              className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm font-bold antialiased ${
                selectedLabel === '現地情報'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'border-purple-500 text-purple-300 hover:bg-purple-900/20'
              }`}
              onClick={() => setSelectedLabel('現地情報')}
              variant={selectedLabel === '現地情報' ? 'default' : 'outline'}
            >
              現地情報
            </Button>

            <Button
              className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm font-bold antialiased ${
                selectedLabel === 'その他'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'border-purple-500 text-purple-300 hover:bg-purple-900/20'
              }`}
              onClick={() => setSelectedLabel('その他')}
              variant={selectedLabel === 'その他' ? 'default' : 'outline'}
            >
              その他
            </Button>
          </div>
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || !authorName.trim() || isSubmittingComment}
            className="
              group relative inline-flex items-center gap-2
              rounded-xl px-4 py-2.5 text-sm font-semibold text-white
              bg-gradient-to-r from-indigo-600/90 via-fuchsia-600/90 to-rose-600/90
              backdrop-blur-md
              ring-1 ring-white/10
              shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_10px_26px_-14px_rgba(0,0,0,0.65)]
              transition-all duration-200
              hover:brightness-105 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_16px_32px_-14px_rgba(0,0,0,0.7)]
              active:scale-[0.99]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              before:absolute before:inset-0 before:rounded-[inherit] before:pointer-events-none
              before:bg-gradient-to-tr before:from-white/12 before:via-transparent before:to-transparent
            "
          >
            {isSubmittingComment ? (
              <>
                <Loader2 className="w-4 h-4 -ml-0.5 animate-spin" />
                投稿中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 -ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                投稿する
              </>
            )}
          </Button>
        </div>

        {/* ラベルフィルター */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-gray-300 text-xs font-bold">ラベル：</span>
          <Button
            className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm font-bold text-white/90 antialiased ${selectedFilterLabel === null ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-300 hover:bg-blue-900/20'}`}
            onClick={() => setSelectedFilterLabel(null)}
            variant={selectedFilterLabel === null ? 'default' : 'outline'}
          >
            全て
          </Button>
          <Button
            className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm font-bold text-white/90 antialiased ${selectedFilterLabel === '現地情報' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-300 hover:bg-blue-900/20'}`}
            onClick={() => setSelectedFilterLabel('現地情報')}
            variant={selectedFilterLabel === '現地情報' ? 'default' : 'outline'}
          >
            現地情報
          </Button>
          <Button
            className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm font-bold text-white/90 antialiased ${selectedFilterLabel === 'その他' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-300 hover:bg-blue-900/20'}`}
            onClick={() => setSelectedFilterLabel('その他')}
            variant={selectedFilterLabel === 'その他' ? 'default' : 'outline'}
          >
            その他
          </Button>
          <Button
            className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm font-bold text-white/90 antialiased ${selectedFilterLabel === '管理者' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-300 hover:bg-blue-900/20'}`}
            onClick={() => setSelectedFilterLabel('管理者')}
            variant={selectedFilterLabel === '管理者' ? 'default' : 'outline'}
          >
            管理者
          </Button>
        </div>

        {/* 検索 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-gray-300 text-xs font-bold whitespace-nowrap">検索：</span>
          <div className="relative w-full md:w-2/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前・投稿内容で検索"
              className="pl-9 pr-9 h-8 sm:h-9 w-full bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button
                aria-label="検索をクリア"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 並び替え */}
        <div className="mb-5 flex items-center gap-2">
          <span className="text-gray-300 text-xs font-bold whitespace-nowrap">並び替え：</span>
          <CustomSelect
            options={sortOptions}
            value={sortOrder}
            onChange={(value) => setSortOrder(value as 'newest' | 'oldest' | 'good' | 'bad')}
          />
        </div>

        {/* ページネーションコントロール（上部） */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">{totalComments === 0 ? '0件' : `${startIndex + 1}〜${endIndex}件 / 全${totalComments}件`}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-7 px-3 text-xs border-blue-500/40 text-blue-100 hover:bg-white/10"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            <span className="text-xs text-gray-300">ページ {currentPage} / {totalPages}</span>
            <Button
              variant="outline"
              className="h-7 px-3 text-xs border-blue-500/40 text-blue-100 hover:bg-white/10"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalComments === 0}
            >
              次へ
            </Button>
          </div>
        </div>

        {/* コメント一覧（検索＋並び替え＋30件ごとに表示） */}
        <div className="space-y-4">
          {paginatedComments.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">{searchQuery ? '該当する口コミはありません' : '口コミはまだありません'}</div>
          ) : (
            paginatedComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} handleReaction={handleReaction} formatTime={formatTime} createReply={createReply} />
            ))
          )}
        </div>

        {/* ページネーションコントロール（下部） */}
        {totalComments > 0 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-xs text-gray-400">
              {startIndex + 1}〜{endIndex}件 / 全{totalComments}件
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-7 px-3 text-xs border-blue-500/40 text-blue-100 hover:bg-white/10"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                前へ
              </Button>
              <span className="text-xs text-gray-300">ページ {currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                className="h-7 px-3 text-xs border-blue-500/40 text-blue-100 hover:bg-white/10"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                次へ
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentSection;
