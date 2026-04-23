"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StatusPill } from "@/components/StatusPill";
import { Timeline } from "@/components/Timeline";
import { useTx, useConfig } from "@/lib/api";
import {
  consensusTsToDate,
  fmtHbar,
  hashscanUrl,
} from "@/lib/format";

function TxPageInner() {
  const params = useSearchParams();
  const idParam = params.get("id");
  const id = idParam ? Number(idParam) : NaN;
  const { data, isLoading, error } = useTx(Number.isFinite(id) ? id : null);
  const { data: cfg } = useConfig();
  const network = cfg?.network ?? "testnet";

  if (!Number.isFinite(id)) {
    return (
      <main className="max-w-4xl mx-auto px-5 py-10">
        <Link href="/" className="link text-sm">← back</Link>
        <div className="mt-6 card">Missing <span className="mono">?id=…</span>.</div>
      </main>
    );
  }

  if (isLoading) {
    return <main className="max-w-4xl mx-auto px-5 py-10 text-muted">loading…</main>;
  }

  if (error || !data) {
    return (
      <main className="max-w-4xl mx-auto px-5 py-10">
        <Link href="/" className="link text-sm">← back</Link>
        <div className="mt-6 card">Transaction not found.</div>
      </main>
    );
  }

  const { tx, events } = data;
  const seenAt = consensusTsToDate(tx.consensusTimestamp);

  return (
    <main className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      <div>
        <Link href="/" className="link text-sm">← back to feed</Link>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">
              Inbound #{tx.id}
            </div>
            <div className="text-2xl font-semibold mono">
              {fmtHbar(tx.amountTinybars)} inbound
            </div>
            <div className="text-xs text-muted mt-1">
              detected {seenAt.toLocaleString()}
            </div>
          </div>
          <StatusPill status={tx.status} />
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Inbound tx">
            <a className="link mono break-all" target="_blank" rel="noreferrer"
              href={hashscanUrl(network, "tx", tx.transactionId)}>
              {tx.transactionId}
            </a>
          </Field>
          <Field label="Payer account">
            <span className="mono">
              {tx.payerAccountId ? (
                <a className="link" target="_blank" rel="noreferrer"
                  href={hashscanUrl(network, "account", tx.payerAccountId)}>
                  {tx.payerAccountId}
                </a>
              ) : "—"}
            </span>
          </Field>
          <Field label="Memo (raw)">
            <span className="mono break-all">{tx.memoRaw ?? "—"}</span>
          </Field>
          <Field label="Memo (parsed)">
            {tx.memoParsed ? (
              <span className="mono break-all text-brand2">{tx.memoParsed}</span>
            ) : (
              <span className="text-warning">none / malformed</span>
            )}
          </Field>
          <Field label="User receives">
            <span className="mono">
              {tx.userAmountTinybars ? fmtHbar(tx.userAmountTinybars) : "—"}
            </span>
          </Field>
          <Field label="Treasury earns (2% + hollow)">
            <span className="mono">
              {tx.feeTinybars ? fmtHbar(tx.feeTinybars) : "—"}
            </span>
          </Field>
          <Field label="Destination hollow before?">
            {tx.destinationHollowBefore == null
              ? "—"
              : tx.destinationHollowBefore ? "yes — auto-created" : "no — existed"}
          </Field>
          <Field label="Forward tx">
            {tx.forwardTransactionId ? (
              <a className="link mono break-all" target="_blank" rel="noreferrer"
                href={hashscanUrl(network, "tx", tx.forwardTransactionId)}>
                {tx.forwardTransactionId}
              </a>
            ) : "—"}
          </Field>
          {tx.lastError && (
            <Field label="Last error" full>
              <pre className="text-xs text-danger mono bg-panel2 border border-border rounded p-2 overflow-auto scroll-thin">
                {tx.lastError}
              </pre>
            </Field>
          )}
        </dl>
      </div>

      <div className="card">
        <div className="text-xs uppercase tracking-wider text-muted mb-4">
          Timeline
        </div>
        <Timeline events={events} />
      </div>
    </main>
  );
}

export default function TxPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="max-w-4xl mx-auto px-5 py-10 text-muted">loading…</main>}>
        <TxPageInner />
      </Suspense>
    </>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
