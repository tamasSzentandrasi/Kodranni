# Plan: Kodranni Automation Architecture

## Purpose

Kodranni assumes **automation** so hybrid play stays immersive: one living record per community, fast honest procedures, room for legacy and consequence. This document is engineering direction. The table-facing contract is [src/content/docs/automation.md](../../src/content/docs/automation.md). **Rules truth** is the Guidebook under `src/content/docs/`.

**Status (2026-08):** **This repository is the product entry** (Guidebook + bot + install/setup). A **campaign** is a *spawned public presentation instance*. **SoT + private data on ST machine.** Live + archive campaign UI = **Astro + Guidebook design system** (Starlight remains Guidebook-only). **Discord and Fluxer both from P0.** Approvals = **buttons**. **Tests first-class.** No throwaway midstep UIs.

Highest principles: **clarity**, **intuitiveness**, **one shared source of truth per community**, **platform-native UX first**, **zero always-on SaaS by default**.

---

## 1. Product vision

```text
┌─────────────────────────────────────────────────────────────────┐
│  KODRANNI (this repository) — product entry                     │
│  · Guidebook (Starlight)                                        │
│  · Domain + bot runtime + adapters (Discord, Fluxer)            │
│  · Install / “create campaign” wizard                           │
│  · Local secret store + audit (never uploaded by default)       │
└────────────────────────────┬────────────────────────────────────┘
                             │ kodranni campaign create
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAMPAIGN REPO (public, in ST’s GitHub account)                 │
│  · Presentation only: site shell + redacted state               │
│  · / (or /campaign/<slug>/) community tracker + character sheets│
│  · NO member maps, tokens, audit, Discord/Fluxer account IDs    │
│  · Hosted on GitHub Pages (between-session + shareable URL)     │
└─────────────────────────────────────────────────────────────────┘

DURING SESSION (Storyteller PC — required)
  Discord/Fluxer ──▶ bot (from this product)
                        │
                        ├─▶ LOCAL SOURCE OF TRUTH (mutate live)
                        │     sheets · tracker · requests · session
                        │     + private: MemberMap · tokens · audit
                        │
                        ├─▶ LIVE RENDERER (localhost, optional tunnel)
                        │     pretty HTML updates on every mutation
                        │     players open live_base_url mid-session
                        │
                        └─▶ PUBLIC MIRROR (debounced push to campaign repo)
                              redacted state only → Pages archive URL
```

| Principle | Meaning |
|-----------|---------|
| **One product entry** | Install, Guidebook, bot code, and campaign spawning all come from **this** repo (or a release of it). |
| **One source of truth** | The **local community store** on the ST machine. Bots never treat Git/Pages as the database. |
| **Campaign = live instance surface** | A public repo + Pages site that *represents* the community for humans; not the authority for mechanics. |
| **Privacy split** | Public: names, sheet numbers, Fortunes, Diagram, Myths titles/effects as table-visible. Private (ST PC only): platform account IDs, tokens, MemberMap, full audit, unmapped drafts. |
| **Session-local bot** | Bot runs when the ST runs a session. No ST → no campaign automation. |
| **Live mid-session tracking** | Pretty representation updates **immediately** on the **live renderer**; public Pages is archive / fallback, not the hot path. |
| **Platform modular** | Fluxer and Discord are equal adapters over one application layer. |
| **Buttons, not reactions** | ST approve/deny and oppose use **buttons**. |
| **ST narrates; player instructs** | Optional **Roll Prompt**; player confirms spends/tags; ST NPC path is explicit numbers. |

---

## 2. Does the proposed concept work?

### What works as stated

| Idea | Verdict |
|------|---------|
| Main repo is entry; campaign is spawned instance | **Yes** — correct product shape |
| Create campaign during install / setup | **Yes** — first-class `kodranni campaign create` |
| Public campaign repo holds only represented state | **Yes** — privacy-correct |
| Member maps, audit, tokens stay on ST PC | **Yes** — required |
| Bot hooks: path to SoT + base URL(s) for presentation | **Yes** — see `campaign.toml` |
| Session-only bot on ST machine | **Yes** |

### What does **not** work if taken literally

**“Bot pushes pretty HTML to the campaign GitHub repo / Pages on every change so players live-track mid-session.”**

