"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export interface TxRow {
  id: number;
  consensusTimestamp: string;
  transactionId: string;
  payerAccountId: string | null;
  amountTinybars: string;
  memoRaw: string | null;
  memoParsed: string | null;
  status: string;
  destinationHollowBefore: boolean | null;
  feeTinybars: string | null;
  userAmountTinybars: string | null;
  forwardTransactionId: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TxEvent {
  id: number;
  inboundTxId: number;
  kind: string;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface Stats {
  totalInbound: number;
  totalVolumeTinybars: string;
  totalFeesTinybars: string;
  totalForwarded: number;
  totalFailed: number;
  totalMalformed: number;
  avgLatencyMs: number | null;
  successRate: number;
}

export interface PublicConfig {
  network: string;
  mirror: string;
  operatorAccountId: string;
  treasuryAccountId: string;
  operatorFeeBps: number;
  hollowCreateTinybars: string;
  networkFeeBudgetTinybars: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJson<Stats>("/stats"),
    refetchInterval: 5_000,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => fetchJson<PublicConfig>("/config/public"),
    staleTime: Infinity,
  });
}

export function useTxs(limit = 50) {
  return useQuery({
    queryKey: ["txs", limit],
    queryFn: () =>
      fetchJson<{ txs: TxRow[]; nextBefore: number | null }>(`/txs?limit=${limit}`),
    refetchInterval: 3_000,
  });
}

export function useTx(id: number | null) {
  return useQuery({
    queryKey: ["tx", id],
    enabled: id != null,
    queryFn: () =>
      fetchJson<{ tx: TxRow; events: TxEvent[] }>(`/tx/${id}`),
    refetchInterval: 2_000,
  });
}

export type SseStatus = "connecting" | "open" | "closed";

export function useLiveFeed(onUpsert: (tx: TxRow) => void): SseStatus {
  const [status, setStatus] = useState<SseStatus>("connecting");

  useEffect(() => {
    const url = `${API_BASE}/sse`;
    const es = new EventSource(url);
    es.addEventListener("open", () => setStatus("open"));
    es.addEventListener("hello", () => setStatus("open"));
    es.addEventListener("tx.upserted", (e) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data);
        if (payload?.tx) onUpsert(payload.tx as TxRow);
      } catch {
        // noop
      }
    });
    es.addEventListener("error", () => setStatus("closed"));
    return () => {
      es.close();
      setStatus("closed");
    };
  }, [onUpsert]);

  return status;
}
