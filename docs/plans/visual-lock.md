# Visual + product lock (2026-08-31)

Living lock for Guidebook, community hall, character sheets, landing buttons, Discord/Fluxer cards, and the Storyteller desk.

| Field | Value |
|-------|--------|
| **Date** | 2026-08-31 |
| **Status** | Approved |
| **Supersedes** | 2026-08-25 implementation order and several product sentences in the previous revision of this file; chrome and product sentences in [`visual-system-and-community-tracker.md`](./visual-system-and-community-tracker.md) (2026-08-23); “no polychrome stained-glass chrome” in [`starlight-guidebook.md`](./starlight-guidebook.md) |
| **Does not supersede** | Fortune purpose (weather, not a ledger); Wanting as a rite; founding as one board of five; Bellefair-only; dark-only; no new Markdown class; falcon as the hall/sheet mark; game-rule locks C1–C12 in [`documentation-gaps.md`](./documentation-gaps.md); DevSecOps I1–I10 in [`infra-devsecops.md`](./infra-devsecops.md) |

Guidebook teaching, examples, and interactivity **are in scope**. Residual teaching inventory: [`documentation-gaps.md`](./documentation-gaps.md) (rewritten 2026-08-31; do not use the 2026-08-18 checkmarks).

---

## Sentences this lock replaces

| Was | Now |
|-----|-----|
| Discord/Fluxer card chrome is a later programme | **In scope.** Cards, selection, whisper policy, command split vs ST desk. Visual research for Discord **and** Fluxer, ideally one card model. |
| ST desk = write chrome on the **same** live hall/sheet pages | ST desk is a **clone** of the remade hall + sheets: same campaign, same visual system, ST-facing structure, full ST tools. Built **last**. |
| Practice = quality-gated Marks roundel / rose | **Pie stays.** Failure is delivery: rating 0/1/2/3 indistinguishable; practice fill contrast. Do not replace the pie with a roundel. |
| Find = hideable side dock as the feature | Find is a **redesign** (players first). Hide/show is allowed **if** it is the best complete solution and done perfectly. |
| Guidebook chapter prose out of scope | Teaching, examples, interactivity, hierarchy picture, fortune picture, myth networking are in scope. |
| New pictorial marks as SVG | **Imagine rasters.** No new SVG icon language. Frozen roses stay. CSS geometry (clip-path, L-straps) may remain code. |
| Oculus / title-in-cast / sidebar roundels / pagination-as-glass-tile | **Do not restart.** 25 Aug product revert (`1741cc1`) stands. Author later lifted the rose-cast (`c6eeda3`). |
| Play-time mutation is bot-only | ST campaign mutation belongs on the **ST desk**. Chat is table dice and talk. **Harm apply stays on the result card and also exists on the desk** — both are valid. |
| Vardmark as the proof campaign | Vardmark is **2/10**. Replacement demo is a full story seed (plots, engagement), not a mechanical fixture list. |
| `documentation-gaps.md` 2026-08-18 status | Scraped and rewritten. How-to-play rejection is **re-evaluated**, not inherited. |

---

## Visual grammar (unchanged material)

Iron is **structure**. Glass is **light**. Blood is **identity**. Chapter roses are **pictures**.

Stained glass **enters**. It does not replace `--kod-blood` `#a01818` / `--kod-silver` `#c6c1b8` / `--kod-black` `#050505`.

Chapter title rose JPEGs (`src/assets/roses/*.jpg`) **stay as they are**. Product surfaces do **not** wear chapter roses; the falcon is the hall/sheet mark.

```
Pictures     chapter roses, archetype paintings, scene breath, fortune icon shapes;
             new pictorial marks via Imagine (faction/hierarchy/myth/hide-show)
Light        moonlit leaded glass (pewter leads, soot idle, silver on hover/fill)
Structure    iron plates, gothic L-straps, lamp-soot, tooled highlight, smoke drop
Identity     blood: falcon, current page/tab, example boxes, Dying, Echo invoke rail,
             unspent budget numeral, Crisis word + floor ember
```

**Interactive** (buttons, non-current tabs, chips, Find, spend, hide/show): iron + glass. Hover = moonlight through the well. **No blood hover.**

**Identity:** blood as rail, word, or a single lead — never a hover state.

Geometry does not change across default / hover / focus-visible / pressed. Only light and soot.

Type: Bellefair 400 only; `font-synthesis: none`. Guidebook root ~118.75%; campaign-ui **106.25%**.

