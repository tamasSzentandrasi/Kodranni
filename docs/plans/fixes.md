# Fixes

**Date:** 2026-10-22
**Status:** Implemented on 2026-10-22. The capability log is [capabilities.md](./capabilities.md). The click-through is [manual-test.md](./manual-test.md).
**Findings:** [review.md](./review.md). **Rules:** the Guidebook. **Product lock:** [overview.md](./overview.md), [decisions.md](./decisions.md), [hosting.md](./hosting.md), [chat.md](./chat.md), [status.md](./status.md).

This batch is the 18 open drifts from the review, plus every item that review left for a later section. The three rules gaps — the Foundation modifier on a level-up, a time-leap downgrade, and Dying — are specified here in full. Approval of this file is the instruction to implement it. An answer that differs from a recommendation replaces that recommendation.

Holes H1–H3 and the structure deletions are already in the working tree. The Practice award at rating 0 is `b6d489d`. The skill roundel fill is `8f0f3b7`. Those stay as they are. This file does not redo them.

---

## Questions

Each recommendation is the reading I will implement if you approve the file as written.

### 1. What one downgrade does — accepted

The Skills chapter says to take the five Skills with the lowest Practice progress, roll the Omen die, and downgrade that many of them. It does not say whether a downgrade drops a rank, erases Practice on the current rank, or both. Decisions say the chosen skills “fall,” and the Storyteller confirms on the person. It is not part of Restore.

**Recommendation.** A selected Skill at rating 1, 2, or 3 loses one rank. Practice on the new rank is 0. The new threshold comes from `practiceThreshold` and that Skill’s ruling Foundation. A selected Skill already at rating 0 has no lower rank, so the downgrade clears the Practice it had accumulated toward 1, and the threshold stays the 0→1 bar for that Foundation.

The pool is the Skills already on the sheet that have a rank or any Practice. Untouched catalog Skills stay out. Progress is Practice ÷ threshold. Rating 3 counts as progress 1, so a mastered Skill is last in line and is reached only when fewer than five Skills qualify. Ties break by name, then the Omen’s count is picked at random from that five (or from the smaller pool, capped at how many qualify). The die is a fresh d20. Scene faces are left alone. The desk proposes; confirm writes; dismiss writes nothing.

### 2. Dying, and the line you called a saving throw — accepted, with the tools named below

The Guidebook has no saving throw, and Marks are not a pass/fail target. Harm says stabilisation is a successful Healing attempt: a companion rolls Resolve + Healing, ordinary d8 when they have the knowledge and the material, d6 when they do not. The fever example reads 1 Mark as the fever lifting and 0 Marks as the body being done. That is the Storyteller reading the count. The track stays at 3. A permanent Trait almost always remains, and the Storyteller names it. Automation and decisions both make the clear itself a desk edit that asks for the Trait.

The required spend is already in the roll path. `executePlayerRoll` and the pool preview throw `Dying characters must spend Exertion on every roll` when Dying and the spend is 0. After a legal spend, Exertion at 0 sets the status to dead. The Ready card omits Exertion · 0 while Dying and at least one point remains. The router nudges a Dying confirm up to 1 in that same case. No test calls the throw. The result card does not say the person died. `deskStabilise` only sets `dying: false`. It does not ask for the Trait.

The phrase “two points remaining” is the second Exertion die. The roll already throws when a spend of 2 has no named Echo, or when current Exertion is below the spend. The missing piece there is a test, not a new rule.

**Accepted.** Keep the spend and the death at Exertion 0. Lock both with tests, and lock the second-die refusal with current Exertion at 1. When the spend kills them, the result card says they died, the status is dead, and the Dying flag clears. Tracks stay, including a 3. Echoes stay. The diagram already drops a dead person. Undo restores the earlier status, Dying flag, and Exertion.

The Storyteller already has the pieces of this scene, on separate controls:

