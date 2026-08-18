# Documentation Gaps & Open Design Questions

Living checklist. Author marks: **✅** pursue · **🚫** do not pursue · **❓** maybe / caution.

**Status:** Harden-and-raise programme (2026-08-18) is **closed**. Packages shipped; pinnacle-peak **not** reached. Architecture and verdict: [starlight-guidebook.md](./starlight-guidebook.md). C1–C11 remain locked. Evening locks are in §C12.

---

## A. Structural / guidebook completeness

| Gap | Priority | Notes | Mark |
|-----|----------|--------|------|
| Worked examples inline | High | Tide, Practice (matrix + award + Hunnic track), Myth, Dying, Weighing, Omen sword — **shipped** | ✅ done |
| Storyteller chapter | High | Intro + Dice “when to roll” + Campaign Setup carry this | ❓ not a standalone page |
| Character / community sheet pages | Medium | Product surfaces, not rules pages | 🚫 |
| Echo wording catalogue | Medium | Custom-first | 🚫 |
| Foundation Myth examples | High | The Price We Paid (bounty hunter / slavers) in Echoes | ✅ done |
| Trait catalogue | Low | Keep custom-first | 🚫 |
| Aging / trauma Foundation shifts | Medium | Mentioned; no procedure | ❓ |
| Skill degrade procedure | Medium | Equal d20 bands locked and documented | ✅ done |
| Multi-character / downtime montage | Low | — | 🚫 |
| Solo strand guidance | Low | — | 🚫 |
| Language / literacy | Low | Trait-only | ❓ |
| Visual identity | — | Language locked. **Evenness not done** (portal chrome, three medallions, tables vs widgets). | ✅ residual |
| Splash page | — | **Rejected** | 🚫 |
| How-to-play chapter | — | **Rejected** | 🚫 |
| Print CSS | Low | Later; not this programme | 🚫 |
| Automation chapter rewrite | — | Frozen until the product is documentable | 🚫 |
| Intro “How the Guide is organised” | High | Still lists Harm before Echoes | ✅ residual |
| CI runs domain tests | High | Pages workflow builds only | ✅ residual |
| Glossary second-tier Tide terms | Low | Weight, skirmish size, Marks difference | ❓ |

### Chapter status (honest, evening 2026-08-18)

| Chapter | Status |
|---------|--------|
| Introduction | Stable; humour kept. Organisation table **out of date** (Harm before Echoes). |
| Dice hub | Door page. Fine. |
| Marks & Tiers | Strong. Ladder + tier dial. |
| Omens | Clear. Consequence = genuine side-effect. Theatrical night-copy stripped. |
| Tide | Strong teaching (sizes, footing faces, Zhao/Wei). Long; Bellefair taxes it. |
| Human Potential | Four pillars only (Echoes out). Fine. |
| Foundations / Traits / Exertion | Stable. Exertion Practice link updated to the stack rule. |
| Skills | Practice matrix + award widget + Hunnic track + equal degrade. Domain now stacks Marks + +2 on opposed loss. |
| Echoes | First in Resolution & Continuity. Myth teaching case in place. |
| Harm | Dying scenario; Healing is not a superpower. Humour kept. |
| Hierarchies / Inventory | Stable; anchor hygiene. |
| Campaign Setup | Seeds + nine-step method. Doubled worldbuilding removed. Still the softest chapter. |
| Character Creation | Still the strongest chapter. Weighing heading leak fixed (`#the-weighing` is the auto slug). |
| Automation | Frozen except rules one-liners + repo-path + `code`/`pre` CSS. |
| Glossary | Grouped Reference companion. Working. Not exhaustive. |

---

## B. Cross-reference integrity

**IA (shipped)**

- Start here: Introduction
- Dice Mechanics: Overview → Marks & Tiers → Omens & Consequences → Tide
- Human Potential · Resolution & Continuity (**Echoes first**) · Campaign & Character Creation · Automation · **Reference: Glossary**

**Verify after each edit**

- Anchor IDs match Starlight’s slugger and land on **visible** headings (not hidden widget panels)
- **Never** write `{#slug}` in Markdown — Starlight prints it
- No orphan pages
- No `` `docs/plans/…` `` on player-facing pages
- Intro organisation table must match sidebar order

---

## C. Locked design questions

### C1–C10 (unchanged from author notes, 2026-08)

**C1. Base dice tier** — ST declares every time; safe default **d8**. Encoded as Advantage / Disadvantage (die tier), not a Skill→die map.

**C2. Advantage stacking** — ST call for that moment. Automation stores the declared tier.

**C3. Tide arithmetic** — Descriptive + worked example (not a full grind). See C11 for footing.

**C4. Opposed 1vMany / ManyvMany** — Each action is individual; Tide holds collective pressure.

**C5. Practice edge cases** — Margin 0 → no forced award. Primitive → no Practice. Degrade prompted only; five lowest-progress Skills; Omen selects how many (bands in C11). **Marks convert on win and loss when Exertion was spent. Opposed loss also adds +2; the two stack.** See C12.

**C6. Harm & protection** — ST chooses track; no mixed physical+social events; floor rounding.

**C7. Foundation Myths** — Toggleable, compoundable; ST-only craft; trigger by **explicit tag** on the roll.

**C8. Weighing automation** — Created at Concept with budgets; Omen rolls automated; Words spent on the **speaker’s** sheet; ST marks the **target**.

**C9. Rest & food** — Separate commands for Exertion reclaim and Harm heal. Narrative first.

**C10. Maximum Hierarchies** — Hard cap **five**. Diagram on Community Tracker.

### C11. Locks from the 2026-08-18 programme (morning)

| Lock | Decision |
|------|----------|
| Practice visibility | Exact progress on the **live sheet only**. Adapters (Discord / Fluxer / bot rolls) do **not** print Practice amounts. |
| Degrade bands (d20 faces 1–20) | Standard: **1–5 → 0**, **6–10 → 1**, **11–15 → 2**, **16–20 → 3**. Short: **1–10 → 0**, **11–20 → 1**. |
| Tide sizes | **Small skirmish**, **Skirmish**, **Battle** only. No Large / Omen-only size. Tiny → Small; old Small → Skirmish. |
| Tide imbalance | Same ladder as die tiers. Disadvantaged side keeps its **bad** band; **good** band is taken from N sizes smaller (slight N=1, severe N=2). Omen and Marks move independently. Floor: good band cannot shrink below one face. |
| HP pillars | Four: Foundations, Skills, Traits, Exertion. Echoes is continuity. |
| Echoes placement | First chapter of Resolution & Continuity. |
| Glossary | Last group, **Reference**. |
| Dice split | Hub · Marks & Tiers (incl. pool makeup) · Omens · Tide. Situational resolution lives under Tide. |
| lastUpdated | Off. |
| Splash | Rejected. Portal is a landing, not a splash. |
| Humour | Keep the two authorial lines. |
| Automation chapter | Frozen except game-rule contradictions, repo paths, code CSS. |
| Foundation Myth example | Bounty hunter / slavers (community Myth). Free extra Exertion vs slavers; Streetwise Practice as if ruling Foundation were maxed. |
| Healing / Dying | Healing is not a superpower. Without Herbalism, bandages, Handcrafting (splint), etc., the attempt is **Disadvantage**. Best care can still fail. No plot armour. |
| Portal actions | Guidebook and GitHub are the **same tier**. |
| Bellefair | Display **and** body. |
| Practice teaching | Hunnic: Temur (Bowyer) and Qara (Mentoring). Both earn Practice. |

### C12. Locks from the 2026-08-18 evening pass

| Lock | Decision |
|------|----------|
| Omen wording | A Consequence is a **genuine side-effect**. It cannot rewrite Marks. No theatrical “what the night brought.” |
| Practice award (opposed) | Exertion spent → **+ Marks difference** on win **and** on loss. Loss also **+2**, Exertion or not. They stack. Margin 0 = not lost, no automatic award. |
| Practice award (unopposed) | More failures than Marks → **+2** (Exertion free). Exertion spent → **+ floor(Marks ÷ 2)** in addition. |
| Interactive chrome | Iron-silver, not blood hover. Blood stays on identity surfaces (runes, example boxes, ST lanes, current sidebar). |
| Scrollbar | Simple fuller + lozenge. Pewter hover. Never pink / blood. |
| Prev / next | Folio plates, corner ticks, silver hover. |
| Heading IDs | Auto slug only. No `{#slug}` in source. |

### Still open

| Item | Lean |
|------|------|
| Campaign Setup further cut | Author only. Do not invent worldbuilding. |
| Artisan / Trickster / Sage glass | Remade; still below Warrior. Reopen only with the same brief (medieval, no perspective, high shard count; Sage: no occult glyphs). |
| Portal chrome parity | Should join the iron-silver lock. |
| Tables as identity blood vs iron | Undecided. Do not flip without looking at every chapter. |
| Glossary Tide second-tier | Optional. Do not bloat. |
| CI test gate | Should run `test:domain` (at least) before Pages deploy. |
| Intro organisation table | Must match sidebar (Echoes before Harm). |

---

## D. Tone and editorial

| Issue | Action |
|-------|--------|
| Heading depth | H2 for chapter sections; H3 scannable |
| Quote markup | One shape (see starlight plan) |
| “bot” vs “automation” | **automation** in player text |
| Inline examples | At the mechanic, not a separate chapter |
| Bold | Term or number, not the clause |
| Theatrical rules copy | Strip. Name the mechanic. |

---

## E. Capability ↔ doc coverage

| Capability | Rules home | Automation page | Architecture plan | Notes |
|------------|------------|-----------------|-------------------|--------|
| Dice pools & Marks | marks-and-tiers | Yes | Yes | Tier ST-declared + d8 default |
| Omen / Consequences | omens | Yes | Yes | Side-effect; does not rewrite Marks |
| Opposed margins | tide (situational) | Yes | Yes | Per-action |
| Tide | tide | Yes | Yes | Three sizes; footing = die-tier ladder |
| Practice / level-up / degrade | skills | Yes | Yes | Matrix + widget; sheet-visible; adapters silent; domain stacks |
| Exertion | exertion | Yes | Yes | Separate from Harm heal |
| Echoes / Decadence | echoes | Yes | Yes | |
| Fortunes | echoes | Yes | Yes | Ambient community weather |
| Foundation Myths | echoes | Yes | Yes | Tag + craft UI; bounty-hunter example |
| Harm / Dying | harm | Yes | Yes | ST track; no mix; Healing not a superpower |
| Hierarchies / Legacy | hierarchies | Yes | Yes | Max 5 |
| Inventory | inventory | Yes | Yes | |
| Character creation / Weighing | character-creation | Yes (one-liner) | Yes | Words on speaker; mark on target |
| Campaign / community | campaign-setup | Yes | Yes | Softest chapter |
| Shared sheet / tracker | automation | Yes | Yes | Practice on sheet |
| Fluxer + Discord | automation | Yes | Yes | Dual adapters; no Practice in chat |
