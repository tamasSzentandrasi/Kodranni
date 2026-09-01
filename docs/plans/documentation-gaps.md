# Documentation gaps (2026-08-31)

Replaces the 2026-08-18 checklist. Architecture: [`starlight-guidebook.md`](./starlight-guidebook.md). Product: [`visual-lock.md`](./visual-lock.md) V19–V20, V26–V27.

Cold-reader failure: no playtest → cannot assemble Hierarchies, social Harm, Fortunes 0–3, Myths, or a first roll. Work: `kod-example` plates, visible widget panels, hierarchy/fortune/myth HTML.

Prose rewrite waits on the incoming critique. V8/V19/V20/V26 and the holes in §C do not wait.

---

## A. Rules locks (C1–C12)

Unchanged.

**C1.** ST declares die tier; default **d8**. Advantage/Disadvantage = tier, not Skill→die.

**C2.** Advantage stacking = ST call. Store the declared tier.

**C3.** Tide arithmetic: descriptive + worked example. Footing C11.

**C4.** 1vMany / ManyvMany: per-action rolls; Tide = collective.

**C5.** Margin 0 → no forced Practice. Primitive → no Practice. Degrade prompted; five lowest-progress Skills; Omen band (C11) picks how many. Exertion spent → Marks convert on win and loss. Opposed loss also +2; stack. C12.

**C6.** ST chooses Harm track. No mixed physical+social. Floor rounding.

**C7.** Myths: toggleable, compoundable; ST craft; fire only if the roll tags the Myth.

**C8.** Weighing: budgets at Concept; Omen rolls automated; Words on **speaker**; ST marks **target**.

**C9.** Exertion reclaim ≠ Harm heal. Narrative first.

**C10.** ≤5 hierarchy axes. Diagram on the tracker.

**C11**

| Lock | Value |
|------|--------|
| Practice in adapters | Not printed. Exact progress on live sheet only. |
| Degrade d20 | 1–5→0, 6–10→1, 11–15→2, 16–20→3. Short: 1–10→0, 11–20→1. |
| Tide sizes | Small skirmish, Skirmish, Battle. |
| Tide imbalance | Disadvantaged keeps bad band; good band from N sizes smaller (slight 1, severe 2). Good band ≥ 1 face. |
| HP | Foundations, Skills, Traits, Exertion. Echoes = continuity chapter. |
| Echoes | First in Resolution & Continuity. |
| Glossary | Last, Reference. |
| Dice pages | Hub · Marks & Tiers · Omens · Tide. Situational under Tide. |
| lastUpdated | Off. |
| Splash | Rejected. |
| Humour | Two authorial lines only. |
| Automation.md | Frozen except rule contradictions / paths / code CSS until V13/V22/V24 exist, then match. |
| Myth example | The Price We Paid: free extra Exertion vs slavers; Streetwise Practice as Foundation 3. |
| Healing | Not a superpower. Missing kit → Disadvantage. Can fail. |
| Portal | Guidebook = Repository tier. |
| Bellefair | Display and body. |
| Practice teaching | Temur Bowyer, Qara Mentoring. |

**C12**

| Lock | Value |
|------|--------|
| Omen | Side-effect. Cannot rewrite Marks. |
| Practice opposed | Exertion → +margin win and loss. Loss +2 always. Stack. Margin 0 = no auto award. |
| Practice unopposed | Failures > Marks → +2. Exertion → +floor(Marks/2) extra. |
| Interactive CSS | Iron+glass. Blood = identity. [`visual-lock.md`](./visual-lock.md) V1. |
| Scrollbar | Pewter. |
| Prev/next | `.kod-btn--folio`. |
| Heading IDs | Auto slug. No `{#slug}`. |
| Medallions | Artisan / Trickster / Sage accepted. |
| Identity CSS | Tables, `.kod-example`, `hr`, ST lanes = blood. |
| og | `og.jpg`. |
| Title roses | Frozen JPEGs. No oculus work. |

---

## B. Per chapter (2026-08-31)

