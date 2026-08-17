---
title: Dice Mechanics
description: When to roll, dice pools, Marks, Advantage and Disadvantage, Omen, and the Tide.
---

> _*Wyrd oft nereð unfægne eorl, þonne his ellen dēah.*_  
> _*“Fate often spares the hero not fated to die, when his courage holds.”*_  
> — *Beowulf*

----------

Similar to other TTRPGs, action resolution uses dice. When a **player** or **Storyteller** needs to resolve an action, they settle intent, then throw the appropriate dice. Very standard — *so far*.

This chapter walks the stack in order: **when** to roll → **what** dice mean → **how** context sets the tier (Advantage / Disadvantage) → **how large** the pool is → Omen and Tide for the moments that outgrow a single throw.

<div class="kod-lanes not-content">
<div class="kod-lane kod-lane--player">
<p class="kod-lane__title">Player</p>
<p>Describe intent. Spend <span class="kod-term" data-tip="Spendable pool for extra dice; also fatigue, hunger, thirst.">Exertion</span> if you push. Read Marks as the Storyteller narrates them — not a hidden target number.</p>
</div>
<div class="kod-lane kod-lane--st">
<p class="kod-lane__title">Storyteller</p>
<p>Name Foundation + Skill (or Primitive), declare die tier, interpret Marks and margins. No secret difficulty number to “clear.”</p>
</div>
</div>

----------

## When to roll

If an action’s outcome can **significantly differ** because of luck, chance, or skill — the Storyteller **can** ask for a roll, picking the relevant characteristics to base it on. If the fiction is already clear, **do not roll**. Conversation, planning, and role-play are not replaced by dice.