`:focus-visible` blood ring once in `packages/design/primitives.css`. Cartouches and roundels opt out; their brightening is the focus.

Confirm and budget **may** be stained-glass fields (leaded pewter). That is glass-as-material, not `.kod-btn--blood`.

Inspiration at the repo root already produced cartouche, roundel, L-straps, roses. Re-read if a control is stuck. Do not start a second ornament language.

**New pictorial work** (faction marks, hierarchy axis marks, myth nature, **show/hide controls**, card-adjacent marks if the platform can take them): Imagine, same material. `packages/design/ornament/plus-ring.svg` and current hide/collapse chrome are **not** the destination.

---

## Process

Work on `main`. Author name and commit style. **Push is allowed** when a pass is verified and tested. Separate commits by meaning.

Verification is **not** the 25 Aug failure: CSS-checklist screenshots, “matches the lock,” unused product. Verification means using the surface the way a player or Storyteller would (click, type, filter, spend, open a widget, 1440 and 390). If browser tools cannot reach a surface, say so and use the next real substitute (tests, live URL). Do not call a docs-only pass visually done.

Quality: not less-bad. Each landed pass is a step toward the landing/Marks night-glass bar, with Astro interactivity and motion where they improve the job. `prefers-reduced-motion` snaps.

Dead ends are deleted when their replacement exists, not left beside it.

---

## Surfaces and order

Player-facing campaign site first. Guidebook pictures and teaching interactivity with it. Sheets/docks. Chat cards. Demo seed. **Storyteller desk last.**

| Pass | Work |
|------|------|
| 0 | This file; rewrite [`documentation-gaps.md`](./documentation-gaps.md); pointers in superseded docs |
| 1 | Hall: renderer unify; factions/tags/views; Find redesign; myth reading (after research); fortune wells; hierarchy occupancy; outsider optional sheets; Imagine hide/show; unsigned = projection |
| 2 | Guidebook hierarchy + fortune pictures; myth effect-target table + networking; widget after-load highlight; HU twin |
| 3 | Sheet pies (rating distinguishability + practice fill); dock clipping/gutters; Confirm glass |
| 4 | Chat cards + whisper cut; two-tier skill select; Discord **and** Fluxer visual research; token-command evaluation vs I1–I10 |
| 5 | Guidebook examples after incoming critique; **demo campaign** as a story, not a fixture |
| 6 | **ST desk clone** of remade hall + sheets; public `kod_setup`; delete `/community/setup/` |
| 7 | Delete the register |

Do **not** start at oculus. Do **not** treat hide/show Find as the hall pass.

Host desk `/operator` (loopback) stays Found / Discord bind / start-stop / snapshot. It is not the campaign desk.

---

## Shared kit

`packages/design` is the source. Guidebook aliases. Campaign consumes. Landing copies `public-root/design/`. Chat cards consume the **same decisions** under platform limits (Marks-first, die-tier language, identity blood) — not a third theme.

| Primitive | Job |
|-----------|-----|
| `.kod-plate` | Structure |
| `.kod-btn` / `--folio` | Acts (glass cartouche) |
| `.kod-roundel` | Discrete circular **choice** (Marks ladder). **Not** Practice. |
| `.skill__ring` pie | Skill **rating** + practice fill. Keep; fix delivery. |
| `.kod-fortune` | 0–3 well + today’s icons + state word. Book must show the scale on the object. |
| `.kod-chip` | A person (PC, NPC, outsider) |
| Find | Player search. Redesign. |
| Label mark | Faction/tag on a chip (Imagine) |
| Myth mark | Effect nature — **after** Guidebook research, not assumed chips |
| Hide/show | Collapse, Find, docks — **Imagine remake**, not `plus-ring.svg` leftover |
| `.kod-tablist` | Blood on current, iron hover |

**Cartouche = acts. Chip = people.**

Fortune well: Crisis empty + floor ember + blood **word**; Strained ¼; Steady ½; Abundance full. Do not glass-mask the icon by default.

**No inspect drawer.** Names with `characterSlug` open `/characters/:slug/`. Hover tip may preview who-we-see.

`.kod-btn--blood` is obsolete as a hover/fill cheat.

---

## Hall (player-facing)

Keep spatial hall: sky / crown / nave / porch / crypt; collapse; outsiders as porch (not a fifth ladder); falcon mark; hall-only rev poll on live.

**Factions** are world-groups (Guidebook Campaign Setup), not hierarchy axes. First-class on **any** person; **multi-membership**. Tags are campaign-defined labels. Groups of factions/tags → viewer **views**. Faction and hierarchy **selection** is its own interactive problem (not Find chips, not dimming the nave).

**Outsiders** stay on the porch until inducted → Outcast. They **may have a character sheet** (ST rolls bind a slug).

**Find:** complete redesign; primary users are **players** and the table projection. Complete people index. Hide/show may be part of the solution if it is the best one and executed at the same quality as the rest of the kit.

**Myths:** Guidebook contract is three most recent resolved Pivotal Echoes; tagged, narrow, compoundable effects ([`echoes.md`](../../src/content/docs/echoes.md)). Hall visualisation needs **assessment against that system** before locking a chrome (chips vs table vs other). Do not ship “kind string + paragraph.” ST craft is on the desk (last). Player hall is reading.

**Fortunes:** well + icon + state word. Book picture is redesigned in the same scheme (scale on the object).

**Hierarchy:** book diagram and hall occupancy share one redesigned scheme. Current four pastel text columns are not the destination. Woodcut/rose stay.

### Live vs archive vs ST desk

| Control | Live, unsigned (table) | Archive | ST desk (clone, last) |
|---------|------------------------|---------|------------------------|
| Look | yes | yes (twin) | same visual system, ST structure |
| Find | yes | yes | yes |
| Add / mutate record | no | no | yes (full ST privileges) |
| Poll / live pulse | yes | no | as needed |
| Writes | no | no | live store only |

Archive: `noindex`; no write endpoints. Snapshot may strip `pendingMoves` / account maps; the **face** matches the player hall.

Unsigned live `/community/` is projection. HallRites `+` must not appear without ST auth. `POST /api/community/figures` must not stay origin-only.

---

## Storyteller desk (last)

Clone of the **remade** community tracker and character sheets.

- Same store, same visual bar, structure **optimised for ST work**.
- Full privileges to shape the living record **without the bot** for those jobs.
- Not `/operator`. Not `/community/setup/` (dead public URL; delete when the clone ships). Not write-chrome on the player hall.
- Derive the ST layout from use cases **after** the player site exists in the new language (that site is what gets cloned).
- Auth: `kod_setup` (HMAC, `kind: 'community-setup'`, `role: 'storyteller'`, community-bound, `SameSite=Lax`). **No third cookie.** `kod_edit` stays slug-bound for the player’s unlocked sheet.
- Public path must work on the live origin (today setup is loopback-only and the edge 404s it).
- ST save of a sheet **may set `draft`**.
- Founding of all five Fortunes remains **one-shot**; later adjust is correction.

---

## Chat (Discord and Fluxer)

In scope. Target is the same visual peak as the rest of the product, **uniform across Discord and Fluxer** as far as each platform allows. Research before painting; current embed fields + stacked buttons + Foundation `<select>` are not the destination.

**Skill selection is two-tier:** Archetype first, then skills of that archetype. Not a flat skill autocomplete as the primary UI; not “Forgot Skill?” as the only Archetype path.

**Whispers / ephemerals = absolute minority.** Keep: (1) Birth Omen / Guiding Hand results, (2) personal edit URL **if** that command still exists after the token evaluation, (3) errors to the command author, (4) not-live notice. Rolls, intent, results: **channel**.

**Command split (default):** ST campaign mutation → ST desk. Chat → conversation and dice.

| Chat | ST desk | Both |
|------|---------|------|
| `/roll` + public result | Fortunes, people, labels, hierarchy move/approve | **Harm apply** |
| `/intent` if kept (public homework) | Myth craft, inventory approve, sheet correction, members | |
| `/create` `/claim` `/focus` (table start); spends on the **web sheet** | Draft Approve / Changes / Deny | |
| Weighing dice (private results) | | |
| Token issue — **evaluate** | | |

**Token commands** (`/live`, ephemeral `kod_edit` / `kod_setup` links, `/map`): evaluate against [`infra-devsecops.md`](./infra-devsecops.md) I1–I10 (one hostname, operator desk prints URLs, device key, no ST-held bot token). Do not assume `/live` stays; do not delete it in this docs pass.

**Harm apply** remains on the result card **and** exists on the ST desk. Mid-scene and between-scene are both real.

Do not add more ST-office buttons to cards while the desk is unbuilt, except Harm which already exists.

---

## Sheets

Identity plate, monogram, who-we-see, dual-capacity rails, foundation groups, Echo plates, inventory plates stay.

