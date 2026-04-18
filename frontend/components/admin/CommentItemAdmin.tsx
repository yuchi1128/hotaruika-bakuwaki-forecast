'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MessageCircle, ThumbsUp, ThumbsDown, Loader2, X, ImageIcon, Trash2, Pencil, Check, Ban } from 'lucide-react';
import TwitterLikeMediaGrid from '@/components/TwitterLikeMediaGrid';
import PollDisplay from '@/components/PollDisplay';
import type { Comment, Reply, BannedDevice } from '@/lib/types';
import { API_URL } from '@/lib/constants';
import { compressImageToBase64 } from '@/lib/image-compression';
import { getPollVote } from '@/lib/client-utils';

interface CommentItemAdminProps {
  comment: Comment;
  handleReaction: (targetId: number, type: 'post' | 'reply', reactionType: 'good' | 'bad') => void;
  handlePollVote: (pollId: number, optionId: number) => void;
  formatTime: (date: Date) => string;
  createAdminReply: (targetId: number, type: 'post' | 'reply', content: string, imageBase64s?: string[]) => Promise<void>;
  onDeletePost: (postId: number, deviceId?: string) => void;
  onDeleteReply: (replyId: number, deviceId?: string) => void;
  onLabelChange: (postId: number, label: string) => Promise<void>;
  onBanDevice: (deviceId: string, reason?: string) => Promise<boolean>;
  bannedDevices: BannedDevice[];
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

export default function CommentItemAdmin({
  comment,
  handleReaction,
  handlePollVote,
  formatTime,
  createAdminReply,
  onDeletePost,
  onDeleteReply,
  onLabelChange,
  onBanDevice,
  bannedDevices,
}: CommentItemAdminProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [isReplyConfirmOpen, setIsReplyConfirmOpen] = useState(false);
  const [pendingReplyTarget, setPendingReplyTarget] = useState<{ targetId: number; type: 'post' | 'reply' } | null>(null);

  // ラベル編集用
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isChangingLabel, setIsChangingLabel] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(comment.label);
  const [showPencil, setShowPencil] = useState(true);

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

  const openReplyConfirm = (targetId: number, type: 'post' | 'reply') => {
    setPendingReplyTarget({ targetId, type });
    setIsReplyConfirmOpen(true);
  };

  const handleSubmitReply = async (targetId: number, type: 'post' | 'reply') => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageBase64s: string[] = [];
      if (selectedImages.length > 0) {
        imageBase64s = await Promise.all(
          selectedImages.map(file => compressImageToBase64(file))
        );
      }

      await createAdminReply(targetId, type, replyContent, imageBase64s.length > 0 ? imageBase64s : undefined);

      if (type === 'post') {
        setShowReplies(true);
      }

