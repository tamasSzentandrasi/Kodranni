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
4. **Two equal roll paths** (fiction agreement first):
   - **Intent:** ST `/intent player:@Player skill:…` (autocomplete) → channel card → player **Roll** → same confirm stance (Foundation easy to change; Exertion; **Echo applies?** when agreed) → Cast.
   - **Free roll:** player `/roll skill:…` (autocomplete) → ephemeral confirm → Cast. Omit skill → Archetype→Skill **fallback only**, then the same confirm.
5. Foundation often is **not** the skill’s guiding foundation — confirm always shows all 9.
6. **Echo** is agreed apply, not a spend.
7. **Result card:** Marks-first · die-tier language · Omen · Why this pool? · **Harm** (ST) · Link button to sheet.

Emergency only: `/map`. Prefer create → Confirm → Approve.

Live sheet links use `runtime/live.url` or campaign `live_base_url`.

## Storyteller recognition

Prefer a durable Storyteller role ID that survives campaign recreate:

| File under `~/.kodranni/secrets/` | Env | Also written into |
|-----------------------------------|-----|-------------------|
| `discord-storytellerRoleID` | `DISCORD_STORYTELLER_ROLE_ID` | `campaign.toml` → `discord_storyteller_role_id` via seed/sync-defaults |
| `fluxer-storytellerRoleID` | `FLUXER_STORYTELLER_ROLE_ID` | `fluxer_storyteller_role_id` |

```bash
printf '%s\n' '123456789012345678' > ~/.kodranni/secrets/discord-storytellerRoleID
chmod 600 ~/.kodranni/secrets/discord-storytellerRoleID
npm run kodranni -- campaign sync-defaults --slug vardmark
```

Anyone with that guild role is treated as Storyteller for `/review`, Harm, `/intent`, Approve buttons, etc. Fallback remains `MemberRecord.role = storyteller` from emergency `/map`.

## Commands

| Command | Who | Effect |
|---------|-----|--------|
| `/create` | Player | Start draft + sheet URL (bot stores initiator) |
| `/claim` | Player | Claim claimable prebuilt |
| `/focus` | Player | Active character when multi-PC |
| `/roll` | Player | Agreed pool — skill autocomplete → confirm → Cast |
| `/intent` | ST | Post agreed pool for **named player** (equal peer to `/roll`) |
| `/birth-omen` | Table | Private d20 → Foundation points on sheet |
| `/guiding-hand` | Table | Private d20 → Skill points on sheet |
| `/award-word` | ST | +1 Word to speaker (Wanting on sheet) |
| `/st-roll` | ST | NPC numeric pool |
| `/live` | Anyone | Ephemeral live/archive URLs |
| `/map` | ST emergency | Force-bind account → character |

Product names only — legacy `kod-*` aliases removed.

## Next (U5+)

- Intent ∥ free-roll as equals (autocomplete + confirm card; Echo = agreed apply)  
- Oppose parent_roll_id linking  
- Mental/social harm family picker  
- Split harm across tracks  
- Fluxer prefix parity  
- Archetype→Skill fallback only when skill name forgotten  