That fails for live play:

- GitHub Pages is a **CDN-backed static host** — updates are often delayed (build + cache; commonly on the order of minutes, not instant).
- A git commit per roll is slow, rate-limited, noisy, and hostile to “every Exertion click.”
- CI/Actions in the middle of combat is the wrong control loop.

So: **public campaign repo = durable public representation**, not the **live** control plane.

### Improved concept (recommended)

Keep your product story; split **presentation into two URLs** the bot always knows:

| Surface | URL | Latency | When |
|---------|-----|---------|------|
| **Live view** | `live_base_url` — local renderer on ST PC, optionally exposed via free tunnel | **Immediate** on each mutation | Mid-session (players track changes live) |
| **Public archive** | `public_base_url` — campaign repo → GitHub Pages | Seconds–minutes; **debounced** push | Between sessions, bookmarks, when ST offline |

**Source of truth** remains a third thing: local store path (`store_path`), never a URL players hit for writes.

```text
Every successful command:
  1. Validate + domain
  2. Persist event + projections  →  LOCAL SoT   (authority)
  3. Re-render pretty views       →  LIVE server  (instant)
  4. Queue redacted export        →  PUBLIC repo  (debounced / session-end / publish-now)
```

Players who want true live tracking open the **live** link the bot posts at session start. The public Pages URL stays the stable campaign home and eventually catches up.

This is free, ST-bound, and honest about GitHub’s limits.

---

## 3. Goals and non-goals

### Goals

- Hybrid play without bot-led storytelling.
- Shared sheet (Practice **visible**) + community tracker.
- Fluxer **and** Discord adapters; account → character maps (**private**).
- Player roll, ST NPC roll, oppose (button primary), Tide, revert.
- ST-role **button** approve/deny.
- **Live mutation** of local SoT + **live re-render** of pretty sheets/tracker.
- **Campaign create** wizard: public repo + Pages + local private store + config hooks.
- Redacted public mirror for shareable/archive URL.
- Session-scoped bot process on ST machine.

### Non-goals

- AI Storyteller.
- Discord-only design.
- VTT maps / encumbrance.
- NL rules inference as primary UX.
- Pages/git as mechanical authority.
- Always-on multi-tenant SaaS as default.
- Reaction-primary approval.
- Special Legacy bot path.
- Publishing full audit / platform account maps.

---

## 4. Install → create campaign → hooks

### 4.1 What “installation” means

From this product (clone or release):

```bash
# once on ST machine
npm install   # or packaged installer later
kodranni doctor              # node, git, gh auth checks
kodranni campaign create     # interactive wizard
kodranni session start       # run bot + live renderer
```

Optional Discord/Fluxer app credentials live in a **user-level or campaign-local env file**, never in the public campaign repo.

### 4.2 `kodranni campaign create` (wizard)

Automated steps (using `gh` CLI or GitHub API; ST must be logged in):

1. Ask: campaign **name**, **slug**, primary platform (Discord / Fluxer / both), guild/server ID (can defer).
2. Create **public** repository under the ST’s account, e.g. `kodranni-<slug>` (or org).
3. Seed repo with **presentation template only**:
   - static site shell (tracker + sheet routes)
   - empty/redacted `state/public.json`
   - README: “Generated by Kodranni — do not store secrets here”
4. Enable **GitHub Pages** (Actions or branch); record final `public_base_url`.
5. Initialise **local private tree** on the ST machine (see §5) — SoT, audit, MemberMap, secrets.
6. Write **campaign binding config** the bot loads (hooks):

```toml
# e.g. ~/.kodranni/campaigns/<slug>/campaign.toml  (private)
# or <product-data>/<slug>/campaign.toml

schema = 1
slug = "ash-hill"
name = "The Ash-Hill People"

# SOURCE OF TRUTH — bot read/write (local only)
store_path = "~/.kodranni/campaigns/ash-hill/data/community.sqlite"
private_dir = "~/.kodranni/campaigns/ash-hill/private"

# PRESENTATION
live_bind = "127.0.0.1:8742"
live_base_url = "http://127.0.0.1:8742"          # updated if tunnel starts
public_repo = "github.com/<user>/kodranni-ash-hill"
public_base_url = "https://<user>.github.io/kodranni-ash-hill/"

# PUBLISH POLICY
publish.debounce_ms = 60000          # coalesce mid-session pushes
publish.on_session_end = true
publish.on_mutation = "debounced"    # never "every event" to Pages by default
publish.include_audit = false

# PLATFORM (secrets via env refs, not inline tokens)
platforms = ["discord"]
```

