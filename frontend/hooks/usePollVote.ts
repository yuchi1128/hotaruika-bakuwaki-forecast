'use client';

import { useRef, useCallback } from 'react';
import { votePollOption as apiVotePollOption } from '@/lib/api/posts';
import { savePollVote, getPollVote, removePollVote } from '@/lib/client-utils';
import type { Comment } from '@/lib/types';

export function usePollVote(
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>,
  fetchPosts: (params?: Record<string, unknown>) => Promise<void>,
) {
  const pendingVotes = useRef(new Set<number>());

  const handlePollVote = useCallback(async (
    pollId: number,
    optionId: number,
  ) => {
    if (pendingVotes.current.has(pollId) || getPollVote(pollId) !== null) {
      return;
    }

    pendingVotes.current.add(pollId);
    savePollVote(pollId, optionId);

    // 楽観的更新
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.poll && comment.poll.id === pollId) {
          return {
            ...comment,
            poll: {
              ...comment.poll,
              total_votes: comment.poll.total_votes + 1,
              options: comment.poll.options.map((opt) =>
                opt.id === optionId
                  ? { ...opt, vote_count: opt.vote_count + 1 }
                  : opt
              ),
            },
          };
        }
        return comment;
      })
    );

    try {
      await apiVotePollOption(optionId);
    } catch (error) {
      console.error('Failed to vote:', error);
      removePollVote(pollId);
      await fetchPosts({});
    } finally {
      pendingVotes.current.delete(pollId);
    }
  }, [setComments, fetchPosts]);

  return { handlePollVote };
}
