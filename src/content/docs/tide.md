---
title: Tide
description: Shared pressure for contests larger than a clean 1v1 — setup, Marks, Omens, and imbalance.
---

> *“In battle, momentum means riding on the force of the tide of events.”*
> — *Sun Tzu*

<figure class="kod-breath not-content">
<img src="/scenes/hattin.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

----------

## The Tide

The Tide is a **shared** pressure track for a whole side when the contest is larger than a clean 1v1 — a skirmish, a running fight, a hall-wide debate, a pursuit, a column under harassment.

It is **not** a second character sheet and **not** the same as personal Advantage on one roll. Individual actions still resolve on their own. Some of those actions are **Tide-linked**: their Marks margin (and sometimes Omen) nudge a **single marker** on one shared bar. When the marker hits an end, that **collective** side routes. People can still stand, flee, die, or complete a personal objective in the rout.

### Setup

Both sides share **one** track. The Storyteller assigns each side a soft **weight** (numbers, ground, morale, who holds the better footing as a force — not a sum of Foundation scores).

| Term | Meaning |
|------|---------|
| **Weight** | Soft ST read of each side’s collective footing (higher = stronger as a force) |
| **Track length** | `weight_A + weight_B − 1` — how long the bar is |
| **Start** | At `weight_A` counted from side A’s collapse end — A begins farther from collapse if heavier |
| **Skirmish size** | How hard the bar is to move: Marks of difference needed per step (separate from track length) |

| Situation | Weights (A vs B) | Track length | Start (from A’s end) |
|-----------|------------------|--------------|----------------------|
| Equal footing | 8 vs 8 | 15 | 8 |
| Slight advantage (A) | 8 vs 6 | 13 | 8 |
| A clearly superior | 8 vs 12 | 19 | 8 |
| A severe disadvantage | 6 vs 12 | 17 | 6 |

(The last row starts at 6 because side A’s weight is 6 — they begin closer to collapse.)

There are **three** sizes. There is no larger scale than Battle.

| Skirmish size | Marks difference per Tide step |
|---------------|--------------------------------|
| Tiny skirmish | 1 |
| Small skirmish | 2 |
| Battle | 3 |

### Shifting by Marks

On a Tide-linked opposed exchange, take the **Marks difference** (margin). Steps moved = `floor(margin ÷ Marks needed)`. Direction: toward the winner of that exchange.

A roll that is **not** Tide-linked (a local fight, an extraction, a personal objective) does not move the bar.

### Omens on the Tide

Omens on Tide-linked actions also move the marker. Direction depends on which end of the track a face pushes toward. **Marks and Omen are independent** — the same roll can step the bar from the margin *and* from an Omen face.

On **equal footing**:

| Skirmish size | Faces toward A collapse | Faces toward B collapse |
|---------------|-------------------------|-------------------------|
| Tiny skirmish | **1** | **20** |
| Small skirmish | **1–2** | **19–20** |
| Battle | **1–3** | **18–20** |

### Imbalance — the same ladder as die tiers

Personal Advantage on a single roll is still judged case by case. Collective imbalance is different: it changes **which Omen faces** push the shared bar.

Treat collective footing as the die-tier ladder:

- **Equal** — both sides ordinary
- **Slight** — one step (`d8` vs `d12`, or `d6` vs `d8`)
- **Severe** — two steps (`d6` vs `d12`)

**Procedure.** The side under pressure **keeps its bad band** at the current skirmish size. Its **good band is taken from N sizes smaller** on the equal-footing table (slight N=1, severe N=2).

There is no size below Tiny skirmish. A good band **cannot shrink below one face**.

Battle examples:

| Footing | Faces |
|---------|-------|
| Slight, A disadvantaged | **1–3** / **19–20** |
| Slight, B disadvantaged | **1–2** / **18–20** |
| Severe, A disadvantaged | **1–3** / **20** only |
| Severe, B disadvantaged | **1** only / **18–20** |

