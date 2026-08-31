# Manual test — Storyteller host (verify-ready)

**What this is:** one evening, in order. Dark archive, then Found / Discord picker / live table, then the same URL becoming archive again.

**Lock:** [`infra-devsecops.md`](./infra-devsecops.md) I1–I10, [`storyteller-host.md`](./storyteller-host.md).

You should **not** need: `npm run`, `--tunnel --bot`, `printf` of a Discord bot token or Cloudflare tunnel token, `campaign sync-defaults`, or a campaign git repo.

---

## How to mark

| Status | Meaning |
|--------|---------|
| `pass` | Worked as described |
| `fail` | Broken or wrong |
| `skip` | You did not try it |
| `n/a` | Does not apply |

Leave **Status** blank until you run the row. Write only in **Notes**. For every `fail`: **Blocker** / **Major** / **Minor** / **Nit**, then where, what you did, expected, happened.

Hard-refresh (or a private window) after `start` and after `stop`.

---

## Meta

| | Your fill |
|--|--|
| Tester | |
| Date | |
| Commit (`git rev-parse --short HEAD`) | |
| Campaign name | (not “community”) |
| Campaign id (slug) | |
| Table URL | `https://kodranni.com/community/?campaign=` |
| Local desk | `http://127.0.0.1:8742/operator` |
| Discord guild | |
| Overall (fill last) | `ship` / `fix-then-ship` / `blocked` |

**Run-wide notes**

```
```

---

## 0. Before you sit down

From the repo (dev) or the host tarball (product):

```bash
# product: packaging/linux/install-user.sh  then  kodranni
# this repo:
npm ci   # author machine only
```

You need Node 22 on a **dev** checkout. A Release tarball should not ask for `npm` on the host.

Do **not** write `discord-botToken` or a Cloudflare API/tunnel token for this run. If those files already exist from earlier nights, leave them — they are a hatch, not this test.

Interactions URL in the Discord portal stays `https://kodranni.com/interactions`.

---

## 1. Dark archive (laptop off)

Do not start a session. If one is up: `kodranni stop`.

Private window:

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 1.1 | `https://demo.kodranni.com/community/` is an **archive** hall (plate, Find, Fortunes) |  | |
| 1.2 | `https://kodranni.com/community/?campaign=vardmark` archive as well |  | |
| 1.3 | Discord `/roll` while dark: ephemeral “table is not live” + archive URL. No host call. |  | |

**Feedback (dark)**

```
```

---

## 2. Found (desk, no tunnel)

```bash
kodranni --name "Your campaign"
```

Or restore: `kodranni --name "Your campaign" --from ./some-public.json`

Opens `http://127.0.0.1:8742/operator`. Ctrl+C later — do not `start` yet.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 2.1 | Command has **no** `npm run`, **no** `--tunnel --bot` |  | |
| 2.2 | Desk loads. It says **Campaign** (name + slug), not “community name” |  | |
| 2.3 | Public URL is `https://kodranni.com/community/?campaign=<slug>` (Vardmark demo stays `demo.kodranni.com`) |  | |
| 2.4 | Restore path (if you used `--from` or the Restore form): hall/sheets match the snapshot, no Discord snowflakes in the JSON |  | |
| 2.5 | Emissary (`/emissary` or `kodranni emissary`) does **not** tell you to write `discord-botToken` |  | |

**Feedback (found)**

```
```

---

## 3. Discord picker

Stay on the operator desk.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 3.1 | **Invite the bot** opens Discord OAuth (official app). You did not paste a bot token |  | |
| 3.2 | After invite, **Refresh lists** shows your guild |  | |
| 3.3 | Pick play channel + Storyteller role · **Save bind** |  | |
| 3.4 | `campaign.toml` has `discord_guild_id`, `discord_play_channel_id`, `discord_storyteller_role_id`. No bot token in that file |  | |
| 3.5 | You did **not** need to `printf` snowflakes into `~/.kodranni/secrets/` |  | |

Ctrl+C the desk.

**Feedback (Discord bind)**

```
```

---

## 4. Start the live table

```bash
kodranni start
```

Leave this terminal open until section 8.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 4.1 | Local `http://127.0.0.1:8742/community/` is **live** |  | |
| 4.2 | Printed public URL is the **same bookmark** as 2.3, not `origin-*.kodranni.com` |  | |
| 4.3 | `kodranni status` (second terminal): live |  | |
| 4.4 | Hard-refresh the public `?campaign=` URL — **live**, styled (CSS/assets) |  | |
| 4.5 | `demo.kodranni.com` still the showcase (do not expect your new campaign there) |  | |
| 4.6 | Play channel got a session card with the community URL |  | |
| 4.7 | Public host 404s `/operator` and `/community/setup/` |  | |

**Feedback (start)**

```
```

---

## 5. Live hall + sheet (public URL)

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 5.1 | Hall: fortunes, hierarchy, Find, portraits |  | |
| 5.2 | Open a sheet: rails, skill wheel |  | |
| 5.3 | Narrow viewport (~390px) usable |  | |

**Feedback (hall)**

```
```

---

## 6. Discord table (HTTP)

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 6.1 | `/roll` skill autocomplete |  | |
| 6.2 | Cast → **public** Marks card in the play channel (not only ephemeral to the caster) |  | |
| 6.3 | `/roll` with **no** skill → Archetype picker (not “Forgot Skill?”) |  | |
| 6.4 | Result card has Harm, **not** an Exertion fill-to-max button |  | |
| 6.5 | ST `/reclaim character:…` (optional `points:`) restores Exertion |  | |
| 6.6 | `/create name:…` → ephemeral **edit** link |  | |

**Feedback (Discord)**

```
```

---

## 7. Live sheet (edit token + Wanting)

Open the **edit** link from `/create`.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 7.1 | Edit unlocks Core spends. Public view URL does not |  | |
| 7.2 | Core → Echoes → Inventory **without** reopening the signed link (draft stays) |  | |
| 7.3 | Wanting: pick a **line** in the panel, then mark pay on Core. Cancel is the button, not a click on the sheet |  | |
| 7.4 | Confirm → ST Approve → locked |  | |

**Feedback (sheets)**

```
```

---

## 8. Stop — same URL, archive

In the session terminal: Ctrl+C **or** `kodranni stop`.

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 8.1 | Publishes; exit 0; no sqlite “not open” |  | |
| 8.2 | Hard-refresh the **same** public URL — archive again |  | |
| 8.3 | `http://127.0.0.1:8742/community/` is **down** (private window) |  | |
| 8.4 | Discord command while dark: not-live + archive URL |  | |

**Feedback (stop)**

```
```

---

## 9. Optional

| ID | Try this | Status | Notes |
|----|----------|--------|-------|
| 9.1 | `kodranni start --force` recovers a dead pid |  | |
| 9.2 | Snapshot download from operator, then `kodranni --name "Copy" --from that.json` |  | |
| 9.3 | Homelab unit exists (`kodranni-table.service`) and is **not** enabled by install |  | |

---

## Sign-off

| | Your fill |
|--|--|
| Overall | `ship` / `fix-then-ship` / `blocked` |
| Blockers (IDs) | |
| Majors (IDs) | |
| Would you start a real session on this tomorrow? | |

```
```
