import { config } from "./config.js";
import { log } from "./logger.js";
import { getDb, closeDb } from "@0xhbar/db";
import { runDetector } from "./detector/index.js";
import { runExecutor } from "./executor/index.js";
import { startApi } from "./api/index.js";

async function main() {
  log.info(
    {
      network: config.HEDERA_NETWORK,
      operator: config.OPERATOR_ACCOUNT_ID,
      apiPort: config.API_PORT,
    },
    "backend.boot"
  );

  // Warm up DB
  getDb();

  const ctrl = new AbortController();

  const shutdown = async (signal: string) => {
    log.warn({ signal }, "backend.shutdown");
    ctrl.abort();
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  const jobs = Promise.all([
    startApi(ctrl.signal),
    runDetector(ctrl.signal),
    runExecutor(ctrl.signal),
  ]);

  try {
    await jobs;
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
