---
title: Harm
description: The nine Harm tracks, Dying, recovery, and protection ratios.
---

> _*Deyr fé, deyja frændur, deyr sjálfur ið sama.*_  
> _*Cattle die, kinsmen die, you yourself will also die.*_  
> — Hávamál

<figure class="kod-breath not-content">
<img src="/scenes/wound-care.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

----------

Kodranni does **not** track hit points. It tracks the **unravelling of the nine [Foundations](/foundations/)**.

**Harm** is recorded on nine named tracks. Each track is permanently paired with one Foundation. Every point of Harm reduces that Foundation by one for dice purposes.

<div class="kod-harm-grid not-content">
<div class="kod-harm-col kod-harm-col--phys">
<p class="kod-harm-col__label">Physical</p>
<ul>
<li><strong>Crushed</strong> ← Strength</li>
<li><strong>Bleeding</strong> ← Dexterity</li>
<li><strong>Fever</strong> ← Constitution</li>
</ul>
</div>
<div class="kod-harm-col kod-harm-col--ment">
<p class="kod-harm-col__label">Mental</p>
<ul>
<li><strong>Fog</strong> ← Intellect</li>
<li><strong>Disoriented</strong> ← Perception</li>
<li><strong>Shock</strong> ← Resolve</li>
</ul>
</div>
<div class="kod-harm-col kod-harm-col--soc">
<p class="kod-harm-col__label">Social</p>
<ul>
<li><strong>Tarnished</strong> ← Charisma</li>
<li><strong>Exposed</strong> ← Guile</li>
<li><strong>Disgrace</strong> ← Authority</li>
</ul>
</div>
</div>

- Tracks run from **0 to 3**.  
- Effective Foundation = max(0, Foundation − Harm points).  
- Dice pools never drop below **1** die, regardless of Harm.

The Storyteller assigns points according to the fiction. The track name is only the mechanical label.

----------

## Inflicting Harm

Harm arises only when the fiction **and** the dice justify lasting damage.

| Roll type | Harm points |
|-----------|-------------|
| **[Opposed](/dice-mechanics/#situational-dice-resolution)** | Marks difference ÷ protection ratio (**always floor**) |
| **Unopposed** (falls, environment, dangerous acts) | (failures − Marks) ÷ protection ratio (**always floor**, minimum 0) |

**Protection ratios**

| Protection | Ratio |
|------------|-------|
| No armour / no relevant Reputation | ÷1 |
| Light armour / moderate Reputation advantage | ÷2 |
| Heavy armour / strong Reputation advantage | ÷3 |

- The **Storyteller chooses the Harm track** when fiction is ambiguous.  
- **No mixed events:** a given infliction is physical **or** social/mental — not both stacked. Physical protection uses donned [armour](/inventory/) (None / Light / Heavy). Social and mental protection uses **Reputation** (relative [Hierarchy](/hierarchies/#reputation) position). Maximum Reputation gap for ratio purposes is two tiers (e.g. Ruler against Outcast).

Be frugal. Most successful hits produce **0 or 1** point. Two points is notable. Three in a single exchange is rare.

<aside class="kod-example">
<p class="kod-example__scene">In the yard fight a spear finds a gap under the edge of light mail. The opposed exchange went clearly for the attacker (margin of 3 Marks). The armour still matters: it halves lasting injury. The Storyteller reads a physical wound that steals fine control of the hand — not a social humiliation on the same blow.</p>
<ol class="kod-example__steps">
<li><strong>Opposed margin:</strong> 3 Marks (attacker ahead).</li>
<li><strong>Protection:</strong> light armour → divide by 2.</li>
<li><strong>Harm points:</strong> floor(3 ÷ 2) = <strong>1</strong>.</li>
<li><strong>Track (ST chooses from the fiction):</strong> Bleeding (Dexterity) +1 — the wound is in the arm; the hand shakes.</li>
<li><strong>Not mixed:</strong> this event does not also apply a social or mental track.</li>
</ol>
</aside>

----------

## Dying

When any Harm track reaches **3**, the character is **Dying**.

- While Dying, **every roll requires [Exertion](/exertion/)**.  
- When Exertion reaches **0**, the character **dies**.

This window allows final actions, last words, or desperate stabilisation. Stabilisation requires a successful **[Healing](/skills/#mother-12)** attempt and removes the Dying state; the track remains at 3 until further recovery, and almost always leaves a permanent **[Trait](/traits/)**.

After death: remove the character from the [Hierarchy Diagram](/hierarchies/#the-hierarchy-diagram). Continuity continues through [Echoes](/echoes/) and [Legacies](/hierarchies/#legacies). Play does not stop mid-session for full character replacement.

<aside class="kod-example">
<p class="kod-example__scene">The wound went bad on the road. Fever has climbed for two days; when the Fever track hits 3, the character is <strong>Dying</strong>. They can still speak and act, but every effort spends what little strength remains. A companion works through the night with herbs and steady hands.</p>
<ol class="kod-example__steps">
<li><strong>Fever</strong> reaches 3 → character is <strong>Dying</strong>.</li>
<li><strong>While Dying:</strong> every roll costs <a href="/exertion/">Exertion</a>. When Exertion hits 0 → death.</li>
<li><strong>Stabilise:</strong> companion rolls Resolve + Healing and succeeds → Dying ends. The Fever track stays at 3 until recovery work clears points. A permanent <a href="/traits/">Trait</a> usually remains (scar, limp, weakened chest — Storyteller names it).</li>
</ol>
</aside>

----------

## Recovery

Recovery is slow and depends on rest, care, and nourishment.

| Condition | Effect |
|-----------|--------|
| Short rest | May clear 1 point from a single track if fed and tended |
| Long rest | May clear 1–2 points depending on care, shelter, and food |
| No food or water | Reduces or negates recovery |
| Track at 3 | Can only be reduced after Dying has been stabilised |

[Inventory](/inventory/) (bandages, herbs, clean water, shelter as fiction) and rest quality matter. The Storyteller judges what the situation allows.

----------

## Worsening and Omens

All Harm can worsen.

The Storyteller may load custom [Omen](/dice-mechanics/#the-omen-die-and-consequences) faces for infection, secondary bleeding, spreading fever, growing shame, and similar deterioration. When those faces appear, additional Harm applies. Positive Consequences may reduce or prevent Harm.

Ordinary faces **7** and **13** remain available for the same purpose at the Storyteller’s discretion.

----------

<aside class="kod-note" aria-label="Note">
<p><em>Don’t worry. I’ll kill you eventually.</em></p>
</aside>

Related: [Dice Mechanics](/dice-mechanics/), [Exertion](/exertion/), [Hierarchies](/hierarchies/), [Automation](/automation/).

----------
