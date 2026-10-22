import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { skillThreshold } from '@kodranni/domain';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import {
  deskAddAxis,
  deskAddNpc,
  deskEditCharacter,
  deskFoundFortunes,
  deskFoundationStep,
  deskHarmStep,
  deskLabelHue,
  deskMarkDead,
  deskPlace,
  deskRemoveAxis,
  deskRemoveCharacter,
  deskRenameAxis,
  deskSetAxisLook,
  deskSetFortuneLevel,
  deskSetFortuneLook,
  deskSetMyths,
  deskSkillStep,
  deskStabilise,
} from '../src/index.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function demoStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kod-desk-'));
  dirs.push(dir);
  const store = openSqliteStore(join(dir, 'c.sqlite'));
  seedDemoCampaign(store);
  return store;
}

describe('desk fortunes and myths', () => {
  it('stores a state before founding and founds on confirm', () => {
    const store = demoStore();
    const community = store.getCommunity();
    delete community.fortunesFoundedAt;
    delete community.fortuneMeta;
    store.putCommunity(community);
    deskSetFortuneLevel(store, 'vitality', 0);
    expect(store.getCommunity().fortunesFoundedAt).toBeUndefined();
    expect(store.getCommunity().fortunes.vitality).toBe(0);
    deskFoundFortunes(store);
    expect(store.getCommunity().fortunesFoundedAt).toBeTruthy();
    deskSetFortuneLevel(store, 'cohesion', 3);
    expect(store.getCommunity().fortunes.cohesion).toBe(3);
    expect(store.getCommunity().fortuneMeta?.cohesion?.source).toBe('st');
    store.close();
  });

  it('keeps three myths and five rows', () => {
    const store = demoStore();
    expect(() =>
      deskSetMyths(store, [
        { title: 'A', effects: [] },
        { title: 'B', effects: [] },
        { title: 'C', effects: [] },
        { title: 'D', effects: [] },
      ]),
    ).toThrow(/three/);
    const effects = [1, 2, 3, 4, 5, 6].map((n) => ({
      kind: 'advantage' as const,
      label: `row ${n}`,
    }));
    expect(() => deskSetMyths(store, [{ title: 'A', effects }])).toThrow(/five/);
    deskSetMyths(store, [
      {
        title: 'The Price',
        effects: [{ kind: 'advantage', label: 'Advantage', match: 'against slavers' }],
      },
    ]);
    expect(store.getCommunity().myths).toHaveLength(1);
    expect(store.getCommunity().myths[0]?.effects[0]?.match).toBe('against slavers');
    store.close();
  });
});

