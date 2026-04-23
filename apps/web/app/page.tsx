"use client";
import { Header } from "@/components/Header";
import { HeroStats } from "@/components/HeroStats";
import { LiveFeed } from "@/components/LiveFeed";
import { HowTo } from "@/components/HowTo";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";
import { useConfig } from "@/lib/api";

export default function Home() {
  const { data: cfg } = useConfig();
  return (
    <>
      <Header />
      <main className="max-w-[1240px] mx-auto px-5 md:px-6 pt-8 pb-16 space-y-10">
        <div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="eyebrow">Hedera testnet</span>
            <span className="text-ink-faint">/</span>
            <span className="eyebrow">exchange withdrawal router</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tightest text-ink leading-[1.05] max-w-3xl">
            HBAR deposited with a memo becomes{" "}
            <span className="italic-display text-brand-bright">HBAR at your EVM address</span>
            <span className="text-ink-mute">.</span>
          </h1>
          <p className="mt-3 text-ink-dim max-w-2xl text-[15px]">
            Exchanges don&rsquo;t let you withdraw HBAR to a <span className="font-mono text-aqua">0x</span> address. This router does — atomically, transparently, with every transition on the ledger below.
          </p>
        </div>

        <ApiStatusBanner />

        <HeroStats />

        <LiveFeed network={cfg?.network ?? "testnet"} />

        <HowTo />

        <Footer />
      </main>
    </>
  );
}

function Footer() {
  return (
    <footer className="pt-10 mt-6 border-t border-rule-subtle flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-ink-mute">
      <div className="flex items-center gap-2">
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
