'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPosts as apiFetchPosts,
  createPost as apiCreatePost,
  createReply as apiCreateReply,
  type FetchPostsParams,
} from '@/lib/api/posts';
import { getReaction } from '@/lib/client-utils';
import type { Comment } from '@/lib/types';

export function usePosts() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastFetchParamsRef = useRef<FetchPostsParams>({});

  const fetchPosts = useCallback(async (params: FetchPostsParams = {}) => {
    lastFetchParamsRef.current = params;
    try {
      const data = await apiFetchPosts(params);
      const commentsWithReplies: Comment[] = data.posts.map((post) => ({
        ...post,
        replies: post.replies.map((reply) => ({
          ...reply,
          goodCount: reply.good_count,
          badCount: reply.bad_count,
          myReaction: getReaction('reply', reply.id),
        })),
        goodCount: post.good_count,
        badCount: post.bad_count,
        myReaction: getReaction('post', post.id),
      }));
      setComments(commentsWithReplies);
      setTotalComments(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  }, []);

  useEffect(() => {
    fetchPosts({});
  }, [fetchPosts]);

  const createPost = useCallback(async (
    username: string,
    content: string,
    label: string,
    imageBase64s: string[],
  ) => {
    setIsSubmitting(true);
    try {
      await apiCreatePost(username, content, label, imageBase64s);
      await fetchPosts({ ...lastFetchParamsRef.current, page: 1 });
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchPosts]);

  const createReply = useCallback(async (
    targetId: number,
    type: 'post' | 'reply',
    username: string,
    content: string,
    imageBase64s?: string[],
  ) => {
    try {
      await apiCreateReply(targetId, type, username, content, imageBase64s);
      await fetchPosts(lastFetchParamsRef.current);
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  }, [fetchPosts]);

  return {
    comments,
    setComments,
    totalComments,
    totalPages,
    currentPage,
    isSubmitting,
    fetchPosts,
    createPost,
    createReply,
  };
}
