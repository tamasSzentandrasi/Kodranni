import type { EchoEffect, EchoRecord } from './types.js';

const WEIGHT_LABEL = { 1: 'Individual', 2: 'Group', 3: 'Pivotal' } as const;

/**
 * Guidebook mechanical inventory for a carried Echo, grouped by phase.
 *
 * While carried: invoke when scene matches; weight costs capacity.
 * On resolution: outcomes by weight band (trait/relationship vs Fortune+Myth).
 * Continuity: personal usually dies with bearer; group/pivotal may persist as Legacy.
 */
export function defaultEchoEffects(weight: 1 | 2 | 3): EchoEffect[] {
  const band = WEIGHT_LABEL[weight];
  const effects: EchoEffect[] = [
    {
      kind: 'invoke_second_exertion',
      phase: 'while_carried',
      label: 'Invoke → +1 Exertion die',
      detail:
        'When the roll’s scene matches this Echo, spend one extra Exertion die beyond the normal limit of one.',
    },
    {
      kind: 'load_cost',
      phase: 'while_carried',
      label: `Load ${weight} · ${band}`,
      detail: `Counts ${weight} against Echo capacity (max(Str, Dex) + Int + Auth). Over capacity: −1 die only on rolls that involve any of the character’s Echoes.`,
    },
  ];

  if (weight === 1) {
    effects.push({
      kind: 'on_resolve_personal',
      phase: 'on_resolve',
      label: 'Resolve → Trait / bond / fact',
      detail:
        'Resolution may yield a personal Trait, a relationship or favour shift, or an established fact — not a Fortune move.',
    });
    effects.push({
      kind: 'dies_with_bearer',
      phase: 'continuity',
      label: 'Usually dies with the bearer',
      detail: 'Personal Echoes end with the character unless elevated to Group or Pivotal first.',
    });
  } else if (weight === 2) {
    effects.push({
      kind: 'on_resolve_group',
      phase: 'on_resolve',
      label: 'Resolve → Trait / standing / fact',
      detail:
        'Shared among a small circle. Resolution may shift standing or produce a Trait/fact, but cannot alone move a Fortune.',
    });
    effects.push({
      kind: 'persist_legacy',
      phase: 'continuity',
      label: 'May persist / be claimed',
      detail: 'Group Echoes can outlive the bearer and be taken up by successors as Legacy craft with the ST.',
    });
  } else {
    effects.push({
      kind: 'pivotal_fortune',
      phase: 'on_resolve',
      label: 'Resolve → Fortune shift',
      detail: 'On resolution, may shift one community Fortune.',
    });
    effects.push({
      kind: 'pivotal_myth',
      phase: 'on_resolve',
      label: 'Resolve → Foundation Myth',
      detail: 'On resolution, may enter the active Foundation Myths set.',
    });
    effects.push({
      kind: 'persist_legacy',
      phase: 'continuity',
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
  // Rebuild defaults when missing, empty, or still on the old sparse weight_* chips
  const needsRebuild =
    !raw.effects ||
    raw.effects.length === 0 ||
    raw.effects.some((e) =>
      ['weight_individual', 'weight_group', 'weight_pivotal'].includes(e.kind),
    );
  const effects = needsRebuild
    ? [
        ...defaultEchoEffects(w),
        ...(raw.effects ?? []).filter((e) => e.kind === 'custom'),
      ]
    : raw.effects;
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

export const ECHO_PHASES = [
  { id: 'while_carried' as const, label: 'While carried' },
  { id: 'on_resolve' as const, label: 'On resolution' },
  { id: 'continuity' as const, label: 'Continuity' },
];
