import { describe, expect, it } from 'vitest';
import { ButtonStyle } from 'discord.js';
import { mapCardToDiscordPayload, mapCardToDiscordRest } from '../src/index.js';

describe('mapCardToDiscordPayload', () => {
  it('maps blood embed and buttons', () => {
    const p = mapCardToDiscordPayload({
      title: 'Leifr',
      description: 'Authority + Command',
      accent: 'blood',
      fields: [{ name: 'Marks', value: '**2**', inline: true }],
      buttons: [{ id: 'why-pool:1', label: 'Why this pool?', style: 'secondary' }],
    });
    expect(p.embeds).toHaveLength(1);
    expect(p.components.length).toBeGreaterThan(0);
  });

  it('maps links to Discord Link buttons', () => {
    const p = mapCardToDiscordPayload({
      title: 'Tomas',
      description: 'Strength + Slash · d8',
      links: [{ label: 'Live sheet', url: 'https://example.test/characters/tomas/' }],
    });
    const row = p.components.find((r) =>
      r.components.some((c) => 'data' in c && (c as { data?: { style?: number } }).data?.style === ButtonStyle.Link),
    );
    expect(row).toBeTruthy();
  });

  it('serialises REST JSON without EmbedBuilder instances', () => {
    const p = mapCardToDiscordRest({
      title: 'Leifr',
      description: 'Authority + Command',
      accent: 'blood',
      buttons: [{ id: 'why-pool:1', label: 'Why this pool?', style: 'secondary' }],
    });
    expect(p.embeds[0]).toMatchObject({ title: 'Leifr' });
    expect(JSON.parse(JSON.stringify(p)).embeds[0].title).toBe('Leifr');
  });

  it('colours a die-tier card and points at the die picture', () => {
    const p = mapCardToDiscordRest({
      title: 'Tomas',
      description: 'd12 · Advantage',
      accent: 'd12',
      thumbnailUrl: 'https://aspalath.kodranni.com/dice/d12.png',
    });
    expect(p.embeds[0]).toMatchObject({
      color: 0xe0b44a,
      thumbnail: { url: 'https://aspalath.kodranni.com/dice/d12.png' },
    });
  });

  it('keeps Marks on the first embed and the pool on another', () => {
    const p = mapCardToDiscordRest({
      title: '2 Marks',
      description: '{{kod-die:d8}}   **5**',
      accent: 'd8',
      panels: [
        { title: 'Tomas', description: 'Strength + Slash' },
        { title: 'Pool', description: '2d8' },
      ],
      selects: [
        { id: 'roll-found:1', placeholder: 'Foundation', options: [{ value: 'Strength', label: 'Strength' }] },
        { id: 'roll-arch:1', placeholder: 'Archetype', options: [{ value: 'primitive', label: 'Primitive' }] },
        { id: 'roll-skill:1', placeholder: 'Skill', options: [{ value: 'wait', label: 'Choose' }] },
        { id: 'roll-echo:1', placeholder: 'Echo', options: [{ value: 'none', label: 'None' }] },
      ],
    });
    expect(p.embeds.map((e) => (e as { title?: string }).title)).toEqual(['2 Marks', 'Tomas', 'Pool']);
    expect(p.components).toHaveLength(4);
  });

  it('sets the wide picture when the card has one', () => {
    const p = mapCardToDiscordRest({
      title: 'The Tide',
      color: 0x8a8580,
      imageUrl: 'https://aspalath.kodranni.com/session/tide.png?p=8',
    });
    expect(p.embeds[0]).toMatchObject({
      color: 0x8a8580,
      image: { url: 'https://aspalath.kodranni.com/session/tide.png?p=8' },
    });
  });
});
