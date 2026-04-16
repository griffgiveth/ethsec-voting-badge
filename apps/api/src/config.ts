import { z } from "zod";
import { readFileSync } from "node:fs";

/**
 * Env schema for the API. Validated once at boot via {@link loadEnv}; the
 * resulting `Env` is threaded through routes that need configuration.
 */
const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL required")
    .default("postgres://postgres:postgres@localhost:5432/ethsec"),
  BADGE_CONTRACT: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "BADGE_CONTRACT must be 0x-prefixed 20-byte hex"),
  CHAIN_ID: z.coerce.number().int().positive(),
  RPC_URL: z.string().url().optional(),
  ADMIN_EXPORT_TOKEN: z.string().min(16).optional(),
  CORS_ALLOWED_ORIGIN: z.string().default("*"),
  /**
   * Public ML-KEM-768 key, hex-encoded with 0x prefix. If `PUBLIC_KEY_PATH` is
   * also set it overrides this var (the file's contents are used verbatim).
   */
  ENCRYPTION_PUBLIC_KEY_HEX: z.string().regex(/^0x[a-fA-F0-9]+$/, "ENCRYPTION_PUBLIC_KEY_HEX must be 0x-prefixed hex"),
  PUBLIC_KEY_PATH: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const env = EnvSchema.parse(process.env);
  // If a key file path is provided, read it and override the hex var.
  if (env.PUBLIC_KEY_PATH) {
    const fileContents = readFileSync(env.PUBLIC_KEY_PATH, "utf8").trim();
    if (!/^0x[a-fA-F0-9]+$/.test(fileContents)) {
      throw new Error(`PUBLIC_KEY_PATH file ${env.PUBLIC_KEY_PATH} does not contain 0x-prefixed hex`);
    }
    return { ...env, ENCRYPTION_PUBLIC_KEY_HEX: fileContents };
  }
  return env;
}