7. Print:
   - private data path  
   - `public_base_url`  
   - how to `session start`  
   - that live URL will be announced in chat when a session opens  

**Bot integration:** on boot, `session start --campaign <slug>` loads `campaign.toml` → opens `store_path`, binds adapters, serves live renderer at `live_bind`, knows `public_base_url` for embeds (“Sheet · Tracker” links).

### 4.3 Tunnel (optional, recommended for remote players)

If players are not on the ST LAN, live tracking needs a path to the ST machine:

| Option | Cost | Notes |
|--------|------|-------|
| **Cloudflare Tunnel** (`cloudflared`) | Free | Scriptable; good default |
| ngrok / similar | Free tier | Fine for pilots |
| LAN-only `http://<lan-ip>:8742` | Free | Same household / VPN |

`session start --tunnel` updates `live_base_url` for this process and posts it to the play channel. Tunnel dies when session ends — correct.

Public Pages remains available without any tunnel.

---

## 5. Data placement (privacy)

### On Storyteller PC only (private)

```text
~/.kodranni/campaigns/<slug>/
  campaign.toml
  .env                    # DISCORD_TOKEN, FLUXER_TOKEN, …
  data/
    community.sqlite      # or event log + state — AUTHORITY
  private/
    members.json          # platform_account_id → character_id
    bindings.json         # guild, ST role ids, channel allowlists
  audit/
    events/               # full fidelity (or inside sqlite)
  cache/
    render/               # optional disk cache of HTML
```

Never pushed by default. Backup = ST’s responsibility (copy folder / encrypted drive).

### In public campaign repo only

```text
kodranni-<slug>/
  index.html | site/      # pretty shell (or built assets)
  state/
    public.json           # redacted projections + generated_at
  assets/                 # optional art the ST chose to share
  README.md
  .github/workflows/pages.yml
```

**`public.json` (sketch)** — no account IDs, no tokens, no audit:

```json
{
  "generated_at": "2026-08-10T21:04:00Z",
  "slug": "ash-hill",
  "community": {
    "name": "…",
    "fortunes": { "vitality": 2, "cohesion": 1, "surplus": 1, "standing": 2, "tradition": 2 },
    "myths": […],
    "hierarchy": { "axes": […], "ruler": "…", "placements": […] }
  },
  "characters": [
    {
      "slug": "eira",
      "name": "Eira",
      "status": "active",
      "foundations": {…},
      "skills": {…},
      "practice": {…},
      "exertion": { "current": 4, "max": 6 },
      "echoes": […],
      "harm": {…},
      "inventory": {…}
    }
  ],
  "session": {
    "open": true,
    "tide": null
  }
}
```

Pretty pages are either:

- **Static HTML regenerated** from `public.json` on each export, or  
- **One shell + client render** from `public.json` (simpler publish: replace one JSON file).

For **live** view, the local server should render from the **full local SoT** (same pretty templates), not from git.

---

## 6. Live update pipeline (what makes mid-session work)

```text
Command (button / slash / menu)
    → Application service
    → Domain
    → Store.transaction:
         append Event
         update projections   ← community + character stats LIVE here
    → LiveRenderer.invalidate(paths)
         GET /tracker, /characters/eira  always fresh
    → PublicPublisher.schedule()
         debounce → write state/public.json (+ html if needed)
         git commit + push to campaign repo (background)
    → Chat: result card + links
         [Live sheet] (live_base_url) · [Archive] (public_base_url)
```

**Rules that keep this elegant**

1. **Never block a roll** on git push or Pages. Publish is async.  
2. **Debounce** public pushes (e.g. 30–60s quiet, or max once per N seconds).  
3. **Force publish** on `session end` and ST `publish now`.  
4. Live server uses **no CDN**; `Cache-Control: no-store` on dynamic routes.  
5. Optional **SSE** (`/events`) so open browser tabs refresh without manual reload — high immersion, still local.  
6. Embed in Discord/Fluxer can deep-link `live_base_url/characters/eira` after each relevant mutation (optional, not spammy).

