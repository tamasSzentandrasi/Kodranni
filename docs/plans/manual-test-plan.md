# Manual test plan — Kodranni table stack

**Audience:** Storyteller (you)  
**Goal:** Exercise the current product end-to-end and capture feedback by section.  
**Date / build:** after U5 + supervisor + U6 archive MVP + Wanting/budget polish  

Mark each check: **Pass** · **Fail** · **Skip** · notes in *Feedback*.

---

## 0. Preconditions

### 0.1 Secrets (once)

Confirm files exist under `~/.kodranni/secrets/` (mode `600`):

| File | Purpose |
|------|---------|
| `discord-botToken` | Bot |
| `discord-serverID` | Guild |
| `discord-playChannelID` | Play channel |
| `discord-storytellerRoleID` | ST recognition |
| `cf-tunnel-token` | Named tunnel |
| `cf-tunnel-hostname` | e.g. `https://kodranni.cosimomedia.com` |
| `sheet-token-secret` | Sheet edit links |

```bash
npm run kodranni -- campaign sync-defaults --slug vardmark
# Expect: tunnel_mode=named, hostname set, discord_storyteller_role_id=(set)
```

| # | Check | Result |
|---|--------|--------|
| 0.1.1 | `sync-defaults` reports ST role set and named tunnel | ✅ |
| 0.1.2 | `~/.kodranni/campaigns/vardmark/campaign.toml` has `tunnel_hostname` and `discord_storyteller_role_id` | ✅ |
| 0.1.3 | Token does **not** appear in `campaign.toml` | ✅ |

*Feedback:*

---

## 1. Session supervisor (lane C)

Prefer **one** terminal for the table:

```bash
cd /path/to/Kodranni
npm run kodranni -- session end --slug vardmark --no-park   # clean slate if needed
npm run kodranni -- session start --slug vardmark --tunnel --bot
```

| # | Check | Result |
|---|--------|--------|
| 1.1 | Local UI comes up (`http://127.0.0.1:8742/community/`) | ✅ |
| 1.2 | Public URL prints as `https://kodranni.cosimomedia.com` (or your hostname) | ✅ |
| 1.3 | Bot starts (log line / Discord online) without a second terminal | ✅ |
| 1.4 | `session status` shows live + tunnel + bot pids alive | ✅ |
| 1.5 | Ctrl+C (foreground) or `session end --no-park` stops children | ✅ |

*Feedback:*

Ctrl+C results in an error message, but stops the process:

```bash
npm error Lifecycle script `start` failed with error:
npm error code 130
npm error path /home/atari/Projects/Kodranni/apps/cli
npm error workspace @kodranni/cli@0.0.1
npm error location /home/atari/Projects/Kodranni/apps/cli
npm error command failed
npm error command sh -c node --experimental-sqlite --import tsx ./src/main.ts session start --slug vardmark --tunnel --bot
```

Additionally, the session end command hangs after stopping the session, doesn't return prompt to me.

Optional detach:

```bash
npm run kodranni -- session start --slug vardmark --tunnel --bot --detach --force
npm run kodranni -- session status --slug vardmark
```

| # | Check | Result |
|---|--------|--------|
| 1.6 | Detached supervisor log under `~/.kodranni/campaigns/vardmark/runtime/logs/` | ✅ |
| 1.7 | `session end` stops detached live/bot (and parks if named — §5) | ❌ **Minor** |

*Feedback:*

Not sure, but I suspect the parking didn't work. On the named archive, no community tracker nor character sheets are accessible, rendering the archive very useless.

---

## 2. Emissary + public hostname

```bash
npm run kodranni -- emissary --slug vardmark
```

| # | Check | Result |
|---|--------|--------|
| 2.1 | Emissary reports local community OK while session up | ✅ |
| 2.2 | Public hostname probe OK while tunnel up | ✅ |
| 2.3 | Opening the public URL in a browser shows live campaign (not archive page) | ✅ |

*Feedback:*

The /community and /characters/ slugs return not found while in archive

---

## 3. Discord — identity & ST role

Use a **player** Discord account and an account with the Storyteller **role**.

