import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

export type DB = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql<{}>;
};

let cached: DB | null = null;

export function getDb(url?: string): DB {
  if (cached) return cached;
  const connectionString = url ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  const db = drizzle(sql, { schema });
  cached = Object.assign(db, { $client: sql });
  return cached;
}

export async function closeDb(): Promise<void> {
  if (cached) {
    await cached.$client.end({ timeout: 5 });
    cached = null;
  }
}
