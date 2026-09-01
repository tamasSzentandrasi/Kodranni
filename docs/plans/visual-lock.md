# Visual pinnacle

| Field | Value |
|-------|--------|
| **Date** | 2026-08-31 (rewritten; withdraws the V1–V30 dump) |
| **Status** | Working plan |
| **Replaces** | The 31 Aug numbered “lock” table in this file; chrome/product sentences in [`visual-system-and-community-tracker.md`](./visual-system-and-community-tracker.md) (that file is historical) |
| **Does not replace** | Rules locks in [`documentation-gaps.md`](./documentation-gaps.md) §A; hosting in [`infra-devsecops.md`](./infra-devsecops.md); Discord/store contracts in [`automation-architecture.md`](./automation-architecture.md) |

This is a **UX plan**, not a decision dump. Each remaining object is a job: who uses it, what it must do at the table, what is already shipped, options, and a recommended path. If a later chat cannot name the job and two real alternatives, it is not allowed to add a “lock.”

---

## 1. What pinnacle means

A Storyteller who has never seen Kodranni can **learn the system from the Guidebook alone**. A table that already knows the system can **run from the hall and sheets without the book open**. Landing, book, hall, sheet, and (later) chat cards feel like **one object** — grim, pre-industrial, human — not a Starlight skin, not a game HUD, not a dashboard.

Chrome never stands in for a rule. A cartouche is something you **do**. A chip is a **person**. A roundel is a **choice**. A well is **weather**. If the object’s job is unclear, the look is wrong even if it is pretty.

Pinnacle is **evenness plus use**, not more ornament.

---

## 2. Materials (settled by work, not by later chat)

These are the grammar we already earned. Do not reopen them to invent a fourth palette.

| Material | Job | Not |
|----------|-----|-----|
| **Iron** | Plates, gothic L-straps, soot, smoke. Holds the page. | HUD ticks, leather, gold |
| **Glass** | Fill of cartouches, roundels, fortune wells. Pewter leads. **Night** at rest, **moonlight** when asked (hover / pressed / focus). | A second rainbow; chapter roses as product chrome |
| **Blood** | Identity: falcon, current sidebar/tab, `.kod-example`, ST lanes, Dying, invoke rail, Crisis word, unspent numeral | Hover, fill of an act, “important so red” |

**Type:** Bellefair 400, `font-synthesis: none`. Book root ~119%; hall/sheets denser (~106%). Dark only.

**Shared CSS:** `packages/design` is the source. Guidebook aliases `.kod-widget__btn` → `.kod-btn`. Landing copies `public-root/design/`.

**Pictures:** Guidebook chapter roses (`src/assets/roses/*.jpg`) are **frontispieces in the book**. They are not hall marks, not sheet marks, not button fills. No iron oculus, no title sitting inside a cast frame, no sidebar roundels, no pagination-as-glass-tile. Hall/sheet mark is the **falcon**.

**Geometry:** hover and pressed change **light and soot**, not shape. A cartouche that bulges or a roundel that becomes a square on hover is a bug.

**No new Markdown class** for ornament. Widget copy stays in Markdown.

Do **not** put store schema, cookies, Discord ephemeral rules, or CI pinning in this file. Those are product/infra. Mixing them with chrome is how the last plan became unusable.

---

## 3. Object classes

Use the right object or the look lies.

| Class | Job | Examples | Not |
|-------|-----|----------|-----|
| **`.kod-btn` / folio** | An **act** — commit, continue, confirm, open a sheet as a deed | Widget tabs, Wanting confirm, landing “Open the Guidebook” | People, search, on/off |
| **`.kod-chip`** | A **person** in a list | Hall names, Find hits, roster | Filters |
| **`.kod-roundel`** | A **discrete choice** among peers | Marks 0–4, stepper 1–8 | Practice rating, hide/show of a whole dock (see Find) |
| **Fortune well** | Community **weather** 0–3 | Hall sky, book pillars | Character stats |
| **Pie (`.skill__ring`)** | Skill **rating + practice fill** | Sheet seals | A roundel swap |

If Find’s hide/show is built as a cartouche, it will read as “submit Find.” If Practice is a roundel, 0 and 3 will collapse into “a disc.” Jobs first.

---

## 4. Who is in the room

Design against these people, not against a screenshot.

| Person | Surface | What they are doing |
|--------|---------|---------------------|
| **New Storyteller, alone** | Guidebook | Learning a procedure before the first session |
| **Table, TV or laptop** | Hall projected | “Where is Mara.” “What is the weather.” Nave must stay readable at 3 m |
| **Player, phone** | Own sheet + hall | Check Skills, spend Wanting, find a name. One thumb |
| **Storyteller, prep** | Hall (later: ST desk clone) | Occupancy, outsiders on the porch, Fortunes as impressions |
| **Archive reader** | Read-only hall/sheets | Same layout as live. Cannot write |

