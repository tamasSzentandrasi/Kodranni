---
title: Automation
description: Why Kodranni is a hybrid TTRPG, shared sheets, and the Fluxer/Discord automation contract.
---

----------

## Why Automation Exists

Kodranni is a **hybrid** tabletop system: storytelling first, software as ledger and dice engine underneath. Without automation, several procedures in this Guide would drown the table in bookkeeping.

### What the table gains

- **One living record** per character and community — no divergent notebooks.
- **Fast resolution** of pools, Omens, margins, Practice, Exertion, Harm, and Tide — so fiction is not stopped for arithmetic.
- **State at the moment of action** — who is rolling, Exertion left, Echoes, Myths — without retyping sheets into chat.
- **Online continuity** between sessions on shared sheets and a community tracker.

This page is the **table-facing** contract. Engineering direction lives with the project source and will change as the product UI is defined. Storyteller campaign tools are moving onto a web desk that clones the shared tracker and sheets; Discord and Fluxer remain the table’s conversation and dice. Harm apply can exist in both places.

----------

## Single source of truth

| Surface | Who uses it | What it holds |
|---------|-------------|----------------|
| **Guidebook** (this site) | Everyone | Rules — one public ruleset |
| **Character sheet** | Player + Storyteller (shared view) | One living record per character — Foundations, Skills (**including Practice progress**), Traits, Exertion, Echoes, Harm, Hierarchy positions, Inventory, flags |
| **Community tracker** | Table (shared view) | Fortunes, Foundation Myths, Hierarchy Diagram (≤5 axes) |

Sheets and tracker are **per community**. Hosting and sharing are modular: the community’s data is the authority; chat platforms only drive instructions against it.

There are **not** separate “player sheet” and “ST sheet” for the same character. The **data** does not fork. Practice progress is **visible** on the sheet for anyone who wants to look.

**Not** on the main Community tracker (session tools, not standing community state):

- **Tide** — opened when needed; when a Tide ends, what remains is usually an audit/history mark of where it left off, not a permanent tracker field.
- **Scene Omen faces** — Storyteller lists, manages, and clears them effectively; they are scene tooling, not community Fortunes.

----------

## Platforms

Automation **supports two platforms** as equal chat surfaces:

| Platform | Role |
|----------|------|
| **Fluxer** | Chat surface with guild/server-style binding, token configuration, account mapping |
| **Discord** | Same domain behaviour; guild IDs, token configuration, account mapping |

Each deployment binds platform credentials, **guild / server ID** (or Fluxer equivalent), and the **community** record. Bots also map **account IDs and nicknames** to characters so a target instruction always knows *which player’s character* it addresses.

Bots are thin clients over the community store. Bare slash-only bots are not enough: player-facing UI must make Foundation, Skill, tier, Exertion, Echo/Myth tags, and approvals **easy to select**, using each platform’s built-in strengths first (menus, buttons for Storyteller **approve/deny**, reply threads) — researched, innovative, high-quality UX, not a wall of flags.

Between and during sessions, players also use a **pretty shared view** of sheets and the community tracker: a **live** URL while the Storyteller’s session is running, and a **public archive** URL (campaign presentation site) when it is not. Platform account maps and full audit trails stay on the Storyteller’s machine — not on the public site.

----------

## Design Principles

