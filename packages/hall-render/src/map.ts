import type { RelationMap } from '@kodranni/store/types';
import { esc, escAttr } from './escape.js';

export function mapFolioLink(): string {
  return `<p class="cmap-entry"><a class="cmap-mark cmap-mark--lg" href="/character-map/" aria-label="Character map" data-tip="Character map"><img src="/ornament/cmap-mark.jpg" alt="" width="160" height="160"/></a></p>`;
}

export function mapInner(
  map: RelationMap | undefined,
  opts?: { person?: string },
): string {
  const person = opts?.person?.trim() ?? '';
  const payload = JSON.stringify(map ?? { nodes: [], edges: [] }).replace(/</g, '\\u003c');
  const has = Boolean(map && map.nodes.length);
  return `<div class="kod-cmap" data-person="${escAttr(person)}" data-map="${escAttr(payload)}">
  <div class="kod-cmap__bar">
    <label class="kod-cmap__find">Find
      <input type="search" data-cmap-find autocomplete="off" spellcheck="false"/>
    </label>
    <button type="button" class="kod-cmap__family" data-cmap-family disabled>Family</button>
    <p class="kod-cmap__focus" data-cmap-focus hidden>
      <span data-cmap-focus-name></span>
      <a class="kod-cmap__sheet" data-cmap-sheet hidden>Open sheet</a>
    </p>
  </div>
  <p class="kod-cmap__empty" data-cmap-empty ${has ? 'hidden' : ''}>No map published yet.</p>
  <div class="kod-cmap__frame">
    <p class="kod-cmap__wait" data-cmap-wait ${has ? '' : 'hidden'}>Drawing the map…</p>
    <div class="kod-cmap__web" data-cmap-web ${has ? '' : 'hidden'}></div>
  </div>
  <template id="kod-map-data">${payload}</template>
</div>`;
}