| File | Present | Missing |
|------|---------|---------|
| `introduction.md` | Org table = sidebar | No procedure. Echoes/Myths/Legacies named before those chapters. |
| `dice-mechanics.md` | Hub | No sample roll. |
| `marks-and-tiers.md` | Ladder, tier dial, Tomas `kod-example` | — |
| `omens.md` | Forge widget | No `kod-example`. |
| `tide.md` | Zhao/Wei, footing, sizes | Length; widgets hold the lesson. |
| `human-potential.md` | Four pillars | List only. |
| `foundations.md` | Domain lanes, Primitive example | No F3 vs F1 threshold example (that math is in `skills.md`). |
| `skills.md` | Award widget, Hunnic track, degrade | Catalogue. |
| `traits.md` | Speaks Latin example | One case. |
| `exertion.md` | Ford-cart example | Empty-pool note only. |
| `echoes.md` | Capacity + invoke examples, Myth off/on | Fortune pillars: no 0–3 fill. Myths: bullets, not effect-target table. |
| `harm.md` | Physical example, Dying stepper | No Reputation protection ratio as numbers (`÷1/÷2/÷3`). |
| `hierarchies.md` | Patronage example | `.kod-hier-diagram`: 4 pastel columns, copy-pasted rungs, no names, no outsider, no dual-axis. No Standing vs Reputation warning. |
| `inventory.md` | Ambush/bow example | — |
| `campaign-setup.md` | 9-step widget | Step 6 (empty axes) not joined to a first claimed rung. |
| `character-creation.md` | Weighing stepper | Hierarchy = one line after Weighing. |
| `automation.md` | Contract | Update when V13/V22/V24 ship. |
| `glossary.md` | Grouped | Not exhaustive. |

How-to-play page: 2026-08-18 🚫 is **not** inherited. Decide after critique + §C. Splash remains rejected.

---

## C. Counts and holes

`aside.kod-example` (en): Marks 1, Foundations 1, Skills 1, Traits 1, Exertion 1, Tide 1, Echoes 2, Harm 2, Hierarchies 1, Inventory 1. Zero: Introduction, Dice hub, Omens, Human Potential, Campaign Setup, Character Creation, Automation, Glossary.

Widgets: Marks, Omens, Tide, Skills, Echoes Myth toggle, Harm Dying, Campaign Setup, Weighing. Panels after the first often `hidden`.

Do not wait on the critique for:

| Gap | File |
|-----|------|
| Sample roll | `dice-mechanics.md` |
| Occupancy + dual-axis + induction | `hierarchies.md` + `diagrams.css` |
| Social Harm ratio numbers | `harm.md` ↔ `hierarchies.md` |
| Fortune 0–3 on the pillar | `echoes.md` + `diagrams.css` |
| Myth effect-target table + Echo→Pivotal→Fortune+slot | `echoes.md` |
| First widget panel = the lesson (`hidden` off) | `src/scripts/guidebook/enhance.ts` + Markdown |

HU twin on every Markdown/widget edit.

---

## D. Edit rules

- Anchors = Starlight slugger; land on visible headings.
- No `{#slug}` in source.
- No `docs/plans/` paths in player Markdown.
- Intro org table = `astro.config.mjs` sidebar.
- Player prose: “automation”, not “bot”, except slash command names.
- Bold: term or number.

IA: Introduction → Dice (hub → Marks → Omens → Tide) → Human Potential → Resolution (Echoes first) → Campaign & Creation → Automation → Glossary.

---

## E. Open

| Item | Status |
|------|--------|
| How-to-play page | Re-evaluate after critique + §C |
| ST-only Guidebook page | Only if Intro + Dice + Setup still fail |
| Aging/trauma Foundation | Mentioned; no procedure |
| Literacy | Trait-only |
| Trait / Echo catalogues | Custom-first |
| Glossary Tide extras | Only if critique shows a lookup miss |
| `automation.md` rewrite | After V13/V22/V24 |
| Print CSS | Later |
| Demo sqlite | V27: S1 seed + plots; not Vardmark |
| Sheet/tracker pages in the book | No; product surfaces |

---

Rules live in the chapter files above. Product UI: [`visual-lock.md`](./visual-lock.md).
