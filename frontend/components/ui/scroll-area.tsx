'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

type RootEl = React.ElementRef<typeof ScrollAreaPrimitive.Root>;
type RootProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>;
type ViewportEl = React.ElementRef<typeof ScrollAreaPrimitive.Viewport>;

interface ScrollAreaProps extends RootProps {
  // Viewport DOM への参照とクラス
  viewportRef?: React.Ref<ViewportEl>;
  viewportClassName?: string;
  // スクロールバーの表示制御
  showVertical?: boolean;
  showHorizontal?: boolean;
}

const ScrollArea = React.forwardRef<RootEl, ScrollAreaProps>(
  (
    {
      className,
      children,
      viewportRef,
      viewportClassName,
      showVertical = true,
      showHorizontal = true,
      ...props
    },
    ref
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={cn('h-full w-full rounded-[inherit]', viewportClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      {showVertical && <ScrollBar orientation="vertical" />}
      {showHorizontal && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    // data-state="hidden" のときは完全に非表示にする
    className={cn(
      'flex touch-none select-none transition-opacity duration-200 data-[state=hidden]:opacity-0 data-[state=hidden]:pointer-events-none',
      'bg-white/10 backdrop-blur-sm rounded-full',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-white/60" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };