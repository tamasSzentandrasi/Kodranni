# Documentation Gaps & Open Design Questions

Living checklist. Author marks: **✅** pursue · **🚫** do not pursue · **❓** maybe / caution.

**Status:** how-to-play removed; Dice Mechanics first after Introduction; design questions C1–C10 resolved into rules/architecture from author notes (2026-08).

---

## A. Structural / guidebook completeness

| Gap | Priority | Notes | Mark |
|-----|----------|--------|------|
| Worked examples (full roll walkthroughs) | High | Incorporate **inline** at the relevant mechanic — not a separate examples chapter | ✅ |
| Storyteller chapter (pitfalls, pacing, when not to roll) | High | Intro + “when to roll” in Dice Mechanics may suffice | ❓ |
| Character sheet reference | Medium | Empty structure OK; real product is high-visual **shared sheet** (automation), not a long rules page | 🚫 |
| Community sheet reference | Medium | Same — Community Tracker product surface | 🚫 |
| Examples of Echo wording | Medium | — | 🚫 |
| Foundation Myth examples | Medium | Craft UI + toggle effects matter more than prose catalogue | 🚫 |
| Trait catalogue (optional, non-normative) | Low | Keep custom-first | 🚫 |
| Aging / trauma Foundation shifts | Medium | Mentioned as possible; no procedure | ❓ |
| Skill degrade procedure | Medium | **Locked** in Skills (prompted Omen procedure) | ✅ done |
| Multi-character / downtime montage rules | Low | — | 🚫 |
| Solo strand guidance | Low | — | 🚫 |
| Language / literacy | Low | Trait-only for now | ❓ |
| README deploy / hosting | Medium | Starlight plan | ✅ |
| Visual identity | Low | High ceiling: imagery, possible motion, roman list cues — simple wins count too | ❓ |
| Non-English / accessibility pass | Low | Later | 🚫 |
| How-to-play chapter | — | **Rejected** — unnecessary; examples + when-to-roll rule suffice | 🚫 removed |

---

## B. Cross-reference integrity

**Current IA**

- Start here: Introduction → **Dice Mechanics** → Glossary  
- Human Potential · Resolution & Continuity · Getting Started · Automation  

**Still to verify after each edit**

- Anchor IDs match Starlight’s slugger  
- No orphan pages (how-to-play fully gone)  
- Splash `index.mdx` actions stay current  

---

## C. Open design questions

Author positions integrated as below. Rules/architecture updated accordingly.

### C1. Base dice tier

**Decision:** Storyteller declares every time (**option 3**), with **safe default d8** (**option 1** as default only).  
**Guide:** [Dice Mechanics — Die tier](../../src/content/docs/dice-mechanics.md).

### C2. Advantage stacking

**Decision:** Storyteller’s decision on result interpretation for that moment. Automation stores the final declared tier.

### C3. Tide arithmetic completeness

**Decision:** Interpret current function with a **descriptive** example (not a full grind).  
**Guide:** Tide setup formula + short mill-raid example in Dice Mechanics.

### C4. Opposed 1vMany / ManyvMany

**Decision:** Each action is individual; Advantage/Disadvantage from that action’s context. Tide holds collective pressure.

### C5. Practice edge cases

**Decision:**

- Margin 0 → no forced formula award; fiction/ST.  
- Primitive → **no Practice**.  
- Degrade → prompted only; five lowest-progress Skills; Omen selects 0/1/2/3 to degrade (bands 0–4, 5–9, 10–14, 15–20); short leap 0–1 on (0–9, 10–20).

**Guide:** Skills — Improvement / Degradation.

### C6. Harm & protection

**Decision:** Storyteller chooses track; **no mixed** physical+social events; floor rounding confirmed.

### C7. Foundation Myths application

**Decision:** Effects toggleable and compoundable; ST-only craft; trigger by **explicit tag on the roll** (Echo-like).

### C8. Weighing automation depth

**Decision:** Character created at Concept with budgets; Omen rolls automated; Word/Wanting boons = ST instruction for target character option.

### C9. Rest & food double-dipping

**Decision:** **Separate** commands for Exertion reclaim and Harm heal. Narrative first; automation updates state only.

### C10. Maximum Hierarchies

**Decision:** Hard cap **five** — Diagram lives on Community Tracker.

---

## D. Tone and editorial

| Issue | Action |
|-------|--------|
| Heading depth | Prefer H2 for chapter sections |
| Dash consistency | Editorial pass when touching files |
| “bot” vs “automation” | Prefer **automation** in player text; platform **bots** in technical pages |
| Inline examples | Add at mechanic sites over time (✅) |

---

## E. Suggested next content work

1. More **inline** examples (Primitive roll, Dying stabilisation, Echo invoke) where those rules sit.  
2. Keep C1–C10 as locked unless rules change.  
3. Sheet/tracker: empty structural wireframes in product repo — **highest visual requirement** long-term.  
4. Guidebook visual theme pass (high ceiling; roman numerals / small craft wins allowed).  
5. **No** standalone examples.md or storyteller.md unless ❓ items reopen.

---

## F. Capability ↔ doc coverage matrix

| Capability | Rules home | Automation page | Architecture plan | Notes |
|------------|------------|-----------------|-------------------|--------|
| Dice pools & Marks | dice-mechanics | Yes | Yes | Tier ST-declared + d8 default |
| Omen / Consequences | dice-mechanics | Yes | Yes | |
| Opposed margins | dice-mechanics | Yes | Yes | Per-action |
| Tide | dice-mechanics | Yes | Yes | Example + formula |
| Practice / level-up / degrade | skills | Yes | Yes | C5 locked |
| Exertion | exertion | Yes | Yes | Separate from Harm heal |
| Echoes / Decadence | echoes | Yes | Yes | |
| Fortunes | echoes | Yes | Yes | Tracker |
| Foundation Myths | echoes | Yes | Yes | Tag + craft UI |
| Harm / Dying | harm | Yes | Yes | ST track; no mix |
| Hierarchies / Legacy | hierarchies | Yes | Yes | Max 5 |
| Inventory | inventory | Yes | Yes | |
| Character creation / Weighing | character-creation | Yes | Yes | C8 |
| Campaign / community | campaign-setup | Yes | Yes | Per-community backend |
| Shared sheet / tracker | automation | Yes | Yes | SSOT |
| Fluxer + Discord | automation | Yes | Yes | Dual adapters |
