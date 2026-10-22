# Review fixes

Running list from the architecture pass, the security pass, the structure pass, the test map, and the Domain note. H1, H2, and H3 are fixed in the working tree and not committed. The drifts below are still open. The unmounted hall plates and the unused pictures are removed in the working tree and not committed. The Domain Practice fix is `b6d489d`. The skill roundel fill at rating 0 is `8f0f3b7`. Both are local and not pushed. The other working-tree changes stay uncommitted.

The implementation plan for the 18 drifts and the items left for later is [fixes.md](./fixes.md). It is a draft until accepted. Product code for that batch waits on approval.

Weights: **hole** (a caller can cross a boundary), **drift** (the book, the plans, and the code disagree), **dead weight**, **later**.

## Holes

| # | Where | Fix in the working tree |
|---|--------|--------------------------|
| H1 | `POST /api/character/:slug` action `st-edit` | An unlocked sheet may still save echoes, traits, and inventory (food, water, armour). Any other key, including harm, Words, foundations, skills, and a claim mark, is refused. A locked sheet is refused. The desk still applies the full patch. `stEditCharacter` is unchanged for internal callers. |
| H2 | `apps/edge/src/discord.ts`, `adapters/discord/src/http.ts` | After a valid signature, a timestamp more than five minutes off is rejected with the same 401 as a bad signature. The Worker does not forward one interaction id twice inside that window. The hall skips an id already in flight, and remembers a completed id for ten minutes. Both maps are in memory. A restart of both inside the five minutes can still apply one replay. |
| H3 | `~/.kodranni/secrets/kodranni-edge-ci` | Mode is `0600`. The file was not opened. It is not in the repository. |

## Architecture, to fix in the section that owns it

| # | Weight | Where | What to fix |
|---|--------|--------|-------------|
| A1 | drift | `apps/campaign-ui/astro.config.mjs`, `apps/cli/src/kernel.ts` | `ssr.external` names `bot-runtime` and the Discord adapter. The kernel records that a workspace package stays in the hall bundle anyway. The external list is not the boundary. A chat edit is invisible until `build:campaign-ui`. Make the boundary match the comment, or drop the list and keep the rebuild rule. |
| A2 | drift | `packages/hall-render`, `apps/edge/package.json` | The Worker imports `hall-render`, which imports `@kodranni/store/demo-icons`, `relation-map`, `labels`, and `table`. Those files do not import `node:fs` or `node:sqlite`. The store barrel does, and the Worker does not import the barrel. `edge` does not declare `store`. Declare the subpaths, and keep a test that they stay free of Node. |
| A3 | drift | `docs/plans/overview.md` | Dated 2026-09-29. It still says the commands and the public names are not the code you run, and that Automation stays untouched. Both are false. |
| A4 | drift | `src/content/docs/automation.md`, `src/content/docs/hu/automation.md` | Both still list `/tide` and say that command posts the card. The source command list has no such command. The desk posts the Tide. |
| A5 | drift | `docs/plans/status.md`, `packages/store/src/types.ts` | Status says a label has hue and no icon. `Label.icon` exists, and fortune, ladder, and ruler looks have an icon too. |
| A6 | drift | `packages/store/src/types.ts` `pendingMoves` | Decisions drop the hierarchy-move queue. The field is still on the live record. The public snapshot strips it, and `redact.ts` rejects it if present. Find out whether anything still writes it. If nothing does, remove it. |
| A7 | keep | `creation-client.js`, `CreationChrome.astro` | Creation is the shipped sheet: budgets, Birth Omen, Guiding Hand, claims, the Wanting menu, Confirm. This batch does not rebuild it. `DraftPanel.astro` is removed. The status sentence that calls the dock unfinished is corrected with the other plan wording. |
| A8 | drift | `apps/campaign-ui/astro.config.mjs` `checkOrigin: false` | The comment says player posts rely on JSON and the sheet HMAC. Cookie `kod_edit` is `SameSite=Lax`, so a cross-site form does not send it. Leave the switch, and say so next to it. |

## Security, to fix in the section that owns it

