import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mulberry32 } from '@kodranni/domain';
import { openSqliteStore, seedDemoCampaign } from '@kodranni/store';
import {
  PREP_FOUNDATION_POINTS,
  PREP_SKILL_POINTS,
  birthOmenPoints,
  foundationStepCost,
  guidingHandPoints,
  nextFoundationCost,
  nextSkillCost,
  refundFoundationCost,
  refundSkillCost,
  skillStepCost,
} from '../src/costs.js';
import {
  confirmReturnToTable,
  createPrebuilt,
  grantBirthOmen,
  grantGuidingHand,
  grantWord,
  isCreationLocked,
  listCharactersForAccount,
  lockCharacter,
  resolveFocusedCharacter,
  rollAndGrantBirthOmen,
  setFocusedCharacter,
  refundFoundation,
  refundSkill,
  spendFoundation,
  spendSkill,
  spendWordWanting,
  stEditCharacter,
  stReviewCharacter,
  startClaimFromBot,
  startCreateFromBot,
  unlockCharacter,
  updateDraftConcept,
} from '../src/creation.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function emptyStore() {
  const dir = mkdtempSync(join(tmpdir(), 'kodranni-creation-'));
  dirs.push(dir);
  const store = openSqliteStore(join(dir, 'c.sqlite'));
  seedDemoCampaign(store);
  return store;
}

describe('costs', () => {
  it('matches guidebook Foundation and Skill steps', () => {
    expect(foundationStepCost(1)).toBe(1);
    expect(foundationStepCost(2)).toBe(2);
    expect(skillStepCost(0)).toBe(1);
    expect(skillStepCost(1)).toBe(2);
    expect(skillStepCost(2)).toBe(3);
    expect(nextFoundationCost(0)).toBe(1);
    expect(nextFoundationCost(3)).toBeNull();
    expect(nextSkillCost(3)).toBeNull();
    expect(refundFoundationCost(1)).toBeNull();
    expect(refundFoundationCost(0)).toBeNull();
    expect(refundFoundationCost(2)).toBe(1);
    expect(refundFoundationCost(3)).toBe(2);
    expect(refundSkillCost(0)).toBeNull();
    expect(refundSkillCost(1)).toBe(1);
    expect(refundSkillCost(2)).toBe(2);
    expect(refundSkillCost(3)).toBe(3);
  });

  it('maps Omen and Hand faces to points', () => {
    expect(birthOmenPoints(1)).toBe(1);
    expect(birthOmenPoints(11)).toBe(6);
    expect(birthOmenPoints(20)).toBe(10);
    expect(guidingHandPoints(9)).toBe(9);
    expect(guidingHandPoints(20)).toBe(20);
  });
});

