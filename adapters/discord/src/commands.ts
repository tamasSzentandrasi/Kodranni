import { SlashCommandBuilder } from 'discord.js';
import { FOUNDATION_NAMES } from '@kodranni/domain';

const foundationChoices = () => FOUNDATION_NAMES.map((f) => ({ name: f, value: f }));

const dieTier = (o: {
  setName: (n: string) => typeof o;
  setDescription: (d: string) => typeof o;
  addChoices: (...c: { name: string; value: number }[]) => typeof o;
}) =>
  o
    .setName('tier')
    .setDescription('Die tier (ST agreement; default d8 Ordinary)')
    .addChoices(
      { name: 'd6 · Disadvantage', value: 6 },
      { name: 'd8 · Equal', value: 8 },
      { name: 'd12 · Advantage', value: 12 },
    );

export const SLASH = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll what the table agreed — skill autocomplete, then confirm')
    .addStringOption((o) =>
      o
        .setName('skill')
        .setDescription('Skill (type to search; omit → pick Archetype)')
        .setAutocomplete(true),
    )
    .addStringOption((o) =>
      o
        .setName('foundation')
        .setDescription('Foundation (often not the guiding one)')
        .addChoices(...foundationChoices()),
    )
    .addIntegerOption((o) => dieTier(o))
    .addIntegerOption((o) =>
      o
        .setName('exertion')
        .setDescription('Exertion dice to spend (0–2; 2 needs Echo applies)')
        .setMinValue(0)
        .setMaxValue(2),
    )
    .addBooleanOption((o) =>
      o.setName('echo').setDescription('Echo applies — only if the table agreed it matches'),
    )
    .addStringOption((o) =>
      o.setName('character').setDescription('Character slug if you have more than one'),
    ),
  new SlashCommandBuilder()
    .setName('intent')
    .setDescription('ST: post the agreed pool for a player to Roll')
    .addUserOption((o) =>
      o.setName('player').setDescription('Player who should roll').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('skill').setDescription('Skill (type to search)').setAutocomplete(true),
    )
    .addStringOption((o) =>
      o
        .setName('foundation')
        .setDescription('Foundation (often not the guiding one)')
        .addChoices(...foundationChoices()),
    )
    .addIntegerOption((o) => dieTier(o))
    .addStringOption((o) =>
      o.setName('character').setDescription('Optional character slug for the player'),
    ),
  new SlashCommandBuilder()
    .setName('create')
    .setDescription('Start a character draft bound to you (edit on the live sheet)')
    .addStringOption((o) => o.setName('name').setDescription('Provisional character name')),
  new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim an ST prebuilt / guest character')
    .addStringOption((o) =>
      o.setName('character').setDescription('Claimable character slug').setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('focus')
    .setDescription('Set which of your characters is active for rolls')
    .addStringOption((o) =>
      o.setName('character').setDescription('Character slug').setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('birth-omen')
    .setDescription('Weighing: private Birth Omen d20 → Foundation points on sheet')
    .addStringOption((o) =>
      o.setName('character').setDescription('Draft character slug').setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('face')
        .setDescription('Optional fixed face 1–20 (tests); omit to roll')
        .setMinValue(1)
        .setMaxValue(20),
    ),
  new SlashCommandBuilder()
    .setName('guiding-hand')
    .setDescription('Weighing: private Guiding Hand d20 → Skill points on sheet')
    .addStringOption((o) =>
      o.setName('character').setDescription('Draft character slug').setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('face')
        .setDescription('Optional fixed face 1–20; omit to roll')
        .setMinValue(1)
        .setMaxValue(20),
    ),
  new SlashCommandBuilder()
    .setName('award-word')
    .setDescription('ST: award 1 Word to a speaker after an accepted claim')
    .addStringOption((o) =>
      o.setName('character').setDescription('Speaker character slug').setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('ST: post Approve/Changes/Deny cards for pending drafts')
    .addStringOption((o) =>
      o.setName('character').setDescription('Optional slug; omit to post all pending'),
    ),
  new SlashCommandBuilder()
    .setName('st-roll')
    .setDescription('ST NPC roll (numeric pool, no PC sheet)')
    .addIntegerOption((o) =>
      o.setName('foundation').setDescription('Foundation dice').setRequired(true),
    )
    .addIntegerOption((o) => o.setName('skill').setDescription('Skill dice').setRequired(true))
    .addStringOption((o) => o.setName('label').setDescription('NPC label'))
    .addIntegerOption((o) => dieTier(o)),
  new SlashCommandBuilder().setName('live').setDescription('Show live / archive sheet URLs'),
  new SlashCommandBuilder()
    .setName('map')
    .setDescription('Emergency: map user → character (prefer /create + Confirm)')
    .addUserOption((o) => o.setName('user').setDescription('Discord user').setRequired(true))
    .addStringOption((o) =>
      o.setName('character').setDescription('Character slug').setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName('role')
        .setDescription('player or storyteller')
        .addChoices(
          { name: 'player', value: 'player' },
          { name: 'storyteller', value: 'storyteller' },
        ),
    ),
].map((c) => c.toJSON());
