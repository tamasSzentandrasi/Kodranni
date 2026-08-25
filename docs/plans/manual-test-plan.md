# Manual test plan — Kodranni table stack

**Build:** post-merge (`7264cdc`+) — plate/hall UI + table stack (U5/U6/supervisor)  
**Goal:** Fresh pass after reconcile with Guidebook visuals. Capture results for triage.

**Archive / hostname:** locked target is [`infra-devsecops.md`](./infra-devsecops.md) (one hostname, KV snapshot, no park-process, no campaign git repo). Section I still exercises **current interim park**. Do not mark park-as-product as `pass`.

### How to mark

| Status | Meaning |
|--------|---------|
| `pass` | Works as expected |
| `fail` | Broken or wrong |
| `skip` | Not exercised this run |
| `n/a` | Not applicable in this setup |

Leave **Status** blank until you run the check. Put notes only in **Notes** (not in the Status cell).

For every `fail`, tag severity in Notes: **Blocker** · **Major** · **Minor** · **Nit** — plus where, steps, expected, actual.

---

## Meta

| | |
|--|--|
| Tester | |
| Date | |
| Commit / branch | |
| Public host | e.g. `https://kodranni.cosimomedia.com` |
| Campaign slug | `vardmark` (or: ) |

---

## A. Machine & secrets

```bash
npm run kodranni -- campaign sync-defaults --slug vardmark
cat ~/.kodranni/campaigns/vardmark/campaign.toml
```

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| A1 | Secrets present under `~/.kodranni/secrets/` (bot, guild, play channel, ST role, tunnel token, hostname, sheet-token) | | |
| A2 | `sync-defaults` sets `tunnel_mode=named`, hostname, `discord_storyteller_role_id` | | |
| A3 | Cloudflare **token not** written into `campaign.toml` | | |
| A4 | Secret files are mode `600` (not world-readable) | | |

---

## B. Session supervisor

```bash
npm run kodranni -- session end --slug vardmark --no-park   # clean if needed
npm run kodranni -- session start --slug vardmark --tunnel --bot
```

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| B1 | Local UI: `http://127.0.0.1:8742/community/` loads (hall tracker) | | |
| B2 | Startup prints public URL = named hostname | | |
| B3 | Discord bot comes online in the **same** terminal/process tree | | |
| B4 | `session status` shows live + tunnel + bot pids **alive** | | |
| B5 | Local `/community/` and `/characters/` return **200** (not 404) once UI is ready | | |
| B6 | Public hostname shows **live** UI (not archive face) while session up | | |
| B7 | Ctrl+C stops children **without** a scary npm lifecycle failure | | |

### Detach (optional)

```bash
npm run kodranni -- session start --slug vardmark --tunnel --bot --detach --force
npm run kodranni -- session status --slug vardmark
```

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| B8 | Supervisor log exists under `runtime/logs/` | | |
| B9 | After ~5–10s, status probes are healthy (retry if early 404) | | |

---

## C. Discord — identity & ST

Use a **player** account and an account with the Storyteller **guild role**.

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| C1 | Player `/create` → ephemeral sheet link with edit token | | |
| C2 | Channel draft / create card appears | | |
| C3 | Opening edit link unlocks Core spends (plate UI) | | |
| C4 | ST role can `/review`, `/intent`, `/award-word`, Harm | | |
| C5 | Non-ST refused on ST-only commands | | |
| C6 | `/kod-roll` (and other `kod-*`) absent / unknown | | |
| C7 | Emissary (`kodranni emissary --slug …`) matches what you share mid-session | | |

---

## D. Sheet — budgets & spends (creation)

Unlocked draft with edit cookie/token. Expect **plate** chrome after visual merge.

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| D1 | Budget dock: Foundations / Skills / Words readable on plate styling | | |
| D2 | Foundation: left-click raise, right-click refund (min I) | | |
| D3 | Foundation at ∅: can raise; tip is not “At maximum” | | |
| D4 | Skill: click works on **Practice rose / seal**, not only the name | | |
| D5 | Unaffordable vs spendable affordance is clear | | |
| D6 | Words = 0: muted Words card + “Awaiting Words…” CTA | | |
| D7 | Draft tab: Name / Concept / Community tie / Who do we see? save all fields | | |
| D8 | Portrait upload with edit link succeeds (jpg/png/webp) | | |
| D9 | Portrait upload **without** edit link fails with a clear message | | |

---

## E. Sheet — Wanting

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| E1 | ST `/award-word` → Words update on sheet within ~2s **without** refresh | | |
| E2 | Words card pulses / highlights when Words increase | | |
| E3 | Open Wanting → top tracker; normal Found/Skill spends lock | | |
| E4 | Pay-path dropdown options are readable (dark theme) | | |
| E5 | Trait fields use placeholders (no sticky “New Trait” value) | | |
| E6 | Pick Foundation on Core (incl. ∅ → raise); tracker tracks it | | |
| E7 | Mark/unmark skill ranks on the **seal** (left / right click) | | |
| E8 | Stage then Confirm Wanting (or Confirm auto-stages open form) | | |
| E9 | Positive Trait appears under Echoes · Traits after confirm | | |
| E10 | Close Wanting → spends unlock again | | |
| E11 | Open Wanting at 0 Words → clear message; menu disabled | | |

---

## F. Sheet — Echoes / Inventory (editors)

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| F1 | Add Echo: placeholders only; save persists | | |
| F2 | Weight raise/lower on Echo (left/right click) | | |
| F3 | Group Echo (weight 2): can name involved people *(expect gap if not built)* | | |
| F4 | Add Trait / Inventory item: placeholders; save persists | | |
| F5 | Food/Water day numbers centered; ± works | | |
| F6 | Armour panel fills column; cycle None → Light → Heavy | | |
| F7 | Ink fields match plate aesthetic (not old smoke-box look) | | |

