import {
  echoCapacity,
  effectiveFoundation,
  exertionMax,
  isDecadent,
  isOverCapacity,
  totalEchoWeight,
} from '@kodranni/domain';
import type { CharacterRecord } from './types.js';
import { activeEchoes } from './echo-effects.js';

const FOUNDATION_TO_HARM: Record<string, string> = {
  Strength: 'Crushed',
  Dexterity: 'Bleeding',
  Constitution: 'Fever',
  Intellect: 'Fog',
  Perception: 'Disoriented',
  Resolve: 'Shock',
  Charisma: 'Tarnished',
  Guile: 'Exposed',
  Authority: 'Disgrace',
};

/**
 * Recompute max Exertion, Echo capacity, effective Foundations, and flags.
 * Capacities use **raw** Foundations; pool effectives use Harm.
 * Only unresolved Echoes count toward weight and Decadence.
 */
export function refreshCharacterDerived(ch: CharacterRecord): CharacterRecord {
  const f = ch.foundations;
  ch.exertion.max = exertionMax(f.Resolve ?? 0, f.Constitution ?? 0, f.Charisma ?? 0);
  ch.echoCapacity = echoCapacity(
    f.Strength ?? 0,
    f.Dexterity ?? 0,
    f.Intellect ?? 0,
    f.Authority ?? 0,
  );
  const active = activeEchoes(ch.echoes ?? []);
  ch.echoWeight = totalEchoWeight(active.map((e) => e.weight));
  ch.flags.decadence = isDecadent(active.length);
  ch.flags.overCapacity = isOverCapacity(ch.echoWeight, ch.echoCapacity);

  if (ch.exertion.current > ch.exertion.max) {
    ch.exertion.current = ch.exertion.max;
  }

  for (const [k, v] of Object.entries(ch.foundations)) {
    const harmKey = FOUNDATION_TO_HARM[k];
    const h = harmKey ? (ch.harm[harmKey] ?? 0) : 0;
    ch.foundationsEffective[k] = effectiveFoundation(v, h);
  }
  return ch;
}
