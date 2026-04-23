"use client";
import Link from "next/link";
import { StatusPill, StatusDot } from "./StatusPill";
import {
  fmtHbar,
  fmtRelative,
  shortEvm,
} from "@/lib/format";
import type { TxRow as Tx } from "@/lib/api";

export function TxRow({ tx, isNew = false }: { tx: Tx; isNew?: boolean }) {
  const to = tx.memoParsed;
  const isKept = tx.status === "kept_malformed" || tx.status === "below_minimum";
  const isFailed = tx.status === "failed_retry" || tx.status === "operator_review";
  const isActive = tx.status === "validated" || tx.status === "forwarding" || tx.status === "detected";

  return (
    <Link
      href={`/tx?id=${tx.id}`}
      className={`arow ${isNew ? "arow-new" : ""} grid-cols-[14px_56px_112px_minmax(0,1.1fr)_minmax(0,1.2fr)_120px_70px]`}
    >
      <StatusDot status={tx.status} />
      <span className="font-mono text-ink-faint tabular text-[11px]">#{tx.id}</span>
      <StatusPill status={tx.status} />

      <div className="min-w-0 font-mono flex items-center gap-1.5">
        <span className="text-ink-faint text-[10px] uppercase">from</span>
        <span className="text-ink truncate">{tx.payerAccountId ?? "—"}</span>
      </div>

      <div className="min-w-0 font-mono flex items-center gap-1.5">
        <Arrow active={isActive} tone={isKept ? "warn" : isFailed ? "bad" : "aqua"} />
        {to ? (
          <span className="text-aqua-bright truncate">{shortEvm(to)}</span>
        ) : tx.memoRaw ? (
          <span className="text-warn truncate">
            <span className="text-ink-faint">memo</span> {tx.memoRaw.slice(0, 22)}
          </span>
        ) : (
          <span className="text-warn">∅ no memo</span>
        )}
      </div>

      <div className="text-right font-mono tabular">
        <div className="text-ink text-[13px] leading-tight">
          {fmtHbar(tx.amountTinybars)}
        </div>
        {tx.userAmountTinybars && BigInt(tx.userAmountTinybars) > 0n ? (
          <div className="text-[10px] text-ink-mute leading-tight">
            out {fmtHbar(tx.userAmountTinybars, 4)}
          </div>
        ) : isKept ? (
          <div className="text-[10px] text-warn/80 leading-tight">kept 100%</div>
        ) : (
          <div className="text-[10px] text-ink-faint leading-tight">…</div>
        )}
      </div>

      <div className="text-right font-mono text-[11px] text-ink-mute tabular">
        {fmtRelative(tx.createdAt)}
      </div>
    </Link>
  );
}

function Arrow({ active, tone }: { active?: boolean; tone: "aqua" | "warn" | "bad" }) {
  const color = {
    aqua: "text-aqua",
    warn: "text-warn",
    bad: "text-bad",
  }[tone];
  return (
    <span className={`relative inline-block ${color}`}>
      <svg width="24" height="10" viewBox="0 0 24 10">
        <line x1="0" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray={active ? "2 2" : "0"} />
        <path d="M15 1 L23 5 L15 9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {active && (
        <span className="absolute inset-y-1/2 -translate-y-1/2 left-0 w-3 h-0.5 bg-current opacity-80"
          style={{ animation: "streak 1.4s linear infinite" }}
        />
      )}
    </span>
  );
}
