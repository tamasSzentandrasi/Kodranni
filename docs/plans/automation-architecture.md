# Plan: Kodranni Automation Architecture

## Purpose

Kodranni assumes **automation** so hybrid play stays immersive: one living record per community, fast honest procedures, room for legacy and consequence. This document is engineering direction. The table-facing contract is [src/content/docs/automation.md](../../src/content/docs/automation.md). **Rules truth** is the Guidebook under `src/content/docs/`.

**Status:** subject to major change as UI is invented. Highest principles: **clarity**, **intuitiveness**, **one shared source of truth per community**, **platform-native UX first**.

---

## 1. Product vision

```text
                    ┌──────────────────────────┐
                    │  Guidebook (Starlight)   │  public rules — one edition
                    └──────────────────────────┘

┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ Fluxer bot       │     │ Community store     │     │ Discord bot      │
│ (guild binding)  │────▶│ (per community)     │◀────│ (guild binding)  │
└──────────────────┘     │  · Character sheets │     └──────────────────┘
                         │  · Community tracker│
                         │  · Audit / rolls    │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ Shared rich UI      │
                         │ (sheet + tracker)   │
                         │ highest visual bar  │
                         └─────────────────────┘
```

| Principle | Meaning |
|-----------|---------|
| **One source of truth** | Per community: sheets + tracker live once. No duplicate player/ST copies. |
| **Guidebook separate** | Rules site is global; community state is not. |
| **Platform modular** | Fluxer and Discord are equal adapters. Domain logic never imports a platform SDK. |
| **Local / fork-friendly host** | Prefer simple local run and optional per-campaign static or lightweight host (e.g. forked GitHub Pages for sheets/guidebook artefacts) over heavy multi-tenant cloud-first design. |
| **Elevated, native UX** | Prefer each platform’s built-ins (select menus, buttons, **reactions** for ST approve, reply threads) before inventing exotic chrome. Still a high-quality research problem. |
| **ST narrates config; player instructs** | ST names Foundation/Skill/tier in fiction; player roll command uses sheet + selections. ST has a separate NPC roll path with explicit numbers. |
| **Map people to characters** | Account IDs + nicknames → character targets for every instruction. |

---

## 2. Goals and non-goals

### Goals

- Hybrid play: more continuity and mechanical honesty than classic bookkeeping allows, without bot-led storytelling.  
- Shared character sheet (Practice **visible**) + community tracker (Fortunes, Myths, Diagram).  
- Fluxer **and** Discord adapters with guild/server IDs, tokens, and **account → character** maps.  
- Player roll, ST NPC roll, reply-as-oppose, Tide-by-reply-chain, revert last roll.  
- Approval via ST-role reactions where platforms allow.  
- Durable storage light enough for local / per-campaign operation.

### Non-goals

- AI Storyteller choosing Skills or narrating outcomes.  
- Discord-only design.  
- VTT maps / encumbrance simulation.  
- Natural-language rules inference as primary UX.  
- Duplicated offline sheets as authority.  
- Heavy multi-tenant SaaS as the default assumption.  
- Special “Legacy claim” bot path (Legacy is ordinary Echo craft with the ST).

---

## 3. Logical architecture

```text
┌─────────────────────────────────────────────────────────┐
│  Adapters                                                 │
│  · discord-adapter (interactions, reactions, guild id)  │
│  · fluxer-adapter  (same ports, platform IDs/tokens)    │
│  · web-ui-adapter  (character sheet + community tracker)│
└───────────────────────────┬─────────────────────────────┘
                            │ Application ports (commands, queries)
┌───────────────────────────▼─────────────────────────────┐
│  Application services                                     │
│  PlayerRoll · StorytellerRoll · Practice · Exertion     │
│  Echo · Myth · Harm · Hierarchy · Inventory · Creation  │
│  Tide · SceneOmen · Revert · Community                    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Domain (pure) — unit tested against Guidebook formulas │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Persistence — prefer simple community-scoped store       │
│  JSON/SQLite first; Postgres only if multi-table demand   │
└─────────────────────────────────────────────────────────┘
```

**Storage note:** a full networked database is likely **overkill** for the intended deployment shape. Start with a **per-community file or SQLite** store, exportable snapshot, optional sync. Scale up only if needed.

