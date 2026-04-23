import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
loadEnv({ path: resolve(repoRoot, ".env") });

const schema = z.object({
  HEDERA_NETWORK: z.enum(["testnet", "mainnet", "previewnet"]).default("testnet"),
  HEDERA_MIRROR_BASE: z.string().url().default("https://testnet.mirrornode.hedera.com"),
  OPERATOR_ACCOUNT_ID: z.string().regex(/^\d+\.\d+\.\d+$/),
  OPERATOR_PRIVATE_KEY: z.string().min(10),
  TREASURY_ACCOUNT_ID: z.string().regex(/^\d+\.\d+\.\d+$/),
  OPERATOR_FEE_BPS: z.coerce.number().int().min(0).max(10000).default(200),
  HOLLOW_CREATE_TINYBARS: z.coerce.bigint().default(50_000_000n),
  NETWORK_FEE_BUDGET_TINYBARS: z.coerce.bigint().default(100_000n),
  DATABASE_URL: z.string().min(1),
  DETECTOR_POLL_INTERVAL_MS: z.coerce.number().int().min(200).default(500),
  EXECUTOR_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(4),
  API_PORT: z.coerce.number().int().default(3001),
  API_CORS_ORIGIN: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof schema>;

export const config: Config = (() => {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("✗ invalid environment:");
    for (const issue of parsed.error.issues) {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
})();
