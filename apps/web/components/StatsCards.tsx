"use client";
import { useStats } from "@/lib/api";
import { fmtHbar } from "@/lib/format";

export function StatsCards() {
  const { data } = useStats();
  const cards = [
    {
      label: "Total inbound",
      value: data ? data.totalInbound.toString() : "—",
      sub: "withdrawals seen",
    },
    {
      label: "Total volume",
      value: data ? fmtHbar(data.totalVolumeTinybars) : "—",
      sub: "gross HBAR routed",
    },
    {
      label: "Treasury earned",
      value: data ? fmtHbar(data.totalFeesTinybars) : "—",
      sub: "2% fees + kept malformed",
    },
    {
      label: "Success rate",
      value: data ? `${data.successRate}%` : "—",
      sub: data ? `${data.totalForwarded} forwarded / ${data.totalFailed} failed` : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card">
          <div className="text-xs uppercase tracking-wider text-muted">{c.label}</div>
          <div className="text-2xl mt-1 mono font-semibold">{c.value}</div>
          <div className="text-xs text-muted mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
