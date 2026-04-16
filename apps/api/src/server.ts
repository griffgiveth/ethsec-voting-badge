import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./config.js";
import { configRoute } from "./routes/config.js";

export async function buildServer() {
  const env = loadEnv();
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });
  await app.register(cors, { origin: env.CORS_ALLOWED_ORIGIN });
  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });

  app.get("/health", async () => ({ ok: true }));
  await configRoute(app, env);

  return app;
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = loadEnv();
  const app = await buildServer();
  app.listen({ port: env.PORT, host: "0.0.0.0" });
}
