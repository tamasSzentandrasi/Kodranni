# Click through

**Date:** 2026-10-22
**Log:** [capabilities.md](./capabilities.md). This is the pass over a temporary hall, not Aspalath.

The hall is `http://127.0.0.1:8742/`. The campaign slug is `lantern-watch`. The fifteen people are the Guidebook’s Aspalath roster, written into a temporary directory. The live Aspalath store is not opened, reseeded, or served. No tunnel. The edge control for this process is a closed local port, so a publish cannot attach a public name.

Open the pages below on this machine. The address is the desk: there is no `kod_desk=0` cookie unless a step says to set one. After each step, the expected line is what the page or the reply should show.

An HTTP pass on 2026-10-22 read the replies below. Those boxes are marked done. They were not clicked in a browser. The open boxes still need eyes on this hall. Discord is not connected here. The pass already wrote on the temporary record: Luca’s Fever is at 3 and then stabilised with the Trait “Lame left hand”; Mara’s Healing went from rating 1 to 0; Jakov’s empty short leap wrote nothing; Piero’s portrait was saved from PNG bytes. Tomaso’s Strength was raised and put back, and Carpentry & Masonry stayed at rating 2 with Practice 18.

## Desk

- [x] `/` shows Lantern Watch, not a tunnel, and the Storyteller Desk tools. HTTP: `/community/` is Lantern Watch, the words Storyteller Desk are in the page, and the page does not say tunnel or Go Live.
- [x] `/characters/tomaso/` shows the time-leap plate and the stabilise form. He is not Dying, so the form is in the page for when he is. The counsel reads: “Roll Resolve + Healing first. Then record the Trait that remains. An empty name still clears Dying. The track stays at 3.”
- [x] `/characters/tomaso/` with the player face (`kod_desk=0`) hides the time-leap plate and the stabilise form.
- [ ] A standard time leap, clicked on the plate, shows an omen, a count, the pool, and the picked names. Confirm writes that pick. Dismiss on a second proposal writes nothing. HTTP already did a short leap: an empty pick wrote nothing, a second confirm wrote nothing, dismiss wrote nothing, and a later short leap took Mara’s Healing from rating 1 to 0.
- [ ] Raise a Foundation that already has Practice over the new bar. The ruled Skill levels. HTTP raised Tomaso’s Strength from 2 to 3 and Carpentry & Masonry stayed rating 2, Practice 18, while the bar went from 72 to 36, because 18 was under the new bar. Putting Strength back left Practice 18 and restored the bar to 72. The level-up when Practice is already over the new bar is still to click.
- [ ] A desk hold that adds Practice changes the fraction and does not level by itself. A rating click changes the rank and recomputes the bar.
- [x] Put a harm track at 3. Dying comes on. Stabilise with a Trait name and a note. Dying clears, the track stays at 3, and the Trait remains on the next load. HTTP: Luca, Fever at 3, Trait “Lame left hand”, note “the fever left it”. The echoes page still shows the Trait and no Dying flag.
- [ ] Stabilise again is absent once Dying is clear. Lowering that track is allowed after Dying is clear.

## Sheet link

- [x] A character address with `?edit=` and a valid token answers 303, sets `kod_edit` as HttpOnly and SameSite=Lax, and the Location has no `edit`. The cookie is not Secure. HTTP: Tomaso’s link.
- [x] An address with `?edit=nope` stays on that address and does not set the cookie.
- [ ] An unlocked sheet saves an echo. The same token cannot save harm or Words. The route test covers this. It was not clicked on this hall.

## Public record

- [x] `GET /api/snapshot` returns the hall and the body has no notebook, no `table_state`, no Tide body, and no `pendingMoves`. `HEAD` is allowed. HTTP confirmed both.
- [x] `POST /api/snapshot` is refused.
- [x] Go Live from the player face (`kod_desk=0`) is refused and does not open a night. HTTP: 404, body “Not found”. The desk face was not asked to go live.

## Words

- [ ] The Guidebook row “A clearly superior” / “A világosan fölényben” reads 12 vs 8, length 19, start 12.
- [ ] Automation in both languages has no `/tide` command row, and the oppose sentence is still there. The desk is what posts the Tide.
- [ ] `/select` with one living character names that person.

## Left to the table, not this hall

These need Discord, which this temporary hall does not connect.

- A Dying character who spends no Exertion is refused. A spend that leaves Exertion at 0 posts “They died.” Undo restores the status, Dying, and Exertion.
- The result card has no Practice amount. A face of 5 or higher is bright.
- `kodranni start` does not launch the Discord gateway. Go Live on the Session tab still does. This pass does not press Go Live.
