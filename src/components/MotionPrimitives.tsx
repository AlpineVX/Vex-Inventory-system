import React, { useEffect, useRef, useState } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
}

/**
 * Interactive surface card with cursor-reactive radial light sheen.
 * Updates CSS custom properties directly on the DOM node to avoid React re-renders.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(197, 35, 41, 0.12)',
  onMouseMove,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      el.style.setProperty('--spotlight-color', spotlightColor);
    }
    onMouseMove?.(e);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card relative overflow-hidden ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

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