describe('startCreateFromBot → confirm → approve', () => {
  it('binds initiator for mention and maps member on approve', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-100',
      displayName: 'Mara',
      name: 'Mara Reed',
    });
    expect(character.status).toBe('draft');
    expect(character.creation?.foundationPoints).toBe(PREP_FOUNDATION_POINTS);
    expect(character.creation?.skillPoints).toBe(PREP_SKILL_POINTS);
    expect(character.creation?.locked).toBe(false);
    expect(character.initiator?.accountId).toBe('u-100');
    expect(isCreationLocked(character)).toBe(false);

    updateDraftConcept(store, {
      characterSlug: character.slug,
      communityTie: 'Sister to the miller at the Bend',
      concept: 'A reed-cutter who bargains hard for ferry rights.',
    });

    spendFoundation(store, {
      characterSlug: character.slug,
      foundation: 'Resolve',
    });
    const afterFound = store.getCharacterBySlug(character.slug)!;
    expect(afterFound.foundations.Resolve).toBe(2);
    expect(afterFound.creation!.foundationPoints).toBe(PREP_FOUNDATION_POINTS - 1);

    spendSkill(store, {
      characterSlug: character.slug,
      skill: 'Negotiation',
    });
    expect(store.getCharacterBySlug(character.slug)!.skills.find((s) => s.name === 'Negotiation')?.rating).toBe(
      1,
    );

    const confirmed = confirmReturnToTable(store, { characterSlug: character.slug });
    expect(confirmed.mention.accountId).toBe('u-100');
    expect(confirmed.character.status).toBe('pending_review');

    const approved = stReviewCharacter(store, {
      characterSlug: character.slug,
      decision: 'approve',
      actor: 'st-1',
    });
    expect(approved.status).toBe('active');
    expect(approved.creation?.locked).toBe(true);
    expect(approved.player?.accountId).toBe('u-100');
    const member = store.listMembers().find((m) => m.accountId === 'u-100');
    expect(member?.characterId).toBe(approved.id);
    expect(member?.focusedCharacterId).toBe(approved.id);

    expect(() =>
      spendFoundation(store, { characterSlug: character.slug, foundation: 'Guile' }),
    ).toThrow(/locked/);

    store.close();
  });

  it('refunds Foundation and Skill spends one step at a time', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-refund',
      displayName: 'R',
      name: 'Refund Test',
    });
    spendFoundation(store, { characterSlug: character.slug, foundation: 'Resolve' });
    spendFoundation(store, { characterSlug: character.slug, foundation: 'Resolve' });
    expect(store.getCharacterBySlug(character.slug)!.foundations.Resolve).toBe(3);
    const afterFound = refundFoundation(store, {
      characterSlug: character.slug,
      foundation: 'Resolve',
    });
    expect(afterFound.foundations.Resolve).toBe(2);
    expect(afterFound.creation!.foundationPoints).toBe(PREP_FOUNDATION_POINTS - 1);

    spendSkill(store, { characterSlug: character.slug, skill: 'Negotiation' });
    spendSkill(store, { characterSlug: character.slug, skill: 'Negotiation' });
    const afterSkill = refundSkill(store, {
      characterSlug: character.slug,
      skill: 'Negotiation',
    });
    expect(afterSkill.skills.find((s) => s.name === 'Negotiation')?.rating).toBe(1);
    refundSkill(store, { characterSlug: character.slug, skill: 'Negotiation' });
    expect(
      store.getCharacterBySlug(character.slug)!.skills.find((s) => s.name === 'Negotiation'),
    ).toBeUndefined();
    expect(() =>
      refundFoundation(store, { characterSlug: character.slug, foundation: 'Guile' }),
    ).toThrow(/below 1/);
    store.close();
  });

  it('rejects Confirm without bot initiator', () => {
    const store = emptyStore();
    const pre = createPrebuilt(store, { name: 'Guest Blade', claimable: true });
    // Strip initiator simulation: prebuilt has none
    expect(() => confirmReturnToTable(store, { characterSlug: pre.slug })).toThrow(
      /table bot first/,
    );
    store.close();
  });
});

describe('claim prebuilt', () => {
  it('attaches initiator and soft player bind', () => {
    const store = emptyStore();
    const pre = createPrebuilt(store, { name: 'Guest Scout', claimable: true });
    const claimed = startClaimFromBot(store, {
      platform: 'discord',
      accountId: 'guest-1',
      displayName: 'Cal',
      characterSlug: pre.slug,
    });
    expect(claimed.initiator?.accountId).toBe('guest-1');
    expect(claimed.player?.displayName).toBe('Cal');
    const conf = confirmReturnToTable(store, { characterSlug: pre.slug });
    expect(conf.mention.accountId).toBe('guest-1');
    store.close();
  });
});

describe('Birth Omen & Guiding Hand', () => {
  it('grants points only once from bot faces', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-2',
      displayName: 'P',
      name: 'Omen Test',
    });
    const before = character.creation!.foundationPoints;
    const omen = grantBirthOmen(store, { characterSlug: character.slug, face: 11 });
    expect(omen.points).toBe(6);
    expect(omen.character.creation!.foundationPoints).toBe(before + 6);
    expect(omen.character.creation!.birthOmenGranted).toBe(true);
    expect(() =>
      grantBirthOmen(store, { characterSlug: character.slug, face: 5 }),
    ).toThrow(/already/);

    const hand = grantGuidingHand(store, { characterSlug: character.slug, face: 9 });
    expect(hand.points).toBe(9);
    expect(hand.character.creation!.skillPoints).toBe(PREP_SKILL_POINTS + 9);

    const rolled = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-3',
      displayName: 'Q',
      name: 'Rng Omen',
    });
    const r = rollAndGrantBirthOmen(store, {
      characterSlug: rolled.character.slug,
      rng: mulberry32(42),
    });
    expect(r.face).toBeGreaterThanOrEqual(1);
    expect(r.face).toBeLessThanOrEqual(20);
    store.close();
  });
});

