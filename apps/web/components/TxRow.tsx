"use client";
import Link from "next/link";
import { StatusPill, StatusDot } from "./StatusPill";
import {
  fmtHbar,
  fmtRelative,
  hashscanUrl,
  shortEvm,
  shortTxId,
} from "@/lib/format";
import type { TxRow as Tx } from "@/lib/api";

export function TxRow({ tx, network, isNew = false }: { tx: Tx; network: string; isNew?: boolean }) {
  const isTerminalBad = tx.status === "kept_malformed" || tx.status === "below_minimum";
  const to = tx.memoParsed;
  const successful = tx.status === "confirmed" || tx.status === "forwarded";

  return (
    <Link
      href={`/tx?id=${tx.id}`}
      className={`row ${isNew ? "row-new" : ""} grid-cols-[20px_88px_minmax(0,1fr)_minmax(0,1fr)_160px_80px] md:grid-cols-[20px_120px_minmax(0,1.1fr)_minmax(0,1.2fr)_180px_90px]`}
    >
      <StatusDot status={tx.status} />

      <div className="flex flex-col gap-1">
        <StatusPill status={tx.status} compact />
      </div>

      {/* flow: from → to */}
      <div className="flex items-center gap-2 min-w-0 font-mono text-[12px]">
        <span className="text-ink-mute">FROM</span>
        <span className="text-ink truncate">{tx.payerAccountId ?? "—"}</span>
      </div>

      <div className="flex items-center gap-2 min-w-0 font-mono text-[12px]">
        <Arrow
          tone={
            successful ? "aqua" : isTerminalBad ? "warn" : tx.status === "failed_retry" || tx.status === "operator_review" ? "bad" : "brand"
          }
        />
        {to ? (
          <span className="truncate text-aqua-bright">{shortEvm(to)}</span>
        ) : tx.memoRaw ? (
          <span className="truncate text-warn italic">malformed · {tx.memoRaw.slice(0, 24)}</span>
        ) : (
          <span className="truncate text-warn italic">missing memo</span>
        )}
      </div>

      <div className="text-right font-mono tabular">
        <div className="text-ink text-[14px] leading-tight">{fmtHbar(tx.amountTinybars)}</div>
        {tx.userAmountTinybars ? (
          <div className="text-[10px] text-ink-mute leading-tight mt-0.5">
            out {fmtHbar(tx.userAmountTinybars)}
          </div>
        ) : isTerminalBad ? (
          <div className="text-[10px] text-warn/70 leading-tight mt-0.5">kept 100%</div>
        ) : (
          <div className="text-[10px] text-ink-faint leading-tight mt-0.5">…</div>
        )}
      </div>

      <div className="text-right font-mono text-[11px] text-ink-mute tabular">
        {fmtRelative(tx.createdAt)}
      </div>
    </Link>
  );
}

function Arrow({ tone }: { tone: "brand" | "aqua" | "good" | "warn" | "bad" }) {
  const color = {
    brand: "text-brand-bright",
    aqua: "text-aqua",
    good: "text-good",
    warn: "text-warn",
    bad: "text-bad",
  }[tone];
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" className={color}>
      <line x1="0" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M12 1 L18 5 L12 9" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
