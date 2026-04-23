import { config } from "../config.js";
import { log } from "../logger.js";
import { buildMirrorClient } from "./mirror.js";
import { ingestBatch, loadCursor } from "./ingest.js";

export async function runDetector(signal: AbortSignal): Promise<void> {
  const mirror = buildMirrorClient(config.HEDERA_MIRROR_BASE);
  let cursor = await loadCursor();
  log.info({ cursor, account: config.OPERATOR_ACCOUNT_ID }, "detector.start");

  while (!signal.aborted) {
    const started = Date.now();
    try {
      const txs = await mirror.fetchInbound(config.OPERATOR_ACCOUNT_ID, cursor, 100);
      if (txs.length > 0) {
        const result = await ingestBatch(config.OPERATOR_ACCOUNT_ID, txs);
        if (result.advancedCursorTo) cursor = result.advancedCursorTo;
      }
    } catch (err) {
      log.error({ err }, "detector.poll_error");
    }
    const elapsed = Date.now() - started;
    const wait = Math.max(0, config.DETECTOR_POLL_INTERVAL_MS - elapsed);
    await sleep(wait, signal);
  }

  log.info("detector.stop");
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (ms === 0) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });
}
