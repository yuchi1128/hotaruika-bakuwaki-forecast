'use client';

import { RefObject, useEffect, useRef, useState } from 'react';

type Props = {
  // 横スクロールするコンテナ（overflow-x-auto の要素）
  containerRef: RefObject<HTMLElement>;
  // 常時表示（true 固定でOK、必要なら親で制御）
  alwaysShow?: boolean;
  // 左右のインセット
  trackInset?: number;
  // サムの最小幅
  minThumbWidth?: number;
};

export default function CustomScrollbar({
  containerRef,
  alwaysShow = true,
  trackInset = 12,
  minThumbWidth = 36,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [thumb, setThumb] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const update = () => {
    const el = containerRef.current;
    if (!el) return;

    const view = el.clientWidth;
    const full = el.scrollWidth;
    const hasOverflow = full > view + 1;
    setVisible(hasOverflow);

    if (!hasOverflow) {
      setThumb({ left: 0, width: 0 });
      return;
    }

    const trackWidth = Math.max(0, view - trackInset * 2);
    const ratio = view / full;
    const width = Math.max(minThumbWidth, Math.floor(trackWidth * ratio));

    const maxScroll = full - view;
    const maxLeft = Math.max(0, trackWidth - width);
    const left = maxScroll > 0 ? Math.round((el.scrollLeft / maxScroll) * maxLeft) : 0;

    setThumb({ left, width });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    // 初期計算
    update();

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    roRef.current = new ResizeObserver(update);
    roRef.current.observe(el);
    if (el.firstElementChild) roRef.current.observe(el.firstElementChild as Element);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      roRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current]);

  if (!alwaysShow || !visible) return null;

  return (
    <div
      className="custom-sb-track"
      aria-hidden
      style={{
        left: trackInset,
        right: trackInset,
      }}
    >
      <div
        className="custom-sb-thumb"
        style={{
          width: `${thumb.width}px`,
          transform: `translateX(${thumb.left}px)`,
        }}
      />
    </div>
  );
}
