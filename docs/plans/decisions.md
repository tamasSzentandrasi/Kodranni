# Decisions

**Date:** 2026-09-29  
**Index:** the responsibility table in [overview.md](./overview.md). This file is the controls behind that table.  
**Hosting amendments:** [hosting.md](./hosting.md).

These are locked. Weighed options that were still open are closed here.

---

## Weighing

`/award-word` banks one Word on the speaker, for their own Wanting. The Storyteller marks the person who was spoken of by editing that person’s fields. The speaker does not choose the mark.

The desk shows the Word count. It has no control that grants a Word. A wrong Wanting purchase is corrected by editing fields. The Negative Trait’s name is still typed by the Storyteller. This matches the Guidebook and commit `90d3636`.

---

## Addresses

`kodranni.com` is the landing and the Guidebook. Each campaign is `https://<slug>.kodranni.com/` with `/hierarchy/`, `/character-map/`, `/characters/`, and `/characters/<slug>/`. Live and archive share that name. `?campaign=` goes away. Localhost uses the same paths and no slug.

Reserved: `www`, `demo`, `play`. `demo.kodranni.com` redirects to the showcase. `/map/` is reserved for a later campaign geography. The relation hall is `/character-map/`.

---

## Reply

An opposed roll is a reply to a channel result. A Tide-linked roll is a reply to the Tide card, or to a roll already tied to it. The result is a channel message. There is no Oppose button and no Tide button on a result card.

---

## How the desk becomes real

The desk is the campaign UI when the request is local.

**Who sees tools.** `isLocalDeskRequest`: the host is loopback, and the request did not arrive through the tunnel (`cf-ray`, `cf-connecting-ip`, `x-forwarded-host`). A cookie `kod_desk=1`, set only by a control that itself renders on loopback, turns tools on for that browser. The projected window leaves the cookie off and sees the player face. A forged cookie on the public name does nothing, because the tunnel check fails first. The Worker refuses desk writes. There is no `kod_setup` token. Player edit tokens stay what they are, and they freeze while a submission sits on the stack.

**Writes.** Desk actions POST to the campaign API. The handler rejects the call unless `isLocalDeskRequest`.

**What moves off operator.** Discord bind, snapshot download and restore, founding, and add-person leave `/operator` and `/community/setup/` and become plates on the hall, the diagram, and the sheet. Those routes are then removed. Fluxer bind is the same plate, beside Discord. The book already states that contract. The adapter is built alongside the Discord commands; until it can list a server, a channel, and a role, the plate has nothing to pick.

**Status strip**, on the desk layout only, replaces the emissary page:

- Session: down, desk, or live, and the public URL
- Discord bound or not; Fluxer bound or not
- Tunnel child up only while live
- Last snapshot time, and schema against this product
- Tide open or not; scene-face count
- Submissions waiting on the stack

---

## Scene Omen faces

Players see the active faces and what each one does. The list is session state. It stays out of `public.json`. Defaults **7** (positive) and **13** (negative) are always on, always shown, and are not rows in the editor.

Every other row is a face from 1–20 plus one line of effect (“4 — the patrol reaches the gate”). The Storyteller adds, edits, and removes those rows on the desk: edit the words in place, Save writes the session, Clear on a row deletes that row, Clear scene empties the list. Save rewrites the one channel board, so the table and the desk do not drift. A face that lands on a roll is named, with its effect, on that result card. The status strip repeats the count.

Discord can hold buttons and a select of 25 options. A modal holds at most five components. There is no repeating row control, and no way to open six existing lines, change the words, and save them as a list. Fluxer is expected to follow the same limits. The line editor is the desk. The channel card is the board the players read. It has no Add button.

The roller already accepts `sceneOmenFaces`. Nothing fills that list today.

---

## Tide

Chat owns the Tide. One open at a time. Session state, absent from the public snapshot. The desk strip shows whether one is open and does not edit it.

Opening is one Storyteller command, built from selectors:

- **Size** — small skirmish, skirmish, battle (1 / 2 / 3 Marks per step).
- **Footing** — the Guidebook presets, and which side holds them: equal (8 vs 8), slight advantage (8 vs 6), clearly superior (8 vs 12), severe disadvantage (6 vs 12). A type-weights path remains for a bar that matches none of those.
- **Side names** — two short fields.
- **Side colours** — one dye each, from the palette below. Discord has no colour wheel. The same selector is the control on Fluxer.

| Dye | Hex |
|-----|-----|
| Blood | `#a01818` |
| Wine | `#6e2438` |
| Rust | `#8c3d24` |
| Ember | `#c45c28` |
| Ochre | `#b8862e` |
| Straw | `#c6a45a` |
| Moss | `#5e6b3c` |
| Pine | `#2e4a3a` |
| Sea | `#3a5c6c` |
| Slate | `#5c6770` |
| Iron | `#6e655c` |
| Bone | `#d2c8b4` |

