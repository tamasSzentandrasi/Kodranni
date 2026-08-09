# Kodranni

**Pre-industrial. Human. Grim.**

Kodranni is a tabletop role-playing system for campaigns where ordinary people face unforgiving pre-industrial conditions, the community is the true protagonist, and legacy outlives the individual.

This repository holds the **Guidebook** (Astro + [Starlight](https://starlight.astro.build/)) and planning documents for **automation**: shared character sheets, a community tracker, and bots on **Fluxer** and **Discord** over a per-community backend.

## Guidebook (local)

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site → dist/
npm run preview  # serve production build
```

Content: `src/content/docs/`. Sidebar: `astro.config.mjs`. Theme: `src/styles/custom.css` (standard Starlight scroll layout).

## Hosting (GitHub Pages)

Deploy is automatic on push to `main` (`.github/workflows/deploy.yml`).

| URL | What you get |
|-----|----------------|
| [github.com/…/Kodranni](https://github.com/tamasszentandrasi/Kodranni) | **Repository** (source, issues, history) |
| […github.io/Kodranni/](https://tamasszentandrasi.github.io/Kodranni/) | Project portal → repo + Guidebook links |
| […github.io/Kodranni/Guidebook/](https://tamasszentandrasi.github.io/Kodranni/Guidebook/) | **Guidebook** (Starlight); starts at `/introduction/` |

GitHub Pages cannot replace `github.io/Kodranni/` with the GitHub **repo UI** — those are different hosts. The portal at the Pages root points at both.

Repo **Settings → Pages** must use **Source: GitHub Actions**.

Build layout: Astro `base` is `/Kodranni/Guidebook`. CI copies `dist/` into `publish/Guidebook/` and adds `public-root/index.html` as the Pages root.

### Custom domain (branded URL, e.g. kodranni.com)

GitHub cannot invent a hostname for free beyond `*.github.io`. To drop the username from the URL:

1. Register a domain (e.g. `kodranni.com` or `kodranni.game`).
2. In the repo **Settings → Pages → Custom domain**, enter it and enable DNS HTTPS when available.
3. At your registrar, point DNS as GitHub instructs (usually a `CNAME` to `tamasszentandrasi.github.io` for a `www` host, or `A` records for apex).
4. In this repo:
   - `astro.config.mjs`: set `site: 'https://YOUR.DOMAIN'` and `base: '/'` (or `/Guidebook` if you keep nesting)
   - `scripts/prefix-base.mjs`: set `BASE` to match `base` (or `''` for root)
   - adjust `.github/workflows/deploy.yml` publish layout if you no longer nest under `Guidebook/`
   - add `public/CNAME` containing a single line: `YOUR.DOMAIN`
5. Push; wait for DNS + certificate.

Until then, the `github.io/Kodranni/Guidebook/` URL is the working docs host.

## Documentation map

| Area | Entry |
|------|--------|
| Design intent | [Introduction](src/content/docs/introduction.md) |
| Resolution | [Dice Mechanics](src/content/docs/dice-mechanics.md) |
| Character capacity | [Human Potential](src/content/docs/human-potential.md) |
| Continuity | [Echoes](src/content/docs/echoes.md) |
| Injury | [Harm](src/content/docs/harm.md) |
| Standing | [Hierarchies](src/content/docs/hierarchies.md) |
| Gear | [Inventory](src/content/docs/inventory.md) |
| ST prep | [Campaign Setup](src/content/docs/campaign-setup.md) |
| PCs | [Character Creation](src/content/docs/character-creation.md) |
| Shared sheets & bots | [Automation](src/content/docs/automation.md) |
| Terms | [Glossary](src/content/docs/glossary.md) |

## Plans

| Plan | Purpose |
|------|---------|
| [docs/plans/starlight-guidebook.md](docs/plans/starlight-guidebook.md) | Finish and operate the Astro + Starlight guidebook |
| [docs/plans/automation-architecture.md](docs/plans/automation-architecture.md) | Per-community backend, Fluxer + Discord, shared sheet/tracker |
| [docs/plans/documentation-gaps.md](docs/plans/documentation-gaps.md) | Gaps (✅🚫❓) and locked design answers |

## Design constraints (system)

1. No magic or supernatural beings  
2. Pre-industrial setting  
3. Characters are ordinary human beings  
4. If the community is destroyed, the campaign ends  
5. Death is permanent; continuity runs through Echoes, Legacies, and Foundation Myths  
6. **Advantage / Disadvantage** set die tier (Storyteller-declared; safe default **d8**)  
7. One shared character record and community tracker per table — no duplicate sheets  

## License

See [LICENSE](LICENSE).