The Storyteller always chooses which [Foundation](/foundations/) and (if any) [Skill](/skills/) fit the described intent, and which **die tier** the pool uses — that tier is the mechanical face of **[Advantage and Disadvantage](#advantage-and-disadvantage)**.

----------

## Dice Types and Pools

Kodranni uses **three** action dice. A given roll uses **only one** type for the whole pool — pure **d6**, **d8**, or **d12** (plus the separate [Omen](#the-omen-die-and-consequences) **d20**).

<div class="kod-die-row not-content" aria-label="The three action dice">
<div class="kod-die-card kod-die-card--d6">
<span class="kod-die kod-die--d6 kod-die--lg" data-die="d6" aria-hidden="true"></span>
<p class="kod-die-card__name">d6</p>
<p class="kod-die-card__role">Harder · Disadvantage</p>
<p class="kod-die-card__meta">6-sided · Mark on 5–6 · ~33%</p>
</div>
<div class="kod-die-card kod-die-card--d8">
<span class="kod-die kod-die--d8 kod-die--lg" data-die="d8" aria-hidden="true"></span>
<p class="kod-die-card__name">d8</p>
<p class="kod-die-card__role">Ordinary · default</p>
<p class="kod-die-card__meta">8-sided · Mark on 5–8 · ~50%</p>
</div>
<div class="kod-die-card kod-die-card--d12">
<span class="kod-die kod-die--d12 kod-die--lg" data-die="d12" aria-hidden="true"></span>
<p class="kod-die-card__name">d12</p>
<p class="kod-die-card__role">Easier · Advantage</p>
<p class="kod-die-card__meta">12-sided · Mark on 5–12 · ~67%</p>
</div>
</div>

These three are the **die tiers**. Context does not add modifiers to Marks — it moves you up or down this ladder (see [Advantage and Disadvantage](#advantage-and-disadvantage)).

----------

## Marks of Success

Any die that lands on **5 or higher** is a <span class="kod-term" data-tip="Any die face of 5 or higher. Count of Marks is information the Storyteller interprets — not a pass/fail target.">**Mark of Success**</span>, or simply a **Mark**. Higher tiers make Marks more common; they do not change the “5 or higher” rule.

| Die | Faces that Mark | P(Mark) |
|-----|-----------------|---------|
| **d6** | 5–6 | ~33% |
| **d8** | 5–8 | ~50% |
| **d12** | 5–12 | ~67% |

### Target numbers vs Marks — a change of mindset

Most systems ask: *did you hit the number?* Pass or fail. The Storyteller holds a hidden threshold; the table waits for a binary answer.

**Kodranni’s resolution is interpretational.** You do not keep **strict margins** for a binary succeed/fail decision. Marks are **information** — how much of the intent landed, how cleanly, how deep the reading goes. The Storyteller decides **incremental results** from the count of Marks (and, in opposed rolls, from the **margin** between two counts). There is no single secret target the player is trying to “clear.”

That requires a shift: less “did it work?”, more “**what does this many Marks tell us about how it went?**” Zero Marks is still a result with colour. Four Marks is not merely “better pass” — it may open facts a thinner success would never have revealed.

Players act under incomplete knowledge. The Storyteller scales reward, cost, and **what the fiction discloses** to the Marks on the table.

<figure class="kod-breath not-content">
<img src="/scenes/scout-night.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

<div class="kod-widget not-content" data-widget="marks-ladder">
<p class="kod-widget__title">Scenario: The Scout</p>
<p class="kod-widget__intro"><strong>Scene:</strong> A young warrior is sent at night to observe an enemy camp. As he draws close, the Storyteller calls for Perception + Scouting — a pool of 4 dice. There is no hidden target number. Depending on how many Marks he rolls:</p>
<div class="kod-widget__controls" role="group" aria-label="Marks of Success">
<button type="button" class="kod-widget__btn" data-marks="0">0</button>
<button type="button" class="kod-widget__btn" data-marks="1">1</button>
<button type="button" class="kod-widget__btn" data-marks="2">2</button>
<button type="button" class="kod-widget__btn" data-marks="3">3</button>
<button type="button" class="kod-widget__btn" data-marks="4">4</button>
</div>
<div class="kod-widget__panel" data-panel></div>
</div>

<aside class="kod-counsel" aria-label="Counsel">
<p><em>Do not</em> pre-assign arbitrary success margins and targets. If possible, decide on a few <em>possible</em> outcome tiers, then let the dice pick which one lands. Opposed rolls use the same idea: the <strong>margin</strong> is how far one side overcame the other.</p>
</aside>

----------

## Advantage and Disadvantage

Context that affects a roll is often **innumerable** — weather, footing, numbers, tools, reputation, injury, surprise, a Trait that fits or hurts. Stacking those as pluses and minuses becomes bookkeeping. Kodranni refuses that path.

**Judge the edge once. Encode it as the die type.**

The Storyteller names a **die tier** for the pool. There is no automatic map from Skill rating to d6 / d8 / d12.

<div class="kod-widget not-content" data-widget="tier-dial">
<p class="kod-widget__title">Die tier ladder</p>
<p class="kod-widget__intro">One judgment: who has the edge on <em>this</em> action? Select a tier to see odds and an example.</p>
<div class="kod-tier-ladder" data-active="d8" aria-hidden="true">
<span class="kod-tier-ladder__end" data-ladder="d6">Harder</span>
<span class="kod-tier-ladder__arrow" data-ladder="d6">← Disadvantage</span>
<span class="kod-tier-ladder__mid" data-ladder="d8">Ordinary</span>
<span class="kod-tier-ladder__arrow" data-ladder="d12">Advantage →</span>
<span class="kod-tier-ladder__end" data-ladder="d12">Easier</span>
</div>
<div class="kod-widget__controls" role="group" aria-label="Die tier">
<button type="button" class="kod-widget__btn kod-widget__btn--die" data-tier="d6"><span class="kod-die kod-die--d6" data-die="d6" aria-hidden="true"></span><span>d6</span></button>
<button type="button" class="kod-widget__btn kod-widget__btn--die" data-tier="d8" aria-pressed="true"><span class="kod-die kod-die--d8" data-die="d8" aria-hidden="true"></span><span>d8</span></button>
<button type="button" class="kod-widget__btn kod-widget__btn--die" data-tier="d12"><span class="kod-die kod-die--d12" data-die="d12" aria-hidden="true"></span><span>d12</span></button>
</div>
<div class="kod-widget__panel" data-panel></div>
</div>

| | |
|--|--|
| **Default** | **d8** — competent attempt, nothing special pressing the odds |
| **Advantage** | Upgrade **one step** (d6→d8, or d8→d12) |
| **Disadvantage** | Downgrade **one step** (d12→d8, or d8→d6) |
| **Who decides** | The **Storyteller**, every roll |
| **Stacking** | How hard fiction pushes, whether edges cancel or climb two steps — ST call for that moment |

[Traits](/traits/), terrain, numbers, armour-as-context, and reputation feed the judgment. They are **not** extra modifiers on Marks. You do not add “+2 for height and +1 for cover.”

In multi-party messes, **each action still stands alone**. Read Advantage and Disadvantage from **that** action’s context — not an average of the field. Collective pressure lives on the [Tide](#the-tide).

----------

## The Makeup of the Dice Pool

Pools assemble from three sources:

| Source | Range | Role |
|--------|-------|------|
| **[Foundation](/foundations/)** | typically 1–3 (effective value after [Harm](/harm/)) | Inborn potential; nearly static |
| **[Skill](/skills/)** | 0–3 | Practiced ability matching intent |
| **[Exertion](/exertion/)** | 0–1 dice (2 with matching [Echo](/echoes/#invocation)) | Optional player spend |

**Pool size** = Foundation + Skill + optional Exertion dice  

**Primitive actions** (run, jump, haul, see, recall, composure, and similar animal-tier acts) use **Foundation only** (+ optional Exertion). No Skill die is added. Primitive rolls grant **no [Practice](/skills/#improvement)**.

<aside class="kod-counsel" aria-label="Counsel">
<p>Who decides <em>which</em> Foundation and <em>which</em> Skill? <strong>The Storyteller.</strong> Always. The player describes intent freely. The Storyteller picks the best pair. Players may propose a better pair; the Storyteller’s call is final.</p>
</aside>

<aside class="kod-example" aria-label="Example">
<p class="kod-example__scene">The roof of the grain store is leaking into the seed barley. Tomas is a capable carpenter. He has dry planks and pitch; the weather is fair; nothing special about the job. Ordinary tier.</p>
<ol class="kod-example__steps">
<li><strong>Intent:</strong> patch the store roof before the next rain.</li>
<li><strong>Storyteller names:</strong> Strength + Carpentry &amp; Masonry, <strong>d8</strong>.</li>
<li><strong>Pool:</strong> Foundation 2 + Skill 2 = <strong>4d8</strong> (+ Omen d20).</li>
<li><strong>Result:</strong> 2 Marks — the leak is stopped for the season; not fine work, not a rebuild.</li>
<li><strong>Practice:</strong> only if he spent <a href="/exertion/">Exertion</a> (see <a href="/skills/#improvement">Skills</a>).</li>
</ol>
</aside>

Additional effects that **shrink pools** (these are not die-tier shifts; they change **how many** dice you throw):

- Empty Exertion: **–2** dice (floor 1) — see [Exertion](/exertion/)  
- [Decadence](/echoes/#weight-and-capacity) (no Echoes): **–1** die on every roll  
- Over-capacity Echoes: **–1** die on rolls that involve any of the character’s Echoes  

----------

> *“I returned, and saw under the sun, that the race is not to the swift, nor the battle to the strong, neither yet bread to the wise, nor yet riches to men of understanding, nor yet favour to men of skill; but time and chance happeneth to them all.”*  
> — Ecclesiastes 9:11

----------

## The Omen Die and Consequences

**Every roll** includes one extra die: the **Omen** die — a **d20**. It is independent of Marks, Traits, and Exertion. It never changes the primary success reading. It may introduce a side event: a **Consequence**.

| Face | Default |
|------|---------|
| **7** | Positive Consequence |
| **13** | Negative Consequence |
| Other | Blank, **or** pre-assigned by the Storyteller for the scene |

Storyteller-assigned faces can mean a sudden arrival, structural failure, weather shift, infection, and the like. Assignments are set and cleared through [automation](/automation/).

When a Consequence fires, the Storyteller interprets it. Constraint: it must remain a **side-effect** — it cannot rewrite the primary outcome of the roll it rode on.

In multi-party contests, Omens also feed **[The Tide](#the-tide)**.

----------

## Situational Dice Resolution

| Mode | When | Reading |
|------|------|---------|
| **Primitive** | Animal-tier action | Foundation-only pool; Marks give incremental benefit; no Practice |
| **Unopposed** | No opposing character | Full pool; Marks give incremental benefit |
| **Opposed** | Wills collide (1v1 or many actors) | Full pools (pairs need not match); each action is resolved **individually**; compare **Marks difference** on the reply chain |
| **Tide** | Larger than clean 1v1 as a *collective* contest | Individual opposed resolutions also move a shared tracker |

Hints:

- Opposed rolls are handled as **replies** to a prior roll so automation can compute margins.
- In a 1vMany or ManyvMany mess, **each action still stands alone**. Advantage and Disadvantage are read from that action’s context — not averaged across the field.
- Treat intent and context when reading the margin: conditions, injuries, insight — all valid Storyteller levers.
- Social, mental, and physical contests use the **same** resolution shape.
- Armour, reputation, favours, numbers, and terrain are **context** for Advantage / Disadvantage and for interpreting the margin — not separate subsystems — except where [Harm](/harm/) uses armour **or** Reputation **protection ratios** (not both on the same event; the Storyteller picks the contest type).

<aside class="kod-example" aria-label="Example">
<p class="kod-example__scene">A landowner has barred his hall after dark. A traveller must get a sick child to the healer who lives within. Not a fight — will and words. The landowner has the door and his household; the traveller has a clear errand and a steady voice. Neither side holds clear Advantage. Ordinary tier for both.</p>
<ol class="kod-example__steps">
<li><strong>Intent:</strong> persuade the landowner to open the hall.</li>
<li><strong>Player:</strong> Charisma + Negotiation, <strong>d8</strong> → 3 Marks.</li>
<li><strong>Reply (landowner):</strong> Resolve + Insight, <strong>d8</strong> → 1 Mark. (Pairs need not match.)</li>
<li><strong>Margin:</strong> 3 − 1 = <strong>2</strong> for the player.</li>
<li><strong>Outcome:</strong> the door opens; the landowner is convinced, not humiliated. <a href="/harm/">Harm</a> only if the Storyteller later rules lasting damage to standing or body.</li>
</ol>
</aside>

<aside class="kod-counsel" aria-label="Counsel">
<p><strong>Focus on the roleplay, not the roll-play.</strong> Dice outcomes should <strong>never</strong> replace conversations, decisions, and planning. Rolls inform the <strong>effect</strong> of an action, never its content.</p>
</aside>

----------

> _*“In battle, momentum means riding on the force of the tide of events.”*_  
> — Sun Tzu

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

### Shifting by Marks

On a Tide-linked opposed exchange, take the **Marks difference** (margin). Steps moved = `floor(margin ÷ Marks needed)`. Direction: toward the winner of that exchange.

| Skirmish size | Marks difference per Tide step |
|---------------|--------------------------------|
| Tiny skirmish | 1 |
| Small skirmish | 2 |
| Battle | 3 |
| Large battle | Only Omen results shift the Tide |

### Omens on the Tide

Omens on Tide-linked actions also move the marker. Direction depends on which end of the track a face pushes toward.

On **equal footing** (battle size as the middle row):

| Skirmish size | Faces toward side A collapse | Faces toward side B collapse |
|---------------|------------------------------|------------------------------|
| Tiny skirmish | **1** | **20** |
| Small skirmish | **1–2** | **19–20** |
| Battle | **1–3** | **18–20** |

**Imbalance** adjusts those bands for the side under pressure — not personal Advantage on a single roll (that is still judged case by case). A side under **severe** collective disadvantage (weight gap like the d6-versus-d12 case) keeps the skirmish-size **bad** band for its end, and compresses the **good** band by **two full levels** on the table above.

Worked example — **battle**, imperial weight 6 vs Mongol 12 (imperial severe disadvantage):

| | Faces |
|--|-------|
| Against the imperial column (toward imperial collapse) | **1–3** |
| For the imperial column (toward Mongol collapse) | **20** only |

(If the Mongols were the ones under severe disadvantage, the bands would mirror: bad for them **18–20**, good for them **1** only.)

### Interactive example — two PCs on the imperial road

| | |
|--|--|
| **Zhao** (PC) | Mounted sergeant of the outriders |
| **Wei** (PC) | Bodyguard of the Emperor |
| **Tide** | Imperial weight **6** · Mongol weight **12** · track **17** · start **6** · **battle** (3 Marks per step) |
| **Colours** | **Crimson** imperial footing · **Teal** Mongol pressure |
| **Tide Omens** | Against column **1–3** · for column **20** only (severe imbalance, battle) |
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
<p class="kod-tide-line"><strong>Setup</strong> — Track 17, start 6. Battle size. Tide Omens against the column: 1–3; for the column: 20 only.</p>
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

Related: [Human Potential](/human-potential/), [Harm](/harm/), [Echoes](/echoes/), [Automation](/automation/).

----------