A control that is elegant in a 1440 desktop window and invisible on a phone or a TV has failed.

---

## 5. What is already the face (do not redo)

- Guidebook plates: soot, pewter L-straps, black smoke. Identity plates keep blood **edges**, not blood corners.
- Guidebook **chapter opening**: centered rose JPEG, optional section kicker (link to parent), Bellefair word. Iron seal is fallback when there is no rose.
- **Cartouches** as night glass, moonlight on hover/pressed. End-caps are ornament files, not CSS diamonds pretending.
- **Roundels** as night glass wells for Marks / stepper digits.
- **Archetype cards**: lift + colour glow, not a button border flash.
- Hall as a **nave** (hierarchy occupancy, porch, sky of Fortunes), not a dashboard.
- Find exists: query, composed facets, hit/miss on the nave, `/` `f` to open, Esc clears then closes, persist `kod-hall:{slug}`.
- Practice on the sheet is a **pie**. Do not swap it for a rose or a roundel.
- Archive is meant to be a twin. Keep it twin; do not invent a thinner face.

The 25 Aug oculus / title-in-cast / sidebar-roundel / glass-pagination pass was tried and **cut**. Do not restart it.

---

## 6. Remaining work — designed, not listed

Each subsection: **job → shipped → problem → options → pick**. Options are real alternatives, not synonyms. “Recommended” is a starting recommendation for implementation, not a fake lock from a chat that never used the hall.

---

### 6.1 Find — find a person without losing the hall

**Jobs**

1. At the table, someone says a name. The hall must answer in one or two seconds without the ST scrolling four ladders.
2. The projected nave is the community. Find is a **tool**, not a second hall. It must not steal a fifth of the TV.
3. On a phone, the hall is the page. Find starts **asleep**.
4. Filters are **views** (“show me Outsiders on Coin”) as well as search. Facets compose: OR inside a group, AND across groups.
5. Keyboard: power users at a laptop. Touch: the rest.

**Shipped**

Fixed right dock (`.hall-search`), glass disc toggle (`.hall-find-toggle`, night/moon PNGs), query + Clear, facet chips (factions, tags, axis, standing, kind), count + hit list, `data-search=hit|miss` on `.member`, session persist, `/` `f`, Esc = clear then hide. Wide screens open Find by default unless stored closed. Open Find **pushes** the hall (`padding-right: 21.2rem`).

**Problems**

- The toggle is a 3.5 rem disc with **no word**. Closed, it does not say “Find.”
- Pushing the nave 21 rem is hostile to projection and to 1366-wide laptops.
- The hit list **duplicates** people who already sit in the nave. Two results UIs.
- Hide is `display: none` on the whole plate. No sense of “the lantern is here, the room is dark.”
- A wall of facet groups is fine for prep, noisy in play.

**Hide / show — options**

| | A. Lantern (recommended) | B. Command palette | C. Always-on filter bar |
|--|--------------------------|--------------------|-------------------------|
| **What** | Glass roundel stays as the latch. Closed: only the lantern. Open: plate overlays from the right. **Does not push the nave.** | `/` opens a center overlay; no persistent dock | Thin bar under the hall title, always visible |
| **Reads as** | A lamp in the hall you can wake | Spotlight search | Admin toolbar |
| **Table / TV** | Nave stays full width. Overlay may cover the right column — acceptable if hits also paint the nave | Nave fully visible until asked | Permanent chrome; fights “this is a hall” |
| **Phone** | Closed default. Roundel in the corner | Same overlay; good | Eats vertical space |
| **Discoverability** | Weak unless the closed lantern carries a **word** | Weak until you know `/` | Strong |
| **Wrong if** | Overlay covers the only person you needed and the nave does not highlight them | Faceted “show me Outcast on Arms” is miserable in a palette | The hall becomes a CMS |

**Pick A**, with three corrections to what is shipped:

1. **Do not push the layout.** Overlay the plate (`position: fixed`) over the nave. Highlight matches in the nave (`data-search`) as the **primary** result. Keep the hit list for keyboard, empty state, and people not on a visible rung.
2. **Closed default on every width**, including desktop. Persist last state. `/` and `f` still open and focus the field. Projection starts as a hall, not as a search app.
3. **Name the lantern.** When closed, a kicker “Find” sits with the roundel (visible on hover/focus at minimum; always visible on touch). When open, the same roundel is the close control and is moonlit (`aria-expanded`). This is **on/off**, so a roundel (choice) is the right class — not a cartouche (act).

**Esc:** keep two-step (clear filters, then close). That matches “I mistyped” vs “I am done looking.”