| # | Check | Result |
|---|--------|--------|
| 3.1 | Player `/create name:…` → ephemeral personal sheet link with `?edit=` (or cookie after open) | ✅ |
| 3.2 | Channel gets a draft card | ✅ |
| 3.3 | Opening the edit link unlocks Core spends (Foundations / Skills) | ✅ |
| 3.4 | ST (role, not `/map`) can `/review`, `/intent`, `/award-word`, Harm buttons | ✅ |
| 3.5 | Account **without** ST role is refused on ST commands | ✅ |
| 3.6 | Legacy `/kod-roll` etc. are **gone** (unknown / not listed) | ✅ |

*Feedback:*

Without completing the character, I tried to roll a skill it has zero levels in, which resulted in: "character lacks skill: Debate & Rhetoric". This is incorrect behavior, based on the Guidebook rules. It should not matter how many levels the character has in a skill.

---

## 4. Sheet — budgets & spends (creation)

On the unlocked draft sheet (public or local host, with edit token):

| # | Check | Result |
|---|--------|--------|
| 4.1 | Budget dock shows Foundation / Skill / Words | ✅ |
| 4.2 | Left-click Foundation raises; right-click refunds (min I) | ✅ |
| 4.3 | Foundation at ∅ (if any): tip is not “At maximum”; can raise with points or Wanting | ✅ |
| 4.4 | Skill: click works on the **ring/circle**, not only the name | ✅ |
| 4.5 | Unaffordable ranks look blocked; affordable look spendable | ✅ |
| 4.6 | Words = 0: Words card muted, CTA “Awaiting Words at the table” | ✅ |
| 4.7 | Portrait / identity on Core; Draft tab is “Who do we see?” only | ✅ |

*Feedback:*

---

## 5. Sheet — Wanting

### 5.1 Words arrive live

From Discord (ST): `/award-word character:<slug>` (or your current award path).

| # | Check | Result |
|---|--------|--------|
| 5.1.1 | Within ~2s, Words count on the sheet updates **without** refresh | ✅ |
| 5.1.2 | Words card briefly pulses / highlights on increase | ✅ |
| 5.1.3 | CTA becomes “Open Wanting →” | ✅ |

### 5.2 Flow

| # | Check | Result |
|---|--------|--------|
| 5.2.1 | Open Wanting → top **tracker** appears; normal Found/Skill spends lock | ✅ |
| 5.2.2 | Pay-path **dropdown** options are readable (dark, not white-on-white) | ✅ |
| 5.2.3 | Trait / Negative Trait fields use **placeholders** (faint); typing does not require deleting prefilled “New …” | ✅ |
| 5.2.4 | Select Foundation on Core for +1 Found (including from ∅); tracker updates | ✅ |
| 5.2.5 | Mark skill ranks by clicking **rings**; unmark with right-click | ✅ |
| 5.2.6 | **Stage** then **Confirm Wanting** (or Confirm auto-stages open form) | ✅ |
| 5.2.7 | Positive Trait appears on **Echoes · Traits** after confirm | ✅ |
| 5.2.8 | Closing Wanting unlocks normal spends again | ✅ |

### 5.3 Zero Words

| # | Check | Result |
|---|--------|--------|
| 5.3.1 | Open Wanting with 0 Words → clear message; menu lines disabled | ✅ |

*Feedback:*

---

## 6. Sheet — Echoes / Inventory / Draft text craft

| # | Check | Result |
|---|--------|--------|
| 6.1 | Add Echo: empty title/invoke with placeholders, not “New Echo” as value | ✅ |
| 6.2 | Add Trait / item: placeholders only | ✅ |
| 6.3 | Ink field look is consistent (blood edge, dark ground) across Draft / Echoes / Inventory / Wanting | ✅ |
| 6.4 | Inventory: Food/Water **day numbers centered** | ✅ |
| 6.5 | Armour panel fills the column width (not shrink-wrapped to text) | ✅ |
| 6.6 | Save Echoes·Traits / Inventory persists after reload | ✅ |

*Feedback:*

Profile picture upload fails
Group echo - involved characters selection is missing (options should seed from the Community tracker hierarchy unique set)

---

## 7. Discord — rolls (U5)

### 7.1 Free roll (equal path A)

