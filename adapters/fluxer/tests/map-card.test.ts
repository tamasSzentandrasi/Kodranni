import { describe, expect, it } from 'vitest';
import { mapCardToFluxerPayload, resolveFluxerReaction } from '../src/index.js';

describe('mapCardToFluxerPayload', () => {
  it('uses the same die accent and thumbnail as Discord', () => {
    const p = mapCardToFluxerPayload({
      title: 'Tomas',
      description: 'd6 · Disadvantage',
      accent: 'd6',
      thumbnailUrl: 'https://aspalath.kodranni.com/dice/d6.png',
      buttons: [{ id: 'oppose:1', label: 'Oppose', disabled: true }],
    });
    expect(p.embeds[0]).toMatchObject({
      color: 0x6a9bb8,
      thumbnail: { url: 'https://aspalath.kodranni.com/dice/d6.png' },
    });
    expect(p.components).toEqual([
      {
        type: 1,
        components: [{ type: 2, custom_id: 'oppose:1', label: 'Oppose', disabled: true }],
      },
    ]);
    expect(p.reactions).toBeUndefined();
  });

  it('maps an enabled button to a reaction and a wide picture', () => {
    const p = mapCardToFluxerPayload({
      title: 'The Tide',
      description: 'The marker stands at 8 of 15.',
      imageUrl: 'https://aspalath.kodranni.com/session/tide.png?p=8',
      buttons: [
        { id: 'tide-close', label: 'Close' },
        { id: 'oppose:1', label: 'Oppose' },
        { id: 'why-pool:1', label: 'Why this pool?' },
      ],
    });
    expect(p.embeds[0]).toMatchObject({
      image: { url: 'https://aspalath.kodranni.com/session/tide.png?p=8' },
    });
    expect(p.reactions).toEqual([
      { emoji: '✕', id: 'tide-close' },
      { emoji: '⚔', id: 'oppose:1' },
      { emoji: '❓', id: 'why-pool:1' },
    ]);
    expect(resolveFluxerReaction({ customId: 'tide-close', actorIsStoryteller: false })).toEqual({
      allowed: false,
      remove: true,
      once: false,
    });
    expect(resolveFluxerReaction({ customId: 'oppose:1', actorIsStoryteller: false })).toEqual({
      allowed: true,
      remove: false,
      once: false,
    });
    expect(resolveFluxerReaction({ customId: 'undo:1', actorIsStoryteller: true }).once).toBe(true);
    expect(resolveFluxerReaction({ customId: 'why-pool:1', actorIsStoryteller: false }).once).toBe(false);
    const roll = mapCardToFluxerPayload({
      title: 'The Tide',
      description: '{{kod-die:d8}}',
      buttons: [{ id: 'tide-roll', label: 'Roll' }],
    });
    expect(roll.embeds[0]).toMatchObject({ description: '🎲' });
    expect(roll.reactions).toEqual([{ emoji: '🎲', id: 'tide-roll' }]);
  });

});
