# 0x-hbar

Production HBAR router: exchange `0.0.x` deposit + memo → forward 98% to the
memo's `0x` EVM address, 2% to treasury, full-transparency explorer.

Built because exchanges don't support EVM destinations for Hedera. You withdraw
to a native `0.0.x` account with an EVM address in the memo; this service
detects the deposit, validates the memo, and forwards atomically.

## How it works

```
Exchange ──HBAR + memo(0x…)──▶ 0.0.RELAY
                                │
                                ▼
                           detector (500ms poll, mirror REST)
                                │
                                ▼
                           outbox (Postgres)
                                │
                                ▼
                           executor  ──atomic TransferTransaction──▶
                                                │
                                      ┌─────────┼─────────┐
                                      ▼                   ▼
                               0x user (98%)        treasury (2%)
```

Malformed / missing memo → 100% kept in treasury. Below the minimum viable
amount → same outcome. Every transition is logged as a `tx_event` and streamed
live to the explorer UI via Postgres LISTEN/NOTIFY + SSE.

## Stack

pnpm + Turborepo · TypeScript · Postgres 16 + Drizzle · Hedera SDK · Hono ·
Next.js 15 (static export) · Tailwind · TanStack Query.

## Local setup

Prereqs: Node 22+, pnpm 10, Docker.

```bash
cp .env.example .env
# edit .env: set OPERATOR_ACCOUNT_ID, OPERATOR_PRIVATE_KEY, TREASURY_ACCOUNT_ID

pnpm setup      # installs deps, starts Postgres (Docker), runs migrations
pnpm dev        # starts backend (:3001) and web (:3000) in parallel
```

Open **http://localhost:3000** — the explorer is live.

### Simulating a deposit

```bash
pnpm seed:deposit -- --amount 2 --memo 0xdac17f958d2ee523a2206206994597c13d831ec7
```

This creates a throwaway testnet account, funds it from your operator, and
sends HBAR back to the relay with the memo — simulating an exchange
withdrawal. The detector picks it up within ~1s, the executor forwards,
and the UI updates live.

Variants:
```bash
# malformed memo → kept 100% in treasury
pnpm seed:deposit -- --amount 2 --memo "not-an-address"

# below minimum (too small to cover 2% + hollow create)
pnpm seed:deposit -- --amount 0.01 --memo 0xdac17f958d2ee523a2206206994597c13d831ec7
```

## Config knobs

All via `.env`:

| Var | Default | Purpose |
|---|---|---|
| `HEDERA_NETWORK` | `testnet` | `testnet` / `mainnet` / `previewnet` |
| `OPERATOR_ACCOUNT_ID` | — | Relay account (`0.0.x`) receiving inbound |
| `OPERATOR_PRIVATE_KEY` | — | Signs forward transactions |
| `TREASURY_ACCOUNT_ID` | — | Receives 2% + kept-100% amounts |
| `OPERATOR_FEE_BPS` | `200` | 2% in basis points |
| `HOLLOW_CREATE_TINYBARS` | `50000000` | ≈0.5 ℏ surcharge for hollow-account creation |
| `NETWORK_FEE_BUDGET_TINYBARS` | `100000` | Tiny buffer for network fees |
| `DETECTOR_POLL_INTERVAL_MS` | `500` | Mirror-node poll cadence |
| `EXECUTOR_CONCURRENCY` | `4` | Parallel forward workers |
| `API_PORT` | `3001` | Backend HTTP port |
| `API_CORS_ORIGIN` | `http://localhost:3000` | Comma-separated origins |

## State machine

```
detected → validated → forwarding → forwarded → confirmed
                ├→ kept_malformed                    (terminal, 100% to treasury)
                └→ below_minimum                     (terminal, 100% to treasury)
forwarding    → failed_retry → forwarding …         (exponential backoff)
failed_retry  → operator_review (after 5 attempts)  (terminal, manual resolution)
```

## Deploy (free tier, zero-cost)

1. **Neon** free Postgres → create project, grab `DATABASE_URL`
2. **Fly.io** backend:
   ```bash
   fly launch --no-deploy         # uses fly.toml
   fly secrets set \
     DATABASE_URL="postgres://…" \
     OPERATOR_ACCOUNT_ID=0.0.X \
     OPERATOR_PRIVATE_KEY=0x… \
     TREASURY_ACCOUNT_ID=0.0.Y
   fly deploy
   ```
3. **GitHub Pages** frontend:
   - Repo Settings → Pages → source `GitHub Actions`
   - Repo Settings → Variables → add `NEXT_PUBLIC_API_BASE=https://0x-hbar.fly.dev`
   - Push to `main` → `pages.yml` workflow builds and deploys

## API surface

Read-only HTTP on `API_PORT`:

- `GET /health`
- `GET /stats`
- `GET /txs?limit=50&before=<id>`
- `GET /tx/:id`  → `{ tx, events[] }`
- `GET /config/public`
- `GET /sse`  → `hello`, `ping`, `tx.upserted` events

## Security

- `.env` is git-ignored. Operator key never enters the repo.
- Explorer is read-only; no write endpoints exposed.
- CORS whitelisted to configured origins.
- Idempotency: every inbound has a `UNIQUE(consensus_timestamp)` constraint.
  Outbox executor uses `SELECT FOR UPDATE SKIP LOCKED` to avoid double-forward.

## Architecture caveats

- **No gRPC account streaming**: Hedera mirror node gRPC is HCS-topic only, not
  account transactions. The 500ms REST poll is what every production Hedera
  app uses. If we outgrow it, swap in Hgraph GraphQL subscriptions behind the
  `MirrorClient` interface.
- **Hollow account auto-create**: first-time EVM destinations cost ≈0.5 ℏ,
  factored into the computed minimum.
- **"Auto-refund" for bad memos doesn't work**: the sender of an exchange
  withdrawal is the exchange hot wallet, not the user. Refunding there
  orphans funds. Policy: keep 100% in treasury for malformed memos.
