# Manual test — Kodranni table (current stack)

**What this is:** one evening at the table, in order. Dark archive first, then live, Discord, sheets, then the same URL becoming archive again.

**Architecture lock:** [`infra-devsecops.md`](./infra-devsecops.md). Live and archive are **one hostname** in two states. There is no campaign git repo, no park-process, no bot token on the laptop (default path).

**Do not use:** `session end --park-hostname` as the product. Named-tunnel tokens and `KODRANNI_DISCORD_GATEWAY=1` are hatches, not this run.

---

## How to mark

| Status | Meaning |
|--------|---------|
| `pass` | Worked as described |
| `fail` | Broken or wrong |
| `skip` | You did not try it |
| `n/a` | Does not apply to this machine/guild |

Leave **Status** blank until you run the row. Write only in **Notes** (and the **Feedback** block under each section).

For every `fail`, start Notes with **Blocker** / **Major** / **Minor** / **Nit**, then: where, what you did, what you expected, what happened.

Hard-refresh (or a private window) after session start and after Ctrl+C so you are not looking at a cached live page while the table is dark, or the reverse.

---

## Meta

| | Your fill |
|--|--|
| Tester | |
| Date | |
| Commit (`git rev-parse --short HEAD`) | |
| Campaign slug | `vardmark` (or: ) |
| Table URL | `https://kodranni.com/community/?campaign=vardmark` |
| Showcase URL | `https://demo.kodranni.com/community/` |
| Local UI | `http://127.0.0.1:8742/community/` |
| Discord guild | |
| Overall (fill last) | `ship` / `fix-then-ship` / `blocked` |

**Run-wide notes**

```
(free write — surprises, mood, “this is the product” / “this is still a workshop”)
```

---

## 0. Before you sit down

You need, on this machine:

- Repo at a commit that includes archive sheets + Discord HTTP (anything on `main` after `a61f777` is fine).
- Node 22, `npm ci` already done.
- `~/.kodranni/campaigns/vardmark/` with sqlite. If empty: `npm run kodranni -- campaign seed-demo --slug vardmark`. If it says the demo is already present, leave it — only `--force` wipes the campaign.
- Host secrets (files under `~/.kodranni/secrets/`, mode `600`):

  | File | Needed for this run |
  |------|---------------------|
  | `discord-serverID` | yes |
  | `discord-playChannelID` | yes (session card) |
  | `discord-storytellerRoleID` | yes (ST commands) |
  | `sheet-token-secret` | yes (edit links) |
  | `edge-device-key` | created automatically if missing |
  | `discord-botToken` | **no** — Worker only |

- Discord Developer Portal → app → **Interactions Endpoint URL** = `https://kodranni.com/interactions`.
- Two Discord accounts if you can: one with the ST role, one without.
- A browser at desktop width, then once at a phone width (DevTools is enough).

Commands are from the repo root.

---

## 1. Dark archive (laptop “off”)

Do **not** start a session yet. If a leftover session is up:

```bash
npm run kodranni -- session end --slug vardmark
```

Wait ~5s. Then open the public URLs in a **private window**.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 1.1 | `https://kodranni.com/community/?campaign=vardmark` loads a hall (Fortunes, hierarchy, Find), marked **archive** | | |
| 1.2 | Same hall at `https://demo.kodranni.com/community/` | | |
| 1.3 | Plate chrome, Bellefair, fortune ornaments, falcon logo — not unstyled HTML | | |
| 1.4 | Find filters names; member links go to sheets and keep `?campaign=vardmark` on kodranni.com | | |
| 1.5 | Open Torvald Core. Three-column sheet: exertion rail, identity, echo rail; foundations in Physical/Mental/Social; skill wheel with archetype medallions | | |
| 1.6 | Echoes · Traits tab: names and weights, not a dump of fields | | |
| 1.7 | Inventory: armour / food / water plates. Named items show **the name**; the note is behind **i**, not concatenated on the line | | |
| 1.8 | Roster `/characters/?campaign=vardmark` lists published characters only (no drafts) | | |
| 1.9 | Discord `/roll` (or any command) while dark: ephemeral “table is not live” plus an archive URL. No host call. | | |

**Feedback (dark archive)**

```
```

---

## 2. Secrets & emissary (still dark)

