'use client';

// このファイルはクライアントサイドでのみ使用されることを明示します。

type ReactionType = 'good' | 'bad';
type TargetType = 'post' | 'reply';

const getLocalStorageKey = (type: TargetType, id: number) => `reaction_${type}_${id}`;

export const saveReaction = (type: TargetType, id: number, reaction: ReactionType) => {
  // 'use client'があるので、windowの存在チェックは必須ではありませんが、
  // 安全のために残しておいても問題ありません。
  localStorage.setItem(getLocalStorageKey(type, id), reaction);
};

export const getReaction = (type: TargetType, id: number): ReactionType | null => {
  return localStorage.getItem(getLocalStorageKey(type, id)) as ReactionType | null;
};

export const removeReaction = (type: TargetType, id: number) => {
  localStorage.removeItem(getLocalStorageKey(type, id));
};