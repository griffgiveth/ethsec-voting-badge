import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Quiet Fastify request logs during tests; route assertions cover behavior.
    env: { LOG_LEVEL: "silent" },
  },
});
