import { sql } from "drizzle-orm";
import { getDb, type InboundTxRow } from "@0xhbar/db";
import { buildClient } from "@0xhbar/hedera";
import { buildMirrorClient } from "../detector/mirror.js";
import { buildHollowResolver } from "./resolver.js";
import { processRow, delayForAttempt } from "./forward.js";
import { config } from "../config.js";
import { log } from "../logger.js";

export async function runExecutor(signal: AbortSignal): Promise<void> {
  const ctx = buildClient({
    network: config.HEDERA_NETWORK,
    operatorId: config.OPERATOR_ACCOUNT_ID,
    operatorKey: config.OPERATOR_PRIVATE_KEY,
    treasuryId: config.TREASURY_ACCOUNT_ID,
  });

  const mirror = buildMirrorClient(config.HEDERA_MIRROR_BASE);
  const resolver = buildHollowResolver(mirror);

  log.info(
    {
      operator: ctx.operatorId.toString(),
      treasury: ctx.treasuryId.toString(),
      concurrency: config.EXECUTOR_CONCURRENCY,
    },
    "executor.start"
  );

  // Recovery: any rows left in transient 'validated' from a prior crash go back to 'detected'.
  const { rowCount } = await resetOrphanedValidated();
  if (rowCount > 0) log.warn({ rowCount }, "executor.reset_orphaned_validated");

  const workers: Promise<void>[] = [];
  for (let i = 0; i < config.EXECUTOR_CONCURRENCY; i += 1) {
    workers.push(workerLoop(i, signal, ctx, resolver));
  }
  await Promise.all(workers);
  log.info("executor.stop");

  try {
    ctx.client.close();
  } catch {
    // noop
  }
}

async function workerLoop(
  id: number,
  signal: AbortSignal,
  ctx: Parameters<typeof processRow>[1],
  resolver: ReturnType<typeof buildHollowResolver>
): Promise<void> {
  while (!signal.aborted) {
    const row = await claimNext();
    if (!row) {
      await sleep(500, signal);
      continue;
    }

    if (row.status === "failed_retry") {
      const wait = delayForAttempt(row.attempts);
      await sleep(wait, signal);
      if (signal.aborted) break;
    }

    try {
      await processRow(row, ctx, resolver);
    } catch (err) {
      log.error({ workerId: id, rowId: row.id, err }, "executor.worker_error");
    }
  }
}

async function claimNext(): Promise<InboundTxRow | null> {
  const db = getDb();
  const rows = await db.execute(sql`
    WITH next AS (
      SELECT id FROM inbound_tx
      WHERE status IN ('detected', 'failed_retry')
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE inbound_tx t
    SET status = 'validated', updated_at = NOW()
    FROM next
    WHERE t.id = next.id
    RETURNING t.*;
  `);
  const row = (rows as unknown as InboundTxRow[])[0];
  return row ?? null;
}

async function resetOrphanedValidated(): Promise<{ rowCount: number }> {
  const db = getDb();
  const result = await db.execute(sql`
    UPDATE inbound_tx
    SET status = 'detected', updated_at = NOW()
    WHERE status = 'validated'
      AND updated_at < NOW() - INTERVAL '30 seconds'
    RETURNING id
  `);
  return { rowCount: (result as unknown as { id: number }[]).length };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });
}
