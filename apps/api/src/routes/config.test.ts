import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../server.js";

describe("GET /config", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    process.env.BADGE_CONTRACT = "0xf67c0ade41c607efebf198f9d6065ab1ec5ad4cd";
    process.env.CHAIN_ID = "1";
    process.env.RPC_URL = "https://eth.llamarpc.com";
    process.env.ENCRYPTION_PUBLIC_KEY_HEX = "0xdeadbeef";
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns config fields", async () => {
    const res = await app.inject({ method: "GET", url: "/config" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.badgeContract).toBe("0xf67c0ade41c607efebf198f9d6065ab1ec5ad4cd");
    expect(body.chainId).toBe(1);
    expect(body.encryptionPublicKey).toBe("0xdeadbeef");
    expect(body.eip712Domain.name).toBe("ETHSecurity Voting Badge");
    expect(body.eip712Domain.version).toBe("1");
    expect(body.eip712Domain.chainId).toBe(1);
  });

  it("400-rejects when ENCRYPTION_PUBLIC_KEY_HEX is malformed at boot time", async () => {
    // Sanity: env is validated; we can't easily re-init in this test, but the
    // schema's regex covers this path. Smoke-test the validation surface here
    // by importing loadEnv directly.
    const { loadEnv } = await import("../config.js");
    const original = process.env.ENCRYPTION_PUBLIC_KEY_HEX;
    process.env.ENCRYPTION_PUBLIC_KEY_HEX = "not-hex";
    try {
      expect(() => loadEnv()).toThrow();
    } finally {
      process.env.ENCRYPTION_PUBLIC_KEY_HEX = original;
    }
  });
});
