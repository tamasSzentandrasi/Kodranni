# Visual + product lock (2026-08-25)

Living lock for Guidebook, community hall, character sheets, and landing buttons.

| Field | Value |
|-------|--------|
| **Date** | 2026-08-25 |
| **Status** | Approved |
| **Supersedes** | Chrome and several product sentences in [`visual-system-and-community-tracker.md`](./visual-system-and-community-tracker.md) (2026-08-23) and the “no polychrome stained-glass chrome” line in [`starlight-guidebook.md`](./starlight-guidebook.md) |
| **Does not supersede** | Guidebook teaching jobs; Fortune purpose (weather, not a ledger); Wanting as a rite; founding as one board of five; Bellefair-only; dark-only; no new Markdown class; falcon as the hall/sheet mark |

Jobs that still stand: Fortunes are ambient weather; Wanting is a rite; founding stores all five once, then later change is correction; Guidebook supplies purpose, not a wireframe.

---

## What this lock is

Iron is **structure**. Glass is **light**. Blood is **identity**. Chapter roses are **pictures** (and may throw their own light onto the floor immediately under them).

Stained glass **enters**. It does not replace `--kod-blood` `#a01818` / `--kod-silver` `#c6c1b8` / `--kod-black` `#050505` as the theme colours.

Chapter title rose JPEGs (`src/assets/roses/*.jpg`) **stay as they are**. Integration is chrome around them, not a redraw.

The three product surfaces share one kit. Redundancies are named; they are **deleted last**.

Inspiration files at the repo root already produced the current cartouche, roundel, L-straps, and roses. Re-read them if a control is stuck. Do not start a second ornament language from them.

---

## Sentences this lock replaces

| 23 Aug (and 18 Aug ornament) | Now |
|------------------------------|-----|
| No polychrome stained-glass chrome | Glass is material (pewter leads, moonlight). Polychrome is pictures, plus the rose’s own floor-cast |
| Archive visitor gets a thinner face (no Find, no tools) | Archive is a **read-only twin**: same look, same Find / wayfinding; no automation, no writes |
| Play-time mutation is bot-only; no ST web token | ST web edit is first-class via existing `kod_setup`. Bot stays for mid-scene |
| Inspect drawer replaces hover-only who-we-see | **No inspect drawer.** Sheet holds the person; hall holds standing. Name with a slug opens the sheet |
| Add figure / faction as incidental | **Stay.** Better path for people who appear in play when the table is not mid-scene |
| Practice = HUD ring (later restore) or a casual rose swap | Practice is a **quality-gated** roundel: rating **and** progress toward the next rank must both read at ~2.3rem |

---

## Four layers

```
Pictures     chapter roses, archetype paintings, scene breath, fortune icon shapes
Light        moonlit leaded glass (pewter leads, soot idle, silver on hover/fill);
             a chapter rose may throw its own polychrome onto the floor-cast beneath it
Structure    iron plates, gothic L-straps, lamp-soot, tooled highlight, smoke drop
Identity     blood: falcon, current page/tab, example boxes, Dying, Echo invoke rail,
             unspent budget numeral, Crisis word + floor ember
```

Chapter `--kod-icon-hue` is wayfinding tint (sidebar mark, related light). It is not a licence to recolour buttons.

**Interactive** (buttons, non-current tabs, chips, Find, spend, hide/show): iron + glass. Hover = moonlight through the well. **No blood hover.**

**Identity** (list above): blood as rail, word, or a single lead in the glass — never a hover state.

Confirm and budget cards **may** be stained-glass fields (leaded pewter, like the cartouche). That is glass-as-material, not `.kod-btn--blood`.

Geometry does not change across default / hover / focus-visible / pressed. Only light and soot.

Type: Bellefair 400 only; `font-synthesis: none`. Guidebook root ~118.75%; campaign-ui **106.25%**.

`:focus-visible` blood ring is declared once in `packages/design/primitives.css`. Cartouches and roundels opt out; their brightening is the focus.

---

## Guidebook roses

Freeze the JPEGs and `chapterRoses` in `src/lib/chapter-icons.ts`.

- Rose sits in an **oculus** (existing seal-ring as the stone/lead that holds the painting). Do not shrink the picture to make room.
- Floor-cast **keeps the rose’s own colour**. Do not remix it into silver.
- Kicker + title sit in that pool of light if it can be made *very well*; if a chapter clips the painting, stack the title **under** the cast. Never regenerate the JPEG.
- Prose column after the Futhark `hr` remains black / silver / blood.
- Woodcut sidebar icons stay (they read at 1.4rem); each sits in a small glass roundel. Current page: blood identity + the roundel lights.
- Starlight search: iron field, not a rounded pill.
- `kod-breath` is illustration, not a second title. First breath after the first divider.

No new Markdown class. Widget contract unchanged. Product surfaces do **not** wear chapter roses; the falcon is the hall/sheet mark.

---

## Shared kit

`packages/design` remains the single source (`tokens.css`, `primitives.css`, ornament URLs). Guidebook `widgets.css` aliases (`.kod-widget__btn` = `.kod-btn`). Campaign consumes. Landing copies unhashed `public-root/design/`.

| Primitive | Job |
|-----------|-----|
| `.kod-plate` | Structure (L-straps, soot, `--kod-smoke`) |
| `.kod-btn` / `--folio` | Acts (glass cartouche; landing, pagination, Store, Confirm-if-wide) |
| `.kod-roundel` | Discrete circular choice (Marks ladder is the parent) |
| `.kod-fortune` | Weather pillar — **today’s fortune icons**, tooled well as the body, state word as the reading |
| `.kod-chip` | A person (PC, NPC, **outsider**) — hall soot-slip; outsiders add a quality faction mark |
| `.kod-dock` | Hideable side panel (Find; sheet docks after creation) |
| `.kod-tablist` | Blood on current, iron hover |
| `.skill-seal` | Practice — roundel + petal fill, **quality-gated** |

**Cartouche = acts. Chip = people.**

Fortune well: Crisis empty + floor ember + blood word; Strained ¼; Steady ½; Abundance full. Do **not** assume the icon should be glass-masked; keep today’s mask-and-accent craft unless a side-by-side beats it. Book always shows purpose copy; hall uses `<details>`.

**No inspect drawer.** `.kod-drawer` is obsolete once unused — delete last.

`.kod-btn--blood` is obsolete as a hover/fill cheat.

---

## Hall

Keep: sky / crown / nave / porch / crypt; collapse rules; outsiders as porch (not a fifth ladder); myth plates; falcon mark; hall-only rev poll on live; **HallRites** (add figure, add faction).

Find is a **hideable side dock** (not a blood-top always-on dashboard; not a brand-row cartouche that throws the panel away). Persist hide in `sessionStorage`. Desktop: visible by default when busy, hidable always. Phone: **hidden by default** so Fortunes lead. Archive: same Find, no add-faction.

Names with `characterSlug` open `/characters/:slug/`. Names without a sheet stay on the hall. Hover tip may preview who-we-see; the sheet is the path.

Hierarchy colour and flavour are **not done**. Current axis flats are plain and not of the roses’ family. Book diagram and hall occupancy must share one investigated scheme (recessed glass wells; saturation still falling Honoured → Outcast). Do not ship four new random pastels.

### Live vs archive

| Control | Live, unsigned | Live, `kod_setup` | Archive |
|---------|----------------|-------------------|---------|
| Fortunes look | yes | yes + adjust | yes |
| Find dock | yes, hideable | yes, hideable | yes, hideable |
| Add figure / faction | no | yes | no |
| Fortune well set | no | yes | no |
| Poll / live pulse | yes | yes | no |
| Pending knots | if present | if present | no |

Archive must not grow write endpoints. `noindex` stays. Snapshot may still strip `pendingMoves` / account maps; the **face** (layout, Find, plates) matches live.

---

## Storyteller web edit

Extend **`kod_setup`** (already: HMAC, `kind: 'community-setup'`, `role: 'storyteller'`, community-bound, bot-issued `/live`, cookie `SameSite=Lax`, same secret as sheet tokens). This is the ST session for the **whole live campaign-ui**, not only `/community/setup/`.

- **`kod_edit`** stays slug-bound for the player’s own unlocked sheet. **Do not** reuse it for community writes. **Do not** mint a third cookie.
- ST (live only) may: correct Fortunes after founding; add figure / faction; edit any sheet (an ST save **may set `draft`**); grow other hall writes behind the same gate.
- ST may not: archive writes; unsigned live writes; use a player sheet token as community-wide auth.
- Founding of all five remains **one-shot**; later ST web adjust is correction, not a second founding.
- Unsigned live URL remains table projection. Signed `/live` shows write controls on the **same pages**.
- Bot remains for mid-scene rolls, Harm, Approve cards.

---

## Sheets

Identity plate, monogram, who-we-see, dual-capacity rails, foundation groups, Echo plates, inventory plates stay.

- **Practice** (own effort): Marks-family roundel; centre numeral = rating; petal/glass fill = progress toward next rank (`--p` mapping unchanged). Gate: both facts glanceable at ~2.3rem on Warrior and Artisan, desktop and 390px, empty/in-practice/max. Touch: `<details>` under the name. If it cannot pass, **stop and say so** — do not merge a pretty HUD. Spend `closest` updates only when the host class exists.
- Invoke: blood **left rail**, not a full-width blood fill.
- Rails: inset glass slugs. Mobile: horizontal pair, segments in a **row**.
- Confirm: glass cartouche/folio; identity on the rune kicker.
- Budget (Foundations / Skills / Words): stained-glass fields if they sit with the cartouche; remaining-points **numeral stays blood**. **Always visible during creation.** After lock, hide/show like Find.
- Roster: plates or hall chips, not a settings list.

---

## Quality gates (must not ship around)

**Practice.** Rating is first; practice-toward-next is second; empty cannot look “in the work”; max cannot look empty; geometry identical across states; reduced motion snaps. Iterate in the browser. Permission to stop.

**Oculus.** If title-in-cast is not *very well* on a chapter (including HU), stack the title under the cast. Never clip or redraw the rose.

**Hierarchy flavour.** Side-by-sides with roses + fortune accents before painting. Book and hall ship together.

---

## Delete last

Named redundancies (HUD `.skill__ring`, `.kod-btn--blood`, Find blood top rail, inspect CSS/component, duplicate fortune/button trees, unused rasters) are removed only after the replacement has been browser-verified. If grep still hits, it is not dead.

---

## Implementation order

Independently reviewable PRs. Visual check at 1440 and 390 after each.

1. This file + pointers in the superseded docs (this PR).
2. Guidebook oculus (roses untouched; cast keeps rose colour).
3. Shared primitives (btn, roundel, fortune, dock, chip).
4. Hall: well, Find hide/show, outsider chips, HallRites restyle. **No inspect drawer.**
5. ST desk: `kod_setup` on live hall + sheets (draft-on-ST-edit).
6. Hierarchy colour/flavour pass (book + hall).
7. Practice seal (quality-gated).
8. Sheet chrome: invoke, rails, roster, Confirm/budget glass, docks.
9. Pagination folio.
10. Delete the register.

Programme ends at 10. Landing stays a portal. Discord *card* chrome is a later programme; Discord remains the issuer of `kod_setup` / `kod_edit` and the mid-scene table.