- They prompt the roleplay by speaking. There is no channel card that plays the night for them. A companion, or the Storyteller naming that companion’s sheet, rolls Resolve + Healing with `/roll`. The die button on the Ready card is the d8 or the d6.
- They read the Marks on the result card.
- The dying person’s sheet, on the desk, shows Stabilise while `dying` is set. One click currently clears the flag and does not ask for a Trait.
- The Trait is typed on Echoes · Traits, which the desk can edit, and saved there. Harm pips on the sheet refuse to lower a track at 3 until Stabilise has happened.

**Accepted shape of the button.** Stabilise becomes a confirm on that same sheet. Beside it, one line of counsel: roll Resolve + Healing first, then record the Trait that remains. The confirm asks for a Trait name and a short note, clears Dying, and leaves the track at 3. An empty name is allowed. Nothing auto-stabilises from a Mark count, and this batch adds no new chat command for the scene.

### 3. The Tide row “A clearly superior” — accepted

The setup rule is length = weight A + weight B − 1, and the start is weight A, counted from A’s collapse end. The row is labelled as A ahead and printed as 8 vs 12, length 19, start 8. Those numbers obey the formula for a lighter A. They are neither the slight pair (8 vs 6) nor the severe pair (6 vs 12). The code’s footings are only equal, slight, and severe, and the Zhao column uses the last row. The function stays.

The table’s order is equal, A slightly ahead, this row, then A severely behind. The label and that order describe A ahead. The numbers describe A behind.

**Accepted.** Keep the label, in English and in Hungarian (`A világosan fölényben`). Change the weights to 12 vs 8, keep length 19, and set the start to 12. The same numbers in [decisions.md](./decisions.md) (the footing list that still says clearly superior is 8 vs 12) change with the book. The desk footings stay equal, slight, and severe. There is no “clearly superior” control to retune.

### 4. A Foundation edit that shrinks the bar — accepted

Thresholds are derived. The Skills chapter says automation handles level-ups. If a ruling Foundation rises and the bar halves, stored Practice can already meet the new threshold.

**Accepted.** Recompute the threshold, then apply the same level-up loop the roll uses. A Foundation click can raise a rank when the Practice is already there. Practice is not rescaled when the bar grows. Harm does not change the bar: the modifier uses the raw Foundation, not the effective score.

### 5. Character creation (A7) — already shipped; this batch leaves it

The review called `creation-client.js` and `CreationChrome.astro` an older dock. That name is the file, not a missing feature. The Guidebook’s two phases are the live product:

- Private prep on the unlocked sheet: concept, the Foundation budget, the Skill budget (`BudgetDock`).
- Birth Omen and Guiding Hand: `/birth-omen` and `/guiding-hand`, private, once each, points onto the draft.
- Who do we see?: a claim in the channel, a second, accept or refuse, one Word to the speaker, and the Storyteller’s mark on the target.
- The Wanting: the four-line menu on the sheet (`WantingPanel`), then Confirm and the Storyteller’s approval (`ConfirmDock`).

`packages/app/tests/creation.test.ts` and the router tests cover that path. This batch does not rebuild it. The status.md sentence that says creation is “behind the Guidebook’s creation flow” is corrected in the docs commit so the note matches the shipped sheet.

### 6. The previous device key (S8) — deleted

The loader reads `edge-device-key` only. `edge-device-key.prev-2026-10-17` was an unused previous file. It was removed on 2026-10-22. The active key file is still in place. Its contents were not read.

### 7. Sharp — accepted as its own commit

Root `package.json` and `package-lock.json` already bump sharp from `^0.33.5` to `^0.35.5`. The lock resolves 0.35.5 and drops unused color packages. Astro uses sharp to resize pictures. The bump is maintenance, already applied in the working tree, and it stays out of the rules commits. Its own commit is “Bump sharp to 0.35.5.” when this batch is implemented.

### 8. The Hungarian lexicon — accepted

`docs/plans/hungarian-lexicon.md` was locked on 2026-08-22 and has not been compared with later English chapters. Every Guidebook sentence this batch edits is changed in both languages. A full lexicon pass is a separate reading.

