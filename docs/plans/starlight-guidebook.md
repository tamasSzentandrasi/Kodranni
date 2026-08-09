# Plan: Astro + Starlight Guidebook

## Goal

Ship Kodranni’s rules as a maintainable, navigable **guidebook** using [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/) — already scaffolded in-repo (`astro.config.mjs`, `src/content/docs/*`, `package.json`).

This plan covers **finishing** that migration (MkDocs → Starlight already started in commit `c66e6c2`), content architecture, UX, CI, and editorial workflow.

---

## Current state (baseline)

| Asset | State |
|-------|--------|
| `package.json` | Astro ^7 + `@astrojs/starlight` ^0.41 (0.41 peers Astro 7, not 5) |
| `astro.config.mjs` | Sidebar groups, custom CSS, pagination, lastUpdated |
| `src/content.config.ts` | `docsLoader()` + `docsSchema()` — required for content collection |
| `src/content/docs/` | Full core rules; Dice first after Intro; Glossary, Automation, Campaign Setup |
| `src/styles/custom.css` | Placeholder accent tokens only |
| `README.md` | Dev commands + map |
| Build | Verified: 18 HTML pages + Pagefind search index |
| Deploy | Not configured (`site` URL still unset → sitemap skipped) |

---

## Information architecture

### Sidebar groups (implemented)

1. **Start here** — Introduction, **Dice Mechanics**, Glossary  
2. **Human Potential** — Overview, Foundations, Skills, Traits, Exertion  
3. **Resolution & Continuity** — Harm, Echoes, Hierarchies, Inventory  
4. **Getting Started** — Campaign Setup, Character Creation  
5. **Automation** — At the Table  

**Rejected:** standalone How to Play (removed). Examples go **inline** in mechanic chapters.

### Planned additions

| Page | Group | Purpose |
|------|--------|---------|
| More inline examples | Inside existing chapters | ✅ author direction |
| `storyteller.md` | — | ❓ probably not |
| Sheet/tracker product UI | Outside Guidebook rules pages | High visual bar; empty structure first |

### URL policy

- Keep **flat** routes (`/echoes/`, `/dice-mechanics/`) for existing pages — stable links.  
- New reference pages may use `/reference/...` if a group grows.  
- Always use root-absolute links in Markdown: `/foundations/#…` (Starlight-friendly).

### Frontmatter conventions

```yaml
---
title: Short Title
description: One-line SEO / search blurb.
# optional:
# sidebar:
#   order: 2
#   badge: New
---
```

Use Starlight components where they clarify rules without gimmickry:

- `:::note` / `:::caution` / `:::tip` for ST advice and player warnings  
- `<Aside>` / cards on splash and overview pages  
- Tables for ratings, costs, protection ratios (already primary pattern)

---

## Phased delivery

### Phase 0 — Build green (day 0) — **done**

1. `npm install` with Astro 7 + Starlight 0.41  
2. Added `src/content.config.ts` (`docsLoader` + `docsSchema`)  
3. `npm run build` — 18 pages generated  
4. Remaining: confirm Glossary anchors in a browser pass; set `site` for sitemap  

**Exit:** `dist/` builds clean; `npm run dev` navigable.

### Phase 1 — Guidebook complete enough to play (content)

1. Close items in [documentation-gaps.md](./documentation-gaps.md) marked High (examples, ST chapter).  
2. Resolve design questions C1–C3 in rules text (dice tier, Advantage stacking, Tide tables).  
3. One editorial pass: heading levels, typography of quotes, “automation” wording.  
4. Keep Automation **table contract** in-site; keep engineering plan in `docs/plans/` (not Starlight) so players are not buried in schemas.

**Exit:** New group can learn the game from the site alone, without reading git history.

### Phase 2 — Presentation

1. Theme: grim pre-industrial palette (parchment/ink or dark iron); set CSS variables in `custom.css`.  
2. Optional display font for titles; keep body highly readable.  
3. Favicon / OG image for social previews.  
4. Splash page polish (index.mdx): short “three constraints” strip.  
5. Print CSS for ST who want paper cheat-sheets (Skills list, Harm tracks).

**Exit:** Site feels like Kodranni, not default Starlight purple.

### Phase 3 — Publishing

1. Choose host: Cloudflare Pages, Netlify, or GitHub Pages.  
2. CI: on push to `main`, `npm ci && npm run build`.  
3. Optional `editLink.baseUrl` once the public GitHub path is fixed.  
4. Custom domain optional.  
5. Version badge or “rules edition” date in footer (Starlight `lastUpdated` helps).

**Exit:** Stable public URL linked from README.

### Phase 4 — Ongoing editorial workflow

1. Rules changes land as Markdown PRs against `src/content/docs/`.  
2. Any rules change that affects bot behaviour must update:  
   - the rules page  
   - [automation.md](../../src/content/docs/automation.md) if the table contract changes  
   - [automation-architecture.md](./automation-architecture.md) if schemas/commands change  
   - [documentation-gaps.md](./documentation-gaps.md) if a gap closes or opens  
3. Prefer small PRs: one system per PR when possible.  
4. Do not put generated `dist/` in git.

---

## Content sources and migration notes

| Legacy | Handling |
|--------|----------|
| MkDocs (`/site` in `.gitignore`) | Abandoned; do not resurrect parallel trees |
| Python tooling leftovers in `.gitignore` | Keep ignore rules; no Python docs pipeline |
| Monolithic CharacterCreation | Split: `campaign-setup.md` + `character-creation.md` |
| Missing Automation chapter (promised in Intro) | Added `automation.md` (table contract) |

---

## Technical checklist (Starlight specifics)

- [ ] Verify content collection config for Starlight 0.41 + Astro 5  
- [ ] Built-in search (Pagefind) works on production build  
- [ ] Mobile sidebar usable  
- [ ] Internal link checker in CI (`astro check` / link lint)  
- [ ] `sharp` present for image optimisation when assets arrive  
- [ ] No client-side app state required — pure static content  
- [ ] Optional: multi-edition later via Starlight i18n only if needed  

---

## What stays *out* of Starlight

| Material | Location |
|----------|----------|
| Bot implementation, DB schemas, Discord command code | Future app package / repo area (see architecture plan) |
| Long architecture ADRs | `docs/plans/` |
| Private campaign notes for a live table | Not in this repo |

The Guidebook describes **what the table and the bot must honour**. It is not the bot source tree.

---

## Success criteria

1. A new Storyteller can go Introduction → Dice Mechanics → Human Potential → Campaign Setup → Character Creation without external notes.  
2. Every major term appears in the Glossary with a working link.  
3. Every automation capability listed in rules has a matching row in Automation + architecture plan.  
4. `npm run build` is CI-gated on `main`.  
5. Visual tone matches “pre-industrial grim human” without harming readability.

---

## Suggested immediate next steps

1. Run Phase 0 (`npm install && npm run build`).  
2. Author `examples.md` (highest play-value gap).  
3. Lock dice-tier rule (C1) so automation Phase 1 can start.  
4. Pick a host and add a one-file GitHub Actions workflow.
