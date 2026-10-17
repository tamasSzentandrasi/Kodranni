# Status

**Date:** 2026-09-29  
**Decisions:** [overview.md](./overview.md) · [decisions.md](./decisions.md) · [hosting.md](./hosting.md)

This file says what the tree does today. The hall on loopback is the Storyteller desk, and the Session tab holds that night’s scene, the Tide reading, the approval inbox, Restore, and Discord bind. The source command list uses `/select` and `/npc-roll`. The channel Tide card and `https://<slug>.kodranni.com/` are not this build. The Discord application still has whatever was last registered.

---

## Guidebook

The book is the rules authority. The Automation chapter matches the responsibility table in [overview.md](./overview.md), in English and Hungarian. It treats Discord and Fluxer as the same chat contract. Player-facing pages do not link `docs/plans/`.

The August Starlight programme notes are retired. The visual lock that matters is in the book and in `public-root/design/tokens.css` (and the campaign-ui copies): dark, Bellefair, blood `#a01818`, silver, black `#050505`.

Hungarian terms stay in [hungarian-lexicon.md](./hungarian-lexicon.md). That file was not re-audited against later English chapters.

---

## Campaign UI

Aspalath’s hall, hierarchy, character map, and sheets are the visual and functional reference. Seating math for the rose is `apps/campaign-ui/docs/character-map.md`. The Storyteller still publishes the canvas; in-browser graph editing was never the design, and the new lock keeps it that way (download, Obsidian, desk upload).

Creation on an unlocked sheet is still `creation-client.js`, loaded from `DraftPanel.astro` and the character page. It is behind the Guidebook’s creation flow.

The hall on loopback is the Storyteller desk. Opening `127.0.0.1` is the desk; the public address stays the live hall. There is no desk cookie and no Discord/Fluxer strip on the hall. Snapshot download and restore sit on the notebook page. `/operator`, `/community/setup/`, `GET /emissary`, and `kod_setup` are gone. Players still open `kodranni.com/community/?campaign=<slug>`.

A new community from `emptyCommunity()` stores unfounded Steady (2) on all five Fortunes, axes Arms / Faith / Coin / Blood, and two empty label groups (Factions and Tags). Decisions want many faction categories, a colour and an optional icon, and Guidebook fortune buttons. The store has `hue` on a label and no icon field. Pending hierarchy move requests still exist on the community type; the decision drops that queue.

The public path in the running product is still `kodranni.com/community/?campaign=<slug>`. The edge still reads the campaign from that URL shape.

---

## Discord

The source list in `adapters/discord/src/commands.ts` is `/roll`, `/intent`, `/create`, `/claim`, `/select`, `/birth-omen`, `/guiding-hand`, `/award-word`, `/review`, and `/npc-roll`. `/focus`, `/st-roll`, `/reclaim`, `/map`, and `/live` are not in that list. Registering them with Discord is a separate operator step; this tree does not perform it.

`/roll` still takes the player’s Skill, Foundation, die tier, Exertion, and a named Echo. The Ready card shows the computed pool, the tier word Ordinary, and a select of that sheet’s Echoes. Cast is what posts the result. A Storyteller may pass a sheeted person’s name. `/select` sets the focused character when the account has more than one living character, and says it is unused when there is one. `/npc-roll` is the sheetless roll and names the Omen. `/review` reposts that someone is waiting on the Session inbox, with no sheet link.

Oppose on the result card opens that player’s Ready card already tied to the roll. Undo is a Storyteller button on the same card. Harm is a select of tracks. Restore’s private notice is written for a bound account and stays quiet for everyone else.

Still unbuilt:

- `/tide`, the channel Tide picture, and the scene board.
- Fluxer listing. The Session tab leaves Fluxer out until a server can be listed.
- Group Echo stakeholders are not seeded from the hierarchy.

The Guidebook already states Fluxer’s contract as Discord’s peer. The adapter (`adapters/fluxer/src/index.ts`) still throws `Fluxer adapter not connected — session runtime pending`. Credentials can sit in the environment. Making that adapter real — bind plate, command list, server, channel, and role — rides with the Discord command work.

---

## Host

`kodranni`, `start`, `stop`, `status`, and `emissary` are the verbs. The README runbook matches this binary: bind from the hall on loopback, and players still use `?campaign=`. Subdomains stay in [decisions.md](./decisions.md).

The hosting shape in [hosting.md](./hosting.md) (one process, KV snapshot, Worker, device key, bot token off the host) is the lock and is largely what the tree was built toward in late August. Two caveats:

- The host walkthrough that used to sit with the old plan pile was never signed. “Verify-ready” was a label on a blank checklist. The host loop is unsigned. The desk shell is on the hall. A signed host script is still later work.
- Named-tunnel mode is still in the CLI. When `tunnel_mode=named` is missing a token, name, or config, emissary points at [hosting.md](./hosting.md). That mode is interim. The locked product mints the tunnel on the Worker for the session. Park-process is not the archive.

The Session tab is where the night is opened and read. `kodranni emissary` stays the CLI check. `GET /emissary` is gone.

---

## Left in place on purpose

- Diagram drag, sheet field editors, the creation stack, the channel Tide card, Fluxer listing, and subdomains.
- [hungarian-lexicon.md](./hungarian-lexicon.md).
- `apps/campaign-ui/docs/character-map.md`.
