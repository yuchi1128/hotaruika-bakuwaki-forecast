'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ImageIcon, X, Ban, ShieldOff, ChevronDown } from 'lucide-react';
import PollCreator from '@/components/PollCreator';
import CommentSectionAdmin from '@/components/admin/CommentSectionAdmin';
import { usePosts } from '@/hooks/usePosts';
import { useReactions } from '@/hooks/useReactions';
import { usePollVote } from '@/hooks/usePollVote';
import { createAdminReply } from '@/lib/api/posts';
import { formatTime } from '@/lib/utils';
import { API_URL, MAX_ADMIN_CONTENT_LENGTH, MAX_POLL_OPTION_LENGTH, COMMENTS_PER_PAGE } from '@/lib/constants';
import type { CreatePollParams } from '@/lib/api/posts';
import type { BannedDevice, Comment } from '@/lib/types';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostUsername, setNewPostUsername] = useState('管理人');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [pollData, setPollData] = useState<CreatePollParams | null>(null);
  const [pollReset, setPollReset] = useState(false);
  const [bannedDevices, setBannedDevices] = useState<BannedDevice[]>([]);
  const [isBanListOpen, setIsBanListOpen] = useState(false);
  const [isPostingAdmin, setIsPostingAdmin] = useState(false);

  const {
    comments,
    setComments,
    totalComments,
    totalPages,
    currentPage,
    fetchPosts,
  } = usePosts({ skipInitialFetch: true });

  const { handleReaction } = useReactions(setComments, fetchPosts);
  const { handlePollVote } = usePollVote(setComments, fetchPosts);

  // 最新の fetch パラメータを保持 (再取得用)
  const lastFetchParamsRef = useRef<{ page: number }>({ page: 1 });
  lastFetchParamsRef.current = { page: currentPage };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/check`, { credentials: 'include' });
      setIsLoggedIn(res.ok);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBannedDevices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/banned-devices`, { credentials: 'include' });
      if (res.ok) {
        const banned: BannedDevice[] = await res.json();
        setBannedDevices(banned);
      }
    } catch (err) {
      console.error('BANリスト取得エラー:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBannedDevices();
    }
  }, [isLoggedIn]);

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
    } finally {
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
      console.error('Logout request failed:', err);
    } finally {
      setIsLoggedIn(false);
      setPassword('');
    }
  };

  // 現在のページを再取得 (admin_device=true)
  const refreshCurrentPage = () => {
    fetchPosts({
      page: lastFetchParamsRef.current.page,
      limit: COMMENTS_PER_PAGE,
      admin_device: true,
    });
  };

  // 投稿または返信の削除 (楽観的UI更新 + 成功後の再取得で確実に同期)
  const handleDelete = async (type: 'post' | 'reply', id: number) => {
    // 楽観的UI更新
    if (type === 'post') {
      setComments((prev: Comment[]) => prev.filter((c) => c.id !== id));
    } else {
      setComments((prev: Comment[]) =>
        prev.map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.id !== id),
        }))
      );
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
      // 成功後もサーバーと同期 (楽観更新が上書きされる問題を防ぐ)
      refreshCurrentPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      refreshCurrentPage();
    }
  };

  const handleBanDevice = async (deviceId: string, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/admin/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, reason }),
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) {
          setIsLoggedIn(false);
          throw new Error('セッションが切れました。再ログインしてください。');
        }
        throw new Error('BANに失敗しました。');
      }
      await fetchBannedDevices();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      return false;
    }
  };

  const handleUnbanDevice = async (deviceId: string) => {
    if (!window.confirm(`${deviceId} のBANを解除しますか？`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/ban/${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) {
          setIsLoggedIn(false);
          throw new Error('セッションが切れました。再ログインしてください。');
        }
        throw new Error('BAN解除に失敗しました。');
      }
      await fetchBannedDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  // 削除+BAN の2段階 confirm フロー
  // BAN先行→成功時のみ削除の順序で実行し、「削除後にBANが失敗してデバイスIDが失われる」ことを防ぐ
  const handleDeleteWithBan = async (type: 'post' | 'reply', id: number, deviceId?: string) => {
    const label = type === 'post' ? 'この投稿' : 'この返信';
    if (!window.confirm(`${label}を本当に削除しますか？`)) return;
    const banAlso = deviceId
      ? window.confirm(`この端末（${deviceId}）もBANしますか？\n\n「OK」→ BANしてから削除\n「キャンセル」→ 削除のみ`)
      : false;

    if (banAlso && deviceId) {
      const banSuccess = await handleBanDevice(deviceId, `${label}削除に伴うBAN`);
      if (!banSuccess) {
        // BAN失敗 → 削除もキャンセルし、デバイスIDをユーザーに伝える
        window.alert(
          `BANに失敗したため、削除もキャンセルしました。\n\nデバイスID: ${deviceId}\n\n` +
          `この ID をコピーして、セッション再ログイン後に BANリスト管理から手動でBANしてください。`
        );
        return;
      }
    }
    await handleDelete(type, id);
  };

  // ラベル変更 (楽観的UI更新 + 成功後の再取得)
  const handleLabelChange = async (postId: number, label: string) => {
    setComments((prev: Comment[]) => prev.map((c) => (c.id === postId ? { ...c, label } : c)));
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
      refreshCurrentPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      refreshCurrentPage();
    }
  };

  // 管理人返信 (CommentSectionAdmin → CommentItemAdmin から呼ばれる)
  const handleAdminReply = async (
    targetId: number,
    type: 'post' | 'reply',
    content: string,
    imageBase64s?: string[],
  ) => {
    try {
      await createAdminReply(targetId, type, content, imageBase64s);
      refreshCurrentPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : '返信に失敗しました');
      throw err;
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      if (selectedImages.length + files.length > 4) {
        alert('写真は最大4枚までです。');
        const remainingSlots = 4 - selectedImages.length;
        if (remainingSlots > 0) {
          setSelectedImages((prev) => [...prev, ...files.slice(0, remainingSlots)]);
        }
      } else {
        setSelectedImages((prev) => [...prev, ...files]);
      }
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdminPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isPostingAdmin) return;

    setIsPostingAdmin(true);
    setError('');

    let imageBase64s: string[] = [];
    if (selectedImages.length > 0) {
      imageBase64s = await Promise.all(
        selectedImages.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (err) => reject(err);
            })
        )
      );
    }

    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newPostUsername,
          content: newPostContent,
          label: '管理人',
          image_urls: imageBase64s,
          ...(pollData && { poll_request: pollData }),
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error('管理人投稿の作成に失敗しました。');
      }
      setNewPostContent('');
      setSelectedImages([]);
      setPollData(null);
      setPollReset(true);
      setTimeout(() => setPollReset(false), 0);
      // 1ページ目 (新着) に戻す
      fetchPosts({ page: 1, limit: COMMENTS_PER_PAGE, admin_device: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsPostingAdmin(false);
    }
  };

  if (isLoading && !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-sm bg-gradient-to-br from-slate-900/60 to-purple-900/60 border-purple-500/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-200">管理人ログイン</CardTitle>
            <CardDescription className="text-purple-300/70">管理用パスワードを入力してください。</CardDescription>
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
                  className="bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
                />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'ログイン'}
                </Button>
                {error && <p className="text-red-300 text-sm text-center">{error}</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-purple-500/30">
          <h1 className="text-3xl font-bold text-purple-200">管理人ページ</h1>
          <Button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700 text-white">ログアウト</Button>
        </header>

        {error && (
          <p className="bg-red-900/40 text-red-300 border border-red-500/30 p-3 rounded-md mb-6">Error: {error}</p>
        )}

        {/* BANリスト管理 */}
        <Card className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 border-purple-500/20 mb-8">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsBanListOpen(!isBanListOpen)}>
            <CardTitle className="text-purple-200 flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-400" />
              BANリスト管理
              {bannedDevices.length > 0 && (
                <span className="text-sm font-normal text-gray-400">({bannedDevices.length}件)</span>
              )}
              <ChevronDown className={`h-4 w-4 ml-auto text-gray-400 transition-transform ${isBanListOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
            <CardDescription className="text-purple-300/70">クリックして展開</CardDescription>
          </CardHeader>
          {isBanListOpen && (
            <CardContent>
              {bannedDevices.length === 0 ? (
                <p className="text-gray-400 text-sm">BANされた端末はありません。</p>
              ) : (
                <div className="space-y-2">
                  {bannedDevices.map((ban) => (
                    <div key={ban.id} className="flex justify-between items-center p-3 border border-purple-500/20 rounded-md bg-slate-800/50">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-gray-200">{ban.device_id}</span>
                        {ban.reason && <span className="text-xs text-gray-400">理由: {ban.reason}</span>}
                        <span className="text-xs text-gray-500">{new Date(ban.banned_at).toLocaleString('ja-JP')}</span>
                      </div>
                      <Button onClick={() => handleUnbanDevice(ban.device_id)} size="sm" variant="outline" className="text-red-300 border-red-400/40 hover:bg-red-900/30 hover:text-red-200">
                        <ShieldOff className="h-3.5 w-3.5 mr-1" />
                        解除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 管理人として投稿 */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-200">管理人として投稿</CardTitle>
                <CardDescription className="text-purple-300/70">お知らせなどを投稿します。</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminPost} className="space-y-4">
                  <Input
                    value={newPostUsername}
                    onChange={(e) => setNewPostUsername(e.target.value)}
                    placeholder="ユーザー名 (デフォルト: 管理人)"
                    className="bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400"
                  />
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="新しいお知らせや情報を入力..."
                    required
                    rows={4}
                    className={`bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-400 ${
                      newPostContent.length > MAX_ADMIN_CONTENT_LENGTH ? 'border-red-500' : ''
                    }`}
                  />
                  {newPostContent.length > MAX_ADMIN_CONTENT_LENGTH && (
                    <p className="text-xs text-red-400">
                      ※{MAX_ADMIN_CONTENT_LENGTH}文字以内で入力してください（現在{newPostContent.length}文字）
                    </p>
                  )}
                  <PollCreator onChange={setPollData} onReset={pollReset} />
                  <div className="space-y-2">
                    <label htmlFor="image-upload" className="cursor-pointer flex items-center text-sm text-gray-300 hover:text-white">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      <span>画像を選択 ({selectedImages.length}/4)</span>
                    </label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={selectedImages.length >= 4}
                    />
                    {selectedImages.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img src={URL.createObjectURL(image)} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={
                      isPostingAdmin ||
                      newPostContent.length > MAX_ADMIN_CONTENT_LENGTH ||
                      (pollData !== null && (
                        pollData.options.filter((o) => o.trim() !== '').length < 2 ||
                        pollData.options.some((o) => o.length > MAX_POLL_OPTION_LENGTH)
                      ))
                    }
                  >
                    {isPostingAdmin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '投稿する'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 掲示板管理 (CommentSectionAdmin) */}
          <div className="lg:col-span-2">
            <CommentSectionAdmin
              comments={comments}
              totalComments={totalComments}
              totalPages={totalPages}
              currentPage={currentPage}
              handleReaction={handleReaction}
              handlePollVote={handlePollVote}
              formatTime={formatTime}
              createAdminReply={handleAdminReply}
              fetchPosts={fetchPosts}
              onDeletePost={(id, did) => handleDeleteWithBan('post', id, did)}
              onDeleteReply={(id, did) => handleDeleteWithBan('reply', id, did)}
              onLabelChange={handleLabelChange}
              onBanDevice={handleBanDevice}
              bannedDevices={bannedDevices}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
