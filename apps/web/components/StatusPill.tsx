import clsx from "clsx";

const MAP: Record<string, { label: string; tone: string }> = {
  detected:        { label: "detected",       tone: "bg-panel2 text-muted border border-border" },
  validated:       { label: "validated",      tone: "bg-brand/10 text-brand border border-brand/40" },
  forwarding:      { label: "forwarding",     tone: "bg-brand/20 text-brand border border-brand/60" },
  forwarded:       { label: "forwarded",      tone: "bg-success/15 text-success border border-success/50" },
  confirmed:       { label: "confirmed",      tone: "bg-success/20 text-success border border-success/60" },
  kept_malformed:  { label: "malformed memo", tone: "bg-warning/15 text-warning border border-warning/50" },
  below_minimum:   { label: "below minimum",  tone: "bg-warning/10 text-warning border border-warning/40" },
  failed_retry:    { label: "retrying",       tone: "bg-danger/10 text-danger border border-danger/40" },
  operator_review: { label: "review",         tone: "bg-danger/20 text-danger border border-danger/60" },
};

export function StatusPill({ status }: { status: string }) {
  const entry = MAP[status] ?? { label: status, tone: "bg-panel2 text-muted border border-border" };
  return <span className={clsx("pill", entry.tone)}>{entry.label}</span>;
}
