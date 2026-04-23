import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
loadEnv({ path: resolve(repoRoot, ".env") });
const migrationsFolder = resolve(here, "..", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Create .env at repo root first.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

console.log(`→ migrating with folder ${migrationsFolder}`);
await migrate(db, { migrationsFolder });
console.log("✓ migrations complete");
await sql.end({ timeout: 5 });
