import type { EchoEffect, EchoRecord, EchoStakeholder } from './types.js';

const WEIGHT_LABEL = { 1: 'Individual', 2: 'Group', 3: 'Pivotal' } as const;

/** Automation inventory by weight (not primary live-sheet chrome). */
export function defaultEchoEffects(weight: 1 | 2 | 3): EchoEffect[] {
  const band = WEIGHT_LABEL[weight];
  const effects: EchoEffect[] = [
    {
      kind: 'invoke_second_exertion',
      phase: 'while_carried',
      label: 'Invoke → +1 Exertion die',
      detail:
        'When the roll’s scene matches this Echo’s invoke condition, spend one extra Exertion die beyond the normal limit of one.',
    },
    {
      kind: 'load_cost',
      phase: 'while_carried',
      label: `Load ${weight} · ${band}`,
      detail: `Counts ${weight} against Echo capacity while unresolved.`,
    },
  ];

  if (weight === 1) {
    effects.push({
      kind: 'on_resolve_personal',
      phase: 'on_resolve',
      label: 'Resolve → Trait / bond / fact',
      detail: 'Personal outcomes — not a Fortune move.',
    });
    effects.push({
      kind: 'dies_with_bearer',
      phase: 'continuity',
      label: 'Usually dies with the bearer',
      detail: 'Unless elevated first.',
    });
  } else if (weight === 2) {
    effects.push({
      kind: 'on_resolve_group',
      phase: 'on_resolve',
      label: 'Resolve → Trait / standing / fact',
      detail: 'Cannot alone move a Fortune.',
    });
    effects.push({
      kind: 'persist_legacy',
      phase: 'continuity',
      label: 'May persist / be claimed',
      detail: 'Can outlive the bearer.',
    });
  } else {
    effects.push({
      kind: 'pivotal_fortune',
      phase: 'on_resolve',
      label: 'Resolve → Fortune shift',
      detail: 'May shift one community Fortune.',
    });
    effects.push({
      kind: 'pivotal_myth',
      phase: 'on_resolve',
      label: 'Resolve → Foundation Myth',
      detail: 'May enter the active Foundation Myths set.',
    });
    effects.push({
      kind: 'persist_legacy',
      phase: 'continuity',
      label: 'Persists as Legacy claim',
      detail: 'Remains for successors.',
    });
  }

  return effects;
}

export interface MakeEchoInput {
  title: string;
  weight: 1 | 2 | 3;
  /** Precise scene condition for invoke. */
  invokeWhen: string;
  note?: string;
  group?: EchoStakeholder[];
  groupLabel?: string;
  resolved?: EchoRecord['resolved'];
  extraEffects?: EchoEffect[];
}

export function makeEcho(input: MakeEchoInput): EchoRecord {
  return {
    title: input.title,
    weight: input.weight,
    invokeWhen: input.invokeWhen,
    note: input.note,
    group: input.group,
    groupLabel: input.groupLabel,
    resolved: input.resolved,
    effects: [...defaultEchoEffects(input.weight), ...(input.extraEffects ?? [])],
  };
}

export function normalizeEcho(
  raw:
    | EchoRecord
    | {
        title: string;
        weight: number;
        invokeWhen?: string;
        note?: string;
        group?: EchoStakeholder[];
        groupLabel?: string;
        resolved?: EchoRecord['resolved'];
        effects?: EchoEffect[];
      },
): EchoRecord {
  const w = (raw.weight === 2 || raw.weight === 3 ? raw.weight : 1) as 1 | 2 | 3;
  const invokeWhen =
    (raw as EchoRecord).invokeWhen?.trim() ||
    raw.note?.trim() ||
    `When the scene matches “${raw.title}”.`;

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
    invokeWhen,
    note: raw.note,
    group: raw.group,
    groupLabel: raw.groupLabel,
    resolved: raw.resolved,
    effects,
  };
}

export function weightBandLabel(weight: 1 | 2 | 3): string {
  return WEIGHT_LABEL[weight];
}

/** Active (unresolved) echoes for capacity / Decadence. */
export function activeEchoes(echoes: EchoRecord[]): EchoRecord[] {
  return echoes.filter((e) => !e.resolved);
}
