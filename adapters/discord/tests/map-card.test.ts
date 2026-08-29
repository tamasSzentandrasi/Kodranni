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
});