**Accepted.** Paired edits only, in this batch. The lexicon comparison waits for the Guidebook section.

Wrangler ids (S7) and the named-tunnel hatch stay as written further down.

---

## Already in the tree

These are committed, when you ask, before the new work. No push until you ask. Author line stays Tamás Szentandrási, one sentence, no body.

| Commit sentence | What it carries |
|-----------------|-----------------|
| Limit an unlocked sheet to echoes, traits, and inventory. | H1. `UNLOCKED_SHEET_KEYS`, the `st-edit` route, untracked `apps/campaign-ui/tests/sheet-edit.test.ts`. The desk still applies the full patch. |
| Reject a stale Discord interaction and remember one id. | H2. Five-minute skew, one in-memory forward on the Worker, ten minutes on the hall. A restart of both inside five minutes can still apply one replay. |
| Remove unmounted hall plates and unused pictures. | The structure deletions already accepted. Vardmark’s local directory stays gone. Tests may still use the slug `vardmark` as a stand-in. |

H3 is a mode `0600` on `~/.kodranni/secrets/kodranni-edge-ci`. There is no repository change to commit.

`b6d489d` and `8f0f3b7` are already local commits. They are not pushed with this batch unless you ask.

---

## Practice thresholds

`practiceThreshold` in `packages/domain/src/practice.ts` is the rule. Base bars are 24, 48, and 72. A ruling Foundation of 3 or 4 halves the bar. A 2 leaves it. A 1 or a 0 doubles it. The book gives 0 and 4 no separate row; the domain tests already send them with 1 and 3. Creation and `deskSkillStep` call this function. The roll path does not.

`packages/app/src/roll.ts` creates a virtual untrained row at threshold 24, and on a level-up writes 48, then 72, then 9999. `refreshCharacterDerived` recomputes Exertion, Echoes, Decadence, and effective Foundations. It does not touch a Skill threshold. A Foundation edit through `deskFoundationStep` stores the new rating and leaves every Skill bar stale.

**Fix.** One function, used wherever a row is created, a rank changes, or a Foundation changes:

- The ruling Foundation is the Skill’s catalog Foundation, read from the raw score on the sheet.
- Rating 0, 1, and 2 store `practiceThreshold` for that rung.
- Rating 3 stores the 2→3 bar (the value `practiceThreshold(2, foundation)` returns) and does not level further. The sentinel 9999 goes away. The roundel at rating 3 stays full.
- The level-up loop subtracts the current threshold, raises the rank, then asks the function for the next bar.
- A new untrained row uses `practiceThreshold(0, rawRulingFoundation)`.
- After a Foundation edit, every Skill ruled by that Foundation gets the same rebalance, including a level-up when Practice already meets the new bar (question 4).

The coloured ring, the hover fraction, and the desk hold already read the stored threshold. They pick up the new numbers without a second paint rule.

**Chat.** The Skills chapter says chat adapters do not print Practice amounts. `packages/chat-ui/src/index.ts` still adds a Practice field when `practiceGained > 0`. That field comes off the result card. The sheet remains the place that shows the fraction.

---

## Time-leap downgrade

`degradeCountFromOmen` matches the book. Standard is 1–5 → 0, 6–10 → 1, 11–15 → 2, 16–20 → 3. Short is 1–10 → 0, 11–20 → 1. Nothing picks the five, and nothing writes a downgrade.

**Fix.** Domain grows a pure picker: given the sheet’s qualifying Skills, a mode, an omen face, and a random source, return the Skills to downgrade. The count function stays. Invalid faces still throw.

The desk, on the person, offers Standard or Short. Propose rolls a fresh d20, builds the pool from question 1, and shows the face, the count, the five (or fewer), and the picked names. Confirm applies exactly that pick. Dismiss drops it. The proposal is stored beside `table_state` in the SQLite meta, desk-only, and is omitted from the public snapshot the same way the Tide is. Confirm recomputes the pool and refuses a pick that is no longer inside it, so a Skill edit between the two clicks asks for a new proposal. A second confirm of a cleared proposal writes nothing.

