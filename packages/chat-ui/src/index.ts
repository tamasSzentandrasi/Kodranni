import type { CardAccent, ChatButton, ChatCard, ChatSelect } from '@kodranni/chat-port';
import { isMark } from '@kodranni/domain';

/** Guidebook die-tier language (Advantage / Ordinary / Disadvantage). */
export function dieTierLabel(tier: number): string {
  if (tier === 6) return 'd6 · Disadvantage';
  if (tier === 12) return 'd12 · Advantage';
  return 'd8 · Ordinary';
}

export function dieTierShort(tier: number): string {
  if (tier === 6 || tier === 12) return `d${tier}`;
  return 'd8';
}

export function dieAccent(tier: number): CardAccent {
  if (tier === 6) return 'd6';
  if (tier === 12) return 'd12';
  return 'd8';
}

/**
 * Marker the Discord hop swaps for a server die emoji.
 * d8 and d12 match those names. d6, and a miss, become 🎲.
 */
export function dieMark(tier: number): string {
  if (tier === 12) return '{{kod-die:d12}}';
  if (tier === 6) return '{{kod-die:d6}}';
  return '{{kod-die:d8}}';
}

/** Hall-served die picture. Omitted for loopback, which a chat client cannot fetch. */
export function dieImageUrl(base: string | undefined, tier: number): string | undefined {
  if (!base) return undefined;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  const file = tier === 6 ? 'd6' : tier === 12 ? 'd12' : 'd8';
  return `${url.origin}/dice/${file}.png`;
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
  /** Set when the spend left a Dying character at Exertion 0. */
  died?: boolean;
  whyPool?: string;
  /** Quiet line under the dice, such as a Tide link. */
  aside?: string;
  liveSheetUrl?: string;
  archiveSheetUrl?: string;
  rollId: string;
  showOppose?: boolean;
  showStPalette?: boolean;
  /** Character portrait. The posted result does not use the die picture. */
  portraitUrl?: string;
}

/** Discord ansi block. A face of 5 or higher is painted bright, via isMark. */
function diceAnsi(faces: number[]): string {
  const row = faces
    .map((face) => {
      const paint = isMark(face) ? '\u001b[1;33m' : '\u001b[2;37m';
      return `${paint}${face}\u001b[0m`;
    })
    .join('   ');
  return '```ansi\n' + row + '\n```';
}

const ARCHETYPE_EMOJI: Record<string, string> = {
  primitive: '⚪',
  warrior: '⚔️',
  wayfarer: '🧭',
  artisan: '🔨',
  mother: '🌾',
  sage: '📜',
  trickster: '🎭',
};

const SKILL_EMOJI: Record<string, string> = {
  Slash: '⚔️',
  Pierce: '🗡️',
  Bash: '🪵',
  Unarmed: '✊',
  Intimidate: '😠',
  Deflection: '🛡️',
  Counter: '↩️',
  Command: '📣',
  Tactics: '♟️',
  Footwork: '👟',
  'Combat Awareness': '👁️',
  Thrown: '🎯',
  Scouting: '🔭',
  'Trapping & Tracking': '🐾',
  'Foraging & Fishing': '🎣',
  Archery: '🏹',
  'Sailing & Navigation': '⛵',
  'Animal Handling': '🐎',
  Dodge: '💨',
  Riding: '🏇',
  'Ambush & Camouflage': '🌿',
  Swimming: '🏊',
  Wilderness: '🏕️',
  Tradecraft: '🪙',
  'Tailoring & Armory': '🧵',
  'Smithing & Forging': '⚒️',
  'Carpentry & Masonry': '🪵',
  Brewing: '🍺',
  'Fine Crafts': '💎',
  Shipwright: '🚢',
  'Engineering & Design': '📐',
  'Bowyer & Fletcher': '🏹',
  Appraisal: '🔍',
  Handcrafting: '✋',
  Oversight: '👁️',
  'Tinkering & Repair': '🔧',
  'Cooking & Preserving': '🍲',
  Herbalism: '🌿',
  Childcare: '👶',
  'Animal Husbandry': '🐄',
  Farming: '🌾',
  Empathy: '🤝',
  Performance: '🎭',
  Healing: '💊',
  Etiquette: '🎩',
  Seduction: '🌹',
  Influence: '👑',
  Muse: '✨',
  'Debate & Rhetoric': '🗣️',
  'Arithmetic & Accounting': '🔢',
  Investigation: '🔎',
  'Folklore & Heraldry': '📖',
  Cartography: '🗺️',
  Mentoring: '🎓',
  Illustration: '🖌️',
  Negotiation: '🤝',
  Insight: '💡',
  Strategy: '🧠',
  Ritual: '🕯️',
  Preaching: '⛪',
  Lockpicking: '🔓',
  Pickpocket: '🤏',
  Sneak: '🤫',
  Forgery: '🖊️',
  'Slander & Ridicule': '🗯️',
  Smuggling: '📦',
  Deception: '🃏',
  Streetwise: '🌃',
  Acrobatics: '🤸',
  'Sleight of Hand': '🎩',
  'Off-hand & Improvised Combat': '🗡️',
  Climbing: '🧗',
};

