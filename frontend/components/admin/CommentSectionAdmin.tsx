'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CustomSelect from '@/components/CustomSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  X,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import CommentItemAdmin from '@/components/admin/CommentItemAdmin';
import type { Comment, BannedDevice } from '@/lib/types';
import { getDateFilterOptions, getCustomDateRange } from '@/lib/date-filter';
import { format as formatDate } from 'date-fns';
import { COMMENTS_PER_PAGE } from '@/lib/constants';
import type { FetchPostsParams } from '@/lib/api/posts';

interface CommentSectionAdminProps {
  comments: Comment[];
  totalComments: number;
  totalPages: number;
  currentPage: number;
  handleReaction: (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => void;
  handlePollVote: (pollId: number, optionId: number) => void;
  formatTime: (date: Date) => string;
  createAdminReply: (targetId: number, type: 'post' | 'reply', content: string, imageBase64s?: string[]) => Promise<void>;
  fetchPosts: (params: FetchPostsParams) => void;
  onDeletePost: (postId: number, deviceId?: string) => void;
  onDeleteReply: (replyId: number, deviceId?: string) => void;
  onLabelChange: (postId: number, label: string) => Promise<void>;
  onBanDevice: (deviceId: string, reason?: string) => Promise<boolean>;
  bannedDevices: BannedDevice[];
}

const CommentSectionAdmin = ({
  comments,
  totalComments,
  totalPages,
  currentPage,
  handleReaction,
  handlePollVote,
  formatTime,
  createAdminReply,
  fetchPosts,
  onDeletePost,
  onDeleteReply,
  onLabelChange,
  onBanDevice,
  bannedDevices,
}: CommentSectionAdminProps) => {
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deviceIdInput, setDeviceIdInput] = useState<string>('');
  const [deviceIdQuery, setDeviceIdQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'good'>('newest');
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortOptions = [
    { value: 'newest', label: '新しい順' },
    { value: 'oldest', label: '古い順' },
    { value: 'good', label: '高評価順' },
  ];

  const dateFilterOptions = useMemo(() => getDateFilterOptions(), []);

  const dateSelectOptions = useMemo(() => {
    if (selectedDateFilter === 'custom' && customDateLabel) {
      return dateFilterOptions.map(opt =>
        opt.value === 'custom' ? { ...opt, label: customDateLabel } : opt
      );
    }
    return dateFilterOptions;
  }, [dateFilterOptions, selectedDateFilter, customDateLabel]);

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

  // API 呼び出し: ラベル・検索・ソート・日付変更時
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
      admin_device: true,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterLabel, searchQuery, deviceIdQuery, sortOrder, dateFrom, dateTo]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setDeviceIdQuery(deviceIdInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setDeviceIdInput('');
    setDeviceIdQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchPosts({
      label: selectedFilterLabel,
      page: newPage,
      limit: COMMENTS_PER_PAGE,
      search: searchQuery || undefined,
      sort: sortOrder,
      date_from: dateFrom,
      date_to: dateTo,
      device_id: deviceIdQuery || undefined,
      admin_device: true,
    });
    if (filterSectionRef.current) {
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
    }
  };

  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * COMMENTS_PER_PAGE, totalComments);

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
          掲示板管理
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 検索・フィルター開閉ボタン */}
        <div ref={filterSectionRef} style={{ scrollMarginTop: '80px' }} className={isFilterOpen ? 'mb-4' : 'mb-0'}>
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
              <CommentItemAdmin
                key={comment.id}
                comment={comment}
                handleReaction={handleReaction}
                handlePollVote={handlePollVote}
                formatTime={formatTime}
                createAdminReply={createAdminReply}
                onDeletePost={onDeletePost}
                onDeleteReply={onDeleteReply}
                onLabelChange={onLabelChange}
                onBanDevice={onBanDevice}
                bannedDevices={bannedDevices}
              />
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

export default CommentSectionAdmin;
