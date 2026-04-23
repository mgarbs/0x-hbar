"use client";
import { useTxs } from "@/lib/api";
import { useMemo } from "react";
import { tinybarsToHbar } from "@/lib/format";

const BUCKET_MS = 15 * 60 * 1000; // 15 min
const BUCKETS = 32; // last ~8h

export function Throughput() {
  const { data } = useTxs(200);
  const { bars, maxCount, totalLastHour } = useMemo(
    () => bucketize(data?.txs ?? []),
    [data?.txs]
  );

  return (
    <div className="card-lift p-5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="eyebrow">Throughput · last 8h</div>
          <div className="mt-1 text-[11px] font-mono text-ink-mute">
            <span className="text-ink">{totalLastHour}</span> tx past 60m · 15-min buckets
          </div>
        </div>
        <Legend />
      </div>
      <div className="h-28 flex items-end gap-[2px] relative">
        {bars.map((b, i) => {
          const h = b.total > 0 ? Math.max(4, (b.total / maxCount) * 100) : 2;
          const okH = b.total > 0 ? (b.ok / b.total) * h : 0;
          const koH = h - okH;
          return (
            <div
              key={i}
              title={`${b.label} · ${b.total} tx (${b.ok} forwarded, ${b.bad} kept)`}
              className="flex-1 flex flex-col-reverse h-full min-w-[6px]"
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
        <span>8h ago</span>
        <span>now</span>
      </div>
    </div>
  );
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

function bucketize(txs: { createdAt: string; status: string; amountTinybars: string }[]) {
  const now = Date.now();
  const bars = Array.from({ length: BUCKETS }, (_, i) => {
    const start = now - (BUCKETS - i) * BUCKET_MS;
    return {
      start,
      label: new Date(start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      total: 0,
      ok: 0,
      bad: 0,
      vol: 0,
    };
  });

  for (const t of txs) {
    const ts = new Date(t.createdAt).getTime();
    const bucketIdx = BUCKETS - 1 - Math.floor((now - ts) / BUCKET_MS);
    if (bucketIdx < 0 || bucketIdx >= BUCKETS) continue;
    const b = bars[bucketIdx]!;
    b.total += 1;
    b.vol += tinybarsToHbar(t.amountTinybars);
    if (t.status === "confirmed" || t.status === "forwarded") b.ok += 1;
    else if (t.status === "kept_malformed" || t.status === "below_minimum") b.bad += 1;
  }

  const maxCount = Math.max(1, ...bars.map((b) => b.total));

  const oneHourAgo = now - 60 * 60 * 1000;
  const totalLastHour = txs.filter((t) => new Date(t.createdAt).getTime() >= oneHourAgo).length;

  return { bars, maxCount, totalLastHour };
}
