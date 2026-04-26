'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TruncatableUsernameProps {
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  // 文字色・フォントウェイト・サイズなどのテキスト用クラス
  textClassName?: string;
  // ボタン側に追加で渡したいクラス（外側flex内でのshrink制御など）
  className?: string;
}

export default function TruncatableUsername({
  children,
  isExpanded,
  onToggle,
  textClassName = '',
  className = '',
}: TruncatableUsernameProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    // 展開中は計測不要（折り返してオーバーフローしない）
    if (isExpanded) return;
    const el = textRef.current;
    if (!el) return;
    const check = () => setIsClamped(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, isExpanded]);

  // 省略されているか展開中のときだけ操作可能
  const isInteractive = isClamped || isExpanded;

  return (
    <button
      type="button"
      onClick={isInteractive ? onToggle : undefined}
      disabled={!isInteractive}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? 'ユーザー名を折りたたむ' : 'ユーザー名を全文表示'}
      className={`inline-flex items-center min-w-0 shrink text-left disabled:cursor-default ${className}`}
    >
      <span
        ref={textRef}
        className={`${textClassName} ${
          isExpanded ? 'whitespace-normal break-words' : 'truncate min-w-0'
        }`}
      >
        {children}
      </span>
      {isInteractive && (
        <span className="shrink-0 opacity-70 -ml-0.5" aria-hidden="true">
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </span>
      )}
    </button>
  );
}
