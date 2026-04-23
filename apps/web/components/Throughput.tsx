"use client";
import { useMemo, useState } from "react";
import { useTxs } from "@/lib/api";
import { tinybarsToHbar } from "@/lib/format";

type RangeKey = "1h" | "8h" | "24h" | "7d";

interface Range {
  key: RangeKey;
  label: string;
  bucketMs: number;
  buckets: number;
  bucketLabel: string;
  windowLabel: string;
  tickFmt: (d: Date) => string;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const RANGES: Range[] = [
  {
    key: "1h",
    label: "1H",
    bucketMs: 5 * MINUTE,
    buckets: 12,
    bucketLabel: "5-min",
    windowLabel: "1h",
    tickFmt: (d) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  },
  {
    key: "8h",
    label: "8H",
    bucketMs: 15 * MINUTE,
    buckets: 32,
    bucketLabel: "15-min",
    windowLabel: "8h",
    tickFmt: (d) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  },
  {
    key: "24h",
    label: "24H",
    bucketMs: 1 * HOUR,
    buckets: 24,
    bucketLabel: "1-hour",
    windowLabel: "24h",
    tickFmt: (d) => d.toLocaleTimeString(undefined, { hour: "2-digit" }) + ":00",
  },
  {
    key: "7d",
    label: "7D",
    bucketMs: 6 * HOUR,
    buckets: 28,
    bucketLabel: "6-hour",
    windowLabel: "7d",
    tickFmt: (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  },
];

export function Throughput() {
  const { data } = useTxs(200);
  const [rangeKey, setRangeKey] = useState<RangeKey>("8h");
  const range = RANGES.find((r) => r.key === rangeKey)!;

  const { bars, maxCount, totalInWindow, volInWindow } = useMemo(
    () => bucketize(data?.txs ?? [], range),
    [data?.txs, range]
  );

  return (
    <div className="card-lift p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="eyebrow">Throughput · last {range.windowLabel}</div>
          <div className="mt-1 text-[11px] font-mono text-ink-mute">
            <span className="text-ink">{totalInWindow}</span> tx ·{" "}
            <span className="text-ink">{volInWindow.toFixed(2)}ℏ</span> · {range.bucketLabel} buckets
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Legend />
          <RangePicker rangeKey={rangeKey} setRangeKey={setRangeKey} />
        </div>
      </div>

      <div className="h-28 flex items-end gap-[2px] relative">
        {bars.map((b, i) => {
          const h = b.total > 0 ? Math.max(4, (b.total / maxCount) * 100) : 2;
          const okH = b.total > 0 ? (b.ok / b.total) * h : 0;
          const koH = h - okH;
          return (
            <div
              key={i}
              title={`${b.label} · ${b.total} tx · ${b.vol.toFixed(2)}ℏ (${b.ok} forwarded, ${b.bad} kept)`}
              className="flex-1 flex flex-col-reverse h-full min-w-[4px]"
            >
              <div
                className="bg-aqua/70 rounded-sm"
                style={{ height: `${okH}%`, transition: "height 0.5s cubic-bezier(0.2,0.7,0.2,1)" }}
              />
              <div
                className="bg-warn/60 rounded-sm mb-[1px]"
                style={{ height: `${koH}%`, transition: "height 0.5s cubic-bezier(0.2,0.7,0.2,1)" }}
              />
              {b.total === 0 && (
                <div className="bg-rule-strong rounded-sm" style={{ height: "2px" }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-mono text-ink-faint">
        <span>{range.windowLabel} ago</span>
        <span>{midTick(range, bars)}</span>
        <span>now</span>
      </div>
    </div>
  );
}

function midTick(range: Range, bars: { start: number }[]): string {
  const mid = bars[Math.floor(bars.length / 2)];
  if (!mid) return "";
  return range.tickFmt(new Date(mid.start));
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[10px] font-mono text-ink-mute uppercase tracking-wider">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm bg-aqua/70" /> forwarded
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm bg-warn/60" /> kept
      </span>
    </div>
  );
}

function RangePicker({
  rangeKey,
  setRangeKey,
}: {
  rangeKey: RangeKey;
  setRangeKey: (k: RangeKey) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-rule-strong bg-surface-raised overflow-hidden text-[10px] font-mono uppercase tracking-[0.18em]">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => setRangeKey(r.key)}
          className={`px-2.5 py-1 border-l first:border-l-0 border-rule transition-colors ${
            rangeKey === r.key
              ? "bg-brand/20 text-brand-bright"
              : "text-ink-mute hover:text-ink hover:bg-surface-elevated"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function bucketize(
  txs: { createdAt: string; status: string; amountTinybars: string }[],
  range: Range
) {
  const now = Date.now();
  const bars = Array.from({ length: range.buckets }, (_, i) => {
    const start = now - (range.buckets - i) * range.bucketMs;
    return {
      start,
      label: new Date(start).toLocaleString(),
      total: 0,
      ok: 0,
      bad: 0,
      vol: 0,
    };
  });

  let totalInWindow = 0;
  let volInWindow = 0;

  for (const t of txs) {
    const ts = new Date(t.createdAt).getTime();
    const bucketIdx = range.buckets - 1 - Math.floor((now - ts) / range.bucketMs);
    if (bucketIdx < 0 || bucketIdx >= range.buckets) continue;
    const b = bars[bucketIdx]!;
    const hbar = tinybarsToHbar(t.amountTinybars);
    b.total += 1;
    b.vol += hbar;
    totalInWindow += 1;
    volInWindow += hbar;
    if (t.status === "confirmed" || t.status === "forwarded") b.ok += 1;
    else if (t.status === "kept_malformed" || t.status === "below_minimum") b.bad += 1;
  }

  const maxCount = Math.max(1, ...bars.map((b) => b.total));
  return { bars, maxCount, totalInWindow, volInWindow };
}
