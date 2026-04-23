import {
  pgTable,
  serial,
  text,
  bigint,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const txStatusEnum = pgEnum("tx_status", [
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

export const txEventKindEnum = pgEnum("tx_event_kind", [
  "detected",
  "validated",
  "rejected_malformed",
  "rejected_below_minimum",
  "forward_submitted",
  "forward_confirmed",
  "forward_failed",
  "moved_to_review",
]);

export const inboundTx = pgTable(
  "inbound_tx",
  {
    id: serial("id").primaryKey(),
    consensusTimestamp: text("consensus_timestamp").notNull(),
    transactionId: text("transaction_id").notNull(),
    payerAccountId: text("payer_account_id"),
    amountTinybars: bigint("amount_tinybars", { mode: "bigint" }).notNull(),
    memoRaw: text("memo_raw"),
    memoParsed: text("memo_parsed"),
    status: txStatusEnum("status").notNull().default("detected"),
    destinationHollowBefore: boolean("destination_hollow_before"),
    feeTinybars: bigint("fee_tinybars", { mode: "bigint" }),
    userAmountTinybars: bigint("user_amount_tinybars", { mode: "bigint" }),
    forwardTransactionId: text("forward_transaction_id"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    consensusTsUnique: uniqueIndex("inbound_tx_consensus_ts_unq").on(t.consensusTimestamp),
    statusCreatedIdx: index("inbound_tx_status_created_idx").on(t.status, t.createdAt),
    forwardTxIdx: index("inbound_tx_forward_tx_idx").on(t.forwardTransactionId),
  })
);

export const txEvent = pgTable(
  "tx_event",
  {
    id: serial("id").primaryKey(),
    inboundTxId: integer("inbound_tx_id")
      .notNull()
      .references(() => inboundTx.id, { onDelete: "cascade" }),
    kind: txEventKindEnum("kind").notNull(),
    data: jsonb("data"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    inboundIdx: index("tx_event_inbound_idx").on(t.inboundTxId, t.createdAt),
  })
);

export const detectorCursor = pgTable("detector_cursor", {
  id: integer("id").primaryKey().default(1),
  consensusTimestamp: text("consensus_timestamp").notNull().default("0.0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statsCache = pgTable("stats_cache", {
  id: integer("id").primaryKey().default(1),
  totalInbound: integer("total_inbound").notNull().default(0),
  totalVolumeTinybars: bigint("total_volume_tinybars", { mode: "bigint" })
    .notNull()
    .default(sql`0`),
  totalFeesTinybars: bigint("total_fees_tinybars", { mode: "bigint" })
    .notNull()
    .default(sql`0`),
  totalForwarded: integer("total_forwarded").notNull().default(0),
  totalFailed: integer("total_failed").notNull().default(0),
  totalMalformed: integer("total_malformed").notNull().default(0),
  avgLatencyMs: integer("avg_latency_ms"),
  successRate: integer("success_rate").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InboundTxRow = typeof inboundTx.$inferSelect;
export type NewInboundTxRow = typeof inboundTx.$inferInsert;
export type TxEventRow = typeof txEvent.$inferSelect;
export type NewTxEventRow = typeof txEvent.$inferInsert;
