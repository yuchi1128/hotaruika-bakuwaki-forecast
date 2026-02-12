'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  label?: string;
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

// 文字数制限
const MAX_USERNAME_LENGTH = 30;
const MAX_CONTENT_LENGTH = 1000;

const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

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
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    document.body.style.overflow = '';
  };

  const handleSubmitReply = async (targetId: number, type: 'post' | 'reply') => {
    if (!replyContent.trim() || !authorName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createReply(targetId, type, authorName, replyContent);
      
      if (type === 'post') {
        setShowReplies(true);
      }

      setReplyContent('');
      setAuthorName('');
      setIsReplying(false);
      setReplyingTo(null);
    } catch (error) {
      console.error('Reply submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReplies = (replies: Reply[], level: number = 0) => {
    return replies.map((reply) => (
      <div
        key={reply.id}
        className={`ml-${level * 6} bg-slate-700/20 rounded-lg p-2 md:p-3 border-l border-dotted border-slate-600 mt-1 md:mt-3`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-blue-200 text-xs sm:text-sm max-w-[120px] truncate block sm:max-w-none sm:overflow-visible sm:whitespace-normal">
                {reply.username}
              </span>
              <span className="text-[13px] sm:text-[13px] text-gray-400">
                {formatTime(new Date(reply.created_at))}
              </span>
              {reply.label && (
                <Badge variant="secondary" className="bg-blue-700/50 text-blue-200 text-[10px]">
                  {reply.label}
                </Badge>
              )}
            </div>
            <p className="text-gray-200 text-xs mb-2 whitespace-pre-wrap leading-relaxed">
              {reply.parent_username && <span className="text-blue-300 mr-1">@{reply.parent_username}</span>}
              {linkify(reply.content)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'good')}
              className={`text-xs ${reply.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover-text-green-300 active:bg-slate-600/50 rounded-lg`}
              disabled={reply.myReaction !== null}
            >
              <ThumbsUp className={`w-3 h-3 mr-1 ${reply.myReaction === 'good' ? 'fill-current' : ''}`} />
              {reply.good_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'bad')}
              className={`text-xs ${reply.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover-text-red-300 active:bg-slate-600/50 rounded-lg`}
              disabled={reply.myReaction !== null}
            >
              <ThumbsDown className={`w-3 h-3 mr-1 ${reply.myReaction === 'bad' ? 'fill-current' : ''}`} />
              {reply.bad_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
              className="text-xs text-gray-400 hover-text-blue-300 active:bg-slate-600/50 rounded-lg"
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
                    className={`h-8 text-sm w-full bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400 ${
                      authorName.length > MAX_USERNAME_LENGTH ? 'border-red-500' : ''
                    }`}
                  />
                  {authorName.length > MAX_USERNAME_LENGTH && (
                    <div className="text-xs mt-1 text-red-400">
                      ※{MAX_USERNAME_LENGTH}文字以内で入力してください（現在{authorName.length}文字）
                    </div>
                  )}
                </div>
                <Textarea
                  placeholder="返信を書く..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className={`mb-1 text-sm bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400 ${
                    replyContent.length > MAX_CONTENT_LENGTH ? 'border-red-500' : ''
                  }`}
                  rows={2}
                />
                {replyContent.length > MAX_CONTENT_LENGTH && (
                  <div className="text-xs mb-1 text-red-400">
                    ※{MAX_CONTENT_LENGTH}文字以内で入力してください（現在{replyContent.length}文字）
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => handleSubmitReply(reply.id, 'reply')}
                    className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      !replyContent.trim() ||
                      !authorName.trim() ||
                      isSubmitting ||
                      authorName.length > MAX_USERNAME_LENGTH ||
                      replyContent.length > MAX_CONTENT_LENGTH
                    }
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
                    className="h-7 px-3 text-xs text-gray-400 hover-text-gray-300 active:bg-slate-600/50 rounded-md"
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
    <>
      <Dialog open={isSubmitting}>
        <DialogContent
          showCloseButton={false}
          className="w-auto bg-slate-800/80 border-blue-500/50 text-white shadow-lg backdrop-blur-md rounded-lg flex items-center justify-center p-6"
        >
          <DialogTitle className="sr-only">送信中</DialogTitle>
          <DialogDescription className="sr-only">返信をサーバーに送信しています。しばらくお待ちください。</DialogDescription>
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-300" />
          <span>返信を送信中です...</span>
        </DialogContent>
      </Dialog>
      
      <div key={comment.id} className="pb-2 border-b border-purple-500/30">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-purple-200 text-sm sm:text-base max-w-[120px] truncate block sm:max-w-none sm:overflow-visible sm:whitespace-normal">
                  {comment.username}
                </span>
                <span className="text-[13px] sm:text-[13px] text-gray-400">
                  {formatTime(new Date(comment.created_at))}
                </span>
              </div>
              <Badge variant="secondary" className="bg-purple-700/50 text-purple-200 text-[11px]">
                {comment.label}
              </Badge>
            </div>

            <p className="text-gray-200 mb-3 whitespace-pre-wrap text-xs leading-relaxed">{linkify(comment.content)}</p>

            {comment.image_urls && comment.image_urls.length > 0 && (
              <>
                <TwitterLikeMediaGrid
                  images={comment.image_urls}
                  baseUrl={API_URL}
                  onOpen={(i) => handleImageClick(i)}
                  className="md:max-w-[460px] lg:max-w-[500px]"
                  maxVH={35}
                />

                {showImageModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                    onClick={handleCloseImageModal}
                  >
                    <div
                      className="relative bg-transparent rounded-lg flex items-center justify-center"
                      style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                      onClick={(e) => e.stopPropagation()}
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
                            onClick={() =>
                              setCurrentImageIndex((prev) => (prev - 1 + comment.image_urls.length) % comment.image_urls.length)
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                          >
                            &#10094;
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % comment.image_urls.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                          >
                            &#10095;
                          </button>
                        </>
                      )}

                      <img
                        src={`${comment.image_urls[currentImageIndex]}`}
                        alt="拡大画像"
                        className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
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
                  className={`text-xs ${comment.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover-text-green-300 active:bg-slate-600/50 rounded-lg`}
                  disabled={comment.myReaction !== null}
                >
                  <ThumbsUp className={`w-4 h-4 mr-1 ${comment.myReaction === 'good' ? 'fill-current' : ''}`} />
                  {comment.goodCount}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(comment.id, 'post', 'bad')}
                  className={`text-xs ${comment.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover-text-red-300 active:bg-slate-600/50 rounded-lg`}
                  disabled={comment.myReaction !== null}
                >
                  <ThumbsDown className={`w-4 h-4 mr-1 ${comment.myReaction === 'bad' ? 'fill-current' : ''}`} />
                  {comment.badCount}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-xs text-gray-400 hover-text-blue-300 active:bg-slate-600/50 rounded-lg"
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
                  className="text-xs text-gray-400 hover-text-blue-300 active:bg-slate-600/50 rounded-lg"
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
                    className={`h-8 text-sm w-full bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400 ${
                      authorName.length > MAX_USERNAME_LENGTH ? 'border-red-500' : ''
                    }`}
                  />
                  {authorName.length > MAX_USERNAME_LENGTH && (
                    <div className="text-xs mt-1 text-red-400">
                      ※{MAX_USERNAME_LENGTH}文字以内で入力してください（現在{authorName.length}文字）
                    </div>
                  )}
                </div>
                <Textarea
                  placeholder="返信を書く..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className={`mb-1 text-sm bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400 ${
                    replyContent.length > MAX_CONTENT_LENGTH ? 'border-red-500' : ''
                  }`}
                  rows={2}
                />
                {replyContent.length > MAX_CONTENT_LENGTH && (
                  <div className="text-xs mb-1 text-red-400">
                    ※{MAX_CONTENT_LENGTH}文字以内で入力してください（現在{replyContent.length}文字）
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => handleSubmitReply(comment.id, 'post')}
                    className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      !replyContent.trim() ||
                      !authorName.trim() ||
                      isSubmitting ||
                      authorName.length > MAX_USERNAME_LENGTH ||
                      replyContent.length > MAX_CONTENT_LENGTH
                    }
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
                    className="h-7 px-3 text-xs text-gray-400 hover-text-gray-300 active:bg-slate-600/50 rounded-md"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {showReplies && <div className="mt-2 mb-2 space-y-3">{renderReplies(comment.replies)}</div>}
          </div>
        </div>
      </div>
    </>
  );
}