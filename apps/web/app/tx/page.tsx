"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StatusPill } from "@/components/StatusPill";
import { Timeline } from "@/components/Timeline";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";
import { useTx, useConfig } from "@/lib/api";
import {
  consensusTsToDate,
  fmtHbar,
  hashscanUrl,
  shortEvm,
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
      <main className="max-w-[1240px] mx-auto px-6 py-10">
        <Back />
        <div className="mt-6 panel p-8">Missing <span className="font-mono text-aqua">?id=…</span>.</div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="max-w-[1240px] mx-auto px-6 py-10 text-ink-mute font-mono text-sm">
        fetching transaction…
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-[1240px] mx-auto px-6 py-10">
        <Back />
        <div className="mt-6 panel p-8">Transaction not found.</div>
      </main>
    );
  }

  const { tx, events } = data;
  const seenAt = consensusTsToDate(tx.consensusTimestamp);
  const isTerminalKept = tx.status === "kept_malformed" || tx.status === "below_minimum";

  return (
    <main className="max-w-[1240px] mx-auto px-6 py-8 space-y-8">
      <Back />

      <ApiStatusBanner />

      {/* Hero for this tx */}
      <section className="panel-lift panel-glow p-8 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow opacity-60 pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="eyebrow">Inbound</span>
              <span className="font-mono text-ink-faint text-xs">#{tx.id}</span>
              <StatusPill status={tx.status} />
            </div>
            <div className="font-display italic-display text-[72px] leading-[0.9] tracking-tightest text-ink tabular">
              {fmtHbar(tx.amountTinybars, 4).replace(" ℏ", "")}
              <span className="not-italic font-display text-brand-bright text-[48px] ml-2">ℏ</span>
            </div>
            <div className="mt-3 text-[12px] text-ink-mute font-mono">
              consensus {tx.consensusTimestamp} · seen {seenAt.toLocaleString()}
            </div>
          </div>

          {/* split view: amount → user / treasury */}
          <div className="w-full md:w-auto min-w-[340px] space-y-3">
            <SplitRow
              label="user amount"
              amount={tx.userAmountTinybars}
              tone={tx.userAmountTinybars && BigInt(tx.userAmountTinybars) > 0n ? "aqua" : "faint"}
              note={tx.memoParsed ? shortEvm(tx.memoParsed) : undefined}
            />
            <SplitRow
              label="treasury"
              amount={tx.feeTinybars}
              tone={tx.feeTinybars && BigInt(tx.feeTinybars) > 0n ? "brand" : "faint"}
              note={
                isTerminalKept
                  ? "100% kept"
                  : tx.destinationHollowBefore
                    ? "2% fee + hollow"
                    : "2% fee"
              }
            />
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* Left: key/value details */}
        <section className="panel-lift p-6 md:p-8 space-y-8">
          <div>
            <div className="eyebrow mb-3">Inbound transaction</div>
            <Field label="transaction id">
              <HashLink href={hashscanUrl(network, "tx", tx.transactionId)}>
                {tx.transactionId}
              </HashLink>
            </Field>
            <Field label="payer account">
              {tx.payerAccountId ? (
                <HashLink href={hashscanUrl(network, "account", tx.payerAccountId)}>
                  {tx.payerAccountId}
                </HashLink>
              ) : (
                "—"
              )}
            </Field>
            <Field label="amount received">
              <span className="font-mono">{fmtHbar(tx.amountTinybars)}</span>
            </Field>
          </div>

          <div>
            <div className="eyebrow mb-3">Memo</div>
            <Field label="raw">
              <span className="font-mono break-all text-ink">
                {tx.memoRaw ?? <span className="text-ink-faint">(empty)</span>}
              </span>
            </Field>
            <Field label="parsed">
              {tx.memoParsed ? (
                <span className="font-mono break-all text-aqua-bright">{tx.memoParsed}</span>
              ) : (
                <span className="text-warn">malformed · 100% retained by treasury</span>
              )}
            </Field>
          </div>

          <div>
            <div className="eyebrow mb-3">Forward</div>
            <Field label="destination hollow?">
              {tx.destinationHollowBefore == null
                ? "—"
                : tx.destinationHollowBefore ? (
                  <span className="text-warn font-mono">yes — auto-created</span>
                ) : (
                  <span className="text-good font-mono">no — existed</span>
                )}
            </Field>
            <Field label="forward tx">
              {tx.forwardTransactionId ? (
                <HashLink href={hashscanUrl(network, "tx", tx.forwardTransactionId)}>
                  {tx.forwardTransactionId}
                </HashLink>
              ) : (
                "—"
              )}
            </Field>
            <Field label="attempts">
              <span className="font-mono">{tx.attempts}</span>
            </Field>
          </div>

          {tx.lastError && (
            <div>
              <div className="eyebrow mb-3 text-bad">last error</div>
              <pre className="text-xs font-mono text-bad bg-bad/5 border border-bad/25 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-all">
                {tx.lastError}
              </pre>
            </div>
          )}
        </section>

        {/* Right: timeline */}
        <section className="panel-lift p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="eyebrow">Timeline</div>
              <div className="font-display italic-display text-[22px] text-ink leading-none mt-1">
                {events.length} event{events.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <Timeline events={events} />
        </section>
      </div>
    </main>
  );
}

function SplitRow({
  label,
  amount,
  tone,
  note,
}: {
  label: string;
  amount: string | null;
  tone: "aqua" | "brand" | "faint";
  note?: string;
}) {
  const toneClass =
    tone === "aqua"
      ? "text-aqua-bright"
      : tone === "brand"
        ? "text-brand-bright"
        : "text-ink-faint";
  return (
    <div className="flex items-baseline gap-3 pl-3 border-l-2 border-rule-subtle">
      <div className="flex-1 min-w-0">
        <div className="eyebrow">{label}</div>
        <div className="font-mono tabular text-xl text-ink mt-0.5">
          {amount ? fmtHbar(amount) : "—"}
        </div>
        {note && (
          <div className={`text-[11px] font-mono mt-0.5 truncate ${toneClass}`}>{note}</div>
        )}
      </div>
    </div>
  );
}

function Back() {
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-ink-dim hover:text-ink transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M8 2L3 7L8 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>back to ledger</span>
      </Link>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2.5 border-b border-rule-subtle last:border-b-0">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-mute self-baseline">
        {label}
      </dt>
      <dd className="text-[13px] self-baseline">{children}</dd>
    </div>
  );
}

function HashLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="link font-mono break-all">
      {children}
      <svg width="10" height="10" viewBox="0 0 10 10" className="inline-block ml-1 opacity-50">
        <path d="M3 1h6v6M9 1L1 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </a>
  );
}

export default function TxPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="max-w-[1240px] mx-auto px-6 py-10 text-ink-mute">loading…</main>}>
        <TxPageInner />
      </Suspense>
    </>
  );
}
