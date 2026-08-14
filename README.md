# Kodranni

**Pre-industrial. Human. Grim.**

Kodranni is a tabletop role-playing system for campaigns where ordinary people face unforgiving pre-industrial conditions, the community is the true protagonist, and legacy outlives the individual.

This repository holds the **Guidebook** (Astro + [Starlight](https://starlight.astro.build/)) and **automation** (local SoT, live campaign UI, CLI; Discord/Fluxer bots next).

## Guidebook (local)

```bash
cd /path/to/Kodranni
npm install
npm run dev      # http://localhost:4321
npm run build    # static site → dist/
npm run preview
npm test         # domain + store + app + chat-ui
```

Content: `src/content/docs/`. Theme: self-hosted Bellefair under `public/fonts/`.

## Automation (local Storyteller machine)

```bash
cd /path/to/Kodranni

# Reconstructible demo (Guidebook seed: The Vardmark at Kelarn’s Bend)
npm run kodranni -- campaign destroy --slug vardmark --yes   # optional wipe
npm run kodranni -- campaign seed-demo --force               # create/overwrite

# Player / ST rolls (crypto RNG; optional --debug-seed N for verification only)
npm run kodranni -- roll --slug vardmark --character tomas \
  --foundation Strength --skill "Carpentry & Masonry" --tier 8 --exertion 1
npm run kodranni -- st-roll --slug vardmark \
  --label "War-band scout" --foundation 2 --skill 1 --tier 8

# Live sheet + community tracker (SSR, re-reads SQLite each request)
npm run kodranni -- live --slug vardmark
# → http://127.0.0.1:8742/community/
# → http://127.0.0.1:8742/characters/
# → …/characters/tomas/  and  …/characters/tomas/burden/
```

`npm run kodranni` resolves workspaces from this repo (or `KODRANNI_REPO` if the bin is invoked elsewhere).

Private data: `~/.kodranni/campaigns/<slug>/` (gitignored). Override with `KODRANNI_HOME`.

| Area | Status |
|------|--------|
| Domain + CLI rolls + export | **Yes** |
| Live Community + Character UI | **Functional** (polish deferred) |
| Reconstructible demo (`seed-demo --force` / `destroy`) | **Yes** |
| Discord / Fluxer bot on a real server | **Not yet** |

Capacities: **Exertion** = Res+Con+Cha; **Echo capacity** = max(Str,Dex)+Int+Auth. Over-capacity −1 only on Echo-involved rolls.

Engineering: [docs/plans/automation-architecture.md](docs/plans/automation-architecture.md) · status: [docs/plans/automation-status.md](docs/plans/automation-status.md).

## Hosting (Guidebook — GitHub Pages)

Deploy on push to `main` (`.github/workflows/deploy.yml`). See earlier README notes for custom domain.

## License

See [LICENSE](LICENSE).
