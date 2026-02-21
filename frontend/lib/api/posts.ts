import type { PaginatedPostsResponse } from '@/lib/types';
import { apiFetch } from './client';

export interface FetchPostsParams {
  label?: string | null;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export async function fetchPosts(params: FetchPostsParams = {}): Promise<PaginatedPostsResponse> {
  const { label, page = 1, limit = 30, search, sort = 'newest' } = params;
  let url = `/api/posts?include=replies&page=${page}&limit=${limit}&sort=${sort}`;
  if (label) {
    url += `&label=${encodeURIComponent(label)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return apiFetch<PaginatedPostsResponse>(url);
}

export async function createPost(
  username: string,
  content: string,
  label: string,
  imageBase64s: string[],
): Promise<void> {
  await apiFetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content, label, image_urls: imageBase64s }),
  });
}

export async function createReply(
  targetId: number,
  type: 'post' | 'reply',
  username: string,
  content: string,
  imageBase64s?: string[],
): Promise<void> {
  const endpoint = type === 'post'
    ? `/api/posts/${targetId}/replies`
    : `/api/replies/${targetId}/replies`;
  const body: Record<string, unknown> = { username, content };
  if (imageBase64s && imageBase64s.length > 0) {
    body.image_urls = imageBase64s;
  }
  await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function createReaction(
  targetId: number,
  type: 'post' | 'reply',
  reactionType: 'good' | 'bad',
): Promise<void> {
  const endpoint = type === 'post'
    ? `/api/posts/${targetId}/reaction`
    : `/api/replies/${targetId}/reaction`;
  await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reaction_type: reactionType }),
  });
}