<div class="kod-widget not-content" data-widget="content-tabs" data-tide-footing>
<p class="kod-widget__title">Tide footing — Omen bands</p>
<p class="kod-widget__intro">Pick a size, then a collective footing. The disadvantaged side keeps its bad band; its good band comes from a smaller size on the table above.</p>
<div class="kod-widget__controls" role="group" aria-label="Skirmish size">
<button type="button" class="kod-widget__btn" data-tab="tiny">Tiny skirmish</button>
<button type="button" class="kod-widget__btn" data-tab="small">Small skirmish</button>
<button type="button" class="kod-widget__btn" data-tab="battle" aria-pressed="true">Battle</button>
</div>
<div class="kod-widget__panel" data-panel-id="tiny" hidden>
<p><strong>Tiny skirmish</strong> — equal footing <strong>1</strong> / <strong>20</strong>. There is no narrower good band. Slight and severe do not shrink the faces further.</p>
<p>Slight or severe, A disadvantaged: <strong>1</strong> / <strong>20</strong>.</p>
<p>Slight or severe, B disadvantaged: <strong>1</strong> / <strong>20</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="small" hidden>
<p><strong>Small skirmish</strong> — equal footing <strong>1–2</strong> / <strong>19–20</strong>.</p>
<p>Slight, A disadvantaged: <strong>1–2</strong> / <strong>20</strong> (good band from Tiny skirmish).</p>
<p>Slight, B disadvantaged: <strong>1</strong> / <strong>19–20</strong>.</p>
<p>Severe, A disadvantaged: <strong>1–2</strong> / <strong>20</strong> (floor — one face).</p>
<p>Severe, B disadvantaged: <strong>1</strong> / <strong>19–20</strong> (floor).</p>
</div>
<div class="kod-widget__panel" data-panel-id="battle">
<p><strong>Battle</strong> — equal footing <strong>1–3</strong> / <strong>18–20</strong>.</p>
<p>Slight, A disadvantaged: <strong>1–3</strong> / <strong>19–20</strong>.</p>
<p>Slight, B disadvantaged: <strong>1–2</strong> / <strong>18–20</strong>.</p>
<p>Severe, A disadvantaged: <strong>1–3</strong> / <strong>20</strong> only.</p>
<p>Severe, B disadvantaged: <strong>1</strong> only / <strong>18–20</strong>.</p>
</div>
</div>

----------

## Interactive example — two PCs on the imperial road

| | |
|--|--|
| **Zhao** (PC) | Mounted sergeant of the outriders |
| **Wei** (PC) | Bodyguard of the Emperor |
| **Tide** | Imperial weight **6** · Mongol weight **12** · track **17** · start **6** · **Battle** (3 Marks per step) |
| **Colours** | **Crimson** imperial footing · **Teal** Mongol pressure |
| **Tide Omens** | Against column **1–3** · for column **20** only (severe imbalance, Battle) |
| **Scene faces** | **4** = ambush in the left dry wash (scene only) · **13** = Negative Consequence · **1** = ring closes, surrender (also Tide-negative) |

Only **people** roll. When a roll is Tide-linked, its Marks margin (and sometimes Omen) moves the bar. Step through.

<div class="kod-widget not-content" data-widget="tide-demo" aria-label="Tide interactive example">
<p class="kod-widget__title">Tide demo — the Emperor’s column</p>
<p class="kod-widget__intro">Zhao and Wei under horse-archer harassment. Crimson shrinks as the column fails. Saving the Emperor is a personal objective.</p>

<div class="kod-tide" data-tide-visual>
  <div class="kod-tide__labels">
    <span class="kod-tide__label kod-tide__label--a">Imperial collapse ←</span>
    <span class="kod-tide__label kod-tide__label--b">→ Mongol collapse</span>
  </div>
  <div class="kod-tide__rail">
    <div class="kod-tide__track" role="img" aria-label="Tide track">
      <div class="kod-tide__fill kod-tide__fill--a" data-tide-fill-a></div>
      <div class="kod-tide__fill kod-tide__fill--b" data-tide-fill-b></div>
    </div>
    <div class="kod-tide__marker" data-tide-marker aria-hidden="true">
      <span class="kod-tide__marker-head"></span>
      <span class="kod-tide__marker-stem"></span>
      <span class="kod-tide__marker-foot"></span>
    </div>
  </div>
  <p class="kod-tide__readout" data-tide-readout></p>
</div>

<p class="kod-step-flow__label" data-step-label></p>
<div class="kod-step-flow__track" role="group" aria-label="Tide demo steps">
<button type="button" class="kod-widget__btn" data-tab="t1" aria-pressed="true">1</button>
<button type="button" class="kod-widget__btn" data-tab="t2">2</button>
<button type="button" class="kod-widget__btn" data-tab="t3">3</button>
<button type="button" class="kod-widget__btn" data-tab="t4">4</button>
<button type="button" class="kod-widget__btn" data-tab="t5">5</button>
<button type="button" class="kod-widget__btn" data-tab="t6">6</button>
<button type="button" class="kod-widget__btn" data-tab="t7">7</button>
<button type="button" class="kod-widget__btn" data-tab="t8">8</button>
</div>