1. **Storyteller authority** — Lasting mutations require Storyteller approval where the rules say so (Hierarchy, inventory, and similar). Approvals use **Storyteller-role buttons** (approve / deny) on the request message.  
2. **Fiction first, then instruction** — In narration the Storyteller names Foundation and Skill (or Foundation alone for Primitive). The **player** initiates the roll instruction with that agreed configuration. Automation already knows the mapped user, their character, Exertion, Echoes (selectable), and community Myths that can be tagged.  
3. **Die tier is declared** — Safe default **d8**; ultimate choice is the Storyteller’s via [Advantage and Disadvantage](/marks-and-tiers/#advantage-and-disadvantage).  
4. **Infer when safe; field when narrative** — States such as Decadence or over-capacity can be inferred during interactions to cut admin overhead. **Armour** and **Reputation** still need explicit fields: their presence is resolved in fiction before any ratio is applied. Hierarchy **tiers** are full ladders, not only Outsider/Ruler; relative tier difference is established narratively, then applied in instructions.  
5. **Reply chains** — An opposed roll is simply a **roll sent in reply** to a prior roll message (any Foundation + Skill pair; player or Storyteller NPC roll). Tide contribution comes from replies to a Tide event or to a roll already tied to that Tide.  
6. **Minimum pool floor** — No pool drops below 1 die.  
7. **Separate recovery** — Exertion reclaim and Harm healing are distinct updates after narrative rest.  
8. **One community store** — Sheets and tracker never diverge across platforms.  
9. **Fulfil, present, track** — Primary duty of automation: execute the instruction, show results, persist changes. **Revert last roll** for accidents.

----------

## Capability Map

| Capability | Player | Storyteller | Automation |
|------------|--------|-------------|------------|
| **Player roll** | Initiates with agreed config; Exertion / Echo / Myth tags via UI | Names Foundation + Skill (or Primitive) and tier in fiction | Maps user → character; fills pool from sheet; rolls + Omen; updates Practice/Exertion |
| **Storyteller NPC roll** | — | Uses ST roll flow: specify Foundation, Skill, Exertion, tier, etc. (no PC sheet required) | Rolls and reports; no PC sheet mutation unless targeted |
| **Opposed margin** | Reply-roll in fiction | Interprets margin | Detects reply link; computes Marks difference |
| **Omen faces** | — | List / set / clear scene faces | On every roll, flags configured + default faces |
| **Tide** | Acts; reply-rolls may link | Opens/closes; scale & footing | Tracks while open; history when closed |
| **Practice** | Visible on sheet | Prompt degrade (time leap) | Accrues; levels; prompted degrade |
| **Exertion** | Spends on player rolls | Awards rest/event drains | Tracks pool; empty penalty; infer flags when safe |
| **Echoes** | Create / invoke / resolve with ST | Veto tone; deal resolution rewards | Weight vs capacity; apply sheet changes ST orders |
| **Fortunes** | — | Adjust | On Community tracker |
| **Foundation Myths** | Tag on roll when relevant | Craft toggleable/compound effects (ST-only) | Apply only when tagged |
| **Harm / Dying** | — | Chooses track; applies; heals (separate) | Tracks; Dying; death flow |
| **Hierarchy Diagram** | Request move | Approve (button) | ≤5 axes on tracker |
| **Inventory** | Request changes; restock food/water | Approve (button) | Shared sheet loadout |
| **Character / Weighing** | Concept onward | Finalises; Word spent on the **speaker’s** sheet; ST marks the **target** | Budgets; private Omen rolls; sheet updates |
| **Legacy** | Crafted as an Echo with the ST (not a special bot path) | Same as other Echo outcomes | Ordinary Echo / sheet changes |

----------

## Table Workflow (Player Action)

```text
Player describes intent (role-play)
        ↓
Storyteller names, in fiction: Foundation + Skill | Primitive,
  and die tier (default d8) — Advantage/Disadvantage as context
        ↓
Player starts roll instruction (mapped account → character).
  UI already shows Exertion, selectable Echoes, taggable Myths.
  Player chooses spends/tags; confirms.
        ↓
Automation rolls main pool + Omen; presents results;
  tracks sheet changes (Practice, Exertion, flags…)
        ↓
Storyteller narrates outcome (+ Consequence if Omen fires)
        ↓
If lasting state needs approval (loot, rank…):
  request → Storyteller button approve → shared sheet/tracker
  (live pretty view updates immediately; public archive follows)
```

**Storyteller rolling an NPC:** separate ST roll instruction with explicit numbers (Foundation, Skill, Exertion, tier, Advantage). No player character sheet is required.

**Opposed:** any roll (player or ST) **in reply** to a roll message. Pairs need not match.

**Tide-linked:** reply to the Tide event or to a roll already on that Tide.

**Accident:** revert last roll.

----------

## Weighing (automation depth)

- Character record is created at **Character Concept**, with initial Foundation and Skill budgets granted.  
- **Birth Omen** and **Guiding Hand**: automation rolls; points land on the draft sheet.  
- **Words / Wanting**: speaker spends a Word on **their own** sheet (menu option). The Storyteller marks the **target** of the accepted claim. Theatre stays human; arithmetic and persistence do not.

----------

## Setup (evolving)

Install steps, Fluxer vs Discord tokens, account mapping, and UI research belong to the architecture plan and will iterate. Until the product ships, treat this chapter as the **behaviour contract**.

Command **families** (names follow UX design):

- **Player roll** / **Storyteller roll** — Omen always included; not a separate “omen command”  
- **Reply** = oppose or Tide-link when the parent is a roll or Tide event  
- Exertion award · Harm apply/heal (separate) · Tide open/close  
- Scene Omen list/set/clear (ST)  
- Echo · Myth craft (ST) · Fortune  
- Hierarchy request + ST button approve · Diagram on tracker  
- Inventory request + approve · restock  
- Character sheet · Community tracker · Practice degrade (prompted) · **Revert last roll**

Engineering notes live with the project source, not on this page.

Related: [Dice Mechanics](/dice-mechanics/), [Character Creation](/character-creation/), [Hierarchies](/hierarchies/).

----------
