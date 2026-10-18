# Chat cards

**Date:** 2026-10-17  
**Status:** The roll face, the Tide picture, the omen picture, the creation cards, and Fluxer’s reaction card are in the tree. Registering the slash list is still a separate operator step. This file does not perform it. Fluxer starts from Table chat. The Discord gateway stays stopped.

Discord and Fluxer render one card. The words, the die picture, and the accent colour are the same on both. The control that is a select or a button on Discord is the same choice on Fluxer. Until Fluxer ships slash commands and components (roadmap item 7, October 2026, still in development), that choice is a reaction on the same message. The adapter does not invent a second layout.

A chat client cannot draw the hall. It can show a short message, one colour bar, one fetched image, and a few choices. Seventy-two skills do not fit in one menu. A modal still holds five fields. An ephemeral reply can be edited for about fifteen minutes. A public message can be edited for as long as the bot holds its id.

---

## Die tier

The Guidebook die colours and the same drawn solids:

| Tier | Word | Accent | Picture |
|------|------|--------|---------|
| d6 | Disadvantage | `#6a9bb8` steel | `/dice/d6.png` |
| d8 | Ordinary | `#e6e0d4` bone | `/dice/d8.png` |
| d12 | Advantage | `#e0b44a` amber | `/dice/d12.png` |

The pictures are the Guidebook icons, rasterised on `#100e0c`. The result card, the Ready card, the Intent card, and each step of the picker use that tier’s accent and, when the hall address is a public `http` or `https` host, the picture as the thumbnail. Loopback is omitted. A chat client cannot fetch `127.0.0.1`.

The die tier does not change because Exertion was spent. Exertion adds a die. The tier is how the table situated the action.

---

## Choosing the roll

`/roll`, Oppose, and Tide Roll open one Ready card. A Discord string select is a flat list of at most 25 options, and an option cannot open another menu. The catalog is 72 skills in six Archetypes, and the largest Archetype has 12 skills, so the skill menu is that Archetype, not the whole book. Primitive rolls the Foundation alone.

The four menus are on the card together, in this order: Foundation, Archetype (Primitive first), Skill, Echo. A closed menu shows the chosen option, so each option is labelled with its menu. Skill and Archetype options carry a small emoji. The description names the menus, the die, and Exertion, with a blank line between those sentences, and the bold pool follows them. Inline fields repeat the same pairs. The card is one ephemeral reply, visible only to the player who opened it. Oppose sends a new ephemeral and leaves the public result where it is.

The row is Cast, Exertion, the die, and Cancel. Discord allows five buttons there. The die cycles Disadvantage, Ordinary, and Advantage and stays on the row. Changing it recolours the card and swaps the picture.

Intent still posts the agreed pool in the channel and keeps the Ready card private to the named player.

---

## Exertion

The option space is **0** or **1**. It includes **2** only when an Echo on that sheet is named and at least two points remain. Without that Echo the limit stays at 1.

Exertion is one button. Each press steps to the next legal spend, so the die button keeps its seat. Naming the Echo does not spend the point. The player can stay at 0 or 1 while the Echo is named, and the next press offers 2 when it is legal.

- **Empty** locks the control. The pool is already −2 dice, floored at 1. The card says `Exertion empty`.
- **Dying** cannot choose 0. Every roll spends a point. At zero while Dying, the roll is the death the Guidebook already states, and the control cannot invent a point. 2 is still there when the Echo and the points allow it.

A slash option of 2 with no Echo stays visible, and the pool line says a named Echo is required. Choosing 2 again, still with no Echo, does not change the spend. Choosing 0 or 1 does.

---

## Result, Oppose, Harm, Undo

The public result is one message. The title is the character and how many marks they rolled. The description says that a face of 5 or higher is a Mark and that Marks are bright in the roll, then colors each face, then the die and the intent. The pool stays in the Pool field. A whispered face keeps the number and leaves the line off. Omen sits beside Pool. The accent and the die picture are the tier. Buttons, in one row: Oppose, Why this pool?, and for the Storyteller Harm and Undo.

Oppose opens that player’s private walk, already tied to the roll. Harm is the track select that already exists. Undo edits nothing in the channel yet. It restores the spend and says so to the Storyteller. When the result message is edited in place, the control comes off that message. That edit uses the channel message id, not the fifteen-minute interaction token.

NPC roll is the same result card, plus the whispered line in the Storyteller’s private reply.

---

## Private dice

Birth Omen and Guiding Hand use the typer’s active character and offer only an optional face. They stay ephemeral words: the weighing, the face, the points now on the sheet. No picture. `/award-word` requires the character’s name, stays Storyteller-only, and mentions that character’s player. Fluxer sends the same line by direct message.

