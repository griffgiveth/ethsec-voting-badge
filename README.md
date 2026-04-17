# ETHSecurity Voting Badge

A badgeholder-only voting-address registry. Each badge (ERC-721) can submit a
single voting address. Addresses are encrypted in the browser with
**ML-KEM-768 + AES-256-GCM**, stored as ciphertext, and decrypted offline by
the admin after voting closes.

```
┌──────────────┐   signed+encrypted    ┌──────────┐        ┌──────────┐
│  Badgeholder ├──────────────────────►│   API    ├───────►│ Postgres │
│  (browser)   │   submission          │ Fastify  │        │          │
└──────────────┘                       └──────────┘        └──────────┘
                                             │
                                  CSV export │ (bearer-auth)
                                             ▼
                                  ┌────────────────────────┐
                                  │ Admin (Griff)          │
                                  │ decrypts with ML-KEM   │
                                  │ private key offline    │
                                  └────────────────────────┘
```

---

## For badgeholders — how to submit a voting address

1. Open the hosted URL in a normal browser (works on mobile too).
2. **Connect Wallet** → pick the wallet that holds your badge NFT.
3. The app reads your badge `tokenId` onchain and shows it.
4. Enter the voting address you want recorded → click Submit.
5. Sign the EIP-712 message. The app encrypts your address locally before
   it leaves your device.
6. You'll see a success checkmark. Done — you can close the tab.

One badge = one submission. Re-submitting from the same badge is rejected.

---

## For badgeholders — air-gapped signing

If you don't want your signing wallet to touch the internet — cold wallet,
hardware-only setup, audited build environment — you can sign the submission
on one machine and post it from another. Two flavours:

### Flavour A — signed from ANY internet-connected machine, posted LATER

Useful when the signing session and the submission session are separated in
time, or when you want a record of exactly what you signed before it hits
the server.

1. On the signing machine, open the hosted URL and connect your wallet as
   usual.
2. In the form, tick **"Sign offline — export signed blob"** before clicking
   Encrypt & Sign. The app encrypts + signs as normal but downloads the
   resulting payload as `ethsec-submission-badge-<id>.json` instead of
   POSTing to the server.
3. Transfer that JSON to any internet-connected machine (USB, email,
   Signal — it's signed, so it can't be altered without invalidating).
4. From the hosted URL on that machine, click **"Upload signed blob"** in
   the footer, pick the file, submit. No wallet needed on this machine.

Alternative to step 4 — submit via curl from any terminal:

```bash
curl -X POST -H 'content-type: application/json' \
  --data-binary @ethsec-submission-badge-42.json \
  https://<hosted-api-url>/submit
```

### Flavour B — FULLY air-gapped signing machine (no network at all)

Useful if policy requires the signing machine never see the public internet.

1. **On an online machine:** clone + build the dApp as a static bundle.

   ```bash
   git clone https://github.com/griffgiveth/ethsec-voting-badge.git
   cd ethsec-voting-badge
   pnpm install
   pnpm --filter @ethsec/web build
   ```

   Output lands in `apps/web/dist/`. Copy that directory to a USB.

