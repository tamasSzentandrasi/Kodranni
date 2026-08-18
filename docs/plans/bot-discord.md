# Discord bot-runtime (Slice D)

Bots call **`@kodranni/app` in-process** — never the CLI.

## Run

Terminal A (live UI + tunnel):

```bash
npm run kodranni -- live --slug vardmark --tunnel
```

Terminal B (bot):

Secrets are files under `~/.kodranni/secrets/` (never in git). The CLI and bot-runtime load them into env; an already-set env var wins.

| File | Env |
|------|-----|
| `discord-botToken` | `DISCORD_BOT_TOKEN` |
| `discord-serverID` | `DISCORD_GUILD_ID` |
| `discord-playChannelID` | `DISCORD_PLAY_CHANNEL_ID` (access card on start) |
| `discord-appID` | `DISCORD_APP_ID` |
| `discord-publicKey` | `DISCORD_PUBLIC_KEY` (gateway unused) |
| `fluxer-botToken` | `FLUXER_BOT_TOKEN` |
| `fluxer-serverID` | `FLUXER_GUILD_ID` |
| `fluxer-playChannelID` | `FLUXER_PLAY_CHANNEL_ID` |
| `fluxer-appID` | `FLUXER_APP_ID` |
| `fluxer-clientSecret` | `FLUXER_CLIENT_SECRET` |
| `cf-tunnel-token` | `KODRANNI_CF_TUNNEL_TOKEN` |

```bash
# optional: source ~/.kodranni/secrets/env.sh
npm run kodranni -- bot --slug vardmark
```

Invite the bot with `applications.commands` + `bot` scopes; guild commands register on connect.

Fluxer files load the same way. The Fluxer adapter is not connected yet — credentials sit in env until that gateway is wired.

## Table flow (lightweight)

1. **Startup:** bot posts **live sheet URL** card in play channel (if configured).
2. **Player:** `/create name:…` → draft + personal sheet link (identity for Confirm @mention).  
   Edit spends on the **sheet**. **Confirm · return to table** → bot posts review card (fallback: ST `/review`) → ST **Approve**.
3. **Weighing dice (bot only):** `/birth-omen character:…` · `/guiding-hand character:…`  
   Points land on the unlocked sheet.
4. **ST Intent:** `/intent player:@Player skill:Command` → card; only that player may **Roll**.
5. **Player free roll:** `/roll skill:…` (foundation defaults to guiding; optional override).
6. **Result card:** Marks · Omen · Why this pool? · **Harm** (ST) · Exertion reclaim (ST).

Emergency only: `/map` (legacy `/kod-map`). Prefer create → Confirm → Approve.

Live sheet links use `runtime/live.url` or campaign `live_base_url`.

## Commands

| Command | Who | Effect |
|---------|-----|--------|
| `/create` | Player | Start draft + sheet URL (bot stores initiator) |
| `/claim` | Player | Claim claimable prebuilt |
| `/focus` | Player | Active character when multi-PC |
| `/roll` | Player | Free roll (Archetype/skill + foundation) |
| `/intent` | ST | Prefill roll for **named player** |
| `/birth-omen` | Table | Private d20 → Foundation points on sheet |
| `/guiding-hand` | Table | Private d20 → Skill points on sheet |
| `/award-word` | ST | +1 Word to speaker (Wanting on sheet) |
| `/st-roll` | ST | NPC numeric pool |
| `/live` | Anyone | Ephemeral live/archive URLs |
| `/map` | ST emergency | Force-bind account → character |

Legacy aliases still registered: `/kod-roll`, `/kod-prompt`, `/kod-map`, `/kod-live`, `/kod-st-roll`.

## Next

- Oppose parent_roll_id linking  
- Mental/social harm family picker  
- Split harm across tracks  
- True Discord DM for Intent whisper  
- Fluxer prefix parity  
- `session start` auto-spawns bot when token present  
- Archetype multi-step skill selects on Discord (25-option limits)  
