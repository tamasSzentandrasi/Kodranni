import { communityInner } from './hall.js';
import { hallViewFromSnapshot, parseSnapshot } from './format.js';
import { layoutDocument } from './layout.js';
import { findCharacter, rosterInner } from './roster.js';
import { sheetEchoesInner, sheetInner, sheetInventoryInner } from './sheet.js';

export type ArchiveRoute =
  | { kind: 'community' }
  | { kind: 'roster'; page?: number; selected?: string }
  | { kind: 'sheet'; slug: string; tab: 'core' | 'echoes' | 'inventory' }
  | { kind: 'notfound' };

export function archiveRoute(pathname: string, search: URLSearchParams): ArchiveRoute {
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (p === '' || p === '/' || p === '/community') return { kind: 'community' };
  if (p === '/characters') {
    const page = Number(search.get('p') || '1');
    return { kind: 'roster', page, selected: search.get('sel') ?? undefined };
  }
  const sheet = /^\/characters\/([^/]+)(?:\/(echoes|inventory|burden|draft))?$/.exec(p);
  if (sheet) {
    const tab =
      sheet[2] === 'echoes' ? 'echoes' : sheet[2] === 'inventory' ? 'inventory' : 'core';
    return { kind: 'sheet', slug: decodeURIComponent(sheet[1]!), tab };
  }
  return { kind: 'notfound' };
}

export function renderArchivePage(
  snapshotJson: string,
  pathname: string,
  search: URLSearchParams,
): { status: number; html: string } | null {
  const snap = parseSnapshot(snapshotJson);
  if (!snap) return null;
  const view = hallViewFromSnapshot(snap);
  const route = archiveRoute(pathname, search);
  const name = snap.community.name;
  const generatedAt = snap.generatedAt;
  if (route.kind === 'community') {
    return {
      status: 200,
      html: layoutDocument({
        title: 'Community',
        communityName: name,
        generatedAt,
        primary: 'community',
        sourceLabel: 'archive',
        body: communityInner(view),
      }),
    };
  }
  if (route.kind === 'roster') {
    return {
      status: 200,
      html: layoutDocument({
        title: 'Characters',
        communityName: name,
        generatedAt,
        primary: 'characters',
        sourceLabel: 'archive',
        body: rosterInner(view, { page: route.page, selected: route.selected }),
      }),
    };
  }
  if (route.kind === 'sheet') {
    const ch = findCharacter(view, route.slug);
    if (!ch) return { status: 404, html: 'Character not found' };
    const body =
      route.tab === 'echoes'
        ? sheetEchoesInner(ch)
        : route.tab === 'inventory'
          ? sheetInventoryInner(ch)
          : sheetInner(ch, name);
    return {
      status: 200,
      html: layoutDocument({
        title: ch.name,
        communityName: name,
        generatedAt,
        primary: 'characters',
        sourceLabel: 'archive',
        body,
      }),
    };
  }
  return { status: 404, html: '' };
}
