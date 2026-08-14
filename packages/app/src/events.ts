import {
  refreshCharacterDerived,
  type CharacterRecord,
  type CommunityRecord,
  type CommunityStorePort,
} from '@kodranni/store';

function requireCharacter(store: CommunityStorePort, slug: string): CharacterRecord {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) throw new Error(`unknown character slug: ${slug}`);
  if (ch.status === 'dead') throw new Error(`${ch.name} is dead`);
  return ch;
}

export interface ReclaimExertionCommand {
  characterSlug: string;
  /** Points to reclaim (default: fill to max). */
  points?: number;
  actor?: string;
  clientEventId?: string;
  note?: string;
}

export function reclaimExertion(
  store: CommunityStorePort,
  cmd: ReclaimExertionCommand,
): CharacterRecord {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }
  const ch = requireCharacter(store, cmd.characterSlug);
  refreshCharacterDerived(ch);
  const before = ch.exertion.current;
  const want = cmd.points ?? ch.exertion.max - before;
  if (want < 0) throw new Error('points must be ≥ 0');
  ch.exertion.current = Math.min(ch.exertion.max, before + want);
  refreshCharacterDerived(ch);
  store.putCharacter(ch);
  store.appendEvent({
    type: 'ResourceChanged',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: {
      kind: 'exertion_reclaim',
      characterSlug: ch.slug,
      before,
      after: ch.exertion.current,
      note: cmd.note,
    },
  });
  return ch;
}

export interface HealHarmCommand {
  characterSlug: string;
  track: string;
  points: number;
  actor?: string;
  clientEventId?: string;
  note?: string;
}

export function healHarm(store: CommunityStorePort, cmd: HealHarmCommand): CharacterRecord {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }
  if (cmd.points <= 0 || !Number.isInteger(cmd.points)) {
    throw new Error('points must be a positive integer');
  }
  const ch = requireCharacter(store, cmd.characterSlug);
  const before = ch.harm[cmd.track] ?? 0;
  if (before <= 0) throw new Error(`no harm on track ${cmd.track}`);
  ch.harm[cmd.track] = Math.max(0, before - cmd.points);
  // Clear dying if no track at 3
  if (!Object.values(ch.harm).some((p) => p >= 3)) {
    ch.dying = false;
  }
  refreshCharacterDerived(ch);
  store.putCharacter(ch);
  store.appendEvent({
    type: 'ResourceChanged',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: {
      kind: 'harm_heal',
      characterSlug: ch.slug,
      track: cmd.track,
      before,
      after: ch.harm[cmd.track],
      note: cmd.note,
    },
  });
  return ch;
}

export type FortuneKey = 'vitality' | 'cohesion' | 'surplus' | 'standing' | 'tradition';

export interface ShiftFortuneCommand {
  fortune: FortuneKey;
  /** Usually −1 or +1; result clamped 0–3. */
  delta: number;
  actor?: string;
  clientEventId?: string;
  note?: string;
}

export function shiftFortune(
  store: CommunityStorePort,
  cmd: ShiftFortuneCommand,
): CommunityRecord {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }
  if (!Number.isInteger(cmd.delta) || cmd.delta === 0) {
    throw new Error('delta must be a non-zero integer');
  }
  const community = store.getCommunity();
  const before = community.fortunes[cmd.fortune];
  if (before === undefined) throw new Error(`unknown fortune: ${cmd.fortune}`);
  const after = Math.max(0, Math.min(3, before + cmd.delta));
  community.fortunes[cmd.fortune] = after;
  store.putCommunity(community);
  store.appendEvent({
    type: 'ResourceChanged',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: {
      kind: 'fortune_shift',
      fortune: cmd.fortune,
      before,
      after,
      note: cmd.note,
    },
  });
  return community;
}

export interface SetSuppliesCommand {
  characterSlug: string;
  foodDays?: number;
  waterDays?: number;
  actor?: string;
  clientEventId?: string;
  note?: string;
}

export function setSupplies(
  store: CommunityStorePort,
  cmd: SetSuppliesCommand,
): CharacterRecord {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }
  const ch = requireCharacter(store, cmd.characterSlug);
  const before = {
    foodDays: ch.inventory.foodDays,
    waterDays: ch.inventory.waterDays,
  };
  if (cmd.foodDays != null) {
    if (cmd.foodDays < 0 || !Number.isInteger(cmd.foodDays)) {
      throw new Error('foodDays must be a non-negative integer');
    }
    ch.inventory.foodDays = cmd.foodDays;
  }
  if (cmd.waterDays != null) {
    if (cmd.waterDays < 0 || !Number.isInteger(cmd.waterDays)) {
      throw new Error('waterDays must be a non-negative integer');
    }
    ch.inventory.waterDays = cmd.waterDays;
  }
  store.putCharacter(ch);
  store.appendEvent({
    type: 'ResourceChanged',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: {
      kind: 'supplies',
      characterSlug: ch.slug,
      before,
      after: {
        foodDays: ch.inventory.foodDays,
        waterDays: ch.inventory.waterDays,
      },
      note: cmd.note,
    },
  });
  return ch;
}

export interface InventoryItemCommand {
  characterSlug: string;
  name: string;
  note?: string;
  actor?: string;
  clientEventId?: string;
}

export function addInventoryItem(
  store: CommunityStorePort,
  cmd: InventoryItemCommand,
): CharacterRecord {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }
  const ch = requireCharacter(store, cmd.characterSlug);
  const name = cmd.name.trim();
  if (!name) throw new Error('item name required');
  ch.inventory.items.push({ name, note: cmd.note });
  store.putCharacter(ch);
  store.appendEvent({
    type: 'ResourceChanged',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: {
      kind: 'inventory_add',
      characterSlug: ch.slug,
      name,
      note: cmd.note,
    },
  });
  return ch;
}

export function removeInventoryItem(
  store: CommunityStorePort,
  cmd: InventoryItemCommand,
): CharacterRecord {
  if (cmd.clientEventId && store.hasClientEvent(cmd.clientEventId)) {
    throw new Error(`duplicate clientEventId: ${cmd.clientEventId}`);
  }
  const ch = requireCharacter(store, cmd.characterSlug);
  const name = cmd.name.trim();
  const idx = ch.inventory.items.findIndex(
    (i) => i.name.toLowerCase() === name.toLowerCase(),
  );
  if (idx < 0) throw new Error(`item not found: ${name}`);
  const [removed] = ch.inventory.items.splice(idx, 1);
  store.putCharacter(ch);
  store.appendEvent({
    type: 'ResourceChanged',
    actor: cmd.actor,
    clientEventId: cmd.clientEventId,
    payload: {
      kind: 'inventory_remove',
      characterSlug: ch.slug,
      name: removed?.name,
    },
  });
  return ch;
}