Each applied Skill uses the downgrade in question 1, then the same threshold function as a level-up. Restore does not gain a degrade column. The player sheet cannot call it.

---

## Dying

Research, so the implementation does not invent a target number:

| Source | What it says |
|--------|----------------|
| Harm, Dying | Every roll requires Exertion. Exertion 0 is death. Stabilisation is a successful Healing attempt. The track stays at 3. A Trait almost always remains. |
| Harm, the fever widget | Knowledge and material → the Storyteller names Resolve + Healing at d8. Without them → d6. One Mark in the example lifts Dying. Zero Marks means the body is done. |
| Marks & Tiers | Marks are information. There is no secret number to clear. |
| Exertion, glossary | The same spend and the same death. Healing is not a superpower. |
| Automation | Stabilising is an edit on that person: Dying clears, the track stays at 3, the Trait is written there. |
| Decisions | The Trait is asked for on the person. Clearing Dying is the stabilising act. |

**Fix, spend and death.** Leave the throws. Add the tests the review marked silent: Dying with a spend of 0 throws; a spend that leaves Exertion at 0 sets status dead; a spend of 2 with current Exertion 1 throws `not enough Exertion`; a spend of 2 with no named Echo still throws. Undo of a killing roll restores status, Dying, and Exertion.

On that killing roll, clear the Dying flag once status is dead, and put one sentence on the result card that the person died. The footer that already says Dying stays for a roll that leaves them alive. Death still removes them from the diagram through `completeMemberPlacements`. Stored placements can remain; the diagram filter is the removal the Harm chapter asks for.

**Fix, stabilise.** The desk control that is one click today becomes a confirm with a Trait name, a note, and the counsel line from question 2. A non-empty name appends that Trait, then `dying` becomes false. The Harm tracks are not modified. Lowering a track that sits at 3 while Dying is still refused until this edit has happened. The Healing roll stays the normal `/roll` the table already has. The button does not look for it and does not count Marks. No new prompt command.

A player sheet token still cannot set `dying`, death, or Exertion.

---

## Tide table

English `src/content/docs/tide.md`, Hungarian `src/content/docs/hu/tide.md`, and the footing sentence in `docs/plans/decisions.md`. Weights become 12 vs 8, length stays 19, start becomes 12. `weightsForFooting` is unchanged. No new footing is added to the desk.

---

## The 18 drifts

Structure rows that repeat an item below are the same fix, not a second one.

### Hall boundary

**A1.** `apps/campaign-ui/astro.config.mjs` lists `@kodranni/bot-runtime` and `@kodranni/adapter-discord` in `vite.ssr.external`. The kernel records that a workspace package stays in the hall bundle anyway, and `campaignUiBuildStale` rebuilds when those sources are newer than `dist`. Drop the two workspace names from the external list. Keep `node:sqlite`, `sharp`, and `discord.js`, which are real externals. The kernel comment and the rebuild list stay. The comment in the Astro config says the rebuild rule is the boundary for workspace packages.

**A8.** Leave `security.checkOrigin` false. The tunnel rewrites Host to loopback while the browser Origin is the public name. Extend the comment: player posts rely on JSON and the sheet HMAC, and `kod_edit` and `kod_desk` are `SameSite=Lax`, so a cross-site form does not send them.

**A2.** The Worker imports `hall-render`, which imports `@kodranni/store/demo-icons`, `relation-map`, `labels`, and `table`. Those files do not import `node:fs` or `node:sqlite`. The store barrel does. The Worker must not import the barrel. `apps/edge/package.json` does not declare `store`, while `hall-render` does. Declare `@kodranni/store` on the edge package so the link is explicit, and add a test that reads `apps/edge/src` and those four store files and fails if any of them import `node:fs`, `node:sqlite`, or the store barrel. The same test reads `wrangler.toml` only to assert `workers_dev = true`, no `custom_domain` route, and no `nodejs_compat`. It must not print the account id, the zone id, or the KV namespace ids.