```bash
npm run kodranni -- campaign sync-defaults --slug vardmark
npm run kodranni -- emissary --slug vardmark
ls -l ~/.kodranni/secrets
```

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 2.1 | Secret files are `600`; directory not world-readable | | |
| 2.2 | `campaign.toml` has `edge_url` / `edge_control_url`. No Cloudflare API token, no Discord bot token in the file | | |
| 2.3 | Emissary: store ok, discord guild present. It may say local UI is down — that is correct while dark | | |
| 2.4 | You did **not** need `discord-botToken` on the laptop for this run | | |

**Feedback (machine)**

```
```

---

## 3. Start the live table

```bash
npm run kodranni -- session start --slug vardmark --tunnel --bot
```

Leave this terminal open. Do not Ctrl+C until section 8.

Watch the log for: local UI ready, public URL, `origin: origin-…kodranni.com (Worker only)`, `bot: HTTP interactions in campaign-ui`. Failures to write down: `snapshot PUT 401`, `tunnel failed`, `bot: HTTP 403`.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 3.1 | Local `http://127.0.0.1:8742/community/` is the **live** hall (source “live store”, not archive) | | |
| 3.2 | Startup printed a **public** URL (`https://demo.kodranni.com` or your `edge_url`), not `origin-*.kodranni.com` | | |
| 3.3 | Bot line is HTTP in campaign-ui, **not** a gateway login / “in-process discord.js” | | |
| 3.4 | Play channel got a session card with the community URL | | |
| 3.5 | `npm run kodranni -- session status --slug vardmark` (second terminal): live pid alive, tunnel pid alive | | |
| 3.6 | Hard-refresh `https://kodranni.com/community/?campaign=vardmark` — now **live**, same bookmark as 1.1 | | |
| 3.7 | Hard-refresh `https://demo.kodranni.com/community/` — live as well | | |

**Feedback (session start)**

```
```

---

## 4. Live hall (public URL)

Stay on the **public** hostname, not only localhost.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 4.1 | Hall reads as the plate/hall (fortunes, hierarchy, porch, myths) | | |
| 4.2 | Find works; inspect drawer / tips work | | |
| 4.3 | Character medallions / portraits on the hall load (no broken images) | | |
| 4.4 | Open a sheet from the hall. Core layout holds: rails not overlapping identity; skill seals visible | | |
| 4.5 | Narrow viewport (~390px): hall and sheet usable, not a spilled grid | | |

**Feedback (live hall)**

```
```

---

## 5. Operator desk is local only

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 5.1 | `http://127.0.0.1:8742/operator` loads (session, snapshot download, ST desk link) | | |
| 5.2 | `http://127.0.0.1:8742/emissary` is JSON and looks honest (store, device key, discord, session) | | |
| 5.3 | `http://127.0.0.1:8742/community/setup/` is the ST desk **on localhost** | | |
| 5.4 | The **public** host 404s (or does not show) `/operator`, `/emissary`, `/community/setup/` | | |
| 5.5 | Snapshot download from operator is JSON without Discord snowflakes / `initiator` | | |

**Feedback (operator)**

```
```

---

## 6. Discord — HTTP table

Use the official app in the bound guild. Player account vs ST-role account.

Autocomplete is answered by the Worker from the skill catalog (works even if the host hiccups). Commands and buttons go: Discord → Worker (3s ACK) → your campaign-ui → Worker posts/edits the card.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 6.1 | `/roll` skill autocomplete: names with Foundation, filters as you type | | |
| 6.2 | `/roll skill:Craft` (or similar) → confirm card (Foundations, Exertion cycle, Echo control, Cast) | | |
| 6.3 | Cast → public Marks-first result card. “Live sheet” is a **link** (view, not an edit token) for an active PC | | |
| 6.4 | Untrained skill (rating 0 / not on the sheet) still rolls | | |
| 6.5 | `/roll` with **no** skill → Archetype picker → skill → same confirm | | |
| 6.6 | ST `/intent @player skill:…` → only that player can press Roll | | |
| 6.7 | Result: Why this pool? · Harm (ST) · Exertion reclaim (ST) | | |
| 6.8 | Non-ST is refused on `/intent`, `/award-word`, `/review`, Harm | | |
| 6.9 | `/create name:…` → ephemeral sheet link **with edit token**; draft appears | | |
| 6.10 | No `kod-*` slash commands | | |
| 6.11 | `/live` points at the **same** public hostname you have bookmarked | | |