| # | Weight | Where | What to fix |
|---|--------|--------|-------------|
| S1 | drift | `apps/campaign-ui/src/lib/loopback.ts` `archiveAllowsApi` | Any method is allowed for `/api/snapshot`. The route only implements GET. The public allowlist allows GET and HEAD. The test locks the wide rule. Allow GET and HEAD only. |
| S2 | drift | `apps/campaign-ui/src/pages/api/desk/night.ts` | The route allows the player face. Middleware then refuses it, because the path is a desk path. `desk-night.test.ts` calls the route directly and expects the player face to succeed. Make the route use the same desk check as the other desk writes, and test through that check. |
| S3 | drift | `apps/edge/src/handler.ts` `withForwarded` | Proxied requests set `x-forwarded-host` and drop every cookie except `kod_edit` and `kodranni_campaign`. `kod_desk` is stripped, and a test locks that. No test locks `x-forwarded-host`. Desk elevation on the hall depends on that header, because the origin host is loopback. Add the test. |
| S4 | drift | `apps/campaign-ui/src/pages/api/avatar/[slug].ts`, `pages/api/desk/upload.ts` | Item icons sniff the bytes. Avatars and desk icons trust the filename extension. Sniff those too. Avatar size is 4MB. Desk icons are 256KB. Item icons are 2MB. |
| S5 | drift | `packages/app/src/sheet-token.ts` `withEditToken` | The sheet link carries the edit token in the query string. It also lands in the `kod_edit` cookie, which is not `HttpOnly`. Prefer the cookie and keep the token out of the address once the sheet has it. |
| S6 | drift | `packages/store/src/redact.ts` | `toPublicSnapshot` deletes the notebook. `publicSnapshotViolations` does not mention it, so a second publisher could ship the notebook and still pass the check. Add the notebook to the check. |
| S7 | later | `apps/edge/wrangler.toml` | The account id, the zone id, and the two KV namespace ids are in the file. The API token is not. `workers_dev` stays on. `custom_domain` routes stay absent. `nodejs_compat` stays off. Do not copy those ids into notes. |
| S8 | later | `~/.kodranni/secrets/edge-device-key.prev-2026-10-17` | A previous device key file is still on disk, mode `0600`. Leave it until you say to remove it. Do not restore it over the active key. |

## What held

- Desk writes use `rejectUnlessDesk`. Tunnel headers (`cf-connecting-ip`, `cdn-loop`, `cf-ray`, `x-forwarded-host`) fail closed. `kod_desk=0` is the player face. Archive header `x-kodranni-archive: 1` hides desk tools. Tests in `loopback.test.ts`.
- The Worker allowlist refuses `/api/desk`, `/internal`, `/operator`, `/emissary`, and `/setup`. Session is GET and HEAD only. Tests cover the cookie strip.
- `POST /internal/discord` requires the device-key HMAC. The forward from the Worker signs the raw body. A missing key is refused.
- Discord signature verification rejects a bad signature and a timestamp ten minutes old. One interaction id is forwarded once (`apps/edge/tests/discord.test.ts`, `adapters/discord/tests/http.test.ts`).
- Sheet tokens expire, are bound to one slug, and use a timing-safe compare. An unlocked sheet can save an echo. Harm, Words, and a locked sheet are refused (`packages/app/tests/creation.test.ts`, `apps/campaign-ui/tests/sheet-edit.test.ts`). The desk can still set a claim mark.
- The public snapshot drops drafts, account ids, the initiator, pending moves, fortune meta, and the notebook. A 17–20 digit id fails `assertPublicSnapshot`.
- `ensureFluxerRuntime` has no caller. Table chat returns 409 for Fluxer Go live.
- Workflows pin actions by commit. Test and edge are `contents: read`. Pages is `contents: write` for the branch publish. Release writes contents and packages on a tag.
- Secret files in `~/.kodranni/secrets` are mode `0600`. The directory is `0700`. `campaign.toml` is mode `0644` and its keys are ids and settings, not a token. The values were not opened.

## Structure

Inventory only. A delete row waits until you mark it. Phase 5 removes only the rows you mark.

