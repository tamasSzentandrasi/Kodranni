# Plan: Astro + Starlight Guidebook

Living architecture for the Kodranni Guidebook. Replaces the August 2026 scaffold plan. Status of rules and open gaps lives in [documentation-gaps.md](./documentation-gaps.md).

---

## Goal

Ship Kodranni’s rules as a **maintainable, navigable guidebook** on [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/). Starlight is the product frame (header, search, sidebar, right-hand TOC, prev/next). We skin those surfaces and teach *into* them. We do not hide the shell or rebuild a splash.

---

## Current stack (2026-08)

| Asset | State |
|-------|--------|
| `package.json` | Astro 7 + `@astrojs/starlight` 0.41 |
| `astro.config.mjs` | `site` + `base: '/Kodranni/Guidebook'`; sidebar groups; `lastUpdated` **off** (this programme) |
| `src/content.config.ts` | `docsLoader()` + `docsSchema()` |
| `src/content/docs/` | Flat Markdown chapters (Dice split in this programme) |
| `src/styles/` | Theme files imported from `custom.css` (split in this programme) |
| `src/scripts/guidebook/` | Client enhance (split out of `Head.astro` in this programme) |
| Theme | Dark-only; self-hosted Bellefair + Noto Sans Runic |
| Deploy | GitHub Pages: portal at `/Kodranni/`, book at `/Kodranni/Guidebook/` (`.github/workflows/deploy.yml` + `scripts/prefix-base.mjs`) |
| Search | Pagefind on production build |

**Out of Starlight:** bot/DB/Discord code, ADRs in `docs/plans/`, private campaign data, product sheet UI (`apps/campaign-ui`).

---

## What shipped after the original plan

Short log, not a novel. Original plan (`7c1882e`, 2026-08-09) assumed placeholder CSS, no deploy, a splash `index.mdx`, and “add examples later.”

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
| 2026-08-18 | This programme: plans rewritten; truth, architecture, IA, teaching, portal |

---

## Visual language (locked)

- **Type:** Bellefair for titles *and* body. No second body face. Mitigate with contrast, shorter measure (~42–44rem), emphasis register, boxes, widgets — not a new family. Bellefair has only weight 400; do not fake-bold (`font-synthesis: none`).
- **Colour:** iron / silver / blood. Dark only. No theme toggle.
- **Ornament (closed, ascetic):** Elder Futhark on `hr`; list scroll-reveal; breath-masked plates; example / note / counsel boxes; teaching widgets. Do not add a new flourish class.
- **ST humour (authorial, keep):** Introduction *“It's Fiiiine”*; Harm *“Don't worry. I'll kill you eventually.”* Do not add more gags by default.
- **Plates:** `figure.kod-breath` after the first divider. Empty `alt` (decorative). Glossary and Automation have no start plate.
- **Quotes:**

```md
> *“Quoted words.”*
> — *Attribution*
```

Old English / Hávamál: original line, then translation, then source.

---

## Starlight surfaces we keep

| Surface | Role |
|---------|------|
| Header | Wordmark + falcon + search |
| Sidebar groups | Teaching order (see IA) |
| Right-hand TOC | In-chapter scan |
| Prev / next | Linear first-time path — **must match sidebar order** |
| Pagefind | Lookup; Glossary is a companion, not the search engine |

`lastUpdated` is off. Rules are not edition-dated that way.

---

## Information architecture

### Sidebar (target)

1. **Start here** — Introduction
2. **Dice Mechanics** — Overview · Marks & Tiers · Omens & Consequences · Tide
3. **Human Potential** — Overview · Foundations · Skills · Traits · Exertion
4. **Resolution & Continuity** — **Echoes** · Harm · Hierarchies · Inventory
5. **Campaign & Character Creation** — Campaign Setup · Character Creation
6. **Automation** — At the Table
7. **Reference** — Glossary

Pagination follows that list. Glossary is never in the middle of a first-time read.

`/Guidebook/` remains a one-way JS redirect to Introduction. No splash.

### URL policy

Flat routes. New Dice children: `/marks-and-tiers/`, `/omens/`, `/tide/`. Root-absolute links in Markdown (`/foundations/#…`).

---

## Widget contract

**Markdown owns every word the reader sees. JS never contains scene prose.**

- Markup: `div.kod-widget.not-content[data-widget="…"]` with buttons + panels in the `.md` file.
- JS: generic hydrators in `src/scripts/guidebook/widgets/`.
- Stay on `.md` + HTML shells. No MDX migration unless a later widget cannot be panels.

`Head.astro`: fonts, favicon, theme-color, one import of `enhance.ts`.

```
src/scripts/guidebook/
  enhance.ts
  sidebar-icons.ts
  dividers.ts
  die-icons.ts
  equalize.ts
  widgets/
    tabs.ts
    step-flow.ts
    marks-ladder.ts
    tier-dial.ts
    tide-demo.ts
    tide-footing.ts
    practice-track.ts
    myth-demo.ts
    dying-demo.ts
```

