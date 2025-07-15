import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ReactionType = 'good' | 'bad';
type TargetType = 'post' | 'reply';

const getLocalStorageKey = (type: TargetType, id: number) => `reaction_${type}_${id}`;

export const saveReaction = (type: TargetType, id: number, reaction: ReactionType) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLocalStorageKey(type, id), reaction);
  }
};

export const getReaction = (type: TargetType, id: number): ReactionType | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(getLocalStorageKey(type, id)) as ReactionType | null;
  }
  return null;
};

export const removeReaction = (type: TargetType, id: number) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getLocalStorageKey(type, id));
  }
};