### Security-shaped drifts

**S1.** `archiveAllowsApi` returns true for every method on `/api/snapshot`. The route is GET. The public allowlist allows GET and HEAD. Restrict the snapshot exception to GET and HEAD, and update the test that locks the wide rule.

**S2.** `POST /api/desk/night` uses `isLocalDeskRequest`, which treats loopback as the desk and ignores `kod_desk=0`. Middleware then refuses the path, but `desk-night.test.ts` calls the route and expects 200. The route calls `rejectUnlessDesk`, the same check as the other desk writes. The player-face test expects 404, and the tunneled case stays 404.

**S3.** `withForwarded` sets `x-forwarded-host` and keeps only `kod_edit` and `kodranni_campaign`. A test already locks the cookie strip. Add the assertion that the forwarded request carries `x-forwarded-host`. Desk elevation on the hall depends on that header because the origin host is loopback.

**S4.** Item icons sniff PNG, JPEG, and WEBP bytes. Avatar upload (`pages/api/avatar/[slug].ts`) and desk icon upload (`pages/api/desk/upload.ts`) trust the filename. Share the sniffer. Reject a body whose bytes disagree with the extension. Sizes stay 4MB for avatars, 256KB for desk icons, and 2MB for item icons.

**S5.** `withEditToken` puts the edit token in the query string. The sheet also stores it in `kod_edit`, and `editCookieHeader` omits `HttpOnly`, so page scripts read `document.cookie` and send `Authorization: Bearer`. The server already accepts the cookie. On a sheet GET that carries `?edit=`, set `kod_edit` as `HttpOnly; SameSite=Lax` and redirect to the same path without the query, so the token leaves the address and the Referer. Later fetches are same-origin and send the cookie. The client scripts stop reading it. The query remains valid for that first request, which is how a chat link arrives. Do not add `Secure`: the desk on `http://127.0.0.1` would drop the cookie. The creation dock’s own `document.cookie` write goes away with the same redirect.

**S6.** `toPublicSnapshot` deletes `notebook` and never reads the `table_state` meta row. `publicSnapshotViolations` does not mention the notebook, so a second publisher could ship it and still pass. Add `community.notebook` to the check. Also reject a snapshot that carries `table_state` or a Tide body on the community object. `packages/app/tests/table.test.ts` already expects the snapshot string to omit the notebook text and `"tide"`.

### The move queue

**A6.** Nothing in the app writes `pendingMoves`. SQLite still defaults the array, the public snapshot deletes it, `redact.ts` rejects it, and `hallRevPayload` hashes it. Decisions drop the queue. On read, drop the key instead of defaulting `[]`. On write, omit it. Take it out of the hall-rev payload so an empty queue is not part of the rev. A community file that still contains the array loads without it and saves without it. Do not open Aspalath to migrate it; the next save of a campaign does that itself.

`factions` is the same leftover: deprecated, derived from labels, and `emptyCommunity` still stores `[]`. Stop writing the empty array. Readers that still derive labels keep doing so.

### Documents and the night command

These are wording fixes. The behavior they describe is already the code, except the night command’s bot default.

**A3 and the Fluxer sentence.** `docs/plans/overview.md` is dated 2026-09-29. The status line says the commands and the public names are not the code you run. The opening says the Automation chapter stays untouched until the table is accepted. Later the same file says the chapter now follows the table. The command section ends with “Table chat starts that gateway” about Fluxer. Rewrite the status and the opening to the lock that is already lower in the file: Discord is the table, Fluxer keeps the card and is not started, the desk is the hall on loopback, and Automation in both languages follows the responsibility table. Delete the sentence that starts the Fluxer gateway.

