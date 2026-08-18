---
title: Skills
description: Skills organised under six Archetypes, with Practice and improvement rules.
---

> _*“People pretend not to like grapes when the vines are too high for them to reach.”*_  
> _Marguerite de Navarre_

----------

<figure class="kod-breath not-content">
<img src="/scenes/vineyard.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

**Skills** are organised under six **Archetypes**. Archetypes are not classes. Each is a named group of related Skills; a character may take Skills from any of them.

**Skills are rated between 0 and 3.**

| Rating | Meaning |
|--------|---------|
| **0** | No meaningful practice in that specific Skill |
| **3** | Extremely practiced in that domain |

Each Skill has a single ruling **[Foundation](/foundations/)** that governs its [Practice](#improvement) thresholds.

Specific techniques, regional styles, named tools, or binary capabilities remain **[Traits](/traits/)** — not Skills. You either have the technique, the tool-aptitude, or the condition, or you do not.

At the table, the Storyteller selects the Skill that best matches the player’s described intent when building a [dice pool](/marks-and-tiers/#the-makeup-of-the-dice-pool).

----------

## Improvement

Every time a **Skill** is used in a roll it may generate **Practice** (tracked by [automation](/automation/)). [Primitive](/marks-and-tiers/#the-makeup-of-the-dice-pool) actions grant **no** Practice — no Skill is involved.

Practice is deeply tied to **[Exertion](/exertion/)**. **Marks** convert to Practice only when Exertion was spent — on a win **and** on a loss. A loss also adds **+2**. The two awards stack. Struggle and effort teach; grinding without risk does not.

**Opposed** — Practice uses the **Marks difference** (your Marks minus theirs). A **0** margin is a tie: not a loss, and no automatic award.

| Result | No Exertion | Exertion spent |
|--------|-------------|----------------|
| **Won** | — | + Marks difference |
| **Lost** | +2 | + Marks difference **and** +2 |
| **Tied** | — | — |

**Unopposed**

| Result | No Exertion | Exertion spent |
|--------|-------------|----------------|
| **More failures than Marks** | +2 | +2 **and** +1 per two Marks (floor) |
| **Marks ≥ failures** | — | +1 per two Marks (floor) |

<div class="kod-widget not-content" data-widget="practice-award">
<p class="kod-widget__title">What this roll is worth</p>
<p class="kod-widget__intro">Pick the roll and whether Exertion was spent. Primitive actions are not here — they grant nothing.</p>
<div class="kod-widget__controls" role="group" aria-label="Roll type">
<button type="button" class="kod-widget__btn" data-practice-kind="opposed" aria-pressed="true">Opposed</button>
<button type="button" class="kod-widget__btn" data-practice-kind="unopposed">Unopposed</button>
</div>
<div class="kod-widget__controls" role="group" aria-label="Result" data-practice-results="opposed">
<button type="button" class="kod-widget__btn" data-practice-result="won" aria-pressed="true">Won</button>
<button type="button" class="kod-widget__btn" data-practice-result="lost">Lost</button>
<button type="button" class="kod-widget__btn" data-practice-result="tie">Tied</button>
</div>
<div class="kod-widget__controls" role="group" aria-label="Result" data-practice-results="unopposed" hidden>
<button type="button" class="kod-widget__btn" data-practice-result="struggle" aria-pressed="true">More failures</button>
<button type="button" class="kod-widget__btn" data-practice-result="held">Marks ≥ failures</button>
</div>
<div class="kod-widget__controls" role="group" aria-label="Exertion">
<button type="button" class="kod-widget__btn" data-practice-exert="no" aria-pressed="true">No Exertion</button>
<button type="button" class="kod-widget__btn" data-practice-exert="yes">Exertion spent</button>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-won-no">
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>You beat them 4 Marks to 1 — difference <strong>3</strong>. No Exertion. Marks do not convert. Nothing from the win itself.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-won-yes" hidden>
<p class="kod-practice-award__total"><strong>+3</strong></p>
<p>Same 4–1 win. Exertion was spent. Marks difference <strong>3</strong> becomes Practice. You did not lose, so there is no +2.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-lost-no" hidden>
<p class="kod-practice-award__total"><strong>+2</strong></p>
<p>They beat you 4 Marks to 2 — difference <strong>2</strong>. No Exertion. Marks stay off the ledger. The loss still adds <strong>+2</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-lost-yes" hidden>
<p class="kod-practice-award__total"><strong>+4</strong></p>
<p>Same 2–4 loss. Exertion was spent, so the Marks difference <strong>2</strong> converts. The loss adds <strong>+2</strong>. They stack: <strong>2 + 2 = 4</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-tie-no" hidden>
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>Margin <strong>0</strong>. A tie is not a loss. No +2. No Exertion, so Marks do not convert either.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-tie-yes" hidden>
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>Margin <strong>0</strong>. Exertion does not change a tie. No Marks difference to convert. No +2.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-struggle-no" hidden>
<p class="kod-practice-award__total"><strong>+2</strong></p>
<p>More failures than Marks (1 Mark, 3 failures). No Exertion. The struggle award is <strong>+2</strong>. Marks stay off the ledger.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-struggle-yes" hidden>
<p class="kod-practice-award__total"><strong>+3</strong></p>
<p>More failures than Marks, and Exertion spent. Struggle <strong>+2</strong>, plus floor(3 Marks ÷ 2) = <strong>+1</strong>. They stack: <strong>2 + 1 = 3</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-held-no" hidden>
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>4 Marks, 1 failure — Marks win the count. No struggle award. No Exertion, so those Marks do not convert.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-held-yes" hidden>
<p class="kod-practice-award__total"><strong>+2</strong></p>
<p>Same 4 Marks. Exertion was spent. floor(4 ÷ 2) = <strong>+2</strong>. No struggle award — Marks already beat failures.</p>
</div>
</div>

Practice accumulates against thresholds:

| Current Skill | Base Threshold |
|---------------|----------------|
| 0 → 1         | 24             |
| 1 → 2         | 48             |
| 2 → 3         | 72             |

These thresholds are modified by the Skill’s ruling **Foundation**:

| Foundation | Threshold modifier |
|------------|--------------------|
| **3** (above average) | Halved |
| **2** (average) | Base values |
| **1** (below average) | Doubled |

High inborn potential accelerates learning. Low potential slows it. Automation handles accumulation and level-ups. Exact Practice progress is visible on the **live character sheet**. Chat adapters do not print Practice amounts — look at the sheet.

<figure class="kod-breath not-content">
<img src="/scenes/practice.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

<div class="kod-widget not-content" data-widget="step-flow" id="practice-track">
<p class="kod-widget__title">Practice — the recurve on the steppe</p>
<p class="kod-widget__intro"><strong>Temur</strong>, young bowyer, Constitution 2, Bowyer &amp; Fletcher 0 → 1 (threshold <strong>24</strong>). <strong>Qara</strong>, old bowyer of the same orda, Charisma 2, Mentoring 1 → 2 (threshold <strong>48</strong>). Hunnic camp. Horn, sinew, and a stubborn belly.</p>
<p class="kod-step-flow__label" data-step-label></p>
<div class="kod-step-flow__track" role="group" aria-label="Practice steps">
<button type="button" class="kod-widget__btn" data-tab="p1" aria-pressed="true">1</button>
<button type="button" class="kod-widget__btn" data-tab="p2">2</button>
<button type="button" class="kod-widget__btn" data-tab="p3">3</button>
</div>
<div class="kod-widget__panel" data-panel-id="p1" data-step-title="The first bend">
<p>Temur steams the horn and tries the first reflex of a recurve. The belly fights him. More failures than Marks. He does not spend Exertion.</p>
<p><strong>Temur</strong> · unopposed Constitution + Bowyer &amp; Fletcher · more failures than Marks · no Exertion → <strong>+2 Practice</strong> (Bowyer).</p>
<p>Temur: <strong>2 / 24</strong>. Qara has not rolled.</p>
</div>
<div class="kod-widget__panel" data-panel-id="p2" data-step-title="The old man sits down" hidden>
<p>Qara sits. He names the fault in the last fold and makes Temur feel it in the wood. Resolve + Mentoring, <strong>d8</strong>. He spends Exertion. <strong>3 Marks</strong>.</p>
<p><strong>Qara</strong> · unopposed · Exertion spent · floor(3 ÷ 2) → <strong>+1 Practice</strong> (Mentoring). Qara: <strong>1 / 48</strong>.</p>
<p>Temur tries the belly again the same evening, now spending Exertion. <strong>4 Marks</strong> → <strong>+2 Practice</strong> (Bowyer). Temur: <strong>4 / 24</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="p3" data-step-title="String it" hidden>
<p>Qara will not praise until the bow shoots. “String it. The reed by the wagon.” Temur spends Exertion and is still beaten by the horn-set — opposed loss by 1 Mark.</p>
<p><strong>Temur</strong> · opposed loss · Exertion spent · Marks difference <strong>1</strong> + loss <strong>+2</strong> → <strong>+3 Practice</strong> (Bowyer). Temur: <strong>7 / 24</strong>.</p>
<p>Qara watches and corrects the grip — another Mentoring roll, Exertion, 2 Marks → <strong>+1 Practice</strong>. Qara: <strong>2 / 48</strong>. Both learned. The youth learned more from the loss.</p>
</div>
<div class="kod-step-flow__nav">
<button type="button" data-step-prev>← Back</button>
<button type="button" data-step-next>Next →</button>
</div>
</div>

<aside class="kod-counsel" aria-label="Counsel">
<p>Struggle teaches. Effort is taken into account. Doing something ad infinitum without hardship counts for naught.</p>
</aside>

### Degradation (prompted only)

Skills can lose progress when the Storyteller asks automation to evaluate a time leap or similar narrative stretch — not continuously in the background.

**Standard time leap**

1. Take the **five** Skills with the **lowest** Practice progress toward the next rank.  
2. Roll the **Omen** die.  
3. From those five, randomly select how many Skills to downgrade:

| Omen | Skills degraded (from the five) |
|------|----------------------------------|
| 1–5 | 0 |
| 6–10 | 1 |
| 11–15 | 2 |
| 16–20 | 3 |

**Short time leap (alternate)**

Same five-skill pool, but only:

| Omen | Skills degraded |
|------|-----------------|
| 1–10 | 0 |
| 11–20 | 1 |

Fiction still decides *why* rust set in; automation only applies the prompted procedure.

<aside class="kod-example">
<p class="kod-example__scene">Temur’s first bend is messy. Qara teaches. After a quiet winter on the same pastures, the Storyteller prompts automation for a short time leap on neglected Skills.</p>
<ol class="kod-example__steps">
<li><strong>Temur, unopposed Bowyer:</strong> more failures than Marks, no Exertion → <strong>+2 Practice</strong>.</li>
<li><strong>Qara, Mentoring with Exertion, 3 Marks:</strong> <strong>+1 Practice</strong> (floor of 3÷2). Temur later the same evening, Exertion, 4 Marks → <strong>+2 Practice</strong>.</li>
<li><strong>Short time leap (ST prompts):</strong> take the five Skills with lowest progress; Omen 1–10 → degrade none; Omen 11–20 → degrade one of those five at random.</li>
</ol>
</aside>

----------

## The six Archetypes

Each Archetype names a role and lists the Skills that belong to it. Characters are not limited to one Archetype. Each Skill shows its ruling Foundation and a short definition.

<div class="kod-archetypes not-content">

<details class="kod-archetype kod-archetype--warrior" id="warrior-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/warrior.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Warrior</span>
<span class="kod-archetype__tag">Combat and armed threat</span>
</summary>
<div class="kod-archetype__body">
<p>The Warrior covers fighting and the control of violence: weapons, defence, intimidation, battlefield command, and reading a fight. These are the Skills of combat and of ordering people under immediate physical threat.</p>
<ol>
<li><strong>Slash</strong> (Strength) — cutting edges used in chopping or sweeping cuts</li>
<li><strong>Pierce</strong> (Dexterity) — point work and thrusts</li>
<li><strong>Bash</strong> (Strength) — blunt impact weapons and strikes</li>
<li><strong>Unarmed</strong> (Strength) — striking and grappling without weapons</li>
<li><strong>Intimidate</strong> (Authority) — projecting threat through demonstrated or implied capacity for violence</li>
<li><strong>Deflection</strong> (Resolve) — active redirection with weapon or shield</li>
<li><strong>Counter</strong> (Resolve) — the practiced immediate reply after a successful Deflection or Dodge</li>
<li><strong>Command</strong> (Authority) — issuing orders that are obeyed in the heat of combat or under immediate physical threat</li>
<li><strong>Tactics</strong> (Intellect) — reading the shape of a fight, positioning, and exploiting terrain and numbers</li>
<li><strong>Footwork</strong> (Dexterity) — mobility, balance, and positioning in combat</li>
<li><strong>Combat Awareness</strong> (Perception) — noticing openings, threats, and shifts in the immediate fight</li>
<li><strong>Thrown</strong> (Constitution) — any thrown weapon or object used to strike or disable</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--wayfarer" id="wayfarer-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/wayfarer.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Wayfarer</span>
<span class="kod-archetype__tag">Travel and the outdoors</span>
</summary>
<div class="kod-archetype__body">
<p>The Wayfarer covers travel and living off the land: scouting, hunting, mounts, small craft, wilderness knowledge, and trade on the road. These are the Skills of path, camp, and field — not the household and not formal study.</p>
<ol>
<li><strong>Scouting</strong> (Perception) — pathfinding, navigation by stars, landmarks and trails, reading terrain for travel</li>
<li><strong>Trapping &amp; Tracking</strong> (Perception) — locating, following, and the design and use of traps</li>
<li><strong>Foraging &amp; Fishing</strong> (Constitution) — edible plants, fungi, water sources, and fishing</li>
<li><strong>Archery</strong> (Perception) — all bows</li>
<li><strong>Sailing &amp; Navigation</strong> (Perception) — small craft, rivers, lakes, and basic seamanship</li>
<li><strong>Animal Handling</strong> (Resolve) — wild animals and the training or handling of companions</li>
<li><strong>Dodge</strong> (Dexterity) — pure evasion and body movement out of the line of attack</li>
<li><strong>Riding</strong> (Authority) — control of a mount under combat and travel stress</li>
<li><strong>Ambush &amp; Camouflage</strong> (Guile) — choosing ground and using natural cover for surprise or concealment</li>
<li><strong>Swimming</strong> (Constitution) — movement and survival in water</li>
<li><strong>Wilderness</strong> (Constitution) — knowledge of nature, terrain, and the living world</li>
<li><strong>Tradecraft</strong> (Charisma) — exchange, value negotiation, and market dealings on the road</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--artisan" id="artisan-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/artisan.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Artisan</span>
<span class="kod-archetype__tag">Craft and construction</span>
</summary>
<div class="kod-archetype__body">
<p>The Artisan covers making and repairing physical work: metal, timber, cloth, ships, tools, fine craft, and directing labour. These are the Skills of the workshop, yard, and forge.</p>
<ol>
<li><strong>Tailoring &amp; Armory</strong> (Constitution) — cloth, leather, soft materials, and the construction or repair of protective gear</li>
<li><strong>Smithing &amp; Forging</strong> (Strength) — working metal at the forge</li>
<li><strong>Carpentry &amp; Masonry</strong> (Strength) — timber and stone construction and shaping</li>
<li><strong>Brewing</strong> (Constitution) — fermentation and liquid preservation</li>
<li><strong>Fine Crafts</strong> (Dexterity) — jewellery, glass, and equivalent high-precision work</li>
<li><strong>Shipwright</strong> (Strength) — building and repairing boats and ships</li>
<li><strong>Engineering &amp; Design</strong> (Intellect) — simple machines, structural planning, and mechanisms</li>
<li><strong>Bowyer &amp; Fletcher</strong> (Constitution) — bows, arrows, and related equipment</li>
<li><strong>Appraisal</strong> (Perception) — judging value, authenticity, and quality of objects and materials</li>
<li id="handcrafting"><strong>Handcrafting</strong> (Dexterity) — improvised tools and objects from bone, wood, sinew, stone, and available materials</li>
<li><strong>Oversight</strong> (Authority) — directing and coordinating groups of workers</li>
<li><strong>Tinkering &amp; Repair</strong> (Constitution) — diagnosing, adjusting, and restoring existing tools, mechanisms, and objects</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--mother" id="mother-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/mother.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Mother</span>
<span class="kod-archetype__tag">Household and care</span>
</summary>
<div class="kod-archetype__body">
<p>The Mother covers household life and the care of people: food, healing, children, farming, domestic animals, and personal influence within kin and home. It is not a gender and not limited to parents — it is the Skills of keeping a household and its people alive and bound together.</p>
<ol>
<li><strong>Cooking &amp; Preserving</strong> (Resolve) — preparation and preservation of food</li>
<li id="herbalism"><strong>Herbalism</strong> (Intellect) — medicinal plants and poisons</li>
<li><strong>Childcare</strong> (Resolve) — raising children and midwifery</li>
<li><strong>Animal Husbandry</strong> (Resolve) — breeding, care, and management of domestic animals</li>
<li><strong>Farming</strong> (Strength) — soil, crops, and field management</li>
<li><strong>Empathy</strong> (Charisma) — reading emotional states and offering personal support</li>
<li><strong>Performance</strong> (Charisma) — expression through voice (singing), body (dancing), and presence (acting)</li>
<li id="healing"><strong>Healing</strong> (Resolve) — physical treatment of the body, wounds, and injury (critical for <a href="/harm/#dying">Dying</a> stabilisation)</li>
<li><strong>Etiquette</strong> (Resolve) — proper forms, manners, and social conduct in domestic and relational settings</li>
<li><strong>Seduction</strong> (Charisma) — intimate influence, charm, and emotional leverage in personal relationships</li>
<li><strong>Influence</strong> (Authority) — using relational position, obligations, and family hooks</li>
<li><strong>Muse</strong> (Authority) — inspiring others to action, feeling, or creation</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--sage" id="sage-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/sage.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Sage</span>
<span class="kod-archetype__tag">Learning and counsel</span>
</summary>
<div class="kod-archetype__body">
<p>The Sage covers knowledge, record, and formal counsel: calculation, lore, maps, teaching, investigation, negotiation, rites, and long-term planning. These are the Skills of study, speech, and memory. Strategy here is long-horizon planning; Warrior <strong>Tactics</strong> covers the immediate fight.</p>
<ol>
<li><strong>Debate &amp; Rhetoric</strong> (Charisma) — structured argument and persuasive speech</li>
<li><strong>Arithmetic &amp; Accounting</strong> (Intellect) — numbers, ledgers, shares, and practical calculation</li>
<li><strong>Investigation</strong> (Perception) — systematic inquiry into events, places, and evidence</li>
<li><strong>Folklore &amp; Heraldry</strong> (Intellect) — local lore, lineages, signs, and remembered custom</li>
<li><strong>Cartography</strong> (Intellect) — maps, distances, and recorded geography</li>
<li><strong>Mentoring</strong> (Charisma) — teaching others so that skill and judgment take root</li>
<li><strong>Illustration</strong> (Intellect) — technical drawing, diagrams, schematics, and visual recording of knowledge</li>
<li><strong>Negotiation</strong> (Authority) — formal bargaining toward agreement between parties</li>
<li><strong>Insight</strong> (Perception) — reading motives, emotional state, and unspoken position</li>
<li><strong>Strategy</strong> (Intellect) — long-horizon planning beyond the immediate fight</li>
<li><strong>Ritual</strong> (Authority) — conducting communal rites, funerals, oaths, and formal observance</li>
<li><strong>Preaching</strong> (Charisma) — public moral or spiritual address that moves a crowd</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--trickster" id="trickster-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/trickster.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Trickster</span>
<span class="kod-archetype__tag">Secrecy and deceit</span>
</summary>
<div class="kod-archetype__body">
<p>The Trickster covers stealth, theft, forgery, smuggling, deception, and related underhand work. A character need not be a professional thief to hold these Skills — they are the Skills of secrecy, misdirection, and moving past watchers.</p>
<ol>
<li><strong>Lockpicking</strong> (Guile) — defeating locks, catches, and simple mechanical seals</li>
<li><strong>Pickpocket</strong> (Guile) — removing objects from a person without their notice</li>
<li><strong>Sneak</strong> (Dexterity) — quiet movement and remaining unseen while moving</li>
<li><strong>Forgery</strong> (Guile) — false documents, seals, marks, and convincing imitations of writing or craft signs</li>
<li><strong>Slander &amp; Ridicule</strong> (Charisma) — public or whispered attack on reputation through words</li>
<li><strong>Smuggling</strong> (Guile) — moving goods or people past watchers, tolls, and searchers</li>
<li><strong>Deception</strong> (Guile) — lies, false personas, and deliberate misdirection</li>
<li><strong>Streetwise</strong> (Guile) — reading towns, underworld channels, and informal urban power</li>
<li><strong>Acrobatics</strong> (Dexterity) — leaps, balance, contortion, and athletic movement under stress</li>
<li><strong>Sleight of Hand</strong> (Guile) — palm, switch, conceal, and stage small manipulations</li>
<li><strong>Off-hand &amp; Improvised Combat</strong> (Dexterity) — secondary weapons and objects not meant as arms</li>
<li><strong>Climbing</strong> (Strength) — vertical movement on rock, timber, rope, and walls</li>
</ol>
</div>
</details>

</div>

----------

Related: [Human Potential](/human-potential/), [Character Creation](/character-creation/) skill budgets, [Automation](/automation/) Practice tracking.

----------
