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
    const withSt = buildRollResultCard({
      characterName: 'Tomas',
      intentLine: 'x',
      poolFormula: '4d8',
      dieTier: 8,
      faces: [8],
      marks: 1,
      omen: null,
      omenHit: null,
      rollId: 'r2',
      showStPalette: true,
    });
    expect(withSt.buttons?.some((b) => b.id.startsWith('st-harm:'))).toBe(true);
    expect(withSt.buttons?.some((b) => b.id.startsWith('undo:'))).toBe(true);
    expect(withSt.buttons?.some((b) => b.id.startsWith('st-exert:'))).toBe(false);
    expect(card.links?.[0]?.label).toBe('Live sheet');
    expect(card.accent).toBe('blood');
  });

  it('confirm card shows the pool, Ordinary, and a named Echo', () => {
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
      poolFormula: '2+1 = 3d8',
      echoes: [{ title: 'Finish the mill' }],
    });
    expect(card.selects?.[0]?.options).toHaveLength(9);
    expect(card.fields?.find((f) => f.name === 'Pool')?.value).toBe('2+1 = 3d8');
    expect(card.fields?.find((f) => f.name === 'Tier')?.value).toBe('d8 · Ordinary');
    expect(card.fields?.find((f) => f.name === 'Echo')?.value).toBe('None');
    expect(card.selects?.some((s) => s.options.some((o) => o.label === 'Finish the mill'))).toBe(
      true,
    );
    expect(card.buttons?.some((b) => b.label.includes('Echo applies'))).toBe(false);
    expect(card.buttons?.some((b) => b.id === 'roll-cast:c1')).toBe(true);
    expect(dieTierLabel(8)).toBe('d8 · Ordinary');
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
