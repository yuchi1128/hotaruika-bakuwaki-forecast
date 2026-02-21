'use client';

import { useRef, useCallback } from 'react';
import { createReaction as apiCreateReaction } from '@/lib/api/posts';
import { saveReaction, getReaction, removeReaction } from '@/lib/client-utils';
import type { Comment } from '@/lib/types';

export function useReactions(
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>,
  fetchPosts: (params?: Record<string, unknown>) => Promise<void>,
) {
  const pendingReactions = useRef(new Set<string>());

  const handleReaction = useCallback(async (
    targetId: number,
    type: 'post' | 'reply',
    reactionType: 'good' | 'bad',
  ) => {
    const key = `${type}_${targetId}`;

    if (pendingReactions.current.has(key) || getReaction(type, targetId) !== null) {
      return;
    }

    pendingReactions.current.add(key);
    saveReaction(type, targetId, reactionType);

    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (type === 'post' && comment.id === targetId) {
          return {
            ...comment,
            myReaction: reactionType,
            goodCount: reactionType === 'good' ? comment.goodCount + 1 : comment.goodCount,
            badCount: reactionType === 'bad' ? comment.badCount + 1 : comment.badCount,
          };
        }
        if (type === 'reply') {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === targetId
                ? {
                    ...reply,
                    myReaction: reactionType,
                    good_count: reactionType === 'good' ? reply.good_count + 1 : reply.good_count,
                    bad_count: reactionType === 'bad' ? reply.bad_count + 1 : reply.bad_count,
                  }
                : reply
            ),
          };
        }
        return comment;
      })
    );

    try {
      await apiCreateReaction(targetId, type, reactionType);
    } catch (error) {
      console.error('Failed to create reaction:', error);
      removeReaction(type, targetId);
      await fetchPosts({});
    } finally {
      pendingReactions.current.delete(key);
    }
  }, [setComments, fetchPosts]);

  return { handleReaction };
}