### Why not “only public repo”?

Because the bot **must** modify the pretty view mid-session **faster than git hosting allows**. Local live renderer is the correct technical expression of your requirement; the public repo remains the durable, free, ST-named home for the campaign’s face.

---

## 7. Logical architecture (code in this repo)

```text
apps/
  guidebook/           # Astro + Starlight (may remain at repo root initially)
  cli/                 # doctor, campaign create, session start/end, publish
  bot-runtime/         # session loop; Discord + Fluxer adapters
  campaign-ui/         # Astro live SSR + static export (sheets, tracker)
packages/
  domain/              # pure rules + vitest golden tests
  app/                 # commands/queries, ports
  store/               # local sqlite / event log
  publish/             # redaction + campaign-repo writer
  design/              # tokens/CSS shared Guidebook ↔ campaign-ui ↔ chat palette
  chat-port/           # platform-agnostic interactions
  chat-ui/             # shared roll/request card model → both adapters
adapters/
  discord/
  fluxer/
  github/
```

Campaign public repos do **not** contain bot source. They are **instances** the product pushes representation into.

---

## 8. Two surfaces of “UI” (do not confuse them)

### 8.1 Campaign UI (live + archive) — web

Pretty **community tracker** and **character sheets** in the browser (hashed tunnel mid-session; Pages archive between sessions).

**Quality bar:** same as the Guidebook — Bellefair, black / silver / blood, restrained grim craft.

| Piece | Choice |
|-------|--------|
| Framework | **Astro** (SSR/live against SoT; static export for public campaign repo) |
| Visual system | **Shared `packages/design`** from Guidebook tokens (`custom.css` craft) |
| Starlight | **Guidebook only** — docs IA, not dynamic campaign data |
| Live refresh | Re-read SoT every request; SSE when wired (not a throwaway poll forever) |
| Archive | **Same** Astro views + redacted snapshot → campaign Pages |

**No midstep:** no disposable plain-HTML prototype we plan to delete. One component set for live and archive.

### 8.2 Chat UI (Discord + Fluxer) — in-channel

Rolls, prompts, approvals — the table’s hands. Platforms forbid arbitrary HTML; peak quality = **native materials** + a **shared chat design system**.

| Element | Standard |
|---------|----------|
| Colour | Blood accent `#8a1515`; silver text on dark; consistent both platforms |
| Identity | Falcon / Kodranni where API allows; quiet, not meme |
| Roll card | Intent → **Marks (dominant)** → pool formula → faces → Omen → margin/Tide → “Why this pool?” |
| Buttons | Primary Roll/Approve; danger Deny/Revert; ST palette grouped/paged |
| Selects / modals | Archetype → Skill steps (25-option limits); modals for NPC numbers / Harm |
| Progressive disclosure | Smart defaults; Myth / second Exertion one click away |
| Links | **Live sheet** + **Archive** when a character is in play |
| Ephemeral | Mapping errors; private Weighing numbers |
| Tone | Guidebook voice — short, grave, precise |
| Parity | `packages/chat-ui` neutral card model → Discord **and** Fluxer; no forked layouts |

**Craft work (required):** freeze a visual spec (field order + button rows) early; both adapters implement it. Fluxer is **not** a stub.

### 8.3 Interaction flows (both chat platforms)

| Flow | UX intent |
|------|-----------|
| **ST Roll Prompt** | Optional card; player **Roll** |
| **Player roll** | Map → config · Exertion · Echo · Myth → **Roll** |
| **ST NPC roll** | Explicit numbers |
| **Oppose** | **Oppose** button (`parent_roll_id`); reply optional |
| **Approve / deny** | ST-role **buttons** |
| **Post-roll ST palette** | Harm · Tide · Exertion · … |
| **Revert** | Confirm + announce |
| **Why this pool?** | Button → detail |

---

## 9. Authority model

| Actor | Can |
|-------|-----|
| **Player** | Live/archive view; in session: rolls, requests, Echo create/invoke, Exertion on rolls |
| **Storyteller** | `campaign create`, run session, all ST mechanical tools, button approve, publish, MemberMap (local) |
| **Automation** | Validate, compute, **persist local SoT**, re-render live, schedule public mirror |

