# Automation status & fix register

**Updated:** 2026-08-14

## Status snapshot

| Layer | State | Notes |
|-------|--------|--------|
| Domain (pools, Practice, Harm, Tide, capacities) | Strong | Golden tests; dual capacity formulas |
| Store port (hexagonal) | Improving | `CommunityStorePort`; SQLite is one adapter |
| SQLite adapter | Working | Local SoT under `~/.kodranni/campaigns/<slug>/` |
| CLI | Working | seed/destroy/roll/live; reconstructible with `--force` |
| Live campaign-ui | Functional draft | Community + character UX; not final art |
| Discord / Fluxer bots | Not started | Skeletons only |
| Campaign GitHub/Pages spawn | Not started | Designed only |

## Reconstructible demo

| Command | Effect |
|---------|--------|
| `campaign seed-demo [--slug vardmark] [--force]` | Write/overwrite Guidebook **Vardmark at Kelarn’s Bend** demo |
| `campaign destroy --slug X --yes` | Delete campaign dir entirely |
| `campaign export-json --slug X` | Redacted snapshot for inspection |

Default demo slug: **`vardmark`**. Characters: **tomas**, **leif**.

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

## Known gaps / next

1. Bot runtime (Discord then Fluxer) on same port  
2. Induct-outsider CLI  
3. Further tracker craft (parallel with bots)  
4. Publish/archive pipeline  

## Verify loop

```bash
npm test
npm run kodranni -- campaign destroy --slug vardmark --yes   # optional clean
npm run kodranni -- campaign seed-demo --force
npm run kodranni -- roll --slug vardmark --character tomas \
  --foundation Strength --skill "Carpentry & Masonry" --tier 8 --exertion 1
npm run kodranni -- live --slug vardmark
```
