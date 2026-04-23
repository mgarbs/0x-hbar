"use client";
import type { TxEvent } from "@/lib/api";
import clsx from "clsx";
import { fmtRelative } from "@/lib/format";

const KIND: Record<
  string,
  { label: string; tone: "neutral" | "brand" | "aqua" | "good" | "warn" | "bad"; icon: string }
> = {
  detected:               { label: "Detected on mirror",      tone: "neutral", icon: "◌" },
  validated:              { label: "Memo validated",          tone: "brand",   icon: "◆" },
  rejected_malformed:     { label: "Malformed memo · kept",   tone: "warn",    icon: "×" },
  rejected_below_minimum: { label: "Below minimum · kept",    tone: "warn",    icon: "×" },
  forward_submitted:      { label: "Forward submitted",       tone: "brand",   icon: "↗" },
  forward_confirmed:      { label: "Forward confirmed",       tone: "good",    icon: "✓" },
  forward_failed:         { label: "Forward failed",          tone: "bad",     icon: "!" },
  moved_to_review:        { label: "Moved to review",         tone: "bad",     icon: "⚑" },
};

const toneBg = {
  neutral: "bg-ink-mute/20 text-ink-dim",
  brand: "bg-brand/20 text-brand-bright",
  aqua: "bg-aqua/20 text-aqua-bright",
  good: "bg-good/20 text-good",
  warn: "bg-warn/20 text-warn",
  bad: "bg-bad/20 text-bad",
};

export function Timeline({ events }: { events: TxEvent[] }) {
  return (
    <ol className="relative space-y-6 pl-6 border-l border-rule">
      {events.map((ev, i) => {
        const meta = KIND[ev.kind] ?? {
          label: ev.kind,
          tone: "neutral" as const,
          icon: "·",
        };
        const last = i === events.length - 1;
        return (
          <li key={ev.id} className="relative">
            <div
              className={clsx(
                "absolute -left-[34px] top-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-mono ring-4 ring-surface-raised",
                toneBg[meta.tone]
              )}
            >
              {meta.icon}
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="text-ink text-[15px] font-medium">{meta.label}</div>
              <div className="text-[11px] font-mono text-ink-mute">
                {fmtRelative(ev.createdAt)}
              </div>
              {last && (
                <span className="pill-base bg-good/10 text-good border border-good/30">
                  latest
                </span>
              )}
            </div>
            {ev.data && Object.keys(ev.data).length > 0 && (
              <div className="mt-3">
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
    <dl className="grid grid-cols-[140px_1fr] gap-y-1 gap-x-4 text-[12px] font-mono bg-surface border border-rule rounded-lg p-3">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-mute">{k}</dt>
          <dd className="text-ink break-all">{formatValue(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}
