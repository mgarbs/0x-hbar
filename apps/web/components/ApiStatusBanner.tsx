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
    <div className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 flex items-start gap-3">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-warn animate-pulse shrink-0" />
      <div className="text-sm">
        <div className="text-warn-bright font-medium">
          {status === "mixed"
            ? "Browser is blocking the HTTP backend (mixed content)"
            : "Backend API is unreachable"}
        </div>
        <div className="text-ink-dim mt-1">
          {status === "mixed" ? (
            <>
              You&apos;re viewing this over HTTPS but the backend is HTTP. Deploy the backend
              to an HTTPS host and set{" "}
              <span className="font-mono text-aqua">NEXT_PUBLIC_API_BASE</span>, or open the
              local console at{" "}
              <a href="http://localhost:3002" className="link font-mono">http://localhost:3002</a>.
            </>
          ) : (
            <>
              Is the backend running? Start it with{" "}
              <span className="font-mono text-aqua">pnpm backend</span> from the repo root.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
