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
6. Die tier is Storyteller-declared (safe default **d8**)  
7. One shared character record and community tracker per table — no duplicate sheets  

## License

See [LICENSE](LICENSE).