**A4.** English and Hungarian Automation both list `/tide` and say that command posts the card. The source command list has no `/tide`. The desk posts the Tide. Remove the command row and retell the Tide paragraph from the desk: the Storyteller sets size, footing, side names, and colours there; the channel message is the picture the desk already publishes. The oppose sentence stays in both languages. `scripts/guidebook-integrity.mjs` gains a check that both Automation chapters keep that sentence and that neither command table contains a `/tide` row.

**`/select`.** Automation says the command is unused with one character. The router test title repeats that. The assertion is that the reply names Jakov Bracco, and with two characters the focus becomes Caterina. The command names the active character. Change the Automation row in both languages, the router test title, and the status.md sentence that still says `/select` is unused when there is one. The code stays.

**A5.** `docs/plans/status.md` says a label has hue and no icon. `Label.icon`, `fortuneLook`, `axisLook`, and `rulerLook` exist. Replace that sentence. The same paragraph’s pending-move sentence is deleted with A6.

**README.** The table-flow step still says Exertion restore is `/reclaim`. Decisions drop that command. The host table still pairs Discord with `/reclaim` and, in an older reading, treats Fluxer as part of the desk. The restore line becomes the desk Restore on the person. The Discord line names the source commands and the Session bind. Fluxer stays the kept card that table chat does not start. `kodranni start` / `stop` are already named correctly in the status table.

**Dockerfile and `kodranni start`.** The image CMD is `live --tunnel --bot`. The lock’s night command is `kodranni start`. In `apps/cli/src/main.ts`, `start` currently sets `bot: !has(args, '--no-bot')`, so a bare `start` launches the Discord gateway. The gateway stays stopped until Go live on the Session tab. Change that default to off, keep an explicit flag for a process that must run the bot outside the desk, and set the image CMD to `start` with no `--bot` and no `--tunnel` override (`start` already opens the night tunnel unless `--no-tunnel`). Kernel tests that pass `bot: true` into `runLiveKernel` stay, because Go live still starts the runtime.

**Seed print.** `campaign seed-demo` prints tomaso, jakov, caterina, and niccolo, and `demoCharactersPresent` treats those four as the whole seed. The seed is Aspalath’s fifteen: agnese, caterina, duje, lovro, jakov, luca, mara, marino, matteo, niccolo, orsa, paolo, piero, tomaso, vito. The print says so. The presence check requires all fifteen, so a partial directory is not reported as already seeded. This does not reseed a live campaign. `--force` remains the recreate, and it is not run from this batch.

---

## Left for later, decided here

**S7.** `apps/edge/wrangler.toml` holds the account id, the zone id, and the two KV namespace ids because the free Worker deploy reads them there. The API token is not in the file. `workers_dev` stays true. `custom_domain` routes stay absent. `nodejs_compat` stays off. This batch does not copy the ids into the planner, the review, or the test output. The toml shape is locked by the A2 test. The file is not migrated to jsonc.

**S8.** Done. The previous device-key file is gone. The active key stays.

**Named tunnel.** `tunnel_mode=named` stays the interim hatch described in hosting.md. The locked night mints the tunnel on the Worker. This batch adds no feature on the named path and does not remove the hatch.

**A7.** Creation stays as shipped. See question 5. The docs commit only corrects the status sentence that calls it unfinished.

**Lexicon.** Question 8. Paired edits only.

**Sharp.** Its own commit at the end. See question 7.

**Portrait publish.** `putAvatarsToEdge` throws. `publishSnapshotToEdge` publishes the snapshot first and then catches a portrait error and a picture error. That order is the rule. Add the missing test: a failed portrait PUT still leaves the snapshot published. The publish does not start failing when a portrait fails.

**Chat’s second `face >= 5`.** `packages/domain` `isMark` is the rules function. `packages/chat-ui/src/index.ts` has its own `face >= 5`, used only to colour faces. `chat-ui` does not depend on domain. Give it that dependency and colour faces with `isMark`, so the count and the colour cannot drift. The Mark sentence on the card stays “5 or higher is a Mark, bright in the roll below.” `faceIsMark` semantics stay `face >= 5`.

