import type { Context } from "hono";
import postgres from "postgres";
import { streamSSE } from "hono/streaming";
import { getDb, inboundTx as inboundTxTable } from "@0xhbar/db";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { log } from "../logger.js";

export function sseHandler() {
  return async (c: Context) => {
    // Prevent proxy buffering (Cloudflare tunnels, nginx, etc.).
    c.header("X-Accel-Buffering", "no");
    c.header("Cache-Control", "no-cache, no-transform");
    c.header("Connection", "keep-alive");

    return streamSSE(c, async (stream) => {
      const listener = postgres(config.DATABASE_URL, {
        max: 1,
        idle_timeout: 0,
      });

      // Initial 2KB comment padding forces proxies that buffer on content-length
      // or chunk size to flush the first frame immediately.
      await stream.write(`: ${":".repeat(2048)}\n\n`);

      await stream.writeSSE({
        event: "hello",
        data: JSON.stringify({ at: new Date().toISOString() }),
      });

      const queue: number[] = [];
      let resolveWait: (() => void) | null = null;
      let closed = false;

      const awaitEvent = () =>
        new Promise<void>((resolve) => {
          if (queue.length > 0 || closed) return resolve();
          resolveWait = resolve;
        });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      listener.listen("tx_changed", (payload) => {
        const id = Number(payload);
        if (Number.isInteger(id)) queue.push(id);
        if (resolveWait) {
          const r = resolveWait;
          resolveWait = null;
          r();
        }
      });

      stream.onAbort(() => {
        closed = true;
        if (resolveWait) {
          const r = resolveWait;
          resolveWait = null;
          r();
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        listener.end({ timeout: 5 });
      });

      // Heartbeat every 5s keeps the tunnel warm + keeps EventSource happy.
      const heartbeat = setInterval(() => {
        stream.writeSSE({ event: "ping", data: "1" }).catch(() => {
          closed = true;
        });
      }, 5_000);

      try {
        while (!closed) {
          if (queue.length === 0) await awaitEvent();
          while (queue.length > 0 && !closed) {
            const id = queue.shift()!;
            const db = getDb();
            const [row] = await db
              .select()
              .from(inboundTxTable)
              .where(eq(inboundTxTable.id, id))
              .limit(1);
            if (!row) continue;
            await stream.writeSSE({
              event: "tx.upserted",
              data: JSON.stringify({
                type: "tx.upserted",
                tx: {
                  ...row,
                  amountTinybars: row.amountTinybars.toString(),
                  feeTinybars: row.feeTinybars != null ? row.feeTinybars.toString() : null,
                  userAmountTinybars:
                    row.userAmountTinybars != null ? row.userAmountTinybars.toString() : null,
                  createdAt: row.createdAt.toISOString(),
                  updatedAt: row.updatedAt.toISOString(),
                },
              }),
            });
          }
        }
      } catch (err) {
        log.error({ err }, "sse.stream_error");
      } finally {
        clearInterval(heartbeat);
        try {
          await listener.end({ timeout: 5 });
        } catch {
          // noop
        }
      }
    });
  };
}
