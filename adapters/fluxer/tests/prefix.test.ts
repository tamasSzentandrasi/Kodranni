import { describe, expect, it } from 'vitest';
import { FLUXER_PREFIX_COMMANDS, parsePrefixCommand } from '../src/index.js';

describe('parsePrefixCommand', () => {
  it('carries each Discord command word', () => {
    for (const name of FLUXER_PREFIX_COMMANDS) {
      expect(parsePrefixCommand(`!${name}`)).toEqual({ name, args: '' });
    }
    expect(parsePrefixCommand('!award-word Mara')).toEqual({ name: 'award-word', args: 'Mara' });
    expect(parsePrefixCommand('!NPC-ROLL the miller')).toEqual({ name: 'npc-roll', args: 'the miller' });
  });

  it('ignores ordinary speech and words that are not commands', () => {
    expect(parsePrefixCommand('roll the dice')).toBeNull();
    expect(parsePrefixCommand('!tide')).toBeNull();
    expect(parsePrefixCommand('!claim-second')).toBeNull();
    expect(parsePrefixCommand('')).toBeNull();
  });
});
