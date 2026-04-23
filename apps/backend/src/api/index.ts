import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { serve } from "@hono/node-server";
import { apiRoutes } from "./routes.js";
import { sseHandler } from "./sse.js";
import { config } from "../config.js";
import { log } from "../logger.js";

export function startApi(signal: AbortSignal): Promise<void> {
  const app = new Hono();

  app.use("*", cors({
    origin: (origin) => {
      if (!origin) return origin;
      const allowed = config.API_CORS_ORIGIN.split(",").map((s) => s.trim());
      if (allowed.includes("*") || allowed.includes(origin)) return origin;
      return null;
    },
    allowMethods: ["GET", "HEAD", "OPTIONS"],
  }));
  app.use("*", honoLogger((msg, ...rest) => log.debug({ rest }, msg)));

  app.route("/", apiRoutes);
  app.get("/sse", sseHandler());

  return new Promise((resolve) => {
    const server = serve(
      { fetch: app.fetch, port: config.API_PORT, hostname: "0.0.0.0" },
      (info) => log.info({ port: info.port }, "api.listening")
    );
    signal.addEventListener("abort", () => {
      server.close(() => resolve());
    }, { once: true });
  });
}
