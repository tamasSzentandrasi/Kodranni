# Automation status & fix register

**Updated:** 2026-08-14

## Status snapshot

| Layer | State | Notes |
|-------|--------|--------|
| Domain (pools, Practice, Harm, Tide, capacities) | Strong | Golden tests; dual capacity formulas |
| Store port (hexagonal) | Improving | `CommunityStorePort`; SQLite is one adapter |
| SQLite adapter | Working | Local SoT under `~/.kodranni/campaigns/<slug>/` |
| CLI | Working | seed/destroy/roll/live/`emissary`; `live --tunnel`; reconstructible `--force` |
| Live campaign-ui | Functional enough | Community + character UX; polish later |
| Discord / Fluxer bots | Not started | Skeletons only; call **app** not CLI |
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
| Live access | Optional **hashed Cloudflare quick tunnel** (`live --tunnel`); `emissary` reports URLs |
| Naming | **`emissary`** (not doctor) — readiness + what to share mid-session |

## Known gaps / next

1. Background `session start/end` + structured runtime logs  
2. Bot runtime (Discord then Fluxer) over ChatPort → app  
3. ST harm assign + resource event app commands  
4. Publish/archive pipeline (force on session end)  
5. Campaign geography map programme (deferred)  

## Verify loop

```bash
npm test
npm run kodranni -- campaign destroy --slug vardmark --yes   # optional clean
npm run kodranni -- campaign seed-demo --force
npm run kodranni -- roll --slug vardmark --character torvald \
  --foundation Strength --skill "Carpentry & Masonry" --tier 8 --exertion 1
npm run kodranni -- live --slug vardmark
```
