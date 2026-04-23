"use client";
import { useMemo } from "react";
import { Header } from "@/components/Header";
import { Ticker } from "@/components/Ticker";
import { KpiTile } from "@/components/KpiTile";
import { Throughput } from "@/components/Throughput";
import { SuccessRing } from "@/components/SuccessRing";
import { ActivityTable } from "@/components/ActivityTable";
import { HowTo } from "@/components/HowTo";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";
import { useStats, useTxs } from "@/lib/api";
import { tinybarsToHbar } from "@/lib/format";

export default function Home() {
  const { data: stats } = useStats();
  const { data: feed } = useTxs(100);

  const { volumeSeries, countSeries, feeSeries, userSeries } = useMemo(
    () => buildSeries(feed?.txs ?? []),
    [feed?.txs]
  );

  const userTotal = useMemo(() => {
    let sum = 0n;
    for (const t of feed?.txs ?? []) {
      if ((t.status === "confirmed" || t.status === "forwarded") && t.userAmountTinybars) {
        sum += BigInt(t.userAmountTinybars);
      }
    }
    return Number(sum) / 1e8;
  }, [feed?.txs]);

  return (
    <>
      <Header />
      <Ticker />
      <main className="max-w-[1360px] mx-auto px-5 pt-7 pb-16 space-y-6">
        <TopStrip />
        <ApiStatusBanner />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="Total volume"
            value={stats ? tinybarsToHbar(stats.totalVolumeTinybars) : 0}
            format="hbar"
            suffix="ℏ"
            trend={volumeSeries}
            accent="brand"
            sub="cumulative gross inbound"
            streak
          />
          <KpiTile
            label="Forwarded to EVM"
            value={userTotal}
            format="hbar"
            suffix="ℏ"
            trend={userSeries}
            accent="aqua"
            sub={`${stats?.totalForwarded ?? 0} confirmed transfers`}
          />
          <KpiTile
            label="Treasury earned"
            value={stats ? tinybarsToHbar(stats.totalFeesTinybars) : 0}
            format="hbar"
            suffix="ℏ"
            trend={feeSeries}
            accent="good"
            sub="2% fee · hollow-create · malformed"
          />
          <KpiTile
            label="Inbound deposits"
            value={stats?.totalInbound ?? 0}
            format="int"
            trend={countSeries}
            accent="warn"
            sub={`${stats?.totalMalformed ?? 0} malformed · ${stats?.totalFailed ?? 0} review`}
          />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.7fr_1fr]">
          <Throughput />
          <SuccessRing />
        </div>

        <ActivityTable />

        <HowTo />

        <Footer />
      </main>
    </>
  );
}

function TopStrip() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="eyebrow">Hedera testnet</span>
          <span className="w-px h-3 bg-rule-strong" />
          <span className="eyebrow">exchange-withdrawal router</span>
          <span className="w-px h-3 bg-rule-strong" />
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-good">
            <span className="ring-dot" /> console live
          </span>
        </div>
        <h1 className="text-ink text-[28px] md:text-[34px] font-semibold tracking-tight leading-none">
          HBAR + memo{" "}
          <span className="text-ink-mute">→</span>{" "}
          <span className="text-aqua-bright">your EVM address</span>
          <span className="text-ink-mute">.</span>
        </h1>
        <p className="mt-2 text-[13px] text-ink-dim max-w-2xl">
          Exchanges don&rsquo;t let you withdraw HBAR to a <span className="font-mono text-aqua">0x</span> address.
          This router forwards atomically — 98% to you, 2% to treasury, every transition on the ledger below.
        </p>
      </div>
      <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-ink-mute">
        <span className="kbd">⇧R</span>
        <span>refresh</span>
        <span className="text-ink-faint px-1">·</span>
        <span className="kbd">/</span>
        <span>focus search (soon)</span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="pt-8 mt-4 border-t border-rule-subtle flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-ink-mute">
      <div className="flex items-center gap-3">
        <span className="text-ink-faint">source</span>
        <a href="https://github.com/mgarbs/0x-hbar" target="_blank" rel="noreferrer" className="link">
          github.com/mgarbs/0x-hbar
        </a>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://hashscan.io/testnet" target="_blank" rel="noreferrer" className="link">
          hashscan
        </a>
        <a href="https://docs.hedera.com" target="_blank" rel="noreferrer" className="link">
          hedera docs
        </a>
        <span className="text-ink-faint">built on hashgraph consensus</span>
      </div>
    </footer>
  );
}

function buildSeries(txs: { createdAt: string; amountTinybars: string; feeTinybars: string | null; userAmountTinybars: string | null; status: string }[]) {
  const ordered = [...txs].reverse();
  let cumVol = 0;
  let cumCount = 0;
  let cumFee = 0;
  let cumUser = 0;
  const volumeSeries: number[] = [];
  const countSeries: number[] = [];
  const feeSeries: number[] = [];
  const userSeries: number[] = [];
  for (const t of ordered) {
    cumCount += 1;
    cumVol += tinybarsToHbar(t.amountTinybars);
    if (t.feeTinybars) cumFee += tinybarsToHbar(t.feeTinybars);
    if ((t.status === "confirmed" || t.status === "forwarded") && t.userAmountTinybars) {
      cumUser += tinybarsToHbar(t.userAmountTinybars);
    }
    volumeSeries.push(cumVol);
    countSeries.push(cumCount);
    feeSeries.push(cumFee);
    userSeries.push(cumUser);
  }
  return { volumeSeries, countSeries, feeSeries, userSeries };
}
