import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { playClick } from '../services/soundFx';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
  tilt?: boolean;
}

/**
 * Interactive surface card with cursor-reactive radial light sheen and optional subtle 3D tilt.
 * Updates CSS custom properties directly on the DOM node to avoid React re-renders.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(197, 35, 41, 0.12)',
  tilt = false,
  onMouseMove,
  onMouseLeave,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--spotlight-color', spotlightColor);

      const canTilt =
        tilt &&
        rect.width > 0 &&
        rect.height > 0 &&
        typeof window !== 'undefined' &&
        window.matchMedia?.('(pointer: fine)').matches &&
        !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (canTilt) {
        const nx = (x / rect.width - 0.5) * 2; // -1..1
        const ny = (y / rect.height - 0.5) * 2; // -1..1
        const maxDeg = 2.2;
        el.style.setProperty('--rx', `${(-ny * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(nx * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--lift', '-3px');
      }
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (el && tilt) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--lift', '0px');
    }
    onMouseLeave?.(e);
  };

  return (
    <div
      ref={cardRef}
      data-tilt={tilt ? 'true' : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card relative overflow-hidden ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

interface SlidingIndicatorState {
  left: number;
  top: number;
  width: number;
  height: number;
  ready: boolean;
}

/**
 * Reusable spring-physics sliding indicator tracker for tabs, segmented filters, and team selectors.
 * Uses offsetLeft/offsetTop inside a positioned container + ResizeObserver to prevent layout drift.
 */
export function useSlidingIndicator<T extends string>(
  activeKey: T,
  deps: React.DependencyList = []
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [indicator, setIndicator] = useState<SlidingIndicatorState>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const measure = () => {
    const activeEl = itemRefs.current[activeKey];
    const container = containerRef.current;
    if (!activeEl || !container) return;
    if (activeEl.offsetWidth === 0 && activeEl.offsetHeight === 0) return;

    const left = activeEl.offsetLeft;
    const top = activeEl.offsetTop;
    const width = activeEl.offsetWidth;
    const height = activeEl.offsetHeight;

    setIndicator((prev) => {
      if (
        prev.ready &&
        prev.left === left &&
        prev.top === top &&
        prev.width === width &&
        prev.height === height
      ) {
        return prev;
      }
      return { left, top, width, height, ready: true };
    });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, ...deps]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, ...deps]);

  const setItemRef = (key: T) => (el: HTMLElement | null) => {
    itemRefs.current[key] = el;
  };

  return { containerRef, setItemRef, indicator };
}

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  durationMs?: number;
}

/**
 * Smoothly interpolates numeric values using ease-out cubic rAF.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  suffix = '',
  durationMs = 520,
}) => {
  const [display, setDisplay] = useState<number>(value);
  const prevRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const startVal = prevRef.current;
    const endVal = value;
    const startTime = performance.now();
    let frameId = 0;

    const step = (nowTs: number) => {
      const elapsed = nowTs - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startVal + (endVal - startVal) * eased);
      setDisplay(nextVal);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        prevRef.current = endVal;
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, durationMs]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
};

interface AnimatedRingGaugeProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  trackColor?: string;
}

/**
 * Crisp animated SVG radial progress gauge.
 */
export const AnimatedRingGauge: React.FC<AnimatedRingGaugeProps> = ({
  percent,
  size = 44,
  strokeWidth = 4,
  strokeColor = '#c52329',
  trackColor = '#27272d',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = mounted
    ? circumference - (clamped / 100) * circumference
    : circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90 shrink-0"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="ring-progress"
      />
    </svg>
  );
};

interface SwipeableActionCardProps {
  children: React.ReactNode;
  actionLabel: string;
  actionTone?: 'red' | 'light';
  onSwipeAction: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Touch-friendly horizontal swipe-left container revealing a quick action button on mobile.
 * Direction-locked so vertical scrolling is never hijacked.
 */
export const SwipeableActionCard: React.FC<SwipeableActionCardProps> = ({
  children,
  actionLabel,
  actionTone = 'light',
  onSwipeAction,
  disabled = false,
  className = '',
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; baseOffset: number; locked: 'h' | 'v' | null }>({
    x: 0,
    y: 0,
    baseOffset: 0,
    locked: null,
  });

  const MAX_REVEAL = -104;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || e.touches.length !== 1) return;
    startRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      baseOffset: offsetX,
      locked: null,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || !isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startRef.current.x;
    const dy = e.touches[0].clientY - startRef.current.y;

    if (!startRef.current.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      startRef.current.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (startRef.current.locked === 'v') {
      return;
    }

    const next = Math.max(MAX_REVEAL - 14, Math.min(0, startRef.current.baseOffset + dx));
    setOffsetX(next);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);
    if (offsetX < -46) {
      setOffsetX(MAX_REVEAL);
    } else {
      setOffsetX(0);
    }
  };

  const isRevealed = isDragging || offsetX !== 0;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Revealed Right Swipe Action Tray (only mounted when swiped/dragging) */}
      {isRevealed && (
        <div
          aria-hidden={offsetX === 0}
          className="absolute inset-y-0 right-0 w-[104px] flex items-center justify-center p-1.5"
        >
          <button
            type="button"
            onClick={() => {
              setOffsetX(0);
              onSwipeAction();
            }}
            className={`w-full h-full rounded-xl font-semibold text-xs flex flex-col items-center justify-center gap-1 px-2 text-center shadow-sm transition-transform active:scale-95 ${
              actionTone === 'red'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-zinc-100 hover:bg-white text-zinc-950'
            }`}
          >
            <span>{actionLabel}</span>
          </button>
        </div>
      )}

      {/* Sliding Foreground Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={
          isRevealed
            ? {
                transform: `translate3d(${offsetX}px, 0, 0)`,
                transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : undefined
        }
        className={`relative z-10 ${isDragging ? 'will-change-transform' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};

interface BackToTopButtonProps {
  isMobile?: boolean;
}

/**
 * Compact floating button that smoothly scrolls long inventory/log views back to top.
 */
export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ isMobile = false }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      setVisible(window.scrollY > 360);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const scrollToTop = () => {
    playClick();
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
      className={`fixed z-30 no-print flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#111114]/95 hover:bg-[#1a1a1f] text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-red-500/50 shadow-xl backdrop-blur-md text-xs font-medium animate-pop btn-tactile ${
        isMobile ? 'bottom-20 right-3.5 min-h-[40px]' : 'bottom-5 right-5'
      }`}
    >
      <ArrowUp className="w-3.5 h-3.5 text-red-400" />
      <span className="hidden sm:inline font-mono text-[11px]">Top</span>
    </button>
  );
};
