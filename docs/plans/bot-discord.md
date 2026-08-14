# Discord bot-runtime (Slice D)

Bots call **`@kodranni/app` in-process** — never the CLI.

## Run

Terminal A (live UI + tunnel):

```bash
npm run kodranni -- live --slug vardmark --tunnel
```

Terminal B (bot):

```bash
export DISCORD_BOT_TOKEN="..."
export DISCORD_GUILD_ID="..."
# optional: post access card on start
export DISCORD_PLAY_CHANNEL_ID="..."

npm run kodranni -- bot --slug vardmark
```

Invite the bot with `applications.commands` + `bot` scopes; guild commands register on connect.

## Table flow (lightweight)

1. **ST once:** `/kod-map user:@Player character:leifr role:player`  
   `/kod-map user:@You character:torvald role:storyteller` (ST needs a member role for Harm)
2. **ST sets fiction:** `/kod-prompt foundation:Authority skill:Command tier:8`  
   → card with **Roll**
3. **Player:** presses **Roll** (defaults: no Exertion, no Echo)  
   or `/kod-roll foundation:… skill:…` with options
4. **Result card:** Marks first · Why this pool? · Harm (ST) · Exertion reclaim (ST)
5. **ST Harm:** **Harm** → card with points precalculated (physical / armour ratio) → **All → Track**

Live sheet links use `runtime/live.url` or campaign `live_base_url`.

## Commands

| Command | Who | Effect |
|---------|-----|--------|
| `/kod-map` | ST | Map Discord user → character (+ role) |
| `/kod-prompt` | ST | Post one-tap Roll card |
| `/kod-roll` | Player | Roll mapped character |
| `/kod-st-roll` | ST | NPC numeric pool |
| `/kod-live` | Anyone | Ephemeral live/archive URLs |

## Next (not in this slice)

- Oppose parent_roll_id linking  
- Mental/social harm family picker  
- Split harm across tracks  
- Fluxer parity  
- `session start` auto-spawns bot when token present  
- Archetype dual-spectrum skill menus  
