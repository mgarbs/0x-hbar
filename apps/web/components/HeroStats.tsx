"use client";
import { useStats, useConfig, useTxs } from "@/lib/api";
import { fmtHbar, tinybarsToHbar } from "@/lib/format";
import { useMemo } from "react";

export function HeroStats() {
  const { data: stats } = useStats();
  const { data: cfg } = useConfig();
  const { data: feed } = useTxs(50);

  const spark = useMemo(() => buildSparkline(feed?.txs ?? []), [feed?.txs]);

  const successPct = stats?.successRate ?? 0;
  const totalVol = stats ? fmtHbar(stats.totalVolumeTinybars, 4) : "—";
  const totalFees = stats ? fmtHbar(stats.totalFeesTinybars, 4) : "—";
  const userForwarded =
    stats && cfg
      ? computeUserForwarded(stats, feed?.txs ?? [])
      : null;

  return (
    <section className="relative">
      <div className="absolute inset-0 bg-hero-glow rounded-[32px] blur-2xl opacity-70 pointer-events-none" />

      <div className="relative panel-lift panel-glow rounded-[28px] overflow-hidden">
        <div className="grid lg:grid-cols-[1.35fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-rule">
          <div className="p-8 lg:p-12 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="eyebrow">Total volume routed</div>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-wide text-ink-mute uppercase">
                <span className="dot-live" />
                live · testnet
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="font-display italic-display text-[96px] leading-[0.9] tracking-tightest text-ink tabular">
                {totalVol === "—" ? (
                  <span className="text-ink-faint">…</span>
                ) : (
                  <>
                    {totalVol.replace(" ℏ", "")}
                    <span className="not-italic font-display text-brand-bright text-[64px] ml-2">ℏ</span>
                  </>
                )}
              </div>
            </div>

            {/* sparkline */}
            <div className="mt-8">
              <Sparkline data={spark} />
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-6 text-sm">
              <Stat
                label="Inbound deposits"
                value={stats ? stats.totalInbound.toString() : "—"}
              />
              <Stat
                label="Forwarded to EVM"
                value={stats ? stats.totalForwarded.toString() : "—"}
                trend={successPct}
              />
              <Stat
                label="To treasury"
                value={totalFees}
                suffix=""
                mono={false}
                accent
              />
            </dl>
          </div>

          <div className="p-8 lg:p-10 flex flex-col">
            <div className="eyebrow mb-6">Flow</div>

            <Flow
              successPct={successPct}
              totalIn={stats?.totalInbound ?? 0}
              malformed={stats?.totalMalformed ?? 0}
              failed={stats?.totalFailed ?? 0}
              userAmount={userForwarded}
            />

            <div className="mt-auto pt-8 text-[12px] text-ink-mute leading-relaxed">
              Memo-routed forwards split{" "}
              <span className="text-ink">
                {cfg ? `${(10000 - cfg.operatorFeeBps) / 100}% / ${cfg.operatorFeeBps / 100}%`
                   : "98 / 2"}
              </span>
              . Hollow account auto-creation is billed to the forward, never to the user.
              Invalid memos are retained 100% by treasury.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  suffix,
  mono = true,
  accent = false,
  trend,
}: {
  label: string;
  value: string;
  suffix?: string;
  mono?: boolean;
  accent?: boolean;
  trend?: number;
}) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-2 ${mono ? "font-mono" : "font-display italic-display"} text-2xl ${
          accent ? "text-aqua-bright" : "text-ink"
        } tabular`}
      >
        {value}
        {suffix && <span className="text-ink-mute ml-1 text-base">{suffix}</span>}
      </div>
      {trend !== undefined && (
        <div className="mt-1 text-[11px] font-mono text-ink-mute">
          {trend}% success
        </div>
      )}
    </div>
  );
}

function Flow({
  successPct,
  totalIn,
  malformed,
  failed,
  userAmount,
}: {
  successPct: number;
  totalIn: number;
  malformed: number;
  failed: number;
  userAmount: number | null;
}) {
  return (
    <div className="relative font-mono text-[12px] space-y-0">
      <FlowRow label="exchange withdrawal" tone="ink" step="01" />
      <FlowArrow />
      <FlowRow
        label="mirror-node detect"
        tone="brand"
        step="02"
        detail={`${totalIn} seen`}
      />
      <FlowArrow />
      <FlowRow
        label="memo validate"
        tone="brand"
        step="03"
        detail={`${malformed} rejected`}
      />
      <FlowArrow />
      <FlowRow
        label="atomic 98 / 2 forward"
        tone="aqua"
        step="04"
        detail={failed > 0 ? `${failed} retrying` : "ok"}
      />
      <FlowArrow />
      <FlowRow
        label="EVM address"
        tone="good"
        step="05"
        detail={userAmount != null ? `${userAmount.toFixed(4)} ℏ out` : "—"}
      />

      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-surface-lift overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 bg-brand-gradient"
            style={{ width: `${successPct}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]" />
        </div>
        <span className="text-[11px] tabular text-ink">{successPct}%</span>
      </div>
    </div>
  );
}

function FlowRow({
  step,
  label,
  detail,
  tone,
}: {
  step: string;
  label: string;
  detail?: string;
  tone: "ink" | "brand" | "aqua" | "good";
}) {
  const dot =
    tone === "brand"
      ? "bg-brand shadow-[0_0_0_4px_rgba(130,89,239,0.18)]"
      : tone === "aqua"
        ? "bg-aqua shadow-[0_0_0_4px_rgba(34,211,238,0.18)]"
        : tone === "good"
          ? "bg-good shadow-[0_0_0_4px_rgba(16,217,163,0.18)]"
          : "bg-ink-mute";
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-ink-faint w-6">{step}</span>
      <span className="text-ink">{label}</span>
      {detail && (
        <span className="ml-auto text-ink-mute tabular">{detail}</span>
      )}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="ml-[3px] w-px h-4 bg-gradient-to-b from-rule via-rule-brand to-rule" />
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-14" />;
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="h-16 relative">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8259EF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8259EF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="spark-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8259EF" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,100 ${points} 100,100`}
          fill="url(#spark-fill)"
          stroke="none"
        />
        <polyline
          points={points}
          fill="none"
          stroke="url(#spark-stroke)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-ink-faint font-mono pt-1 border-t border-rule-subtle">
        <span>oldest</span>
        <span>latest</span>
      </div>
    </div>
  );
}

function buildSparkline(txs: { amountTinybars: string }[]): number[] {
  if (!txs?.length) return [];
  const ordered = [...txs].reverse();
  return ordered.slice(-40).map((t) => tinybarsToHbar(t.amountTinybars));
}

function computeUserForwarded(
  _stats: { totalForwarded: number },
  txs: { status: string; userAmountTinybars: string | null }[]
): number {
  let sum = 0n;
  for (const t of txs) {
    if ((t.status === "confirmed" || t.status === "forwarded") && t.userAmountTinybars) {
      sum += BigInt(t.userAmountTinybars);
    }
  }
  return Number(sum) / 1e8;
}
