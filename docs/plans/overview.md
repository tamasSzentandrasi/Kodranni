# Kodranni surfaces

**Date:** 2026-10-22  
**Status:** Discord is the table. Fluxer keeps the card and is not started. The desk is the hall on loopback, and Session is its night tab.  
**Detail:** [decisions.md](./decisions.md) · **Chat cards:** [chat.md](./chat.md) · **Built vs decided:** [status.md](./status.md) · **Hosting lock:** [hosting.md](./hosting.md)

The Guidebook is the rules. This file is who touches which surface. Automation in English and Hungarian follows the responsibility table below.

Hungarian word lock: [hungarian-lexicon.md](./hungarian-lexicon.md). Character-map seating math: `apps/campaign-ui/docs/character-map.md`.

---

## Surfaces

| Surface | Role |
|---------|------|
| **Guidebook** (`kodranni.com`) | Rules. One public book. |
| **Campaign UI** | The hall, the hierarchy, the character map, and the sheets. Players see this on the campaign hostname. On the machine that holds the store, the same pages are the **Storyteller Desk**. |
| **Discord** | Hands at the table: dice, Words, the Tide card, the scene board the players read. The roll card is [chat.md](./chat.md). |
| **Fluxer** | The same card as Discord, kept until Fluxer can hold the same controls. The Session tab saves the server, the play channel, and the Storyteller role. Discord is the table. |

One process holds SQLite, the campaign UI, and the Discord handler. The desk is those pages with tools, on loopback. It is not a second app. The Session tab is where the Storyteller opens the night and where players read the scene and the Tide.

---

## Addresses

| Name | What |
|------|------|
| `https://kodranni.com/` | Landing and Guidebook. |
| `https://<slug>.kodranni.com/` | Hall. Live and archive are this same name. |
| `/hierarchy/` | Standing. |
| `/character-map/` | Relation hall. |
| `/characters/` and `/characters/<slug>/` | Sheets. |
| `http://127.0.0.1:8742/` | The same paths. One process is one campaign, so there is no slug. |

`www`, `demo`, and `play` are reserved. `demo.kodranni.com` redirects to the showcase. `/map/` stays free for a later geography of the campaign. The relation hall does not use it.

---

## Who does what

| Act | Where |
|-----|--------|
| `/roll` for the character bound to that account | Chat. `/select` names the active character, and chooses among them when the account has more than one. |
| `/roll` for a sheeted NPC | Chat. The Storyteller passes the slug. The sheet supplies the numbers. |
| `/npc-roll` for someone with no sheet | Chat. Storyteller. A label, foundation dice, skill dice, a tier. |
| `/intent` | Chat. Storyteller posts an agreed pool for a named player. Kept. |
| Opposed roll, Tide-linked roll | A reply to the channel result, or to the Tide card. The result is a channel message. |
| Found a campaign | One command: `kodranni --name "…"`. The public name is `https://<slug>.kodranni.com/`. See [hosting.md](./hosting.md). |
| Open or end the public night | `kodranni start` and `kodranni stop`. The desk header keeps the Storyteller Desk switch. Go live and Turn off sit on Discord. Fluxer keeps its fields and is not started. |
| Open a Tide | Session tab. The channel card shows, steps, and closes it. |
| Scene Omen faces | Edited on the Session tab. Players read the faces there. The channel board is rewritten on save once that card exists. |
| `/create`, `/claim`, Birth Omen, Guiding Hand, `/award-word` | Chat. Private dice stay ephemeral to that player and the Storyteller. |
| Mark the person a claim was about | Desk fields on that person. |
| Prep spends and The Wanting | The player’s sheet, while creation is unlocked. |
| Confirm | A chat notification, and a row on the Session inbox. |
| Approve or Send back | Session tab, after the Storyteller edits the submitted person. |
| `/review` | Reposts the notification. |
| Restore | Session tab. Player characters are listed. Groups rest apart, and an NPC can be added to a group. Food days and water days step separately. Short rest and long rest apply the replenishment counsel from the ample food and water marks. |
| Harm outside a roll, Dying, stabilising, Traits, inventory days moved between people | The person, on the desk. |
| Harm from a roll just shown | That result card. |
| Diagram | Desk. Unassigned pool, drag onto ladders, porch, crown, Done. A move is spoken, then made here. |
| Fortunes | Desk. The Guidebook’s five buttons. |
| Factions and tags | Desk. Factions live inside categories, with a colour and an optional icon. |
| Character map | Download the canvas (public). Edit in Obsidian. Upload only on the desk. |
| Echoes, Practice, armour | Desk, and the owner’s sheet while creation is unlocked. |
| Bind Discord and Fluxer | Desk, on the Session tab. Invite the shared bot, then the server, the play channel, and the Storyteller role. Bound characters sit on a hover. |
| Undo the last roll | One Storyteller control on that result card. |

---

## Already built, still behind this table

Aspalath’s hall, hierarchy, character map, and sheets are the visual reference. Character creation is the shipped sheet. The source command list uses `/select` and `/npc-roll`; `/focus`, `/st-roll`, `/reclaim`, `/map`, and `/live` are out of that list. The Discord application still has the last guild registration. Actions has no bot token, so the edge step skips. Discord bind is on the Session tab. Players use `https://<slug>.kodranni.com/`. `?campaign=` still works on `kodranni.com`. `demo.kodranni.com` stays the Aspalath showcase. Fluxer uses that same Session tab plate and keeps the same card. Discord is the table. The host walkthrough has never been signed.

The Automation chapter now follows this table, in English and Hungarian. The gap between the table and the code is listed in [status.md](./status.md). The desk shell is the hall on loopback. Later steps stay unbuilt until asked.

---

## Commands after this lock

Kept in chat: `/create`, `/claim`, `/select`, `/roll`, `/intent`, `/npc-roll`, `/birth-omen`, `/guiding-hand`, `/award-word`, `/review`.

Leave: `/focus` (renamed `/select`), `/st-roll` (becomes `/npc-roll`), `/map`, `/reclaim`, `/live`. Scene Add on a Discord card does not ship. Discord and Fluxer share this list. On Fluxer the words follow `!`. Fluxer keeps the card and is not started.
