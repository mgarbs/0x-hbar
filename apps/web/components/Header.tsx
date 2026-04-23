"use client";
import Link from "next/link";
import { useConfig } from "@/lib/api";
import { Logo } from "./Logo";

export function Header() {
  const { data: cfg } = useConfig();
  return (
    <header className="sticky top-0 z-30 border-b border-rule backdrop-blur-xl bg-surface-deep/70">
      <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/" className="group flex items-center gap-3">
          <Logo size={32} />
          <div className="leading-none">
            <div className="flex items-baseline gap-0.5">
              <span className="font-mono text-[11px] tracking-[0.18em] text-ink-mute">0x</span>
              <span className="font-display italic-display text-[26px] font-medium tracking-tightest text-ink leading-none">
                hbar
              </span>
            </div>
            <div className="mt-0.5 eyebrow text-ink-faint">
              exchange&nbsp;→&nbsp;evm router
            </div>
          </div>
        </Link>

        <div className="hidden md:block h-8 w-px bg-rule" />

        <nav className="hidden md:flex items-center gap-5 text-sm text-ink-dim">
          <Link href="/" className="hover:text-ink transition-colors">
            Explorer
          </Link>
          <a
            href="https://github.com/mgarbs/0x-hbar"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://hashscan.io/testnet"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink transition-colors"
          >
            HashScan
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-3 text-[11px] font-mono text-ink-mute">
          {cfg ? (
            <>
              <NetBadge network={cfg.network} />
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <span className="text-ink-faint">relay</span>
                <a
                  href={`https://hashscan.io/${cfg.network === "mainnet" ? "mainnet" : "testnet"}/account/${cfg.operatorAccountId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink hover:text-aqua transition-colors"
                >
                  {cfg.operatorAccountId}
                </a>
              </span>
              <span className="hidden lg:inline-flex items-center gap-1.5">
                <span className="text-ink-faint">treasury</span>
                <a
                  href={`https://hashscan.io/${cfg.network === "mainnet" ? "mainnet" : "testnet"}/account/${cfg.treasuryAccountId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink hover:text-aqua transition-colors"
                >
                  {cfg.treasuryAccountId}
                </a>
              </span>
            </>
          ) : (
            <span className="h-4 w-40 rounded bg-surface-raised animate-pulse" />
          )}
        </div>
      </div>
      <div className="hairline" />
    </header>
  );
}

function NetBadge({ network }: { network: string }) {
  const isMain = network === "mainnet";
  return (
    <span
      className={`pill-base ${
        isMain ? "bg-bad/10 text-bad border border-bad/30" : "bg-aqua/10 text-aqua border border-aqua/30"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isMain ? "bg-bad" : "bg-aqua"}`} />
      {network}
    </span>
  );
}