function skillEmoji(name: string): string | undefined {
  return SKILL_EMOJI[name];
}

/** Shared roll result card — both Discord and Fluxer render this model. One embed. */
export function buildRollResultCard(input: RollCardInput): ChatCard {
  const markWord = input.marks === 1 ? 'mark' : 'marks';
  const fields: { name: string; value: string; inline: boolean }[] = [];
  if (input.omen != null) {
    fields.push({
      name: 'Omen',
      value: input.omenHit ? `${input.omen} · ${input.omenHit}` : String(input.omen),
      inline: true,
    });
  }
  fields.push({ name: 'Pool', value: input.poolFormula, inline: true });
  if (input.margin != null) {
    fields.push({ name: 'Margin', value: String(input.margin), inline: true });
  }
  const lines = [
    '5 or higher is a Mark, bright in the roll below.',
    '',
    diceAnsi(input.faces),
    '',
    `${dieMark(input.dieTier)}   ${input.intentLine}`,
  ];
  if (input.died) lines.push('', 'They died.');
  if (input.aside) lines.push('', input.aside);

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
    buttons.push({ id: `st-harm:${input.rollId}`, label: 'Harm', style: 'secondary' as const });
    buttons.push({ id: `undo:${input.rollId}`, label: 'Undo', style: 'danger' as const });
  }

  const links = [];
  if (input.liveSheetUrl) links.push({ label: 'Live sheet', url: input.liveSheetUrl });
  if (input.archiveSheetUrl) links.push({ label: 'Archive', url: input.archiveSheetUrl });

  return {
    title: `${input.characterName} rolled ${input.marks} ${markWord}`,
    description: lines.join('\n'),
    accent: dieAccent(input.dieTier),
    thumbnailUrl: input.portraitUrl,
    footer: dieTierLabel(input.dieTier),
    fields,
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
  /** Pool Cast will roll, already computed from the sheet. */
  poolFormula: string;
  echoes: { title: string }[];
  echoName?: string;
  liveSheetUrl?: string;
  /** Sheet's current Exertion. Omit when the caller has no sheet yet. */
  exertionCurrent?: number;
  dying?: boolean;
  dieImageUrl?: string;
  /** `primitive`, an archetype id, or unset until the player chooses. */
  archetype?: string;
  archetypes?: { id: string; name: string; tag?: string }[];
  skills?: { name: string; foundation?: string }[];
  /** Stabilise locks the skill to Healing and names who the roll is for. */
  stabilise?: boolean;
  patients?: { slug: string; name: string }[];
  patientSlug?: string;
}

/**
 * Legal Exertion spends. Empty when the sheet has none.
 * 2 is open when an Echo is named and two points remain. An illegal 2 stays in the cycle.
 */
export function exertionChoices(input: {
  exertion: number;
  exertionCurrent?: number;
  dying?: boolean;
  echoName?: string;
}): number[] {
  const current = input.exertionCurrent;
  const known = current != null;
  if (known && current <= 0) return [];
  const dying = Boolean(known && input.dying && current! >= 1);
  const echoOpensTwo = Boolean(input.echoName) && (!known || current! >= 2);
  const choices: number[] = [];
  if (!dying) choices.push(0);
  choices.push(1);
  if (echoOpensTwo || input.exertion >= 2) choices.push(2);
  return choices;
}

/** One button. Each press steps to the next legal Exertion, so the die button keeps its seat. */
function exertionButton(input: RollConfirmCardInput): ChatButton {
  const id = `roll-exert:${input.confirmId}`;
  const choices = exertionChoices(input);
  if (choices.length === 0) {
    return { id, label: 'Exertion empty', style: 'secondary', disabled: true };
  }
  const shown = choices.includes(input.exertion) ? input.exertion : choices[0]!;
  return { id, label: `Exertion · ${shown}`, style: 'secondary' };
}

