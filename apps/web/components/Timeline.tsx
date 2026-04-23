"use client";
import type { TxEvent } from "@/lib/api";
import clsx from "clsx";
import { fmtRelative } from "@/lib/format";

const KIND: Record<
  string,
  { label: string; tone: "neutral" | "brand" | "aqua" | "good" | "warn" | "bad" }
> = {
  detected:               { label: "Detected on mirror",   tone: "neutral" },
  validated:              { label: "Memo validated",       tone: "brand" },
  rejected_malformed:     { label: "Malformed · kept",     tone: "warn" },
  rejected_below_minimum: { label: "Below minimum · kept", tone: "warn" },
  forward_submitted:      { label: "Forward submitted",    tone: "brand" },
  forward_confirmed:      { label: "Forward confirmed",    tone: "good" },
  forward_failed:         { label: "Forward failed",       tone: "bad" },
  moved_to_review:        { label: "Moved to review",      tone: "bad" },
};

const TONE_BG = {
  neutral: "bg-surface-hi text-ink-dim border-rule-strong",
  brand:   "bg-brand/20 text-brand-bright border-brand/40",
  aqua:    "bg-aqua/20 text-aqua-bright border-aqua/40",
  good:    "bg-good/20 text-good-bright border-good/40",
  warn:    "bg-warn/20 text-warn-bright border-warn/40",
  bad:     "bg-bad/20 text-bad-bright border-bad/40",
};

export function Timeline({ events }: { events: TxEvent[] }) {
  return (
    <ol className="relative space-y-4 pl-7 border-l border-rule-strong">
      {events.map((ev, i) => {
        const meta = KIND[ev.kind] ?? { label: ev.kind, tone: "neutral" as const };
        const last = i === events.length - 1;
        return (
          <li key={ev.id} className="relative">
            <span
              className={clsx(
                "absolute -left-[34px] top-1 w-4 h-4 rounded-full border ring-4 ring-surface-elevated",
                TONE_BG[meta.tone]
              )}
            />
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-ink text-sm font-medium">{meta.label}</div>
              <div className="text-[11px] font-mono text-ink-mute">{fmtRelative(ev.createdAt)}</div>
              {last && <span className="pill bg-good/10 text-good-bright border border-good/30">latest</span>}
            </div>
            {ev.data && Object.keys(ev.data).length > 0 && (
              <div className="mt-2">
                <DataRows data={ev.data} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function DataRows({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-y-1 gap-x-4 text-[11.5px] font-mono bg-surface-raised border border-rule rounded-md p-2.5">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-mute">{k}</dt>
          <dd className="text-ink break-all">{fmtV(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function fmtV(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}
