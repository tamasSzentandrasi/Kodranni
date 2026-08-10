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
