'use client';

import React from 'react';

type Props = {
  images: string[];           // 相対パス or フルURL
  baseUrl?: string;           // 例: process.env.NEXT_PUBLIC_API_URL
  onOpen?: (index: number) => void; // クリック時に呼ばれる
  className?: string;         // コンテナに追加するクラス
};

export default function TwitterLikeMediaGrid({
  images,
  baseUrl = '',
  onOpen,
  className = '',
}: Props) {
  if (!images || images.length === 0) return null;

  const total = images.length;
  const urls = images.map((u) => (u.startsWith('http') ? u : `${baseUrl}${u}`));
  const visibleCount = Math.min(total, 4);

  // 共通の見た目
  const wrapperCommon =
    'relative overflow-hidden bg-[#222] border border-purple-500/20';
  const imgCommon = 'absolute inset-0 w-full h-full object-cover';
  const boxShadow = { boxShadow: '0 2px 16px rgba(0,0,0,0.20)' };

  // 追加のインデックスで onOpen を呼ぶ
  const open = (i: number) => {
    if (onOpen) onOpen(i);
  };

  // 1枚: 16:9 でトリミング
  if (visibleCount === 1) {
    return (
      <div className={`mb-3 w-full md:max-w-[600px] lg:max-w-[720px] ${className}`}>
        <div className={`${wrapperCommon} rounded-lg`} style={{ ...boxShadow }}>
          <div className="relative w-full pt-[56.25%]"> {/* 16:9 */}
            <img
              src={urls[0]}
              alt="投稿画像 1"
              className={imgCommon}
              onClick={() => open(0)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 2枚: 横に2分割（同じ高さ）
  if (visibleCount === 2) {
    return (
      <div className={`mb-3 w-full md:max-w-[600px] lg:max-w-[720px] ${className}`}>
        <div className="grid grid-cols-2 gap-1 h-60 sm:h-72">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`${wrapperCommon} ${i === 0 ? 'rounded-l-lg' : 'rounded-r-lg'}`}
              style={{ ...boxShadow }}
              onClick={() => open(i)}
            >
              <div className="relative h-full">
                <img
                  src={urls[i]}
                  alt={`投稿画像 ${i + 1}`}
                  className={imgCommon}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3枚: 左が縦長（2段分）、右に上下2枚
  if (visibleCount === 3) {
    return (
      <div className={`mb-3 w-full md:max-w-[600px] lg:max-w-[720px] ${className}`}>
        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-60 sm:h-72">
          <div
            className={`${wrapperCommon} row-span-2 rounded-l-lg`}
            style={{ ...boxShadow }}
            onClick={() => open(0)}
          >
            <div className="relative h-full">
              <img
                src={urls[0]}
                alt="投稿画像 1"
                className={imgCommon}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>

          <div
            className={`${wrapperCommon} rounded-tr-lg`}
            style={{ ...boxShadow }}
            onClick={() => open(1)}
          >
            <div className="relative h-full">
              <img
                src={urls[1]}
                alt="投稿画像 2"
                className={imgCommon}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>

          <div
            className={`${wrapperCommon} rounded-br-lg`}
            style={{ ...boxShadow }}
            onClick={() => open(2)}
          >
            <div className="relative h-full">
              <img
                src={urls[2]}
                alt="投稿画像 3"
                className={imgCommon}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4枚以上: 2x2 グリッド。5枚目以降は "+N" オーバーレイ
  return (
    <div className={`mb-3 w-full md:max-w-[600px] lg:max-w-[720px] ${className}`}>
      <div className="grid grid-cols-2 grid-rows-2 gap-1 h-72 sm:h-80">
        {[0, 1, 2, 3].map((i) => {
          const isLast = i === 3 && total > 4;
          const rounded =
            i === 0
              ? 'rounded-tl-lg'
              : i === 1
              ? 'rounded-tr-lg'
              : i === 2
              ? 'rounded-bl-lg'
              : 'rounded-br-lg';

          return (
            <div
              key={i}
              className={`${wrapperCommon} ${rounded}`}
              style={{ ...boxShadow }}
              onClick={() => open(i)}
            >
              <div className="relative h-full">
                <img
                  src={urls[i]}
                  alt={`投稿画像 ${i + 1}`}
                  className={imgCommon}
                  style={{ cursor: 'pointer' }}
                />
                {isLast && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-2xl font-semibold">+{total - 4}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}