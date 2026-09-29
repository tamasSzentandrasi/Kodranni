# Status

**Date:** 2026-09-29  
**Decisions:** [overview.md](./overview.md) · [decisions.md](./decisions.md) · [hosting.md](./hosting.md)

This file says what the tree does today. The desk, `/select`, `/npc-roll`, Restore, the scene editor, the Tide card, and `https://<slug>.kodranni.com/` are decisions. They are not this build.

---

## Guidebook

The book is the rules authority. The Automation chapter matches the responsibility table in [overview.md](./overview.md), in English and Hungarian. It treats Discord and Fluxer as the same chat contract. Player-facing pages do not link `docs/plans/`.

The August Starlight programme notes are retired. The visual lock that matters is in the book and in `public-root/design/tokens.css` (and the campaign-ui copies): dark, Bellefair, blood `#a01818`, silver, black `#050505`.

Hungarian terms stay in [hungarian-lexicon.md](./hungarian-lexicon.md). That file was not re-audited against later English chapters.

---

## Campaign UI

Aspalath’s hall, hierarchy, character map, and sheets are the visual and functional reference. Seating math for the rose is `apps/campaign-ui/docs/character-map.md`. The Storyteller still publishes the canvas; in-browser graph editing was never the design, and the new lock keeps it that way (download, Obsidian, desk upload).

Creation on an unlocked sheet is still `creation-client.js`, loaded from `DraftPanel.astro` and the character page. It is behind the Guidebook’s creation flow.

`/operator` and `/community/setup/` are still the loopback desk: found, bind Discord, snapshot. The decision replaces them with tools on the hall, the diagram, and the sheet, gated by loopback plus `kod_desk=1`. That gate is not built. `kod_setup` is still the setup cookie.

A new community from `emptyCommunity()` stores unfounded Steady (2) on all five Fortunes, axes Arms / Faith / Coin / Blood, and two empty label groups (Factions and Tags). Decisions want many faction categories, a colour and an optional icon, and Guidebook fortune buttons. The store has `hue` on a label and no icon field. Pending hierarchy move requests still exist on the community type; the decision drops that queue.

The public path in the running product is still `kodranni.com/community/?campaign=<slug>`. The edge still reads the campaign from that URL shape.

---

## Discord

Registered today (`adapters/discord/src/commands.ts`):

| Command | Today | This lock |
|---------|--------|-----------|
| `/create`, `/claim` | Present | Stay |
| `/birth-omen`, `/guiding-hand`, `/award-word` | Present | Stay |
| `/roll`, `/intent` | Present | Stay. Storyteller `/roll` gains an optional sheeted-NPC slug. |
| `/focus` | Sets which of a member’s characters `/roll` assumes | Renamed `/select`. Same job. |
| `/review` | Reposts the pending review | Stays, as a notification only |
| `/st-roll` | Label plus two integers | Becomes `/npc-roll` |
| `/reclaim` | Fills Exertion from chat | Goes. Restore is the desk table. |
| `/map` | Emergency account bind | Goes. Binding is a desk field. |
| `/live` | Ephemeral live/archive URLs | Goes. One public name. |

Also still true of the bot, and called out because the book or the lock says otherwise:

- Oppose on a result card is a stub that tells you to reply with `/roll`. The lock is that reply, with the result in channel. The link is not stored as a real oppose yet.
- Echo on confirm is a boolean (“applies”), not a named Echo from the sheet.
- Die-tier copy in the bot still says “Equal”. The Guidebook says Ordinary.
- Harm buttons are on the result card, which the lock keeps. Multi-track harm from one card is still thin.
- Avatar upload on the edit link was hardened and still wants a retest.
- There is no Tide command, no scene board, and no rendered tide image.
- Group Echo stakeholders are not seeded from the hierarchy.

The Guidebook already states Fluxer’s contract as Discord’s peer. The adapter (`adapters/fluxer/src/index.ts`) still throws `Fluxer adapter not connected — session runtime pending`. Credentials can sit in the environment. Making that adapter real — bind plate, command list, server, channel, and role — rides with the Discord command work.

---

## Host

`kodranni`, `start`, `stop`, `status`, and `emissary` are the verbs. The README runbook matches that code, including the operator picker and `?campaign=`. It is the current runbook, not the desk in [decisions.md](./decisions.md).

The hosting shape in [hosting.md](./hosting.md) (one process, KV snapshot, Worker, device key, bot token off the host) is the lock and is largely what the tree was built toward in late August. Two caveats:

- The host walkthrough that used to sit with the old plan pile was never signed. “Verify-ready” was a label on a blank checklist. The host loop is unsigned. A new script waits until the desk exists.
- Named-tunnel mode is still in the CLI. When `tunnel_mode=named` is missing a token, name, or config, emissary points at [hosting.md](./hosting.md). That mode is interim. The locked product mints the tunnel on the Worker for the session. Park-process is not the archive.

The emissary JSON page is still the readiness document. The decision turns its human face into the desk strip. The CLI check can stay.

---

## Left in place on purpose

- Product code: campaign UI, bot, store, edge. The Guidebook pass did not change them.
- [hungarian-lexicon.md](./hungarian-lexicon.md).
- `apps/campaign-ui/docs/character-map.md`.