- **Practice pie:** centre numeral = rating. **0, 1, 2, and 3 must be distinguishable at a glance**, independent of archetype underpaint. Fill = progress toward next rank (`--p` mapping unchanged); empty / some / almost / full must track. ~2.3–2.7rem, Warrior and Artisan, desktop and 390px. Touch path without hover. If delivery cannot distinguish ratings, **stop** — do not swap in a roundel.
- Invoke: blood **left rail**, not a full-width blood fill.
- Rails: inset glass slugs. Mobile: horizontal pair, segments in a **row**.
- Confirm: glass cartouche/folio; identity on the rune kicker.
- Budget: stained-glass fields if they sit with the cartouche; remaining-points **numeral stays blood**. Always visible during creation. After lock, hide/show (Imagine hide/show, same bar as Find).
- Docks must not clip their own cartouches, must not cover jump targets, Budget stays available during Wanting-pay on phone.
- Roster: plates or hall chips.

---

## Guidebook (teaching)

Pinnacle line still stands: a new Storyteller can learn the system from the pages alone. One reader could not, without a playtest. That is a teaching **and** interactivity failure.

- **Examples** are the prime target. Hold wholesale prose rewrite until the incoming critique. Known holes may be repaired earlier (Reputation→social Harm as numbers; multi-axis; Dice hub sample roll).
- **Widgets:** taught state visible; after load, **subtle glow/wave** on interactive options. `prefers-reduced-motion`: no wave, options still distinct.
- **Hierarchy picture:** complete redesign with the hall. Occupancy teaching.
- **Fortune picture:** scale 0–3 on the object; match hall wells.
- **Myths:** table of what they affect, clear targets, networking in the system (Echo → Pivotal → Fortune shift + Myth slot; tag on roll). Visualisation research before hall chrome.
- No new Markdown class. Widget contract unchanged. HU twin for Markdown/widget edits.
- How-to-play chapter: **re-evaluate** in `documentation-gaps.md`; do not treat 2026-08-18 🚫 as live.

---

## Demo campaign

Vardmark is not the quality bar. Replacement is a **story seed**: plots, pressure, engagement, material life — Guidebook Campaign Setup standard, not slop and not a list of mechanics to tick. It must also exercise the product (multi-faction, tags/views, myths, dual-axis standing, outsider sheets) **because the story needs them**.

---

## Quality gates

**Practice pie.** Rating 0≠1≠2≠3 at a glance; fill readable; empty ≠ in-the-work; max ≠ empty; geometry stable; reduced motion snaps. Browser, Warrior + Artisan.

**Find.** Player can find a name and a view without fighting the control. Hide/show only if it is part of that, executed perfectly.

**Cards.** Two-tier Archetype → skill. Next action obvious. Discord and Fluxer share the model.

**ST desk.** Still obviously the campaign, not a settings app. Harm on desk is as fast as the card for apply/heal.

**Hierarchy / fortune pictures.** Book and hall ship together. Side-by-sides with roses + fortune accents before painting.

**Oculus.** Not a work item. Do not clip or redraw roses.

---

## Delete last

Remove only after the replacement is browser-verified. If grep still hits, it is not dead.

| Item | Notes |
|------|--------|
| `/community/setup/` | After ST desk clone |
| `InspectDrawer.astro` + `.kod-drawer` CSS | Job cut |
| `DraftPanel.astro` | Unused |
| `practice-rose*.svg` | Pie stays; unused roses go when grep-clean |
| Dual hall HTML (Astro twins vs `hall-render`) | After one renderer |
| `.kod-btn--blood` fill | After Confirm/HallRites are glass |
| Find blood top rail | After Find redesign |
| Duplicate fortune/button trees | After shared `.kod-fortune` / `.kod-btn` |

Do **not** delete `.skill__ring` as “HUD leftover.” It is the Practice control.

---

## Must not regress

- `kod_edit` slug-bound; `kod_setup` HMAC community-bound ST.
- Founding of all five Fortunes is one-shot; later change is correction.
- Practice `--p` and spend math; Wanting lock / staging / confirm payloads.
- Hall poll: live + founded only; never archive; never sheets.
- Guidebook Markdown widget contract; rose JPEG files.
- Archive `noindex`; no write endpoints.
- Outsiders stay off the ladders until inducted.
- DevSecOps I1–I10 (one hostname, no campaign git repo, ST holds no CF/Discord/GitHub tokens).

Landing stays a portal. Chat remains the issuer of whatever tokens survive the evaluation, and the mid-scene table for rolls. Host `/operator` remains the host desk.
