"use client";
import { useCallback, useEffect, useState } from "react";
import { useTxs, useLiveFeed, type TxRow as Tx } from "@/lib/api";
import { TxRow } from "./TxRow";

export function LiveFeed({ network }: { network: string }) {
  const { data, isLoading } = useTxs(50);
  const [rows, setRows] = useState<Tx[]>([]);

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
      return [incoming, ...prev].slice(0, 100);
    });
  }, []);

  const sseStatus = useLiveFeed(onUpsert);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm uppercase tracking-wider text-muted">Live feed</h2>
          <span className={`dot ${sseStatus === "open" ? "live" : "offline"}`} />
          <span className="text-xs text-muted">
            {sseStatus === "open" ? "streaming" : sseStatus}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 max-h-[70vh] overflow-auto scroll-thin pr-1">
        {isLoading && <div className="text-muted text-sm">loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="card text-center text-muted">
            No transactions yet. Send HBAR with a <span className="mono">0x…</span>{" "}
            memo to the relay account to see it here.
          </div>
        )}
        {rows.map((tx) => (
          <TxRow key={tx.id} tx={tx} network={network} />
        ))}
      </div>
    </section>
  );
}
