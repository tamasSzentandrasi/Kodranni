---
title: Hierarchies
description: Hierarchies, Reputation, Legacies, and the Diagram.
---

> _*It is better to be on hand with ten men than absent with ten thousand.*_  
> — Timur

----------

## Hierarchies, Reputation and Legacies

Hierarchies are where the community sees its people — position believed, understood, and accepted.

A Hierarchy is **one axis** of power inside the community — not the whole social map. Every campaign starts with a default set of four axes. The Storyteller may rename, add, or remove them — hard **maximum of five**.

One person may hold a tier on **several** axes at once (Honoured on Coin, Acknowledged on Arms). Climbing is **per axis**. The **Ruler** is not the fifth rung of any ladder — it is a **single shared seat above all axes**. Only one person holds it, no matter which axis they rose through.

During [Campaign Setup](/campaign-setup/), leave axes empty of names; standing is discovered and claimed in play.

### Tiers

Each axis uses the same four rungs, top to bottom: **Honoured**, **Trusted**, **Acknowledged**, **Outcast**. The **Ruler** sits above them, not on them.

<figure class="kod-breath not-content">
<img src="/scenes/emissaries.jpg" alt="" width="1168" height="784" loading="lazy" decoding="async" />
</figure>

### The shape of the Diagram

Read the diagram top-down: one crown, then parallel ladders. Each column is a separate Hierarchy. Each ladder uses the **same four tiers** (top of column = Honoured, bottom = Outcast). **Setup** leaves every rung empty of names. **In play** is a worked occupancy — a small Althing cast — so dual-axis, patronage, delegation, and the outsider porch can be seen at once.

