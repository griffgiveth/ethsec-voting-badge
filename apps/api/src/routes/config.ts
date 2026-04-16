import type { FastifyInstance } from "fastify";
import { buildDomain } from "@ethsec/shared";
import type { Env } from "../config.js";

/**
 * GET /config — public discovery endpoint consumed by the FE.
 *
 * Returns the public ML-KEM-768 key the browser uses to encrypt the voting
 * address bundle, plus the EIP-712 domain (so the FE doesn't have to
 * hard-code chain id / contract).
 */
export async function configRoute(app: FastifyInstance, env: Env): Promise<void> {
  app.get("/config", async () => ({
    badgeContract: env.BADGE_CONTRACT.toLowerCase(),
    chainId: env.CHAIN_ID,
    encryptionPublicKey: env.ENCRYPTION_PUBLIC_KEY_HEX,
    eip712Domain: buildDomain(env.CHAIN_ID),
  }));
}
