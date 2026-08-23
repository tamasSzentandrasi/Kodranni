import type { ChatCard, ChatSelect } from '@kodranni/chat-port';

/** Guidebook die-tier language (Advantage / Equal / Disadvantage). */
export function dieTierLabel(tier: number): string {
  if (tier === 6) return 'd6 · Disadvantage';
  if (tier === 12) return 'd12 · Advantage';
  return 'd8 · Equal';
}

export function dieTierShort(tier: number): string {
  if (tier === 6 || tier === 12) return `d${tier}`;
  return 'd8';
}

export interface RollCardInput {
  characterName: string;
  intentLine: string;
  poolFormula: string;
  dieTier: number;
  faces: number[];
  marks: number;
  omen: number | null;
  omenHit: string | null;
  margin?: number;
  practiceGained?: number;
  whyPool?: string;
  liveSheetUrl?: string;
  archiveSheetUrl?: string;
  rollId: string;
  showOppose?: boolean;
  showStPalette?: boolean;
}

/** Shared roll result card — both Discord and Fluxer render this model. */
export function buildRollResultCard(input: RollCardInput): ChatCard {
  const faceStr = input.faces.join(', ');
  const fields = [
    { name: 'Marks', value: `**${input.marks}**`, inline: true },
    { name: 'Pool', value: input.poolFormula, inline: true },
    {
      name: 'Dice',
      value: `${dieTierLabel(input.dieTier)} · ${faceStr}`,
      inline: false,
    },
  ];
  if (input.omen != null) {
    fields.push({
      name: 'Omen',
      value: input.omenHit ? `${input.omen} (${input.omenHit})` : String(input.omen),
      inline: true,
    });
  }
  if (input.margin != null) {
    fields.push({ name: 'Margin', value: String(input.margin), inline: true });
  }
  if (input.practiceGained != null && input.practiceGained > 0) {
    fields.push({ name: 'Practice', value: `+${input.practiceGained}`, inline: true });
  }

  const buttons = [];
  if (input.showOppose) {
    buttons.push({ id: `oppose:${input.rollId}`, label: 'Oppose', style: 'primary' as const });
  }
  buttons.push({
    id: `why-pool:${input.rollId}`,
    label: 'Why this pool?',
    style: 'secondary' as const,
  });
  if (input.showStPalette) {
    buttons.push(
      { id: `st-harm:${input.rollId}`, label: 'Harm', style: 'secondary' as const },
      { id: `st-exert:${input.rollId}`, label: 'Exertion', style: 'secondary' as const },
    );
  }

  const links = [];
  if (input.liveSheetUrl) links.push({ label: 'Live sheet', url: input.liveSheetUrl });
  if (input.archiveSheetUrl) links.push({ label: 'Archive', url: input.archiveSheetUrl });

  return {
    title: input.characterName,
    description: input.intentLine,
    accent: 'blood',
    fields,
    footer: input.whyPool,
    buttons,
    links,
  };
}

export interface RollConfirmCardInput {
  confirmId: string;
  characterName: string;
  skill?: string;
  foundation: string;
  foundations: string[];
  dieTier: number;
  exertion: number;
  echoApplies: boolean;
  liveSheetUrl?: string;
}