**Feedback (Discord)**

```
```

---

## 7. Live sheet (creation / Wanting / editors)

Open the **edit** link from `/create` (player) or the ST signed link. Public view-only sheet should stay read-only.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 7.1 | Edit link unlocks Core spends (budget dock). View URL does not | | |
| 7.2 | Foundation: left-click raise, right-click refund (not below I except ∅ restore) | | |
| 7.3 | Skill spend hits the **seal**, not only the name. Unaffordable vs spendable is obvious | | |
| 7.4 | Portrait upload with edit link works; without it, a clear failure | | |
| 7.5 | Draft / Who do we see? / concept / community tie save | | |
| 7.6 | ST `/award-word` → Words on the sheet within ~2s, no full reload required | | |
| 7.7 | Open Wanting: Found/Skill spends lock; confirm a trait; close Wanting, spends unlock | | |
| 7.8 | Echoes tab: add/edit/save; weight left/right click | | |
| 7.9 | Inventory: armour None → Light → Heavy; food/water ±; add a named item (name + note). After save, name is the line; note is **i** | | |
| 7.10 | Sheet **Confirm** → pending review; ST Approve → locked; creation docks gone | | |

**Feedback (sheets)**

```
```

---

## 8. End session — same URL, archive

In the session terminal:

```text
Ctrl+C
```

Expect: `publishing archive to the edge…`, then the process exits **without** `database is not open` / npm lifecycle error.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 8.1 | Ctrl+C publishes; no sqlite “not open”; exit 0 | | |
| 8.2 | Tunnel pid is gone (`session status`) | | |
| 8.3 | Hard-refresh the **same** public community URL — archive again (1.1 face), not a 1016 / blank / live editor | | |
| 8.4 | Character you just locked (or Torvald) still styled: rails, skill wheel, inventory names + **i** | | |
| 8.5 | Drafts from `/create` that were never approved are **absent** from the archive roster | | |
| 8.6 | Discord command while dark: not-live + archive URL (same as 1.9) | | |
| 8.7 | `http://127.0.0.1:8742/community/` is down (host process stopped) | | |

**Feedback (session end)**

```
```

---

## 9. Optional — start again, force, detach

Only if 1–8 were clean or you have extra time.

```bash
npm run kodranni -- session start --slug vardmark --tunnel --bot --force
# later:
npm run kodranni -- session end --slug vardmark
```

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 9.1 | `--force` recovers if a dead pid was left in `session.json` | | |
| 9.2 | Public URL is live again within a minute | | |
| 9.3 | `--detach` (if you try it): status works; `session end` tears tunnel + publishes | | |

**Feedback (restart)**

```
```

---

## 10. Visual pass (once, after the table works)

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 10.1 | Live hall and archive hall feel like the **same** room, edit off when dark | | |
| 10.2 | Live Core vs archive Core: same bones (identity, rails, wheel). Archive has no spend chrome | | |
| 10.3 | Inventory live (read-only) vs archive: named items look the same | | |
| 10.4 | Nothing on the public hostname looks like a setup/debug page | | |

**Feedback (look)**

```
```

---

## Suggested order (~60–90 min)

1. Section 1 dark archive (10 min) — if this is ugly, stop and write it down; the rest of the night is the live table.
2. Section 2 then 3 start (10 min).
3. Sections 4–5 public hall + prove operator is local (10 min).
4. Sections 6–7 Discord + sheet (30–40 min). This is the actual game.
5. Section 8 Ctrl+C (10 min). Compare with section 1.
6. 9–10 only if you still have steam.

Do **not** seed-demo `--force` unless you can throw the sqlite away.

---

## Sign-off

| | Your fill |
|--|--|
| Overall | `ship` / `fix-then-ship` / `blocked` |
| Blockers (IDs) | |
| Majors (IDs) | |
| Top 3 to fix next | 1.  2.  3. |
| What improved since last time you sat the table | |
| What still hurts immersion | |
| Would you start a real session on this tomorrow? | yes / not yet — why: |

**Anything else**

```
```
