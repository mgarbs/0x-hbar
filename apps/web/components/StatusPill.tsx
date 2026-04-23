import clsx from "clsx";

type Tone = "neutral" | "brand" | "aqua" | "good" | "warn" | "bad";

const MAP: Record<string, { label: string; tone: Tone }> = {
  detected:        { label: "detected",        tone: "neutral" },
  validated:       { label: "validated",       tone: "brand" },
  forwarding:      { label: "forwarding",      tone: "brand" },
  forwarded:       { label: "forwarded",       tone: "aqua" },
  confirmed:       { label: "confirmed",       tone: "good" },
  kept_malformed:  { label: "kept · memo",     tone: "warn" },
  below_minimum:   { label: "kept · below",    tone: "warn" },
  failed_retry:    { label: "retrying",        tone: "bad" },
  operator_review: { label: "review",          tone: "bad" },
};

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-lift text-ink-dim border-rule-strong",
  brand:   "bg-brand/12 text-brand-bright border-brand/30",
  aqua:    "bg-aqua/12 text-aqua-bright border-aqua/30",
  good:    "bg-good/12 text-good-bright border-good/30",
  warn:    "bg-warn/12 text-warn-bright border-warn/30",
  bad:     "bg-bad/12 text-bad-bright border-bad/40",
};

export function StatusPill({ status }: { status: string }) {
  const entry = MAP[status] ?? { label: status, tone: "neutral" as Tone };
  return <span className={clsx("pill border", TONES[entry.tone])}>{entry.label}</span>;
}

export function StatusDot({ status }: { status: string }) {
  const entry = MAP[status] ?? { tone: "neutral" as Tone };
  const cls = {
    neutral: "bg-ink-mute",
    brand:   "bg-brand",
    aqua:    "bg-aqua",
    good:    "bg-good",
    warn:    "bg-warn",
    bad:     "bg-bad",
  }[entry.tone];
  return <span className={`w-2 h-2 rounded-full ${cls}`} />;
}
