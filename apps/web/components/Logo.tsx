export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="l-brand" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BF0" />
          <stop offset="55%" stopColor="#8259EF" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill="#0B0B12" stroke="url(#l-brand)" strokeWidth="1.5" />
      {/* Stylized ℏ with a directional pipe through the middle */}
      <path
        d="M13 12 L13 36 M13 22 L29 22 M29 12 L29 36"
        stroke="url(#l-brand)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M33 24 L42 24 M38 20 L42 24 L38 28"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