describe('Words & Wanting', () => {
  it('grants Word and spends +5 skill menu', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-w',
      displayName: 'W',
      name: 'Word Test',
    });
    grantWord(store, { characterSlug: character.slug, reason: 'accepted claim' });
    expect(store.getCharacterBySlug(character.slug)!.creation!.words).toBe(1);

    spendWordWanting(store, {
      characterSlug: character.slug,
      menu: 'plus_five_skill',
      foundation: 'Constitution',
    });
    const after = store.getCharacterBySlug(character.slug)!;
    expect(after.foundations.Constitution).toBe(0);
    expect(after.creation!.skillPoints).toBe(PREP_SKILL_POINTS + 5);
    expect(after.creation!.words).toBe(0);
    store.close();
  });

  it('positive_trait adds a Trait and removes 3 skill ranks', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-trait',
      displayName: 'Tr',
      name: 'Trait Want',
    });
    spendSkill(store, { characterSlug: character.slug, skill: 'Negotiation' });
    spendSkill(store, { characterSlug: character.slug, skill: 'Tradecraft' });
    spendSkill(store, { characterSlug: character.slug, skill: 'Etiquette' });
    grantWord(store, { characterSlug: character.slug });
    spendWordWanting(store, {
      characterSlug: character.slug,
      menu: 'positive_trait',
      traitName: 'Silver tongue',
      traitNote: 'From Wanting',
      removeSkills: [
        { skill: 'Negotiation', ranks: 1 },
        { skill: 'Tradecraft', ranks: 1 },
        { skill: 'Etiquette', ranks: 1 },
      ],
    });
    const after = store.getCharacterBySlug(character.slug)!;
    expect(after.traits.some((t) => t.name === 'Silver tongue')).toBe(true);
    expect(after.creation!.words).toBe(0);
    expect(after.skills.find((s) => s.name === 'Negotiation')).toBeUndefined();
    store.close();
  });

  it('plus_one_foundation removes 3 skill ranks', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-w2',
      displayName: 'W2',
      name: 'Want Found',
    });
    // Buy Negotiation 0→1 three times? need rank 3 = cost 6; simpler: skill pts grant then ranks
    spendSkill(store, { characterSlug: character.slug, skill: 'Negotiation' });
    spendSkill(store, { characterSlug: character.slug, skill: 'Negotiation' });
    spendSkill(store, { characterSlug: character.slug, skill: 'Negotiation' });
    // also need more ranks elsewhere: Tradecraft 0→1, 1→2? Need 3 ranks total removed
    // Negotiation is 3 — remove all 3
    grantWord(store, { characterSlug: character.slug });
    spendWordWanting(store, {
      characterSlug: character.slug,
      menu: 'plus_one_foundation',
      foundation: 'Guile',
      removeSkills: [{ skill: 'Negotiation', ranks: 3 }],
    });
    const after = store.getCharacterBySlug(character.slug)!;
    expect(after.foundations.Guile).toBe(2);
    expect(after.skills.find((s) => s.name === 'Negotiation')).toBeUndefined();
    store.close();
  });

  it('raises Foundation from ∅ via points and Wanting', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'u-zero',
      displayName: 'Z',
      name: 'Zero Found',
    });
    // Reduce Strength to ∅ via +5 skill Wanting
    grantWord(store, { characterSlug: character.slug });
    spendWordWanting(store, {
      characterSlug: character.slug,
      menu: 'plus_five_skill',
      foundation: 'Strength',
    });
    expect(store.getCharacterBySlug(character.slug)!.foundations.Strength).toBe(0);

    spendFoundation(store, { characterSlug: character.slug, foundation: 'Strength' });
    expect(store.getCharacterBySlug(character.slug)!.foundations.Strength).toBe(1);

    // Drop again, then restore via +1 Foundation Wanting
    grantWord(store, { characterSlug: character.slug });
    spendWordWanting(store, {
      characterSlug: character.slug,
      menu: 'plus_five_skill',
      foundation: 'Strength',
    });
    expect(store.getCharacterBySlug(character.slug)!.foundations.Strength).toBe(0);

    spendSkill(store, { characterSlug: character.slug, skill: 'Slash' });
    spendSkill(store, { characterSlug: character.slug, skill: 'Unarmed' });
    spendSkill(store, { characterSlug: character.slug, skill: 'Dodge' });
    grantWord(store, { characterSlug: character.slug });
    spendWordWanting(store, {
      characterSlug: character.slug,
      menu: 'plus_one_foundation',
      foundation: 'Strength',
      removeSkills: [
        { skill: 'Slash', ranks: 1 },
        { skill: 'Unarmed', ranks: 1 },
        { skill: 'Dodge', ranks: 1 },
      ],
    });
    expect(store.getCharacterBySlug(character.slug)!.foundations.Strength).toBe(1);
    store.close();
  });
});

