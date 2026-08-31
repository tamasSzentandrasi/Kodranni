# Visual + product lock (2026-08-31)

| Field | Value |
|-------|--------|
| **Date** | 2026-08-31 |
| **Status** | Approved |
| **Surfaces** | Guidebook; `/community/` live + archive; `/characters/:slug/`; creation docks; Discord/Fluxer cards; ST desk (clone, last); landing buttons |
| **Supersedes** | 2026-08-25 order in the previous revision of this file (oculus, Practice roundel, ST writes on player pages, Find = hide/show, cards later); 23 Aug chrome/product sentences in [`visual-system-and-community-tracker.md`](./visual-system-and-community-tracker.md); “no polychrome stained-glass chrome” in [`starlight-guidebook.md`](./starlight-guidebook.md) |
| **Does not supersede** | Fortunes = ambient 0–3 weather; Wanting = creation rite; founding = one write of all five; Bellefair 400; dark-only; no new Markdown class; falcon = hall/sheet mark; C1–C12 in [`documentation-gaps.md`](./documentation-gaps.md); I1–I10 in [`infra-devsecops.md`](./infra-devsecops.md) |

Teaching/examples/interactivity: in scope. Inventory: [`documentation-gaps.md`](./documentation-gaps.md) (ignore 2026-08-18 ✅/🚫).

---

## Decisions

| ID | Decision |
|----|----------|
| **V1** | Tokens: `--kod-blood` `#a01818`, `--kod-silver` `#c6c1b8`, `--kod-black` `#050505`. Iron = plates/L-straps/soot. Glass = cartouche/roundel/well fill (pewter leads, moonlight hover). Blood = identity only (falcon, current tab, `.kod-example`, Dying, invoke rail, unspent numeral, Crisis word). No blood hover. |
| **V2** | Interactive geometry is constant across default/hover/focus-visible/pressed. Light and soot change. `:focus-visible` blood ring once in `packages/design/primitives.css`; cartouches/roundels opt out. |
| **V3** | Type: Bellefair 400, `font-synthesis: none`. Guidebook root 118.75%; campaign-ui 106.25%. |
| **V4** | `src/assets/roses/*.jpg` frozen. No oculus, title-in-cast, sidebar roundels, pagination-as-glass-tile (`1741cc1`, `c6eeda3`). Product chrome does not use chapter roses. Hall/sheet mark = falcon. |
| **V5** | New pictorial marks (faction, hierarchy axis, myth nature, **hide/show**, plus/collapse) = Imagine rasters. Do not add SVG icon sets. Keep CSS clip-path / L-straps. Replace `packages/design/ornament/plus-ring.svg` for hide/show and add. |
| **V6** | `.kod-btn` / `--folio` = acts. `.kod-chip` = people. `.kod-roundel` = Marks ladder choice, **not** Practice. `.skill__ring` conic pie = rating + practice fill. |
| **V7** | Practice: keep pie. Rating digits 0, 1, 2, 3 must be distinguishable at ~2.3–2.7rem without using archetype hue as the signal. `--p` = practice/threshold (unchanged). Empty fill ≠ in-progress; max ≠ empty. Touch: `<details>` under the name. Fail = stop; do not swap to a roundel. |
| **V8** | Fortune object: icon (current PNGs unless Imagine side-by-side wins) + well fill 0 / ¼ / ½ / 1 + state word (Crisis blood + ember, Strained, Steady, Abundance). Book and hall share the object. Book must show 0–3 on the pillar, not only in a table below. |
| **V9** | No inspect drawer. `characterSlug` → `/characters/:slug/`. `data-tip` may preview `whoWeSee`. |
| **V10** | `.kod-btn--blood` is not a fill/hover. Confirm/HallRites = glass cartouche; identity on kicker. |
| **V11** | Archive = read-only twin of player hall/sheets (layout, Find, plates). `noindex`. No write endpoints. Snapshot may omit `pendingMoves`, `fortuneMeta`, account maps. |
| **V12** | Unsigned live `/community/` = projection. No HallRites `+`. `POST /api/community/figures` requires `kod_setup`. |
| **V13** | ST desk = **clone** of remade hall + sheets, ST layout + all ST writes. Built **last**. Auth: `kod_setup` (HMAC, `kind: 'community-setup'`, `role: 'storyteller'`, community-bound, `SameSite=Lax`). No third cookie. `kod_edit` slug-bound. Public live origin must accept `kod_setup` (today `/community/setup/` is loopback; edge 404). Delete `/community/setup/` when the clone ships. `/operator` = host only (Found, Discord bind, start/stop, snapshot). |
| **V14** | Founding = one `setStartingFortunes` of all five. Later ST change = correction, not a second founding. |
| **V15** | ST sheet save may set `status: 'draft'`. |
| **V16** | Factions ≠ hierarchy axes. `labelIds[]` on every person (kin, NPC, outsider); multi-faction. Tags = ST labels. `LabelGroup` → viewer views. Selection UI for faction/hierarchy is not Find chips and not `data-preview-faction` dimming the nave. |
| **V17** | Outsiders = porch until inducted → Outcast. Optional `characterSlug` / sheet so ST rolls bind a slug. |
| **V18** | Find: redesign for players + table projection. Index: kin, outsiders, ruler, pending. `name.includes` exclusive-chip dock is not the spec. Hide/show allowed if the rest of the control meets V2/V5/V6. Persist in `sessionStorage` `kod-hall:{slug}`. Phone default: Find closed (Fortunes first). |
| **V19** | Myths: rules in `echoes.md` (max 3 resolved Pivotal Echoes; tag on roll; compound `MythEffectKind`). Book: effect-target table + Echo→Pivotal→Fortune+Myth slot. Hall chrome: choose after that table exists (do not implement `.fx` restyle first). ST craft on desk (last). |
| **V20** | Hierarchy: `diagrams.css` + hall occupancy share tokens. Replace `.kod-hier-axis--*` pastel stacks (`#b85a4a` `#7a8fd4` `#c4a035` `#8a5a9a`) and `↓ · ↓ · ↓ · ↓`. Woodcut/rose files stay. Occupancy in the book (dual-axis, ruler, outsider). |
| **V21** | Chat in scope. One card model for Discord and Fluxer (`packages/chat-ui`). Skill pick: Archetype select, then skill select filtered by that archetype. Research platform components before CSS-on-embeds. |
| **V22** | `replyEphemeral` / `whisper: true` only for: Birth Omen / Guiding Hand results; personal edit URL if that command remains; command-author errors; not-live. `/roll` confirm, intent, results: channel. |
| **V23** | ST writes (Fortunes, people, labels, hierarchy approve, myth craft, inventory approve, sheet correction, draft Approve) → ST desk. `/roll`, `/intent` (if kept), `/create` `/claim` `/focus`, weighing dice stay on chat. **Harm apply: result-card button and ST desk.** Do not add other ST-office buttons to cards before the desk exists. |
| **V24** | Evaluate `/live`, `?edit=` token links, `/map` against I1–I10 (one hostname, `/operator` prints URLs, device key). Keep until that eval; do not delete in a docs commit. |
| **V25** | Docks: `overflow` must not clip `.kod-btn::before` endcaps. Reserve gutters (Find already sets `padding-right`). Budget visible during `wanting-pay` at `max-width: 48rem`. Creation: Budget, Wanting entry, Confirm always on; after `creation.locked`, hide/show (V5). |
| **V26** | Widgets: first taught panel visible (avoid `hidden` on the panel that is the lesson). After load: CSS highlight on `.kod-widget__btn` (opacity/glow, `prefers-reduced-motion: no animation`). HU twin on Markdown/widget edits. |
| **V27** | Demo: replace Vardmark (score 2/10). Seed must pass Campaign Setup S1 (place, community, pressure, decision that cannot wait) and carry plots; product fields exist because the story uses them. |
| **V28** | `packages/design` is CSS source. Guidebook `widgets.css` aliases `.kod-widget__btn` = `.kod-btn`. Campaign `@import`s. Landing copies `public-root/design/`. |
| **V29** | Work `main`. Commits: subject + why, author identity. Push after verification. Verify = operate the control (or tests if no UI). 1440 and 390 for layout. Do not verify by matching this file to a screenshot. |
| **V30** | Motion: practice `--p`, dock open/close, Find hits, HallRites/Wanting, V26 highlight. `prefers-reduced-motion` = instant. |