Death: continue play; Diagram/Legacy cleanup after session.

---

## 10. Domain notes (rules-locked)

Summarised; full formulas live in golden tests against the Guidebook.

- Die tier ST-declared; default **d8**; store final tier only.  
- Opposed: per action; oppose button / reply link.  
- Practice: visible; Primitive none; margin 0 special; degrade prompted only.  
- Harm: ST track; floor; no mixed events.  
- Myths: ST craft; tag to fire.  
- Weighing: create at Concept; Omen automated; Word boons target character.  
- Rest: Exertion reclaim ≠ Harm heal.  
- Hierarchies: ≤5 axes.  
- Tide: scale/start/Omen bands per Guidebook.  
- Infer Decadence / over-cap; never invent Armour/Reputation.

---

## 11. Persistence sketch

```text
Event (append-only, local)
Projection: Community, Character, Myth, Roll, Request, Session
Private: MemberMap, PlatformBinding, secrets
Public export: redacted snapshot only
Revert: compensating event
Idempotency: client_event_id on interactions
```

SQLite recommended for single-writer local authority; JSONL+atomic state acceptable at pilot scale.

---

## 12. Delivery phases

| Phase | Deliverable |
|-------|-------------|
| **P0** | Domain + **tests**; local store; design tokens package; **campaign-ui Astro** (sheet+tracker, Guidebook visual system); CLI campaign skeleton; **ChatPort + Discord + Fluxer** adapters; shared chat-ui cards; player/ST roll; button Approve; tunnel hook; redacted export path |
| **P1** | Roll Prompt; Oppose; Exertion; Harm; Revert; debounced public Astro export push; session posts live URL; chat visual spec freeze; SSE on campaign-ui |
| **P2** | Echoes; Fortunes; Hierarchy/Inventory approve; Myth/tracker depth |
| **P3** | Tide; Scene Omens; degrade; Weighing |
| **P4** | Peak craft pass (web + chat); installer UX; capability matrix polish |

---

## 12b. Testing (mandatory — ships with features)

| Layer | What | Intent |
|-------|------|--------|
| **Domain unit** | Marks, pools, Practice matrix, degrade, Harm floor, capacity/Decadence, creation, Tide | Vitest; pure; no I/O |
| **Golden / contract** | Numeric Guidebook examples as fixtures | Fail on rules drift |
| **App / store** | Events, projections, idempotent `client_event_id`, revert | Temp SQLite |
| **Redaction** | Public snapshot never contains tokens, snowflakes, MemberMap | Fixture tests |
| **Chat-ui** | Card model field order / button ids stable | Structural asserts |
| **Adapters** | Platform payload → ports; mock app — **Discord and Fluxer** | Per adapter |
| **Campaign-ui** | Sheet/tracker smoke with fixture SoT | Build or component smoke |

**Rule:** domain formula changes without tests do not land. Adapters may be thinner; domain is strict.

---

## 13. Risks

| Risk | Mitigation |
|------|------------|
| Treating Pages as live DB | Document dual URL; live server mandatory for mid-session |
| Public leak of maps/audit | Hard redaction layer; CI check; never write private paths to publish |
| Tunnel friction | LAN default; one-command cloudflared; archive URL always works |
| Dual ST writers | One live store path; document single runner |
| Git push storms | Debounce + never await push on roll |
| Fluxer parity | Both adapters from P0; ChatPort + shared chat-ui; capability flags only for missing platform features |
| Throwaway UI | Forbidden — Astro campaign-ui + design package from the start |
| Untested domain | CI / local vitest required for formula changes |

---

## 14. Success criteria

1. From this product, ST can **create a campaign** that yields public repo + Pages + local SoT + config hooks.  
2. Bot always knows `store_path`, `live_base_url`, `public_base_url`.  
3. Every fulfilled instruction updates **local SoT and live pretty view** before the next chat paint.  
4. Public repo never receives tokens, MemberMap, or full audit by default.  
5. Players can live-track mid-session via live URL; archive URL works between sessions.  
6. Buttons for approve/oppose; Practice visible; domain tests match Guidebook.  
7. automation.md stays aligned with this plan.