describe('ST edit (claim marks)', () => {
  it('patches concept, skills, foundations, traits, echoes', () => {
    const store = emptyStore();
    const { character } = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'target',
      displayName: 'T',
      name: 'Mark Target',
    });
    const edited = stEditCharacter(store, {
      characterSlug: character.slug,
      actor: 'st',
      patch: {
        concept: 'Hard bargainer under the mill eaves.',
        whoWeSee: 'A hard bargainer',
        foundations: { Authority: 2 },
        skills: [
          {
            name: 'Negotiation',
            rating: 2,
            practice: 0,
            threshold: 48,
            foundation: 'Authority',
          },
        ],
        traits: [{ name: 'Hard bargainer' }],
        skillPointsDelta: 2,
      },
    });
    expect(edited.concept).toContain('Hard bargainer');
    expect(edited.foundations.Authority).toBe(2);
    expect(edited.skills[0]?.rating).toBe(2);
    expect(edited.traits[0]?.name).toBe('Hard bargainer');
    expect(edited.creation!.skillPoints).toBe(PREP_SKILL_POINTS + 2);
    store.close();
  });
});

describe('lock / unlock / multi focus', () => {
  it('unlock allows spend again; focus picks among two PCs', () => {
    const store = emptyStore();
    const a = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'multi',
      displayName: 'Multi',
      name: 'Alpha',
    }).character;
    stReviewCharacter(store, {
      characterSlug: a.slug,
      decision: 'approve',
    });
    // second character for same account
    const b = startCreateFromBot(store, {
      platform: 'discord',
      accountId: 'multi',
      displayName: 'Multi',
      name: 'Beta',
    }).character;
    // Soft-bind player for focus check before approve
    const bCh = store.getCharacterBySlug(b.slug)!;
    bCh.player = { platform: 'discord', accountId: 'multi', displayName: 'Multi' };
    store.putCharacter(bCh);
    stReviewCharacter(store, { characterSlug: b.slug, decision: 'approve' });

    const list = listCharactersForAccount(store, 'discord', 'multi').filter(
      (c) => c.status === 'active',
    );
    expect(list.length).toBeGreaterThanOrEqual(2);

    setFocusedCharacter(store, {
      platform: 'discord',
      accountId: 'multi',
      characterSlug: b.slug,
    });
    expect(resolveFocusedCharacter(store, 'discord', 'multi')?.slug).toBe(b.slug);

    unlockCharacter(store, { characterSlug: a.slug });
    expect(isCreationLocked(store.getCharacterBySlug(a.slug)!)).toBe(false);
    lockCharacter(store, { characterSlug: a.slug });
    expect(isCreationLocked(store.getCharacterBySlug(a.slug)!)).toBe(true);
    store.close();
  });
});

describe('legacy seed sheets', () => {
  it('treats active seed characters as locked without creation block', () => {
    const store = emptyStore();
    const torvald = store.getCharacterBySlug('torvald')!;
    expect(isCreationLocked(torvald)).toBe(true);
    store.close();
  });
});
