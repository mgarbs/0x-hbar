"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTxs, useLiveFeed, type TxRow as Tx } from "@/lib/api";
import { TxRow } from "./TxRow";

type Filter = "all" | "live" | "confirmed" | "kept" | "review";

export function ActivityTable() {
  const { data, isLoading } = useTxs(100);
  const [rows, setRows] = useState<Tx[]>([]);
  const newIds = useRef<Set<number>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");

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
      newIds.current.add(incoming.id);
      setTimeout(() => newIds.current.delete(incoming.id), 5000);
      return [incoming, ...prev].slice(0, 200);
    });
  }, []);

  const sse = useLiveFeed(onUpsert);

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "live")
      return r.status === "detected" || r.status === "validated" || r.status === "forwarding";
    if (filter === "confirmed") return r.status === "confirmed" || r.status === "forwarded";
    if (filter === "kept") return r.status === "kept_malformed" || r.status === "below_minimum";
    if (filter === "review") return r.status === "failed_retry" || r.status === "operator_review";
    return true;
  });

  return (
    <section className="card-lift overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-rule">
        <div className="flex items-center gap-3">
          <h2 className="text-ink text-[15px] font-semibold tracking-tight">Activity</h2>
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-faint">
            ledger · live
          </span>
        </div>
        <div className="flex items-center gap-3">
          <FilterPills filter={filter} setFilter={setFilter} />
          <ConnectionBadge status={sse} />
        </div>
      </div>

      {/* column header */}
      <div className="arow grid-cols-[14px_56px_112px_minmax(0,1.1fr)_minmax(0,1.2fr)_120px_70px] text-[10px] uppercase tracking-[0.18em] text-ink-faint font-mono border-b border-rule">
        <span />
        <span>#</span>
        <span>status</span>
        <span>from</span>
        <span>to</span>
        <span className="text-right">amount</span>
        <span className="text-right">age</span>
      </div>

      <div className="min-h-[380px] max-h-[620px] overflow-y-auto">
        {isLoading && (
          <div className="p-10 text-center font-mono text-ink-mute text-sm">fetching ledger…</div>
        )}
        {!isLoading && filtered.length === 0 && <EmptyState />}
        {filtered.map((tx) => (
          <TxRow key={tx.id} tx={tx} isNew={newIds.current.has(tx.id)} />
        ))}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-rule text-[11px] font-mono text-ink-mute">
        <span>
          {filtered.length} row{filtered.length === 1 ? "" : "s"}
          {filter !== "all" && rows.length !== filtered.length && (
            <>
              <span className="text-ink-faint"> of {rows.length}</span>
              <button onClick={() => setFilter("all")} className="ml-2 link">clear</button>
            </>
          )}
        </span>
        <span className="flex items-center gap-4">
          <Chip k="poll" v="3s" />
          <Chip k="sse" v={sse === "open" ? "LIVE" : sse.toUpperCase()} tone={sse === "open" ? "good" : "warn"} />
        </span>
      </div>
    </section>
  );
}

function FilterPills({
  filter,
  setFilter,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
}) {
  const opts: { k: Filter; label: string }[] = [
    { k: "all", label: "all" },
    { k: "live", label: "in-flight" },
    { k: "confirmed", label: "confirmed" },
    { k: "kept", label: "kept" },
    { k: "review", label: "review" },
  ];
  return (
    <div className="hidden md:inline-flex rounded-md border border-rule-strong bg-surface-raised overflow-hidden text-[10px] font-mono uppercase tracking-[0.18em]">
      {opts.map((o, i) => (
        <button
          key={o.k}
          onClick={() => setFilter(o.k)}
          className={`px-2.5 py-1.5 border-l first:border-l-0 border-rule transition-colors ${
            filter === o.k
              ? "bg-brand/20 text-brand-bright"
              : "text-ink-mute hover:text-ink hover:bg-surface-elevated"
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
      <span className="flex items-center gap-2 text-[10px] font-mono text-good uppercase tracking-[0.22em]">
        <span className="ring-dot" /> streaming
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="flex items-center gap-2 text-[10px] font-mono text-warn uppercase tracking-[0.22em]">
        <span className="ring-dot-warn" /> connecting
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[10px] font-mono text-bad uppercase tracking-[0.22em]">
      <span className="ring-dot-off" /> offline
    </span>
  );
}

function Chip({ k, v, tone = "neutral" }: { k: string; v: string; tone?: "neutral" | "good" | "warn" }) {
  const toneClass = {
    neutral: "text-ink",
    good: "text-good",
    warn: "text-warn",
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-ink-faint">{k}</span>
      <span className={toneClass}>{v}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="inline-flex w-10 h-10 rounded-full bg-surface-lift border border-rule items-center justify-center mb-3 text-ink-mute font-mono">
        ◌
      </div>
      <div className="text-[15px] text-ink">Ledger is empty</div>
      <div className="mt-1 text-sm text-ink-mute">
        Deposit HBAR to the relay with a <span className="font-mono text-aqua">0x…</span> memo to see it stream here.
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-rule-strong bg-surface-raised px-3 py-2 font-mono text-[11px] text-ink-dim">
        <span className="text-ink-faint">$</span>
        <span>pnpm seed:deposit -- --amount 2 --memo 0x…</span>
      </div>
    </div>
  );
}