---

## 15. Immediate next steps

1. Scaffold monorepo: `packages/domain` (+ vitest), `packages/design`, `packages/chat-port`, `packages/chat-ui`.  
2. Spec `campaign.toml` + `~/.kodranni/campaigns/<slug>/` layout.  
3. `apps/campaign-ui` Astro sheet + tracker using design tokens (fixture SoT).  
4. Store + app services for roll; golden tests green.  
5. Discord **and** Fluxer adapters over ChatPort; shared cards; button approve.  
6. Tunnel hook + session start links; redaction tests + export path.  
7. Chat visual spec freeze (embed field order + button rows).  

---

## 16. Short answers

**Would your concept work?**  
Yes as a **product and privacy model**. No if the **only** mid-session surface is git → GitHub Pages.

**Improvement:**  
This monorepo spawns a **public presentation instance**; the bot’s **source of truth is local**; **live pretty UI is served from the ST process** (optional free tunnel); **public repo receives redacted state on a debounce / session-end path** so the campaign still has a stable hosted face without being the live database.

---

## 17. Decision log — locked, open, deferred

Use this as the pre-implementation gate. **Locked** = do not re-litigate without cause. **Open** = choose before or in the named phase (recommended default given). **Deferred** = intentionally later; do not block P0.

### 17.1 Locked (product / architecture)

| ID | Decision |
|----|----------|
| L1 | This repo is the product entry (Guidebook + automation + CLI). |
| L2 | Campaign = spawned **public presentation** repo + local private SoT. |
| L3 | SoT is **local only**; never Git/Pages as mechanical authority. |
| L4 | Bot runs **session-scoped** on ST machine; no ST → no automation. |
| L5 | **Live** pretty UI from ST process; optional **hashed tunnel URL** (no custom domain). |
| L6 | **Public archive** URL via campaign repo → GitHub Pages; redacted state only. |
| L7 | Private on ST PC: tokens, MemberMap, full audit, bindings. |
| L8 | Approve / deny / oppose primary UX = **buttons**, not reactions. |
| L9 | Hexagonal: pure domain, app services, platform adapters. |
| L10 | Dual platform: Discord + Fluxer equal; ChatPort abstraction. |
| L11 | Practice **visible** on sheet; Infer Decadence/over-cap; no invented Armour/Reputation. |
| L12 | Oppose: button with `parent_roll_id` (reply-detect optional). |
| L13 | Optional ST **Roll Prompt**; ST NPC path explicit numbers. |
| L14 | Event log + projections; revert = compensating event; idempotent `client_event_id`. |
| L15 | Publish never blocks a roll; debounce public push; force on session end. |
| L16 | No AI ST; no VTT maps; no multi-tenant SaaS default; no special Legacy path. |
| L17 | **No throwaway midsteps** — ship the intended stack/quality bar from the start (no “temp UI we will delete”). |
| L18 | **Live + archive campaign UI** = Guidebook-grade craft: shared **Kodranni design system** + **Astro**. Same visual standard as the Guidebook (Bellefair, black/silver/blood, layout discipline). |
| L19 | **Both** Discord and Fluxer adapters from the first implementation tranche — equal ports, shared card builders. |
| L20 | **Tests are first-class** — domain golden tests and critical path coverage land with the code, not after. |

### 17.2 Open — decide now (P0 blockers) · recommended defaults

