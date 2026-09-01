# Discord bot-runtime (Slice D)

Bots call **`@kodranni/app` in-process** — never the CLI.

## Run

Default Discord is **HTTP interactions** on the official app. The host never holds the bot token.

Discord Developer Portal → Interactions Endpoint URL: `https://kodranni.com/interactions`

```bash
kodranni start
```

HTTP ChatPort runs **inside campaign-ui**. Channel cards go Worker → Discord REST. Bind guild / play channel / ST role from the **operator desk picker** (saved in `campaign.toml`). The bot token lives on the Worker and in GitHub Actions for command registration.

Snowflake files under the secrets dir remain a **hatch** (env > file > toml). Default path: no `printf`.

| File (hatch) | Env | On the host? |
|------|-----|----------------|
| `discord-serverID` | `DISCORD_GUILD_ID` | picker writes toml instead |
| `discord-playChannelID` | `DISCORD_PLAY_CHANNEL_ID` | picker writes toml instead |
| `discord-appID` | `DISCORD_APP_ID` | Worker (invite URL) |
| `discord-storytellerRoleID` | `DISCORD_STORYTELLER_ROLE_ID` | picker writes toml instead |
| `discord-botToken` | `DISCORD_BOT_TOKEN` | **no** (Worker / CI). Hatch only: `KODRANNI_DISCORD_GATEWAY=1` |
| `discord-publicKey` | `DISCORD_PUBLIC_KEY` | Worker secret (Ed25519 verify) |
| `fluxer-botToken` | `FLUXER_BOT_TOKEN` | later adapter |
| `fluxer-serverID` | `FLUXER_GUILD_ID` | later adapter |
| `fluxer-playChannelID` | `FLUXER_PLAY_CHANNEL_ID` | later adapter |
| `fluxer-appID` | `FLUXER_APP_ID` | later adapter |
| `fluxer-clientSecret` | `FLUXER_CLIENT_SECRET` | later adapter |

```bash
# gateway hatch only (ST-owned token)
KODRANNI_DISCORD_GATEWAY=1 npm run kodranni -- bot --slug vardmark
```

Invite with `applications.commands` + `bot` scopes. Slash commands register from CI (`adapters/discord/src/register-commands.ts`), not from the host.

Fluxer files load the same way. The Fluxer adapter is not connected yet — credentials sit in env until that gateway is wired.

## Table flow (lightweight)

Product UX: [`visual-lock.md`](./visual-lock.md) §6.7–6.8. Below is **shipped** `bot-runtime` behaviour.

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

Not shipped: Archetype `<select>` then skill `<select>` filtered by that archetype (`packages/chat-ui`). Ephemeral only for Weighing results, personal edit URL if that command remains, command-author errors, not-live. Harm apply stays on the result card and the ST desk. `/live`, `?edit=`, `/map`: evaluate vs I1–I10 before removal.

## Storyteller recognition

Prefer the operator desk picker (guild + play channel + ST role) written into `campaign.toml`. Hatch: secret files + `campaign sync-defaults`.

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

