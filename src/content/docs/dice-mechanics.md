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

Omens on Tide-linked actions also move the marker. On **equal footing**:

| Skirmish size | Negative Omen faces | Positive Omen faces |
|---------------|---------------------|---------------------|
| Tiny skirmish | 1 | 20 |
| Small skirmish | 1–2 | 19–20 |
| Battle | 1–3 | 18–20 |

**Imbalance:** Disadvantage for a side lowers its thresholds (negative Omens more often, positive rarer). Severe disadvantage (the d6-versus-d12 equivalent) shifts Omen bands by **two full levels**. Personal Advantage on a single action is still judged case by case; the macro adjustment is for Tide Omen thresholds only.

### Interactive example — two PCs in a dying column

**Groups do not roll.** People do. The Tide only moves when an **individual’s** Tide-linked action (and its reply, margin, and Omen) is framed against the shared struggle.

**You play:**

| Character | Role |
|-----------|------|
| **Cassian** | Mounted sergeant of the outriders — keeps the flanks from dissolving into dust |
| **Liora** | Imperial bodyguard at the litter — keeps one old man breathing |

**The fight:** An imperial column on the dry steppe road. A Mongol horse-archer party works the classic pattern — bait, false retreat, volleys, then a hidden cut from the wash. **Crimson** = imperial collective footing. **Teal** = Mongol pressure. Weight **6 vs 12**, track **17**, start **6**, skirmish size **battle** (3 Marks per Tide step). Macro Disadvantage for the column on Tide Omens: negative faces **1–5**, positive only **20**.

**Preconfigured Omen faces (this scene):**

| Face | Kind | Meaning when it lands |
|------|------|------------------------|
| **1–5** | Tide negative (imbalance) | Shared bar moves against the column |
| **4** | *Also* scene face (ambush) | “Riders in the left dry wash” — the hidden flank is revealed in fiction |
| **13** | Negative Consequence | Side-effect only; does not rewrite Marks on that roll |
| **20** | Tide positive | Rare under this footing — bar would ease for the column |

Step through. The bar updates each beat.

<div class="kod-widget not-content" data-widget="tide-demo" aria-label="Tide interactive example">
<p class="kod-widget__title">Tide demo — dust on the imperial road</p>
<p class="kod-widget__intro">Two player characters. Individual rolls only. Marks margins and Omen landings both push the bar. Saving the emperor is not the same as winning the skirmish.</p>

<div class="kod-tide" data-tide-visual>
  <div class="kod-tide__labels">
    <span class="kod-tide__label kod-tide__label--a">Imperial collapse ←</span>
    <span class="kod-tide__label kod-tide__label--b">→ Mongol collapse</span>
  </div>
  <div class="kod-tide__track" role="img" aria-label="Tide track">
    <div class="kod-tide__fill kod-tide__fill--a" data-tide-fill-a></div>
    <div class="kod-tide__fill kod-tide__fill--b" data-tide-fill-b></div>
    <div class="kod-tide__marker" data-tide-marker></div>
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