---

## Tests that travel with the fixes

| Lock | Where it lands |
|------|----------------|
| Level-up at Foundation 1, 2, and 3 writes 96, 48, and 24 for the 1→2 bar (double, base, half) | `packages/app/tests/roll.test.ts` |
| A virtual untrained row stores `practiceThreshold(0, ruling)`, not a hardcoded 24 | same |
| A Foundation step that cuts the bar levels the Skill when Practice is already past it | `packages/app/tests/desk.test.ts` |
| Degrade bands stay as they are; the picker returns the lowest fraction, caps at the pool, and skips a Skill with no rank and no Practice | domain tests beside `degradeCountFromOmen` |
| Desk propose then confirm writes the rank drop; dismiss writes nothing; the proposal is absent from the public snapshot | app desk test |
| Dying spend 0 throws; death at Exertion 0; undo restores; second die at 1 point throws | `packages/app/tests/roll.test.ts` and the router test that already covers the Echo |
| Stabilise with a Trait name writes the Trait, clears Dying, leaves the track at 3; empty name still clears Dying | desk test |
| Result card on a killing roll says the person died, and no longer carries a Practice field | `packages/chat-ui/tests/cards.test.ts` |
| `face >= 5` colouring imports `isMark` | chat-ui test |
| Snapshot method, player-face Go Live, `x-forwarded-host`, notebook and `table_state` in `publicSnapshotViolations` | the suites named under S1, S2, S3, S6 |
| Avatar and desk-icon bytes | campaign-ui, beside the item-icon sniff |
| Sheet GET with `?edit=` redirects and sets `HttpOnly` | campaign-ui |
| Worker sources and the four store files stay free of Node; wrangler shape, without printing ids | `apps/edge` |
| Portrait PUT failure still publishes the snapshot | CLI or publish suite |
| `/select` test title matches the reply that names the character | bot-runtime |
| Guidebook twins plus the oppose sentence, and no `/tide` command row | `scripts/guidebook-integrity.mjs` |

The full `npm test` run happens once, before a push, and only when you ask for the push. CI stays Node 22 and `npm ci`. This machine is Node v26.8.1 and npm 12.0.2. Targeted vitest for the package just edited is the check while implementing.

---

## Commit order after approval

New work, after the three tree commits above. Each sentence is the whole message.

1. Recompute Practice thresholds from the ruling Foundation.
2. Propose a time-leap downgrade and confirm it on the person.
3. Stabilise a Dying character with a Trait, and lock the required spend.
4. Refuse a player-face Go Live and a snapshot method other than GET or HEAD.
5. Sniff avatar and desk-icon bytes before saving them.
6. Keep the sheet edit token in an HttpOnly cookie.
7. Reject a public snapshot that still carries the notebook.
8. Drop the hierarchy move queue from the live record.
9. Treat the kernel rebuild as the hall boundary for workspace packages.
10. Keep the Worker off Node by declaring the store subpaths it bundles.
11. Match the Guidebook, the plans, and the night command to the desk.
12. Bump sharp to 0.35.5.

A docs-only sentence (11) includes the Tide row, Automation, overview, status, README, the Dockerfile CMD, the `start` bot default, and the seed print. If that sentence gets too wide while implementing, the Tide row and the night command can split off. The rules commits stay separate from the wording.

No force-push. No Worker deploy. The desk stays off. Aspalath is not reseeded, and its sqlite is not opened. The sharp bump stays unstaged until commit 12.

---

## Outside this batch

The section-by-section deep review (App, store, publish, chat, hall pictures, campaign hall, CLI, edge, Guidebook) remains the long campaign. This file pulls the fixes that were already known, including the App and Guidebook items that could not wait. It is not that deep-review note.

Creation stays the shipped sheet (question 5). Fluxer stays the unstarted card. The named tunnel gains no features. Interaction-id dedupe stays in memory. `workers_dev` stays on. `custom_domain` routes stay out of `wrangler.toml`.
