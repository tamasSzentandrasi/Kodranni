# Plan: Astro + Starlight Guidebook

Living architecture for the Kodranni Guidebook. Rules locks and residual gaps live in [documentation-gaps.md](./documentation-gaps.md).

**Status (2026-08-18, evening):** Harden-and-raise packages 0–8 are **shipped**. This file no longer describes upcoming work as if it were unstarted. The book is a coherent grim Guidebook. It is **not** at the pinnacle-peak look or the process standard we set. Verdict is in §Verdict.

---

## Goal

Ship Kodranni’s rules as a **maintainable, navigable guidebook** on [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/). Starlight is the product frame (header, search, sidebar, right-hand TOC, prev/next). We skin those surfaces and teach *into* them. We do not hide the shell or rebuild a splash.

Pinnacle, for this book, means: a new Storyteller can learn the system from the pages alone; every major procedure is taught at the point of use; the weather of the book is even (grim, pre-industrial, human); chrome does not fight the text; nothing theatrical stands in for a rule.

---

## Verdict (2026-08-18)

**Did the recent changes reach pinnacle-peak?** No.

**Did they meet the high standard we set for this programme?** Mostly on structure and teaching. Not on evenness, process, or finish.

What is true:

- The IA is the teaching order. Dice is four pages. Echoes is first in Resolution. Glossary is Reference at the end. Pagination follows the sidebar.
- Teaching is now at the bar for the procedures that used to be unreadable: Marks ladder, die-tier dial, Omen faces, Tide (Zhao/Wei + footing faces), Practice (matrix + award widget + Hunnic track), Dying, Foundation Myth, Weighing stepper.
- Widget copy lives in Markdown. JS hydrates. That contract held.
- Interactive chrome was pulled off blood-red hover (iron-silver plates, folio prev/next, pewter scrollbar). That was the right move. It is a lift, not a finished ornament language.
- Plates are in place. Portal exists as a landing, not a splash. Humour lines were kept. Automation chapter stayed frozen.

What is not true, and must not be dressed up:

- **Evenness is not pinnacle, and several items are now closed by the author.** Artisan / Sage / Trickster medallions are **accepted**. Tables and identity chrome stay **blood** (the locked triad: blood, silver, black). Guidebook scrollbar is silver and stays. Portal card-hover is still blood (portal is not on the widget chrome lock). The book is closer to one object than the first verdict said; it is still not even from portal to last page.
- **Process leaked.** `{#the-weighing}` printed as text. Practice domain awarded only +2 on an opposed loss with Exertion (Marks did not convert). Worldbuilding method prose shipped doubled. Omen copy used theatrical “night brought” language. Each was caught by the author, not by us.
- **Plans were stale while we shipped.** This file still described packages 0–8 as the work, and a widget file-tree that was never created (`src/scripts/guidebook/widgets/*.ts`). `enhance.ts` is still one client file.
- **CI builds the book and does not run domain tests.** The Practice stacking bug would have deployed.
- **Introduction organisation table** listed Harm before Echoes; **fixed** (now matches sidebar, including Automation before Glossary).
- **Campaign Setup** is **accepted** (author, after a master worldbuilder reading). Ready.
- **Bellefair** remains a locked taste risk. Mitigated (measure, contrast, no fake-bold). Not solved. Long Tide and Practice tables still tax the eye.
- Visual claims in this session were not browser-verified here (no browser tools). Build + CSS inspection is not the same as using the book.

Author note from the same day — “I’m impressed so far” — is about register, not arrival. The book now has a voice. Pinnacle is evenness plus no leaked process. We have neither.

---

## Current stack (2026-08-18)

| Asset | State |
|-------|--------|
| `package.json` | Astro 7 + `@astrojs/starlight` 0.41 |
| `astro.config.mjs` | `site` + `base: '/Kodranni/Guidebook'`; sidebar groups; `lastUpdated` **off** |
| `src/content.config.ts` | `docsLoader()` + `docsSchema()` |
| `src/content/docs/` | Flat Markdown. Dice is four routes. |
| `src/styles/` | Theme files imported from `custom.css` (split shipped) |
| `src/scripts/guidebook/enhance.ts` | Single client hydrator (extracted from `Head.astro`). **Not** split into `widgets/*.ts`. |
| Theme | Dark-only; self-hosted Bellefair + Noto Sans Runic |
| Deploy | GitHub Pages: portal `/Kodranni/`, book `/Kodranni/Guidebook/`. Workflow builds; **does not run `npm test`**. |
| Search | Pagefind on production build |