| ID | Question | Recommendation | Why |
|----|----------|----------------|-----|
| O1 | **Language / monorepo layout** | TypeScript; `apps/*` + `packages/*` under this repo; Guidebook stays Astro+Starlight | One toolchain; Fluxer/Discord ecosystem |
| O2 | **Local store engine** | SQLite (`better-sqlite3` or `libsql`) + events table | Single-writer, transactions, one file backup |
| O3 | **Private data root** | `~/.kodranni/campaigns/<slug>/` (XDG on Linux) | Survives repo pulls; clear “not public” |
| O4 | **Tunnel provider** | Cloudflare quick tunnel (`cloudflared`) first; pluggable | Free hashed HTTPS URL, no domain |
| O5 | **Live UI tech** | **LOCKED L18:** Astro app + shared design tokens/CSS with Guidebook; SSR/live from SoT; same components for static archive export. **Starlight stays Guidebook-only** (docs IA). Campaign UI is not a second docs site — it is an Astro **app shell** with the same *visual system*. | Same peak craft; dynamic SoT does not fit Starlight content collections |
| O6 | **Public site model** | Astro static build/export of the same views fed by redacted snapshot (not a separate junk template) | One UI codebase |
| O7 | **Discord library** | discord.js (interactions + gateway as needed) | Mature; components/buttons solid |
| O7b | **Fluxer client** | Discord-shaped gateway/HTTP via shared abstraction; discord.js core / fetch as Fluxer docs allow | Wire-compat; one card model |
| O8 | **RNG** | `crypto.getRandomValues` / platform CSPRNG; log full rolls in audit | Trust + audit |
| O9 | **Schema versioning** | `schema_version` in store + migrations folder from day one | Avoid paint-in corner |
| O10 | **Single-flight session** | Second `session start` on same slug fails unless `--force` | Prevent dual writers |
| O11 | **Platforms** | **LOCKED L19:** Discord **and** Fluxer both implemented against ChatPort from the start | Product promise |
| O12 | **Repo naming** | `kodranni-<slug>` public under ST user; slug kebab-case validated | Predictable Pages URL |

### 17.3 Open — decide early P1 (shape UX hard)

| ID | Question | Recommendation |
|----|----------|----------------|
| O13 | **Command surface naming** | Short verbs: `/roll`, `/st-roll`, `/tide`, `/harm`, … + buttons; final names after one table test |
| O14 | **Skill picker UX** | Group by Archetype → Skill selects (Discord 25-option limits ⇒ multi-step) |
| O15 | **ST present but not mapped as PC** | ST role may roll NPC without character; MemberMap role=storyteller |
| O16 | **Multi-PC / active character** | `/character use` + one active per member; sheet shows active |
| O17 | **NPC / named extras on Diagram** | Characters with `kind: pc \| npc \| notable`; NPCs optional sheet depth |
| O18 | **Weighing privacy** | Birth Omen / Guiding Hand results only ST+owner channel or ephemeral; never public.json until locked |
| O19 | **Channel policy** | Optional play-channel allowlist; refuse elsewhere with “use #table” |
| O20 | **Live link hygiene** | Post once per session start; pin optional; regenerate message if tunnel URL changes |
| O21 | **Live tab refresh** | Prefer SSE in campaign-ui as soon as live server exists (not a permanent poll hack) |
| O22 | **Debounce defaults** | 45s quiet OR max 1 push / 60s; always on session end |
| O23 | **Public redaction policy** | Allowlist fields only (never denylist-only); automated test “no discord snowflake in public.json” |
| O24 | **Guidebook Practice line** | Edit Skills.md “never see unless ask” → visible (align product) |
| O25 | **automation.md** | Replace residual “reaction approve” with buttons; mention live+archive URLs |

### 17.4 Deferred (do not block P0–P1)

| ID | Topic | Notes |
|----|-------|-------|
| D1 | Packaged binary / installer | `npm`/clone fine for pilots |
| D2 | Co-ST / handoff protocol | Single writer only until demanded |
| D3 | Named stable tunnel hostname | Random hash URL enough |
| D4 | Custom domain for campaign Pages | Optional ST concern |
| D5 | Exhaustive Fluxer edge-case matrix beyond ChatPort | Both adapters ship P0; deep gap doc can grow |
| D6 | Encrypted audit at rest | Optional later |
| D7 | i18n of bot + live UI | English first |
| D8 | Mobile-native apps | Responsive live HTML first |
| D9 | Litestream / remote private backup | Document manual folder backup |
| D10 | Multi-campaign bot process | One campaign per process first; CLI selects slug |
| D11 | Visual art direction peak | Structure + solid CSS first; craft pass P4 |
| D12 | OAuth device flow for gh without `gh` CLI | Prefer `gh auth` in doctor |

### 17.5 Quality checklist — easy to forget

**Correctness / rules**