---

## G. Discord — rolls (retest after fixes)

### G1 Free roll

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| G1.1 | `/roll` skill autocomplete (name · Foundation) | | |
| G1.2 | Confirm card: all **9** Foundations; changing off guiding is easy | | |
| G1.3 | Confirm: **Exertion** button cycles 0→1→2 (not only slash typing) | | |
| G1.4 | Confirm: Echo control present *(today: toggle; desired: named Echoes — note gap)* | | |
| G1.5 | Cast → Marks-first public card | | |
| G1.6 | Die language: **Disadvantage / Equal / Advantage** (not Harder/Ordinary/Easier) | | |
| G1.7 | Result “Live sheet” is a Link button; **view** URL (no edit token) for locked/active PC | | |
| G1.8 | Confirm “Open sheet” link behaviour acceptable for draft vs locked | | |
| G1.9 | **Untrained** skill (rating 0 / not on sheet) **rolls successfully** | | |
| G1.10 | Slash `tier` choices show Disadvantage / Equal / Advantage labels | | |

### G2 Intent (equal path)

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| G2.1 | ST `/intent @player skill:…` posts Intent card | | |
| G2.2 | Only named player can Roll | | |
| G2.3 | Roll → same confirm stance as free-roll | | |
| G2.4 | Untrained skill via Intent also works | | |

### G3 Fallback

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| G3.1 | `/roll` with no skill → Archetype → Skill → same confirm (no Found/Tier wizard pages) | | |

### G4 Result tools

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| G4.1 | Why this pool? | | |
| G4.2 | Harm (ST) | | |
| G4.3 | Exertion reclaim (ST) — note if “top up” vs exact amount feels wrong | | |

---

## H. Confirm → review → lock

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| H1 | Sheet Confirm → pending review + channel card (or `/review`) | | |
| H2 | ST Approve → active/locked; creation docks gone after refresh | | |
| H3 | No stuck `wanting-lock` / edit chrome on locked sheet | | |
| H4 | After lock, poll does not leave spend UI half-alive | | |

---

## I. Archive + hostname (interim park vs lock)

Locked behaviour: session end publishes `public.json`, tunnel **dies**, same hostname serves archive from the edge. Not implemented yet.

Current code: named `session end` parks a local static `archive/` behind the still-running tunnel.

```bash
npm run kodranni -- campaign publish --slug vardmark
npm run kodranni -- session end --slug vardmark
# named default: still parks (interim)
```

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| I1 | `archive/` has `snapshot.json` (and current static pages) | | |
| I2 | Drafts are **not** in the snapshot roster | | |
| I3 | `session end --no-park` tears the tunnel down | | |
| I4 | `session start --tunnel --bot --force` restores **live** UI on the public host | | |
| I5 | Park-process archive is **not** the product — note only; see infra-devsecops I5/I10 | | n/a as pass/fail |

---

## J. Reconstruct survival

```bash
# Destructive — only if you can wipe the demo store
npm run kodranni -- campaign seed-demo --slug vardmark --force
```

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| J1 | After `--force`, toml still has named tunnel + ST role from secrets | | |
| J2 | Demo characters **torvald** / **leifr** present | | |
| J3 | No hand-edit of toml required for role/hostname | | |
| J4 | `session start --tunnel --bot` works on fresh seed | | |

---

## K. Docs / DX

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| K1 | README session recipe matches what you actually run | | |
| K2 | README secrets table matches your files | | |
| K3 | Confusing / brittle README sections called out | | |
| K4 | `kodranni help` lists `sync-defaults`, `publish`, `session … --bot` (park flags are interim) | | |

---

## L. Visual merge smoke (plate / hall)

Quick pass that automation still fits the new Guidebook look.

| ID | Check | Status | Notes |
|----|--------|--------|-------|
| L1 | Community tracker reads as hall / plate (not old smoke masks) | | |
| L2 | Character Core: identity plate + tooled rails coherent | | |
| L3 | Skill Practice rose/seal looks correct; spend affordance still obvious | | |
| L4 | Budget / Wanting / Confirm docks match plate language | | |
| L5 | Mobile / narrow viewport: docks usable enough to not block Core | | |

---

## Known open gaps (do not mark pass if unimplemented)

Track as `fail` + **Major/Minor** if you hit them, or `skip` if out of scope this run:

| Gap | Expected eventual behaviour |
|-----|-----------------------------|
| Echo on confirm | Named Echoes from the character sheet, not only a boolean toggle |
| Group Echo people | Stakeholder picker seeded from community hierarchy |
| Exertion reclaim | Separate ST flow with **exact** reclaim amounts |
| Archive hosting | One hostname + KV snapshot + product archive app; tunnel down when dark ([`infra-devsecops.md`](./infra-devsecops.md)) |
| Oppose linking | Full parent-roll oppose chain |

---

## Suggested run order (~60–90 min)

1. A secrets → B supervisor → C Discord identity  
2. D spends + avatar → E Wanting → F editors  
3. G rolls (especially **G1.9 untrained** + die labels) → H lock  
4. I archive/hostname (interim park; do not treat as the product) → J only if wiping is OK → K/L as time allows  

---

## Sign-off

| | |
|--|--|
| Overall | `ship` / `fix-then-ship` / `blocked` / `prototype-only` |
| Blockers (IDs) | |
| Majors (IDs) | |
| Top 3 to fix next | 1. … 2. … 3. … |
| What improved since last pass | |
| What still hurts immersion | |
