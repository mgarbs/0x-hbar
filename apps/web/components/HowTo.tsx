"use client";
import { useConfig } from "@/lib/api";

export function HowTo() {
  const { data: cfg } = useConfig();
  const relay = cfg?.operatorAccountId ?? "0.0.…";
  const net = cfg?.network === "mainnet" ? "mainnet" : "testnet";
  return (
    <section className="grid md:grid-cols-3 gap-4">
      <Step
        index="01"
        title="Deposit"
        copy={
          <>
            Withdraw HBAR from any exchange to{" "}
            <a
              href={`https://hashscan.io/${net}/account/${relay}`}
              target="_blank"
              rel="noreferrer"
              className="link font-mono"
            >
              {relay}
            </a>{" "}
            with the memo set to your EVM destination —{" "}
            <span className="font-mono text-aqua">0x</span> followed by 40 hex characters.
          </>
        }
      />
      <Step
        index="02"
        title="Detect &amp; validate"
        copy={
          <>
            The detector polls the mirror node every <span className="font-mono">500ms</span>,
            decodes the memo, and checks whether your EVM destination already exists on
            the network. Malformed memos are routed 100% to treasury.
          </>
        }
      />
      <Step
        index="03"
        title="Atomic forward"
        copy={
          <>
            A single{" "}
            <span className="font-mono text-aqua">TransferTransaction</span> credits your
            destination (98%) and treasury (2% + hollow-account create, if needed) in the
            same consensus round. Either both land or neither.
          </>
        }
      />
    </section>
  );
}

function Step({
  index,
  title,
  copy,
}: {
  index: string;
  title: string;
  copy: React.ReactNode;
}) {
  return (
    <article className="panel p-6 relative overflow-hidden">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] text-brand tracking-wider">{index}</span>
        <span className="w-8 h-px bg-rule" />
      </div>
      <h3 className="mt-3 font-display italic-display text-[22px] text-ink leading-snug">
        {title}
      </h3>
      <p className="mt-3 text-sm text-ink-dim leading-relaxed">{copy}</p>
    </article>
  );
}
