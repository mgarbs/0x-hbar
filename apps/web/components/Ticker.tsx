"use client";
import { useTxs, type TxRow } from "@/lib/api";
import { fmtHbar, shortEvm } from "@/lib/format";

export function Ticker() {
  const { data } = useTxs(30);
  const items = (data?.txs ?? []).slice(0, 20);

  if (items.length === 0) {
    return (
      <div className="border-y border-rule bg-surface/60 backdrop-blur">
        <div className="max-w-[1360px] mx-auto px-5 h-9 flex items-center gap-3 text-[11px] font-mono text-ink-mute">
          <span className="ring-dot-warn" />
          <span>awaiting first inbound · tail mirrornode@500ms</span>
        </div>
      </div>
    );
  }

  // Duplicate the list for seamless marquee
  const loop = [...items, ...items];

  return (
    <div className="relative border-y border-rule bg-surface/60 backdrop-blur overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface-deep to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-deep to-transparent z-10" />
      <div className="max-w-[1360px] mx-auto overflow-hidden">
        <div className="flex items-center animate-marquee h-9 whitespace-nowrap">
          {loop.map((t, i) => (
            <TickerItem key={`${t.id}-${i}`} tx={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickerItem({ tx }: { tx: TxRow }) {
  const isSuccess = tx.status === "confirmed" || tx.status === "forwarded";
  const isBad = tx.status === "kept_malformed" || tx.status === "below_minimum";
  const tone = isSuccess ? "text-good" : isBad ? "text-warn" : "text-aqua";
  const label = isSuccess
    ? "forwarded"
    : isBad
      ? "kept"
      : tx.status === "failed_retry" || tx.status === "operator_review"
        ? "failed"
        : "routing";

  return (
    <span className="inline-flex items-center gap-2 px-4 text-[11px] font-mono text-ink-mute">
      <span className={`${tone} uppercase tracking-wider`}>{label}</span>
      <span className="text-ink-faint">·</span>
      <span className="text-ink">{fmtHbar(tx.amountTinybars)}</span>
      {tx.memoParsed && (
        <>
          <span className="text-ink-faint">→</span>
          <span className="text-aqua">{shortEvm(tx.memoParsed)}</span>
        </>
      )}
      <span className="text-ink-faint">·</span>
      <span className="text-ink-faint">#{tx.id}</span>
    </span>
  );
}
