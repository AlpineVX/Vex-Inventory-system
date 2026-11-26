import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

      if (tilt && rect.width > 0 && rect.height > 0) {
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
    setIndicator({
      left: activeEl.offsetLeft,
      top: activeEl.offsetTop,
      width: activeEl.offsetWidth,
      height: activeEl.offsetHeight,
      ready: true,
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
