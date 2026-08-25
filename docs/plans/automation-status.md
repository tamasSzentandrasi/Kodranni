# Automation status, process lanes & backlog

**Updated:** 2026-08-25

---

## U-phase shipping

| Phase | Focus | Status |
|-------|--------|--------|
| **U1** | In-place Found/Skill spend + spacing + Echo track colour | **Shipped** |
| **U2** | Bot-signed edit tokens | **Shipped** |
| **U3** | Wanting + who-we-see | **Shipped** (polish continues on sheet) |
| **U4** | Echoes / Inventory / Traits editors | **Shipped** (UX craft ongoing) |
| **U5** | Discord Intent∥free-roll, autocomplete, confirm, Link buttons, remove `kod-*` | **Shipped** — restart bot to re-register slash cmds |
| **U6** | Archive publish + same-hostname park | **Superseded** — park-process is not the archive. See [`infra-devsecops.md`](./infra-devsecops.md) |

Sheet creation UX **theorycraft** (highest visual bar) is queued **after U6** (or after a short QoL lane if U6 waits on ops).

---

## Process lanes (how we work)

Use **one active lane** at a time. Park ideas in the backlog; do not start a second lane mid-flight.

| Lane | Purpose | Cadence |
|------|---------|---------|
| **A · Table (Discord)** | Rolls, Intent, Harm, bot UX | Done for U5; bugfixes only until U6 |
| **B · Sheet craft** | Creation UX, Wanting, inventory, ink fields | Theorycraft after U6; hotfixes anytime |
| **C · Session ops** | Secrets auto-fill, **one CLI supervisor** (`session start --tunnel --bot`), logs | **Active QoL now** |
| **D · Archive / hostname** | One hostname + KV snapshot; no campaign git repo | Locked: [`infra-devsecops.md`](./infra-devsecops.md) |
| **E · Debt / polish** | Explicit debt tickets below | Pull between lanes, not mid-feature |

**North star for C (updated 2026-08-25):** one production host process (store + campaign-ui + Discord handler). `cloudflared` is the only extra child, session-scoped. systemd --user on Linux. The current CLI spawning `astro dev` + `npm -w` bot + PID files is interim — see [`infra-devsecops.md`](./infra-devsecops.md) I6.

---

## Reconstructible demo + durable ST machine prefs

| Command | Effect |
|---------|--------|
| `campaign seed-demo [--force]` | Write demo; **auto-fills** tunnel mode/hostname + ST role from secrets/env |
| `campaign sync-defaults` | Re-apply secrets/env into existing `campaign.toml` (no wipe) |
| `campaign destroy --yes` | Delete campaign dir |

Durable files under `~/.kodranni/secrets/` (survive destroy):

| File | Env |
|------|-----|
| `cf-tunnel-token` | `KODRANNI_CF_TUNNEL_TOKEN` |
| `cf-tunnel-hostname` | `KODRANNI_TUNNEL_HOSTNAME` |
| `discord-storytellerRoleID` | `DISCORD_STORYTELLER_ROLE_ID` |
| (+ existing discord/fluxer/sheet secrets) | |

Tunnel **token is never written** into `campaign.toml`.

---

## Backlog (parked ideas & debt)

### P0 — from manual test (2026-08-22)

1. ~~Untrained skill rolls~~ **fixed**
2. ~~Archive `/community` `/characters` routes~~ **fixed** (static pages)
3. ~~session end hang / Ctrl+C noise~~ **mitigated**
4. ~~Die tier Advantage/Equal/Disadvantage labels~~ **fixed**
5. Avatar upload — retest with edit link (client hardened)
6. Confirm: Echo select = named Echoes from sheet (not boolean)
7. Group Echo stakeholders seeded from community hierarchy
8. Archive → one hostname + KV snapshot (park process is not the product) — [`infra-devsecops.md`](./infra-devsecops.md)
9. `/exertion-reclaim` (or ST tool) with exact amounts
10. README clarity rewrite (again) after ops settle

### P1 — U6 / infra (see infra-devsecops.md)

5. `public.json` + archive-mode campaign-ui (same components); KV snapshot, not a second HTML site
6. Session-end publish to KV; presence origin=null (not park-process)
7. One hostname: Pages Function proxy ↔ tunnel; fail-closed to snapshot

### P2 — sheet creation theorycraft

8. Full creation journey UX review (Wanting tracker, budgets, text craft, mobile)
9. Sheet “Roll this” deep links into Discord confirm
10. Progressive menus only as mercy paths; Intent∥free-roll already equal

### P3 — Discord / Fluxer depth

11. Oppose `parent_roll_id` linking
12. Multi-track / multi-family Harm
13. Fluxer prefix parity + autocomplete
14. Custom die emoji pack (optional)

### P4 — deferred product

15. Campaign geography map
16. Cloudflare Access / OAuth (only if tokens prove insufficient)

---

## Verify loop

```bash
npm test
npm run kodranni -- campaign sync-defaults --slug vardmark
npm run kodranni -- emissary --slug vardmark
# after secrets filled:
npm run kodranni -- campaign seed-demo --force   # or sync-defaults only
```

---

## Design decisions still locked

| Topic | Decision |
|-------|----------|
| Sheet = person / Chat = hands | Unchanged |
| Intent ∥ free-roll | Equal paths; confirm shared; Echo = agreed apply |
| Foundation ≠ guiding | Common; all 9 on confirm |
| Hexagonal | Adapters → `packages/app`; CLI = ST ops only |
| Live access | One hostname; tunnel behind Pages Function ([`infra-devsecops.md`](./infra-devsecops.md) I1/I4). ST-supplied named-tunnel secrets are interim. |
| Session shape | One production process + session-only `cloudflared` (I6). Current npm-child supervisor is interim. |
| Archive | KV `public.json` + product archive app. No campaign git repo (I2). Park-process is not the archive. |
