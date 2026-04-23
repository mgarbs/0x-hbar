"use client";
import Link from "next/link";
import { useConfig } from "@/lib/api";
import { Logo } from "./Logo";

export function Header() {
  const { data: cfg } = useConfig();
  const net = cfg?.network ?? "testnet";
  const hashscanBase = net === "mainnet" ? "mainnet" : "testnet";

  return (
    <header className="border-b border-rule bg-surface/60 backdrop-blur-xl">
      <div className="max-w-[1360px] mx-auto px-5 h-14 flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={28} />
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className="font-mono text-[10px] tracking-[0.22em] text-ink-mute group-hover:text-ink transition-colors">0x</span>
            <span className="font-semibold text-[17px] text-ink tracking-tight">hbar</span>
          </div>
          <span className="hidden sm:inline pill bg-brand/10 text-brand-bright border border-brand/30 ml-2">
            router
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-4 text-[12px] text-ink-mute pl-4 border-l border-rule-strong">
          <Link href="/" className="hover:text-ink transition-colors">Console</Link>
          <a href="https://github.com/mgarbs/0x-hbar" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors">
            Source
          </a>
          <a href={`https://hashscan.io/${hashscanBase}`} target="_blank" rel="noreferrer" className="hover:text-ink transition-colors">
            HashScan
          </a>
        </div>

        <div className="ml-auto flex items-center gap-3 text-[11px] font-mono">
          {cfg ? (
            <>
              <Pill k="net" v={net} tone={net === "mainnet" ? "bad" : "aqua"} />
              <Pill
                k="relay"
                v={cfg.operatorAccountId}
                link={`https://hashscan.io/${hashscanBase}/account/${cfg.operatorAccountId}`}
              />
              <Pill
                k="treasury"
                v={cfg.treasuryAccountId}
                link={`https://hashscan.io/${hashscanBase}/account/${cfg.treasuryAccountId}`}
              />
              <Pill
                k="fee"
                v={`${cfg.operatorFeeBps / 100}%`}
                tone="brand"
              />
            </>
          ) : (
            <span className="h-4 w-44 rounded bg-surface-raised animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}

function Pill({
  k,
  v,
  link,
  tone = "default",
}: {
  k: string;
  v: string;
  link?: string;
  tone?: "default" | "brand" | "aqua" | "bad";
}) {
  const toneClass = {
    default: "bg-surface-raised/80 border-rule-strong text-ink-dim",
    brand: "bg-brand/10 border-brand/30 text-brand-bright",
    aqua: "bg-aqua/10 border-aqua/30 text-aqua-bright",
    bad: "bg-bad/10 border-bad/30 text-bad-bright",
  }[tone];

  const inner = (
    <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-md border px-2 py-1 ${toneClass}`}>
      <span className="text-ink-faint">{k}</span>
      <span className="text-current">{v}</span>
    </span>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-80">
        {inner}
      </a>
    );
  }
  return inner;
}