<div class="kod-hier not-content" data-widget="hierarchy-board" data-mode="play" aria-label="Hierarchy occupancy">
<div class="kod-hier__modes" role="group" aria-label="Diagram state">
<button type="button" class="kod-widget__btn" data-hier-mode="setup">Setup</button>
<button type="button" class="kod-widget__btn" data-hier-mode="play" aria-pressed="true">In play</button>
</div>
<div class="kod-hier__cast" role="list" aria-label="People in the example">
<button type="button" class="kod-chip" data-person="ketill">Ketill</button>
<button type="button" class="kod-chip" data-person="hakon">Hákon</button>
<button type="button" class="kod-chip" data-person="ingibjorg">Ingibjörg</button>
<button type="button" class="kod-chip" data-person="leif">Leif</button>
<button type="button" class="kod-chip" data-person="sigrid">Sigrid</button>
</div>
<div class="kod-hier-diagram">
<div class="kod-hier-ruler">
<p class="kod-hier-ruler__title">Ruler</p>
<button type="button" class="kod-chip" data-person="ketill" data-play>Ketill</button>
<p class="kod-hier-ruler__note">One seat for the whole community — above every axis, not the top of Arms, Faith, Coin, or Blood.</p>
</div>
<div class="kod-hier-body">
<div class="kod-hier-axes">
<div class="kod-hier-axis" data-axis="arms">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Arms</p>
<p class="kod-hier-axis__domain">Martial strength, protection, war, right to violence</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Honoured</strong></li>
<li><strong>Trusted</strong> <button type="button" class="kod-chip" data-person="hakon" data-play>Hákon</button></li>
<li><strong>Acknowledged</strong> <button type="button" class="kod-chip" data-person="leif" data-play>Leif</button></li>
<li><strong>Outcast</strong></li>
</ol>
</div>
<div class="kod-hier-axis" data-axis="faith">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Faith</p>
<p class="kod-hier-axis__domain">Ritual, sacred knowledge, moral weight</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Honoured</strong></li>
<li><strong>Trusted</strong></li>
<li><strong>Acknowledged</strong></li>
<li><strong>Outcast</strong></li>
</ol>
</div>
<div class="kod-hier-axis" data-axis="coin">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Coin</p>
<p class="kod-hier-axis__domain">Wealth, trade, material surplus, leverage</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Honoured</strong> <button type="button" class="kod-chip" data-person="ingibjorg" data-play>Ingibjörg</button></li>
<li><strong>Trusted</strong></li>
<li><strong>Acknowledged</strong> <button type="button" class="kod-chip" data-person="leif" data-play>Leif</button></li>
<li><strong>Outcast</strong></li>
</ol>
</div>
<div class="kod-hier-axis" data-axis="blood">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Blood</p>
<p class="kod-hier-axis__domain">Kinship, land, lineage, domestic authority</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Honoured</strong> <button type="button" class="kod-chip" data-person="ketill" data-play>Ketill</button></li>
<li><strong>Trusted</strong></li>
<li><strong>Acknowledged</strong> <button type="button" class="kod-chip" data-person="hakon" data-play>Hákon</button></li>
<li><strong>Outcast</strong></li>
</ol>
</div>
</div>
<aside class="kod-hier-porch" aria-label="Outsiders">
<p class="kod-hier-porch__title">Outsiders</p>
<button type="button" class="kod-chip" data-person="sigrid" data-play>Sigrid</button>
<p class="kod-hier-porch__note">Apart until they enter. Then Outcast on the axes that apply.</p>
</aside>
</div>
</div>
<div class="kod-hier__frame" aria-live="polite">
<p data-person-note="default">Click a name. That person lights on every axis they occupy. Dual-axis is two rungs at once, not a fifth ladder. Faith is empty on purpose — an axis can sit vacant in play.</p>
<p data-person-note="ketill" hidden>Ketill holds the Ruler seat. He rose through Blood and still sits Honoured there. He cannot stand the wall and the Althing at once, so Arms is delegated to Hákon. Reputation: anyone trying to shame Ketill in public faces the gap from their rung to the seat above every axis.</p>
<p data-person-note="hakon" hidden>Hákon is Trusted on Arms because Ketill named him marshal — that is delegation, not a second Ruler. He is also Acknowledged on Blood as kin. Dual-axis: both ladders light. No one rules well without handing the work down.</p>
<p data-person-note="ingibjorg" hidden>Ingibjörg is Honoured on Coin — the mill accounts. She is Leif’s patron. She does not sit Arms. If she and Leif contest in the hall, the Coin gap (Honoured vs Acknowledged) is the protection ratio for social or mental Harm. Influence in fiction is still free roleplay.</p>
<p data-person-note="leif" hidden>Leif (player). Acknowledged on Arms from last year’s raid. Was Outcast on Coin until Ingibjörg’s mill-ledger Echo resolved well; now Acknowledged on Coin. Climb is per axis — the Echo did not move Arms. Dual-axis: both rungs light.</p>
<p data-person-note="sigrid" hidden>Sigrid is an Outsider: on the porch, not on any ladder. If she enters the community she begins Outcast on the axes that apply. The porch is beside the diagram, never a fifth column.</p>
</div>
<p class="kod-hier-caption">Same four rungs on every axis. A character may stand high on one and low on another. The Ruler seat is singular and sits above the whole set.</p>
</div>

Characters who never belonged to the community are **Outsiders**. They sit **apart** on the Diagram (not on any axis) until they enter, then begin as **Outcast** on the axes that apply.