describe('desk diagram', () => {
  it('lands a new NPC in Unassigned and files them by drag', () => {
    const store = demoStore();
    const npc = deskAddNpc(store, 'Hilda Gate');
    const placed = store
      .getCommunity()
      .placements.filter((p) => p.characterSlug === npc.slug);
    expect(placed).toHaveLength(0);
    deskPlace(store, {
      slug: npc.slug,
      name: npc.name,
      from: { kind: 'unassigned' },
      to: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
      copy: false,
    });
    deskPlace(store, {
      slug: npc.slug,
      name: npc.name,
      from: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
      to: { kind: 'rung', axis: 'Faith', tier: 'Acknowledged' },
      copy: true,
    });
    const rows = store.getCommunity().placements.filter((p) => p.characterSlug === npc.slug);
    expect(rows.map((p) => p.axis).sort()).toEqual(['Arms', 'Faith']);
    deskPlace(store, {
      slug: npc.slug,
      name: npc.name,
      from: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
      to: { kind: 'porch' },
      copy: false,
    });
    const after = store.getCommunity();
    expect(after.placements.some((p) => p.characterSlug === npc.slug)).toBe(false);
    expect(after.outsiders.some((o) => o.characterSlug === npc.slug)).toBe(true);
    expect(() =>
      deskPlace(store, {
        slug: npc.slug,
        name: npc.name,
        from: { kind: 'porch' },
        to: { kind: 'rung', axis: 'Coin', tier: 'Outcast' },
        copy: true,
      }),
    ).toThrow(/outsider/i);
    store.close();
  });

  it('copies onto an empty ruler and refuses a taken seat', () => {
    const store = demoStore();
    const npc = deskAddNpc(store, 'Hilda Gate');
    deskPlace(store, {
      slug: npc.slug,
      name: npc.name,
      from: { kind: 'unassigned' },
      to: { kind: 'rung', axis: 'Coin', tier: 'Honoured' },
      copy: false,
    });
    const ruler = store.getCommunity().ruler;
    if (!ruler) {
      deskPlace(store, {
        slug: npc.slug,
        name: npc.name,
        from: { kind: 'rung', axis: 'Coin', tier: 'Honoured' },
        to: { kind: 'ruler' },
        copy: true,
      });
      const community = store.getCommunity();
      expect(community.ruler).toBe(npc.name);
      expect(community.placements.some((p) => p.characterSlug === npc.slug)).toBe(true);
    } else {
      expect(() =>
        deskPlace(store, {
          slug: npc.slug,
          name: npc.name,
          from: { kind: 'rung', axis: 'Coin', tier: 'Honoured' },
          to: { kind: 'ruler' },
          copy: true,
        }),
      ).toThrow(/taken/i);
    }
    store.close();
  });

  it('copies between ladders and refuses a second seat on a ladder that already has the name', () => {
    const store = demoStore();
    const npc = deskAddNpc(store, 'Hilda Gate');
    deskPlace(store, {
      slug: npc.slug,
      name: npc.name,
      from: { kind: 'unassigned' },
      to: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
      copy: false,
    });
    expect(() =>
      deskPlace(store, {
        slug: npc.slug,
        name: npc.name,
        from: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
        to: { kind: 'rung', axis: 'Arms', tier: 'Honoured' },
        copy: true,
      }),
    ).toThrow(/already on this ladder/i);
    expect(
      store.getCommunity().placements.filter((p) => p.characterSlug === npc.slug),
    ).toEqual([expect.objectContaining({ axis: 'Arms', tier: 'Trusted' })]);
    deskPlace(store, {
      slug: npc.slug,
      name: npc.name,
      from: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
      to: { kind: 'rung', axis: 'Faith', tier: 'Acknowledged' },
      copy: true,
    });
    expect(() =>
      deskPlace(store, {
        slug: npc.slug,
        name: npc.name,
        from: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
        to: { kind: 'rung', axis: 'faith', tier: 'Honoured' },
        copy: true,
      }),
    ).toThrow(/already on this ladder/i);
    const rows = store.getCommunity().placements.filter((p) => p.characterSlug === npc.slug);
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: 'Arms', tier: 'Trusted' }),
        expect.objectContaining({ axis: 'Faith', tier: 'Acknowledged' }),
      ]),
    );
    deskPlace(store, {
      slug: npc.slug,
      name: npc.name,
      from: { kind: 'rung', axis: 'Arms', tier: 'Trusted' },
      to: { kind: 'rung', axis: 'Arms', tier: 'Outcast' },
      copy: false,
    });
    const moved = store.getCommunity().placements.filter((p) => p.characterSlug === npc.slug);
    expect(moved.filter((p) => p.axis === 'Arms')).toEqual([
      expect.objectContaining({ tier: 'Outcast' }),
    ]);
    expect(moved.filter((p) => p.axis === 'Faith')).toHaveLength(1);
    store.close();
  });
});