**Out of Starlight:** bot/DB/Discord code, ADRs in `docs/plans/`, private campaign data, product sheet UI (`apps/campaign-ui`).

---

## What shipped

Short log. Original scaffold (`7c1882e`, 2026-08-09) assumed placeholder CSS, no deploy, a splash, and “add examples later.”

| When | What landed |
|------|-------------|
| 2026-08-09 | Pages under `/Kodranni/Guidebook`; portal at project root; Introduction as book root; chapter icons; splash rejected |
| 2026-08-09–10 | Type experiments → **Bellefair locked** (display + body); self-hosted fonts; falcon mark; Futhark `hr` triads |
| 2026-08-10 | Advantage/Disadvantage restored as die-tier rule; Marks mindset; Weighing flow locked |
| 2026-08-11 | Interactive layer: widgets, lanes, archetype stained glass, Fortune hall, Hierarchy diagram, Weighing + worldbuilding steppers; Calm mode removed |
| 2026-08-12 | Feely oil plates + `kod-breath`; campaign seeds recalibrated; Vardmark as conquerors |
| 2026-08-13 | Dark-only lock; dual capacities (Exertion vs Echo) documented |
| 2026-08-14 | Tide demo (Zhao/Wei); die-tier visual language started |
| 2026-08-17 | Polyhedral die icons + chips; widget harden (isolated enhance steps) |
| 2026-08-18 (programme) | Plans rewritten; truth pass; CSS/Head split; Dice 4-page split; Echoes first; Glossary rebuild; portal lift; plates placed; Artisan/Trickster/Sage remade (still below Warrior) |
| 2026-08-18 (evening) | Situational resolution → Tide; Omen as side-effect; Tide names Small/Skirmish/Battle; Hunnic Practice; iron-silver interactive chrome; Practice matrix + domain stack fix; Weighing heading leak removed |
| 2026-08-22 | Frame grammar: folio ticks on plates, cartouche buttons, chapter-title iron tile + short identity rule, Tide rivet weave, filled chapter-icon set (`currentColor` + CSS hue). Ornament lock amended — still no new Markdown class. |

---

## Visual language (locked)

- **Type:** Bellefair for titles *and* body. No second body face. Mitigate with contrast, shorter measure (~42–44rem), emphasis register, boxes, widgets — not a new family. Bellefair has only weight 400; do not fake-bold (`font-synthesis: none`).
- **Colour:** iron / silver / blood. Dark only. No theme toggle.
- **Interactive chrome (2026-08-18 lock):** widgets, prev/next, scrollbar, term tips, step examples, Tide callouts use **iron-silver**. Blood stays on identity surfaces: chapter `hr` runes, example boxes, ST lanes, current-page sidebar, invented-seed category, portal falcon ring. Do not put blood on button hover.
- **Ornament (2026-08-22 frame grammar):** One plate language — 1px hairline, inset silver, folio corner-ticks, short end-caps on *title rules only*. Role is colour (identity blood / interactive pewter / semantic left-bars), not a second flourish family. Chapter icon is the capital: filled `currentColor` set in an iron tile; the title stays a full Bellefair word. No new Markdown class, no raster banners, no drop-caps, no page frames, no fleur-de-lis/gold/leather. Elder Futhark on `hr`; list scroll-reveal; breath-masked plates; example / note / counsel boxes; teaching widgets; pewter scrollbar; folio ticks on pagination and plates. H2 stays a hairline.
- **ST humour (authorial, keep):** Introduction *“It's Fiiiine”*; Harm *“Don't worry. I'll kill you eventually.”* Do not add more gags by default.
- **Plates:** `figure.kod-breath` after the first divider. Empty `alt` (decorative). Glossary and Automation have no start plate.
- **Quotes:**

```md
> *“Quoted words.”*
> — *Attribution*
```

Old English / Hávamál: original line, then translation, then source.

- **Wording:** grim and clear. A Consequence is a genuine side-effect. Do not theatricalise rules.

---

## Starlight surfaces we keep