Read for this pass: `docs/plans/{overview,decisions,hosting,chat,status,hungarian-lexicon}.md`, `README.md`, `adapters/discord/src/commands.ts`, `adapters/fluxer/src/{prefix,index}.ts`, `apps/bot-runtime/src/router.ts`, `apps/campaign-ui/src/layouts/CampaignLayout.astro`, `apps/campaign-ui/src/components/{DeskChrome,DeskHall,DraftPanel,HierarchyBoard}.astro`, `apps/campaign-ui/src/pages/community/hierarchy/index.astro`, `apps/campaign-ui/src/pages/session/index.astro`, `apps/campaign-ui/public/` (script tags), `packages/design`, `public-root/design`, `public/`, `src/assets`, `packages/hall-render/src/{hall,pages,sheet,layout}.ts`, `packages/store/src/{types,sqlite,seed}.ts`, `apps/cli/src/main.ts`, `Dockerfile`, `.github/workflows/release.yml`, `scripts/{copy-design-root,pack-linux}.mjs`, `apps/edge/sync-public.mjs`, `.gitignore`, `src/content/docs/automation.md` and `hu/automation.md`.

| Path | Weight | Mark | Lock sentence |
|------|--------|------|----------------|
| `packages/design` | — | keep | Visual lock lives here: dark, Bellefair, blood `#a01818`, silver, black `#050505`. `npm run build` copies ornament and the two CSS files into `public-root/design` and rewrites ornament URLs. The copied `tokens.css` is shorter because of that rewrite. |
| `public-root/design` | — | keep | Pages cannot use a Vite-hashed package URL. The copy is tracked and regenerated by `copy-design-root.mjs`. |
| `apps/edge/public` | — | keep | Gitignored. `sync-public.mjs` rebuilds it from `apps/campaign-ui/public`, the hall client build, and `packages/design`. |
| `dist/`, `apps/campaign-ui/dist` | — | keep | Gitignored. No tracked build output. |
| `apps/campaign-ui/public/dice/d6.png`, `d8.png`, `d12.png` | — | keep | Chat names these three files. One copy. |
| `falcon-logo.png` in `public/`, `src/assets/`, and `apps/campaign-ui/public/brand/` | — | keep | Same bytes. The book logo, the portal, and the hall each serve their own root. |
| `public/archetypes/*.jpg` and `apps/campaign-ui/public/archetypes/*.jpg` | — | keep | Same bytes. Skills chapters and the sheet both request `/archetypes/<id>.jpg`. |
| `cmap-arrow.png`, `cmap-mark.jpg` in `packages/design/ornament` and `apps/campaign-ui/public/ornament` | — | keep | Same bytes. The hall requests `/ornament/…`. The design copy is what the book build ships. |
| `creation-client.js`, `desk-gestures.js`, `desk-sheet.js`, `session.js`, `map-client.js`, `sheet-edit-echoes.js`, `sheet-edit-inventory.js`, `hall-client.js` | — | keep | Still loaded: creation dock on the sheet, desk layout, desk sheet, Session tab, archive character map, echo and inventory editors, hall. Creation stays the older dock (A7). |
| `adapters/discord/src/commands.ts` and `apps/bot-runtime/src/router.ts` | — | keep | Both name `roll`, `intent`, `create`, `claim`, `select`, `birth-omen`, `guiding-hand`, `award-word`, `review`, `npc-roll`. The router test treats `live`, `reclaim`, `focus`, `st-roll`, and `map` as unknown. |
| Fluxer gateway, prefix parser, reaction map, Session fields, Go live 409 | — | keep | Chat: same card, not started, public API host `https://api.fluxer.app/v1`. Prefix list matches the ten commands and rejects `!tide`. Reactions still cover Tide, Oppose, Harm, Undo, and claim. `ensureFluxerRuntime` has no caller. `stopFluxerRuntime` remains so a leftover gateway can be stopped. |
| `packaging/linux`, `scripts/pack-linux.sh`, `release.yml` tarball job, `archive-serve-main.ts`, `linux-notify.ts` | — | keep | README installs with `packaging/linux/install-user.sh`. The night spawns the archive server. The kernel notifies systemd. |
| `tunnel_mode=named` in the CLI | later | keep | Hosting calls it the interim hatch. The locked night mints the tunnel on the Worker. |
| `docs/plans/hungarian-lexicon.md` | later | keep | Locked 2026-08-22. Not compared with later English chapters. That check belongs to the Guidebook section. |
| `docs/plans/review.md` | — | keep | The findings note. The product lock is the other six files in this directory. |
| `emptyCommunity` fortunes | — | keep | Five values at Steady (2), unfounded until the buttons are pressed. |
| `src/content/docs/automation.md` and `hu/automation.md` `/tide` | drift | update | Already A4. The desk posts the Tide. Chat says there is no `/tide` command. |
| Automation’s `/select` row | drift | update | The chapter says the command is unused with one character. The source command says it names the active character, and claiming another releases the previous. |
| `docs/plans/overview.md` last command sentence | drift | update | It says table chat starts the Fluxer gateway. Chat says table chat does not start Fluxer. |
| `README.md` table flow and host paragraph | drift | update | It still names `/reclaim`, and it says Discord and Fluxer are the desk. Decisions drop `/reclaim`. Fluxer is not started. |
| `Dockerfile` `CMD` | drift | update | `release.yml` still builds and pushes the image. The command is `live --tunnel --bot`. The lock’s night command is `kodranni start`, and the Discord gateway stays stopped. |
| `apps/cli/src/main.ts` seed-demo lines | drift | update | The printed line names tomaso, jakov, caterina, and niccolo. Those four are the presence check. The seed is Aspalath’s fifteen. |
| `docs/plans/status.md` label sentence | drift | update | Already A5. `Label.icon`, `fortuneLook`, `axisLook`, and `rulerLook` exist. |
| `CommunityRecord.pendingMoves` and `factions` | dead weight | update | Already A6 for the queue. Nothing in the app writes a move. SQLite still defaults the array, and `community-rev` still hashes it. `factions` is marked deprecated and `emptyCommunity` still stores `[]`. The live hierarchy page does not pass `pendingMoves`. |
| `apps/campaign-ui/tests/desk-night.test.ts` “player face” | drift | update | The test expects `kod_desk=0` to run Go Live. That is S2. The route checks loopback and skips the desk-face check the other desk writes use. |
| Unmounted hall plates and their scripts | dead weight | removed | `DeskHall`, `FortuneHall`, `HallRites`, `DeskChrome`, `DraftPanel`, `HierarchyBoard`, `OutsiderPorch`, `FactionList`, `MythList`, `HallSearch`, `InspectDrawer`, `MemberName`, `desk-status.ts`, `founding-client.js`, and `desk-discord.js`. The Session tab, `CreationChrome`, the record-line desk switch, and `hall-render` are the live surfaces. `kodranni --name` founds a campaign. |
| Unused pictures | dead weight | removed | `src/assets/archetypes/`, `src/assets/brand/falcon.jpg`, `falcon-transparent.png`, both copies of `falcon.png`, `apps/campaign-ui/public/icons/*.svg`, and the untracked inspiration images and desk screenshots at the repo root. The served archetype panels, the three dice, and `falcon-logo.png` stay. |
| Vardmark snapshot and old logs | dead weight | removed | `vardmark-public.json` and `workflow_job_error.txt` are gone. The idle local directory `~/.kodranni/campaigns/vardmark` is gone. Aspalath stays. Tests still use the slug `vardmark` as a stand-in so they do not point at Aspalath. |
| Sharp bump in `package.json` and `package-lock.json` | later | keep | Stays unstaged until you ask for that commit on its own. |