| # | Check | Result |
|---|--------|--------|
| 7.1.1 | `/roll` → type skill → **autocomplete** lists matches (name · Foundation) | ✅ |
| 7.1.2 | Confirm card: Foundation select shows **all 9**; changing away from guiding is easy | ✅ |
| 7.1.3 | Exertion cycles 0→1→2; **Echo applies?** toggles apply (not “spend”) | ❌ **Minor** |
| 7.1.4 | Cast → public **Marks-first** card; die language like `d8 · Ordinary` | ❓ **Nit**|
| 7.1.5 | **Live sheet** is a Link button (not only markdown) | ❓ **Major** |
| 7.1.6 | Tier default d8; slash can set d6/d12 with Guidebook labels | ✅ |

*Feedback:*

Exertion requires typing 0, 1 or 2, not 'cycling' currently
Echo options not pre-seeded from Character, should be named options from the sheet. If it results in a chicken-egg issue, then the echo selection must be done a step later, on the roll command reply from the automation, before Cast.
Live sheet is a link button, but it also linked it with a token, not sure if it's correct
d6,d8,d12 should use the Advantage/Equal/Disadvantage language, not Easier/Ordinary/Harder

### 7.2 Intent (equal path B)

| # | Check | Result |
|---|--------|--------|
| 7.2.1 | ST `/intent player:@… skill:…` (autocomplete) posts Intent card | ✅ |
| 7.2.2 | Only the named player can press Roll | ✅ |
| 7.2.3 | Roll opens the **same** confirm stance (Found / Exertion / Echo applies) | ✅ |
| 7.2.4 | Cast → Marks-first result | ✅ |

*Feedback:*

Currently only works if a Skill has at least 1 point in it, otherwise, it fails to roll, which is incorrect

### 7.3 Fallback

| # | Check | Result |
|---|--------|--------|
| 7.3.1 | `/roll` with **no** skill → Archetype → Skill → **same** confirm (not Found→Tier wizard pages) | ✅ |

### 7.4 ST tools on result

| # | Check | Result |
|---|--------|--------|
| 7.4.1 | Why this pool? | ✅ |
| 7.4.2 | Harm (ST) | ✅ |
| 7.4.3 | Exertion reclaim (ST) | ✅ |

*Feedback:*

Exertion reclaim should be a separate command, and would have exact amounts of exertion reclaimed, not 'top it up'.

---

## 8. Confirm → review → lock

| # | Check | Result |
|---|--------|--------|
| 8.1 | Player Confirm on sheet → pending review; review card in channel (or ST `/review`) | ✅ |
| 8.2 | ST Approve → character active/locked; sheet edit docks gone after refresh/poll | ✅ |
| 8.3 | Poll/reload does not leave orphan Wanting lock on a locked PC | ✅ |

*Feedback:*

---

## 9. Archive + same-hostname park (U6)

With named tunnel configured:

```bash
# While session was up, public URL = live UI
npm run kodranni -- campaign publish --slug vardmark   # optional mid-session snapshot

npm run kodranni -- session end --slug vardmark
# Default for named: park hostname on archive
```

| # | Check | Result |
|---|--------|--------|
| 9.1 | `~/.kodranni/campaigns/vardmark/archive/` has `index.html` + `snapshot.json` | ✅ |
| 9.2 | After `session end`, public hostname still loads (archive face: “live table is offline”) | ❓ **Major** |
| 9.3 | Archive lists non-draft characters only | ✅ |
| 9.4 | `session end --no-park` tears down tunnel (hostname may go dark) — only if you intentionally test | ✅ |
| 9.5 | `session start --tunnel --bot --force` restores **live** UI on the same hostname | ✅ |

*Feedback:*

The Archive in it's current form is useless, as stated
The Archive is currently still a live running process, not a github pages deployment that lives on either a github page or a named domain, which was set

---

## 10. Reconstruct / secrets survival

```bash
# Optional destructive — only if you can re-seed
npm run kodranni -- campaign seed-demo --slug vardmark --force
```

| # | Check | Result |
|---|--------|--------|
| 10.1 | After `--force`, `campaign.toml` still has named tunnel + ST role (from secrets) | ✅ |
| 10.2 | Demo characters torvald / leifr present | ❓ **Major** |
| 10.3 | No need to hand-edit toml for role/hostname | ✅ |

*Feedback:*