| Surface | Role |
|---------|------|
| Header | Wordmark + falcon + search |
| Sidebar groups | Teaching order (see IA) |
| Right-hand TOC | In-chapter scan |
| Prev / next | Linear first-time path — **must match sidebar order**. Folio plates, iron-silver, not blood hover. |
| Pagefind | Lookup; Glossary is a companion, not the search engine |

`lastUpdated` is off. Rules are not edition-dated that way.

---

## Information architecture

### Sidebar (shipped)

1. **Start here** — Introduction
2. **Dice Mechanics** — Overview · Marks & Tiers · Omens & Consequences · Tide
3. **Human Potential** — Overview · Foundations · Skills · Traits · Exertion
4. **Resolution & Continuity** — **Echoes** · Harm · Hierarchies · Inventory
5. **Campaign & Character Creation** — Campaign Setup · Character Creation
6. **Automation** — At the Table
7. **Reference** — Glossary

Pagination follows that list. Glossary is never in the middle of a first-time read.

`/Guidebook/` remains a one-way JS redirect to Introduction. No splash.

**Known mismatch:** Introduction “How the Guide is organised” still lists Harm before Echoes. Residual.

### URL policy

Flat routes. Dice children: `/marks-and-tiers/`, `/omens/`, `/tide/`. Root-absolute links in Markdown (`/foundations/#…`).

Custom heading IDs: **do not** write `{#slug}` in Markdown — Starlight prints it. Use the auto slug, or a visible `<span id="…">` on a heading that stays on screen (never on a `hidden` widget panel).

---

## Widget contract

**Markdown owns every word the reader sees. JS never contains scene prose.**

- Markup: `div.kod-widget.not-content[data-widget="…"]` with buttons + panels in the `.md` file.
- JS: hydrators in `src/scripts/guidebook/enhance.ts` (one file). Isolated `try` per setup. Do not invent a `widgets/` tree unless `enhance.ts` becomes painful to edit.
- Stay on `.md` + HTML shells. No MDX migration unless a later widget cannot be panels.

Shipped hydrators: `content-tabs`, `step-flow`, `marks-ladder`, `tier-dial`, `tide-demo`, `practice-award`, plus chrome (sidebar icons, Futhark `hr`, die chips, omen faces, scroll-reveal).

`Head.astro`: fonts, favicon, theme-color, one import of `enhance.ts`.

One sidebar icon map: `src/lib/chapter-icons.ts`.

---

## CSS map

`astro.config.mjs` `customCss` points at `./src/styles/custom.css`. That file only imports:

```
src/styles/
  custom.css      # imports
  theme.css       # tokens, dark lock, Starlight vars, scrollbar
  type.css        # Bellefair, emphasis, lists, quotes, code, measure
  chrome.css      # header, sidebar, TOC, pagination, page-title, hr
  boxes.css       # example, note, counsel, blockquote
  tables.css
  breath.css      # plates
  widgets.css
  diagrams.css    # fortunes, hierarchy, harm, domains, seeds, archetypes
```

Unused experiments deleted: `.kod-disclose*`, `.kod-breath--side*`, `.kod-chip` / `.kod-chip-row`. Keep `.kod-lane--amber/violet/teal`.

Portal CSS lives inline in `public-root/index.html` and is **not** on this map. It still uses the older blood scrollbar and blood card-hover.

---

## Editorial conventions

- Prefer **automation** in player text; **bots** only on the Automation chapter / engineering plans.
- No `` `docs/plans/…` `` paths on player-facing pages.
- Bold is for the term or the number, not the clause. First-use game terms may be small-caps.
- Character Creation is nearly done — light touch only.
- Automation **chapter content is frozen** except game-rule contradictions, repo-path removal, and CSS on `code`/`pre`.
- After each edit: confirm glossary anchors hit **visible** headings; `npm run test:domain` when Practice / Tide / Harm / degrade change; `npm run build`.

---

## Imagery pipeline

You generate. We agree the slate, then place under `public/scenes/` and wire `kod-breath`.

### Plate slate (accepted and placed)

