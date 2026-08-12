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

At the table, the Storyteller selects the Skill that best matches the player’s described intent when building a [dice pool](/dice-mechanics/#the-makeup-of-the-dice-pool).

----------

## Improvement

Every time a **Skill** is used in a roll it may generate **Practice** (tracked by [automation](/automation/)). [Primitive](/dice-mechanics/#the-makeup-of-the-dice-pool) actions grant **no** Practice — no Skill is involved.

Practice is deeply tied to **[Exertion](/exertion/)**. **Marks of Success** only grant Practice when Exertion was spent. Struggle and effort teach; grinding without risk does not.

| Roll type | Practice rule |
|-----------|----------------|
| **Opposed** | Practice = Marks difference when Exertion was spent. If the character *lost* the contest, add **+2** (regardless of Exertion). A **0** margin counts as not lost. |
| **Unopposed** | **+2** Practice if the roll contained more failures than Marks (Exertion free), **plus** **+1** Practice for every two Marks of Success (rounded down) when Exertion was spent. |

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

High inborn potential accelerates learning. Low potential slows it. Automation handles accumulation and level-ups. Players never see raw Practice numbers unless they ask.

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
| 0–4 | 0 |
| 5–9 | 1 |
| 10–14 | 2 |
| 15–20 | 3 |

**Short time leap (alternate)**

Same five-skill pool, but only:

| Omen | Skills degraded |
|------|-----------------|
| 0–9 | 0 |
| 10–20 | 1 |

Fiction still decides *why* rust set in; automation only applies the prompted procedure.

<aside class="kod-example">
<p class="kod-example__scene">Odd needs grain the storehouse master will not release. After dark he works the lock on the side door. First attempt is messy. Later the same night he pushes with Exertion and lands clean Marks. Months later, after a quiet winter, the Storyteller prompts automation for a short time leap on neglected Skills.</p>
<ol class="kod-example__steps">
<li><strong>Unopposed Lockpicking:</strong> more failures than Marks, no Exertion → <strong>+2 Practice</strong>.</li>
<li><strong>Same Skill, later that night:</strong> Exertion spent, 4 Marks → <strong>+2 Practice</strong> (floor of 4÷2).</li>
<li><strong>Short time leap (ST prompts):</strong> take the five Skills with lowest progress; Omen 0–9 → degrade none; Omen 10–20 → degrade one of those five at random.</li>
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
<li><strong>Handcrafting</strong> (Dexterity) — improvised tools and objects from bone, wood, sinew, stone, and available materials</li>
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
<li><strong>Herbalism</strong> (Intellect) — medicinal plants and poisons</li>
<li><strong>Childcare</strong> (Resolve) — raising children and midwifery</li>
<li><strong>Animal Husbandry</strong> (Resolve) — breeding, care, and management of domestic animals</li>
<li><strong>Farming</strong> (Strength) — soil, crops, and field management</li>
<li><strong>Empathy</strong> (Charisma) — reading emotional states and offering personal support</li>
<li><strong>Performance</strong> (Charisma) — expression through voice (singing), body (dancing), and presence (acting)</li>
<li><strong>Healing</strong> (Resolve) — physical treatment of the body, wounds, and injury (critical for <a href="/harm/#dying">Dying</a> stabilisation)</li>
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
