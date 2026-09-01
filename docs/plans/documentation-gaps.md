# Documentation gaps

| Field | Value |
|-------|--------|
| **Date** | 2026-08-31 (rewritten) |
| **This file** | Rules locks + Guidebook teaching holes |
| **Visual / product UX** | [`visual-lock.md`](./visual-lock.md) — jobs, options, order. Do not copy chrome decisions into this file. |
| **Architecture** | [`starlight-guidebook.md`](./starlight-guidebook.md) |

A cold reader still cannot assemble Hierarchies, social Harm, Fortunes as weather, Myths, or a first roll from the book alone. That is the gap. Prose polish can wait on critique; the holes in §C cannot.

---

## A. Rules locks

These are the system, not visual chrome.

**C1.** ST declares die tier; default **d8**. Advantage/Disadvantage = tier, not Skill→die.

**C2.** Advantage stacking = ST call. Store the declared tier.

**C3.** Tide arithmetic needs a descriptive line plus a worked example. Footing with C11.

**C4.** 1vMany / ManyvMany: per-action rolls; Tide is collective.

**C5.** Margin 0 → no forced Practice. Primitive → no Practice. Degrade is prompted; five lowest-progress Skills; Omen band (C11) picks how many. Exertion spent → Marks convert on win **and** loss. Opposed loss also +2; stack. C12.

**C6.** ST chooses Harm track. No mixed physical+social. Floor rounding.

**C7.** Myths: toggleable, compoundable; ST craft; fire only if the roll tags the Myth.

**C8.** Weighing: budgets at Concept; Omen rolls automated; Words on **speaker**; ST marks **target**.

**C9.** Exertion reclaim ≠ Harm heal. Narrative first.

**C10.** ≤5 hierarchy axes. The hall is the living diagram; the book must teach the same shape.

**C11**

| Lock | Value |
|------|--------|
| Practice in adapters | Not printed. Exact progress on the live sheet only. |
| Degrade d20 | 1–5→0, 6–10→1, 11–15→2, 16–20→3. Short: 1–10→0, 11–20→1. |
| Tide sizes | Small skirmish, Skirmish, Battle. |
| Tide imbalance | Disadvantaged keeps the bad band; good band from N sizes smaller (slight 1, severe 2). Good band ≥ 1 face. |
| Human Potential | Foundations, Skills, Traits, Exertion. Echoes = continuity chapter. |
| Echoes | First in Resolution & Continuity. |
| Glossary | Last, Reference. |
| Dice pages | Hub · Marks & Tiers · Omens · Tide. Situational under Tide. |
| lastUpdated | Off. |
| Splash | Rejected. |
| Humour | Two authorial lines only (Intro “It's Fiiiine”; Harm “I'll kill you eventually”). |
| `automation.md` | Frozen except rule contradictions / paths until the ST desk and chat contracts exist, then match. |
| Myth example | The Price We Paid: free extra Exertion vs slavers; Streetwise Practice as Foundation 3. |
| Healing | Not a superpower. Missing kit → Disadvantage. Can fail. |
| Portal | Guidebook = Repository tier. |
| Bellefair | Display and body. |
| Practice teaching | Temur Bowyer, Qara Mentoring. |

**C12**

| Lock | Value |
|------|--------|
| Omen | Side-effect. Cannot rewrite Marks. |
| Practice opposed | Exertion → +margin on win and loss. Loss +2 always. Stack. Margin 0 = no auto award. |
| Practice unopposed | Failures > Marks → +2. Exertion → +floor(Marks/2) extra. |
| Heading IDs | Starlight slug. No `{#slug}` in source. |
| Medallions | Artisan / Trickster / Sage accepted. |
| og | `og.jpg`. |

Interactive look (iron / glass / blood) lives in [`visual-lock.md`](./visual-lock.md) §2, not here.

---

## B. Per chapter

What a cold reader can **do** after the page, and what they still cannot.

