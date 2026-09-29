# Kodranni surfaces

**Date:** 2026-09-29  
**Status:** Decided. The desk, the new commands, and the new public paths are not the code you run today.  
**Detail:** [decisions.md](./decisions.md) · **Built vs decided:** [status.md](./status.md) · **Hosting lock:** [hosting.md](./hosting.md)

The Guidebook is the rules. This file is who touches which surface. The Automation chapter stays as it is until this table is accepted in so many words.

Hungarian word lock: [hungarian-lexicon.md](./hungarian-lexicon.md). Character-map seating math: `apps/campaign-ui/docs/character-map.md`.

---

## Surfaces

| Surface | Role |
|---------|------|
| **Guidebook** (`kodranni.com`) | Rules. One public book. |
| **Campaign UI** | The hall, the hierarchy, the character map, and the sheets. Players see this on the campaign hostname. On the machine that holds the store, the same pages are the **Storyteller Desk**. |
| **Discord** | Hands at the table: dice, Words, the Tide card, the scene board the players read. |
| **Fluxer** | The same command contract, later. The adapter is unwired. |

One process holds SQLite, the campaign UI, and the Discord handler. The desk is those pages with tools, on loopback. It is not a second app. Emissary’s human face is the desk status strip.

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
| `/roll` for the character bound to that account | Chat. `/select` only when the account has more than one living character. |
| `/roll` for a sheeted NPC | Chat. The Storyteller passes the slug. The sheet supplies the numbers. |
| `/npc-roll` for someone with no sheet | Chat. Storyteller. A label, foundation dice, skill dice, a tier. |
| `/intent` | Chat. Storyteller posts an agreed pool for a named player. Kept. |
| Opposed roll, Tide-linked roll | A reply to the channel result, or to the Tide card. The result is a channel message. |
| Open, show, step, and close a Tide | One channel card. Selectors, side dyes, a rendered image of the Guidebook bar, replaced on every linked roll. Close is a Storyteller button on that card. |
| Scene Omen faces | Edited, added, and removed on the desk. The channel board is rewritten on save. Players read faces and effects there. |
| `/create`, `/claim`, Birth Omen, Guiding Hand, `/award-word` | Chat. Private dice stay ephemeral to that player and the Storyteller. |
| Mark the person a claim was about | Desk fields on that person. |
| Prep spends and The Wanting | The player’s sheet, while creation is unlocked. |
| Confirm | A chat notification, and a row on the desk stack. |
| Approve or Reject | Desk, after the Storyteller edits the submitted person. |
| `/review` | Reposts the notification. |
| Restore | Desk table. Select people. Each row spends food or not, spends water or not, and restores a typed number of Exertion points or not. Chat only notifies the targeted players, ephemerally, when any were targeted. |
| Harm outside a roll, Dying, stabilising, Traits, inventory days moved between people | The person, on the desk. |
| Harm from a roll just shown | That result card. |
| Diagram | Desk. Unassigned pool, drag onto ladders, porch, crown, Done. A move is spoken, then made here. |
| Fortunes | Desk. The Guidebook’s five buttons. |
| Factions and tags | Desk. Factions live inside categories, with a colour and an optional icon. |
| Character map | Download the canvas (public). Edit in Obsidian. Upload only on the desk. |
| Echoes, Practice, armour | Desk, and the owner’s sheet while creation is unlocked. |
| Bind Discord and Fluxer | Desk. The book states both. The adapter is built alongside the Discord commands. |
| Undo the last roll | One Storyteller control on that result card. |

---

## Already built, still behind this table

Aspalath’s hall, hierarchy, character map, and sheets are the visual reference. Creation on the sheet is the older dock. Discord still registers `/focus`, `/st-roll`, `/reclaim`, `/map`, and `/live`. Discord bind is a plate on the hall. The public address is still `kodranni.com/community/?campaign=`. Fluxer throws. The host walkthrough has never been signed.

The Automation chapter now follows this table, in English and Hungarian. The gap between the table and the code is listed in [status.md](./status.md). The desk shell is the hall on loopback. Later steps stay unbuilt until asked.

---

## Commands after this lock

Kept in chat: `/create`, `/claim`, `/select`, `/roll`, `/intent`, `/npc-roll`, `/birth-omen`, `/guiding-hand`, `/award-word`, `/tide`, `/review`.

Leave: `/focus` (renamed `/select`), `/st-roll` (becomes `/npc-roll`), `/map`, `/reclaim`, `/live`. Scene Add on a Discord card does not ship. Discord and Fluxer share this list. The Fluxer adapter is still unwired; it is brought up with the Discord command work, not after the rest of the desk.
