const TINYBARS_PER_HBAR = 100_000_000n;

export function tinybarsToHbar(tb: string | bigint | number): number {
  const n = typeof tb === "bigint" ? tb : BigInt(tb);
  return Number(n) / Number(TINYBARS_PER_HBAR);
}

export function fmtHbar(tb: string | bigint | number | null, digits = 4): string {
  if (tb === null || tb === undefined) return "—";
  const v = tinybarsToHbar(tb);
  return `${v.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "")} ℏ`;
}

export function shortEvm(addr: string | null): string {
  if (!addr) return "—";
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function shortAccount(id: string | null): string {
  if (!id) return "—";
  return id;
}

export function shortTxId(id: string | null): string {
  if (!id) return "—";
  const [acct, ts] = id.split("@");
  if (!ts) return id;
  return `${acct}@…${ts.slice(-9)}`;
}

export function consensusTsToDate(cts: string): Date {
  const [secs, ns] = cts.split(".");
  return new Date(Number(secs ?? "0") * 1000 + Math.floor(Number(ns ?? "0") / 1_000_000));
}

export function hashscanUrl(
  network: string,
  kind: "tx" | "account",
  id: string
): string {
  const net = network === "mainnet" ? "mainnet" : "testnet";
  const base = `https://hashscan.io/${net}`;
  if (kind === "tx") return `${base}/transaction/${encodeURIComponent(id)}`;
  return `${base}/account/${encodeURIComponent(id)}`;
}

export function fmtRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Math.round((Date.now() - d) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleString();
}