Blood is the book token. The other eleven are dyes that stay distinct on `#050505`. The same dye may be chosen twice; the renderer lightens the second fill one step so the marker stays readable.

The card is the Guidebook’s tide drawing: rail, two coloured fills, marker, the two collapse ends, the position written out. Discord cannot host that CSS, and Components v2 does not add a place to mount it. The session process renders the same component to an image and attaches it. Every linked reply edits that message and replaces the image, so the card shows the current marker, the last margin, and the last Omen step. A closed card keeps its last image and is marked closed. Edits are one per linked roll.

Derived, and not typed: track length (`weightA + weightB − 1`), start (weight A), Omen bands from size and footing (`packages/domain/src/tide.ts`).

A reply steps the marker by the Marks margin, and again when the Omen falls in a Tide band. Those two steps stay independent. A roll that is not a reply leaves the bar where it is. Close is a Storyteller button on the card. The session then forgets the open Tide. The card remains as history.

---

## Rolls

A sheet is for player characters and for NPCs who will return. A guard who appears once does not get one.

**`/roll` is the sheeted roll.** With no extra name it uses the character bound to the person who issued it. A player does not pass a slug for their own character.

**`/select` chooses which living character `/roll` assumes** when that account has more than one. One character means `/select` is unused. It is not an NPC tool and it is not a Storyteller tool. The command registered today as `/focus` becomes this.

**A Storyteller’s `/roll` accepts an optional slug.** That slug is a sheeted NPC or notable. Autocomplete is on the name. The service loads that sheet: effective Foundation, Skill, armour, pool floor, that person’s Exertion and Echoes, Decadence, over-capacity, Dying, Practice written back, Harm able to land on a real track. The Storyteller still chooses Foundation, Skill, tier, Exertion, and which Echo applies. The sheet supplies the numbers.

**`/npc-roll` is the person with no sheet.** A label, a foundation die-count, a skill die-count, a tier. Harm cannot land on a track. The numeric `/st-roll` becomes this command and keeps that limit.

**`/intent` stays.** The Storyteller posts an agreed pool for a named player. It was not retired.

There is no Roll button on a sheet. The channel is where the card has to appear.

---

## Character creation and approval

`/create`, `/claim`, Birth Omen, Guiding Hand, and `/award-word` stay in chat. Private dice stay ephemeral to that player and the Storyteller.

Confirm sends a notification and puts a submission on the desk stack. The channel message says who sent it and that it is waiting. It is not an approval form.

On the desk, the stack lists submissions in order. Opening one shows the character as they sent it. From there the Storyteller edits as they would any other person (Foundations, Skills, Traits, the mark owed, inventory). Then:

- **Approve** writes that edited record into play, locks creation, and binds the initiating player.
- **Reject** returns it as a draft, with those edits kept, and creation unlocks again.

The player’s edit token is frozen while the submission sits on the stack. `/review` only reposts the notification.

---

## Restore

`/reclaim` goes. One slash command filling a pool cannot say who was present, who ate, or who drank.

Restore is a desk table.

**Selection.** Search sheeted characters by name and tick who is in this rest. An optional saved set of slugs (“the road”, “the hall”) only fills the ticks. Recalling it is not a claim that those people are together. Add and remove rows before applying. One person is a selection of one.

**Each row, three columns.**

| Column | Control |
|--------|---------|
| Food | Spend one food day, or leave it. A row at zero days cannot spend. |
| Water | Spend one water day, or leave it. Same rule. |
| Exertion | A number the Storyteller types, including zero. The cell may be left empty, which writes nothing. |

Apply writes those three things for the selection, as one desk audit, and leaves everyone else untouched. The maximum stays derived. The number is clamped so current Exertion cannot pass that maximum.

**Chat.** When a selected person has a bound player, that player gets an ephemeral notice of what Restore wrote for them. NPCs and unbound names get no chat line. If nobody selected has a bound account, chat stays quiet.

**What stays on the person.** Harm tracks, Dying, stabilising (Dying clears, the track stays at 3, and the Trait that usually remains is asked for here), and moving food or water from one sheet to another. A father handing his portion to his son is two inventory edits, done before Restore if the fiction needs it. Restore spends or leaves the days each row already holds. Practice degrade is also on the person: the d20 bands propose which of the lowest skills fall, and the Storyteller confirms. It is not part of Restore.

---

## Hierarchy

People who have been created and not yet filed sit in an **Unassigned** pool. Drag a name onto a rung (Honoured, Trusted, Acknowledged, Outcast) of an axis. The same name can stand on several axes. Drag them to the porch to make them an Outsider, which clears axis placements. Drag them onto the Ruler seat for the single crown. Drag them to a **Done** bag to leave the inbox. Done does not require a placement and does not change rungs they are already on. Dragging a name off a rung clears that one placement. One gesture writes the diagram and the copy stored on the character.

