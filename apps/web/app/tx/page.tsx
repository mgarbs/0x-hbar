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
      <main className="max-w-[1200px] mx-auto px-5 py-10 space-y-5">
        <Back />
        <div className="card p-6">Missing <span className="font-mono text-aqua">?id=…</span>.</div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="max-w-[1200px] mx-auto px-5 py-10 text-ink-mute font-mono text-sm">
        fetching transaction…
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-[1200px] mx-auto px-5 py-10 space-y-5">
        <Back />
        <div className="card p-6">Transaction not found.</div>
      </main>
    );
  }

  const { tx, events } = data;
  const seenAt = consensusTsToDate(tx.consensusTimestamp);
  const isKept = tx.status === "kept_malformed" || tx.status === "below_minimum";

  const grossHbar = fmtHbar(tx.amountTinybars).replace(" ℏ", "");
  const userHbar = tx.userAmountTinybars ? fmtHbar(tx.userAmountTinybars).replace(" ℏ", "") : null;
  const feeHbar = tx.feeTinybars ? fmtHbar(tx.feeTinybars).replace(" ℏ", "") : null;

  return (
    <main className="max-w-[1200px] mx-auto px-5 py-7 space-y-6">
      <Back />
      <ApiStatusBanner />

      {/* Hero header for this tx */}
      <section className="card-lift card-glow p-7 relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="eyebrow">inbound</span>
              <span className="font-mono text-ink-faint text-xs">#{tx.id}</span>
              <StatusPill status={tx.status} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[64px] font-semibold leading-none text-ink num tabular">
                {grossHbar}
              </span>
              <span className="text-[28px] font-semibold text-brand-bright ml-0.5">ℏ</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-ink-mute">
              consensus{" "}
              <a
                href={hashscanUrl(network, "tx", tx.transactionId)}
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                {tx.consensusTimestamp}
              </a>{" "}
              · seen {seenAt.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[360px]">
            <SplitTile
              label="user receives"
              value={userHbar}
              tone="aqua"
              hint={tx.memoParsed ? "to " + shortAddr(tx.memoParsed) : undefined}
            />
            <SplitTile
              label="treasury"
              value={feeHbar}
              tone="brand"
              hint={
                isKept
                  ? "100% kept"
                  : tx.destinationHollowBefore
                    ? "2% + hollow-create"
                    : "2% fee"
              }
            />
          </div>
        </div>

        {/* Sweep animation */}
        {(tx.status === "forwarding" || tx.status === "validated") && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-aqua to-transparent w-1/3 animate-[streak_1.8s_linear_infinite]" />
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <section className="card-lift p-6 space-y-7">
          <FieldGroup label="Inbound transaction">
            <Field label="tx id">
              <HashLink href={hashscanUrl(network, "tx", tx.transactionId)}>
                {tx.transactionId}
              </HashLink>
            </Field>
            <Field label="payer">
              {tx.payerAccountId ? (
                <HashLink href={hashscanUrl(network, "account", tx.payerAccountId)}>
                  {tx.payerAccountId}
                </HashLink>
              ) : (
                "—"
              )}
            </Field>
            <Field label="amount">
              <span className="font-mono">{fmtHbar(tx.amountTinybars)}</span>
            </Field>
          </FieldGroup>

          <FieldGroup label="Memo">
            <Field label="raw">
              <span className="font-mono break-all text-ink">
                {tx.memoRaw ?? <span className="text-ink-faint">(empty)</span>}
              </span>
            </Field>
            <Field label="parsed">
              {tx.memoParsed ? (
                <span className="font-mono break-all text-aqua-bright">{tx.memoParsed}</span>
              ) : (
                <span className="text-warn">malformed — 100% routed to treasury</span>
              )}
            </Field>
          </FieldGroup>

          <FieldGroup label="Forward">
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
          </FieldGroup>

          {tx.lastError && (
            <FieldGroup label="Last error" tone="bad">
              <pre className="font-mono text-[11.5px] text-bad-bright bg-bad/5 border border-bad/25 rounded-md p-3 whitespace-pre-wrap break-all">
                {tx.lastError}
              </pre>
            </FieldGroup>
          )}
        </section>

        <section className="card-lift p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="eyebrow">Timeline</div>
              <div className="mt-1 text-ink text-[14px] font-semibold">
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

function shortAddr(s: string) {
  if (s.length < 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function SplitTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | null;
  tone: "brand" | "aqua";
  hint?: string;
}) {
  const toneText = tone === "aqua" ? "text-aqua-bright" : "text-brand-bright";
  return (
    <div className="bg-surface-raised border border-rule rounded-lg p-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-[22px] font-semibold text-ink num tabular leading-none">
        {value ?? "—"}
        {value && <span className={`text-[14px] ml-1 ${toneText}`}>ℏ</span>}
      </div>
      {hint && (
        <div className={`mt-1.5 text-[10.5px] font-mono truncate ${toneText}`}>{hint}</div>
      )}
    </div>
  );
}

function Back() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-[12px] text-ink-dim hover:text-ink transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path d="M8 2L3 7L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>back to console</span>
    </Link>
  );
}

function FieldGroup({
  label,
  tone = "neutral",
  children,
}: {
  label: string;
  tone?: "neutral" | "bad";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={`eyebrow mb-2 ${tone === "bad" ? "text-bad" : ""}`}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 py-2 border-b border-rule-subtle last:border-b-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute self-center">
        {label}
      </dt>
      <dd className="text-[13px] self-center">{children}</dd>
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
      <Suspense fallback={<main className="max-w-[1200px] mx-auto px-5 py-10 text-ink-mute">loading…</main>}>
        <TxPageInner />
      </Suspense>
    </>
  );
}