<div class="kod-widget__panel" data-panel-id="t1" data-step-title="Dust and distance" data-tide-pos="6" data-tide-note="Position 6 of 17. Weight 6 vs 12 · battle: 3 Marks per step · Tide Omens 1–5 hurt the column.">
<p>Noon heat. Hooves far out on the grass. Cassian’s outriders report a thin line of bows that will not close. Liora rides knee-to-knee with the litter; the emperor is pale, still giving orders no one can obey at this range.</p>
<p>The Storyteller opens a Tide: the column is the weaker force. Crimson starts short. You do not roll for “the army.” You roll for <em>what Cassian does</em> and <em>what Liora does</em> — and when those acts are Tide-linked, the bar listens.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t2" data-step-title="Cassian holds the chase" data-tide-pos="5" data-tide-note="Cassian 2 Marks vs reply 6 → margin 4 → floor(4÷3) = 1 step against you. 6 → 5." hidden>
<p>Half the horse-archers break and run. Young riders in Cassian’s troop lean after them — the classic bait.</p>
<p><strong>Cassian</strong> cuts across their path, voice raw:</p>
<ul>
<li><strong>Intent (Tide-linked):</strong> stop the pursuit before the false retreat opens the wing.</li>
<li><strong>Cassian:</strong> Authority + Command, d6 (they already want blood and glory) → <strong>2 Marks</strong>.</li>
<li><strong>Reply (lead bait-rider):</strong> Charisma + Intimidate / Perception + Scouting as he wheels — d12 → <strong>6 Marks</strong>.</li>
<li><strong>Margin:</strong> 4 → floor(4÷3) = <strong>1</strong> Tide step against the column. Position <strong>6 → 5</strong>.</li>
<li><strong>Omen:</strong> 11 — no Consequence, no Tide Omen face. The bar moved only from Marks.</li>
</ul>
<p>Fiction: two lances still chase into the dust. Cassian has held most of them. The Tide still bled.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t3" data-step-title="Liora in the arrow-rain" data-tide-pos="4" data-tide-note="Liora 3 vs reply 6 → margin 3 → 1 step. 5 → 4. Omen 9 quiet." hidden>
<p>Arrows fall on the baggage and the left files. Someone screams among the mules. Liora forces her horse against the litter’s wheel, shield up for the emperor first.</p>
<ul>
<li><strong>Intent (Tide-linked):</strong> keep the centre from folding under the first real volley — the litter must not bolt.</li>
<li><strong>Liora:</strong> Constitution + Deflection, d8 → <strong>3 Marks</strong>.</li>
<li><strong>Reply (Mongol bow-hand on the near flank):</strong> Perception + Archery, d12 → <strong>6 Marks</strong>.</li>
<li><strong>Margin:</strong> 3 → floor(3÷3) = <strong>1</strong> step. Tide <strong>5 → 4</strong>.</li>
<li><strong>Omen:</strong> 9 — nothing special.</li>
</ul>
<p>The emperor is unhit. A standard-bearer is not. Crimson shrinks again.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t4" data-step-title="Consequence on Cassian" data-tide-pos="3" data-tide-note="Margin 3 → 1 step (4→3). Omen 13 is Negative Consequence only — horse killed under him; does not rewrite the Marks or double-move the Tide." hidden>
<p>Cassian spurs to plug a gap the volley opened. A shaft finds his mount’s neck mid-shout.</p>
<ul>
<li><strong>Intent (Tide-linked):</strong> re-form the outriders into a screen.</li>
<li><strong>Cassian:</strong> Dexterity + Ride, d6 → <strong>1 Mark</strong>.</li>
<li><strong>Reply:</strong> Perception + Archery, d12 → <strong>4 Marks</strong>.</li>
<li><strong>Margin:</strong> 3 → floor(3÷3) = <strong>1</strong> step. Tide <strong>4 → 3</strong>.</li>
<li><strong>Omen:</strong> <strong>13</strong> — <strong>Negative Consequence</strong> (side-effect only; cannot rewrite the Marks result). His horse goes down hard; he is thrown; take <strong>Bleeding 1</strong> or a temporary Ride/Footwork penalty as the Storyteller rules. The Tide already moved from the margin — the Consequence hits <em>Cassian</em>, not the bar a second time.</li>
</ul>
<p>He is on foot among panicked horses. The column has not broken yet. Something in him has.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t5" data-step-title="Ambush face" data-tide-pos="1" data-tide-note="Margin 3 → 1 step (3→2). Omen 4: preconfigured ambush face + Tide-negative band → another step (2→1)." hidden>
<p>On his knees in the dust, Cassian sees movement where the maps showed empty scrub — the left dry wash. He scrapes enough breath to shout.</p>
<ul>
<li><strong>Intent (Tide-linked):</strong> warn the line and buy a heartbeat of facing.</li>
<li><strong>Cassian:</strong> Perception + Combat Awareness, d8 (pain, dust) → <strong>2 Marks</strong>.</li>
<li><strong>Reply (concealed horse-archer rising from the wash):</strong> Guile + Stealth — d12 → <strong>5 Marks</strong>.</li>
<li><strong>Margin:</strong> 3 → <strong>1</strong> step. Tide <strong>3 → 2</strong>.</li>
<li><strong>Omen:</strong> <strong>4</strong> — in the Tide-negative band <em>and</em> the Storyteller’s preconfigured scene face: <strong>“Riders in the left dry wash.”</strong> The ambush is no longer hidden. As a Tide-negative Omen it also shifts the bar: <strong>2 → 1</strong>.</li>
</ul>
<p>Fiction and track move together: the flank is open; everyone can see why crimson is almost gone.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t6" data-step-title="Cassian’s last screen" data-tide-pos="1" data-tide-note="Personal / local fight on the wash lip — not framed as Tide-linked. Marker stays at 1. Cassian buys yards with blood." hidden>
<p>Cassian seizes a riderless mount and throws himself into the gap between the wash and the litter. The Storyteller frames this as a <strong>local</strong> fight for ground and breath — not a Tide-linked push of the whole column.</p>
<ul>
<li><strong>Intent:</strong> hold the lip of the wash long enough for anyone still thinking to look south.</li>
<li><strong>Cassian:</strong> Strength + Slash as he meets the first riders, d6 → <strong>3 Marks</strong>.</li>
<li><strong>Reply (flank leader):</strong> Strength + Slash, d12 → <strong>4 Marks</strong>.</li>
<li><strong>Margin:</strong> 1 — he is forced back a horse-length, still upright, still buying noise and time.</li>
<li><strong>Omen:</strong> 16 — no face.</li>
<li><strong>Tide:</strong> unchanged at <strong>1</strong>. This roll was never about the army’s will.</li>
</ul>
<p>Teal already owns the bar. Cassian owns a few more heartbeats of road.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t7" data-step-title="Liora takes the emperor" data-tide-pos="1" data-tide-note="Personal win. Tide stays at 1 — the objective was the man in the litter, not the army’s will." hidden>
<p>Liora does not try to win the field. She cuts the litter’s near straps, hauls the emperor onto her own saddle, and turns for the only gap that still looks like road.</p>
<ul>
<li><strong>Intent (not Tide-linked):</strong> the emperor leaves this ground alive. The Storyteller agrees this is a personal extraction, not a rally of the column.</li>
<li><strong>Liora:</strong> Strength + Athletics to get him up, then Dexterity + Ride, d8 with Advantage (she has drilled this nightmare) → <strong>5 Marks</strong> on the critical beat.</li>
<li><strong>Reply (archer trying for the double target):</strong> Perception + Archery, d8 → <strong>2 Marks</strong>.</li>
<li><strong>Fiction:</strong> they are moving. Two household guards cling on. An arrow takes Liora’s cloak, not her spine.</li>
<li><strong>Tide:</strong> unchanged at <strong>1</strong>. Heroism here is not a free army victory.</li>
</ul>
<p>Cassian, if he still can, hears the shout to cover the road south. That is player agency inside a lost collective.</p>
</div>

<div class="kod-widget__panel" data-panel-id="t8" data-step-title="Route — and the road south" data-tide-pos="0" data-tide-note="Final Tide-linked collapse: Omen 1 on the press. Imperial side routes. Liora and the emperor may still be on the road." hidden>
<p>The centre files see the wash riders and the broken screen. Standards tip. Someone cuts a mule free and runs.</p>
<ul>
<li>A last Tide-linked action on the imperial side (NPC panic or a PC trying one more shout) rolls Omen <strong>1</strong> — pure Tide-negative under the imbalance band. Marker to the imperial end.</li>
<li><strong>Collective:</strong> the column <strong>routes</strong>. The host is no longer an army.</li>
<li><strong>Personal:</strong> Liora still has a horse, an emperor, and a direction. Cassian may die buying yards, crawl after them, or vanish into the grass. The Tide does not decide those rolls for you.</li>
</ul>
<p>What the table was playing for was never “break the Mongols.” It was whether two characters could still matter when the crimson side of the bar went black.</p>
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