**Facets:** do not hide them. Collapse each **group** behind its legend (`<details>` or a disclosure) so play sees Query + Kind first; prep opens Factions / Standing. Do not turn facets into exclusive radios — “Mongol **or** Imperial” is a real question.

**Do not:** command-palette-only (kills composed views); cartouche labeled Search (lies about the job); dim the whole nave except hits (already rejected — the hall is still the hall).

Verify: 1440 hall with Find closed (nave full width); open overlay without the ladders jumping; type a name and see the chip in the nave; phone 390 closed default, open, close; `/` then Esc Esc.

---

### 6.2 Fortunes — weather, not a tank

**Job.** Fortunes are **community weather** (Crisis / Strained / Steady / Abundance). They colour every scene. They are not HP, not a second character sheet, not a 0–3 ledger you grind.

**Who.** ST frames the room (“Surplus is Crisis — the hall smells of want”). Players read the sky at a glance. The **book** must teach the same object the hall uses, or the first session will treat Fortunes as pips.

**Shipped.** Hall: icon + four-tier **stack** + state **word**, `data-level`, Crisis takes blood. Book: five pillars with icon + blurb, **no level**, scale taught in a table underneath.

**Problem.** The book’s pillars do not show 0–3. A cold reader never sees weather. The hall object and the book object do not match, so the table will not trust either.

**Options**

| | A. Same object in the book (recommended) | B. Book keeps blurbs, add four miniature halls | C. Only the table |
|--|------------------------------------------|------------------------------------------------|-------------------|
| **What** | Reuse hall `.fortune` markup/CSS in `echoes.md`: five pillars with `data-level` examples (e.g. Vitality 2, Surplus 0) | Five static “worked weather” rows | Keep pillars as identity; scale only as a table |
| **Teaches** | One object, two places | “There are examples” but two looks | Words without a reading |
| **Risk** | Example levels must be captioned as **illustrations**, not this campaign’s weather | Twice the chrome | Cold reader still cannot see Crisis |

**Pick A.** One CSS object (`packages/design` + guidebook diagrams). Book examples are labelled (“Crisis — Surplus 0”). Do not put live campaign numbers in the Guidebook.

Hall ST writes stay off the player hall; founding remains one write of all five (product, not this file’s job to re-argue).

---

### 6.3 Hierarchy in the book — occupancy, not a colouring sheet

**Job.** A Hierarchy is **one axis of believed standing**. One person may sit on several axes. The Ruler is **one seat above all axes**, not a fifth rung. Outsiders are on the **porch** until inducted (Outcast). Campaign setup leaves rungs **empty of names**.

**Who.** New ST must leave setup able to *see* a dual-axis person and an outsider who is not on a ladder. The hall already tries to *be* that diagram.

**Shipped.** Book: four pastel columns, copy-pasted rungs, `↓ · ↓ · ↓ · ↓`, no names, no porch, no dual-axis. Hall: occupancy, plus to open names, porch.

**Problem.** The teaching diagram is a different object from the hall. Pastel stacks (`#b85a4a` `#7a8fd4` `#c4a035` `#8a5a9a`) fight the triad. Empty rungs in setup are not shown as empty — they look like a filled org chart.

**Options**

| | A. Book diagram uses hall tokens (recommended) | B. Book stays schematic; hall is “the real one” | C. Screenshot the hall into the book |
|--|------------------------------------------------|-------------------------------------------------|--------------------------------------|
| **What** | Same iron plates, same rung language, one worked occupancy (two names, one on two axes, one outsider on the porch, Ruler labelled as a seat) | Keep pastel; add a caption “the hall is the living diagram” | Raster |
| **Teaches** | Setup and play are the same shape | Splits teaching from use | Rotts; not dual-language |

**Pick A.** Woodcut/rose scene plates in the chapter stay. The **diagram** is iron, not a second stained-glass product. Do not invent a fifth pastel.

---

### 6.4 Practice pie — 0, 1, 2, 3 must not be the same disc

**Job.** On a sheet, at ~2.3–2.7 rem, the player must read **rating** (the digit) and **practice toward the next** (the fill) without using archetype hue as the only signal. Empty ≠ in-progress ≠ max. Touch: open the name, not the pie.

**Shipped.** `.skill__ring` conic `--p`. Digit in the well.

**Problem (if still true in the browser):** empty and max can collapse; small digits vanish on mail/leather grounds; hover geometry must not change.

**Options:** (1) keep pie, raise empty/max contrast and digit size (recommended); (2) swap to a roundel — **rejected**, roundels are Marks-class choices, not a continuous fill; (3) gothic rose SVG — **rejected**, tried, Practice is a pie. Fail = stop and contrast the pie. Do not “fix” by changing the object.

---

### 6.5 Guidebook widgets — the lesson is visible

