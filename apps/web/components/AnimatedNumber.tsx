"use client";
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  duration = 900,
  decimals = 4,
  className = "",
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`num tabular ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function AnimatedInt({
  value,
  duration = 700,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    fromRef.current = display;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(fromRef.current + (value - fromRef.current) * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={`num tabular ${className}`}>{display.toLocaleString()}</span>;
}
