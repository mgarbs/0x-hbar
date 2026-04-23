import { eq, sql } from "drizzle-orm";
import {
  getDb,
  inboundTx as inboundTxTable,
  txEvent as txEventTable,
  detectorCursor,
} from "@0xhbar/db";
import type { MirrorTx } from "./mirror.js";
import { decodeMemo, extractEvmAddress } from "./memo.js";
import { log } from "../logger.js";

export interface IngestResult {
  newRows: number;
  skippedDup: number;
  advancedCursorTo: string | null;
}

export async function ingestBatch(
  accountId: string,
  txs: MirrorTx[]
): Promise<IngestResult> {
  const db = getDb();
  let newRows = 0;
  let skippedDup = 0;
  let highestTs: string | null = null;

  for (const t of txs) {
    if (t.name !== "CRYPTOTRANSFER") continue;
    if (t.result !== "SUCCESS") continue;

    const netInflow = computeNetInflow(t, accountId);
    if (netInflow <= 0n) continue;

    const memoRaw = decodeMemo(t.memo_base64) ?? null;
    const memoParsed = extractEvmAddress(memoRaw);

    const payer =
      t.payer_account_id ??
      t.transfers.find((x) => x.amount < 0 && x.account !== accountId)?.account ??
      null;

    const inserted = await db
      .insert(inboundTxTable)
      .values({
        consensusTimestamp: t.consensus_timestamp,
        transactionId: t.transaction_id,
        payerAccountId: payer,
        amountTinybars: netInflow,
        memoRaw,
        memoParsed,
        status: "detected",
      })
      .onConflictDoNothing({ target: inboundTxTable.consensusTimestamp })
      .returning({ id: inboundTxTable.id });

    if (inserted.length === 0) {
      skippedDup += 1;
    } else {
      newRows += 1;
      await db.insert(txEventTable).values({
        inboundTxId: inserted[0]!.id,
        kind: "detected",
        data: {
          transactionId: t.transaction_id,
          amountTinybars: netInflow.toString(),
          memoRaw,
          memoParsed,
        },
      });
      await db.execute(sql`NOTIFY tx_changed, ${sql.raw(`'${inserted[0]!.id}'`)}`);
    }

    if (!highestTs || compareTs(t.consensus_timestamp, highestTs) > 0) {
      highestTs = t.consensus_timestamp;
    }
  }

  if (highestTs) {
    await db
      .insert(detectorCursor)
      .values({ id: 1, consensusTimestamp: highestTs })
      .onConflictDoUpdate({
        target: detectorCursor.id,
        set: { consensusTimestamp: highestTs, updatedAt: new Date() },
      });
  }

  if (newRows || skippedDup) {
    log.info({ newRows, skippedDup, highestTs }, "detector.ingested");
  }

  return { newRows, skippedDup, advancedCursorTo: highestTs };
}

export async function loadCursor(): Promise<string> {
  const db = getDb();
  const rows = await db.select().from(detectorCursor).where(eq(detectorCursor.id, 1));
  return rows[0]?.consensusTimestamp ?? "0.0";
}

function computeNetInflow(t: MirrorTx, accountId: string): bigint {
  let net = 0n;
  for (const tr of t.transfers) {
    if (tr.account === accountId && !tr.is_approval) {
      net += BigInt(tr.amount);
    }
  }
  return net;
}

function compareTs(a: string, b: string): number {
  const [as, ans] = a.split(".");
  const [bs, bns] = b.split(".");
  const asN = BigInt(as ?? "0");
  const bsN = BigInt(bs ?? "0");
  if (asN !== bsN) return asN < bsN ? -1 : 1;
  const ansN = BigInt((ans ?? "0").padEnd(9, "0"));
  const bnsN = BigInt((bns ?? "0").padEnd(9, "0"));
  if (ansN === bnsN) return 0;
  return ansN < bnsN ? -1 : 1;
}

