import { describe, expect, it } from 'vitest';
import { FLUXER_PREFIX_COMMANDS, parsePrefixCommand, prefixCommandOptions } from '../src/index.js';

describe('parsePrefixCommand', () => {
  it('carries each Discord command word', () => {
    for (const name of FLUXER_PREFIX_COMMANDS) {
      expect(parsePrefixCommand(`!${name}`)).toEqual({ name, args: '' });
    }
    expect(parsePrefixCommand('!award-word Mara')).toEqual({ name: 'award-word', args: 'Mara' });
    expect(parsePrefixCommand('!NPC-ROLL the miller')).toEqual({ name: 'npc-roll', args: 'the miller' });
    expect(parsePrefixCommand('/roll Marino Orvanti')).toEqual({
      name: 'roll',
      args: 'Marino Orvanti',
    });
  });

  it('ignores ordinary speech and words that are not commands', () => {
    expect(parsePrefixCommand('roll the dice')).toBeNull();
    expect(parsePrefixCommand('!tide')).toBeNull();
    expect(parsePrefixCommand('!claim-second')).toBeNull();
    expect(parsePrefixCommand('')).toBeNull();
  });

  it('reads a named sheet and keyed dice', () => {
    expect(prefixCommandOptions('roll', 'Marino Orvanti')).toEqual({ character: 'Marino Orvanti' });
    expect(prefixCommandOptions('roll', 'skill:Command character:Marino Orvanti')).toEqual({
      skill: 'Command',
      character: 'Marino Orvanti',
    });
    expect(prefixCommandOptions('npc-roll', '2 0 the miller')).toEqual({
      foundation: 2,
      skill: 0,
      label: 'the miller',
    });
    expect(prefixCommandOptions('birth-omen', '11')).toEqual({ face: 11 });
  });
});