## Test review

Suites on disk: domain 6, app 9, store 11, publish 1, hall-render 2, chat-ui 1, discord 2, fluxer 4, bot-runtime 1, campaign-ui 11, cli 6, edge 4. The eleventh campaign-ui file is the untracked `sheet-edit.test.ts` from the H1 fix. `chat-port` and `design` have no suite. `scripts/guidebook-integrity.mjs` checks twins, Starlight `{#id}` leaks, plan links, and Echoes-before-Harm.

| Rule | Lock | Where |
|------|------|--------|
| A face of 5 or higher is a Mark | locked | `packages/domain/tests/harm-tide-degrade.test.ts` counts `[5, 4, 8, 12, 1]` as 3. `packages/chat-ui/tests/cards.test.ts` requires `5 or higher is a Mark, bright in the roll below.` |
| `faceIsMark` stays `face >= 5` | partial | Domain `isMark` is the rules function and is what the count test calls. `packages/chat-ui/src/index.ts` has a second `face >= 5` that only colours faces. No test imports both. |
| Pool floor 1, empty Exertion −2 | locked | `packages/domain/tests/pool.test.ts`. `rollDice` throws when the count is under 1. |
| Dying spends a point | partial | The Ready card has no Exertion · 0 button (`packages/chat-ui/tests/cards.test.ts`). `executePlayerRoll` throws `Dying characters must spend Exertion on every roll`. No test calls that throw. The pool function does not know Dying. |
| Second Exertion needs a named Echo | locked | `packages/app/tests/roll.test.ts` `rejects second Exertion without Echo`. Router `requires a named Echo for the second Exertion die`. |
| Two points remaining for that second die | silent | `exertionChoices` opens 2 when the sheet has at least 2 and an Echo is named. The `roll-spend` handler refuses 2 below that. No test sets current Exertion to 1 and expects the refusal. The card test keeps an already chosen 2 on the button when no Echo is named. |
| One active character | partial | `packages/app/tests/creation.test.ts` `creating, claiming, or approving another sheet releases the previous one`. The old sheet stays `active`. Its player and initiator clear. The account’s living list is the new sheet. |
| Storyteller rolls a named sheet without claiming it | locked | Router: `lets a Storyteller roll a named sheet without claiming it`, `lets a Storyteller roll a sheeted person by name`, `lets a Fluxer Storyteller roll a sheet by one name`. |
| `/npc-roll` is sheetless | locked | `packages/app/tests/roll.test.ts` `NPC roll does not require a character sheet`. Router `/npc-roll names the Omen and writes no harm track`. |
| Creating, claiming, or approving releases the previous binding and keeps the sheet | locked | The same creation test. Approving Beta clears Alpha’s player and leaves Alpha `active`. Claiming Guest clears Beta’s player. Approving someone else’s sheet leaves Guest bound. |
| Public snapshot omits the notebook and `table_state` | locked in the snapshot, silent in the redact check | `toPublicSnapshot` deletes `notebook` and never reads the `table_state` meta row. `packages/app/tests/table.test.ts` opens a tide, writes a notebook, and expects the snapshot string to omit that text and `"tide"`. The desk download test expects the notebook beside the community, and `community.notebook` absent. `publicSnapshotViolations` still skips both (S6 for the notebook). |
| Portrait PUT failure does not fail publish | silent | `putAvatarsToEdge` throws. `apps/cli/src/edge-publish.ts` publishes the snapshot first, then catches the portrait error and the picture error. No test fails a portrait PUT and still sees the snapshot published. |
| Desk routes 404 for a tunnel and for the archive header | locked, with one wrong lock | `desk-edit.test.ts` tunneled rename is 404. `desk-night.test.ts` tunneled Go Live is 404 and the handler is not called. `session.test.ts` archive header and `x-forwarded-host` hide the live reading. `loopback.test.ts` turns desk tools off for `cf-ray` and for `x-kodranni-archive: 1`. `desk-night.test.ts` `runs Go Live from the player face` expects `kod_desk=0` to return 200. That is S2. |
| `kod_desk` does not unlock a public host | locked | `loopback.test.ts` with `kod_desk=1` and `cf-ray` leaves the desk off. `apps/edge/tests/handler.test.ts` `forwards sheet and campaign cookies to the live origin` keeps `kod_edit` and `kodranni_campaign` and drops `kod_desk`. |
| Fluxer Go live is 409 | locked | `apps/campaign-ui/tests/session.test.ts`. Body is `Fluxer waits for the same controls Discord uses.` The player face on that route is 404. |
| Discord Go live is the one that starts | partial | The same session test requires `data-chat-platform="discord" data-chat-op="live"` in the desk HTML. No test asserts that control starts the Discord runtime. |
| Worker bundle does not import `node:fs` | silent | `apps/edge/src` has no `node:fs` import. `apps/edge/sync-public.mjs` does, and it is a build script. No test reads the Worker bundle. |
| `wrangler.toml` has no `custom_domain` routes and no `nodejs_compat` | silent | `workers_dev = true`. A comment says `custom_domain` routes are absent. The file has no `nodejs_compat` key. No test reads the toml. The account id, zone id, and KV namespace ids stay in the file (S7). This note does not copy them. |
| Guidebook twins, and Automation’s oppose sentence in both languages | twins locked, sentence silent | The integrity script requires `hu/${rel}` for every English chapter. English and Hungarian Automation both say the result card’s Oppose control opens the Ready card for that roll. The script does not read that sentence. |