<div class="kod-widget__panel" data-panel-id="t1" data-step-title="Open the Tide" data-tide-pos="6" data-tide-note="Position 6 / 17. Column opens at a disadvantage.">
<p>Noon on the steppe road. Dust ahead. Zhao’s outriders report horse-archers who stay out of reach and shoot. Wei rides at the Emperor’s litter.</p>
<p class="kod-tide-line"><strong>Setup</strong> — Track 17, start 6. Battle. Tide Omens against the column: 1–3; for the column: 20 only.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t2" data-step-title="False retreat" data-tide-pos="5" data-tide-note="Margin 4 → 1 step. 6 → 5." hidden>
<p>Half the horse-archers break and flee. Zhao’s young riders start to chase.</p>
<p class="kod-tide-line"><strong>Zhao — Tide-linked</strong> · Stop the pursuit before it opens a gap in the line.</p>
<table>
<thead><tr><th></th><th>Roll</th><th>Marks</th></tr></thead>
<tbody>
<tr><td>Zhao</td><td>Authority + Command, <strong>d6</strong></td><td><strong>2</strong></td></tr>
<tr><td>Enemy commander (reply)</td><td>Intellect + Tactics, <strong>d12</strong></td><td><strong>6</strong></td></tr>
<tr><td>Margin</td><td>4 → floor(4÷3)</td><td><strong>1</strong> step against the column</td></tr>
<tr><td>Omen</td><td>11</td><td>—</td></tr>
<tr><td>Tide</td><td></td><td><strong>6 → 5</strong></td></tr>
</tbody>
</table>
<p>Most of the troop holds. Two riders still chase into the dust.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t3" data-step-title="Arrow storm" data-tide-pos="4" data-tide-note="Margin 3 → 1 step. 5 → 4." hidden>
<p>Arrows hit the baggage and the left ranks. Wei puts his horse against the litter wheel and raises his shield over the Emperor.</p>
<p class="kod-tide-line"><strong>Wei — Tide-linked</strong> · Keep the litter from bolting under the first volley.</p>
<table>
<thead><tr><th></th><th>Roll</th><th>Marks</th></tr></thead>
<tbody>
<tr><td>Wei</td><td>Resolve + Deflection, <strong>d8</strong></td><td><strong>3</strong></td></tr>
<tr><td>Horse-archer (reply)</td><td>Perception + Archery, <strong>d12</strong></td><td><strong>6</strong></td></tr>
<tr><td>Margin</td><td>3 → floor(3÷3)</td><td><strong>1</strong> step</td></tr>
<tr><td>Omen</td><td>9</td><td>—</td></tr>
<tr><td>Tide</td><td></td><td><strong>5 → 4</strong></td></tr>
</tbody>
</table>
<p>The Emperor is unhit. A standard-bearer falls.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t4" data-step-title="Consequence" data-tide-pos="3" data-tide-note="Margin 3 → 1 step (4→3). Omen 13: horse killed under Zhao." hidden>
<p>Zhao rides to close a gap. A shaft takes his horse in the neck.</p>
<p class="kod-tide-line"><strong>Zhao — Tide-linked</strong> · Re-form the outriders into a screen.</p>
<table>
<thead><tr><th></th><th>Roll</th><th>Marks</th></tr></thead>
<tbody>
<tr><td>Zhao</td><td>Authority + Riding, <strong>d6</strong></td><td><strong>1</strong></td></tr>
<tr><td>Horse-archer (reply)</td><td>Perception + Archery, <strong>d12</strong></td><td><strong>4</strong></td></tr>
<tr><td>Margin</td><td>3 → floor(3÷3)</td><td><strong>1</strong> step</td></tr>
<tr><td>Omen</td><td><strong>13</strong></td><td>Negative Consequence: horse dies; Zhao is thrown; <strong>Bleeding 1</strong></td></tr>
<tr><td>Tide</td><td></td><td><strong>4 → 3</strong></td></tr>
</tbody>
</table>
<p>The Consequence hits Zhao’s body. It does not rewrite the Marks. The bar already moved from the margin.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t5" data-step-title="Ambush" data-tide-pos="2" data-tide-note="Margin 3 → 1 step (3→2). Omen 4: scene face only (not in 1–3 Tide band)." hidden>
<p>On the ground, Zhao sees riders where the scrub should be empty — hidden in the left dry wash. He shouts a warning.</p>
<p class="kod-tide-line"><strong>Zhao — Tide-linked</strong> · Warn the column and turn it toward the wash.</p>
<table>
<thead><tr><th></th><th>Roll</th><th>Marks</th></tr></thead>
<tbody>
<tr><td>Zhao</td><td>Perception + Combat Awareness, <strong>d8</strong></td><td><strong>2</strong></td></tr>
<tr><td>Hidden archer (reply)</td><td>Guile + Ambush &amp; Camouflage, <strong>d12</strong></td><td><strong>5</strong></td></tr>
<tr><td>Margin</td><td>3 → floor(3÷3)</td><td><strong>1</strong> step · Tide <strong>3 → 2</strong></td></tr>
<tr><td>Omen</td><td><strong>4</strong></td><td>Scene face: <em>riders in the left dry wash</em> · not a Tide Omen (against-column band is 1–3)</td></tr>
</tbody>
</table>
<p>The ambush springs. The scene face opens the wash; the margin already moved the bar.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t6" data-step-title="Zhao’s stand" data-tide-pos="2" data-tide-note="Local fight. Tide stays at 2." hidden>
<p>Zhao seizes a riderless horse and meets the first men out of the wash. This is a local fight at the edge of the gully — not a push for the whole column.</p>
<p class="kod-tide-line"><strong>Zhao — personal</strong> · Hold the edge of the wash long enough for others to move.</p>
<table>
<thead><tr><th></th><th>Roll</th><th>Marks</th></tr></thead>
<tbody>
<tr><td>Zhao</td><td>Strength + Slash, <strong>d6</strong></td><td><strong>3</strong></td></tr>
<tr><td>Flank leader (reply)</td><td>Strength + Slash, <strong>d12</strong></td><td><strong>4</strong></td></tr>
<tr><td>Margin</td><td>1</td><td>Forced back a horse-length; still standing</td></tr>
<tr><td>Omen</td><td>16</td><td>—</td></tr>
<tr><td>Tide</td><td></td><td><strong>stays 2</strong></td></tr>
</tbody>
</table>
</div>