Default after [The Weighing](/character-creation/#after-the-weighing): **Outcast**, unless fiction already places them higher.

----------

### Reputation

Reputation is a character’s relative position on the relevant Hierarchy.

Its only hard mechanical effect is the **protection ratio** when calculating [Harm](/harm/#inflicting-harm) in Social or Mental contests. The greater the gap, the harder it is for the lower party to inflict lasting social or mental damage on the higher.

Nothing else is mechanically attached to tier. Influence in fiction remains free roleplay.

----------

<figure class="kod-breath not-content">
<img src="/scenes/kingsgambit.jpg" alt="" width="1168" height="784" loading="lazy" decoding="async" />
</figure>

### Advancement

Rising usually begins with **patronage** or a **hook**.

A higher-tier character bestows an honour, role, quest, or public favour. That bestowal becomes an **[Echo](/echoes/)**. How the Echo resolves decides whether the character rises, stays, or falls.

Players may initiate rises for NPCs the same way. Handle with care: ambitious underlings threaten patrons; weak underlings hollow out a community. No one rules well without delegation.

Patronage is the clearest path, not the only one. Public deeds, force, death of a superior, or seizure of a vacant place may also move a character. The table decides what fiction will bear.

Competition and cooperation on the same tier are left to roleplay.

<aside class="kod-example">
<p class="kod-example__scene">The occupancy above is this scene after it resolved. Before the Althing, Ingibjörg — Honoured on Coin, the woman who still holds the only sound mill accounts — pulls Leif aside in the yard. The ledger that proves her claim on the mill shares was stolen last week. She names him before witnesses: bring it back before the assembly sits, and she will speak for him. That charge becomes an Echo. Completing it well opened his climb on Coin (Outcast → Acknowledged). The Echo did not move Arms, and it did not make him Honoured. Later, if Ingibjörg tries to shame him in the hall, the two-rung Coin gap is the protection ratio for social Harm — not automatic power from the favour itself. Ketill, meanwhile, is not on that ladder: he rules by sitting the seat and by having already handed Arms to Hákon.</p>
<ol class="kod-example__steps">
<li><strong>Patronage / hook:</strong> Ingibjörg (Honoured, Coin) publicly charges Leif with recovering the mill ledger before the Althing.</li>
<li><strong>Echo created:</strong> “Return the mill ledger before the Althing” (weight set at the table).</li>
<li><strong>Advancement:</strong> it resolved well; the Storyteller approved Coin Outcast → Acknowledged. Arms stayed where the raid had already put it.</li>
<li><strong>Delegation:</strong> Ketill (Ruler, Honoured Blood) does not also sit Trusted Arms — Hákon does, because the Ruler named him marshal.</li>
<li><strong>Reputation / social combat:</strong> Ingibjörg vs Leif on Coin is a two-rung gap. That gap is the protection ratio when social or mental Harm is applied. Nothing else is mechanically attached to tier.</li>
</ol>
</aside>

----------

<figure class="kod-breath not-content">
<img src="/scenes/eclipse.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

### Legacies

When a character dies they are removed completely from the Hierarchy Diagram. Only the **[Echoes](/echoes/)** they left behind remain.

The player’s next character may claim one of those Echoes as a **Legacy** — a personal Echo representing a claim on the predecessor’s standing, name, or unfinished work. Living up to it, rejecting it, or breaking under it is the story.

A Legacy confers **no automatic rank**. It only gives a recognised claim and a reason to strive.

Character death does not interrupt the session. Play continues. Diagram removal and Legacy creation are handled **after** the session. The player returns later with a new character created with the Storyteller ([Character Creation](/character-creation/)).

----------

### The Hierarchy Diagram

The Diagram is a shared record of every known and tracked character in the campaign. Visible to all players and the Storyteller.

Workflow (same pattern as [Inventory](/inventory/#management)):

1. Player requests add / remove / move via automation  
2. Storyteller approves  
3. Automation executes  

Dead characters are deleted. Their only remaining presence is through Echoes still carried by the living.

<aside class="kod-counsel" aria-label="Counsel">
<p>Any Kodranni story follows a larger community, yet it may diverge into solo strands focused on individuals. By design, every player’s story still feeds the shared legend.</p>
<p><em>A tale is but half told when only one person tells it.</em></p>
</aside>

----------

> _Don’t depend too much on anyone in this world, because even your own shadow leaves you when you are in darkness._  
> — Taqī ad-Dīn Aḥmad ibn Taymiyyah

Related: [Harm](/harm/), [Echoes](/echoes/), [Campaign Setup](/campaign-setup/), [Automation](/automation/).

----------
