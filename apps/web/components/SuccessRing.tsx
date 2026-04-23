"use client";
import { useStats } from "@/lib/api";

export function SuccessRing() {
  const { data } = useStats();
  const total = data?.totalInbound ?? 0;
  const forwarded = data?.totalForwarded ?? 0;
  const malformed = data?.totalMalformed ?? 0;
  const failed = data?.totalFailed ?? 0;
  const other = Math.max(0, total - forwarded - malformed - failed);

  const safeTotal = Math.max(1, total);
  const pctForwarded = (forwarded / safeTotal) * 100;
  const pctMalformed = (malformed / safeTotal) * 100;
  const pctFailed = (failed / safeTotal) * 100;
  const pctOther = (other / safeTotal) * 100;

  const radius = 62;
  const circ = 2 * Math.PI * radius;

  // Segments — stroke-dasharray trick, compose four arcs.
  const segments = [
    { pct: pctForwarded, color: "#22D3EE" },
    { pct: pctMalformed, color: "#F59E0B" },
    { pct: pctFailed, color: "#F43F5E" },
    { pct: pctOther, color: "rgba(255,255,255,0.08)" },
  ];

  let offset = 0;

  return (
    <div className="card-lift p-5 flex items-center gap-6">
      <div className="relative w-[170px] h-[170px] shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {segments.map((s, i) => {
            if (s.pct <= 0) return null;
            const len = (s.pct / 100) * circ;
            const dash = `${len} ${circ - len}`;
            const currOffset = offset;
            offset -= len;
            return (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={dash}
                strokeDashoffset={currOffset}
                style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.2,0.7,0.2,1)" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[36px] font-semibold text-ink leading-none num tabular">
            {Math.round(pctForwarded)}
            <span className="text-aqua-bright">%</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-faint mt-1">
            success
          </div>
        </div>
      </div>

      <div className="flex-1 text-[12px] space-y-1.5 font-mono">
        <LegendRow label="Forwarded" color="#22D3EE" n={forwarded} total={total} />
        <LegendRow label="Kept · memo" color="#F59E0B" n={malformed} total={total} />
        <LegendRow label="Review" color="#F43F5E" n={failed} total={total} />
        <LegendRow label="In-flight" color="rgba(255,255,255,0.25)" n={other} total={total} />
      </div>
    </div>
  );
}

function LegendRow({
  label,
  color,
  n,
  total,
}: {
  label: string;
  color: string;
  n: number;
  total: number;
}) {
  const pct = total > 0 ? (n / total) * 100 : 0;
  return (
    <div className="grid grid-cols-[14px_1fr_auto_auto] items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-sm"
        style={{ background: color }}
      />
      <span className="text-ink-dim text-[11px] uppercase tracking-wider">{label}</span>
      <span className="text-ink tabular">{n}</span>
      <span className="text-ink-faint tabular w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}
