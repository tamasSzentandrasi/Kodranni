import { describe, expect, it } from 'vitest';
import {
  buildApprovalRequestCard,
  buildOmenBoardCard,
  buildRollConfirmCard,
  buildRollResultCard,
  buildTideCard,
  dieImageUrl,
  dieTierLabel,
  publicAssetUrl,
  seenClaimDelivery,
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
    expect(card.title).toBe('Tomas rolled 2 marks');
    expect(card.description).toContain('{{kod-die:d8}}');
    expect(card.description).toContain('\u001b[1;33m5');
    expect(card.description).toContain('\u001b[2;37m3');
    expect(card.description).toContain('Bright faces are Marks');
    expect(card.description!.indexOf('Bright faces are Marks')).toBeLessThan(
      card.description!.indexOf('\u001b[1;33m5'),
    );
    expect(card.fields?.find((f) => f.name === 'Marks')).toBeUndefined();
    expect(card.footer).toBe(dieTierLabel(8));
    expect(card.panels).toBeUndefined();
    expect(card.description).toContain('Strength + Carpentry');
    expect(card.fields?.find((f) => f.name === 'Omen')?.inline).toBe(true);
    expect(card.fields?.find((f) => f.name === 'Pool')?.inline).toBe(true);
    expect(card.fields?.find((f) => f.name === 'Pool')?.value).toBe('2+2 = 4d8');
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
    expect(card.accent).toBe('d8');
    expect(card.thumbnailUrl).toBeUndefined();
    const pictured = buildRollResultCard({
      characterName: 'Tomas',
      intentLine: 'x',
      poolFormula: '4d12',
      dieTier: 12,
      faces: [12],
      marks: 1,
      omen: null,
      omenHit: null,
      rollId: 'r3',
      portraitUrl: 'https://aspalath.kodranni.com/api/avatar/tomas',
    });
    expect(pictured.accent).toBe('d12');
    expect(pictured.thumbnailUrl).toBe('https://aspalath.kodranni.com/api/avatar/tomas');
    expect(pictured.description).toContain('{{kod-die:d12}}');
    expect(pictured.imageUrl).toBeUndefined();
    expect(dieImageUrl('https://aspalath.kodranni.com/', 12)).toBe(
      'https://aspalath.kodranni.com/dice/d12.png',
    );
    expect(dieImageUrl('http://127.0.0.1:8742', 8)).toBeUndefined();
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
      exertionCurrent: 3,
      poolFormula: '2+1 = 3d8',
      echoes: [{ title: 'Finish the mill' }],
    });
    expect(card.selects?.[0]?.options).toHaveLength(9);
    expect(card.selects?.find((s) => s.id.startsWith('roll-arch:'))?.options[0]?.value).toBe(
      'primitive',
    );
    expect(card.selects?.some((s) => s.id.startsWith('roll-tier:'))).toBe(false);
    expect(card.buttons?.some((b) => b.id === 'roll-tier-cycle:c1')).toBe(true);
    expect(card.buttons?.length).toBeLessThanOrEqual(5);
    expect(card.links).toBeUndefined();
    expect(card.fields?.find((f) => f.name === 'Foundation')?.value).toBe('Authority');
    expect(card.fields?.find((f) => f.name === 'Skill')?.inline).toBe(true);
    expect(card.fields?.find((f) => f.name === 'Echo')?.inline).toBe(true);
    expect(card.description).toContain('**2+1 = 3d8**');
    expect(card.description!.indexOf('The menus are')).toBeLessThan(
      card.description!.indexOf('**2+1 = 3d8**'),
    );
    expect(card.description).toContain('Ordinary');
    expect(card.footer?.startsWith('Only you see this card.')).toBe(true);
    expect(card.selects?.find((s) => s.id.startsWith('roll-echo:'))?.options[0]?.label).toBe(
      'Echo · None',
    );
    expect(card.selects?.some((s) => s.options.some((o) => o.label === 'Echo · Finish the mill'))).toBe(
      true,
    );
    expect(card.buttons?.some((b) => b.label.includes('Echo applies'))).toBe(false);
    expect(card.buttons?.some((b) => b.id === 'roll-cast:c1')).toBe(true);
    expect(card.buttons?.find((b) => b.id === 'roll-exert:c1')?.label).toBe('Exertion · 0');
    expect(card.buttons?.some((b) => b.id.startsWith('roll-tier-cycle:'))).toBe(true);
    expect(card.buttons?.some((b) => b.id.startsWith('roll-spend:'))).toBe(false);
    expect(card.accent).toBe('d8');
    const echoed = buildRollConfirmCard({
      confirmId: 'c2',
      characterName: 'Tomas',
      skill: 'Negotiation',
      foundation: 'Authority',
      foundations: ['Authority'],
      dieTier: 6,
      exertion: 1,
      exertionCurrent: 2,
      echoName: 'Finish the mill',
      poolFormula: '3d6',
      echoes: [{ title: 'Finish the mill' }],
    });
    expect(echoed.accent).toBe('d6');
    expect(echoed.buttons?.find((b) => b.id === 'roll-exert:c2')?.label).toBe('Exertion · 1');
    expect(echoed.buttons?.some((b) => b.id.startsWith('roll-tier-cycle:'))).toBe(true);
    expect(echoed.buttons?.length).toBeLessThanOrEqual(5);
    const empty = buildRollConfirmCard({
      confirmId: 'c3',
      characterName: 'Tomas',
      foundation: 'Strength',
      foundations: ['Strength'],
      dieTier: 8,
      exertion: 0,
      exertionCurrent: 0,
      poolFormula: '1d8',
      echoes: [],
    });
    expect(empty.buttons?.find((b) => b.label === 'Exertion empty')?.disabled).toBe(true);
    const dying = buildRollConfirmCard({
      confirmId: 'c4',
      characterName: 'Tomas',
      foundation: 'Strength',
      foundations: ['Strength'],
      dieTier: 8,
      exertion: 1,
      exertionCurrent: 3,
      dying: true,
      poolFormula: '2d8',
      echoes: [],
    });
    expect(dying.buttons?.some((b) => b.label === 'Exertion · 0')).toBe(false);
    expect(dying.buttons?.find((b) => b.id === 'roll-exert:c4')?.label).toBe('Exertion · 1');
    const illegal = buildRollConfirmCard({
      confirmId: 'c5',
      characterName: 'Tomas',
      foundation: 'Strength',
      foundations: ['Strength'],
      dieTier: 8,
      exertion: 2,
      exertionCurrent: 3,
      poolFormula: 'needs a named Echo',
      echoes: [],
    });
    expect(illegal.buttons?.find((b) => b.id === 'roll-exert:c5')?.label).toBe('Exertion · 2');
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

  it('builds a Tide picture card and omits a loopback image', () => {
    expect(publicAssetUrl('http://127.0.0.1:8742', '/session/tide.png?p=8')).toBeUndefined();
    const card = buildTideCard({
      sideA: 'Mill',
      sideB: 'Palace',
      position: 8,
      length: 15,
      sizeLabel: 'Skirmish',
      footingLabel: 'Equal footing',
      imageUrl: publicAssetUrl('https://aspalath.kodranni.com', '/session/tide.png?p=8'),
    });
    expect(card.imageUrl).toBe('https://aspalath.kodranni.com/session/tide.png?p=8');
    expect(card.buttons?.map((b) => b.id)).toEqual(['tide-roll', 'tide-close']);
    expect(card.description).toBe('The marker stands at 8 of 15.');
    const closed = buildTideCard({
      sideA: 'Mill',
      sideB: 'Palace',
      position: 8,
      length: 15,
      sizeLabel: 'Skirmish',
      footingLabel: 'Equal footing',
      closed: true,
    });
    expect(closed.description).toContain('Closed.');
    expect(closed.buttons).toBeUndefined();
    const board = buildOmenBoardCard({
      lines: [{ face: 7, effect: 'Positive Consequence' }],
    });
    expect(board.description).toBe('7. Positive Consequence');
    expect(board.description).not.toContain('whisper');
  });

  it('keeps the claim webhook until a portrait can be fetched', () => {
    const quiet = seenClaimDelivery({
      personName: 'Mara Vela',
      line: 'We see the sister at the mill.',
      targetSlug: 'mara',
      claimId: 'abc',
    });
    expect(quiet.webhook).toBeUndefined();
    expect(quiet.card.title).toBe('Mara Vela');
    expect(quiet.card.buttons?.some((b) => b.id === 'claim-second:mara:abc')).toBe(true);
    const spoken = seenClaimDelivery({
      personName: 'Mara Vela',
      line: 'We see the sister at the mill.',
      targetSlug: 'mara',
      claimId: 'abc',
      thumbnailUrl: 'https://aspalath.kodranni.com/api/avatar/mara',
    });
    expect(spoken.webhook).toEqual({
      username: 'Mara Vela',
      avatarUrl: 'https://aspalath.kodranni.com/api/avatar/mara',
    });
  });
});
