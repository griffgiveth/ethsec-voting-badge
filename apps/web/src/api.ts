/**
 * Backend client. All requests go through `apiFetch` so the
 * `bypass-tunnel-reminder` header is injected transparently when the API
 * base URL is a localtunnel host.
 */
import { APP_CONFIG } from "./config.js";
import type { BackendConfig } from "./state/submission.js";

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  if (APP_CONFIG.isTunnel) headers.set("bypass-tunnel-reminder", "true");
  return fetch(`${APP_CONFIG.apiBaseUrl}${path}`, { ...init, headers });
}

export async function getConfig(): Promise<BackendConfig> {
  const r = await apiFetch("/config");
  if (!r.ok) throw new Error(`/config ${r.status}`);
  return r.json();
}

export interface TokenStatus {
  tokenId: string;
  used: boolean;
}

export async function getTokenStatus(tokenId: string): Promise<TokenStatus> {
  const r = await apiFetch(`/token-status/${encodeURIComponent(tokenId)}`);
  if (!r.ok) throw new Error(`/token-status ${r.status}`);
  return r.json();
}

export interface SubmitBody {
  badgeContract: `0x${string}`;
  tokenId: string;
  holderWallet: `0x${string}`;
  ciphertext: string;
  ciphertextHash: `0x${string}`;
  nonce: `0x${string}`;
  issuedAt: number;
  expiresAt: number;
  signature: `0x${string}`;
}

export interface SubmitOk {
  ok: true;
  submittedAt: string;
}

export async function postSubmit(body: SubmitBody): Promise<SubmitOk> {
  const r = await apiFetch("/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: unknown = await r.json().catch(() => ({}));
  if (!r.ok || !(json as { ok?: boolean }).ok) {
    const msg = (json as { error?: string }).error ?? `http ${r.status}`;
    const err = new Error(msg);
    (err as Error & { code: string }).code = msg;
    throw err;
  }
  return json as SubmitOk;
}