One sidebar icon map: `src/lib/chapter-icons.ts`.

---

## CSS map

`astro.config.mjs` `customCss` points at `./src/styles/custom.css`. That file only imports:

```
src/styles/
  custom.css      # imports
  theme.css       # tokens, dark lock, Starlight vars
  type.css        # Bellefair, emphasis, lists, quotes, code, measure
  chrome.css      # header, sidebar, TOC, pagination, page-title, hr, search
  boxes.css       # example, note, counsel, blockquote
  tables.css
  breath.css      # plates
  widgets.css
  diagrams.css    # fortunes, hierarchy, harm, domains, seeds, archetypes
```

Unused experiments deleted: `.kod-disclose*`, `.kod-breath--side*`, `.kod-chip` / `.kod-chip-row`. Keep `.kod-lane--amber/violet/teal`.

---

## Editorial conventions

- Prefer **automation** in player text; **bots** only on the Automation chapter / engineering plans.
- No `` `docs/plans/…` `` paths on player-facing pages.
- Bold is for the term or the number, not the clause. First-use game terms may be small-caps.
- Character Creation is nearly done — light touch only.
- Automation **chapter content is frozen** except game-rule contradictions, repo-path removal, and CSS on `code`/`pre`.

---

## Imagery pipeline

You generate. We agree the slate, then place under `public/scenes/` and wire `kod-breath`.

### Plate slate (accepted 2026-08-18)

| Slot | File | Status |
|------|------|--------|
| Introduction start | `falconer.jpg` | keep |
| Dice hub start | `gambling.jpg` | **accepted** (supplied) |
| Marks & Tiers start | `quenching.jpg` | **accepted** (supplied; not scout-night) |
| Marks mid (Scout) | `scout-night.jpg` | keep as concept plate on Marks |
| Omens start | `eclipse.jpg` | **accepted** (supplied) |
| Tide start / concept | `hattin.jpg` | keep |
| Human Potential | `reeds.jpg` | keep |
| Foundations | `peasantkid.jpg` | keep |
| Skills start | `vineyard.jpg` | keep |
| Practice concept | `practice.jpg` | **accepted** (supplied) |
| Traits | `manuscript.jpg` | keep |
| Exertion | `ford-cart.jpg` | keep |
| Harm start / Dying | `wound-care.jpg` | keep (no separate Dying oil) |
| Echoes start | `cominghome.jpg` | keep |
| Foundation Myths | `price-we-paid.jpg` | **accepted** (supplied) |
| Hierarchies | `emissaries.jpg` | keep |
| Legacies | `death.jpg` | keep |
| Inventory | `storeroom.jpg` | keep |
| Campaign Setup | `settlers.jpg` | keep |
| Character Creation | `soothsayer.jpg` | keep |
| Glossary / Automation | — | no plate |
| Portal | reuse `falconer.jpg` | same breath fade as pages |

**Still to remake (highest care):** Artisan, Trickster, Sage stained glass — medieval, no perspective, high shard count, colour-themed. Sage: no occult glyphs. Warrior/Mother are the bar.

---

## Portal

`public-root/index.html` — same register as the book, not a splash.

- Falconer plate, breath fade, well placed.
- Wordmark + falcon + three words.
- Succinct description of what Kodranni is, in Guidebook tone.
- Three constraints as a quiet strip.
- **Guidebook and GitHub are the same tier** (two equal actions).

---

## Work packages (this programme)

| # | Package | Outcome |
|---|---------|---------|
| 0 | Rewrite this file + documentation-gaps | Plans match the repo |
| 1 | Truth pass, equal degrade, `lastUpdated` off | Book and code agree |
| 2 | CSS split, type, Head → scripts, widget contract | Presentation is a system |
| 3 | Dice 4-page split; Echoes first; Glossary → Reference | IA matches teaching |
| 4 | Tide / Practice / Myth / Dying widgets; harden existing | Teaching at the bar |
| 5 | Campaign Setup worldbuilding rewrite | ST prep that teaches |
| 6 | Glossary rebuild | Reference companion |
| 7 | Portal lift | Root landing |
| 8 | Place accepted plates; remakes when supplied | Even weather |

**Not in this programme:** Automation chapter rewrite; campaign-ui / Discord polish; print CSS (later gap); new ornament; replacing Bellefair.

---

## Success criteria

1. A new Storyteller can go Introduction → Dice (hub → Marks → Omens → Tide) → Human Potential → Echoes → … → Campaign Setup → Character Creation without external notes.
2. Every major term is in the Glossary with a working **visible** heading link.
3. Widget copy is reviewable in git (no scene prose in JS).
4. `npm run build` is CI-gated on `main`.
5. Visual tone is grim pre-industrial human, even across chapters, without harming readability.
