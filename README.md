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

`kodranni --name` is the setup. It refuses `www`, `demo`, `play`, and a name that starts with `origin-`, writes the empty campaign on this machine, registers that name, publishes the empty hall, and opens the desk at `http://127.0.0.1:8742/`. The public name is `https://<slug>.kodranni.com/`. Opening the same name again leaves the campaign as it is. If the edge cannot take the name, the desk still opens. `demo.kodranni.com` stays the showcase for Aspalath. `?campaign=` still works on `kodranni.com`. After setup, customisation, the night, and Discord and Fluxer are the desk. The process is in `docs/plans/hosting.md`. The bot token stays on the Worker.

Own domain means **own hosting** (deploy `apps/edge` on your Cloudflare). See `docs/plans/hosting.md`.

### Dev (this repo)

```bash
npm ci
npm run kodranni -- --name "Your campaign"
npm run kodranni -- start
```

Aspalath demo (author machine): `npm run kodranni -- campaign seed-demo` then `kodranni start --slug aspalath`.

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
| Discord (create / roll / intent / Harm / `/reclaim`) | Yes — bind from the hall on this machine |
| Reconstructible demo | `campaign seed-demo` (author). Players Found a **campaign name** |
| Archive / one hostname | KV snapshot + Worker. Dark = no host process |
| Host loop | Unsigned — [status.md](docs/plans/status.md) |
| Fluxer | Creds load; adapter pending |

Plans: [overview.md](docs/plans/overview.md) · [decisions.md](docs/plans/decisions.md) · [status.md](docs/plans/status.md) · [hosting.md](docs/plans/hosting.md). Hungarian word lock: [hungarian-lexicon.md](docs/plans/hungarian-lexicon.md).

## License

See [LICENSE](LICENSE).
