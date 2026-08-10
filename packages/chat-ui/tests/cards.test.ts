import { describe, expect, it } from 'vitest';
import { buildApprovalRequestCard, buildRollResultCard } from '../src/index.js';

describe('chat-ui cards', () => {
  it('roll card has Marks dominant field and oppose button', () => {
    const card = buildRollResultCard({
      characterName: 'Eira',
      intentLine: 'Strength + Shipwright · d8',
      poolFormula: '2+2 = 4d8',
      dieTier: 8,
      faces: [3, 5, 8, 2],
      marks: 2,
      omen: 11,
      omenHit: null,
      rollId: 'r1',
      showOppose: true,
    });
    expect(card.fields?.[0]?.name).toBe('Marks');
    expect(card.fields?.[0]?.value).toContain('2');
    expect(card.buttons?.some((b) => b.id === 'oppose:r1')).toBe(true);
    expect(card.accent).toBe('blood');
  });

  it('approval card has Approve and Deny', () => {
    const card = buildApprovalRequestCard({
      requestId: 'q1',
      title: 'Inventory',
      body: 'Add named item: mill ledger',
      requesterName: 'Eira',
    });
    expect(card.buttons?.map((b) => b.label)).toEqual(['Approve', 'Deny']);
  });
});
