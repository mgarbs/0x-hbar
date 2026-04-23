"use client";
import Link from "next/link";
import { useConfig } from "@/lib/api";

export function Header() {
  const { data: cfg } = useConfig();
  return (
    <header className="border-b border-border bg-panel/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="text-2xl font-semibold tracking-tight">
            <span className="text-brand2">0x</span>
            <span className="text-muted">-</span>
            <span className="text-brand">hbar</span>
          </div>
          <span className="pill bg-panel2 border border-border text-muted">
            exchange → evm router
          </span>
        </Link>
        <div className="flex items-center gap-3 text-xs mono text-muted">
          {cfg ? (
            <>
              <span>
                <span className="text-muted">relay </span>
                <span className="text-text">{cfg.operatorAccountId}</span>
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="text-muted">treasury </span>
                <span className="text-text">{cfg.treasuryAccountId}</span>
              </span>
              <span className="text-border">|</span>
              <span className="text-text uppercase">{cfg.network}</span>
            </>
          ) : (
            <span>loading…</span>
          )}
        </div>
      </div>
    </header>
  );
}
