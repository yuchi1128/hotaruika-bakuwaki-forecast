'use client';

import { useMemo } from 'react';
import { Check, BarChart2 } from 'lucide-react';
import type { Poll } from '@/lib/types';

interface PollDisplayProps {
  poll: Poll;
  myVotedOptionId: number | null;
  onVote: (pollId: number, optionId: number) => void;
  isExpired: boolean;
}

function formatRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '投票終了';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `残り${days}日${hours}時間`;
  if (hours > 0) return `残り${hours}時間${minutes}分`;
  return `残り${minutes}分`;
}

export default function PollDisplay({ poll, myVotedOptionId, onVote, isExpired }: PollDisplayProps) {
  const showResults = myVotedOptionId !== null || isExpired;

  const maxVoteCount = useMemo(
    () => Math.max(...poll.options.map((o) => o.vote_count), 1),
    [poll.options]
  );

  return (
    <div className="my-3 p-3 bg-slate-700/30 rounded-lg border border-purple-500/15 md:max-w-[480px]">
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = poll.total_votes > 0
            ? Math.round((option.vote_count / poll.total_votes) * 100)
            : 0;
          const isVoted = myVotedOptionId === option.id;
          const isLeading = option.vote_count === maxVoteCount && poll.total_votes > 0;

          if (showResults) {
            return (
              <div key={option.id} className="relative">
                <div className="relative overflow-hidden rounded-md bg-slate-900/50 h-7">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-md transition-all duration-500 ease-out ${
                      isLeading ? 'bg-purple-500/50' : 'bg-purple-400/30'
                    }`}
                    style={{ width: percentage > 0 ? `${percentage}%` : '0%' }}
                  />
                  <div className="relative flex items-center justify-between px-3 h-full">
                    <span className={`text-[13px] truncate ${isVoted ? 'font-bold text-purple-200' : 'text-gray-200'}`}>
                      {isVoted && <Check className="w-3.5 h-3.5 inline mr-1" />}
                      {option.option_text}
                    </span>
                    <span className={`text-[13px] ml-2 shrink-0 tabular-nums ${isLeading ? 'font-bold text-purple-200' : 'text-gray-400'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              onClick={() => onVote(poll.id, option.id)}
              className="w-full text-left px-3 h-7 rounded-md border border-purple-400/40 bg-slate-900/50 text-[13px] text-gray-200 hover:bg-purple-600/25 hover:border-purple-400/60 transition-colors cursor-pointer"
            >
              {option.option_text}
            </button>
          );
        })}
      </div>

      {/* フッター */}
      <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-400">
        <BarChart2 className="w-3.5 h-3.5" />
        <span>{poll.total_votes}票</span>
        <span>·</span>
        <span>{isExpired ? '投票終了' : formatRemaining(poll.expires_at)}</span>
      </div>
    </div>
  );
}
