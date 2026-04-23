"use client";

export function Sparkline({
  data,
  height = 40,
  strokeColor = "#22D3EE",
  fillFrom = "rgba(34,211,238,0.28)",
  fillTo = "rgba(34,211,238,0)",
  className = "",
}: {
  data: number[];
  height?: number;
  strokeColor?: string;
  fillFrom?: string;
  fillTo?: string;
  className?: string;
}) {
  if (data.length < 2) {
    return (
      <div
        className={className}
        style={{ height }}
      />
    );
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return { x, y };
  });

  const path = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    const prev = points[i - 1]!;
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx.toFixed(2)} ${prev.y.toFixed(2)}, ${cx.toFixed(2)} ${p.y.toFixed(2)}, ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }, "");

  const areaPath = `${path} L 100 100 L 0 100 Z`;
  const id = "sparkgrad-" + Math.random().toString(36).slice(2, 8);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* last-point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1]!.x}
          cy={points[points.length - 1]!.y}
          r="1.5"
          fill={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