| Slot | File | Status |
|------|------|--------|
| Introduction start | `falconer.jpg` | keep |
| Dice hub start | `gambling.jpg` | placed |
| Marks & Tiers start | `quenching.jpg` | placed |
| Marks mid (Scout) | `scout-night.jpg` | keep |
| Omens start | `eclipse.jpg` | placed |
| Tide start / concept | `hattin.jpg` | keep |
| Human Potential | `reeds.jpg` | keep |
| Foundations | `peasantkid.jpg` | keep |
| Skills start | `vineyard.jpg` | keep |
| Practice concept | `practice.jpg` | placed |
| Traits | `manuscript.jpg` | keep |
| Exertion | `ford-cart.jpg` | keep |
| Harm start / Dying | `wound-care.jpg` | keep |
| Echoes start | `cominghome.jpg` | keep |
| Foundation Myths | `price-we-paid.jpg` | placed |
| Hierarchies | `emissaries.jpg` | keep |
| Legacies | `death.jpg` | keep |
| Inventory | `storeroom.jpg` | keep |
| Campaign Setup | `settlers.jpg` | keep |
| Character Creation | `soothsayer.jpg` | keep |
| Glossary / Automation | — | no plate |
| Portal | reuse `falconer.jpg` | enormous field + breath fade |

**Stained glass:** Warrior and Mother set the language. Artisan / Trickster / Sage remakes (2026-08-18) are **accepted** — do not remake again unless the author asks. Sage: no occult glyphs (held).

---

## Portal

`public-root/index.html` — same register as the book, not a splash.

Shipped: falconer field, breath fade, wordmark + falcon, three-word tag, succinct lede, three constraints, **Guidebook and Source same tier**.

Guidebook scrollbar is silver (locked). Portal still has its own inline CSS (blood card-hover is fine as identity). Social thumbnail: `public/og.jpg` (1200×630 falcon card) on Guidebook pages and the portal.

---

## Work packages (2026-08-18 programme) — closed

| # | Package | Outcome | Score |
|---|---------|---------|-------|
| 0 | Rewrite plans | Done at open; **went stale by evening** | Partial |
| 1 | Truth pass, equal degrade, `lastUpdated` off | Degrade bands, Tide sizes, Practice stack (fixed late) | Done, with a late domain miss |
| 2 | CSS split, Head → `enhance.ts` | Files exist; widget tree in the old plan was fiction | Done enough |
| 3 | Dice 4-page; Echoes first; Glossary → Reference | Shipped. Intro table still wrong-order. | Done, one leftover |
| 4 | Tide / Practice / Myth / Dying widgets | All present. Practice matrix + award widget shipped last. | Done |
| 5 | Campaign Setup worldbuilding | Doubled prose removed. Chapter still the softest. | Partial |
| 6 | Glossary rebuild | Grouped Reference companion. Anchors work if we do not invent `{#id}`. | Done |
| 7 | Portal lift | Landing exists; chrome not unified. | Partial |
| 8 | Plates + remakes | Plates placed. Three medallions **accepted**. | Done |

**Not in that programme (still not):** Automation chapter rewrite; campaign-ui / Discord polish; print CSS; replacing Bellefair. Ornament was reopened 2026-08-22 as frame grammar (no new Markdown class).

---

## Success criteria — scored

1. A new Storyteller can go Introduction → Dice (hub → Marks → Omens → Tide) → Human Potential → Echoes → … → Campaign Setup → Character Creation without external notes. **Mostly.** Teaching widgets carry the hard procedures. Campaign Setup is the soft spot.
2. Every major term is in the Glossary with a working **visible** heading link. **Mostly.** Second-tier Tide terms (weight, skirmish size) are missing. Weighing leak showed we were not checking.
3. Widget copy is reviewable in git (no scene prose in JS). **Yes.**
4. `npm run build` is CI-gated on `main`. **Build yes. Tests no.**
5. Visual tone is grim pre-industrial human, even across chapters, without harming readability. **Tone yes. Evenness no. Readability still a tax.**

---

## Residual (next, if we continue)

Not a new numbered programme unless one is opened. In priority order:

1. **Automation chapter** — frozen until the product is documentable. Last remaining *chapter*.
2. Leave frozen: Bellefair, humour lines, accepted medallions, blood identity chrome, silver scrollbar, Campaign Setup, no second-tier Glossary. Ornament is the 2026-08-22 frame grammar (not the older “closed, add nothing” wording).
3. **Portal** still has its own inline CSS. Frame tokens live in `theme.css` for a later share; not this programme.
4. **Character-sheet rose** (`circular_element_idea.jpg`) — parked for campaign-ui.

`npm run build` now runs domain tests and `scripts/guidebook-integrity.mjs` (no `{#id}`, no plan paths, Intro Echoes-before-Harm) before Astro.
