'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Post {
  id: number;
  username: string;
  content: string;
  image_url: string | null;
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

  const handleSubmitReply = async (targetId: number, type: 'post' | 'reply') => {
    if (!replyContent.trim() || !authorName.trim()) return;

    await createReply(targetId, type, authorName, replyContent);
    
    setReplyContent('');
    setAuthorName('');
    setIsReplying(false);
    setReplyingTo(null);
  };

  const renderReplies = (replies: Reply[], level: number = 0) => {
    return replies.map(reply => (
      <div key={reply.id} className={`ml-${level * 6} bg-slate-700/20 rounded-lg p-3 border-l-2 border-blue-500/30 mt-3`}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-blue-200 text-sm max-w-[120px] truncate block sm:max-w-none sm:overflow-visible sm:whitespace-normal">{reply.username}</span> 
              <span className="text-xs text-gray-400">{formatTime(new Date(reply.created_at))}</span>
            </div>
            <p className="text-gray-200 text-sm mb-2 whitespace-pre-wrap">
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
            >
              <ThumbsUp className={`w-3 h-3 mr-1 ${reply.myReaction === 'good' ? 'fill-current' : ''}`} />
              {reply.good_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reply.id, 'reply', 'bad')}
              className={`text-xs ${reply.myReaction === 'bad' ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
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
                    onClick={() => setReplyingTo(null)}
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
    <div key={comment.id} className="bg-slate-800/30 rounded-lg p-4 border border-purple-500/20">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-purple-200 max-w-[120px] truncate block sm:max-w-none sm:overflow-visible sm:whitespace-normal">{comment.username}</span> 
            <span className="text-xs text-gray-400">{formatTime(new Date(comment.created_at))}</span>
            <Badge variant="secondary" className="bg-purple-700/50 text-purple-200">{comment.label}</Badge>
          </div>
          <p className="text-gray-200 mb-3 whitespace-pre-wrap">{comment.content}</p>
          {comment.image_url && (
            <img src={`http://localhost:8080${comment.image_url}`} alt="投稿画像" className="max-w-xs max-h-48 object-contain rounded-lg mb-3" />
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
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-gray-400 hover:text-blue-300"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              返信
            </Button>
          </div>

          {/* 返信フォーム */}
          {isReplying && (
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
                  onClick={() => setIsReplying(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {/* 返信一覧 */}
          {comment.replies.length > 0 && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-gray-400 hover:text-blue-300"
              >
                {showReplies ? '返信を隠す' : `${comment.replies.length}件の返信を表示`}
              </Button>
              {showReplies && (
                <div className="mt-3 space-y-3">
                  {renderReplies(comment.replies)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}