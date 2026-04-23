"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTxs, useLiveFeed, type TxRow as Tx } from "@/lib/api";
import { TxRow } from "./TxRow";

type StatusFilter = "all" | "confirmed" | "review" | "malformed";

export function LiveFeed({ network }: { network: string }) {
  const { data, isLoading } = useTxs(50);
  const [rows, setRows] = useState<Tx[]>([]);
  const newIdsRef = useRef<Set<number>>(new Set());
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (data?.txs) setRows(data.txs);
  }, [data?.txs]);

  const onUpsert = useCallback((incoming: Tx) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === incoming.id);
      if (idx >= 0) {
        const clone = prev.slice();
        clone[idx] = incoming;
        return clone;
      }
      newIdsRef.current.add(incoming.id);
      setTimeout(() => newIdsRef.current.delete(incoming.id), 4000);
      return [incoming, ...prev].slice(0, 100);
    });
  }, []);

  const sseStatus = useLiveFeed(onUpsert);

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "confirmed") return r.status === "confirmed" || r.status === "forwarded";
    if (filter === "review") return r.status === "failed_retry" || r.status === "operator_review";
    if (filter === "malformed") return r.status === "kept_malformed" || r.status === "below_minimum";
    return true;
  });

  return (
    <section className="panel-lift overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
        <div className="flex items-center gap-4">
          <h2 className="font-display italic-display text-[22px] text-ink leading-none">
            Activity
          </h2>
          <span className="eyebrow">
            ledger · auto-stream
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Filters filter={filter} setFilter={setFilter} />
          <ConnectionBadge status={sseStatus} />
        </div>
      </div>

      {/* column headers */}
      <div className="row grid-cols-[20px_88px_minmax(0,1fr)_minmax(0,1fr)_160px_80px] md:grid-cols-[20px_120px_minmax(0,1.1fr)_minmax(0,1.2fr)_180px_90px] text-[10px] uppercase tracking-[0.18em] text-ink-faint font-mono border-b-0">
        <span />
        <span>status</span>
        <span>from / payer</span>
        <span>to / memo</span>
        <span className="text-right">amount</span>
        <span className="text-right">age</span>
      </div>

      <div className="hairline" />

      {/* rows */}
      <div className="min-h-[400px]">
        {isLoading && (
          <div className="p-8 text-center text-ink-mute font-mono text-sm">
            fetching ledger…
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <EmptyState />
        )}
        {filtered.map((tx) => (
          <TxRow
            key={tx.id}
            tx={tx}
            network={network}
            isNew={newIdsRef.current.has(tx.id)}
          />
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-rule text-[11px] font-mono text-ink-mute">
          <span>
            showing {filtered.length} of {rows.length}
            {filter !== "all" && (
              <>
                {" "}
                <button
                  onClick={() => setFilter("all")}
                  className="link ml-1"
                >
                  clear filter
                </button>
              </>
            )}
          </span>
          <span className="flex items-center gap-1">
            poll <span className="text-ink">3s</span> · stream <span className="text-ink">LIVE</span>
          </span>
        </div>
      )}
    </section>
  );
}

function Filters({
  filter,
  setFilter,
}: {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
}) {
  const opts: { k: StatusFilter; label: string }[] = [
    { k: "all", label: "all" },
    { k: "confirmed", label: "confirmed" },
    { k: "malformed", label: "kept" },
    { k: "review", label: "review" },
  ];
  return (
    <div className="hidden md:inline-flex rounded-full border border-rule bg-surface-raised p-0.5 text-[11px] font-mono">
      {opts.map((o) => (
        <button
          key={o.k}
          onClick={() => setFilter(o.k)}
          className={`px-3 py-1 rounded-full transition-colors uppercase tracking-wider ${
            filter === o.k
              ? "bg-brand/20 text-brand-bright"
              : "text-ink-mute hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ConnectionBadge({ status }: { status: "connecting" | "open" | "closed" }) {
  if (status === "open") {
    return (
      <span className="flex items-center gap-2 text-[11px] font-mono text-good uppercase tracking-wider">
        <span className="dot-live" />
        streaming
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="flex items-center gap-2 text-[11px] font-mono text-warn uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
        connecting
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[11px] font-mono text-bad uppercase tracking-wider">
      <span className="dot-off" />
      offline
    </span>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-lift border border-rule mb-4 font-mono text-ink-mute">
        ◌
      </div>
      <div className="font-display italic-display text-[22px] text-ink">Ledger is empty.</div>
      <div className="mt-2 max-w-md mx-auto text-sm text-ink-mute">
        Send HBAR to the relay account with a <span className="font-mono text-aqua">0x…</span> memo to see it routed in real time.
      </div>
      <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-rule font-mono text-xs text-ink-dim">
        <span className="text-ink-mute">$</span>
        <span>pnpm seed:deposit -- --amount 2 --memo 0x…</span>
      </div>
    </div>
  );
}
