"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export function ApiStatusBanner() {
  const [status, setStatus] = useState<"ok" | "unreachable" | "mixed" | "checking">(
    "checking"
  );

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.location.protocol === "https:" &&
          API_BASE.startsWith("http:")
        ) {
          if (!cancelled) setStatus("mixed");
          return;
        }
        const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
        if (!cancelled) setStatus(res.ok ? "ok" : "unreachable");
      } catch {
        if (!cancelled) setStatus("unreachable");
      }
    };
    check();
    const t = setInterval(check, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (status === "ok" || status === "checking") return null;

  return (
    <div className="mb-6 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 flex items-start gap-3">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-warn shrink-0" />
      <div className="text-sm">
        <div className="text-warn font-medium">
          {status === "mixed"
            ? "Explorer is loaded over HTTPS but the backend is HTTP — the browser blocks the connection."
            : "Backend API is unreachable."}
        </div>
        <div className="text-ink-dim mt-1">
          {status === "mixed"
            ? "This is the GitHub Pages build of the explorer. Point it at an HTTPS backend by setting the repo variable "
            : "Is the backend running? Start it with "}
          <span className="font-mono text-aqua">
            {status === "mixed" ? "NEXT_PUBLIC_API_BASE" : "pnpm backend"}
          </span>
          {status === "mixed" ? " and re-running the Pages workflow, or open the local explorer at " : " and reload, or open the local explorer at "}
          <span className="font-mono text-aqua">http://localhost:3002</span>.
        </div>
      </div>
    </div>
  );
}
