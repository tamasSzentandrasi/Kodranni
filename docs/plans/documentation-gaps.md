# Documentation Gaps & Open Design Questions

Living checklist. Author marks: **✅** pursue · **🚫** do not pursue · **❓** maybe / caution.

**Status:** Guidebook harden-and-raise programme (2026-08-18). C1–C10 remain locked. New locks from that session are in §C11.

Architecture and IA: [starlight-guidebook.md](./starlight-guidebook.md).

---

## A. Structural / guidebook completeness

| Gap | Priority | Notes | Mark |
|-----|----------|--------|------|
| Worked examples inline | High | Pattern established; Tide / Practice / Myth / Dying still to raise | ✅ |
| Storyteller chapter | High | Intro + Dice “when to roll” + Campaign Setup carry this | ❓ not a standalone page |
| Character / community sheet pages | Medium | Product surfaces, not rules pages | 🚫 |
| Echo wording catalogue | Medium | Custom-first | 🚫 |
| Foundation Myth examples | High | One high-effect teaching Myth (bounty hunter) in Echoes | ✅ |
| Trait catalogue | Low | Keep custom-first | 🚫 |
| Aging / trauma Foundation shifts | Medium | Mentioned; no procedure | ❓ |
| Skill degrade procedure | Medium | Equal d20 bands locked (C11) | ✅ |
| Multi-character / downtime montage | Low | — | 🚫 |
| Solo strand guidance | Low | — | 🚫 |
| Language / literacy | Low | Trait-only | ❓ |
| Visual identity | — | Language locked; evenness in progress | ✅ |
| Splash page | — | **Rejected** | 🚫 |
| How-to-play chapter | — | **Rejected** | 🚫 |
| Print CSS | Low | Later; not this programme | 🚫 |
| Automation chapter rewrite | — | Frozen until the product is documentable | 🚫 |

### Chapter status (honest)

| Chapter | Status |
|---------|--------|
| Introduction | Stable; humour kept |
| Dice hub / Marks / Omens / Tide | Split + Tide rewrite in this programme |
| Human Potential | Four pillars only (Echoes out) |
| Foundations / Traits / Exertion | Stable; quote/example hygiene |
| Skills | Practice visibility + Practice widget + equal degrade |
| Echoes | First in Resolution & Continuity; Myth teaching case |
| Harm | Dying scenario (Healing is not a superpower) |
| Hierarchies / Inventory | Stable; anchor hygiene |
| Campaign Setup | Worldbuilding rewrite in this programme |
| Character Creation | Almost perfect — light touch |
| Automation | Frozen except rules one-liners + repo-path + `code`/`pre` CSS |
| Glossary | Rebuild as Reference companion |

---

## B. Cross-reference integrity

**IA (target)**

- Start here: Introduction
- Dice Mechanics: Overview → Marks & Tiers → Omens & Consequences → Tide
- Human Potential · Resolution & Continuity (**Echoes first**) · Campaign & Character Creation · Automation · **Reference: Glossary**

**Verify after each edit**

- Anchor IDs match Starlight’s slugger and land on **visible** headings (not hidden widget panels)
- No orphan pages
- No `` `docs/plans/…` `` on player-facing pages
- Inbound Dice anchors updated after the split

---

## C. Locked design questions

### C1–C10 (unchanged from author notes, 2026-08)

**C1. Base dice tier** — ST declares every time; safe default **d8**. Encoded as Advantage / Disadvantage (die tier), not a Skill→die map.

**C2. Advantage stacking** — ST call for that moment. Automation stores the declared tier.

**C3. Tide arithmetic** — Descriptive + worked example (not a full grind). See C11 for footing.

**C4. Opposed 1vMany / ManyvMany** — Each action is individual; Tide holds collective pressure.

**C5. Practice edge cases** — Margin 0 → no forced award. Primitive → no Practice. Degrade prompted only; five lowest-progress Skills; Omen selects how many (bands in C11).

**C6. Harm & protection** — ST chooses track; no mixed physical+social events; floor rounding.

**C7. Foundation Myths** — Toggleable, compoundable; ST-only craft; trigger by **explicit tag** on the roll.

