# Click through

**Date:** 2026-10-23
**Hall:** `http://127.0.0.1:8742/` · Aspalath · Storyteller Desk on
**Book:** `http://127.0.0.1:4321/Guidebook/` · this tree, not the public site
**Backup:** `/home/atari/.kodranni/backups/aspalath-2026-10-23-before-click`
**Log:** [capabilities.md](./capabilities.md)

You mark the boxes and write what you saw. The notes at the bottom are yours.

On 2026-10-23 the time-leap plate and the stabilise form left the sheet. Time leap is grouped on the Session tab. Standard and Short belong to the group. A player’s omen is thrown on the table. Someone who is not a player is simulated there. Stabilise opens a Healing card that names who is saved. The foundation, the die, Exertion, and an Echo are chosen on that card. The Trait is recorded on the Session tab. The checks above this note were made on the old sheet.

The desk is the hall on this machine. It does not open the public night, and it does not start Discord. Leave **Go live** alone. Do not reseed. Do not delete a person. The copy above is the reset: stop the desk, put that directory back over `~/.kodranni/campaigns/aspalath`, and start the desk again.

A temporary hall named lantern-watch was used for an HTTP pass on 2026-10-22. That hall is retired. Its checks are not this pass.

The numbers below are the store as it was when the desk was opened.

---

## The hall

- [x] Open `http://127.0.0.1:8742/community/`. The name is Aspalath. The record line says Storyteller Desk. There is no Go live in the header.
- [x] Press **Storyteller Desk** so it reads Off. Open `http://127.0.0.1:8742/characters/tomaso/`. The time-leap plate and the stabilise form are gone. The record line says live store.
- [x] Press **Storyteller Desk** so it reads On again. Reload Tomaso. The time-leap plate is back.

## Practice, then the Foundation

Tomaso Fero. Strength is II. Carpentry & Masonry is rating II, Practice 18. Climbing is rating I, Practice 4. A short click changes the rank. A hold changes Practice and does not change the rank.

- [x] On Climbing, left-click once. The centre becomes II. The fraction changes to the next bar. It does not keep climbing.
- [x] Right-click Climbing once. The centre is I again.
- [x] Press and hold Carpentry & Masonry (left button). Practice climbs. Let it pass the bar printed on the ring. The centre stays II. Keep holding until Practice is at least 36, then let go. Write the fraction you stopped on. | stopped on 36
- [ ] Left-click Strength once, II to III. Carpentry & Masonry becomes III. Practice drops by 36. Smithing & Forging (Practice 11, rating I) does not become II. Write both fractions. | Smithing stayed lvl 1 with 11/24, Carpentry & Masonry became III with a full practice circle and 18/48 Rating 2 claim on the hover, which I am guessing is a bug

The store after the pass: Carpentry & Masonry is rating III, Practice 0, bar 72, and Strength is back at II. Smithing is 11/48. The level-up happened. A fresh load of the sheet says “Rating 3 (max)”. The hover and the About line are written when the page opens, and the desk repaint does not change them. At rating III the fraction is hidden, so the old “Rating 2 · Practice 18/48” sentence is all that remains until reload. That sentence is the defect.
- [x] Right-click Strength back to II. Carpentry stays III. Practice is not scaled back up. Write the Strength fraction you see on a skill that did not level. | Smithing now says 11/48

## Time leap

Jakov Bracco, `http://127.0.0.1:8742/characters/jakov/`. One confirm is enough. It does downgrade.

- [x] Press **Standard**. The plate shows an omen, a count, the pool, and the picked names. Write those four. | Sailing & Navigation, Tradecraft, Sneak, Healing, Riding
- [x] Press **Confirm**. Reload. Each picked Skill at rating I–III is one rank lower and its Practice is 0. A picked Skill that was already untrained has lost its Practice. Write the names. | Sneak was lowered
- [x] Press **Standard** again. Press **Dismiss**. Reload. Nothing else moved. Write that.

!Note: I do believe this is invalid, clumsy usage, the Time leap would be much better handled on the Session tab, similar to, or together, with the group manager of the Restore & Restock. Additionally, the rolls should be exclusively made on the adapter, so that's another, perhaps better alternative, to handle time leaps.

## Dying

Luca Bandi, `http://127.0.0.1:8742/characters/luca/`. Fever starts clear.

- [x] Left-click the Fever pips until three are lit. The stabilise form appears. The counsel is: “Roll Resolve + Healing first. Then record the Trait that remains. An empty name still clears Dying. The track stays at 3.”
- [x] Open `http://127.0.0.1:8742/characters/`. Luca’s line shows dying. | Active Dying. And it should be in red, not green, and just say Dying.
- [x] Back on Luca, type a Trait name and a note. Press **Stabilise**. The form goes. Fever stays at three pips. Write the words the page used.
- [x] Open Echoes for Luca. The Trait is there. Dying is not.
- [x] Return to the sheet. The stabilise form is still absent. Right-click Fever once. A pip goes out. That click is allowed now.

!Note: I do believe this is clumsy usage, the roll to stabilise should really happen on the adapter (Discord or Fluxer), so there should be a special roll to stabilise/save (perhaps the latter name is more immersive), with the statuses visible in the sheets and lists.

## Tide on the desk

`http://127.0.0.1:8742/session/`. Do not press **Go live** or **Turn off**.

- [x] Type two side names. **Post the Tide** stays disabled until both names are there. Choose a size and move the footing slider. The label reads equal, slight disadvantage, or severe disadvantage. There is no “clearly superior” stop.
- [x] Press **Post the Tide**. The bar stays on the page. The note says the channel post waits until the table is live. If the note says it posted to the channel, stop and write that.
- [x] Press **Close the Tide**. The setup is open again.

## The book

These pages are the local book. `kodranni.com` does not have this tree yet.

- [x] `http://127.0.0.1:4321/Guidebook/tide/` and `http://127.0.0.1:4321/Guidebook/hu/tide/`. The row “A clearly superior” / “A világosan fölényben” is 12 vs 8, length 19, start 12.
- [x] `http://127.0.0.1:4321/Guidebook/automation/` and `http://127.0.0.1:4321/Guidebook/hu/automation/`. Neither command table has a `/tide` row. Both still have the sentence that Oppose on the result card opens the Ready card. Both say the Storyteller posts the Tide from the desk. `/select` names the active character, and with more than one living character it chooses which `/roll` uses.

## Not this sitting

These need Discord. Leave them.

- An unlocked sheet saves an echo. The same link cannot save harm or Words.
- `/select` with one living character names that person.
- A Dying character who spends no Exertion is refused. A spend that leaves Exertion at 0 says they died. Undo restores the status, Dying, and Exertion.
- The result card has no Practice amount. A face of 5 or higher is bright.
- An opposed reply rescores Practice for both sides. Harm on the card uses how far the loser lost. The winner’s card has no points from that exchange.
- On a Tide, a low Omen moves the marker toward side A’s collapse. A win for side A moves it the other way.

## Notes

Wrote them below the categories.