**Hosting modularity**

| Option | Use when |
|--------|----------|
| **Local process + community data dir** | Default pilot: ST runs automation on their machine |
| **Per-campaign fork / static host** | Guidebook + exported sheet/tracker views on e.g. GitHub Pages |
| Shared bot process, many community dirs | One Fluxer/Discord app, many tables (later) |
| Multi-tenant cluster | Only if product demand proves it |

**Platform binding + identity**

```text
PlatformBinding
  platform: fluxer | discord
  bot_token / app credentials
  guild_or_server_id
  community_id
  storyteller_role_ids[]

MemberMap
  platform_account_id
  display_nickname
  character_id?          // current active PC
  role: player | storyteller
```

Every instruction that targets “you” or “@name” resolves through `MemberMap`. Without a mapping, player roll refuses with a clear fix path.

---

## 4. Shared UI: Character sheet & Community tracker

First-class products. Visual ceiling high (guidebook and sheets as one craft). Empty structure first; art direction later.

### Character sheet (fields)

| Block | Content |
|-------|---------|
| Identity | Name, player mapping, status (active/dead), community tie summary |
| Foundations | Nine ratings + effective (after Harm) |
| Skills | By Archetype, 0–3; **Practice progress visible** on sheet |
| Traits | List |
| Exertion | Current / max (Res+Con+Cha) |
| Echoes | Title, weight, total vs capacity |
| Flags | Decadence, over-capacity (also **inferable** at roll time to cut admin) |
| Harm | Nine tracks, Dying flag |
| Hierarchy | Positions on each axis (full tier ladder: Outcast → … → Honoured; Ruler separate) |
| Armour | None/Light/Heavy + donned — **field required** (narrative presence) |
| Reputation | Per relevant axis / standing fields used when fiction sets relative tier — **field required** |
| Inventory | Food/water days, named items |
| Legacy | Only as Echoes on the sheet (no special block required) |

**No duplicate records.** ST and player open the same sheet; permissions gate *edits*, not a second copy of Practice.

### Community tracker (fields)

| Block | Content |
|-------|---------|
| Fortunes | Vitality, Cohesion, Surplus, Standing, Tradition (0–3) |
| Foundation Myths | Up to 3 active; structured toggleable effects |
| Hierarchy Diagram | ≤ **5** axes; all tiers; Ruler; Outsiders |

**Not** main tracker fields:

| Tool | Where it lives |
|------|----------------|
| **Tide** | Ephemeral session object; closed Tide → audit/history residue only |
| **Scene Omens** | ST-managed list (list / set / clear); not Fortunes |

---

## 5. Elevated interaction design (bots)

Prefer **platform-native** patterns:

| Flow | UX intent |
|------|-----------|
| **Player roll** | Mapped user → character auto; ST already named Foundation/Skill/tier in chat; UI: confirm or adjust selection showcase, Exertion toggle, Echo pick, Myth tag → go |
| **ST NPC roll** | Explicit numeric/config entry (Foundation, Skill, Exertion, tier, Advantage) — no PC sheet |
| **Oppose / link** | **Any roll in reply** to a roll message (or Tide event). **Not** a separate defender form with forced matching selectors. Pairs free. |
| **Approve** | Storyteller-role **reaction** (e.g. ✅) on the request message |
| **Spend / award Exertion** | Clear ± ; rest presets after fiction |
| **Harm** | Track picker (ST); ratio helper; **separate** heal |
| **Myth craft** | ST-only builder: toggle effect chips, compound, save to tracker |
| **Scene Omens** | ST list / set / clear |
| **Degrade** | ST prompts standard vs short time leap |
| **Revert** | Revert last roll (accident safety) |

Both adapters implement the same application ports with native components and reactions.

---

## 6. Authority model

| Actor | Can |
|-------|-----|
| **Player** | View shared sheet; player-roll; request inventory/hierarchy; create/invoke Echo; spend Exertion on rolls |
| **Storyteller** | Narrate Foundation/Skill/tier; NPC rolls; Omen faces; Tide; Harm; rest awards; approve via reaction; craft Myths; Fortunes; Weighing boons; prompt degrade; revert |
| **Automation** | Map accounts, validate, compute, present, persist |