/** One-screen stance before Cast — Foundation easy to change; Echo = agreed apply. */
export function buildRollConfirmCard(input: RollConfirmCardInput): ChatCard {
  const intent = input.skill
    ? `${input.foundation} + ${input.skill}`
    : `${input.foundation} (Primitive)`;
  const foundSelect: ChatSelect = {
    id: `roll-found:${input.confirmId}`,
    placeholder: `Foundation · now ${input.foundation}`,
    options: input.foundations.slice(0, 25).map((f) => ({
      value: f,
      label: f,
      description: f === input.foundation ? 'Current' : undefined,
      default: f === input.foundation,
    })),
  };
  return {
    title: `Ready · ${input.characterName}`,
    description: `**${intent}** · ${dieTierLabel(input.dieTier)}`,
    accent: 'blood',
    fields: [
      { name: 'Foundation', value: input.foundation, inline: true },
      { name: 'Skill', value: input.skill ?? 'Primitive', inline: true },
      { name: 'Tier', value: dieTierLabel(input.dieTier), inline: true },
      {
        name: 'Exertion',
        value: String(input.exertion),
        inline: true,
      },
      {
        name: 'Echo',
        value: input.echoApplies ? 'Applies (agreed)' : 'Does not apply',
        inline: true,
      },
    ],
    footer: 'Change Foundation if the table agreed a different one. Echo only when agreed it matches.',
    buttons: [
      { id: `roll-cast:${input.confirmId}`, label: 'Cast', style: 'primary' },
      {
        id: `roll-ex:${input.confirmId}`,
        label: `Exertion ${input.exertion}`,
        style: 'secondary',
      },
      {
        id: `roll-echo:${input.confirmId}`,
        label: input.echoApplies ? 'Echo applies ✓' : 'Echo applies?',
        style: 'secondary',
      },
      { id: `roll-cancel:${input.confirmId}`, label: 'Cancel', style: 'danger' },
    ],
    selects: [foundSelect],
    links: input.liveSheetUrl
      ? [{ label: 'Live sheet', url: input.liveSheetUrl }]
      : undefined,
  };
}

export interface RequestCardInput {
  requestId: string;
  title: string;
  body: string;
  requesterName: string;
}

export function buildApprovalRequestCard(input: RequestCardInput): ChatCard {
  return {
    title: input.title,
    description: input.body,
    accent: 'blood',
    fields: [{ name: 'From', value: input.requesterName, inline: true }],
    buttons: [
      { id: `approve:${input.requestId}`, label: 'Approve', style: 'success' },
      { id: `deny:${input.requestId}`, label: 'Deny', style: 'danger' },
    ],
  };
}

export interface RollPromptCardInput {
  promptId: string;
  foundation: string;
  skill?: string;
  dieTier: number;
  characterName?: string;
  stName: string;
  liveSheetUrl?: string;
}

/** ST Intent card — equal peer to free-roll; player presses Roll when ready. */
export function buildRollPromptCard(input: RollPromptCardInput): ChatCard {
  const intent = input.skill
    ? `${input.foundation} + ${input.skill} · ${dieTierShort(input.dieTier)}`
    : `${input.foundation} (Primitive) · ${dieTierShort(input.dieTier)}`;
  return {
    title: input.characterName ? `Intent · ${input.characterName}` : 'Intent · roll when ready',
    description: `**${input.stName}** posts the agreed pool: **${intent}**`,
    accent: 'blood',
    fields: [
      { name: 'Foundation', value: input.foundation, inline: true },
      { name: 'Skill', value: input.skill ?? 'Primitive', inline: true },
      { name: 'Tier', value: dieTierLabel(input.dieTier), inline: true },
    ],
    footer:
      'Only the named player may Roll. Set Exertion on the confirm beat; mark Echo only if the table agreed it applies.',
    buttons: [{ id: `prompt-roll:${input.promptId}`, label: 'Roll', style: 'primary' }],
    links: input.liveSheetUrl
      ? [{ label: 'Live sheet', url: input.liveSheetUrl }]
      : undefined,
  };
}

export interface HarmAssignCardInput {
  rollId: string;
  characterName: string;
  family: 'physical' | 'mental' | 'social';
  points: number;
  ratio: number;
  tracks: string[];
}

/** ST assigns precalculated harm points to allowed tracks. */
export function buildHarmAssignCard(input: HarmAssignCardInput): ChatCard {
  const buttons = input.tracks.slice(0, 5).map((track) => ({
    id: `harm-apply:${input.rollId}:${input.family}:${track}:${input.points}`,
    label: `All → ${track}`,
    style: 'secondary' as const,
  }));
  return {
    title: `Harm · ${input.characterName}`,
    description: `**${input.points}** point(s) available (${input.family}, ratio ${input.ratio}). Assign to one track, or cancel.`,
    accent: 'blood',
    fields: [
      { name: 'Family', value: input.family, inline: true },
      { name: 'Points', value: String(input.points), inline: true },
    ],
    footer: 'One family per infliction. Split across tracks comes later.',
    buttons: [
      ...buttons,
      { id: `harm-cancel:${input.rollId}`, label: 'Cancel', style: 'danger' },
    ],
  };
}