| File | Can do | Still cannot |
|------|--------|----------------|
| `introduction.md` | See the teaching order | No procedure. Echoes/Myths/Legacies named before those chapters exist. |
| `dice-mechanics.md` | See the hub | No sample roll in one scene. |
| `marks-and-tiers.md` | Use the ladder and tier dial | — |
| `omens.md` | Use the forge widget | No worked `kod-example`. |
| `tide.md` | Walk Zhao/Wei | Long; widgets carry the lesson. |
| `human-potential.md` | Name the four pillars | List only. |
| `foundations.md` | See domain lanes, Primitive example | F3 vs F1 threshold lives in `skills.md`. |
| `skills.md` | Award widget, Hunnic track, degrade | Catalogue is long. |
| `traits.md` | One Latin example | One case. |
| `exertion.md` | Ford-cart example | Empty-pool is a note. |
| `echoes.md` | Capacity, invoke, Myth off/on | Fortunes: pillars have no 0–3 weather. Myths: bullets, not an effect-target table. |
| `harm.md` | Physical example, Dying stepper | Reputation protection as numbers (`÷1/÷2/÷3`) missing. |
| `hierarchies.md` | Patronage example | Diagram is four pastel columns, no names, no outsider, no dual-axis. No Standing vs Reputation warning. |
| `inventory.md` | Ambush/bow example | — |
| `campaign-setup.md` | 9-step widget | Step 6 (empty axes) not joined to a first claimed rung. |
| `character-creation.md` | Weighing stepper | Hierarchy is one line after Weighing. |
| `automation.md` | Contract | Update when the ST desk and chat actually exist. |
| `glossary.md` | Grouped terms | Not exhaustive. |

How-to-play page: only if Intro + Dice hub + a sample roll still fail. Splash stays rejected.

---

## C. Work that does not wait on critique

| Gap | Where | Notes |
|-----|--------|--------|
| Sample roll | `dice-mechanics.md` | One scene, one pool, Marks, no theatrical weather. |
| Fortune weather on the pillar | `echoes.md` + shared fortune CSS | Same object as the hall sky. Caption examples as illustrations. See visual plan §6.2. |
| Occupancy + dual-axis + porch | `hierarchies.md` + `diagrams.css` | Same tokens as the hall. See visual plan §6.3. |
| Social Harm ratio numbers | `harm.md` ↔ `hierarchies.md` | `÷1/÷2/÷3` in the book, not only in talk. |
| Myth effect-target table | `echoes.md` | Echo → Pivotal → Fortune + slot. Hall chrome after this table exists. |
| First widget panel = the lesson | Markdown + `enhance.ts` | Do not `hidden` the taught state. See visual plan §6.5. |

`aside.kod-example` (en) today: Marks 1, Foundations 1, Skills 1, Traits 1, Exertion 1, Tide 1, Echoes 2, Harm 2, Hierarchies 1, Inventory 1. **Zero:** Introduction, Dice hub, Omens, Human Potential, Campaign Setup, Character Creation, Automation, Glossary.

HU twin on every Markdown or widget copy change.

---

## D. Edit rules

- Anchors = Starlight slugger; land on visible headings.
- No `{#slug}` in source.
- No `docs/plans/` paths in player Markdown.
- Intro org table = `astro.config.mjs` sidebar.
- Player prose: “automation”, not “bot”, except slash-command names.
- Bold: term or number.

IA: Introduction → Dice (hub → Marks → Omens → Tide) → Human Potential → Resolution (Echoes first) → Campaign & Creation → Automation → Glossary.

---

## E. Open (not fake-closed)

| Item | Status |
|------|--------|
| How-to-play page | Only if §C sample roll + Intro still fail a cold reader |
| ST-only Guidebook page | Only if Intro + Dice + Setup still fail |
| Aging/trauma Foundation | Mentioned; no procedure |
| Literacy | Trait-only |
| Trait / Echo catalogues | Custom-first |
| Print CSS | Later |
| Demo seed | Must pass Campaign Setup (place, community, pressure, a decision that cannot wait) and carry plots. Vardmark is not that seed. |
| Sheet/tracker pages inside the book | No. Product surfaces. |

Rules live in the chapter files. Visual remaining work lives in [`visual-lock.md`](./visual-lock.md).
