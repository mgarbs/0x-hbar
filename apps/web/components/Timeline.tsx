"use client";
import type { TxEvent } from "@/lib/api";
import clsx from "clsx";
import { fmtRelative } from "@/lib/format";

const KIND_LABELS: Record<string, { label: string; color: string }> = {
  detected:               { label: "Detected on mirror",     color: "bg-muted" },
  validated:              { label: "Memo validated",         color: "bg-brand" },
  rejected_malformed:     { label: "Memo malformed — kept",  color: "bg-warning" },
  rejected_below_minimum: { label: "Below minimum — kept",   color: "bg-warning" },
  forward_submitted:      { label: "Forward submitted",      color: "bg-brand" },
  forward_confirmed:      { label: "Forward confirmed",      color: "bg-success" },
  forward_failed:         { label: "Forward failed",         color: "bg-danger" },
  moved_to_review:        { label: "Moved to review",        color: "bg-danger" },
};

export function Timeline({ events }: { events: TxEvent[] }) {
  return (
    <ol className="relative border-l border-border ml-2 pl-6 space-y-4">
      {events.map((ev) => {
        const meta = KIND_LABELS[ev.kind] ?? { label: ev.kind, color: "bg-muted" };
        return (
          <li key={ev.id} className="relative">
            <span
              className={clsx(
                "absolute -left-[31px] top-1 w-3 h-3 rounded-full ring-4 ring-bg",
                meta.color
              )}
            />
            <div className="text-sm">
              <span className="text-text">{meta.label}</span>
              <span className="ml-2 text-xs text-muted">
                {fmtRelative(ev.createdAt)}
              </span>
            </div>
            {ev.data && Object.keys(ev.data).length > 0 && (
              <pre className="mt-1 text-xs text-muted bg-panel2 border border-border rounded p-2 overflow-auto scroll-thin mono">
                {JSON.stringify(ev.data, null, 2)}
              </pre>
            )}
          </li>
        );
      })}
    </ol>
  );
}
