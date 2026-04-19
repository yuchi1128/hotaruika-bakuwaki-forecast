'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CustomSelect from '@/components/CustomSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  X,
  Search,
  Loader2,
  AlertCircle,
  User,
  Tag,
  Heart,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import CommentItem from '@/components/CommentItem';
import PollCreator from '@/components/PollCreator';
import type { Comment } from '@/lib/types';
import type { CreatePollParams } from '@/lib/api/posts';
import { getDateFilterOptions, getCustomDateRange } from '@/lib/date-filter';
import { format as formatDate } from 'date-fns';
import { MAX_USERNAME_LENGTH, MAX_CONTENT_LENGTH, MAX_POLL_OPTION_LENGTH, COMMENTS_PER_PAGE } from '@/lib/constants';
import { compressImageToBase64 } from '@/lib/image-compression';

// Props
interface CommentSectionProps {
  comments: Comment[];
  totalComments: number;
  totalPages: number;
  currentPage: number;
  handleReaction: (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => void;
  handlePollVote: (pollId: number, optionId: number) => void;
  formatTime: (date: Date) => string;
  createReply: (targetId: number, type: 'post' | 'reply', username: string, content: string, imageBase64s?: string[]) => Promise<void>;
  createPost: (username: string, content: string, label: string, imageBase64s: string[], pollRequest?: CreatePollParams) => Promise<void>;
  fetchPosts: (params: { label?: string | null; page?: number; limit?: number; search?: string; sort?: string; date_from?: string; date_to?: string; device_id?: string }) => void;
}

const CommentSection = ({
  comments,
  totalComments,
  totalPages,
  currentPage,
  handleReaction,
  handlePollVote,
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
  const [searchInput, setSearchInput] = useState<string>(''); // 入力用
  const [searchQuery, setSearchQuery] = useState<string>(''); // 検索実行用
  const [deviceIdInput, setDeviceIdInput] = useState<string>(''); // ID入力用
  const [deviceIdQuery, setDeviceIdQuery] = useState<string>(''); // ID検索実行用
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'good'>('newest');
  const [pollData, setPollData] = useState<CreatePollParams | null>(null);
  const [pollReset, setPollReset] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
  const [customDateLabel, setCustomDateLabel] = useState<string>('');
  const [selectingDateType, setSelectingDateType] = useState<'from' | 'to'>('from');
  const [dateError, setDateError] = useState<string>('');

  const commentSectionRef = useRef<HTMLDivElement>(null);
  const filterSectionRef = useRef<HTMLDivElement>(null);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortOptions = [
    { value: 'newest', label: '新しい順' },
    { value: 'oldest', label: '古い順' },
    { value: 'good', label: '高評価順' },
  ];

  const dateFilterOptions = useMemo(() => getDateFilterOptions(), []);

  // 日付フィルターのCustomSelect用オプション（カスタム日付選択時はラベルを差し替え）
  const dateSelectOptions = useMemo(() => {
    if (selectedDateFilter === 'custom' && customDateLabel) {
      return dateFilterOptions.map(opt =>
        opt.value === 'custom' ? { ...opt, label: customDateLabel } : opt
      );
    }
    return dateFilterOptions;
  }, [dateFilterOptions, selectedDateFilter, customDateLabel]);

  // 現在選択中の日付範囲テキスト
  const activeDateRangeText = useMemo(() => {
    if (selectedDateFilter === 'all') return null;
    if (selectedDateFilter === 'custom') {
      if (customDateFrom && customDateTo) {
        const rangeFrom = getCustomDateRange(customDateFrom);
        const rangeTo = getCustomDateRange(customDateTo);
        return `${rangeFrom.rangeText.split(' 〜 ')[0]} 〜 ${rangeTo.rangeText.split(' 〜 ')[1]}`;
      }
      if (customDateFrom) {
        const rangeFrom = getCustomDateRange(customDateFrom);
        return `${rangeFrom.rangeText.split(' 〜 ')[0]} 〜（終了日を選択）`;
      }
      return null;
    }
    const option = dateFilterOptions.find(o => o.value === selectedDateFilter);
    return option?.rangeText ?? null;
  }, [selectedDateFilter, dateFilterOptions, customDateFrom, customDateTo]);

  const handleDateFilterChange = (value: string) => {
    if (value === 'custom') {
      setSelectedDateFilter('custom');
      setCustomDateFrom(undefined);
      setCustomDateTo(undefined);
      setSelectingDateType('from');
      setIsCalendarOpen(true);
      return;
    }
    setSelectedDateFilter(value);
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
    setCustomDateLabel('');
    const option = dateFilterOptions.find(o => o.value === value);
    setDateFrom(option?.dateFrom);
    setDateTo(option?.dateTo);
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setDateError('');
    if (selectingDateType === 'from') {
      setCustomDateFrom(date);
      setSelectingDateType('to');
    } else {
      const fromDate = customDateFrom!;
      const toDate = date;
      if (toDate < fromDate) {
        setDateError('終了日は開始日より後の日を選択してください');
        return;
      }
      setCustomDateFrom(fromDate);
      setCustomDateTo(toDate);
      const rangeFrom = getCustomDateRange(fromDate);
      const rangeTo = getCustomDateRange(toDate);
      setDateFrom(rangeFrom.dateFrom);
      setDateTo(rangeTo.dateTo);
      setCustomDateLabel(`${formatDate(fromDate, 'M/d')} 〜 ${formatDate(toDate, 'M/d')}`);
      setIsCalendarOpen(false);
    }
  };

  // API呼び出し: ラベル、検索、ソート、日付が変更されたとき
  useEffect(() => {
    fetchPosts({
      label: selectedFilterLabel,
      page: 1,
      limit: COMMENTS_PER_PAGE,
      search: searchQuery || undefined,
      sort: sortOrder,
      date_from: dateFrom,
      date_to: dateTo,
      device_id: deviceIdQuery || undefined,
    });
  }, [selectedFilterLabel, searchQuery, deviceIdQuery, sortOrder, dateFrom, dateTo]);

  // 検索実行
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setDeviceIdQuery(deviceIdInput);
  };

  // 検索クリア
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setDeviceIdInput('');
    setDeviceIdQuery('');
  };

