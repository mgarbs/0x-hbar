import { z } from "zod";

export const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export const evmAddress = z
  .string()
  .trim()
  .regex(EVM_ADDRESS_RE, "must be 0x followed by 40 hex chars");

export const hederaAccountId = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+$/, "must be shard.realm.num");

export const txStatus = z.enum([
  "detected",
  "validated",
  "forwarding",
  "forwarded",
  "confirmed",
  "kept_malformed",
  "below_minimum",
  "failed_retry",
  "operator_review",
]);
export type TxStatus = z.infer<typeof txStatus>;

export const txEventKind = z.enum([
  "detected",
  "validated",
  "rejected_malformed",
  "rejected_below_minimum",
  "forward_submitted",
  "forward_confirmed",
  "forward_failed",
  "moved_to_review",
]);
export type TxEventKind = z.infer<typeof txEventKind>;

export const inboundTx = z.object({
  id: z.number(),
  consensusTimestamp: z.string(),
  transactionId: z.string(),
  payerAccountId: z.string().nullable(),
  amountTinybars: z.string(),
  memoRaw: z.string().nullable(),
  memoParsed: z.string().nullable(),
  status: txStatus,
  destinationHollowBefore: z.boolean().nullable(),
  feeTinybars: z.string().nullable(),
  userAmountTinybars: z.string().nullable(),
  forwardTransactionId: z.string().nullable(),
  attempts: z.number(),
  lastError: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InboundTx = z.infer<typeof inboundTx>;

export const txEvent = z.object({
  id: z.number(),
  inboundTxId: z.number(),
  kind: txEventKind,
  data: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
});
export type TxEvent = z.infer<typeof txEvent>;

export const stats = z.object({
  totalInbound: z.number(),
  totalVolumeTinybars: z.string(),
  totalFeesTinybars: z.string(),
  totalForwarded: z.number(),
  totalFailed: z.number(),
  totalMalformed: z.number(),
  avgLatencyMs: z.number().nullable(),
  successRate: z.number(),
});
export type Stats = z.infer<typeof stats>;

export const sseEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("tx.upserted"), tx: inboundTx }),
  z.object({
    type: z.literal("tx.event"),
    inboundTxId: z.number(),
    event: txEvent,
  }),
  z.object({ type: z.literal("stats"), stats }),
  z.object({ type: z.literal("hello"), at: z.string() }),
]);
export type SseEvent = z.infer<typeof sseEvent>;
