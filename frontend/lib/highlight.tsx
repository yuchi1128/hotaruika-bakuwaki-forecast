import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const splitSearchKeywords = (query: string | undefined): string[] => {
  if (!query) return [];
  return query.trim().split(/\s+/).filter(Boolean);
};

const HIGHLIGHT_CLASS =
  'bg-yellow-300/30 text-yellow-100 rounded-sm px-0.5';

const highlightInString = (text: string, keywords: string[], baseKey: string): React.ReactNode => {
  if (!keywords.length || !text) return text;
  const escaped = keywords.map(escapeRegex);
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(re);
  const lowered = keywords.map((k) => k.toLowerCase());
  return parts.map((part, i) => {
    if (part && lowered.includes(part.toLowerCase())) {
      return (
        <mark key={`${baseKey}-${i}`} className={HIGHLIGHT_CLASS}>
          {part}
        </mark>
      );
    }
    return <React.Fragment key={`${baseKey}-${i}`}>{part}</React.Fragment>;
  });
};

// 本文用: URLリンク化と検索キーワードのハイライトを同時に適用する
export const renderContent = (text: string, keywords: string[]): React.ReactNode => {
  if (!text) return null;
  const segments = text.split(URL_REGEX);
  return segments.map((seg, i) => {
    if (seg.match(URL_REGEX)) {
      return (
        <a
          key={`url-${i}`}
          href={seg}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {seg}
        </a>
      );
    }
    return (
      <React.Fragment key={`seg-${i}`}>{highlightInString(seg, keywords, `seg-${i}`)}</React.Fragment>
    );
  });
};

// 単純なテキストハイライト（ユーザー名等）
export const renderHighlighted = (text: string, keywords: string[]): React.ReactNode => {
  return highlightInString(text, keywords, 'h');
};

// 単一クエリの部分一致ハイライト（ユーザーIDなど）
export const renderSubstringHighlighted = (
  text: string,
  query: string | undefined,
): React.ReactNode => {
  const q = query?.trim();
  if (!q || !text) return text;
  return highlightInString(text, [q], 'sh');
};
