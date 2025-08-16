'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// APIのベースURL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 型定義
interface Post {
  id: number;
  username: string;
  content: string;
  image_url?: string;
  label: string;
  created_at: string;
}

interface Reply {
  id: number;
  post_id: number;
  username: string;
  content: string;
  created_at: string;
  parent_username?: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<{[key: number]: Reply[]}>({});
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostUsername, setNewPostUsername] = useState('管理者');
  const [searchTerm, setSearchTerm] = useState('');

  // ページロード時にログイン状態を確認
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // 認証が必要なエンドポイントにリクエストを送ることでCookieの有効性を確認
      const res = await fetch(`${API_URL}/api/posts`, { credentials: 'include' });
      if (res.ok) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    }
  }, [isLoggedIn]);

  const fetchAllData = async () => {
    try {
      const postsRes = await fetch(`${API_URL}/api/posts`, { credentials: 'include' });
      if (!postsRes.ok) throw new Error('Failed to fetch posts');
      const postsData: Post[] = await postsRes.json();
      setPosts(postsData);

      const allReplies: {[key: number]: Reply[]} = {};
      for (const post of postsData) {
        const repliesRes = await fetch(`${API_URL}/api/posts/${post.id}/replies`, { credentials: 'include' });
        if (repliesRes.ok) {
          const repliesData: Reply[] = await repliesRes.json();
          allReplies[post.id] = repliesData;
        }
      }
      setReplies(allReplies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Login failed. Please check your password.');
      }
      setIsLoggedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
    const endpoint = type === 'post' ? `/api/posts/${id}` : `/api/replies/${id}`;
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error(`Failed to delete ${type}.`);
      }
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleAdminPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPostContent) return;
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newPostUsername,
          content: newPostContent,
          label: '管理者',
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) setIsLoggedIn(false);
        throw new Error('Failed to create admin post.');
      }
      setNewPostContent('');
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>管理者ログイン</CardTitle>
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
                <Button type="submit">ログイン</Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
        <Button onClick={handleLogout} variant="outline">ログアウト</Button>
      </div>

      {error && <p className="text-red-500 mb-4">Error: {error}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>管理者として投稿</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminPost}>
            <div className="grid gap-4">
              <Input
                value={newPostUsername}
                onChange={(e) => setNewPostUsername(e.target.value)}
                placeholder="Username (default: 管理者)"
              />
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="新しいお知らせや情報を入力..."
                required
              />
              <Button type="submit">投稿する</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">口コミ管理</h2>
      
      <div className="mb-6">
        <Input
          type="text"
          placeholder="名前または内容で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{post.username} <span className="text-xs font-normal text-gray-500">({post.label})</span></p>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                    {post.image_url && <img src={`${API_URL}${post.image_url}`} alt="投稿画像" className="mt-2 max-w-xs rounded-lg" />}
                    <p className="text-xs text-gray-500 mt-1">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                  <Button onClick={() => handleDelete('post', post.id)} variant="destructive" size="sm">削除</Button>
                </div>
                <div className="pl-6 mt-4 space-y-2 border-l-2">
                  {replies[post.id]?.map((reply) => (
                    <div key={reply.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{reply.username}</p>
                        <p className="whitespace-pre-wrap">{reply.content}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(reply.created_at).toLocaleString()}</p>
                      </div>
                      <Button onClick={() => handleDelete('reply', reply.id)} variant="destructive" size="sm">削除</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500">該当する口コミはありません。</p>
        )}
      </div>
    </div>
  );
}