export function dieTierButtonLabel(tier: number): string {
  if (tier === 6) return 'Die · d6 Disadvantage';
  if (tier === 12) return 'Die · d12 Advantage';
  return 'Die · d8 Ordinary';
}

/** One cast card: Foundation, Archetype, that Archetype’s skills, Echo, and the die. */
export function buildRollConfirmCard(input: RollConfirmCardInput): ChatCard {
  const foundSelect: ChatSelect = {
    id: `roll-found:${input.confirmId}`,
    placeholder: 'Foundation',
    options: input.foundations.slice(0, 25).map((f) => ({
      value: f,
      label: `Foundation · ${f}`,
      description: f === input.foundation ? 'Current' : undefined,
      default: f === input.foundation,
    })),
  };
  const archSelect: ChatSelect = {
    id: `roll-arch:${input.confirmId}`,
    placeholder: 'Archetype',
    options: [
      {
        value: 'primitive',
        label: 'Archetype · Primitive',
        description: 'Foundation alone',
        emoji: ARCHETYPE_EMOJI.primitive,
        default: input.archetype === 'primitive',
      },
      ...(input.archetypes ?? []).slice(0, 24).map((a) => ({
        value: a.id,
        label: `Archetype · ${a.name}`,
        description: a.tag,
        emoji: ARCHETYPE_EMOJI[a.id],
        default: a.id === input.archetype,
      })),
    ],
  };
  const listed = input.skills ?? [];
  const skillOptions =
    input.archetype === 'primitive'
      ? [{ value: 'primitive', label: 'Skill · Foundation alone', emoji: ARCHETYPE_EMOJI.primitive, default: true }]
      : listed.length
        ? listed.slice(0, 25).map((s) => ({
            value: s.name,
            label: `Skill · ${s.name}`,
            description: s.foundation ? `Guiding ${s.foundation}` : undefined,
            emoji: skillEmoji(s.name),
            default: s.name === input.skill,
          }))
        : input.skill
          ? [{ value: input.skill, label: `Skill · ${input.skill}`, emoji: skillEmoji(input.skill), default: true }]
          : [{ value: 'wait', label: 'Skill · choose an Archetype' }];
  const skillSelect: ChatSelect = {
    id: `roll-skill:${input.confirmId}`,
    placeholder: 'Skill',
    options: skillOptions,
  };
  const echoSelect: ChatSelect = {
    id: `roll-echo:${input.confirmId}`,
    placeholder: 'Echo',
    options: [
      { value: 'none', label: 'Echo · None', default: !input.echoName },
      ...input.echoes.slice(0, 24).map((echo) => ({
        value: echo.title,
        label: `Echo · ${echo.title}`.slice(0, 100),
        default: echo.title === input.echoName,
      })),
    ],
  };
  const spent = exertionChoices(input);
  const exertionShown = spent.length === 0 ? 'Empty' : String(spent.includes(input.exertion) ? input.exertion : spent[0]);
  const archetypeShown =
    input.archetype === 'primitive'
      ? 'Primitive'
      : (input.archetypes ?? []).find((a) => a.id === input.archetype)?.name ?? 'Choose one';
  const skillShown = input.skill
    ? input.skill
    : input.archetype === 'primitive'
      ? 'Foundation alone'
      : 'Choose one';
  const buttons: ChatButton[] = [
    { id: `roll-cast:${input.confirmId}`, label: 'Cast', style: 'primary' },
    exertionButton(input),
    {
      id: `roll-tier-cycle:${input.confirmId}`,
      label: dieTierButtonLabel(input.dieTier),
      style: 'secondary',
    },
    { id: `roll-cancel:${input.confirmId}`, label: 'Cancel', style: 'danger' },
  ];
  const patient = (input.patients ?? []).find((row) => row.slug === input.patientSlug);
  const patientSelect: ChatSelect = {
    id: `roll-patient:${input.confirmId}`,
    placeholder: 'Save',
    options: (input.patients ?? []).slice(0, 25).map((row) => ({
      value: row.slug,
      label: `Save · ${row.name}`.slice(0, 100),
      default: row.slug === input.patientSlug,
    })),
  };
  const healingSelect: ChatSelect = {
    id: `roll-skill:${input.confirmId}`,
    placeholder: 'Skill',
    options: [{ value: 'Healing', label: 'Skill · Healing', default: true }],
  };
  if (input.stabilise) {
    const lines = [
      'The skill is Healing. Pick the foundation, the die, Exertion, and an Echo if it applies.',
      '',
      'Die steps Disadvantage, Ordinary, and Advantage.',
      '',
      'Exertion spends one point, or two when an Echo is named.',
      '',
      `**${input.poolFormula}**`,
    ];
    if (input.liveSheetUrl) lines.push('', `[Sheet](${input.liveSheetUrl})`);
    return {
      title: `Stabilise · ${input.characterName}`,
      description: lines.join('\n'),
      accent: dieAccent(input.dieTier),
      thumbnailUrl: input.dieImageUrl,
      footer: 'Only you see this card. Cast posts the roll. Dying stays until the Session tab records the Trait.',
      fields: [
        { name: 'Save', value: patient?.name ?? 'Choose who', inline: true },
        { name: 'Foundation', value: input.foundation, inline: true },
        { name: 'Skill', value: 'Healing', inline: true },
        { name: 'Echo', value: input.echoName ?? 'None', inline: true },
        { name: 'Die', value: dieTierLabel(input.dieTier), inline: true },
        { name: 'Exertion', value: exertionShown, inline: true },
        { name: 'Pool', value: input.poolFormula, inline: false },
      ],
      buttons,
      selects: [patientSelect, foundSelect, healingSelect, echoSelect],
    };
  }
  const lines = [
    'The menus are Foundation, Archetype, Skill, and Echo, in that order.',
    '',
    'Die steps Disadvantage, Ordinary, and Advantage.',
    '',
    'Exertion spends one point, or two when an Echo is named.',
    '',
    `**${input.poolFormula}**`,
  ];
  if (input.liveSheetUrl) lines.push('', `[Sheet](${input.liveSheetUrl})`);
  return {
    title: `Ready · ${input.characterName}`,
    description: lines.join('\n'),
    accent: dieAccent(input.dieTier),
    thumbnailUrl: input.dieImageUrl,
    footer: 'Only you see this card. Cast posts the roll.',
    fields: [
      { name: 'Foundation', value: input.foundation, inline: true },
      { name: 'Archetype', value: archetypeShown, inline: true },
      { name: 'Skill', value: skillShown, inline: true },
      { name: 'Echo', value: input.echoName ?? 'None', inline: true },
      { name: 'Die', value: dieTierLabel(input.dieTier), inline: true },
      { name: 'Exertion', value: exertionShown, inline: true },
      { name: 'Pool', value: input.poolFormula, inline: false },
    ],
    buttons,
    selects: [foundSelect, archSelect, skillSelect, echoSelect],
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
  dieImageUrl?: string;
}

/** ST Intent card — equal peer to free-roll; player presses Roll when ready. */
export function buildRollPromptCard(input: RollPromptCardInput): ChatCard {
  const intent = input.skill
    ? `${input.foundation} + ${input.skill} · ${dieTierShort(input.dieTier)}`
    : `${input.foundation} (Primitive) · ${dieTierShort(input.dieTier)}`;
  return {
    title: input.characterName ? `Intent · ${input.characterName}` : 'Intent · roll when ready',
    description: `**${input.stName}** posts the agreed pool: **${intent}**`,
    accent: dieAccent(input.dieTier),
    thumbnailUrl: input.dieImageUrl,
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

/** ST assigns precalculated harm points to one track. */
export function buildHarmAssignCard(input: HarmAssignCardInput): ChatCard {
  return {
    title: `Harm · ${input.characterName}`,
    description: `**${input.points}** point(s) available (${input.family}, ratio ${input.ratio}). Choose the track.`,
    accent: 'blood',
    fields: [
      { name: 'Family', value: input.family, inline: true },
      { name: 'Points', value: String(input.points), inline: true },
    ],
    footer: 'One family per infliction. The points land on the track you choose.',
    selects: [
      {
        id: `harm-track:${input.rollId}:${input.family}:${input.points}`,
        placeholder: 'Track…',
        options: input.tracks.slice(0, 25).map((track) => ({
          value: track,
          label: track,
        })),
      },
    ],
    buttons: [{ id: `harm-cancel:${input.rollId}`, label: 'Cancel', style: 'danger' }],
  };
}

/** Public hall asset. Omitted for loopback, which a chat client cannot fetch. Stays in step with dieImageUrl. */
export function publicAssetUrl(base: string | undefined, path: string): string | undefined {
  if (!base || !path.startsWith('/')) return undefined;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  return `${url.origin}${path}`;
}

/** A portrait the chat client can fetch. Loopback and relative files without a public hall are omitted. */
export function fetchablePicture(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  return url.toString();
}

/** Same words as tideMarkerWords in hall-render. */
export function tideMarkerSentence(tide: {
  sideA: string;
  sideB: string;
  position: number;
  length: number;
}): string {
  if (tide.position <= 0) return `${tide.sideA} has collapsed.`;
  if (tide.position >= tide.length) return `${tide.sideB} has collapsed.`;
  return `The marker stands at ${tide.position} of ${tide.length}.`;
}

export function tideSizeLabel(size: string): string {
  if (size === 'small') return 'Small skirmish';
  if (size === 'battle') return 'Battle';
  return 'Skirmish';
}

export function tideFootingLabel(footing: string, sideA: string, sideB: string): string {
  if (footing === 'slightA') return `${sideA} at a slight disadvantage`;
  if (footing === 'slightB') return `${sideB} at a slight disadvantage`;
  if (footing === 'severeA') return `${sideA} at a severe disadvantage`;
  if (footing === 'severeB') return `${sideB} at a severe disadvantage`;
  return 'Equal footing';
}

const TIDE_STONE = 0x8a8580;

export interface TideCardInput {
  sideA: string;
  sideB: string;
  position: number;
  length: number;
  sizeLabel: string;
  footingLabel: string;
  imageUrl?: string;
  closed?: boolean;
}

/** Channel Tide. Close sits on the message. A closed card stays as history. */
export function buildTideCard(input: TideCardInput): ChatCard {
  const marker = tideMarkerSentence(input);
  return {
    title: 'The Tide',
    description: input.closed ? `Closed. ${marker}` : marker,
    color: TIDE_STONE,
    imageUrl: input.imageUrl,
    fields: [
      { name: input.sideA, value: '0', inline: true },
      { name: 'Marker', value: `${input.position} of ${input.length}`, inline: true },
      { name: input.sideB, value: String(input.length), inline: true },
      { name: 'Size', value: input.sizeLabel, inline: true },
      { name: 'Footing', value: input.footingLabel, inline: false },
    ],
    buttons: input.closed
      ? undefined
      : [
          { id: 'tide-roll', label: 'Roll', style: 'primary' },
          { id: 'tide-close', label: 'Close', style: 'secondary' },
        ],
  };
}

/** One public net. Lines are the public faces only; whispers stay off this card. */
export function buildOmenBoardCard(input: {
  lines: readonly { face: number; effect: string }[];
  imageUrl?: string;
}): ChatCard {
  const text = input.lines.length
    ? input.lines.map((row) => `${row.face}. ${row.effect}`).join('\n')
    : 'No public lines yet.';
  return {
    title: 'Omens',
    description: text.slice(0, 4000),
    color: TIDE_STONE,
    imageUrl: input.imageUrl,
  };
}

export interface SeenClaimCardInput {
  personName: string;
  line: string;
  targetSlug: string;
  claimId: string;
  thumbnailUrl?: string;
  closed?: 'accepted' | 'refused';
}

/** Public claim card. The title is the person. A webhook username waits on an edge op. */
export function buildSeenClaimCard(input: SeenClaimCardInput): ChatCard {
  const tail =
    input.closed === 'accepted' ? '\n\nAccepted.' : input.closed === 'refused' ? '\n\nRefused.' : '';
  return {
    title: input.personName,
    description: `${input.line}${tail}`,
    thumbnailUrl: input.thumbnailUrl,
    footer: input.closed
      ? undefined
      : 'A second accepts the claim. The Storyteller and the person may refuse together.',
    buttons: input.closed
      ? undefined
      : [
          { id: `claim-second:${input.targetSlug}:${input.claimId}`, label: 'Second', style: 'primary' },
          { id: `claim-accept:${input.targetSlug}:${input.claimId}`, label: 'Accept', style: 'success' },
          {
            id: `claim-refuse:st:${input.targetSlug}:${input.claimId}`,
            label: 'Storyteller refuses',
            style: 'secondary',
          },
          {
            id: `claim-refuse:target:${input.targetSlug}:${input.claimId}`,
            label: 'They refuse',
            style: 'secondary',
          },
        ],
  };
}

/**
 * Card plus the webhook the channel would use once an edge op exists.
 * The webhook is not sent from here.
 */
export function seenClaimDelivery(input: SeenClaimCardInput): {
  card: ChatCard;
  webhook?: { username: string; avatarUrl: string };
} {
  const card = buildSeenClaimCard(input);
  const avatarUrl = input.thumbnailUrl;
  return avatarUrl
    ? { card, webhook: { username: input.personName, avatarUrl } }
    : { card };
}
