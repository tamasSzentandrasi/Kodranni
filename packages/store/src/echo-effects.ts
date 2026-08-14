import type { EchoEffect, EchoRecord } from './types.js';

const WEIGHT_LABEL = { 1: 'Individual', 2: 'Group', 3: 'Pivotal' } as const;

/**
 * Guidebook-default mechanical inventory for a carried Echo by weight.
 * ST may add `custom` chips; invoke is always available when the scene matches.
 */
export function defaultEchoEffects(weight: 1 | 2 | 3): EchoEffect[] {
  const effects: EchoEffect[] = [
    {
      kind: 'invoke_second_exertion',
      label: 'Invoke → +1 Exertion die',
      detail: 'When the scene matches this Echo, spend a second Exertion die on the roll.',
    },
  ];

  if (weight === 1) {
    effects.push({
      kind: 'weight_individual',
      label: 'Weight 1 · Individual',
      detail: 'Known and cared for by the bearer alone.',
    });
    effects.push({
      kind: 'dies_with_bearer',
      label: 'Usually dies with the bearer',
      detail: 'Unless elevated, personal Echoes end with the character.',
    });
  } else if (weight === 2) {
    effects.push({
      kind: 'weight_group',
      label: 'Weight 2 · Group',
      detail: 'Shared among a small circle; not enough alone to shift a Fortune.',
    });
    effects.push({
      kind: 'persist_legacy',
      label: 'May persist / be claimed',
      detail: 'Group Echoes can outlive the bearer and be taken up by successors.',
    });
  } else {
    effects.push({
      kind: 'weight_pivotal',
      label: 'Weight 3 · Pivotal',
      detail: 'Tied to the community; can move a Fortune when resolved.',
    });
    effects.push({
      kind: 'pivotal_fortune',
      label: 'Resolve → Fortune shift',
      detail: 'On resolution, may shift one Fortune.',
    });
    effects.push({
      kind: 'pivotal_myth',
      label: 'Resolve → Foundation Myth',
      detail: 'On resolution, may enter the active Foundation Myths set.',
    });
    effects.push({
      kind: 'persist_legacy',
      label: 'Persists as Legacy claim',
      detail: 'Pivotal Echoes remain for successors as Legacy craft with the ST.',
    });
  }

  return effects;
}

export function makeEcho(
  title: string,
  weight: 1 | 2 | 3,
  note?: string,
  extra: EchoEffect[] = [],
): EchoRecord {
  return {
    title,
    weight,
    note,
    effects: [...defaultEchoEffects(weight), ...extra],
  };
}

export function normalizeEcho(
  raw: EchoRecord | { title: string; weight: number; note?: string; effects?: EchoEffect[] },
): EchoRecord {
  const w = (raw.weight === 2 || raw.weight === 3 ? raw.weight : 1) as 1 | 2 | 3;
  const effects =
    raw.effects && raw.effects.length > 0 ? raw.effects : defaultEchoEffects(w);
  return {
    title: raw.title,
    weight: w,
    note: raw.note,
    effects,
  };
}

export function weightBandLabel(weight: 1 | 2 | 3): string {
  return WEIGHT_LABEL[weight];
}
