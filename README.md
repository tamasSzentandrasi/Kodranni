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

## One-time machine setup

```bash
cd /path/to/Kodranni
npm install

mkdir -p ~/.kodranni/secrets && chmod 700 ~/.kodranni/secrets
# Discord
printf '%s\n' '<bot-token>'     > ~/.kodranni/secrets/discord-botToken
printf '%s\n' '<guild-id>'      > ~/.kodranni/secrets/discord-serverID
printf '%s\n' '<play-channel>'  > ~/.kodranni/secrets/discord-playChannelID
printf '%s\n' '<st-role-id>'    > ~/.kodranni/secrets/discord-storytellerRoleID
# Named Cloudflare tunnel (optional but recommended)
printf '%s\n' '<cf-run-token>'                > ~/.kodranni/secrets/cf-tunnel-token
printf '%s\n' 'https://kodranni.yourdomain.com' > ~/.kodranni/secrets/cf-tunnel-hostname
# Sheet edit HMAC
printf '%s\n' "$(openssl rand -hex 32)" > ~/.kodranni/secrets/sheet-token-secret
chmod 600 ~/.kodranni/secrets/*
```

Secrets survive `campaign destroy` / `seed-demo --force`. Tokens are **not** written into `campaign.toml`.

---

## Session (Storyteller)

```bash
# Reconstructible demo (auto-fills tunnel mode, hostname, ST role from secrets)
npm run kodranni -- campaign seed-demo --force

# Preferred: one supervisor — live UI + named tunnel + Discord bot
npm run kodranni -- session start --slug vardmark --tunnel --bot

# Status / stop
npm run kodranni -- session status --slug vardmark
npm run kodranni -- session end --slug vardmark

# Readiness (what to share mid-session)
npm run kodranni -- emissary --slug vardmark
```

Re-apply secrets into an existing campaign without wiping data:

```bash
npm run kodranni -- campaign sync-defaults --slug vardmark
```

Still works as separate processes if you prefer:

```bash
npm run kodranni -- live --slug vardmark --tunnel   # terminal A
npm run kodranni -- bot --slug vardmark               # terminal B
```

---

## Table flow (short)

1. Player `/create` → personal sheet link (edit token) → spend on **Core** / Wanting / Echoes / Inventory → **Confirm**.
2. ST Approve on the review card (`/review` fallback).
3. Weighing on Discord only: `/birth-omen`, `/guiding-hand`; Words via `/award-word` (Wanting on the sheet).
4. Rolls — **two equal paths**:
   - ST `/intent @player skill:…` (autocomplete) → player **Roll** → confirm → Cast
   - Player `/roll skill:…` (autocomplete) → same confirm (all **9** Foundations easy to change; Echo = **applies when agreed**) → Cast
5. Result card: **Marks first**, die-tier language, sheet Link button, ST Harm / Exertion tools.

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
| Live UI + named tunnel + emissary | Yes |
| Discord bot (create / roll / intent / Wanting / Harm) | Yes — restart bot after pulls to refresh slash cmds |
| Reconstructible demo + secret auto-fill | Yes |
| Session supervisor (`session start --tunnel --bot`) | Yes |
| Archive / one hostname | Kernel + snapshot + edge Function in-repo. `session end` no longer parks by default. See [infra-devsecops.md](docs/plans/infra-devsecops.md) |
| Fluxer | Creds load; adapter pending |

Plans: [infra-devsecops.md](docs/plans/infra-devsecops.md) · [automation-status.md](docs/plans/automation-status.md) · [bot-discord.md](docs/plans/bot-discord.md) · [live-tunnel.md](docs/plans/live-tunnel.md) · [automation-architecture.md](docs/plans/automation-architecture.md)

## License

See [LICENSE](LICENSE).
