# What this batch has to be capable of

**Date:** 2026-10-22
**Contract:** [fixes.md](./fixes.md). The Guidebook is the rules authority. This log is the behaviour the desk and the table have to show. It is updated as each capability lands. The click-through that checks them is [manual-test.md](./manual-test.md), written when the code is in.

A capability is landed only when the code and its targeted test agree. The sections below are landed. The full `npm test` run waits for a push.

---

## Practice

- A Skill’s bar comes from `practiceThreshold` and that Skill’s ruling Foundation, read from the raw score on the sheet. Harm does not change the bar.
- Foundation 0 or 1 doubles the bar. Foundation 2 leaves it. Foundation 3 or 4 halves it.
- Rating 0 stores the 0→1 bar, rating 1 the 1→2 bar, rating 2 and rating 3 the 2→3 bar. Rating 3 does not level further. The sentinel 9999 is not stored.
- A level-up subtracts the current bar, raises the rank, then asks for the next bar. Overflow keeps leveling until rating 3 or the remainder is under the bar.
- A new untrained row stores the 0→1 bar for its ruling Foundation.
- Raising a Foundation recomputes every Skill that Foundation rules, and levels a Skill whose Practice already meets the new bar. A lower Foundation does not rescale Practice.
- A desk hold that adds Practice, and a desk click that changes the rank, recompute the bar and do not level by themselves.
- Creation stores the bar of the rank just bought.
- Chat result cards do not print a Practice amount. The sheet shows the fraction.

## Time leap

- The Omen bands stay: standard 0/1/2/3 on faces 1–5, 6–10, 11–15, 16–20; short 0 then 1.
- The pool is sheet Skills with a rank or any Practice. Untouched catalog Skills stay out. At most five. Progress is Practice ÷ threshold. Rating 3 counts as progress 1. Ties break by name.
- The count is capped at the pool. The die is a fresh d20 at propose time. Confirm does not re-roll.
- A chosen Skill at rating 1–3 loses one rank and its Practice returns to 0. A chosen Skill at rating 0 loses its Practice. The new bar follows the ruling Foundation.
- The desk proposes, shows the face, the count, the pool, and the picked names, and stores that proposal beside the table, not on the character and not in the public snapshot.
- Confirm writes that pick. A pick that is no longer in a freshly computed pool is refused, and the person is unchanged. Dismiss writes nothing. A second confirm of a cleared proposal writes nothing. Count 0 changes no Skill.
- The player sheet cannot call it. Restore does not downgrade.

## Dying

- A Dying character who spends no Exertion cannot roll. A spend the current pool cannot cover is refused, including a second die when only one point remains. A second die still requires a named Echo.
- A legal spend that leaves Exertion at 0 sets the status to dead, clears the Dying flag, and leaves tracks and Echoes. The result card says they died.
- Undo of that roll restores the earlier status, the Dying flag, and Exertion.
- Stabilise is a desk confirm. It asks for a Trait name and a note, clears Dying, and leaves the track at 3. An empty name still clears Dying. The counsel says to roll Resolve + Healing first.
- Nothing auto-stabilises from a Mark count. There is no new chat command and no saving throw. A player sheet token cannot set Dying, death, or Exertion.
- A track at 3 cannot be lowered while Dying.

## Tide, as written

- The Guidebook row “A clearly superior” / “A világosan fölényben” is 12 vs 8, length 19, start 12, in English and in Hungarian. The same numbers are in the decisions note.
- The desk footings stay equal, slight, and severe.

## Desk boundary and the public record

- Go Live from the player face is refused. A tunneled Go Live stays refused. Loopback with the desk cookie off is the player face.
- `/api/snapshot` accepts GET and HEAD only.
- The Worker tells the hall the public host in `x-forwarded-host`, and forwards only the edit cookie and the campaign cookie.
- An avatar is accepted when the bytes are PNG, JPEG, WEBP, or GIF and agree with the extension. A desk icon or an item icon is PNG, JPEG, or WEBP. Sizes stay 4MB, 256KB, and 2MB.
- A sheet link that carries `?edit=` sets `kod_edit` as HttpOnly and SameSite=Lax, without Secure, and redirects to the same path without the query. Later sheet writes send that cookie. Page scripts do not read it.
- A public snapshot that still carries the notebook, `table_state`, or a Tide body is rejected. The publisher already omits them.
- The live community record does not keep `pendingMoves`. An empty derived faction list is not stored. A community file that still has the queue loads without it.
- The hall rebuild rule is the boundary for workspace packages. `node:sqlite`, `sharp`, and `discord.js` stay external. Origin checking stays off because the tunnel rewrites Host; player posts rely on JSON, the sheet HMAC, and SameSite cookies.
- The Worker does not import Node or the store barrel. It declares the store package whose subpaths the hall pictures use. `workers_dev` stays on. No custom-domain route. No `nodejs_compat`. The account, zone, and KV ids are not copied into this log.
- A portrait upload that fails still leaves the snapshot published.

## Words that match the desk

- Discord is the table. Fluxer keeps the card and is not started. Automation in both languages follows that, keeps the oppose sentence, and has no `/tide` command row. The desk posts the Tide.
- `/select` names the active character. The command is not described as unused when one character is alive.
- A label can carry an icon. The status note does not say a hierarchy move is waiting.
- Character creation is the shipped sheet. The status note does not call it unfinished.
- Exertion restore is the desk Restore on the person. README does not send the table to `/reclaim`.
- `kodranni start` does not launch the Discord gateway. Go Live on the Session tab still does. The image command is `kodranni start`.
- The demo seed print and the presence check name Aspalath’s fifteen. This batch does not reseed a live campaign.

## Already true, and kept

- An unlocked sheet saves echoes, traits, and inventory only.
- A Discord interaction more than five minutes off is refused, and one interaction id is forwarded once.
- Practice is awarded at rating 0. The roundel fills from that Practice. The centre stays ∅.
- Storyteller speech, `/roll` on a named sheet, the Ready-card die, the Marks line, and the Harm button stay the tools for a Healing scene.
