'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, ImageIcon, X, Pencil, Check } from 'lucide-react';
import TwitterLikeMediaGrid from '@/components/TwitterLikeMediaGrid';

// APIのベースURL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 型定義
interface Post {
  id: number;
  username: string;
  content:string;
  image_urls: string[];
  label: string;
  created_at: string;
}

interface Reply {
  id: number;
  post_id: number;
  username: string;
  content: string;
  label?: string;
  created_at: string;
  parent_username?: string;
}

// 投稿と返信をまとめた型
type PostWithReplies = Post & { replies: Reply[] };

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<PostWithReplies[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostUsername, setNewPostUsername] = useState('管理者');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/check`, { credentials: 'include' });
      if (res.ok) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    }
  }, [isLoggedIn]);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const postsRes = await fetch(`${API_URL}/api/posts?include=replies`, { credentials: 'include' });
      if (!postsRes.ok) throw new Error('取得に失敗しました');
      const postsWithReplies: (Post & { replies: Reply[] })[] = await postsRes.json();

      setPosts(postsWithReplies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('ログインに失敗しました。パスワードを確認してください。');
      }
      setIsLoggedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setIsLoggedIn(false);
      setPassword('');
    }
  };
  
  const handleDelete = async (type: 'post' | 'reply', id: number) => {
    if (!window.confirm(`${type === 'post' ? 'この投稿' : 'この返信'}を本当に削除しますか？`)) {
      return;
    }
    const endpoint = type === 'post' ? `/api/posts/${id}` : `/api/replies/${id}`;
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error(`${type}の削除に失敗しました。`);
      }
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
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

  const handleAdminPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPostContent) return;

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

    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newPostUsername,
          content: newPostContent,
          label: '管理者',
          image_urls: imageBase64s,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error('管理者投稿の作成に失敗しました。');
      }
      setNewPostContent('');
      setSelectedImages([]);
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };
  
  const handleAdminReply = async (postId: number, content: string) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: '管理者',
          content: content,
          label: '管理者',
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error('管理者返信の作成に失敗しました。');
      }
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  const handleAdminReplyToReply = async (replyId: number, content: string) => {
    try {
      const res = await fetch(`${API_URL}/api/replies/${replyId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: '管理者',
          content: content,
          label: '管理者',
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error('管理者返信の作成に失敗しました。');
      }
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  const handleLabelChange = async (postId: number, label: string) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/label`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error('ラベルの変更に失敗しました。');
      }
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && !isLoggedIn) {
      return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">管理者ログイン</CardTitle>
            <CardDescription>管理用パスワードを入力してください。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-600 text-white" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'ログイン'}
                </Button>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <Button onClick={handleLogout} className="bg-gray-700 hover:bg-gray-600 text-white">ログアウト</Button>
        </header>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-6">Error: {error}</p>}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <Card className="shadow-sm bg-white border border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900">管理者として投稿</CardTitle>
                <CardDescription className="text-gray-500">お知らせなどを投稿します。</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminPost} className="space-y-4">
                  <Input
                    value={newPostUsername}
                    onChange={(e) => setNewPostUsername(e.target.value)}
                    placeholder="ユーザー名 (デフォルト: 管理者)"
                    className="bg-white border-gray-800 text-gray-900"
                  />
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="新しいお知らせや情報を入力..."
                    required
                    rows={4}
                    className="bg-white border-gray-800 text-gray-900"
                  />
                  <div className="space-y-2">
                    <label htmlFor="image-upload" className="cursor-pointer flex items-center text-sm text-gray-600 hover:text-gray-800">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      <span>画像を選択 ({selectedImages.length}/4)</span>
                    </label>
                    <Input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={selectedImages.length >= 4} />
                    {selectedImages.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-600 text-white">投稿する</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">掲示板管理</h2>
              <div className="mb-4">
                  <Input
                  type="text"
                  placeholder="名前または内容で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-md bg-white"
                  />
              </div>

              {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
              ) : (
                  <div className="space-y-4">
                      {filteredPosts.length > 0 ? (
                      filteredPosts.map((post) => (
                          <PostCard key={post.id} post={post} onDelete={handleDelete} onReply={handleAdminReply} onReplyToReply={handleAdminReplyToReply} onLabelChange={handleLabelChange} />
                      ))
                      ) : (
                      <p className="text-gray-500 text-center py-8">該当する投稿はありません。</p>
                      )}
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, onDelete, onReply, onReplyToReply, onLabelChange }: { post: PostWithReplies, onDelete: (type: 'post' | 'reply', id: number) => void, onReply: (postId: number, content: string) => Promise<void>, onReplyToReply: (replyId: number, content: string) => Promise<void>, onLabelChange: (postId: number, label: string) => Promise<void> }) {
  const isAdmin = post.label === '管理者';
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingLabel, setIsChangingLabel] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [showPencil, setShowPencil] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState(post.label);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReply(post.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLabelConfirm = async () => {
    if (selectedLabel === post.label) {
      setIsEditingLabel(false);
      setShowPencil(false);
      setTimeout(() => setShowPencil(true), 150);
      return;
    }
    setIsChangingLabel(true);
    try {
      await onLabelChange(post.id, selectedLabel);
      setIsEditingLabel(false);
      setShowPencil(false);
      setTimeout(() => setShowPencil(true), 150);
    } finally {
      setIsChangingLabel(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedLabel(post.label);
    setIsEditingLabel(false);
    setShowPencil(false);
    setTimeout(() => setShowPencil(true), 150);
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <p className="font-bold text-lg text-gray-800">{post.username}</p>
                {!isEditingLabel ? (
                  <div className="flex items-center gap-1">
                    <Badge className={isAdmin ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                      {post.label}
                    </Badge>
                    {showPencil && (
                      <button
                        onClick={() => setIsEditingLabel(true)}
                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                        title="ラベルを変更"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <select
                      value={selectedLabel}
                      onChange={(e) => {
                        setSelectedLabel(e.target.value);
                      }}
                      onBlur={() => {
                        if (!isChangingLabel) {
                          setTimeout(() => {
                            handleCancelEdit();
                          }, 150);
                        }
                      }}
                      disabled={isChangingLabel}
                      className="text-sm font-medium px-2 py-1 rounded-md border bg-white text-gray-700 border-gray-300"
                      autoFocus
                    >
                      <option value="現地情報">現地情報</option>
                      <option value="その他">その他</option>
                      <option value="管理者">管理者</option>
                    </select>
                    <button
                      onClick={handleLabelConfirm}
                      disabled={isChangingLabel}
                      className="p-1 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                      title="確定"
                    >
                      {isChangingLabel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isChangingLabel}
                      className="p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="キャンセル"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
            </div>
            <Button
              onClick={() => onDelete('post', post.id)}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
                <Trash2 className="h-4 w-4"/>
            </Button>
        </div>
        <p className="text-xs text-gray-500 pt-1">{new Date(post.created_at).toLocaleString('ja-JP')}</p>
      </CardHeader>

      <CardContent className="p-4 bg-white">
        <p className="whitespace-pre-wrap text-gray-800">{post.content}</p>
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mt-4">
            <TwitterLikeMediaGrid images={post.image_urls.map(url => `${url}`)} />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          {!isReplying ? (
            <Button onClick={() => setIsReplying(true)} size="sm" className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100">
              管理者として返信
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="管理者として返信..."
                rows={3}
                className="w-full bg-white border-gray-300 text-gray-900"
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitReply} size="sm" className="bg-gray-700 hover:bg-gray-600 text-white" disabled={!replyContent.trim() || isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  返信する
                </Button>
                <Button onClick={() => { setIsReplying(false); setReplyContent(''); }} variant="ghost" size="sm">
                  キャンセル
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {post.replies && post.replies.length > 0 && (
        <CardFooter className="p-4 bg-gray-50 border-t border-gray-200 flex-col items-start">
          <h4 className="font-semibold text-sm mb-3 text-gray-600">返信 ({post.replies.length}件)</h4>
          <div className="space-y-3 w-full">
            {post.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} onDelete={onDelete} onReplyToReply={onReplyToReply} />
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

function ReplyItem({ reply, onDelete, onReplyToReply }: { reply: Reply, onDelete: (type: 'post' | 'reply', id: number) => void, onReplyToReply: (replyId: number, content: string) => Promise<void> }) {
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReplyToReply(reply.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 rounded-md bg-white border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-gray-800">{reply.username}</p>
            {reply.label && (
              <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                {reply.label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 mb-1.5">{new Date(reply.created_at).toLocaleString('ja-JP')}</p>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{reply.content}</p>

          <div className="mt-2">
            {!isReplying ? (
              <Button onClick={() => setIsReplying(true)} variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 h-7 text-xs">
                返信する
              </Button>
            ) : (
              <div className="space-y-2 mt-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="管理者として返信..."
                  rows={2}
                  className="w-full text-sm bg-white border-gray-300 text-gray-900"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReply} size="sm" className="h-7 text-xs bg-gray-700 hover:bg-gray-600 text-white" disabled={!replyContent.trim() || isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    返信
                  </Button>
                  <Button onClick={() => { setIsReplying(false); setReplyContent(''); }} variant="ghost" size="sm" className="h-7 text-xs">
                    キャンセル
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <Button onClick={() => onDelete('reply', reply.id)} variant="ghost" size="icon" className="text-gray-500 hover:bg-red-100 hover:text-red-600 h-8 w-8">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}