import type { PaginatedPostsResponse } from '@/lib/types';
import { COMMENTS_PER_PAGE } from '@/lib/constants';
import { apiFetch } from './client';

export interface FetchPostsParams {
  label?: string | null;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  date_from?: string;
  date_to?: string;
  device_id?: string;
}

export async function fetchPosts(params: FetchPostsParams = {}): Promise<PaginatedPostsResponse> {
  const { label, page = 1, limit = COMMENTS_PER_PAGE, search, sort = 'newest', date_from, date_to, device_id } = params;
  let url = `/api/posts?include=replies&page=${page}&limit=${limit}&sort=${sort}`;
  if (label) {
    url += `&label=${encodeURIComponent(label)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (date_from) {
    url += `&date_from=${encodeURIComponent(date_from)}`;
  }
  if (date_to) {
    url += `&date_to=${encodeURIComponent(date_to)}`;
  }
  if (device_id) {
    url += `&device_id=${encodeURIComponent(device_id)}`;
  }
  return apiFetch<PaginatedPostsResponse>(url);
}

export interface CreatePollParams {
  options: string[];
  duration_hours: number;
}

export async function createPost(
  username: string,
  content: string,
  label: string,
  imageBase64s: string[],
  pollRequest?: CreatePollParams,
): Promise<void> {
  const body: Record<string, unknown> = {
    username,
    content,
    label,
    image_urls: imageBase64s,
  };
  if (pollRequest) {
    body.poll_request = pollRequest;
  }
  await apiFetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function votePollOption(optionId: number): Promise<void> {
  await apiFetch(`/api/polls/${optionId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
