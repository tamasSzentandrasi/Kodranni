import type { ChatCard } from '@kodranni/chat-port';

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
    { name: 'Dice', value: `d${input.dieTier}: ${faceStr}`, inline: false },
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

/** ST sets the fiction config; player presses Roll once. */
export function buildRollPromptCard(input: RollPromptCardInput): ChatCard {
  const intent = input.skill
    ? `${input.foundation} + ${input.skill} · d${input.dieTier}`
    : `${input.foundation} (Primitive) · d${input.dieTier}`;
  return {
    title: input.characterName ? `Roll · ${input.characterName}` : 'Roll when ready',
    description: `**${input.stName}** sets the pool: ${intent}`,
    accent: 'blood',
    fields: [
      { name: 'Foundation', value: input.foundation, inline: true },
      { name: 'Skill', value: input.skill ?? 'Primitive', inline: true },
      { name: 'Tier', value: `d${input.dieTier}`, inline: true },
    ],
    footer: 'Defaults: no Exertion, no Echo. Only the named player may press Roll.',
    buttons: [
      { id: `prompt-roll:${input.promptId}`, label: 'Roll', style: 'primary' },
    ],
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