---

## Renderers and routes (current)

| Route | Code | Required change |
|-------|------|-----------------|
| `/community/` | `hall-render` `communityInner()` | Player hall. Set `data-source` from store (`live` vs archive); today hardcoded `"snapshot"`. |
| `/characters/:slug/` | campaign-ui + `hall-render` `sheet.ts` | Same pie/dock CSS. |
| `/community/setup/` | Astro twins | Delete after V13 clone. |
| `/operator` | `operator.astro` | Host desk. Loopback. |
| Cards | `packages/chat-ui` + `apps/bot-runtime` | V21–V24. |

One HTML path for live + archive hall (`hall-render`). Do not keep a second Astro hall.

---

## Store (current → required)

Current (`packages/store/src/types.ts`): `CommunityRecord.factions?: {name, hue}[]`; `OutsiderRecord.faction?: string`; no factions/tags on `CharacterRecord` / `HierarchyPlacement`; `FoundationMyth.effects[].faces|amount` unused in UI.

Required (names not frozen):

```
LabelGroup { id, name, kind: 'faction' | 'tag' }
Label      { id, groupId, name, hue?: number }  // hue required if kind=faction
Person     { labelIds: string[] }               // placements, outsiders, characters
```

Migrate `factions[]` and `OutsiderRecord.faction`. Kin default `labelIds = []`.

---

## Pass order

| Pass | Deliverable |
|------|-------------|
| 0 | This file, `documentation-gaps.md`, pointers |
| 1 | Player hall: unify renderer; V12 auth; V16–V18; V8 wells; V20 occupancy; V17 sheets; V5 hide/show; V19 reading only after book table |
| 2 | Guidebook: V20, V8, V19 table, V26; HU |
| 3 | Sheets: V7, V25, V10 Confirm |
| 4 | Cards: V21–V24 |
| 5 | Examples after critique; V27 demo |
| 6 | V13 ST desk |
| 7 | Delete list |

---

## Delete (after replacement is used in browser or tests)

| Path / class | After |
|--------------|--------|
| `/community/setup/` | V13 |
| `InspectDrawer.astro`, `.kod-drawer` | already unused as UI |
| `DraftPanel.astro` | unused |
| `practice-rose.svg`, `practice-rose-petals.svg` | V7 keeps pie |
| Astro hall twins | single `hall-render` |
| `.kod-btn--blood` fill | V10 |
| `.hall-search` `border-top` blood | V18 |

Do not delete `.skill__ring`.

---

## Regression

- `kod_edit` slug-bound; `kod_setup` HMAC community-bound.
- Founding one-shot; `--p` and spend math; Wanting payloads.
- Poll: live + `fortunesFoundedAt` only; never archive or sheets.
- Widget Markdown contract; rose JPEG bytes.
- Archive: no writes, `noindex`.
- Outsiders not on ladders until inducted.
- I1–I10.
