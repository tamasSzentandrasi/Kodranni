import { describe, expect, it } from 'vitest';
import {
  buildApprovalRequestCard,
  buildRollConfirmCard,
  buildRollResultCard,
  dieTierLabel,
} from '../src/index.js';

describe('chat-ui cards', () => {
  it('roll card has Marks dominant field and oppose button', () => {
    const card = buildRollResultCard({
      characterName: 'Tomas',
      intentLine: 'Strength + Carpentry & Masonry · d8',
      poolFormula: '2+2 = 4d8',
      dieTier: 8,
      faces: [3, 5, 8, 2],
      marks: 2,
      omen: 11,
      omenHit: null,
      rollId: 'r1',
      showOppose: true,
      liveSheetUrl: 'https://example.test/characters/tomas/',
    });
    expect(card.fields?.[0]?.name).toBe('Marks');
    expect(card.fields?.[0]?.value).toContain('2');
    expect(card.fields?.find((f) => f.name === 'Dice')?.value).toContain(dieTierLabel(8));
    expect(card.buttons?.some((b) => b.id === 'oppose:r1')).toBe(true);
    expect(card.links?.[0]?.label).toBe('Live sheet');
    expect(card.accent).toBe('blood');
  });

  it('confirm card exposes all Foundations and Echo as apply, not spend', () => {
    const card = buildRollConfirmCard({
      confirmId: 'c1',
      characterName: 'Tomas',
      skill: 'Negotiation',
      foundation: 'Authority',
      foundations: [
        'Strength',
        'Dexterity',
        'Constitution',
        'Intellect',
        'Perception',
        'Resolve',
        'Charisma',
        'Guile',
        'Authority',
      ],
      dieTier: 8,
      exertion: 0,
      echoApplies: false,
    });
    expect(card.selects?.[0]?.options).toHaveLength(9);
    expect(card.buttons?.some((b) => b.label.includes('Echo applies'))).toBe(true);
    expect(card.buttons?.some((b) => b.id === 'roll-cast:c1')).toBe(true);
  });

  it('approval card has Approve and Deny', () => {
    const card = buildApprovalRequestCard({
      requestId: 'q1',
      title: 'Inventory',
      body: 'Add named item: pitch pot',
      requesterName: 'Tomas',
    });
    expect(card.buttons?.map((b) => b.label)).toEqual(['Approve', 'Deny']);
  });
});
