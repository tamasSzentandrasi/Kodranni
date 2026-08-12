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

Kodranni uses **three** action dice:

| Die | Shorthand |
|-----|-----------|
| 6-sided | **d6** |
| 8-sided | **d8** |
| 12-sided | **d12** |

A given roll uses **only one** of these types — a pure d6, d8, or d12 pool (plus the separate [Omen](#the-omen-die-and-consequences) die).

----------

## Marks of Success

Any die that lands on **5 or higher** is a <span class="kod-term" data-tip="Any die face of 5 or higher. Count of Marks is information the Storyteller interprets — not a pass/fail target.">**Mark of Success**</span>, or simply a **Mark**.

Approximate chance a single die is a Mark:

| Die | P(Mark) |
|-----|---------|
| **d6** | ~33% |
| **d8** | ~50% |
| **d12** | ~66% |

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
<p class="kod-widget__intro"><strong>Scene:</strong> A young warrior is sent at night to observe an enemy camp. As he draws close, the Storyteller calls for Perception + Scouting — a pool of 4 dice. There is no hidden target number. If he rolls:</p>
<div class="kod-widget__controls" role="group" aria-label="Marks of Success">
<button type="button" class="kod-widget__btn" data-marks="0">0 Marks</button>
<button type="button" class="kod-widget__btn" data-marks="1">1 Mark</button>
<button type="button" class="kod-widget__btn" data-marks="2">2 Marks</button>
<button type="button" class="kod-widget__btn" data-marks="3">3 Marks</button>
<button type="button" class="kod-widget__btn" data-marks="4">4 Marks</button>
</div>
<div class="kod-widget__panel" data-panel></div>
</div>

<aside class="kod-counsel" aria-label="Counsel">
<p><em>Do not</em> pre-assign arbitrary success margins and targets. If possible, decide on a few <em>possible</em> outcome tiers, then let the dice pick which one lands. Opposed rolls use the same idea: the <strong>margin</strong> is how far one side overcame the other.</p>
</aside>

----------

## Advantage and Disadvantage

In any situation, factors that influence the odds of an action are often **innumerable**: weather, footing, numbers, tools, reputation, injuries, surprise, fatigue, favour, arms & armour, a trait that fits the moment, a tradition that gives an edge. Stacking those as discrete modifiers produces bookkeeping and heavy mechanics. Kodranni refuses that path.

Instead: in most cases it is **fairly easy to assess which side has the advantage**. That single judgment is enough. The system encodes it by shifting the **die tier** of the pool — not by piling pluses and minuses onto Marks.

**Different dice types are Advantage and Disadvantage.** They fold context into the roll without a modifier ledger.

- **Advantage** — favourable situations (beneficial terrain, superior knowledge, support, numbers, tools, a Trait that truly applies). The die tier **upgrades** one step (for example **d8 → d12**).  
  Example: a **trained hunter** who would normally roll **d8** tracks wounded prey with hounds → **d12**.
- **Disadvantage** — challenging circumstances (poor weather, hostile ground, being surrounded, darkness, wrong tools, a Trait that hurts). The die tier **downgrades** one step (for example **d8 → d6**).  
  Example: a **veteran soldier** who would otherwise roll **d8** is surrounded on multiple sides → **d6**.

<div class="kod-widget not-content" data-widget="tier-dial">
<p class="kod-widget__title">Die tier</p>
<p class="kod-widget__intro">The Storyteller names the tier for the roll. Select one:</p>
<div class="kod-widget__controls" role="group" aria-label="Die tier">
<button type="button" class="kod-widget__btn" data-tier="d6">d6</button>
<button type="button" class="kod-widget__btn" data-tier="d8">d8</button>
<button type="button" class="kod-widget__btn" data-tier="d12">d12</button>
</div>
<div class="kod-widget__panel" data-panel></div>
</div>

[Traits](/traits/), terrain, numbers, reputation, weather, and armour-as-context all feed this judgment. They are **not** extra mechanical layers stacked on top of Marks. You do not add “+2 for height and +1 for cover”; you decide who has the **Advantage**, and you change the die.

### Declaring the tier

There is **no automatic map** from Skill rating to d6 / d8 / d12. The **Storyteller declares** the die tier for each roll.

- **Safe default:** treat **d8** as the ordinary tier for a competent attempt when nothing special presses the odds.
- From that baseline — or from any other tier the Storyteller names — **Advantage** upgrades and **Disadvantage** downgrades.

**Stacking:** Whether several Advantages climb more than one step, whether Advantage and Disadvantage cancel, and how hard the fiction pushes the tier is the **Storyteller’s call** for that moment.

In multi-party messes, **each action still stands alone**. Advantage and Disadvantage are read from **that** action’s context — not averaged across the field. The [Tide](#the-tide) holds collective pressure separately.

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

**Every roll** includes one extra die: the **Omen** die — a **d20**, independent of Marks, Traits, and Exertion. It never changes the primary success reading. It may introduce a side event: a **Consequence**.

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

The Tide is a **shared** progress tracker when a contest is larger than a clean 1v1 — a skirmish, a running fight, a hall-wide debate, a pursuit through hostile ground.

### Setup

The Tide is framed by the **general** Advantage / Disadvantage of the whole contest (not each individual blow). Both sides share **one** scale; the **position** of a marker is what they push.

**How to read the examples:** each side is given a “weight” number (higher = more favourable footing for that side).  

- **Scale length** = weight_A + weight_B − 1  
- **Starting position** = weight of the side you treat as the reference “home” end (commonly the players’ side), counted from that end  

| Situation | Weights | Scale | Start (from side A) |
|-----------|---------|-------|---------------------|
| Equal footing | 8 vs 8 | 15 | 8 |
| Slight advantage (A) | 8 vs 6 | 13 | 8 |
| A clearly superior | 8 vs 12 | 19 | 8 |
| A severe disadvantage | 6 vs 12 | 17 | 6 |

(The last row starts at 6 because side A’s weight is 6 — they begin closer to collapse.)

### Shifting by Marks

How many Marks of difference are required to move the Tide one point depends on scale:

| Scale | Marks difference per Tide point |
|-------|----------------------------------|
| Tiny skirmish | 1 |
| Small skirmish | 2 |
| Battle | 3 |
| Large battle | Only Omen results shift the Tide |

### Omens on the Tide

Omens on Tide-linked actions also move it. Threshold bands follow the same scale idea as Marks-difference requirements, then adjust for overall Advantage / Disadvantage.

On **equal footing**:

| Scale | Negative Omen faces | Positive Omen faces |
|-------|---------------------|---------------------|
| Tiny skirmish | 1 | 20 |
| Small skirmish | 1–2 | 19–20 |
| Battle | 1–3 | 18–20 |

Disadvantage lowers thresholds for the disadvantaged side (negative Omens more likely, positive less so). Severe disadvantage (the d6-versus-d12 equivalent) shifts thresholds by **two full levels**. Individual actions still get their own case-by-case Advantage; the macro adjustment applies only to Tide Omen thresholds.

<aside class="kod-example">
<p class="kod-example__scene">Raiders hit the mill yard at dusk. Two roughly matched bands — the mill households and the raiders. Equal footing, small-skirmish scale. One exchange is only a push on the shared Tide, not the whole fight.</p>
<ol class="kod-example__steps">
<li><strong>Setup:</strong> weights 8 vs 8 → scale 15, start 8. Shift every <strong>2</strong> Marks of difference on Tide-linked rolls.</li>
<li><strong>Player:</strong> barks the line into place — Authority + Command, d8 → 4 Marks.</li>
<li><strong>Reply (raider):</strong> tries to break their nerve — Resolve + Intimidate, d8 → 1 Mark.</li>
<li><strong>Tide:</strong> difference 3 → floor(3÷2) = <strong>1</strong> step toward the players. Position 8 → 9.</li>
<li><strong>Later:</strong> Omen 20 on a Tide-linked roll moves the Tide again (equal-footing small-skirmish band).</li>
<li><strong>End of scale:</strong> that <em>side</em> routes as a group. Individuals may still stand, flee, or die on their own terms.</li>
</ol>
</aside>

### Routing

When the Tide reaches one end, that collective side **routes**. Morale breaks. The group crumbles or flees. Individuals may still stand, refuse, die heroically or foolishly, or take a major personal setback — the Tide breaks **collective** will, not personal agency.

<aside class="kod-counsel" aria-label="Counsel">
<p>You can do everything in your power; if the rest of your side is butchered, you will still find yourself flanked. Do not grind roll-battles for their own sake. Load Omen faces that matter. Let players leave the Tide when fiction allows (loot, disengage, personal objective).</p>
</aside>

Related: [Human Potential](/human-potential/), [Harm](/harm/), [Echoes](/echoes/), [Automation](/automation/).

----------
