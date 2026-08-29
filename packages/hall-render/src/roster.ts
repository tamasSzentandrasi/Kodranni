import type { CharacterRecord } from '@kodranni/store';
import { esc, escAttr } from './escape.js';
import {
  avatarUrl,
  collectFactions,
  monogram,
  resolveFactionHue,
  rosterCaption,
  type HallView,
} from './format.js';

const PAGE = 8;

export function rosterInner(view: HallView, opts?: { page?: number; selected?: string }): string {
  const selected = opts?.selected ?? '';
  const factions = collectFactions(view.community.factions, view.community.outsiders ?? []);
  type Row = {
    key: string;
    name: string;
    href?: string;
    kind: 'main' | 'npc' | 'outsider';
    line: string;
    placeholder: boolean;
    status?: string;
    dying?: boolean;
    avatar?: string | null;
    factionHue?: number;
  };
  const outsiderByName = new Map(
    (view.community.outsiders ?? []).map((o) => [o.name.toLowerCase(), o] as const),
  );
  const sheetRows: Row[] = view.characters.map((ch) => {
    const cap = rosterCaption(ch);
    const npc = ch.kind === 'npc' || ch.kind === 'notable';
    const porch = outsiderByName.get(ch.name.toLowerCase());
    const kind: Row['kind'] = !npc ? 'main' : porch ? 'outsider' : 'npc';
    return {
      key: ch.slug,
      name: ch.name,
      href: `/characters/${ch.slug}/`,
      kind,
      line: porch ? (porch.faction ? `Outsider · ${porch.faction}` : 'Outsider') : cap.line,
      placeholder: cap.placeholder,
      status: ch.status === 'pending_review' ? 'pending review' : ch.status,
      dying: ch.dying,
      avatar: avatarUrl(ch.slug, ch.avatar),
      factionHue: porch?.faction ? resolveFactionHue(porch.faction, factions) : undefined,
    };
  });
  const sheetNames = new Set(view.characters.map((ch) => ch.name.toLowerCase()));
  const outsiderRows: Row[] = (view.community.outsiders ?? [])
    .filter((o) => !sheetNames.has(o.name.toLowerCase()))
    .map((o) => ({
      key: `out-${o.name}`,
      name: o.name,
      href: o.characterSlug ? `/characters/${o.characterSlug}/` : undefined,
      kind: 'outsider' as const,
      line: o.faction ? `Outsider · ${o.faction}` : 'Outsider',
      placeholder: false,
      factionHue: o.faction ? resolveFactionHue(o.faction, factions) : undefined,
    }));
  const roster = [...sheetRows, ...outsiderRows].sort((a, b) => {
    const rank = { main: 0, npc: 1, outsider: 2 };
    if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
    return a.name.localeCompare(b.name);
  });
  if (roster.length === 0) return `<p class="empty">No names on the roster yet.</p>`;
  const pages = Math.max(1, Math.ceil(roster.length / PAGE));
  let page = opts?.page ?? 1;
  if (selected) {
    const idx = roster.findIndex((r) => r.key === selected);
    if (idx >= 0) page = Math.floor(idx / PAGE) + 1;
  }
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (page > pages) page = pages;
  const slice = roster.slice((page - 1) * PAGE, page * PAGE);
  const rows = slice
    .map((row) => {
      const cls = [
        'char-row',
        row.kind === 'main' && 'char-row--main',
        row.kind === 'outsider' && 'char-row--outsider',
      ]
        .filter(Boolean)
        .join(' ');
      const av = row.avatar
        ? `<img class="avatar" src="${escAttr(row.avatar)}" alt="" width="40" height="40" loading="lazy"/>`
        : `<span class="avatar avatar--mono" aria-hidden="true">${esc(monogram(row.name))}</span>`;
      const status = row.status
        ? `<span class="char-card__status${row.dying ? ' char-card__status--dying' : ''}" data-status="${escAttr(row.status)}">${esc(row.status)}${row.dying ? ' · dying' : ''}</span>`
        : '';
      const inner = `${av}<span class="char-row__body"><span class="char-row__name">${esc(row.name)}</span><span class="char-row__meta${row.placeholder ? ' char-row__meta--placeholder' : ''}">${esc(row.line)}</span></span>${status}`;
      const style = row.factionHue != null ? ` style="--faction-h: ${row.factionHue}"` : '';
      const selectedAttr = ` data-selected="${selected === row.key ? 'true' : 'false'}"`;
      if (row.href) {
        return `<li><a class="${cls}" href="${escAttr(row.href)}"${selectedAttr}${style}>${inner}</a></li>`;
      }
      return `<li><div class="${cls}"${selectedAttr}${style}>${inner}</div></li>`;
    })
    .join('');
  const pager =
    pages > 1
      ? `<nav class="char-pager" aria-label="Roster pages">${Array.from({ length: pages }, (_, i) => i + 1)
          .map((n) => {
            const href = n === 1 ? '/characters/' : `/characters/?p=${n}`;
            const cur = n === page ? ' aria-current="page"' : '';
            return `<a href="${href}"${cur}>${n}</a>`;
          })
          .join('')}</nav>`
      : '';
  return `<ul class="char-list">${rows}</ul>${pager}`;
}

export function findCharacter(view: HallView, slug: string): CharacterRecord | undefined {
  return view.characters.find((c) => c.slug === slug);
}