      setIsReplyConfirmOpen(false);
      setPendingReplyTarget(null);
      setReplyContent('');
      setSelectedImages([]);
      setIsReplying(false);
      setReplyingTo(null);
    } catch (error) {
      console.error('Reply submission failed:', error);
      const message = error instanceof Error ? error.message : '返信に失敗しました';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLabelConfirm = async () => {
    if (selectedLabel === comment.label) {
      setIsEditingLabel(false);
      setShowPencil(false);
      setTimeout(() => setShowPencil(true), 150);
      return;
    }
    setIsChangingLabel(true);
    try {
      await onLabelChange(comment.id, selectedLabel);
      setIsEditingLabel(false);
      setShowPencil(false);
      setTimeout(() => setShowPencil(true), 150);
    } finally {
      setIsChangingLabel(false);
    }
  };

  const handleCancelLabelEdit = () => {
    setSelectedLabel(comment.label);
    setIsEditingLabel(false);
    setShowPencil(false);
    setTimeout(() => setShowPencil(true), 150);
  };

  const renderReplies = (replies: Reply[], level: number = 0) => {
    return replies.map((reply) => {
      const isBanned = reply.device_id ? bannedDevices.some(b => b.device_id === reply.device_id) : false;
      return (
        <div
          key={reply.id}
          className={`ml-${level * 6} bg-slate-700/30 rounded-lg p-2 md:p-3 border-l-[1.5px] border-blue-500/30 mt-1 md:mt-3 overflow-hidden`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <span className="font-semibold text-blue-200 text-sm sm:text-[15px] truncate min-w-0">
                  {reply.username}
                </span>
                <span className="text-[13px] sm:text-[13px] text-gray-400 shrink-0">
                  {formatTime(new Date(reply.created_at))}
                </span>
                {reply.label && (
                  <Badge variant="secondary" className={`text-[12px] shrink-0 ${reply.label === '管理人' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-blue-700/50 text-blue-200'}`}>
                    {reply.label}
                  </Badge>
                )}
                <button
                  onClick={() => onDeleteReply(reply.id, reply.device_id)}
                  className="ml-auto p-1 rounded text-gray-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
                  title="返信を削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {reply.device_id && (
                <div className="flex items-center gap-1 mb-1 text-[11px] text-gray-400">
                  端末: <span className="font-mono break-all text-gray-300">{reply.device_id}</span>
                  {isBanned ? (
                    <span className="text-red-400 font-semibold ml-1">BAN済</span>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.confirm(`${reply.device_id!} をBANしますか？`)) {
                          onBanDevice(reply.device_id!);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 ml-1"
                      title="この端末をBANする"
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
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
              <div className="flex items-center gap-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(reply.id, 'reply', 'good')}
                  className={`text-xs ${reply.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover-text-green-300 active:bg-slate-600/50 rounded-lg`}
                  style={{ marginTop: '-2px' }}
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
                  style={{ marginTop: '1px' }}
                  disabled={reply.myReaction !== null}
                >
                  <ThumbsDown className={`w-4 h-4 mr-1 ${reply.myReaction === 'bad' ? 'fill-current' : ''}`} />
                  {reply.bad_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                  className="text-xs text-gray-400 hover-text-blue-300 active:bg-slate-600/50 rounded-lg ml-2"
                  style={{ marginTop: '-2px' }}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  管理人として返信
                </Button>
              </div>
              {replyingTo === reply.id && (
                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-blue-500/20">
                  <Textarea
                    placeholder="管理人として返信..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className={`mb-1 text-sm bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400 ${
                      replyContent.length > 1000 ? 'border-red-500' : ''
                    }`}
                    rows={2}
                  />
                  {replyContent.length > 1000 && (
                    <div className="text-xs mb-1 text-red-400">
                      ※1000文字以内で入力してください（現在{replyContent.length}文字）
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
                      onClick={() => openReplyConfirm(reply.id, 'reply')}
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        !replyContent.trim() ||
                        isSubmitting ||
                        replyContent.length > 1000
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
      );
    });
  };

  const isPostBanned = comment.device_id ? bannedDevices.some(b => b.device_id === comment.device_id) : false;
  const isAdminLabel = comment.label === '管理人';

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

      {/* 返信確認モーダル */}
      <Dialog open={isReplyConfirmOpen} onOpenChange={setIsReplyConfirmOpen}>
        <DialogContent className="w-[90vw] max-w-md bg-slate-800/80 border-purple-500/50 text-white shadow-lg backdrop-blur-md rounded-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-200">返信内容の確認</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              以下の内容で管理人として返信します。よろしいですか？
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-purple-500/20 py-2">
            <div className="py-3">
              <span className="text-xs font-bold text-gray-400">返信内容</span>
              <p className="mt-1 text-sm text-white whitespace-pre-wrap break-all">{replyContent}</p>
            </div>
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
              onClick={() => {
                if (pendingReplyTarget) {
                  handleSubmitReply(pendingReplyTarget.targetId, pendingReplyTarget.type);
                }
              }}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  返信する
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsReplyConfirmOpen(false)}
              className="text-gray-300 hover:text-white hover:bg-slate-700/50"
            >
              修正
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div key={comment.id} className="pb-2 border-b border-purple-500/30">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <span className="font-semibold text-purple-200 text-sm sm:text-[15px] truncate min-w-0 shrink">
                {comment.username}
              </span>
              <span className="text-[14px] text-gray-400 shrink-0 whitespace-nowrap">
                {formatTime(new Date(comment.created_at))}
              </span>
              {!isEditingLabel ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="secondary" className={`text-[12px] whitespace-nowrap ${isAdminLabel ? 'bg-emerald-500/30 text-emerald-200' : 'bg-purple-700/50 text-purple-200'}`}>
                    {comment.label}
                  </Badge>
                  {showPencil && (
                    <button
                      onClick={() => setIsEditingLabel(true)}
                      className="p-1 rounded hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 transition-colors"
                      title="ラベルを変更"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={selectedLabel}
                    onChange={(e) => setSelectedLabel(e.target.value)}
                    disabled={isChangingLabel}
                    className="text-xs font-medium px-2 py-1 rounded-md border bg-slate-700/80 text-white border-purple-500/40"
                    autoFocus
                  >
                    <option value="現地情報">現地情報</option>
                    <option value="その他">その他</option>
                    <option value="管理人">管理人</option>
                  </select>
                  <button
                    onClick={handleLabelConfirm}
                    disabled={isChangingLabel}
                    className="p-1 rounded hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                    title="確定"
                  >
                    {isChangingLabel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={handleCancelLabelEdit}
                    disabled={isChangingLabel}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    title="キャンセル"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <button
                onClick={() => onDeletePost(comment.id, comment.device_id)}
                className="ml-auto p-1 rounded text-gray-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
                title="投稿を削除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {comment.device_id && (
              <div className="flex items-center gap-1 mb-2 text-[11px] text-gray-400">
                端末: <span className="font-mono break-all text-gray-300">{comment.device_id}</span>
                {isPostBanned ? (
                  <span className="text-red-400 font-semibold ml-1">BAN済</span>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm(`${comment.device_id!} をBANしますか？`)) {
                        onBanDevice(comment.device_id!);
                      }
                    }}
                    className="text-red-400 hover:text-red-300 ml-1"
                    title="この端末をBANする"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <ExpandableText maxLines={6} className="text-gray-200 mb-3 whitespace-pre-wrap text-[13px] leading-relaxed">
              {linkify(comment.content)}
            </ExpandableText>

            {comment.poll && (
              <PollDisplay
                poll={comment.poll}
                myVotedOptionId={getPollVote(comment.poll.id)}
                onVote={handlePollVote}
                isExpired={new Date(comment.poll.expires_at) < new Date()}
              />
            )}

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
              <div className="flex items-center gap-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(comment.id, 'post', 'good')}
                  className={`text-xs ${comment.myReaction === 'good' ? 'text-green-400' : 'text-gray-400'} hover-text-green-300 active:bg-slate-600/50 rounded-lg`}
                  style={{ marginTop: '-2px' }}
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
                  style={{ marginTop: '1px' }}
                  disabled={comment.myReaction !== null}
                >
                  <ThumbsDown className={`w-4 h-4 mr-1 ${comment.myReaction === 'bad' ? 'fill-current' : ''}`} />
                  {comment.badCount}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-xs text-gray-400 hover-text-blue-300 active:bg-slate-600/50 rounded-lg ml-2"
                  style={{ marginTop: '-2px' }}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  管理人として返信
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
                <Textarea
                  placeholder="管理人として返信..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className={`mb-1 text-sm bg-slate-600/50 border-blue-500/30 text-white placeholder-gray-400 ${
                    replyContent.length > 1000 ? 'border-red-500' : ''
                  }`}
                  rows={2}
                />
                {replyContent.length > 1000 && (
                  <div className="text-xs mb-1 text-red-400">
                    ※1000文字以内で入力してください（現在{replyContent.length}文字）
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
                    onClick={() => openReplyConfirm(comment.id, 'post')}
                    className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      !replyContent.trim() ||
                      isSubmitting ||
                      replyContent.length > 1000
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
