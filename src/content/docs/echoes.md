---
title: Echoes
description: Echoes, Fortunes, and Foundation Myths.
---

> _*“The life of the dead is placed in the memory of the living.”*_  
> — Cicero

----------

## Echoes

An **Echo** is a deed, decision, or event that a character **chooses to carry**. It is the concrete mark of what the character cares about — personal, shared, or community-defining — and a cornerstone of **continuity** when individuals fall.

The **player** elevates a moment into an Echo. The Storyteller may veto only for tone or outright nonsense. One or two Echoes may be declared at [character creation](/character-creation/#after-the-weighing); new ones may be created whenever a deed warrants it.

### Weight and Capacity

| Weight | Name | Meaning |
|--------|------|---------|
| **1** | Individual | Known and cared for by the character alone |
| **2** | Group | Shared among a small circle; not enough alone to shift a Fortune |
| **3** | Pivotal | Tied to the community; can move a Fortune |

**Echo capacity** = **max(Strength, Dexterity) + Intellect + Authority**.

| Condition | Effect |
|-----------|--------|
| Total Echo weight **> capacity** | **–1** die on every roll that involves any of the character’s Echoes |
| **No Echoes at all** (**Decadence**) | **–1** die on **every** roll |

<figure class="kod-breath not-content">
<img src="/scenes/cominghome.jpg" alt="" width="1168" height="784" loading="lazy" decoding="async" />
</figure>

<aside class="kod-counsel" aria-label="Counsel">
<p>The load is not abstract. Too many burdens crack a person. None at all leaves them hollow.</p>
</aside>

----------

<aside class="kod-example">
<p class="kod-example__scene">Leif’s sheet: Strength 2, Dexterity 1, Intellect 2, Authority 2. Capacity is max(2, 1) + 2 + 2 = <strong>6</strong>. He has carried nothing all winter (Decadence). After the spring raid he takes on three Echoes whose weights sum to 6 — full load, no over-cap penalty. A fourth weight-1 Echo would push him past capacity.</p>
<ol class="kod-example__steps">
<li><strong>Capacity:</strong> 6.</li>
<li><strong>No Echoes:</strong> Decadence → <strong>−1</strong> die on every roll.</li>
<li><strong>Weights 1 + 2 + 3 = 6:</strong> at capacity — no over-cap penalty.</li>
<li><strong>Total weight &gt; 6:</strong> −1 die on rolls that involve any of his Echoes (not on unrelated rolls).</li>
</ol>
</aside>

----------

### Invocation

When a roll’s context matches one of the character’s Echoes, the player may spend **one extra [Exertion](/exertion/) die** beyond the normal limit of one. See [dice pool makeup](/marks-and-tiers/#the-makeup-of-the-dice-pool).

<aside class="kod-example">
<p class="kod-example__scene">Last harvest Leif swore before the hall that the spring above the ash-hill would not fall to the upper tribe. That vow is an Echo. Tonight raiders are at the spring. The Storyteller agrees the scene matches. Leif may put more of himself into the roll than Exertion normally allows.</p>
<ol class="kod-example__steps">
<li><strong>Echo:</strong> “Hold the spring against the upper tribe.”</li>
<li><strong>Roll:</strong> Authority + Command, d8 — ordering the line at the water.</li>
<li><strong>Exertion:</strong> spend 1 as usual, plus <strong>1 more</strong> because the Echo matches (two Exertion dice total).</li>
<li><strong>Without a matching Echo:</strong> only one Exertion die may be spent on a roll.</li>
</ol>
</aside>

----------

### Resolution

An Echo resolves when the table agrees the original concern is settled, broken, transcended, or made irrelevant. Resolution produces one of:

- a personal **[Trait](/traits/)**  
- a **relationship**, favour, or standing shift  
- a narrative event or established fact  
- if **Pivotal**: a shift to one **[Fortune](#fortunes)** and inclusion among the **[Foundation Myths](#foundation-myths)**  

Personal (weight 1) Echoes usually die with the character unless elevated. Group and Pivotal Echoes persist and may be claimed by successors — including as [Legacies](/hierarchies/#legacies) (an Echo crafted with the Storyteller, not a separate system).

Hierarchy advancement often begins when patronage or a hook becomes an Echo; how it resolves decides rise or fall ([Hierarchies](/hierarchies/#advancement)).


----------

## Fortunes

The community is tracked by five soft measures called **Fortunes**. They never produce absolute tallies (no cattle head-counts, no exact census).

Fortunes are **not** a second character sheet. They describe the community **as a whole** — how healthy, fed, trusted, feared, and self-sure it is *on average*. That reading colours **every** encounter: player characters and NPCs alike, friend and foe. A village on Surplus 0 is not “the same scene with different dice”; hunger, thin stores, and the smell of want walk into every hall and road. Low Cohesion means suspicion flavours speech even between allies. High Standing means outsiders treat *anyone* of that community with more caution or courtesy. The Storyteller uses Fortunes as ambient pressure and opportunity — scene framing, NPC attitude, what “ordinary life” feels like — not as a stack of modifiers to grind every roll.

<div class="kod-fortune-board not-content" data-widget="fortune-board" aria-label="Fortune impression board">
<p class="kod-fortune-board__kicker">Ordinary weather — an illustration, not a campaign</p>
<div class="kod-fortune-board__row">
<button type="button" class="kod-fortune kod-fortune--vitality" data-fortune="vitality" data-level="2">
<span class="kod-fortune__icon" aria-hidden="true"></span>
<span class="kod-fortune__name">Vitality</span>
<span class="kod-fortune__states">
<span class="kod-fortune__state" data-level="0" hidden>Crisis</span>
<span class="kod-fortune__state" data-level="1" hidden>Strained</span>
<span class="kod-fortune__state" data-level="2">Steady</span>
<span class="kod-fortune__state" data-level="3" hidden>Abundance</span>
</span>
<span class="kod-fortune__n" aria-hidden="true">2</span>
</button>
<button type="button" class="kod-fortune kod-fortune--cohesion" data-fortune="cohesion" data-level="2">
<span class="kod-fortune__icon" aria-hidden="true"></span>
<span class="kod-fortune__name">Cohesion</span>
<span class="kod-fortune__states">
<span class="kod-fortune__state" data-level="0" hidden>Crisis</span>
<span class="kod-fortune__state" data-level="1" hidden>Strained</span>
<span class="kod-fortune__state" data-level="2">Steady</span>
<span class="kod-fortune__state" data-level="3" hidden>Abundance</span>
</span>
<span class="kod-fortune__n" aria-hidden="true">2</span>
</button>
<button type="button" class="kod-fortune kod-fortune--surplus" data-fortune="surplus" data-level="2">
<span class="kod-fortune__icon" aria-hidden="true"></span>
<span class="kod-fortune__name">Surplus</span>
<span class="kod-fortune__states">
<span class="kod-fortune__state" data-level="0" hidden>Crisis</span>
<span class="kod-fortune__state" data-level="1" hidden>Strained</span>
<span class="kod-fortune__state" data-level="2">Steady</span>
<span class="kod-fortune__state" data-level="3" hidden>Abundance</span>
</span>
<span class="kod-fortune__n" aria-hidden="true">2</span>
</button>
<button type="button" class="kod-fortune kod-fortune--standing" data-fortune="standing" data-level="2">
<span class="kod-fortune__icon" aria-hidden="true"></span>
<span class="kod-fortune__name">Standing</span>
<span class="kod-fortune__states">
<span class="kod-fortune__state" data-level="0" hidden>Crisis</span>
<span class="kod-fortune__state" data-level="1" hidden>Strained</span>
<span class="kod-fortune__state" data-level="2">Steady</span>
<span class="kod-fortune__state" data-level="3" hidden>Abundance</span>
</span>
<span class="kod-fortune__n" aria-hidden="true">2</span>
</button>
<button type="button" class="kod-fortune kod-fortune--tradition" data-fortune="tradition" data-level="2">
<span class="kod-fortune__icon" aria-hidden="true"></span>
<span class="kod-fortune__name">Tradition</span>
<span class="kod-fortune__states">
<span class="kod-fortune__state" data-level="0" hidden>Crisis</span>
<span class="kod-fortune__state" data-level="1" hidden>Strained</span>
<span class="kod-fortune__state" data-level="2">Steady</span>
<span class="kod-fortune__state" data-level="3" hidden>Abundance</span>
</span>
<span class="kod-fortune__n" aria-hidden="true">2</span>
</button>
</div>
<p class="kod-fortune-board__hint">Click a Fortune to cycle Crisis → Strained → Steady → Abundance. The line below is how that state frames a scene — for everyone in that people, not as a modifier on a roll.</p>
<div class="kod-fortune-board__frame" aria-live="polite">
<p data-frame="board-steady">All five sit Steady: ordinary life for this people. Neither feast nor free-fall. Click a Fortune to see how one measure colours the room.</p>
<p data-frame="vitality-0" hidden>Crisis Vitality: half the benches are empty. A fight, a birth, or a fever is a village fact — put a missing hand or a sick relative in the scene.</p>
<p data-frame="vitality-1" hidden>Strained Vitality: enough people, barely. A raid that costs three lives is a problem the hall will feel next week.</p>
<p data-frame="vitality-2" hidden>Steady Vitality: hands enough for the work. Sickness is a household matter unless it spreads.</p>
<p data-frame="vitality-3" hidden>Abundance Vitality: young men on the wall, children in the yard. Loss is still death, but the people can absorb a hard season.</p>
<p data-frame="cohesion-0" hidden>Crisis Cohesion: private plots are the default. An order from the Ruler is a request; let NPCs hesitate, split, or deal aside.</p>
<p data-frame="cohesion-1" hidden>Strained Cohesion: people still sit together, but they count who is listening. Shared work happens; shared risk needs a push.</p>
<p data-frame="cohesion-2" hidden>Steady Cohesion: kin act as kin. Ordinary disputes stay inside the hall.</p>
<p data-frame="cohesion-3" hidden>Abundance Cohesion: a slight to one is a slight to all. Outsiders feel the closed ranks before anyone speaks.</p>
<p data-frame="surplus-0" hidden>Crisis Surplus: hunger is in the room. A guest is a mouth; price every extra body and every extra fire.</p>
<p data-frame="surplus-1" hidden>Strained Surplus: stores last if nothing goes wrong. A feast, a gift, or a wasted sack is a decision.</p>
<p data-frame="surplus-2" hidden>Steady Surplus: winter is planned for. Nobody is fat; nobody is desperate.</p>
<p data-frame="surplus-3" hidden>Abundance Surplus: grain to spare and metal to loan. Generosity is possible; so is leverage.</p>
<p data-frame="standing-0" hidden>Crisis Standing: the name is a joke or a wound. Neighbours raid, envoys skip this hall, traders price in contempt.</p>
<p data-frame="standing-1" hidden>Strained Standing: known, not feared. Treaties exist on paper; they will be tested.</p>
<p data-frame="standing-2" hidden>Steady Standing: the name carries. Outsiders are polite until given reason not to be.</p>
<p data-frame="standing-3" hidden>Abundance Standing: the name arrives before the rider. Caution or courtesy is the default from anyone who has heard of this people.</p>
<p data-frame="tradition-0" hidden>Crisis Tradition: nobody agrees what we are. Custom is argued in the moment; the young do not know the old stories, or they mock them.</p>
<p data-frame="tradition-1" hidden>Strained Tradition: the rites still happen, thinner. Elders remember; the hall only half-listens.</p>
<p data-frame="tradition-2" hidden>Steady Tradition: people know who they are. Law and custom are the same sentence.</p>
<p data-frame="tradition-3" hidden>Abundance Tradition: the past is a tool. A cited custom can move a crowd; breaking one is a public event.</p>
</div>
</div>

### Reading the scale

All five Fortunes use the **same** soft scale. The pillars above are *what* is measured; the scale is *how high* each sits. Ratings are impressions, not ledgers.

| Rating | State | How it lands at the table |
|--------|-------|---------------------------|
| **0** | Crisis | The lack is visible and constant — it should press almost every scene that touches that Fortune. |
| **1** | Strained | Thin margins; people feel it; ordinary plans cost more nerve and more care. |
| **2** | Steady | Normal for this people — neither feast nor free-fall. |
| **3** | Abundance | Room to breathe; outsiders and members alike read plenty, confidence, or strength in that domain. |

Starting Fortunes are set as soft impressions during [Campaign Setup](/campaign-setup/#worldbuilding-practices). Early play confirms or corrects them. Automation should store the five ratings for the active community.

----------

## Foundation Myths

The three most recent **resolved Pivotal Echoes** become the community’s active **Foundation Myths**. Older ones fade from the active set as new pivotal events take their place.

A Foundation Myth exerts a substantial, **narrow** effect on a defined set of actions. Effects are **toggleable and compoundable**: the Storyteller crafts a Myth by combining mechanical hooks (Storyteller-only tooling in automation). Possible effect ingredients include:

- free extra Exertion spend, or forced extra Exertion cost, on matching rolls  
- situational [Advantage or Disadvantage](/marks-and-tiers/#advantage-and-disadvantage)  
- one or more specific faces locked onto the [Omen](/omens/#the-omen-die-and-consequences) die for community-relevant rolls  
- extra or reduced [Practice](/skills/#improvement) gain on matching Skills  
- influence on [Tide](/tide/) starting point and shift thresholds  
- a temporary or permanent [Trait](/traits/) available (or denied) to all community members  

**Triggering:** like [Echo invocation](#invocation), a roll must **explicitly mark** that a Foundation Myth applies (Storyteller or automation roll flow). Free prose alone does not fire effects.

<figure class="kod-breath not-content">
<img src="/scenes/price-we-paid.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

### Worked Myth — The Price We Paid

A veteran who was taken as a child by slavers — parents killed, years in chains — hunted the man who did it. The hunt was not his alone. The community that hid him, fed him, and buried the dead made the deed a **Pivotal Echo**. When it resolved, it became a Foundation Myth.

**The Price We Paid** (active Myth):

- On a roll **tagged** against slavers or the slave-take: the actor may spend a **free extra Exertion** die (does not draw from the pool).
- **Streetwise** Practice on matching work is counted as if the ruling Foundation were **3** (threshold halved), even if the character’s Guile is 1 or 2.

<div class="kod-widget not-content" data-widget="content-tabs">
<p class="kod-widget__title">Same roll — Myth off / on</p>
<p class="kod-widget__intro">A community member reads a slaver camp from the town’s alleys. Streetwise, Guile 2. Tagged against slavers only when the Myth is on.</p>
<div class="kod-widget__controls" role="group" aria-label="Myth toggle">
<button type="button" class="kod-widget__btn" data-tab="myth-off" aria-pressed="true">Myth off</button>
<button type="button" class="kod-widget__btn" data-tab="myth-on">Myth on</button>
</div>
<div class="kod-widget__panel" data-panel-id="myth-off">
<p><strong>Tag:</strong> none. Ordinary Streetwise. Exertion if they spend from the pool. Practice against the Foundation-2 threshold (base 24 or 48, depending on current rank).</p>
<p>The camp is just another dangerous alley. Nothing in the community’s memory helps the dice.</p>
</div>
<div class="kod-widget__panel" data-panel-id="myth-on" hidden>
<p><strong>Tag:</strong> The Price We Paid. Free extra Exertion die (pool untouched). Streetwise Practice this roll uses the Foundation-3 threshold.</p>
<p>They still have to walk the alley. The Myth does not find the slaver for them. It only lets the living spend more of themselves, and learn faster, when the work matches the dead.</p>
</div>
</div>

Myths are living. They can be reinforced, corrupted, or overwritten by later events. They are the concrete way a character’s greatest deeds outlive the character and reshape the community that remains.

Related: [Introduction](/introduction/) (continuity), [Character Creation](/character-creation/), [Automation](/automation/).

----------
