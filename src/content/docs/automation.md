---
title: Automation
description: One living record, the Storyteller Desk, and the same chat contract on Discord and Fluxer.
---

----------

## Why Automation Exists

Kodranni is a **hybrid** tabletop system: storytelling first, software as ledger and dice engine underneath. Without automation, several procedures in this Guide would drown the table in bookkeeping.

### What the table gains

- **One living record** per character and community — no divergent notebooks.
- **Fast resolution** of pools, Omens, margins, Practice, Exertion, Harm, and Tide — so fiction is not stopped for arithmetic.
- **State at the moment of action** — who is rolling, Exertion left, Echoes, Myths — without retyping sheets into chat.
- **Online continuity** between sessions on the shared hall and sheets.

This page is the contract at the table. The hall and the sheets are one record. On the machine that holds that record, the same pages are the **Storyteller Desk**, and the tools for changing the record are there. Discord and Fluxer carry the dice, the Tide, and the words said in chat. Harm from a roll just shown is applied on that result card, and on the desk.

----------

## One record

| Surface | Who uses it | What it holds |
|---------|-------------|---------------|
| **Guidebook** (this site) | Everyone | The rules |
| **Hall and sheets** | The table | Fortunes, Foundation Myths, the Hierarchy Diagram, factions, the character map, and one sheet per person — Foundations, Skills (including Practice), Traits, Exertion, Echoes, Harm, inventory |
| **Storyteller Desk** | Storyteller | Those same pages, on the machine that holds the record, with the tools to change them |
| **Discord** and **Fluxer** | The table | Rolls, the Tide card, the scene board, Weighing dice, Words |

One sheet per character. Practice is visible to anyone who looks. Discord and Fluxer both read and write this record.

Kept off the standing hall, because they belong to the session:

- **Tide** — one open bar. When it closes, the card remains as history. It is not a Fortune.
- **Scene Omen faces** — written for this scene. Faces **7** and **13** are always in force. Any other face is a line the Storyteller writes on the desk. The channel shows the list and what each face does.
- **Restore** — after a rest has been played, the Storyteller records food, water, and Exertion on the desk.

----------

## Discord and Fluxer

Discord and Fluxer are one chat contract. Each binds a server, a play channel, and the Storyteller role, and maps accounts to characters. A command means the same thing on both.

Players keep one address for the hall. While the session is up, that address is the live table. When the session is down, it shows the last public record. Account maps stay on the Storyteller’s machine.

### Commands

| Command | Who | What it does |
|---------|-----|----------------|
| `/roll` | The bound player | Rolls that character. Foundation, Skill, die tier, Exertion, and which Echo applies. |
| `/select` | A player with more than one living character | Chooses which of them `/roll` assumes. With one character, it is unused. |
| `/roll` and a name | Storyteller | Rolls a sheeted NPC in that person’s name. The sheet supplies the numbers. |
| `/npc-roll` | Storyteller | Someone with no sheet: a label, foundation dice, skill dice, a tier. Harm has no track to land on. |
| `/intent` | Storyteller | Posts an agreed pool for a named player. |
| `/create`, `/claim` | Player | Opens a draft, or claims a person left ready. |
| `/birth-omen`, `/guiding-hand` | That player and the Storyteller | Private dice. The points land on the draft. |
| `/award-word` | Storyteller | Banks one Word on the speaker, for their own Wanting. |
| `/tide` | Storyteller | Opens the Tide card. |
| `/review` | Storyteller | Repeats the notice that a character is waiting on the desk. |

A reply to a roll is an opposed roll. A reply to the Tide card, or to a roll already tied to it, steps the Tide. The result is a channel message. Pairs of Foundation and Skill need not match.

----------

## At the table

1. **Fiction first.** In the scene the Storyteller names Foundation and Skill, or Foundation alone for a [Primitive](/dice-mechanics/) action, and the die tier. The safe default is **d8**. [Advantage and Disadvantage](/marks-and-tiers/#advantage-and-disadvantage) are the Storyteller’s call.
2. **The player rolls.** `/roll` uses the character bound to that account. The sheet already knows Exertion, Echoes, and Myths. The player confirms the spend and which Echo applies, when the table has agreed the Echo matches.
3. **The pool has a floor of 1 die.**
4. **The card is the result.** Marks, the Omen, and why the pool is that size. The Storyteller can undo that roll from the card.
5. **Derived state stays derived.** Decadence and over-capacity follow from the sheet. Armour and Reputation are written on the sheet once the fiction has settled them.

**A sheeted NPC.** The Storyteller uses `/roll` with that person’s name. Effective Foundation, Skill, armour, Exertion, Echoes, and Harm tracks come from the sheet.

**Someone with no sheet.** `/npc-roll`. A label and the dice. Most people in the world never receive a sheet. A sheet is for player characters and for people who will return.

**Opposed, and Tide.** Reply, as above.

----------

## Where the record changes

**Tide.** `/tide` posts one card. The Storyteller sets the size (small skirmish, skirmish, battle), the footing, the two side names, and a colour for each side. The card shows the bar from the [Tide](/tide/) chapter, and every linked reply updates that picture. The Storyteller closes the Tide from the card. The desk shows whether one is open.

**Scene faces.** The Storyteller adds, edits, and clears them on the desk. Saving rewrites the channel board the table is reading.

**Confirm.** Sending a character in posts a notice in chat and places that version on the desk. The Storyteller opens it, edits it as they would any other person, then approves it into play or sends it back with those edits kept. `/review` only repeats the notice.

**Restore.** On the desk, the Storyteller chooses who rested. For each person: spend a food day or leave it, spend a water day or leave it, and type how many Exertion points return. The suggestions under [Replenishment](/exertion/#replenishment) are counsel for that number. Harm is a separate edit on the person. A player who was included can receive a private notice.

**The hall and the person.** Fortunes are the five buttons, from Crisis through Abundance. A move on the diagram is spoken, then the Storyteller makes it on the desk. Factions live inside their categories. Echoes, inventory, Traits, Practice, and armour are edited on the person. A gift of food or water is an edit on the two sheets. The character map is downloaded, edited outside the hall, and uploaded by the Storyteller. Practice degrade, when a stretch of time demands it, is proposed and confirmed on that person.

**Harm** from the roll just shown is applied on the result card. Stabilising someone at Dying is an edit on that person: Dying clears, the track stays at 3, and the Trait that usually remains is written there.

----------

## Weighing (automation depth)

- The character record opens at **Character Concept**, with Foundation and Skill budgets granted.
- **Birth Omen** and **Guiding Hand**: the dice are private to that player and the Storyteller. The points land on the draft.
- **Words / Wanting**: `/award-word` banks one Word on the speaker. They spend it on **their own** sheet, from the menu. The Storyteller marks the **target** of the accepted claim by editing that person. A Wanting result the table rejects is corrected by editing fields. The theatre stays human.

----------

Related: [Dice Mechanics](/dice-mechanics/), [Character Creation](/character-creation/), [Hierarchies](/hierarchies/), [Tide](/tide/), [Exertion](/exertion/).

----------