A move is spoken at the table, then made on the diagram. The pending-move queue does not return. Axes: rename, add, remove, maximum five. The crown holds one person or stays empty.

---

## Factions, tags, Fortunes

Factions live inside categories. Add, rename, or remove a category, then put factions inside it: name, colour, optional icon, assigned to people. Tags are a separate kind: name, optional colour, optional icon, assigned to people. The flat “add a faction” rite from before categories does not come back.

Fortunes are the Guidebook’s five buttons (Vitality, Cohesion, Surplus, Standing, Tradition). Each click moves Crisis → Strained → Steady → Abundance. The number is stored. A later change can carry a short public note. A new campaign stores Steady (2) as an unfounded placeholder until those five buttons are pressed and the weather is founded.

---

## Character map

The map is story. The desk does not become a graph editor.

The store keeps a JSON Canvas (`RelationMap`: text nodes, edges, labels, colours, optional x/y). Obsidian opens that format.

- The desk and the public character-map page offer **Download canvas**.
- The Storyteller edits it in Obsidian. A player’s file is the same upload after the Storyteller has looked at it.
- **Upload** exists only on the desk. It runs the existing relation-map checks, then replaces the canvas.
- The web rose is recomputed from the ties for `/character-map/`. Canvas coordinates are kept for the next download.

Rose seating stays the engineering note in `apps/campaign-ui/docs/character-map.md`.

---

## Storyteller Desk catalogue

### From an empty campaign

Found with a name. The slug is the subdomain. Reserved labels are refused. The record starts as:

- Display name and slug
- Fortunes stored as Steady (2), unfounded until the five buttons are pressed
- Axes Arms, Faith, Coin, Blood, empty rungs, no Ruler
- Faction categories and tags available as kinds, with no labels yet
- No myths, no people, no canvas, no members
- A private notebook, desk-only, omitted from the public snapshot

### Community

| Field | Control |
|-------|---------|
| Name | Rename the display name. The slug stays. |
| Fortunes | The five Guidebook buttons, after founding. A short public note on a later change. |
| Myths | Add, edit, remove. Title, summary, effect chips. Up to three active. |
| Axes | Rename, add, remove. Maximum five. |
| Ruler | Drag one person onto the crown, or leave it empty. |
| Diagram | Unassigned, the ladders, the porch, the crown, Done. |
| Faction categories | Add, rename, remove a category. |
| Factions | Inside a category: name, colour, optional icon. Assign to people. |
| Tags | Name, optional colour, optional icon. Assign to people. |
| Canvas | Download and upload. |
| Snapshot | Download the public snapshot. Restore one. |
| Discord bind | Invite, then guild, play channel, Storyteller role. |
| Fluxer bind | The same three picks as Discord. Built alongside those commands. |
| Notebook | Private. Never archived. |
| Scene faces | The list editor above. Session only. |
| Tide | Read-only on the strip: open or not. |
| Restore | The table above. |
| Submissions | The stack. |

### A person

Add with a name and a kind: player character, NPC, or notable. A new person lands in Unassigned. Remove someone who has no history. Otherwise retire them to dead, which takes them off the diagram and leaves Echoes to be claimed.

Identity: name, kind, concept, community tie, “who do we see?”, portrait, claimable, placeholder. Slug stays once chat links exist. Status moves by submission, approve, reject, and death. Account binding replaces emergency `/map`.

Creation, shown and not forged: Foundation points left, Skill points left, Words left, whether the two private dice have been granted, locked or not.

Edited on the person: the nine raw Foundations (a 0 or a 4 only with a Trait), each Skill’s rating and Practice, Traits (name and note), Exertion current, the nine Harm tracks, Dying when stabilising, armour and whether it is donned, food days, water days, named items (name, note, tags, icon).

Echoes: title, weight, invoke condition, the weight-2 circle and its people, resolve or reopen with a narrative. A Pivotal resolution is also a Fortune button and a Myth, done as those controls. Claiming a Legacy copies a Group or Pivotal Echo onto a successor. Decadence, over-capacity, Echo capacity, and Echo weight are shown and derived. Invocation stays on the roll confirm.

### Shown, and never typed

Exertion maximum (Resolve + Constitution + Charisma, raw). Effective Foundations. Echo capacity and total Echo weight. Decadence. Over-capacity. Skill thresholds. Tide length, start, and Omen bands. Dying while a track sits at 3 — clearing Dying is the stabilising act, and the track stays at 3.

### Outside the desk

- Rolling for a player, or spending a player’s Exertion on a roll.
- Opening, stepping, or closing a Tide.
- Awarding a Word, or rolling the two private dice.
- Editing the character map in the browser.
- Showing tools on the public name.
- Occupying `/map/`.
- Encoding a rest as short or long, a plentiful meal, a tended checkbox, or a transfer inside Restore.