**Job.** A first-time reader of Marks, Omens, Tide, Practice, Dying, Weighing must **see the taught state** without hunting a hidden panel. After load, the active cartouche should look chosen (moonlight), not merely `aria-pressed` for the machine.

**Shipped.** Widgets in Markdown; JS hydrates; many panels after the first are `hidden`.

**Pick:** first panel of each teaching widget is in the HTML **visible**. Active `.kod-widget__btn` uses the same moonlight as hover/pressed. `prefers-reduced-motion`: no animation, still the moonlit well. Hungarian twin whenever widget copy changes.

Do not add a “Start” cartouche that hides the lesson behind a click. That is a tutorial overlay, not teaching.

---

### 6.6 Creation docks and Confirm

**Job.** During Weighing, Budget / Wanting / Confirm must stay on screen together at `max-width: 48rem`. Cartouche **end-caps must not clip**. Confirm is an **act** (glass cartouche). Blood may sit on a kicker (“Seal the sheet”), never as a fill or hover.

**Shipped.** Docks exist; overflow has clipped end-caps before; `.kod-btn--blood` as fill is a lie.

**Pick:** gutters like Find already reserved on the right; Confirm = `.kod-btn` moonlight; no blood fill class. After `creation.locked`, hide/show those docks with the **same lantern pattern as Find** (asleep until asked), not a second invention.

---

### 6.7 Chat cards (later)

**Job.** Discord and Fluxer show one card model: the roll, the intent, the result. Skill pick is **Archetype, then skill in that archetype** — that is how the sheet is organised; do not dump 72 skills in one list.

**Not this pass.** Research the host (Discord components vs CSS-on-embed) before drawing. Harm apply belongs on the **result card and the ST desk**, not as a scatter of ST-office buttons on every card before the desk exists.

---

### 6.8 ST desk (last)

**Job.** All ST writes (Fortunes correction, people, labels, hierarchy approve, myth craft, inventory approve, sheet correction, draft Approve) live on a **clone of the remade player hall and sheets**, with ST layout. Players never get those writes on the projected nave.

**Not this pass.** Building it before the player hall’s Find/Fortunes/Hierarchy are even would duplicate the wrong object.

---

## 7. Guidebook teaching that is visual (but not chrome)

These are **book** problems that happen to need HTML/CSS. Full chapter list: [`documentation-gaps.md`](./documentation-gaps.md).

| Need | Why it is visual | Not |
|------|------------------|-----|
| Fortune 0–3 on the pillar | Same object as hall weather | A prettier table |
| Hierarchy occupancy + dual-axis + porch | Same object as hall nave | Pastel columns |
| Myth effect-target table | A reading order: Echo → Pivotal → Fortune + slot | Hall `.fx` restyle first |
| First widget panel visible | The control *is* the lesson | A new widget type |
| Sample first roll on the Dice hub | One worked scene | A splash “how to play” page |

Hungarian twins on every Markdown/widget edit.

---

## 8. How to work

1. Name the **job** and the **person** (table / phone / new ST).
2. Name the **object class** (act / person / choice / weather).
3. Put **two real options** on the table. If you only have one, you have not designed.
4. Implement the pick. Verify by **using** the control at **1440 and 390**. Projection: nave must remain a hall with Find closed.
5. `prefers-reduced-motion`: instant. Light may still change.
6. Work on `main`. Commit subject + why. Push after verification.

Do not add rows to a lock table. Do not mix cookies, Discord, and cartouches in one numbered list.

---

## 9. Order of visual work

| Order | Work | Depends on |
|-------|------|------------|
| 1 | Find overlay + named lantern + closed default (§6.1) | Nothing |
| 2 | Book Fortunes = hall weather object (§6.2) | Design package fortune CSS |
| 3 | Book Hierarchy = hall tokens + occupancy example (§6.3) | Hall rung language |
| 4 | Widget first panel + moonlight selected (§6.5) | Cartouche moonlight (shipped) |
| 5 | Practice pie contrast if 0/3 still collide (§6.4) | See it on a sheet |
| 6 | Dock gutters + Confirm as glass act (§6.6) | Cartouche end-caps |
| 7 | Myth table in the book, then hall chrome (§7) | Echoes copy |
| 8 | Chat cards | Host research |
| 9 | ST desk clone | Player hall even |

---

## 10. Open questions (need a human)

These are the only undecided product calls this file will not fake.

1. **Find on a TV:** overlay covering the right-hand axis vs a **bottom sheet** that never covers ladders. Recommendation is overlay + nave highlight. Bottom sheet is the fallback if projection tests fail.
2. **Find closed default on desktop** will annoy a ST who lives in facets during prep. Persist last state should be enough; if not, a “keep Find open” is a preference, not a second UI.
3. **How-to-play page** in the book: only if Intro + Dice hub + sample roll still fail a cold reader. Splash remains rejected.
