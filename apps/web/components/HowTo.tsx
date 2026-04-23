"use client";
import { useConfig } from "@/lib/api";

export function HowTo() {
  const { data: cfg } = useConfig();
  const relay = cfg?.operatorAccountId ?? "0.0.…";
  const net = cfg?.network === "mainnet" ? "mainnet" : "testnet";
  return (
    <section className="card-lift p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-ink text-[15px] font-semibold tracking-tight">How it works</h3>
        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-faint">
          3 steps · atomic · no custody
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Step
          idx="01"
          title="Deposit"
          body={
            <>
              Withdraw HBAR from any exchange to the relay account{" "}
              <a
                href={`https://hashscan.io/${net}/account/${relay}`}
                target="_blank"
                rel="noreferrer"
                className="link font-mono"
              >
                {relay}
              </a>{" "}
              with the memo set to your EVM destination (<span className="font-mono text-aqua">0x</span>{" "}
              + 40 hex).
            </>
          }
        />
        <Step
          idx="02"
          title="Detect"
          body={
            <>
              Detector polls the mirror node every{" "}
              <span className="font-mono">500ms</span>, decodes the memo, and checks
              whether your EVM destination already exists. Malformed memos are routed
              100% to treasury.
            </>
          }
        />
        <Step
          idx="03"
          title="Forward"
          body={
            <>
              A single <span className="font-mono text-aqua">TransferTransaction</span>{" "}
              credits your destination (98%) and treasury (2% + hollow-create if needed)
              in the same consensus round. Either both land or neither.
            </>
          }
        />
      </div>
    </section>
  );
}

function Step({ idx, title, body }: { idx: string; title: string; body: React.ReactNode }) {
  return (
    <div className="bg-surface-raised rounded-lg border border-rule p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-brand-bright tracking-[0.24em]">{idx}</span>
        <span className="w-6 h-px bg-rule-strong" />
      </div>
      <h4 className="text-ink font-semibold text-[14px] mb-1">{title}</h4>
      <p className="text-[12.5px] text-ink-dim leading-relaxed">{body}</p>
    </div>
  );
}
