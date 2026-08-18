# Automation status & fix register

**Updated:** 2026-08-14

## Status snapshot

| Layer | State | Notes |
|-------|--------|--------|
| Domain (pools, Practice, Harm, Tide, capacities) | Strong | Golden tests; dual capacity formulas |
| Store port (hexagonal) | Improving | `CommunityStorePort`; SQLite is one adapter |
| SQLite adapter | Working | Local SoT under `~/.kodranni/campaigns/<slug>/` |
| CLI | Working | seed/destroy/roll/live/`emissary`/`session`; `live --tunnel`; reconstructible `--force` |
| Live campaign-ui | Functional enough | Community + character UX; polish later |
| App services | Growing | rolls + harm + **creation lifecycle** (draft/claim/spend/Weighing pts/Wanting/ST edit/focus) |
| Discord bot-runtime | **Redesign in progress** | `/create` `/roll` `/intent` `/review` + Birth Omen/Hand; sheet Confirm; Harm on result; kod-* legacy aliases |
| Campaign GitHub/Pages spawn | Not started | Designed only; force-publish on session end |

## Reconstructible demo

| Command | Effect |
|---------|--------|
| `campaign seed-demo [--slug vardmark] [--force]` | Write/overwrite Guidebook **Vardmark at Kelarn’s Bend** demo |
| `campaign destroy --slug X --yes` | Delete campaign dir entirely |
| `campaign export-json --slug X` | Redacted snapshot for inspection |

Default demo slug: **`vardmark`**. Characters: **torvald**, **leifr**.

## Design decisions locked here

| Topic | Decision |
|-------|----------|
| Echo capacity vs Exertion | Independent formulas (Guidebook) |
| Over-capacity dice penalty | Only when roll **involves an Echo** (invoke/tag); flag still means load > capacity |
| Decadence | No Echoes → −1 on every roll |
| RNG | **Crypto** in play; `mulberry32` / `--debug-seed` only for tests & verification |
| Fortunes UI | Visual (bar height + colour); not arabic focus |
| Exertion UI | Arabic current/max + progress bar |
| Foundations UI | Roman rank marks + Harm pips (small ranks) |
| Hierarchy | Every **member** on every axis (default Outcast); Outsiders **side rail** only |
| Hexagonal persistence | App → `CommunityStorePort`; SQLite implements it |
| Campaign map | **Post-initial release** — ST editor + public viewer; Atlas/Ground modes; not VTT. Grok skill/MCP templates later (after hand editor) |
| Layering | **Adapters → `packages/app` in-process**; CLI is ST orchestration only (never bot IPC) |
| Live access | Cloudflare tunnel: **quick** (default) or **named** (ST domain); `live --tunnel`; `emissary`; see `docs/plans/live-tunnel.md` |
| Naming | **`emissary`** (not doctor) — readiness + what to share mid-session |

## Known gaps / next

1. Fluxer prefix path; auto-post review card on Confirm (event bus); true Intent DM  
2. Oppose linking; multi-track / multi-family harm; Discord multi-step skill selects  
3. Publish/archive pipeline (force on session end)  
4. `session start` auto-launch bot when Discord env present  
5. Campaign geography map programme (deferred)  
6. ST full edit UI on sheet (API exists: `stEditCharacter`)

## Verify loop

```bash
npm test
npm run kodranni -- campaign destroy --slug vardmark --yes   # optional clean
npm run kodranni -- campaign seed-demo --force
npm run kodranni -- roll --slug vardmark --character torvald \
  --foundation Strength --skill "Carpentry & Masonry" --tier 8 --exertion 1
npm run kodranni -- live --slug vardmark
```