`/select` for one living character: the router test is titled as if the command were unused. The assertion is that the reply names Jakov Bracco. With two characters it sets the focus to Caterina. The title is stale. The behavior matches the command that names the active character. The Automation row is already an update.

Stubs, and the live store: edge handler and Discord tests replace `globalThis.fetch` and use an in-memory KV or `http://127.0.0.1:9`. Discord HTTP tests stub fetch. CLI night tests stub `findCloudflared` and do not spawn it. Desk night installs a handler. `desk-edit.test.ts` sets `KODRANNI_CAMPAIGN_SLUG=aspalath` on a temp sqlite from `mkdtemp`, not on `~/.kodranni/campaigns/aspalath`. Path tests that mention `~/.kodranni` build a temp home. Publish and chat-ui use `aspalath.kodranni.com` as a URL string. No suite opens Aspalath’s live sqlite.

## Domain

The Practice fix is in. The rest of the package matches the book.

Read: `packages/domain/src/{pool,marks,roll,rng,tide,harm,echoes,practice,degrade,skills-catalog}.ts` and the six domain test files. Book: Dice Mechanics, Marks & Tiers, Omens, Tide, Harm, Echoes, Exertion, Skills, Foundations (0 and 4), Hierarchies (the four rungs).

| Piece | Mark | Why |
|-------|------|-----|
| Pool arithmetic, floor 1, empty −2, Decadence −1, over-cap Echo −1, default d8, tiers 6/8/12 | keep | Marks & Tiers. Tomas is Foundation 2 + Skill 2 = 4. |
| `isMark` as `face >= 5`, Marks as a count | keep | Marks & Tiers. |
| Omen d20, 7 positive, 13 negative, a scene face named ahead of those two | keep | Omens. The desk already refuses storing 7 or 13 as scene rows. No caller passes `includeOmen: false`. |
| Harm floor division, armour 1/2/3 only when donned, nine tracks paired to the nine Foundations, reputation gap 0/1/≥2 → ratio 1/2/3 | keep | Harm, including floor(3÷2)=1. The caller counts the gap. Ruler is not a rung in this package. |
| Exertion max = Resolve + Constitution + Charisma. Echo capacity = max(Strength, Dexterity) + Intellect + Authority. Decadence is zero Echoes. Over capacity is weight strictly above capacity | keep | Exertion and Echoes. Leif’s capacity example is 6. |
| Practice awards, thresholds 24/48/72, Foundation 3 halves, 2 stays, 1 doubles | keep | Skills. Foundation 0 follows 1, and 4 follows 3. The book allows 0 and 4 only with a Trait and does not give them their own row. |
| Tide length, start, steps, equal bands, and the imbalance procedure including the one-face floor | keep | The widget and the Zhao column (Battle, severe, A at 6 vs 12, bands 1–3 and 20). |
| Degrade omen bands, standard and short | keep | Skills. The function returns the count. Nothing in the tree picks the five lowest Skills or writes the downgrade. That write sits with the sheet, so it waits for the App section. |
| Seventy-two skills, six archetypes, foundations, and the four rungs Honoured, Trusted, Acknowledged, Outcast | keep | Names and ruling Foundations match the Skills chapter. The test locks the count, the Discord cap of 25, and Carpentry & Masonry. |
| A named Skill at rating 0 earns Practice, which is how it reaches 1 | done | `resolveRoll` counts Practice on every non-Primitive roll, including rating 0. Temur’s case is locked: unopposed, faces 1 and 2, no Exertion, +2, and the pool stays 2 dice. Primitive stays at 0. |
| Second Exertion die, two points remaining, Dying must spend | leave | Those gates already throw in `packages/app/src/roll.ts`. The pool applies the dice it is given. The App section judges the missing tests. |
| Roll path sets the next Practice threshold to 48 or 72 with no Foundation modifier | leave | `packages/app/src/roll.ts`. Creation and the desk call `practiceThreshold`. App section. |
| Tide table row “A clearly superior”, weights 8 vs 12, length 19, start 8 | leave | The label says A is ahead. The weights put A behind, and they are neither the slight pair (8 vs 6) nor the severe pair (6 vs 12). The function follows the procedure. The Guidebook section owns the row. |
| Chat’s second `face >= 5` | leave | Chat section. |
| Skill roundel at rating 0 | done | The coloured ring fills from Practice the same way as ratings 1 and 2. The centre stays ∅, and the name stays the untrained colour. Hover shows the fraction. The desk hold can change that Practice. |

## Still ahead

The known fixes are planned in [fixes.md](./fixes.md) and wait for approval. The deep-review order after that plan is App, store, publish, chat, hall pictures, campaign hall, CLI, edge, then the Guidebook. Domain is accepted. Hall-render’s suite is three files after the roundel test; the count above still says two.