  // Enterキーで検索
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
          selectedImages.map(file => compressImageToBase64(file))
        );
      }
      await createPost(authorName, newComment, selectedLabel, imageBase64s, pollData ?? undefined);
      setIsConfirmDialogOpen(false);
      setNewComment('');
      setAuthorName('');
      setSelectedImages([]);
      setSelectedLabel('現地情報');
      setPollData(null);
      setPollReset(true);
      setTimeout(() => setPollReset(false), 0);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      const message = error instanceof Error ? error.message : '投稿に失敗しました';
      alert(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // フィルター/検索セクションまでのスムーズスクロール
  const scrollToFilterSection = () => {
    if (!filterSectionRef.current) return;
    const targetY = filterSectionRef.current.getBoundingClientRect().top + window.scrollY - 80;
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 350;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      window.scrollTo(0, startY + distance * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ページ変更
  const handlePageChange = (newPage: number) => {
    fetchPosts({
      label: selectedFilterLabel,
      page: newPage,
      limit: COMMENTS_PER_PAGE,
      search: searchQuery || undefined,
      sort: sortOrder,
      date_from: dateFrom,
      date_to: dateTo,
    });
    scrollToFilterSection();
  };

  // ユーザーIDタップ時: 自動でID検索を実行してフィルターまでスクロール
  const handleSearchByUserId = (id: string) => {
    if (!id) return;
    setDeviceIdInput(id);
    setDeviceIdQuery(id);
    setIsFilterOpen(true);
    scrollToFilterSection();
  };

  // 表示用の計算
  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * COMMENTS_PER_PAGE, totalComments);

  // ページ番号リストを生成
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    const nearby = new Set<number>();
    nearby.add(1);
    nearby.add(totalPages);
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      if (i >= 1 && i <= totalPages) nearby.add(i);
    }
    const sorted = Array.from(nearby).sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        pages.push('ellipsis');
      }
      pages.push(sorted[i]);
    }
    return pages;
  };

  return (
    <Card ref={commentSectionRef} className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-purple-200 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          掲示板
          <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="text-purple-300 hover:text-purple-100 transition-colors ml-1"
                aria-label="掲示板の利用ガイドを見る"
              >
                <AlertCircle className="w-5 h-5 mt-0.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md bg-slate-800/80 border-purple-500/50 text-white shadow-lg backdrop-blur-md rounded-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-purple-200">
                  <AlertCircle className="w-5 h-5" />
                  <span>掲示板ご利用ガイド</span>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  掲示板を利用する際の注意事項やマナーについて説明しています。
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-5 py-2 text-sm">
                {/* マナー関連 */}
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 mt-0.5 text-pink-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">マナーについて</h4>
                    <ul className="text-slate-300 space-y-1 leading-relaxed">
                      <li>・<strong className="text-red-300">誹謗中傷・攻撃的な投稿</strong>は禁止です。  </li>
                      <li>・他のユーザーの方へは<strong className="text-white">丁寧な対応</strong>をお願いします。</li>
                      <li>・「〜するべきです」のような、<strong className="text-white">他のユーザーへの指示にあたる表現</strong>はお控えください。</li>
                    </ul>
                  </div>
                </div>
                {/* 投稿ルール */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 mt-0.5 text-blue-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">お名前について</h4>
                    <ul className="text-slate-300 space-y-1 leading-relaxed">
                      <li>・なるべく<strong className="text-white">一人につき一つの名前</strong>で投稿してください。</li>
                      <li>・公式や管理人など、<strong className="text-red-300">特別な立場を連想させる名前</strong>での投稿はご遠慮ください。</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 mt-0.5 text-green-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">ラベルについて</h4>
                    <p className="text-slate-300 leading-relaxed">
                      投稿内容に合った<strong className="text-white">適切なラベル</strong>を選んでください。現地での目撃情報は「現地情報」、それ以外は「その他」です。
                    </p>
                  </div>
                </div>
                {/* 情報の信頼性関連 */}
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 mt-0.5 text-emerald-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">情報の信頼性について</h4>
                    <ul className="text-slate-300 space-y-1 leading-relaxed">
                      <li>・<strong className="text-red-300">虚偽の目撃情報</strong>を投稿しないでください。</li>
                      <li>・現地情報は<strong className="text-white">日時・場所をできるだけ具体的</strong>に記載してください。</li>
                    </ul>
                  </div>
                </div>
                {/* 注意書き */}
                <div className="pt-2 border-t border-purple-500/20">
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    ※ 上記のルールを守っていない投稿は、編集または削除させていただく場合があります。
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* コメント投稿フォーム */}
        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Input
                placeholder="お名前"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={`h-8 text-sx bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400 ${
                  authorName.length > MAX_USERNAME_LENGTH ? 'border-red-500' : ''
                }`}
              />
              {authorName.length > MAX_USERNAME_LENGTH && (
                <div className="text-xs mt-1 text-red-400">
                  ※{MAX_USERNAME_LENGTH}文字以内で入力してください（現在{authorName.length}文字）
                </div>
              )}
            </div>
          </div>
          <Textarea
            placeholder={"ホタルイカに関する釣果報告などをお書きください。\nなお、虚偽の現地報告やいたずら等の悪質な書き込みをされた方はアクセス禁止となります。また、それらの行為は偽計業務妨害罪（刑法233条）に該当する可能性があります。"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className={`mb-1 text-sx bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400 min-h-[10rem] md:min-h-[8rem] ${
              newComment.length > MAX_CONTENT_LENGTH ? 'border-red-500' : ''
            }`}
            rows={5}
          />
          {newComment.length > MAX_CONTENT_LENGTH && (
            <div className="text-xs mb-3 text-red-400">
              ※{MAX_CONTENT_LENGTH}文字以内で入力してください（現在{newComment.length}文字）
            </div>
          )}
          {newComment.length <= MAX_CONTENT_LENGTH && <div className="mb-4" />}
          <PollCreator onChange={setPollData} onReset={pollReset} />
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
          <div className="flex flex-wrap items-center gap-4 mb-2">
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
          <p className="text-[11px] text-gray-400 mb-4">
            ※投稿内容に合ったラベルを選択してください
          </p>
          <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsConfirmDialogOpen(true)}
            disabled={
              !newComment.trim() ||
              !authorName.trim() ||
              isSubmittingComment ||
              authorName.length > MAX_USERNAME_LENGTH ||
              newComment.length > MAX_CONTENT_LENGTH ||
              (pollData !== null && (
                pollData.options.filter((o) => o.trim() !== '').length < 2 ||
                pollData.options.some((o) => o.length > MAX_POLL_OPTION_LENGTH)
              ))
            }
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setNewComment('');
              setAuthorName('');
              setSelectedImages([]);
              setSelectedLabel('現地情報');
              setPollData(null);
              setPollReset(true);
              setTimeout(() => setPollReset(false), 0);
            }}
            disabled={isSubmittingComment || (!newComment && !authorName && selectedImages.length === 0 && pollData === null)}
            className="text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30"
          >
            リセット
          </Button>
          </div>
        </div>

        {/* 投稿確認モーダル */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="w-[90vw] max-w-md bg-slate-800/80 border-purple-500/50 text-white shadow-lg backdrop-blur-md rounded-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-purple-200">投稿内容の確認</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                以下の内容で投稿します。よろしいですか？
              </DialogDescription>
            </DialogHeader>
            <div className="divide-y divide-purple-500/20 py-2">
              <div className="pb-3">
                <span className="text-xs font-bold text-gray-400">お名前</span>
                <p className="mt-1 text-sm text-white break-all">{authorName}</p>
              </div>
              <div className="py-3">
                <span className="text-xs font-bold text-gray-400">投稿内容</span>
                <p className="mt-1 text-sm text-white whitespace-pre-wrap break-all">{newComment}</p>
              </div>
              <div className="py-3">
                <span className="text-xs font-bold text-gray-400">ラベル</span>
                <div className="mt-1">
                  <Badge variant="secondary" className="bg-purple-700/50 text-purple-200 text-[12px]">
                    {selectedLabel}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs text-red-300/80">
                  ※投稿内容に合ったラベルが選択されていますか？ 現地での目撃情報は「現地情報」、それ以外は「その他」です。
                </p>
              </div>
              {pollData && (
                <div className="py-3">
                  <span className="text-xs font-bold text-gray-400">アンケート</span>
                  <div className="mt-1 space-y-1">
                    {pollData.options.map((opt, i) => (
                      <div key={i} className="text-sm text-white bg-slate-700/30 px-3 py-1.5 rounded">
                        {opt || `（選択肢${i + 1}）`}
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">投票期間: {pollData.duration_hours >= 24 ? `${pollData.duration_hours / 24}日` : `${pollData.duration_hours}時間`}</p>
                </div>
              )}
              {selectedImages.length > 0 && (
                <div className="pt-3">
                  <span className="text-xs font-bold text-gray-400">画像（{selectedImages.length}枚）</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {selectedImages.map((image, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(image)}
                        alt={`確認画像 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-start">
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment}
                className="bg-gradient-to-r from-indigo-600/90 via-fuchsia-600/90 to-rose-600/90 text-white font-semibold hover:brightness-105"
              >
                {isSubmittingComment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    投稿中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    投稿する
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsConfirmDialogOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-slate-700/50"
              >
                修正
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 検索・フィルター開閉ボタン */}
        <div ref={filterSectionRef} style={{ scrollMarginTop: '80px' }} className={isFilterOpen ? 'mt-4 mb-4' : 'mt-4 mb-0'}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-1.5 text-sm text-gray-300 active:text-white"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-semibold">検索・並び替え</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isFilterOpen && (<>
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
            className={`h-7 rounded-md px-2 text-xs md:h-9 md:px-3 md:text-sm font-bold text-white/90 antialiased ${selectedFilterLabel === '管理人' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-300 hover:bg-blue-900/20'}`}
            onClick={() => setSelectedFilterLabel('管理人')}
            variant={selectedFilterLabel === '管理人' ? 'default' : 'outline'}
          >
            管理人
          </Button>
        </div>

        {/* 検索 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-gray-300 text-xs font-bold whitespace-nowrap">検索：</span>
          <div className="relative flex-1 md:w-2/3 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="名前・内容で検索"
              className="pl-9 pr-9 h-8 sm:h-9 w-full bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
            />
            {searchInput && (
              <button
                aria-label="検索をクリア"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-300 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            className="h-8 sm:h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
          >
            検索
          </Button>
        </div>

        {/* ID検索 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-gray-300 text-xs font-bold whitespace-nowrap">ID：</span>
          <div className="relative flex-1 md:w-2/3 md:flex-none">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="ユーザーIDで検索"
              className="pl-9 pr-9 h-8 sm:h-9 w-full bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
            />
            {deviceIdInput && (
              <button
                aria-label="ID検索をクリア"
                onClick={() => { setDeviceIdInput(''); setDeviceIdQuery(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-300 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={() => setDeviceIdQuery(deviceIdInput)}
            className="h-8 sm:h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
          >
            検索
          </Button>
        </div>

        {/* 日付フィルター */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-gray-300 text-xs font-bold whitespace-nowrap">
            投稿日<span className="text-[10px] text-gray-400 ml-0.5">(午前7時区切り)</span>：
          </span>
          <CustomSelect
            options={dateSelectOptions}
            value={selectedDateFilter}
            onChange={handleDateFilterChange}
          />
          <Dialog open={isCalendarOpen} onOpenChange={(open) => {
            setIsCalendarOpen(open);
            if (!open) {
              setDateError('');
              if (!customDateTo) {
                setSelectedDateFilter('all');
                setDateFrom(undefined);
                setDateTo(undefined);
                setCustomDateFrom(undefined);
                setCustomDateLabel('');
              }
            }
          }}>
            <DialogContent className="w-[90vw] max-w-xs bg-slate-800/80 border-purple-500/50 text-white shadow-lg backdrop-blur-md rounded-lg p-0">
              <DialogHeader className="px-3 pt-4 pb-0">
                <DialogTitle className="text-sm text-gray-400 text-center font-normal">
                  {selectingDateType === 'from' ? '開始日を選択' : '終了日を選択'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  カレンダーから日付を選択してください
                </DialogDescription>
                {selectingDateType === 'to' && customDateFrom && (
                  <p className="text-[11px] text-gray-500 text-center mt-1">
                    ※開始日（{formatDate(customDateFrom, 'M/d')}）と同じ日を選ぶと<br />1日分の投稿が表示されます
                  </p>
                )}
              </DialogHeader>
              {dateError && (
                <div className="px-3 pb-1 text-xs text-red-400 text-center">
                  {dateError}
                </div>
              )}
              <Calendar
                mode="single"
                selected={selectingDateType === 'from' ? customDateFrom : customDateTo}
                onSelect={handleCustomDateSelect}
                disabled={{ after: new Date() }}
                className="text-white flex justify-center"
                modifiers={selectingDateType === 'to' && customDateFrom ? { startDate: customDateFrom } : {}}
                modifiersClassNames={{ startDate: 'ring-2 ring-purple-400 bg-purple-900/60 text-purple-200 rounded-md' }}
                classNames={{
                  day_selected: 'bg-purple-600 text-white hover:bg-purple-700 focus:bg-purple-600',
                  day_today: 'bg-slate-700 text-white',
                  day: 'h-9 w-9 p-0 font-normal rounded-lg aria-selected:opacity-100 transition-transform duration-100 active:scale-90 active:bg-white/10',
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        {activeDateRangeText && (
          <div className="mb-4 -mt-2 ml-1 text-xs text-purple-300/80">
            表示中：{activeDateRangeText}
          </div>
        )}

        {/* 並び替え */}
        <div className="mb-0 flex items-center gap-2">
          <span className="text-gray-300 text-xs font-bold whitespace-nowrap">並び替え：</span>
          <CustomSelect
            options={sortOptions}
            value={sortOrder}
            onChange={(value) => setSortOrder(value as 'newest' | 'oldest' | 'good')}
          />
        </div>

        {/* 検索条件リセット */}
        {(selectedFilterLabel !== null || searchQuery || deviceIdQuery || selectedDateFilter !== 'all' || sortOrder !== 'newest') && (
          <div className="mt-3 mb-1">
            <button
              onClick={() => {
                setSelectedFilterLabel(null);
                setSearchInput('');
                setSearchQuery('');
                setDeviceIdInput('');
                setDeviceIdQuery('');
                setSelectedDateFilter('all');
                setDateFrom(undefined);
                setDateTo(undefined);
                setCustomDateFrom(undefined);
                setCustomDateTo(undefined);
                setCustomDateLabel('');
                setSortOrder('newest');
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2"
            >
              検索条件をリセット
            </button>
          </div>
        )}

        </>)}

        {/* ページネーションコントロール（上部） */}
        {totalPages > 1 && (
          <div className="mb-1 flex justify-end gap-3">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-7 h-5 md:w-8 md:h-7 rounded-md text-[11px] md:text-xs font-medium transition-all border border-purple-400/50 bg-slate-800/50 text-purple-300 hover:bg-slate-700/50 hover:border-purple-400/70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-5 md:w-8 md:h-7 rounded-md text-[11px] md:text-xs font-medium transition-all border border-purple-400/50 bg-slate-800/50 text-purple-300 hover:bg-slate-700/50 hover:border-purple-400/70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 件数表示 */}
        <div className="mb-3 text-[13px] font-medium text-gray-400 text-right">{totalComments === 0 ? '0件' : `${startIndex}〜${endIndex} 件目 / 全 ${totalComments} 件`}</div>

        {/* コメント一覧 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">{searchQuery ? '該当する投稿はありません' : '投稿はまだありません'}</div>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} handleReaction={handleReaction} handlePollVote={handlePollVote} formatTime={formatTime} createReply={createReply} onSearchUserById={handleSearchByUserId} />
            ))
          )}
        </div>

        {/* ページネーションコントロール（下部） */}
        {totalComments > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 text-purple-300 hover:text-purple-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              {getPageNumbers().map((page, i) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${i}`} className="w-6 h-[26px] md:w-8 md:h-[30px] flex items-center justify-center text-gray-500 text-[11px] md:text-xs">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-7 h-[26px] md:w-8 md:h-[30px] rounded-md text-[11px] md:text-xs font-medium transition-all ${
                      page === currentPage
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                        : 'border border-purple-400/50 bg-slate-800/50 text-purple-300 hover:bg-slate-700/50 hover:border-purple-400/70'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-purple-300 hover:text-purple-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <span className="text-[13px] font-medium text-gray-400">
               {startIndex}〜{endIndex} 件目 / 全 {totalComments} 件
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentSection;