# Documentation gaps (2026-08-31)

Living inventory of Guidebook teaching, examples, interactivity, and open design questions.

**This file replaces** the 2026-08-18 checklist. Do not treat those ✅/🚫 marks as current. Architecture: [`starlight-guidebook.md`](./starlight-guidebook.md). Visual + product: [`visual-lock.md`](./visual-lock.md).

A reader without a playtest could not navigate or understand the system. That is a teaching and interactivity failure. Prime target: **example quality**. Second: **widgets that engage**. Hierarchy, Fortune, and Myth **pictures** are part of teaching, not chrome extras.

Incoming: a thorough external critique. Wholesale prose rewrite waits on that. Pictures, widget highlight, and known example holes do not.

---

## A. Locked game design (C1–C12)

Unchanged. These are rules, not visual work.

**C1.** Base dice tier — ST declares every time; safe default **d8**. Advantage / Disadvantage (die tier), not a Skill→die map.

**C2.** Advantage stacking — ST call for that moment. Automation stores the declared tier.

**C3.** Tide arithmetic — Descriptive + worked example. Footing in C11.

**C4.** Opposed 1vMany / ManyvMany — Each action is individual; Tide holds collective pressure.

**C5.** Practice edge cases — Margin 0 → no forced award. Primitive → no Practice. Degrade prompted only; five lowest-progress Skills; Omen selects how many (bands in C11). Marks convert on win and loss when Exertion was spent. Opposed loss also adds +2; the two stack. See C12.

**C6.** Harm & protection — ST chooses track; no mixed physical+social events; floor rounding.

**C7.** Foundation Myths — Toggleable, compoundable; ST-only craft; trigger by **explicit tag** on the roll.

**C8.** Weighing automation — Created at Concept with budgets; Omen rolls automated; Words spent on the **speaker’s** sheet; ST marks the **target**.

**C9.** Rest & food — Separate commands for Exertion reclaim and Harm heal. Narrative first.

**C10.** Maximum Hierarchies — Hard cap **five**. Diagram on the community tracker.

**C11 (2026-08-18 morning)**

| Lock | Decision |
|------|----------|
| Practice visibility | Exact progress on the **live sheet only**. Adapters do **not** print Practice amounts. |
| Degrade bands (d20 1–20) | Standard: 1–5 → 0, 6–10 → 1, 11–15 → 2, 16–20 → 3. Short: 1–10 → 0, 11–20 → 1. |
| Tide sizes | **Small skirmish**, **Skirmish**, **Battle** only. |
| Tide imbalance | Same ladder as die tiers. Disadvantaged side keeps its **bad** band; **good** band from N sizes smaller (slight N=1, severe N=2). Floor: good band cannot shrink below one face. |
| HP pillars | Four: Foundations, Skills, Traits, Exertion. Echoes is continuity. |
| Echoes placement | First chapter of Resolution & Continuity. |
| Glossary | Last group, **Reference**. |
| Dice split | Hub · Marks & Tiers · Omens · Tide. Situational resolution under Tide. |
| lastUpdated | Off. |
| Splash | Rejected. Portal is a landing, not a splash. |
| Humour | Keep the two authorial lines. Do not add more by default. |
| Automation chapter | Frozen except game-rule contradictions, repo paths, code CSS — **until** the chat/ST-desk split is product-real, then the table-facing contract must match. |
| Foundation Myth example | The Price We Paid (bounty hunter / slavers). Free extra Exertion vs slavers; Streetwise Practice as if ruling Foundation were 3. |
| Healing / Dying | Healing is not a superpower. Without the right Skills/kit, Disadvantage. Best care can still fail. |
| Portal actions | Guidebook and Repository are the same tier. |
| Bellefair | Display and body. |
| Practice teaching | Hunnic: Temur (Bowyer) and Qara (Mentoring). |

**C12 (2026-08-18 evening)**

| Lock | Decision |
|------|----------|
| Omen wording | A Consequence is a **genuine side-effect**. It cannot rewrite Marks. No theatrical “what the night brought.” |
| Practice award (opposed) | Exertion spent → **+ Marks difference** on win **and** on loss. Loss also **+2**, Exertion or not. They stack. Margin 0 = not lost, no automatic award. |
| Practice award (unopposed) | More failures than Marks → **+2** (Exertion free). Exertion spent → **+ floor(Marks ÷ 2)** in addition. |
| Interactive chrome | Iron + glass, not blood hover. Blood stays on identity. Living lock: [`visual-lock.md`](./visual-lock.md). |
| Scrollbar | Pewter. Never pink / blood. |
| Prev / next | Folio plates, silver hover. |
| Heading IDs | Auto slug only. No `{#slug}` in source. |
| Medallions | Artisan / Trickster / Sage **accepted**. |
| Identity chrome | Tables, example boxes, `hr` runes, ST lanes stay **blood**. |
| Social thumbnail | Site-wide `og.jpg`. |
| Ornament | Soot/smoke plates, L-straps. **Oculus / title-in-cast is not current work** (25 Aug revert; rose-cast later lifted). Roses frozen. |

---

## B. Chapter teaching (honest, 2026-08-31)

| Chapter | What still works | What fails a reader without a playtest |
|---------|------------------|----------------------------------------|
| Introduction | Voice; organisation table matches sidebar | Destinations, not a first procedure. Echoes / Myths / Legacies named before they are taught. |
| Dice Mechanics | Door page | No sample roll. “When to roll” is a paragraph. |
| Marks & Tiers | Ladder + tier dial + Tomas roof example | Strongest dice teaching. |
| Omens | Tomas forge widget; Consequence = side-effect | No boxed `kod-example`. |
| Tide | Zhao/Wei, footing faces, sizes | Long; Bellefair taxes it. Taught if the reader uses the widgets. |
| Human Potential | Four pillars | Reading-order list only. |
| Foundations | Domain lanes + one Primitive shove | No Foundation 3 vs 1 Practice-threshold case here (math is in Skills). |
| Skills | Practice award widget + Hunnic track + degrade | Catalogue-heavy; improvement taught. |
| Traits | One Speaks Latin case | Thin. |
| Exertion | Ford-cart spend | Empty-pool is a note. |
| Echoes | Capacity + invoke examples; Myth off/on widget | Fortunes: pillars with **no 0–3 on the object**. Myths: ingredient bullets, not a target table. |
| Harm | Physical spear; Dying stepper | **No social/Reputation Harm numbers.** Hierarchy’s only mechanic is unworked. |
| Hierarchies | One patronage → Echo scene | Diagram is four pastel text columns, identical blurbs, no occupancy, no Outsider, no dual-axis. Fortune **Standing** vs Hierarchy **Reputation** not warned. |
| Inventory | One ambush/bow case | Fine as a short chapter. |
| Campaign Setup | Nine-step widget; author accepted the method | Step 6 “leave axes empty” never joins Hierarchies as a worked blank→first rung. |
| Character Creation | Weighing stepper — strongest chapter | After Weighing, Hierarchy is one line. |
| Automation | Table-facing contract | Frozen; will need a revision when ST desk / whisper policy / token evaluation land. |
| Glossary | Grouped Reference | Working. Not exhaustive. |

**How-to-play chapter:** previously 🚫. **Re-evaluate** — do not inherit the rejection. If teaching is repaired *inside* existing chapters (examples, visible widgets, pictures), a new chapter may still be unnecessary. That is a decision after the critique, not a lock.

**Splash:** still rejected.

**Storyteller standalone chapter:** still not required if Intro + Dice “when to roll” + Campaign Setup carry it — but they currently do not, for a cold reader.

---

## C. Example inventory

English `aside.kod-example` today: Foundations 1, Skills 1, Traits 1, Exertion 1, Tide 1, Echoes 2, Harm 2, Hierarchies 1, Inventory 1, Marks & Tiers 1. **Zero** on Introduction, Dice hub, Omens, Human Potential, Campaign Setup, Character Creation, Automation, Glossary.

Widgets (interactive) exist on Marks, Omens, Tide, Skills, Echoes (Myth toggle), Harm (Dying), Campaign Setup, Character Creation (Weighing). Several start with later panels `hidden`. A skimmer who never presses a tab never sees the taught state.

**Holes that already justify work (do not wait on the critique to list them):**

| Hole | Why it kills navigation |
|------|-------------------------|
| Dice hub: no sample roll | First mechanical door has no worked action |
| Hierarchies: no occupancy, no multi-axis, no induction | Schema without people |
| Harm: no social/Reputation ratio as numbers | The only Hierarchy mechanic is never computed |
| Fortunes: scale not on the pillar | Reader cannot see Crisis vs Abundance |
| Myths: no effect-target table | Ingredients are a list; networking (Echo → Pivotal → Fortune + Myth slot → tag on roll) is prose |
| Widgets hidden by default | Interactivity failure |

When the critique lands: prefer more worked `kod-example` plates and widgets whose **taught state is visible**, not more theory. HU twin.

---

## D. Interactivity

Required ([`visual-lock.md`](./visual-lock.md)):

- Widgets engage; do not make the only full case a hidden tab.
- After load: **subtle glow/wave** on interactive options so the reader sees they can act. `prefers-reduced-motion`: no wave; options still visually distinct.
- Myths in the book: table of effects with clear targets and system networking — not a bullet list plus one toggle as the whole teaching.
- Hierarchy and Fortune **pictures** redesigned with the hall (shared tokens). Occupancy in the book. Scale on Fortune objects.

Do not restart oculus, title-in-cast, sidebar roundels, or pagination-as-glass-tile as a teaching fix.

---

## E. Integrity (still required on every Guidebook edit)

- Anchor IDs match Starlight’s slugger and land on **visible** headings (not hidden widget panels).
- **Never** write `{#slug}` in Markdown.
- No orphan pages.
- No `` `docs/plans/…` `` on player-facing pages.
- Intro organisation table must match sidebar order.
- “automation” in player text, not “bot,” unless naming a slash command.
- Theatrical rules copy: strip. Name the mechanic.
- Bold: term or number, not the clause.

IA (unchanged): Introduction → Dice (hub → Marks → Omens → Tide) → Human Potential → Resolution & Continuity (**Echoes first**) → Campaign & Character Creation → Automation → Glossary.

---

## F. Open / re-evaluate

| Item | Lean |
|------|------|
| How-to-play chapter | **Re-evaluate** after critique + example pass. Not inherited 🚫. |
| Storyteller standalone page | Only if Intro + Dice + Setup still fail a cold ST. |
| Aging / trauma Foundation shifts | Mentioned; no procedure. ❓ |
| Language / literacy | Trait-only. ❓ |
| Trait catalogue | Custom-first. Do not bloat. |
| Echo wording catalogue | Custom-first. |
| Glossary Tide second-tier | Do not bloat unless the critique shows a real lookup miss. |
| Automation chapter rewrite | When ST desk, whisper policy, and token evaluation are real. |
| Print CSS | Later. |
| Demo campaign | Vardmark **2/10**. Replacement is a **story seed** (Campaign Setup standard), not a mechanical fixture. See visual-lock. |
| Character / community sheet pages in the book | Product surfaces, not rules pages. |

Authorial humour lines stay. Medallions stay. Tables/identity chrome stay blood. Guidebook scrollbar silver.

---

## G. Capability ↔ doc coverage

Rules homes are unchanged (Marks, Omens, Tide, Skills, Exertion, Echoes, Harm, Hierarchies, Inventory, Character Creation, Campaign Setup, Automation). Coverage **exists**; teaching **quality** is the gap (examples, pictures, interactivity), not missing chapters — except the holes in §C.

Product (hall, sheets, cards, ST desk) is specified in [`visual-lock.md`](./visual-lock.md), not here.
