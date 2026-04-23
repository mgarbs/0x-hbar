"use client";
import { AnimatedNumber, AnimatedInt } from "./AnimatedNumber";
import { Sparkline } from "./Sparkline";

interface Props {
  label: string;
  value: number;
  format?: "hbar" | "int" | "pct";
  suffix?: string;
  trend?: number[];
  accent?: "brand" | "aqua" | "good" | "warn" | "bad";
  sub?: string;
  streak?: boolean;
}

const accentMap = {
  brand: {
    stroke: "#B494F7",
    fillFrom: "rgba(180,148,247,0.28)",
    fillTo: "rgba(180,148,247,0)",
    text: "text-brand-bright",
    border: "border-brand/30",
  },
  aqua: {
    stroke: "#67E8F9",
    fillFrom: "rgba(103,232,249,0.28)",
    fillTo: "rgba(103,232,249,0)",
    text: "text-aqua-bright",
    border: "border-aqua/30",
  },
  good: {
    stroke: "#34D399",
    fillFrom: "rgba(52,211,153,0.28)",
    fillTo: "rgba(52,211,153,0)",
    text: "text-good",
    border: "border-good/30",
  },
  warn: {
    stroke: "#FBBF24",
    fillFrom: "rgba(251,191,36,0.24)",
    fillTo: "rgba(251,191,36,0)",
    text: "text-warn-bright",
    border: "border-warn/30",
  },
  bad: {
    stroke: "#FB7185",
    fillFrom: "rgba(251,113,133,0.26)",
    fillTo: "rgba(251,113,133,0)",
    text: "text-bad-bright",
    border: "border-bad/30",
  },
};

export function KpiTile({
  label,
  value,
  format = "int",
  suffix,
  trend,
  accent = "aqua",
  sub,
  streak,
}: Props) {
  const a = accentMap[accent];
  return (
    <div className={`card-lift relative overflow-hidden p-5 ${streak ? "streak-sweep" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${accent === "good" ? "bg-good" : accent === "brand" ? "bg-brand" : accent === "warn" ? "bg-warn" : accent === "bad" ? "bg-bad" : "bg-aqua"}`} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        {format === "hbar" && (
          <AnimatedNumber value={value} decimals={4} className="text-[32px] leading-none font-semibold text-ink" />
        )}
        {format === "int" && (
          <AnimatedInt value={value} className="text-[32px] leading-none font-semibold text-ink" />
        )}
        {format === "pct" && (
          <>
            <AnimatedNumber value={value} decimals={0} className="text-[32px] leading-none font-semibold text-ink" />
            <span className={`text-[22px] font-semibold ${a.text}`}>%</span>
          </>
        )}
        {suffix && <span className="text-[16px] text-ink-mute ml-0.5">{suffix}</span>}
      </div>
      {sub && <div className="mt-1 text-[11px] font-mono text-ink-mute">{sub}</div>}
      {trend && trend.length > 1 && (
        <div className="mt-4 h-12 -mx-1">
          <Sparkline
            data={trend}
            height={48}
            strokeColor={a.stroke}
            fillFrom={a.fillFrom}
            fillTo={a.fillTo}
          />
        </div>
      )}
    </div>
  );
}
