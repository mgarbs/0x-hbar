"use client";
import { useConfig } from "@/lib/api";

export function HowTo() {
  const { data: cfg } = useConfig();
  return (
    <section className="card mt-6">
      <div className="text-xs uppercase tracking-wider text-muted mb-3">
        How it works
      </div>
      <ol className="text-sm space-y-2 list-decimal list-inside">
        <li>
          Withdraw HBAR from an exchange to the relay account{" "}
          <span className="mono text-brand2">
            {cfg?.operatorAccountId ?? "0.0.…"}
          </span>{" "}
          with a memo of your EVM address (<span className="mono">0x</span> + 40 hex).
        </li>
        <li>
          Detector picks it up from the mirror node within ~1 second.
        </li>
        <li>
          Executor sends 98% to your EVM address. 2% goes to the treasury{" "}
          <span className="mono text-brand2">
            {cfg?.treasuryAccountId ?? "0.0.…"}
          </span>{" "}
          in the same atomic transfer.
        </li>
        <li>
          If the destination account doesn&apos;t exist, Hedera auto-creates a hollow account
          (cost ≈ 0.5 HBAR, factored into the minimum).
        </li>
        <li>
          Malformed or missing memos result in 100% kept in treasury.
        </li>
      </ol>
    </section>
  );
}