describe('desk sheet', () => {
  it('allows foundation 0 and 4, and keeps harm at 3 until stabilise', () => {
    const store = demoStore();
    const slug = 'tomaso';
    deskFoundationStep(store, slug, 'Strength', 4);
    expect(store.getCharacterBySlug(slug)?.foundations.Strength).toBe(4);
    deskFoundationStep(store, slug, 'Strength', -1);
    deskFoundationStep(store, slug, 'Strength', -1);
    deskFoundationStep(store, slug, 'Strength', -1);
    deskFoundationStep(store, slug, 'Strength', -1);
    expect(store.getCharacterBySlug(slug)?.foundations.Strength).toBe(0);
    const ch = store.getCharacterBySlug(slug)!;
    const fever = ch.harm.Fever ?? 0;
    for (let i = fever; i < 3; i += 1) deskHarmStep(store, slug, 'Fever', 1);
    expect(store.getCharacterBySlug(slug)?.dying).toBe(true);
    expect(store.getCharacterBySlug(slug)?.harm.Fever).toBe(3);
    expect(() => deskHarmStep(store, slug, 'Fever', -1)).toThrow(/stabilise/i);
    deskStabilise(store, slug);
    expect(store.getCharacterBySlug(slug)?.dying).toBe(false);
    expect(store.getCharacterBySlug(slug)?.harm.Fever).toBe(3);
    deskHarmStep(store, slug, 'Fever', -1);
    expect(store.getCharacterBySlug(slug)?.harm.Fever).toBe(2);
    deskSkillStep(store, slug, 'Slash', 0, 2);
    const raised = store.getCharacterBySlug(slug)?.skills.find((s) => s.name === 'Slash');
    expect(raised?.practice).toBeGreaterThanOrEqual(2);
    const before = raised?.practice ?? 0;
    deskSkillStep(store, slug, 'Slash', 0, -1);
    const lowered = store.getCharacterBySlug(slug)?.skills.find((s) => s.name === 'Slash');
    expect(lowered?.practice).toBe(before - 1);
    deskSkillStep(store, slug, 'Slash', 1, 0);
    deskSkillStep(store, slug, 'Slash', 1, 0);
    deskSkillStep(store, slug, 'Slash', 1, 0);
    const atThree = store.getCharacterBySlug(slug)?.skills.find((s) => s.name === 'Slash');
    expect(atThree?.rating).toBe(3);
    const held = atThree?.practice ?? 0;
    deskSkillStep(store, slug, 'Slash', 0, 4);
    expect(store.getCharacterBySlug(slug)?.skills.find((s) => s.name === 'Slash')?.practice).toBe(held);
    store.close();
  });

  it('levels a Skill when a Foundation edit cuts the bar under its Practice', () => {
    const store = demoStore();
    const slug = 'tomaso';
    const ch = store.getCharacterBySlug(slug)!;
    const row = ch.skills.find((skill) => skill.name === 'Carpentry & Masonry')!;
    row.practice = 36;
    store.putCharacter(ch);
    deskFoundationStep(store, slug, 'Strength', 1);
    const after = store.getCharacterBySlug(slug)!;
    const skill = after.skills.find((item) => item.name === 'Carpentry & Masonry')!;
    expect(after.foundations.Strength).toBe(3);
    expect(skill.rating).toBe(3);
    expect(skill.practice).toBe(0);
    expect(skill.threshold).toBe(skillThreshold(3, 3));
    const other = after.skills.find((item) => item.name === 'Engineering & Design')!;
    expect(other.rating).toBe(2);
    store.close();
  });

  it('keeps three to five ladders and clears a fortune icon', () => {
    const store = demoStore();
    expect(store.getCommunity().hierarchyAxes).toHaveLength(4);
    deskRemoveAxis(store, 'Blood');
    expect(store.getCommunity().hierarchyAxes).toEqual(['Arms', 'Faith', 'Coin']);
    expect(() => deskRemoveAxis(store, 'Coin')).toThrow(/three ladders/i);
    deskAddAxis(store, 'Salt');
    deskSetAxisLook(store, 'Salt', { hue: 200, icon: 'salt.png' });
    deskRenameAxis(store, 'Salt', 'Harbour');
    expect(store.getCommunity().axisLook?.Salt).toBeUndefined();
    expect(store.getCommunity().axisLook?.Harbour).toEqual({ hue: 200, icon: 'salt.png' });
    deskSetAxisLook(store, 'Harbour', { sat: 12, light: 90 });
    expect(store.getCommunity().axisLook?.Harbour).toEqual({
      hue: 200,
      icon: 'salt.png',
      sat: 12,
      light: 90,
    });
    deskSetFortuneLook(store, 'vitality', { icon: 'vitality-trial.png' });
    expect(store.getCommunity().fortuneLook?.vitality?.icon).toBe('vitality-trial.png');
    deskSetFortuneLook(store, 'vitality', { icon: '' });
    expect(store.getCommunity().fortuneLook?.vitality?.icon).toBeUndefined();
    deskSetFortuneLook(store, 'vitality', { hue: 10, sat: 0, light: 40 });
    expect(store.getCommunity().fortuneLook?.vitality).toMatchObject({
      hue: 10,
      sat: 0,
      light: 40,
    });
    const label = store.getCommunity().labels?.[0];
    expect(label?.id).toBeTruthy();
    deskLabelHue(store, label!.id, 20, { sat: 0, light: 80 });
    const dyed = store.getCommunity().labels?.find((l) => l.id === label!.id);
    expect(dyed?.hue).toBe(20);
    expect(dyed?.sat).toBe(0);
    expect(dyed?.light).toBe(80);
    store.close();
  });

  it('marks dead off the diagram and removes only when the name matches', () => {
    const store = demoStore();
    const slug = 'jakov';
    deskMarkDead(store, slug);
    const dead = store.getCharacterBySlug(slug);
    expect(dead?.status).toBe('dead');
    expect(
      store.getCommunity().placements.some((p) => p.characterSlug === slug),
    ).toBe(false);
    expect(() => deskRemoveCharacter(store, slug, 'nope')).toThrow(/name/i);
    deskRemoveCharacter(store, slug, dead!.name);
    expect(store.getCharacterBySlug(slug)).toBeUndefined();
    store.close();
  });

  it('sets text without spending words', () => {
    const store = demoStore();
    const before = store.getCharacterBySlug('caterina')!;
    const words = before.creation?.words ?? 0;
    deskEditCharacter(store, 'caterina', {
      concept: 'Keeps the quay.',
      whoWeSee: 'The one with the keys.',
      wordsDelta: 5,
    });
    const after = store.getCharacterBySlug('caterina')!;
    expect(after.concept).toBe('Keeps the quay.');
    expect(after.creation?.words ?? 0).toBe(words);
    store.close();
  });
});