<div class="kod-widget__panel" data-panel-id="t7" data-step-title="Wei takes the Emperor" data-tide-pos="2" data-tide-note="Personal extraction. Tide stays at 2." hidden>
<p>Wei does not try to win the battle. He cuts the litter straps, hauls the Emperor onto his saddle, and turns for the south road.</p>
<p class="kod-tide-line"><strong>Wei — personal</strong> · Get the Emperor off this field alive.</p>
<table>
<thead><tr><th></th><th>Roll</th><th>Marks</th></tr></thead>
<tbody>
<tr><td>Wei</td><td>Authority + Riding, <strong>d8</strong> (Advantage)</td><td><strong>5</strong></td></tr>
<tr><td>Enemy commander (reply)</td><td>Intellect + Strategy, <strong>d8</strong></td><td><strong>2</strong></td></tr>
<tr><td>Margin</td><td>3</td><td>Emperor mounted; two household guards cling on</td></tr>
<tr><td>Omen</td><td>12</td><td>—</td></tr>
<tr><td>Tide</td><td></td><td><strong>stays 2</strong></td></tr>
</tbody>
</table>
<p>Zhao hears the shout for the south road. The enemy commander is too late to block the escape.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t8" data-step-title="Surrounded" data-tide-pos="0" data-tide-note="Margin 4 → 1 step (2→1). Omen 1 Tide-negative (1→0) + multi Harm + surrender face. Zhao accepts captivity (narrative)." hidden>
<p>Riders from the wash close around Zhao. He tries to cut a path south, toward Wei.</p>
<p class="kod-tide-line"><strong>Zhao — Tide-linked</strong> · Break the ring and ride free.</p>
<table>
<thead><tr><th></th><th>Roll</th><th>Marks</th></tr></thead>
<tbody>
<tr><td>Zhao</td><td>Strength + Slash, <strong>d6</strong></td><td><strong>1</strong></td></tr>
<tr><td>Surrounding riders (reply)</td><td>Strength + Slash, <strong>d12</strong></td><td><strong>5</strong></td></tr>
<tr><td>Margin</td><td>4 → floor(4÷3)</td><td><strong>1</strong> step · Tide <strong>2 → 1</strong></td></tr>
<tr><td>Omen</td><td><strong>1</strong></td><td>Tide-negative (in 1–3) · Tide <strong>1 → 0</strong> · Negative Consequence: <strong>Bleeding 2</strong>, <strong>Crushed 1</strong> · face: <em>surrounded, blades at his throat, ordered to drop his weapon</em></td></tr>
</tbody>
</table>
<p>Spears box him in. A commander’s voice offers life for surrender. Zhao does not want to die. He drops the blade — no roll; he is taken captive.</p>
<p>The column routes. Wei still has a horse, the Emperor, and the south road.</p>
</div>

<div class="kod-step-flow__nav">
<button type="button" data-step-prev>← Back</button>
<button type="button" data-step-next>Next →</button>
</div>
</div>

### Routing

When the Tide reaches one end, that collective side **routes**. Morale breaks. The group crumbles or flees. Individuals may still stand, refuse, die heroically or foolishly, complete a personal objective, or take a major setback — the Tide breaks **collective** will, not personal agency.

<aside class="kod-counsel" aria-label="Counsel">
<p>You can do everything in your power; if the rest of your side is butchered, you will still find yourself flanked. Do not grind roll-battles for their own sake. Load Omen faces that matter. Let players leave the Tide when fiction allows (loot, disengage, save the principal, personal objective).</p>
</aside>

Related: [Dice Mechanics](/dice-mechanics/), [Marks & Tiers](/marks-and-tiers/), [Omens](/omens/), [Harm](/harm/).

----------
