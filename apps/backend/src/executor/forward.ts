import { and, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  inboundTx as inboundTxTable,
  txEvent as txEventTable,
  type InboundTxRow,
} from "@0xhbar/db";
import { computeSplit, submitForward, submitTreasurySweep } from "@0xhbar/hedera";
import type { HederaCtx } from "@0xhbar/hedera";
import type { HollowResolver } from "./resolver.js";
import { config } from "../config.js";
import { log } from "../logger.js";

const MAX_ATTEMPTS = 5;
const backoff = [1000, 4000, 16000, 64000, 256000] as const;

export async function processRow(
  row: InboundTxRow,
  ctx: HederaCtx,
  resolver: HollowResolver
): Promise<void> {
  const db = getDb();

  // Malformed memo → keep 100% in treasury
  if (!row.memoParsed) {
    await sweepAndMark(
      row,
      ctx,
      "kept_malformed",
      "rejected_malformed",
      `0xhbar reject memo ${row.consensusTimestamp}`
    );
    return;
  }

  const destinationIsHollow = await resolver.destinationIsHollow(row.memoParsed);

  const split = computeSplit(row.amountTinybars, {
    operatorFeeBps: config.OPERATOR_FEE_BPS,
    hollowCreateTinybars: config.HOLLOW_CREATE_TINYBARS,
    networkFeeBudgetTinybars: config.NETWORK_FEE_BUDGET_TINYBARS,
    destinationIsHollow,
  });

  if (split.belowMinimum) {
    await sweepAndMark(
      row,
      ctx,
      "below_minimum",
      "rejected_below_minimum",
      `0xhbar below-min ${row.consensusTimestamp}`
    );
    return;
  }

  // Transition to forwarding
  await db
    .update(inboundTxTable)
    .set({
      status: "forwarding",
      destinationHollowBefore: destinationIsHollow,
      feeTinybars: split.operatorFee + split.hollowCost,
      userAmountTinybars: split.userAmount,
      updatedAt: new Date(),
    })
    .where(eq(inboundTxTable.id, row.id));

  await db.insert(txEventTable).values({
    inboundTxId: row.id,
    kind: "validated",
    data: {
      destinationIsHollow,
      userAmountTinybars: split.userAmount.toString(),
      feeTinybars: (split.operatorFee + split.hollowCost).toString(),
      operatorFeeTinybars: split.operatorFee.toString(),
      hollowCostTinybars: split.hollowCost.toString(),
      networkBudgetTinybars: split.networkBudget.toString(),
    },
  });
  await notify(row.id);

  try {
    const result = await submitForward({
      ctx,
      split,
      destinationEvm: row.memoParsed,
      memo: `0xhbar ${row.consensusTimestamp}`.slice(0, 100),
    });

    resolver.noteCreated(row.memoParsed);

    await db
      .update(inboundTxTable)
      .set({
        status: "forwarded",
        forwardTransactionId: result.transactionId,
        updatedAt: new Date(),
      })
      .where(eq(inboundTxTable.id, row.id));

    await db.insert(txEventTable).values({
      inboundTxId: row.id,
      kind: "forward_submitted",
      data: { transactionId: result.transactionId, status: result.status },
    });
    await db.insert(txEventTable).values({
      inboundTxId: row.id,
      kind: "forward_confirmed",
      data: { transactionId: result.transactionId },
    });
    await db
      .update(inboundTxTable)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(inboundTxTable.id, row.id));
    await notify(row.id);

    log.info(
      {
        id: row.id,
        forwardTxId: result.transactionId,
        userAmount: split.userAmount.toString(),
        fee: split.operatorFee.toString(),
      },
      "executor.forwarded"
    );
  } catch (err) {
    const nextAttempts = row.attempts + 1;
    const terminal = nextAttempts >= MAX_ATTEMPTS;
    const errMsg = err instanceof Error ? err.message : String(err);

    await db
      .update(inboundTxTable)
      .set({
        status: terminal ? "operator_review" : "failed_retry",
        attempts: nextAttempts,
        lastError: errMsg.slice(0, 1000),
        updatedAt: new Date(),
      })
      .where(eq(inboundTxTable.id, row.id));

    await db.insert(txEventTable).values({
      inboundTxId: row.id,
      kind: terminal ? "moved_to_review" : "forward_failed",
      data: { error: errMsg.slice(0, 1000), attempts: nextAttempts },
    });
    await notify(row.id);

    log.error({ id: row.id, err, nextAttempts }, "executor.forward_failed");
  }
}

async function sweepAndMark(
  row: InboundTxRow,
  ctx: HederaCtx,
  status: "kept_malformed" | "below_minimum",
  eventKind: "rejected_malformed" | "rejected_below_minimum",
  memo: string
): Promise<void> {
  const db = getDb();

  // If treasury is operator itself, no external transfer needed — just mark.
  const sameAccount = ctx.operatorId.toString() === ctx.treasuryId.toString();

  let forwardTxId: string | null = null;
  if (!sameAccount) {
    try {
      const result = await submitTreasurySweep({
        ctx,
        amountTinybars: row.amountTinybars,
        memo,
      });
      forwardTxId = result.transactionId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ id: row.id, err: msg }, "executor.sweep_failed");
      await db
        .update(inboundTxTable)
        .set({
          status: "failed_retry",
          attempts: row.attempts + 1,
          lastError: msg.slice(0, 1000),
          updatedAt: new Date(),
        })
        .where(eq(inboundTxTable.id, row.id));
      await db.insert(txEventTable).values({
        inboundTxId: row.id,
        kind: "forward_failed",
        data: { error: msg.slice(0, 1000), phase: "treasury_sweep" },
      });
      await notify(row.id);
      return;
    }
  }

  await db
    .update(inboundTxTable)
    .set({
      status,
      feeTinybars: row.amountTinybars,
      userAmountTinybars: 0n,
      forwardTransactionId: forwardTxId,
      updatedAt: new Date(),
    })
    .where(eq(inboundTxTable.id, row.id));

  await db.insert(txEventTable).values({
    inboundTxId: row.id,
    kind: eventKind,
    data: {
      reason: status,
      treasurySweepTxId: forwardTxId,
      amountTinybars: row.amountTinybars.toString(),
    },
  });
  await notify(row.id);

  log.info({ id: row.id, status, forwardTxId }, "executor.kept_100pct");
}

async function notify(id: number): Promise<void> {
  const db = getDb();
  await db.execute(sql`NOTIFY tx_changed, ${sql.raw(`'${id}'`)}`);
}

export function delayForAttempt(attempt: number): number {
  return backoff[Math.min(attempt, backoff.length - 1)] ?? 60000;
}
