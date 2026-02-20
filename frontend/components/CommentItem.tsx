'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MessageCircle, ThumbsUp, ThumbsDown, Loader2, X, ImageIcon } from 'lucide-react';
import TwitterLikeMediaGrid from '@/components/TwitterLikeMediaGrid';
import type { Comment, Reply } from '@/lib/types';
import { API_URL, MAX_USERNAME_LENGTH, MAX_CONTENT_LENGTH } from '@/lib/constants';

interface CommentItemProps {
  comment: Comment;
  handleReaction: (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => void;
  formatTime: (date: Date) => string;
  createReply: (targetId: number, type: 'post' | 'reply', username: string, content: string, imageBase64s?: string[]) => Promise<void>;
}

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

const ExpandableText = ({ children, maxLines, className }: {
  children: React.ReactNode;
  maxLines: number;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, [children]);

  return (
    <div className={className}>
      <div
        ref={textRef}
        style={!isExpanded ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties : undefined}
      >
        {children}
      </div>
      {isClamped && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-blue-400 hover:text-blue-300 text-[13px] mt-1"
        >
          続きを読む
        </button>
      )}
    </div>
  );
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]);

  const handleImageClick = (index: number, images: string[]) => {
    setModalImages(images);
    setCurrentImageIndex(index);
    setShowImageModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    document.body.style.overflow = '';
  };

  const handleReplyImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveReplyImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReply = async (targetId: number, type: 'post' | 'reply') => {
    if (!replyContent.trim() || !authorName.trim() || isSubmitting) return;

    setIsSubmitting(true);
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

      await createReply(targetId, type, authorName, replyContent, imageBase64s.length > 0 ? imageBase64s : undefined);

      if (type === 'post') {
        setShowReplies(true);
      }

      setReplyContent('');
      setAuthorName('');
      setSelectedImages([]);
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
        className={`ml-${level * 6} bg-slate-700/30 rounded-lg p-2 md:p-3 border-l-[1.5px] border-blue-500/30 mt-1 md:mt-3`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <span className="font-semibold text-blue-200 text-sm sm:text-[15px] truncate min-w-0">
                {reply.username}
              </span>
              <span className="text-[13px] sm:text-[13px] text-gray-400 shrink-0">
                {formatTime(new Date(reply.created_at))}
              </span>
              {reply.label && (
                <Badge variant="secondary" className="bg-blue-700/50 text-blue-200 text-[12px] shrink-0">
                  {reply.label}
                </Badge>
              )}
            </div>
            <ExpandableText maxLines={6} className="text-gray-200 text-[13px] mb-2 whitespace-pre-wrap leading-relaxed">
              {reply.parent_username && <div className="text-blue-300 mb-0.5">@{reply.parent_username}</div>}
              <div>{linkify(reply.content)}</div>
            </ExpandableText>
            {reply.image_urls && reply.image_urls.length > 0 && (
              <div className="mb-2">
                <TwitterLikeMediaGrid
                  images={reply.image_urls}
                  baseUrl={API_URL}
                  onOpen={(i) => handleImageClick(i, reply.image_urls!)}
                  className="md:max-w-[400px] lg:max-w-[440px]"
                  maxVH={30}
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'good')}
              className={`text-xs ${reply.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover-text-green-300 active:bg-slate-600/50 rounded-lg`}
              disabled={reply.myReaction !== null}
            >
              <ThumbsUp className={`w-4 h-4 mr-1 ${reply.myReaction === 'good' ? 'fill-current' : ''}`} />
              {reply.good_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'bad')}
              className={`text-xs ${reply.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover-text-red-300 active:bg-slate-600/50 rounded-lg`}
              disabled={reply.myReaction !== null}
            >
              <ThumbsDown className={`w-4 h-4 mr-1 ${reply.myReaction === 'bad' ? 'fill-current' : ''}`} />
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
                <label htmlFor={`reply-image-${reply.id}`} className="cursor-pointer flex items-center text-sm text-gray-400 hover:text-gray-200 mt-2 mb-3">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  <span>画像を選択 ({selectedImages.length}/4)</span>
                </label>
                <input
                  id={`reply-image-${reply.id}`}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReplyImageChange}
                  className="hidden"
                  disabled={selectedImages.length >= 4}
                />
                {selectedImages.length > 0 && (
                  <div className="mt-1 mb-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={URL.createObjectURL(image)} alt={`preview ${index}`} className="w-full h-20 object-cover rounded-md" />
                        <button onClick={() => handleRemoveReplyImage(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
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
                    onClick={() => { setReplyingTo(null); setSelectedImages([]); }}
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
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-semibold text-purple-200 text-sm sm:text-[15px] truncate min-w-0">
                  {comment.username}
                </span>
                <span className="text-[14px] sm:text-[14px] text-gray-400 shrink-0">
                  {formatTime(new Date(comment.created_at))}
                </span>
              </div>
              <Badge variant="secondary" className="bg-purple-700/50 text-purple-200 text-[12px] shrink-0">
                {comment.label}
              </Badge>
            </div>

            <ExpandableText maxLines={6} className="text-gray-200 mb-3 whitespace-pre-wrap text-[13px] leading-relaxed">
              {linkify(comment.content)}
            </ExpandableText>

            {comment.image_urls && comment.image_urls.length > 0 && (
              <TwitterLikeMediaGrid
                images={comment.image_urls}
                baseUrl={API_URL}
                onOpen={(i) => handleImageClick(i, comment.image_urls)}
                className="md:max-w-[460px] lg:max-w-[500px]"
                maxVH={35}
              />
            )}

            {showImageModal && modalImages.length > 0 && (
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

                  {modalImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length)
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        &#10094;
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % modalImages.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        &#10095;
                      </button>
                    </>
                  )}

                  <img
                    src={`${modalImages[currentImageIndex]}`}
                    alt="拡大画像"
                    className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
                  />
                </div>
              </div>
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
                  className="text-[13px] text-gray-400 hover-text-blue-300 active:bg-slate-600/50 rounded-lg"
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
                <label htmlFor={`reply-image-post-${comment.id}`} className="cursor-pointer flex items-center text-sm text-gray-400 hover:text-gray-200 mt-2 mb-3">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  <span>画像を選択 ({selectedImages.length}/4)</span>
                </label>
                <input
                  id={`reply-image-post-${comment.id}`}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReplyImageChange}
                  className="hidden"
                  disabled={selectedImages.length >= 4}
                />
                {selectedImages.length > 0 && (
                  <div className="mt-1 mb-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={URL.createObjectURL(image)} alt={`preview ${index}`} className="w-full h-20 object-cover rounded-md" />
                        <button onClick={() => handleRemoveReplyImage(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
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
                    onClick={() => { setIsReplying(false); setSelectedImages([]); }}
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