2. **On the air-gapped machine:** unpack the bundle and serve it locally.
   Anything that can serve static files works — one easy option:

   ```bash
   npx --yes http-server apps/web/dist -p 5174
   ```

   Or open `apps/web/dist/index.html` directly in a browser (may need to
   disable file:// restrictions in some browsers).

3. Plug in your hardware wallet (Ledger/Trezor/Keystone/etc.) — anything
   that can sign EIP-712 typed data without making network calls.

4. Complete the flow in the browser: pick your badge (use the "Enter
   manually" option if the auto-detect can't reach an RPC), enter the
   voting address, tick **"Sign offline"**, and click the button. The
   signed+encrypted JSON lands in your downloads folder.

5. Transfer the JSON to an online machine (USB again). Follow step 4 of
   Flavour A above — upload via the hosted site or curl the /submit endpoint.

What crosses the air gap: the JSON blob (signed envelope + ciphertext).
What never leaves the signing machine: your wallet's private key and
plaintext voting address.

---

## For the admin (Griff) — full lifecycle

### Step 1 — Generate your keypair (do this ONCE, on your own machine)

```bash
pnpm install
pnpm --filter @ethsec/scripts keygen ./keys
```

Outputs:

- `./keys/public.key` — safe to share with anyone. Goes into env vars.
- `./keys/private.key` — **NEVER share, never commit, never upload.**
  Back it up somewhere only you control (1Password, hardware token, etc.).

If you lose `private.key` you can't decrypt any submissions. Ever.

### Step 2 — Generate the admin export token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output. This is the bearer token that gates the encrypted CSV
dump. Keep a copy for yourself and send another to the devs (out-of-band
— see "Secure hand-off" below).

### Step 3 — Hand off to the deployers

Give your devs these three values to set as env vars on the deployed
infrastructure:

| Env var                           | Source                         | Where it goes |
| --------------------------------- | ------------------------------ | ------------- |
| `ENCRYPTION_PUBLIC_KEY_HEX`       | contents of `keys/public.key`  | API server    |
| `VITE_ENCRYPTION_PUBLIC_KEY_HEX`  | contents of `keys/public.key`  | Web build     |
| `ADMIN_EXPORT_TOKEN`              | the hex token from Step 2      | API server    |

Plus the other boilerplate envs (`DATABASE_URL`, `BADGE_CONTRACT`,
`CHAIN_ID`, `RPC_URL`, `CORS_ALLOWED_ORIGIN`, `VITE_API_URL`) — see the
`.env.example` files in `apps/api/` and `apps/web/`.

**Keep locally (never upload):**

- `keys/private.key`
- A copy of `ADMIN_EXPORT_TOKEN`

### Step 4 — After voting closes, decrypt

Two options — pick whichever you prefer.

**Option A — in-browser admin page** (easiest)

1. Open `<deployed-url>/admin`
2. Paste `ADMIN_EXPORT_TOKEN` into the token field.
3. Paste the contents of `keys/private.key` into the private-key field.
4. Click "Fetch & Decrypt." The browser talks to the API, pulls the CSV,
   and decrypts locally. Neither secret hits a server.
5. Click "Download" for a CSV with plaintext `voting_address` per row.

**Option B — offline CLI script** (most paranoid)

```bash
# 1. Download encrypted CSV (can run from anywhere with the token)
curl -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN" \
  https://<api-host>/admin/export -o encrypted-export.csv

# 2. Decrypt locally (air-gapped machine if you want)
pnpm --filter @ethsec/scripts decrypt \
  --in encrypted-export.csv \
  --key ./keys/private.key \
  --out decrypted.csv
```

Both options produce a CSV with a `voting_address` column holding the
plaintext addresses submitted by badgeholders.

---

## Secure hand-off — how to share secrets WITHOUT leaking them

**Never paste secrets into Telegram, Slack, or email.** Those channels
are not end-to-end encrypted; the server keeps copies.

Acceptable channels:

- Signal (free, e2e)
- 1Password shared vault
- Keybase encrypted chat
- `age -r <recipient-pubkey>` encrypted blob over any channel
- In person / USB stick

The `public.key` is safe to share anywhere — you can paste it into
Telegram, email it, tweet it. Only the `private.key` and
`ADMIN_EXPORT_TOKEN` need the secure channel.

---

## Architecture

| Package            | Role                                                         |
| ------------------ | ------------------------------------------------------------ |
| `apps/api`         | Fastify server. Routes: `/config`, `/submit`, `/token-status/:id`, `/admin/export`. Verifies EIP-712 signature + onchain ERC-721 ownership before insert. |
| `apps/web`         | Vite + React + RainbowKit. Submission flow + admin decrypt page. |
| `packages/shared`  | Hybrid encryption (ML-KEM-768 + AES-256-GCM). Browser- and Node-safe. |
| `scripts`          | `keygen` (ML-KEM keypair), `decrypt` (offline CSV decrypt). |

See `apps/api/README.md` for DB/driver details and routing specifics.

---

## Local development

```bash
pnpm install

# Start Postgres
docker compose -f apps/api/docker-compose.yml up -d

# Apply schema
pnpm --filter @ethsec/api db:push

# Run both servers
pnpm dev
# API  → http://localhost:3001
# Web  → http://localhost:5174
```

Verify:

```bash
pnpm test         # vitest across all packages
pnpm typecheck    # tsc --noEmit
```

---

## Security model — two-secret admin

The admin's power is split across two secrets held by the same person:

1. **`ADMIN_EXPORT_TOKEN`** — grants access to the encrypted CSV.
2. **ML-KEM-768 private key** — decrypts the ciphertexts.

An attacker who steals one without the other gets nothing useful:

- Token alone → ciphertext blobs, no way to read them.
- Private key alone → no way to fetch the blobs.

Both secrets live only on the admin's local machine. The browser-based
admin page performs decryption entirely client-side; the private key
never reaches a server.
