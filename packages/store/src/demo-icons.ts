import type { CharacterRecord } from './types.js';

/** Item pictures for the Aspalath demo, keyed by slug then item name. */
export const DEMO_ITEM_ICONS: Record<string, Record<string, string>> = {
  tomaso: { Adze: '/demo-items/adze.png', 'Screw-jack': '/demo-items/screw-jack.png' },
  jakov: { Sword: '/demo-items/sword.png', Shield: '/demo-items/shield.png' },
  caterina: { 'Inner-stair keys': '/demo-items/keys.png', 'Sleeve-knife': '/demo-items/knife.png' },
  niccolo: { 'Warehouse keys': '/demo-items/keys.png', Coin: '/demo-items/coin.png' },
  marino: { 'Ducal ring': '/demo-items/ring.png', 'Brother’s sword': '/demo-items/sword.png' },
  orsa: { 'Marriage-band': '/demo-items/ring.png', Purse: '/demo-items/purse.png' },
  lovro: { 'Vestry key': '/demo-items/keys.png', 'Book of the dead': '/demo-items/book.png' },
  piero: { 'Warehouse key': '/demo-items/keys.png', 'Charter copy': '/demo-items/charter.png' },
  mara: { 'Credit-stick': '/demo-items/tally.png', 'Latch-key': '/demo-items/keys.png' },
  vito: { 'Name-list': '/demo-items/name-list.png', 'Household sword': '/demo-items/sword.png' },
  paolo: { 'Name-list copy': '/demo-items/name-list.png', Ink: '/demo-items/ink.png' },
  agnese: { 'Name-list': '/demo-items/name-list.png' },
  luca: { 'Pay-chest': '/demo-items/chest.png', 'Landing-book': '/demo-items/charter.png' },
  matteo: { Charter: '/demo-items/charter.png', Gold: '/demo-items/coin.png' },
  duje: { Boat: '/demo-items/boat.png', 'Oil-jars': '/demo-items/oil-jars.png' },
};

/** Older live demo stores were seeded before wells had icons. Fill from the current hall. */
export function fillDemoItemIcons(ch: CharacterRecord): CharacterRecord {
  const byName = DEMO_ITEM_ICONS[ch.slug];
  if (!byName) return ch;
  let changed = false;
  const items = (ch.inventory.items ?? []).map((item) => {
    if (item.icon) return item;
    const icon = byName[item.name];
    if (!icon) return item;
    changed = true;
    return { ...item, icon };
  });
  if (!changed) return ch;
  return { ...ch, inventory: { ...ch.inventory, items } };
}