```bash
npm run kodranni -- session start --slug vardmark --tunnel --bot --detach --force
npm run kodranni -- session status --slug vardmark

npm notice run kodranni@0.0.1 kodranni
npm notice run npm run start -w @kodranni/cli -- session start --slug vardmark --tunnel --bot --detach --force
npm notice run @kodranni/cli@0.0.1 start
npm notice run node --experimental-sqlite --import tsx ./src/main.ts session start --slug vardmark --tunnel --bot --detach --force
Session started in background for vardmark
  supervisor pid: 40266
  flags:   tunnel+bot
  log: /home/atari/.kodranni/campaigns/vardmark/runtime/logs/session-supervisor.log
  status: npm run kodranni -- session status --slug vardmark
  end:    npm run kodranni -- session end --slug vardmark
  live:   https://kodranni.cosimomedia.com
  bot pid: 40349
npm notice run kodranni@0.0.1 kodranni
npm notice run npm run start -w @kodranni/cli -- session status --slug vardmark
npm notice run @kodranni/cli@0.0.1 start
npm notice run node --experimental-sqlite --import tsx ./src/main.ts session status --slug vardmark
Session · vardmark
  local:   http://127.0.0.1:8742 · HTTP 404
  public:  https://kodranni.cosimomedia.com · HTTP 404
  started: 2026-08-22T19:26:34.380Z
  live pid:   40278 (alive)
  tunnel pid: 40284 (alive)
  bot pid:    40349 (alive)
```

---

## 11. README sanity

Skim [README.md](../../README.md):

| # | Check | Result |
|---|--------|--------|
| 11.1 | Matches how you actually start a session | ✅ |
| 11.2 | Secrets table matches your files | ✅ |
| 11.3 | Anything missing or misleading? | ✅ **Nit** |

*Feedback:*

It's an incredibly brittle and all around confusing README, really poor take, right now.

---

## Severity guide for notes

When reporting Fail, please tag:

| Tag | Meaning |
|-----|---------|
| **Blocker** | Can’t run a table |
| **Major** | Wrong rules / data loss / immersion-breaking |
| **Minor** | Ugly / confusing but workable |
| **Nit** | Polish |

Include: **where** (Discord / sheet URL / CLI), **steps**, **expected**, **actual**, screenshot if UI.

---

## Suggested order (≈ 45–90 min)

1. §0 secrets + sync  
2. §1 supervisor start  
3. §2–3 public URL + ST role  
4. §4–6 sheet (budgets → Wanting → text/inventory)  
5. §7 Discord rolls (free + Intent + fallback)  
6. §8 Confirm / Approve  
7. §9 archive park on same hostname  
8. §10–11 only if time  

---

## Sign-off

| | |
|--|--|
| Tester | tamas.szentandrasi |
| Date | 2026.08.22.|
| Overall | Prototype functional, not even close to shipable |
| Top 3 issues | refer to severity |
| Top delight | none, but all around decent job |

---

## Review triage (2026-08-22, post-feedback)

| Finding | Severity | Status |
|---------|----------|--------|
| Untrained skill roll rejected (`lacks skill`) | **Major** (rules) | **Fixed** — rating 0 allowed; Practice can create row |
| Archive `/community` `/characters` 404 | **Major** | **Fixed** — static site now includes those routes + per-character pages |
| `session end` hang | **Minor/Major** ops | **Mitigated** — shorter tunnel wait, longer port release, always completes |
| Ctrl+C npm error 130 | **Nit** | **Fixed** — clean exit 0 after shutdown |
| Die language Easier/Harder | **Nit** | **Fixed** — Disadvantage / Equal / Advantage |
| Avatar upload fails | **Major** | **Hardened** client + clearer errors; retest with edit cookie |
| Echo apply should list sheet Echoes | **Major** UX | **Open** — next Discord confirm pass |
| Exertion “cycle” vs slash typing | **Minor** | **Clarify** — cycle is on **confirm card** button; slash still accepts 0/1/2 |
| Live sheet link + edit token | **?** | Result cards = view URL; confirm may include edit token for the roller — OK in creation, revisit for locked PCs |
| Exertion reclaim as separate command | **Minor** design | **Open** — backlog |
| Group Echo stakeholders from community | **Major** feature | **Open** — sheet Echoes editor |
| Archive should be Pages not process | **Major** product | **Open** — U6 follow-up (park process is interim; Pages push next) |
| README brittle | **Nit** | **Open** — rewrite after next ops pass |
| `session status` HTTP 404 right after detach | **Minor** | Race: UI not ready yet — wait / re-status |

**Retest priority:** untrained `/roll`, `session end` park → `/community/` + `/characters/`, avatar upload with bot edit link, die labels on result card.
