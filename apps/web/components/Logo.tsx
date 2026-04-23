export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="l-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B494F7" />
          <stop offset="50%" stopColor="#8259EF" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="39" rx="9" fill="#0A0B10" stroke="url(#l-g)" strokeOpacity="0.85" />
      {/* ℏ-inspired mark: two bars + crossbar + right arrow pipe */}
      <path d="M10 9 V31 M10 19 H20 M20 9 V31" stroke="url(#l-g)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 20 H31 M28 17 L31 20 L28 23" stroke="#22D3EE" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
