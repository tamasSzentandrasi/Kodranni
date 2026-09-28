import type { RelationMap } from '@kodranni/store/types';
import { esc, escAttr } from './escape.js';

export function mapFolioLink(): string {
  return `<p class="cmap-entry"><a class="cmap-mark cmap-mark--lg" href="/character-map/" aria-label="Character map" data-tip="Character map"><img src="/ornament/cmap-mark.jpg" alt="" width="160" height="160"/></a></p>`;
}

export type MapMeta = {
  campaign: string;
  groups: { id: string; name: string; kind: string }[];
  labels: { id: string; groupId: string; name: string; hue?: number }[];
  roster: { slug: string; labelIds: string[] }[];
};

export function mapInner(
  map: RelationMap | undefined,
  opts?: { person?: string; meta?: MapMeta },
): string {
  const person = opts?.person?.trim() ?? '';
  const payload = JSON.stringify(map ?? { nodes: [], edges: [] }).replace(/</g, '\\u003c');
  const meta = JSON.stringify(
    opts?.meta ?? { campaign: '', groups: [], labels: [], roster: [] },
  ).replace(/</g, '\\u003c');
  const has = Boolean(map && map.nodes.length);
  return `<div class="kod-cmap" data-person="${escAttr(person)}" data-map="${escAttr(payload)}" data-campaign="${escAttr(opts?.meta?.campaign ?? '')}">
  <p class="kod-cmap__focus" data-cmap-focus hidden>
    <span data-cmap-focus-name></span>
  </p>
  <p class="kod-cmap__empty" data-cmap-empty ${has ? 'hidden' : ''}>No map published yet.</p>
  <div class="kod-cmap__frame">
    <p class="kod-cmap__wait" data-cmap-wait ${has ? '' : 'hidden'}>Drawing the map…</p>
    <div class="kod-cmap__web" data-cmap-web ${has ? '' : 'hidden'}></div>
  </div>
  <template id="kod-map-data">${payload}</template>
  <template id="kod-map-meta">${meta}</template>
</div>`;
}