**Legacy:** player and ST craft an Echo (and sheet outcomes) like any other Echo resolution. No distinct Legacy command family.

**Echo resolution:** ST deals fixed rewards as ordinary sheet mutations through automation — not a separate mini-game engine.

---

## 7. Domain notes (rules-locked)

### 7.1 Die tier (Advantage / Disadvantage)

- Context is judged as **Advantage / Disadvantage**, not a modifier stack; that judgment is the die tier.
- ST declares (or accepts **d8 default**). No Skill→tier map. Stacking = ST interpretation; store final tier.

### 7.2 Opposed multi-party

Each action individual. Reply-roll links. Tide holds collective state while open.

### 7.3 Practice

- Primitive → no Practice.  
- Margin 0 → no automatic margin Practice.  
- Visible on sheet.  
- **Degrade (prompted):** five lowest progress → Omen → 0/1/2/3 on bands 0–4 / 5–9 / 10–14 / 15–20. Short: 0–9 → 0, 10–20 → 1.

### 7.4 Harm

- ST chooses track; no mixed event; always floor.

### 7.5 Myths

- Toggleable/compoundable ST craft; fire only when roll tags Myth.

### 7.6 Weighing

- Create at Concept with budgets; Omen rolls automated; Word boons = option + **target character**.

### 7.7 Rest

- Separate Exertion reclaim vs Harm heal.

### 7.8 Hierarchies

- Max **5** axes; full tiers on Diagram; relative difference set narratively then applied in instructions.

### 7.9 Tide

- `scale = weight_A + weight_B - 1`; start from reference side weight; Omen bands per Guidebook.

### 7.10 Inference

- Infer Decadence / over-cap at roll time from Echo list.  
- Do **not** invent Armour/Reputation from thin air — fields + fiction.

---

## 8. Persistence sketch

```text
Community
  id, name, fortunes, hierarchy_axes[≤5], ruler_id?

Character
  foundations, skills+practice, traits, exertion,
  echoes, harm, hierarchy_positions, armour, inventory, flags

FoundationMyth (effects: structured json)
Roll (immutable) + parent_roll_id? + tide_id?
Tide (ephemeral / closed → audit)
SceneOmenFaceMap (ST session tool)
Request (approval; satisfied by ST reaction event)
PlatformBinding + MemberMap
AuditEvent
```

Export: full community snapshot for backup or static host.

---

## 9. Delivery phases

| Phase | Deliverable |
|-------|-------------|
| **P0** | Domain package + **SQLite/JSON community store**; one adapter; player roll + ST roll + Omen; sheet read; MemberMap |
| **P1** | Elevated selection UI; reply-oppose; Practice visible; Exertion; Harm/Dying; revert |
| **P2** | Echoes; Fortunes; Hierarchy + reaction approve; Inventory; Community tracker MVP |
| **P3** | Tide ephemeral; Scene Omen ST tools; Myth craft; degrade; second platform |
| **P4** | Weighing helpers; visual polish; local/Pages hosting docs |

---

## 10. Testing

- Unit: Marks, Practice, degrade bands, Harm floor, capacity/Decadence, creation costs.  
- Integration: reaction approve; reply chain; death → Echo residue.  
- Contract: golden cases from Guidebook immersive examples.  
- Adapter tests: mapping only (mock domain).

---

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Dual-platform scope | Domain first; second adapter after P1 |
| Overbuilt infra | JSON/SQLite + local run default |
| UI under-invested | Native platform UX research sprint early |
| Rules drift | Guidebook is authority |

---

## 12. Success criteria

1. One sheet per character; Practice visible; no forked data.  
2. Fluxer and Discord can bind the same community store.  
3. Player roll needs no retyped sheet; ST NPC roll needs no PC sheet.  
4. Oppose is reply, not a second skill form.  
5. Domain tests match Guidebook formulas.  
6. automation.md and this plan update together.

---

## 13. Immediate next steps

1. Wireframe Character sheet + Community tracker (empty structure OK).  
2. Define application ports (player roll, ST roll, reply link, reaction approve, revert).  
3. Implement domain roll + Practice + degrade against SQLite/JSON.  
4. Ship first adapter with native selects/reactions for one pilot community.  
5. Document local run + optional Pages export.  
