# Kodranni

**Pre-industrial. Human. Grim.**

A tabletop RPG for campaigns where ordinary people face unforgiving conditions, the **community** is the true protagonist, and legacy outlives the individual.

This repo is the **product entry**: Guidebook + local Storyteller automation (SQLite source of truth, live campaign UI, Discord bot). Campaign public sites are spawned presentation instances — not the database.

---

## What you run at the table

| Surface | Role |
|---------|------|
| **Discord** | Hands — `/create`, `/roll`, `/intent`, Weighing dice, Harm |
| **Live sheet** (`kodranni.…` while session is up) | Person — spends, Wanting, Echoes, Inventory, Confirm |
| **Archive** (Pages, later) | Between-session read-only face |

Guidebook truth: fiction names Foundation + Skill + die tier → player confirms Exertion and whether an **Echo applies** → Marks are information, not pass/fail.

---

## Storyteller host (no npm at the table)

Install the Linux tarball, then:

```bash
packaging/linux/install-user.sh
kodranni --name "Your campaign"
# optional restore: kodranni --name "Your campaign" --from ./snapshot.json
kodranni start
kodranni stop
```

Players open `https://kodranni.com/community/?campaign=<id>` (Vardmark showcase is `https://demo.kodranni.com/community/`). On the operator desk: invite the official Discord app, then pick guild, play channel, and Storyteller role. The bot token stays on the Worker.

Own domain means **own hosting** (deploy `apps/edge` on your Cloudflare). See `docs/plans/storyteller-host.md`.

### Dev (this repo)

```bash
npm ci
npm run kodranni -- --name "Your campaign"
npm run kodranni -- start
```

Vardmark demo (author machine): `npm run kodranni -- campaign seed-demo` then `kodranni start --slug vardmark`.

---

## Table flow (short)

1. Player `/create` → personal sheet link (edit token) → spend on **Core** / Wanting / Echoes / Inventory → **Confirm**.
2. ST Approve on the review card (`/review` fallback).
3. Weighing on Discord only: `/birth-omen`, `/guiding-hand`; Words via `/award-word` (Wanting on the sheet).
4. Rolls — **two equal paths**:
   - ST `/intent @player skill:…` (autocomplete) → player **Roll** → confirm → Cast
   - Player `/roll skill:…` (autocomplete) → same confirm (all **9** Foundations easy to change; Echo = **applies when agreed**) → Cast
5. Result card: **Marks first**, die-tier language, sheet Link, ST **Harm**. Exertion restore is `/reclaim`, not a result-card button.

---

## Guidebook (authors)

```bash
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm test
```

Content: `src/content/docs/`. Deploy: GitHub Pages on `main`.

---

## Layout

| Path | What |
|------|------|
| `src/content/docs/` | Guidebook |
| `packages/domain` · `app` · `store` | Rules + services + SQLite SoT |
| `apps/campaign-ui` | Live sheets + community tracker |
| `apps/bot-runtime` · `adapters/discord` | Discord table |
| `apps/cli` | ST ops (`kodranni …`) |
| `~/.kodranni/campaigns/<slug>/` | Private campaign data + `campaign.toml` |
| `~/.kodranni/secrets/` | Durable machine secrets |

---

## Status

| Area | State |
|------|--------|
| Guidebook | Living |
| Live UI + tunnel + emissary | Yes — `kodranni start` / `stop` |
| Discord (create / roll / intent / Harm / `/reclaim`) | Yes — bind from the operator desk picker |
| Reconstructible demo | `campaign seed-demo` (author). Players Found a **campaign name** |
| Archive / one hostname | KV snapshot + Worker. Dark = no host process |
| DevSecOps | **Verify-ready** — [manual-test-plan.md](docs/plans/manual-test-plan.md) |
| Fluxer | Creds load; adapter pending |

Plans: [infra-devsecops.md](docs/plans/infra-devsecops.md) · [automation-status.md](docs/plans/automation-status.md) · [bot-discord.md](docs/plans/bot-discord.md) · [live-tunnel.md](docs/plans/live-tunnel.md) · [automation-architecture.md](docs/plans/automation-architecture.md)

## License

See [LICENSE](LICENSE).
