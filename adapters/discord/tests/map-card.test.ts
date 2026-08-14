import { describe, expect, it } from 'vitest';
import { mapCardToDiscordPayload } from '../src/index.js';

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
});
