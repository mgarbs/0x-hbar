import clsx from "clsx";

type Tone = "neutral" | "brand" | "aqua" | "good" | "warn" | "bad";

const MAP: Record<string, { label: string; tone: Tone; icon: string }> = {
  detected:        { label: "detected",       tone: "neutral", icon: "◌" },
  validated:       { label: "validated",      tone: "brand",   icon: "◆" },
  forwarding:      { label: "forwarding",     tone: "brand",   icon: "↻" },
  forwarded:       { label: "forwarded",      tone: "aqua",    icon: "→" },
  confirmed:       { label: "confirmed",      tone: "good",    icon: "✓" },
  kept_malformed:  { label: "kept · memo",    tone: "warn",    icon: "×" },
  below_minimum:   { label: "kept · below min", tone: "warn",  icon: "×" },
  failed_retry:    { label: "retrying",       tone: "bad",     icon: "⟳" },
  operator_review: { label: "review",         tone: "bad",     icon: "!" },
};

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-lift text-ink-dim border-rule",
  brand: "bg-brand/10 text-brand-bright border-brand/30",
  aqua: "bg-aqua/10 text-aqua-bright border-aqua/30",
  good: "bg-good/10 text-good border-good/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  bad: "bg-bad/10 text-bad border-bad/40",
};

export function StatusPill({ status, compact = false }: { status: string; compact?: boolean }) {
  const entry = MAP[status] ?? { label: status, tone: "neutral" as Tone, icon: "·" };
  return (
    <span className={clsx("pill-base border", TONES[entry.tone], compact && "text-[9px] py-0.5 px-2")}>
      <span className="opacity-80">{entry.icon}</span>
      {entry.label}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const entry = MAP[status] ?? { tone: "neutral" as Tone };
  const cls = {
    neutral: "bg-ink-mute",
    brand: "bg-brand",
    aqua: "bg-aqua",
    good: "bg-good",
    warn: "bg-warn",
    bad: "bg-bad",
  }[entry.tone];
  return <span className={`w-1.5 h-1.5 rounded-full ${cls}`} />;
}
