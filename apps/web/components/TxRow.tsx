"use client";
import Link from "next/link";
import { StatusPill } from "./StatusPill";
import {
  fmtHbar,
  fmtRelative,
  hashscanUrl,
  shortEvm,
  shortTxId,
} from "@/lib/format";
import type { TxRow as Tx } from "@/lib/api";

export function TxRow({ tx, network }: { tx: Tx; network: string }) {
  return (
    <Link
      href={`/tx?id=${tx.id}`}
      className="card card-hover flex items-center gap-4 text-sm"
    >
      <div className="w-24 shrink-0">
        <StatusPill status={tx.status} />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-0.5 text-muted mono text-xs">
        <span>payer</span>
        <span className="truncate text-text">{tx.payerAccountId ?? "—"}</span>
        <span>memo</span>
        <span className="truncate text-text">
          {tx.memoParsed ? shortEvm(tx.memoParsed) : tx.memoRaw ?? "—"}
        </span>
        <span>inbound</span>
        <span className="truncate text-text">
          <a
            className="link"
            href={hashscanUrl(network, "tx", tx.transactionId)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {shortTxId(tx.transactionId)}
          </a>
        </span>
      </div>
      <div className="w-40 shrink-0 text-right mono">
        <div className="text-text">{fmtHbar(tx.amountTinybars)}</div>
        {tx.userAmountTinybars && (
          <div className="text-xs text-muted">
            user {fmtHbar(tx.userAmountTinybars)}
          </div>
        )}
      </div>
      <div className="w-20 shrink-0 text-right text-xs text-muted">
        {fmtRelative(tx.createdAt)}
      </div>
    </Link>
  );
}