- [ ] Pool floor 1 always (empty Exertion −2, Harm, Decadence, over-cap)
- [ ] Effective Foundation = max(0, rating − harm track)
- [ ] Omen **every** roll; scene faces + defaults 7/13
- [ ] Practice matrix: opposed / unopposed / Primitive / margin 0 / Foundation threshold half/double
- [ ] Dying: every roll costs Exertion; 0 → death
- [ ] Harm: floor division; physical XOR social protection; ST picks track
- [ ] Tide: scale, start, marks-diff bands, Omen bands, route = collective not personal
- [ ] Myth effects only if tagged on that roll
- [ ] Echo second Exertion only when invoked + matching
- [ ] Inventory: explicit possession; restock food/water only as dedicated path
- [ ] Hierarchy max 5; Ruler singular; dead removed after session pattern
- [ ] Weighing budgets and Word menu costs exact

**Session / ops**

- [ ] Crash mid-session: store durable; session ephemerals recoverable or clearly reset
- [ ] Graceful shutdown: flush debounce publish, close tunnel, disconnect gateway
- [ ] Clock: store UTC; display local optional
- [ ] “As of” on live and archive
- [ ] Doctor: node version, git, gh auth, cloudflared optional, token present, guild reachable
- [ ] Backup docs: copy `~/.kodranni/campaigns/<slug>/`
- [ ] Upgrade path: product version vs store schema_version

**Security / privacy**

- [ ] Live UI read-only (no player write API)
- [ ] Tunnel URL is capability URL — treat as session secret; don’t put in public repo
- [ ] Verify Discord interaction signatures
- [ ] ST power = role IDs in private bindings, not “Administrator”
- [ ] Redaction tests; never log tokens
- [ ] `.gitignore` / publish allowlist belt-and-suspenders
- [ ] Public repo README: “no secrets; generated representation”

**UX / immersion**

- [ ] Result cards scannable: Marks, dice, Omen, margin, pool explanation
- [ ] Unmapped user → fix path (“ST: map @you → character”)
- [ ] Deny approve leaves clear state
- [ ] Revert confirms + announces
- [ ] Live pages match grim/elevated aesthetic (typography, not gamey chrome)
- [ ] Accessibility: contrast, keyboard on live site, alt text later for art
- [ ] Rate-limit chat spam (edit roll card vs flood)

**Platform**

- [ ] Discord: privileged intents only if required; prefer components
- [ ] Select menu 25-item limit → pagination / archetype steps
- [ ] Message component 5-row button limits → ST palette paging
- [ ] Fluxer: capability flags; degrade gracefully if slash missing
- [ ] Message refs for oppose graph stored as platform+message id

**Testing**

- [ ] Domain golden tests from Guidebook numeric examples
- [ ] Integration: button approve, oppose, idempotent double-click, session end export
- [ ] Redaction fixture tests
- [ ] Migration tests
- [ ] Adapter map-only tests

**Docs sync**

- [ ] automation.md = table contract (buttons, live+archive, session bot)
- [ ] architecture.md = engineering (this file)
- [ ] README automation section when P0 runnable
- [ ] Skills.md Practice visibility alignment

### 17.6 Implementation readiness

**Agree to enter implementation** when:

1. Locked list L1–L20 accepted (this document).  
2. Open O1–O12 accepted as defaults **or** explicitly overridden.  
3. P0 is a **vertical slice of the final stack** (Astro campaign-ui, both chat adapters, tests) — not full Tide/Myth/Weighing, and **not** a throwaway UI.

**P0 definition of done (pilot-quality, not feature-complete)**

- Domain package + **vitest golden suite green** (pool, Practice basics, Harm floor, capacity)  
- Local store + migrations + `campaign.toml` hooks  
- **`packages/design`** tokens shared with Guidebook craft  
- **`apps/campaign-ui` Astro**: character sheet + tracker rendered from SoT (live); same views exportable  
- Session start/stop; optional **hashed tunnel** → live URL  
- **ChatPort + Discord adapter + Fluxer adapter** (both real entrypoints; shared `chat-ui` cards)  
- Player roll + ST roll + Omen + Practice write on both platforms when configured  
- Button approve on a sample request type  
- Redaction tests; export path for archive  
- No throwaway CSS/HTML path that we plan to delete  

Everything in §17.3–17.5 is tracked, not forgotten; it lands by phase, not in one heroic commit.
