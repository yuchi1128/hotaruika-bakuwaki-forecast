'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ThumbsUp, ThumbsDown, Loader2, X } from 'lucide-react';
import TwitterLikeMediaGrid from '@/components/TwitterLikeMediaGrid';

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

interface CommentItemProps {
  comment: Comment;
  handleReaction: (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => void;
  formatTime: (date: Date) => string;
  createReply: (targetId: number, type: 'post' | 'reply', username: string, content: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function CommentItem({
  comment,
  handleReaction,
  formatTime,
  createReply,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 画像拡大用
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
    document.body.style.overflow = 'hidden'; // 背景スクロール禁止
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    document.body.style.overflow = ''; // 背景スクロール解除
  };

  const handleSubmitReply = async (targetId: number, type: 'post' | 'reply') => {
    if (!replyContent.trim() || !authorName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createReply(targetId, type, authorName, replyContent);
      setReplyContent('');
      setAuthorName('');
      setIsReplying(false);
      setReplyingTo(null);
    } catch (error) {
      console.error("Reply submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReplies = (replies: Reply[], level: number = 0) => {
    return replies.map(reply => (
      <div key={reply.id} className={`ml-${level * 6} bg-slate-700/20 rounded-lg p-2 md:p-3 border-l border-dotted border-slate-600 mt-1 md:mt-3`}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-blue-200 text-xs sm:text-sm max-w-[120px] truncate block sm:max-w-none sm:overflow-visible sm:whitespace-normal">{reply.username}</span>
              <span className="text-[11px] sm:text-xs text-gray-400">{formatTime(new Date(reply.created_at))}</span>
            </div>
            <p className="text-gray-200 text-xs mb-2 whitespace-pre-wrap leading-relaxed">
              {reply.parent_username && (
                <span className="text-blue-300 mr-1">@{reply.parent_username}</span>
              )}
              {reply.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'good')}
              className={`text-xs ${reply.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover:text-green-300`}
              disabled={reply.myReaction !== null}
            >
              <ThumbsUp className={`w-3 h-3 mr-1 ${reply.myReaction === 'good' ? 'fill-current' : ''}`} />
              {reply.good_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'bad')}
              className={`text-xs ${reply.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
              disabled={reply.myReaction !== null}
            >
              <ThumbsDown className={`w-3 h-3 mr-1 ${reply.myReaction === 'bad' ? 'fill-current' : ''}`} />
              {reply.bad_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
              className="text-xs text-gray-400 hover:text-blue-300"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              返信
            </Button>
            {replyingTo === reply.id && (
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-blue-500/20">
                <div className="md:w-1/2 mb-2">
                  <Input
                    placeholder="お名前"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="h-8 text-sm w-full bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                  />
                </div>
                <Textarea
                  placeholder="返信を書く..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="mb-2 text-sm bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSubmitReply(reply.id, 'reply')}
                    className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!replyContent.trim() || !authorName.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        送信中
                      </>
                    ) : (
                      '返信'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                    className="h-7 px-3 text-xs text-gray-400 hover:text-gray-300"
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
    <div key={comment.id} className="pb-2 border-b border-purple-500/30">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-purple-200 text-sm sm:text-base max-w-[120px] truncate block sm:max-w-none sm:overflow-visible sm:whitespace-normal">{comment.username}</span>
              <span className="text-[11px] sm:text-xs text-gray-400">{formatTime(new Date(comment.created_at))}</span>
            </div>
            <Badge variant="secondary" className="bg-purple-700/50 text-purple-200 text-[11px]">{comment.label}</Badge>
          </div>

          <p className="text-gray-200 mb-3 whitespace-pre-wrap text-xs leading-relaxed">{comment.content}</p>

          {comment.image_urls && comment.image_urls.length > 0 && (
            <>
              {/* X（旧Twitter）風レイアウト */}
              <TwitterLikeMediaGrid
                images={comment.image_urls}
                baseUrl={API_URL}
                onOpen={(i) => handleImageClick(i)}
              />

              {showImageModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                  onClick={handleCloseImageModal}
                >
                  <div
                    className="relative bg-transparent rounded-lg shadow-lg flex items-center justify-center"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 z-10"
                      aria-label="閉じる"
                      onClick={handleCloseImageModal}
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {comment.image_urls.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => (prev - 1 + comment.image_urls.length) % comment.image_urls.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          &#10094;
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => (prev + 1) % comment.image_urls.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          &#10095;
                        </button>
                      </>
                    )}

                    <img
                      src={`${API_URL}${comment.image_urls[currentImageIndex]}`}
                      alt="拡大画像"
                      className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
                      style={{ background: '#222', boxShadow: '0 2px 24px rgba(0,0,0,0.30)' }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(comment.id, 'post', 'good')}
                className={`text-xs ${comment.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover:text-green-300`}
                disabled={comment.myReaction !== null}
              >
                <ThumbsUp className={`w-4 h-4 mr-1 ${comment.myReaction === 'good' ? 'fill-current' : ''}`} />
                {comment.goodCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(comment.id, 'post', 'bad')}
                className={`text-xs ${comment.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
                disabled={comment.myReaction !== null}
              >
                <ThumbsDown className={`w-4 h-4 mr-1 ${comment.myReaction === 'bad' ? 'fill-current' : ''}`} />
                {comment.badCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs text-gray-400 hover:text-blue-300"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                返信
              </Button>
            </div>
            {comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-gray-400 hover:text-blue-300"
              >
                {showReplies ? '返信を隠す' : `${comment.replies.length}件の返信を表示`}
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-blue-500/20">
              <div className="md:w-1/2 mb-2">
                <Input
                  placeholder="お名前"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="h-8 text-sx w-full bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                />
              </div>
              <Textarea
                placeholder="返信を書く..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-2 text-sx bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmitReply(comment.id, 'post')}
                  className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!replyContent.trim() || !authorName.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      送信中
                    </>
                  ) : (
                    '返信'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsReplying(false)}
                  className="h-7 px-3 text-xs text-gray-400 hover:text-gray-300"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {showReplies && (
            <div className="mt-2 mb-2 space-y-3">
              {renderReplies(comment.replies)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}