---

## Tide picture

The Tide is the message that carries a picture of the Guidebook bar: both dyes, the marker, the side names, size, footing. The text under it repeats the marker sentence so the line can be quoted. The bot stores the message id and replaces the picture when a roll steps the marker. It does not follow the desk slider. An ephemeral Tide dies in about fifteen minutes. A spoiler blur is not a secret.

Fluxer gets the same PNG on the embed and the same edit. A reply to that message is the step until a button exists.

---

## Scene board

One rendered net, whispered faces blank, the public lines listed under it. Edited when the Storyteller is finished with the scene, not on each keystroke. Twenty separate images would be packed as a gallery and would break the shared edges. The desk remains the only editor.

---

## Creation

`/create` opens the draft and points at the sheet. The sheet is the form. A modal cannot hold it.

The two weighings are the private dice above.

An accepted claim can be posted through a webhook under that person’s name and portrait, once the portrait is on a host the client can fetch. The edge has no webhook op, so the channel card uses the person’s name as the title and the portrait as the thumbnail when that host can be fetched. The webhook username waits. The desk still makes the mark. The speaker still does not choose it. Seconding, accepting, and the two refusals are controls on that short public card. The store enforces one accepted claim per speaker per person. Both the Storyteller and the person have to refuse before the claim is closed.

The Wanting is a private select of the four purchases. The select records the choice and does not spend the Word. Several staged lines are one write, and a line that cannot fit leaves the sheet unchanged. Confirming reloads the tab the player is already on. The sheet names the pay, and the Storyteller approves it there, including any Negative Trait. `/award-word` remains the only faucet. Accepting a claim grants the speaker one Word through that same grant.

Confirm is one channel line and one Session inbox row. Approve and Send back stay on the desk. Send back reopens the draft, keeps the edits, and the sheet says so. The play channel stays quiet.

---

## Fluxer until components

The payload is the same embed: title, description, fields, the tier colour, the die thumbnail. The mapper still carries buttons in the components array for the day item 7 ships. That array stays off the wire. `sendCard` posts the embed and adds one reaction per enabled button. A reaction the sender may not use is removed. A spent choice edits the embed and clears the reactions. The same command words follow `!` on the message. Table chat starts the gateway. A message or a reaction is the interaction. The Worker interaction URL stays Discord’s.

Threads, forums, and a Discord Activity that iframes the hall are not this contract. Speech stays in the channel.

---

## In this tree

- Die pictures at `apps/campaign-ui/public/dice/d6.png`, `d8.png`, `d12.png`.
- Roll, Intent, and Ready cards take the tier accent. The thumbnail is set only for a public hall address.
- One Ready card holds Foundation, Archetype (with Primitive), that Archetype’s skills, and Echo. The explanation sits above the pool.
- Exertion is one cycle. It is 0 or 1, and 2 only when an Echo is named and two points remain. The die button stays beside it.
- Discord and Fluxer mappers both read `cardAccentColor`, `thumbnailUrl`, and `imageUrl`.
- The Tide picture and the omen net are SVG in `packages/hall-render`. The hall serves `/session/tide.png` and `/session/omens.png`. A loopback address omits the image.
- An opposed roll steps an open Tide and the bot edits the stored message. Unopposed rolls do not. Close is a button on that message. The desk slider does not edit it. There is no `/tide` command.
- Post the omens, on the desk, posts or edits one public net when the Storyteller is finished. Whispered faces are blank, and their lines are not under the picture.
- `/create` carries The Wanting. The select stages the purchase. Send back sets `creation.returned` and the sheet says the draft is open.
- Fluxer maps one reaction per enabled button and `resolveFluxerReaction` decides who may use it. `sendCard` posts that embed and those reactions to `https://api.fluxer.app/v1`. The web app host refuses the same post. The command words follow `!` or `/`. Table chat starts the gateway and can turn it off.
- A Fluxer message does not carry roles. The hall reads the member and treats the saved Storyteller role as the Storyteller. `!roll` takes one name when that name matches a single sheet. The Ready card has no menus there: reply to it with a skill, an Archetype, or Primitive. 🎲 steps the die, ➕ steps Exertion, 🎯 casts, and ✕ cancels.

## Still later

The edge workflow uploads the Worker, then registers the slash list when the Actions token and app id are set. Those secrets are unset, so the step logs a skip and the live list stays the last guild registration. The gateway stays stopped. The public name is `https://<slug>.kodranni.com/`. `?campaign=` still works on the apex. The founding command is in [hosting.md](./hosting.md).
