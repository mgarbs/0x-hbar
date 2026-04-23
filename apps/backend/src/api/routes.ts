import { Hono } from "hono";
import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import {
  getDb,
  inboundTx as inboundTxTable,
  txEvent as txEventTable,
  statsCache,
} from "@0xhbar/db";
import { config } from "../config.js";

export const apiRoutes = new Hono();

apiRoutes.get("/health", (c) =>
  c.json({
    ok: true,
    operator: config.OPERATOR_ACCOUNT_ID,
    treasury: config.TREASURY_ACCOUNT_ID,
    network: config.HEDERA_NETWORK,
    mirror: config.HEDERA_MIRROR_BASE,
  })
);

apiRoutes.get("/txs", async (c) => {
  const db = getDb();
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const beforeId = c.req.query("before") ? Number(c.req.query("before")) : null;

  const rows = await db
    .select()
    .from(inboundTxTable)
    .where(beforeId ? lt(inboundTxTable.id, beforeId) : sql`true`)
    .orderBy(desc(inboundTxTable.id))
    .limit(limit);

  return c.json({
    txs: rows.map(serializeTx),
    nextBefore: rows.length === limit ? rows[rows.length - 1]?.id ?? null : null,
  });
});

apiRoutes.get("/tx/:id", async (c) => {
  const db = getDb();
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "bad id" }, 400);

  const [tx] = await db
    .select()
    .from(inboundTxTable)
    .where(eq(inboundTxTable.id, id))
    .limit(1);

  if (!tx) return c.json({ error: "not found" }, 404);

  const events = await db
    .select()
    .from(txEventTable)
    .where(eq(txEventTable.inboundTxId, id))
    .orderBy(txEventTable.createdAt);

  return c.json({
    tx: serializeTx(tx),
    events: events.map(serializeEvent),
  });
});

apiRoutes.get("/stats", async (c) => {
  const db = getDb();
  const rows = await db.execute(sql`
    WITH base AS (
      SELECT * FROM inbound_tx
    )
    SELECT
      COUNT(*)::int                                                        AS total_inbound,
      COALESCE(SUM(amount_tinybars), 0)::text                              AS total_volume_tinybars,
      COALESCE(SUM(fee_tinybars), 0)::text                                 AS total_fees_tinybars,
      COUNT(*) FILTER (WHERE status IN ('forwarded','confirmed'))::int     AS total_forwarded,
      COUNT(*) FILTER (WHERE status IN ('operator_review','failed_retry'))::int AS total_failed,
      COUNT(*) FILTER (WHERE status = 'kept_malformed')::int               AS total_malformed
    FROM base;
  `);
  const r = (rows as unknown as Array<{
    total_inbound: number;
    total_volume_tinybars: string;
    total_fees_tinybars: string;
    total_forwarded: number;
    total_failed: number;
    total_malformed: number;
  }>)[0] ?? {
    total_inbound: 0,
    total_volume_tinybars: "0",
    total_fees_tinybars: "0",
    total_forwarded: 0,
    total_failed: 0,
    total_malformed: 0,
  };

  const successRate =
    r.total_inbound > 0 ? Math.round((r.total_forwarded / r.total_inbound) * 100) : 0;

  return c.json({
    totalInbound: r.total_inbound,
    totalVolumeTinybars: r.total_volume_tinybars,
    totalFeesTinybars: r.total_fees_tinybars,
    totalForwarded: r.total_forwarded,
    totalFailed: r.total_failed,
    totalMalformed: r.total_malformed,
    avgLatencyMs: null,
    successRate,
  });
});

apiRoutes.get("/config/public", (c) =>
  c.json({
    network: config.HEDERA_NETWORK,
    mirror: config.HEDERA_MIRROR_BASE,
    operatorAccountId: config.OPERATOR_ACCOUNT_ID,
    treasuryAccountId: config.TREASURY_ACCOUNT_ID,
    operatorFeeBps: config.OPERATOR_FEE_BPS,
    hollowCreateTinybars: config.HOLLOW_CREATE_TINYBARS.toString(),
    networkFeeBudgetTinybars: config.NETWORK_FEE_BUDGET_TINYBARS.toString(),
  })
);

function serializeTx(row: typeof inboundTxTable.$inferSelect) {
  return {
    id: row.id,
    consensusTimestamp: row.consensusTimestamp,
    transactionId: row.transactionId,
    payerAccountId: row.payerAccountId,
    amountTinybars: row.amountTinybars.toString(),
    memoRaw: row.memoRaw,
    memoParsed: row.memoParsed,
    status: row.status,
    destinationHollowBefore: row.destinationHollowBefore,
    feeTinybars: row.feeTinybars != null ? row.feeTinybars.toString() : null,
    userAmountTinybars:
      row.userAmountTinybars != null ? row.userAmountTinybars.toString() : null,
    forwardTransactionId: row.forwardTransactionId,
    attempts: row.attempts,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeEvent(row: typeof txEventTable.$inferSelect) {
  return {
    id: row.id,
    inboundTxId: row.inboundTxId,
    kind: row.kind,
    data: row.data,
    createdAt: row.createdAt.toISOString(),
  };
}
