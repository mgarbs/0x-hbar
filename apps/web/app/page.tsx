"use client";
import { Header } from "@/components/Header";
import { StatsCards } from "@/components/StatsCards";
import { LiveFeed } from "@/components/LiveFeed";
import { HowTo } from "@/components/HowTo";
import { useConfig } from "@/lib/api";

export default function Home() {
  const { data: cfg } = useConfig();
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-5 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold">Router activity</h1>
          <p className="text-muted text-sm">
            Every inbound deposit, memo parse, forward, and failure — live, with HashScan
            links for full transparency.
          </p>
        </div>
        <StatsCards />
        <LiveFeed network={cfg?.network ?? "testnet"} />
        <HowTo />
      </main>
    </>
  );
}