**C8. Weighing automation** — Created at Concept with budgets; Omen rolls automated; Words spent on the **speaker’s** sheet; ST marks the **target**.

**C9. Rest & food** — Separate commands for Exertion reclaim and Harm heal. Narrative first.

**C10. Maximum Hierarchies** — Hard cap **five**. Diagram on Community Tracker.

### C11. Locks from the 2026-08-18 programme

| Lock | Decision |
|------|----------|
| Practice visibility | Exact progress on the **live sheet only**. Adapters (Discord / Fluxer / bot rolls) do **not** print Practice amounts. |
| Degrade bands (d20 faces 1–20) | Standard: **1–5 → 0**, **6–10 → 1**, **11–15 → 2**, **16–20 → 3**. Short: **1–10 → 0**, **11–20 → 1**. |
| Tide sizes | **Small skirmish**, **Skirmish**, **Battle** only. No Large / Omen-only size. |
| Tide imbalance | Same ladder as die tiers. Disadvantaged side keeps its **bad** band; **good** band is taken from N sizes smaller (slight N=1, severe N=2). Omen and Marks move independently. |
| HP pillars | Four: Foundations, Skills, Traits, Exertion. Echoes is continuity. |
| Echoes placement | First chapter of Resolution & Continuity. |
| Glossary | Last group, **Reference**. |
| Dice split | Hub · Marks & Tiers (incl. pool makeup) · Omens · Tide. |
| lastUpdated | Off. |
| Splash | Rejected. Portal is a landing, not a splash. |
| Humour | Keep the two authorial lines. |
| Automation chapter | Frozen except game-rule contradictions, repo paths, code CSS. |
| Foundation Myth example | Bounty hunter / slavers (community Myth). Free extra Exertion vs slavers; Streetwise Practice as if ruling Foundation were maxed. |
| Healing / Dying | Healing is not a superpower. Without Herbalism, bandages, Handcrafting (splint), etc., the attempt is **Disadvantage**. Best care can still fail. No plot armour. |
| Portal actions | Guidebook and GitHub are the **same tier**. |
| Bellefair | Display **and** body. |

### Still open (not blockers for packages 0–3)

| Item | Lean |
|------|------|
| Tide Tiny-skirmish good-band floor | Good band cannot shrink below one face |
| Campaign Setup rewrite quality | Author cuts anything that is not the table |
| Artisan / Trickster / Sage remakes | Brief locked; images not yet supplied |

---

## D. Tone and editorial

| Issue | Action |
|-------|--------|
| Heading depth | H2 for chapter sections; H3 scannable |
| Quote markup | One shape (see starlight plan) |
| “bot” vs “automation” | **automation** in player text |
| Inline examples | At the mechanic, not a separate chapter |
| Bold | Term or number, not the clause |

---

## E. Capability ↔ doc coverage

| Capability | Rules home | Automation page | Architecture plan | Notes |
|------------|------------|-----------------|-------------------|--------|
| Dice pools & Marks | marks-and-tiers | Yes | Yes | Tier ST-declared + d8 default |
| Omen / Consequences | omens | Yes | Yes | |
| Opposed margins | marks-and-tiers | Yes | Yes | Per-action |
| Tide | tide | Yes | Yes | Three sizes; footing = die-tier ladder |
| Practice / level-up / degrade | skills | Yes | Yes | Sheet-visible; adapters silent |
| Exertion | exertion | Yes | Yes | Separate from Harm heal |
| Echoes / Decadence | echoes | Yes | Yes | |
| Fortunes | echoes | Yes | Yes | Ambient community weather |
| Foundation Myths | echoes | Yes | Yes | Tag + craft UI; bounty-hunter example |
| Harm / Dying | harm | Yes | Yes | ST track; no mix; Healing not a superpower |
| Hierarchies / Legacy | hierarchies | Yes | Yes | Max 5 |
| Inventory | inventory | Yes | Yes | |
| Character creation / Weighing | character-creation | Yes (one-liner) | Yes | Words on speaker; mark on target |
| Campaign / community | campaign-setup | Yes | Yes | |
| Shared sheet / tracker | automation | Yes | Yes | Practice on sheet |
| Fluxer + Discord | automation | Yes | Yes | Dual adapters; no Practice in chat |
