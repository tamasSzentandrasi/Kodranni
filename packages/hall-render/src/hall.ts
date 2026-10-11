import type { CharacterRecord, HierarchyPlacement, Label, OutsiderRecord } from '@kodranni/store/types';
import {
  TAG_GROUP_ID,
  labelsByIds,
  migrateCommunityLabels,
  personLabelIds,
} from '@kodranni/store/labels';
import { esc, escAttr } from './escape.js';
import {
  FORTUNE_LABELS,
  FORTUNE_ORDER,
  TIERS,
  axisKey,
  inspectId,
  type HallView,
} from './format.js';
import { infoBtn, sectionHead } from './layout.js';
import { mapFolioLink } from './map.js';

function hallShell(
  c: HallView['community'],
  live: boolean,
  extraClass: string,
): { open: string; close: string } {
  const source = live ? 'live' : 'snapshot';
  const founded = live && c.fortunesFoundedAt ? c.fortunesFoundedAt : '';
  return {
    open: `<div class="hall ${extraClass}" data-slug="${escAttr(c.slug)}" data-source="${escAttr(source)}" data-founded="${escAttr(founded)}">`,
    close: `</div>`,
  };
}

/** Fortunes and Foundation Myths — campaign Overview tab. */
export function overviewInner(
  view: HallView,
  opts?: { live?: boolean; canEdit?: boolean; desk?: boolean },
): string {
  const live = opts?.live === true;
  const desk = opts?.desk === true;
  const c = migrateCommunityLabels(view.community);
  const shell = hallShell(c, live, 'hall--overview');
  const found =
    desk && !c.fortunesFoundedAt
      ? `<p class="desk-found"><button type="button" class="kod-btn" data-desk-found>Found the weather</button></p>`
      : '';
  return `${shell.open}
  ${fortunePlates(c, desk)}
  ${found}
  ${desk ? mythDesk(c.myths ?? []) : myths(c.myths ?? [])}
${shell.close}
<script src="/hall-client.js"></script>`;
}

/** Hierarchy diagram with Find, Factions, and Tags drawers. */
export function hierarchyInner(
  view: HallView,
  opts?: { live?: boolean; canEdit?: boolean; desk?: boolean },
): string {
  const live = opts?.live === true;
  const desk = opts?.desk === true;
  const canEdit = live && opts?.canEdit === true && !desk;
  const c = migrateCommunityLabels(view.community);
  const tips = whoWeSeeMap(view.characters, c.placements ?? [], c.outsiders ?? []);
  const pcSlugs = new Set(
    view.characters.filter((ch) => (ch.kind ?? 'pc') !== 'npc' && ch.kind !== 'notable').map((ch) => ch.slug),
  );
  const bySlug = new Map(view.characters.map((ch) => [ch.slug, ch] as const));
  const roster = inspectPeople({ ...view, community: c });
  const people = JSON.stringify(roster);
  const labelCatalog = JSON.stringify({
    groups: c.labelGroups ?? [],
    labels: c.labels ?? [],
  });
  const shell = hallShell(c, live, 'hall--hierarchy');
  return `${slideRails(c, { desk, people: roster })}
${shell.open}
  <section class="hall__htitle">
    <div class="hall-catchword" data-catchword data-empty="true">
      <p class="hall-catchword__line">
        <span class="end-mark end-mark--left" aria-hidden="true"></span>
        <span class="hall-catchword__text" data-catchword-text></span>
        <span class="end-mark end-mark--right" aria-hidden="true"></span>
      </p>
      <button type="button" class="hall-catchword__clear" data-catchword-clear>Clear</button>
    </div>
  </section>
  <div class="hall__hier">
    ${hierarchy(c, tips, pcSlugs, canEdit, bySlug, desk, view.characters)}
    ${mapFolioLink()}
  </div>
${shell.close}
<div id="kod-hall-people" hidden>${esc(people)}</div>
<div id="kod-hall-labels" hidden>${esc(labelCatalog)}</div>
<script src="/hall-client.js"></script>`;
}

export function communityInner(
  view: HallView,
  opts?: { live?: boolean; canEdit?: boolean },
): string {
  return overviewInner(view, opts);
}

function whoWeSeeMap(
  characters: CharacterRecord[],
  placements: HierarchyPlacement[],
  outsiders: OutsiderRecord[],
): Map<string, string> {
  const m = new Map<string, string>();
  for (const ch of characters) {
    if (ch.whoWeSee) {
      m.set(ch.slug, ch.whoWeSee);
      m.set(ch.name.toLowerCase(), ch.whoWeSee);
    }
  }
  for (const p of placements) {
    if (p.note) {
      if (p.characterSlug) m.set(p.characterSlug, p.note);
      m.set(p.name.toLowerCase(), p.note);
    }
  }
  for (const o of outsiders) {
    if (o.note) m.set(o.name.toLowerCase(), o.note);
  }
  return m;
}

function labelsForPerson(
  c: HallView['community'],
  bySlug: Map<string, CharacterRecord>,
  name: string,
  slug?: string,
): Label[] {
  const ch = slug ? bySlug.get(slug) : undefined;
  const outsider = (c.outsiders ?? []).find((o) => o.name.toLowerCase() === name.toLowerCase());
  const placement = (c.placements ?? []).find(
    (p) => !p.characterSlug && p.name.toLowerCase() === name.toLowerCase(),
  );
  return labelsByIds(c, personLabelIds({ character: ch, outsider, placement }));
}

function slideTab(id: string, word: string): string {
  return `<button type="button" class="kod-slide__tab" data-slide-toggle="${escAttr(id)}" aria-controls="kod-slide-${escAttr(id)}" aria-expanded="false" aria-label="${escAttr(word)}">
    <span class="kod-slide__skin" aria-hidden="true">
      <span class="kod-slide__cap kod-slide__cap--top"></span>
      <span class="kod-slide__mid"></span>
      <span class="kod-slide__cap kod-slide__cap--bot"></span>
      <span class="kod-slide__chev"></span>
    </span>
    <span class="kod-slide__word">${esc(word)}</span>
  </button>`;
}

function slideRails(
  c: HallView['community'],
  opts?: {
    tags?: boolean;
    family?: boolean;
    desk?: boolean;
    people?: { name: string; labelIds: string[] }[];
  },
): string {
  const desk = opts?.desk === true;
  const people = opts?.people ?? [];
  const tags = opts?.tags === false ? '' : slideShell('tags', 'Tags', tagsPanel(c, desk, people));
  const find = opts?.family ? findPanel(c, true) : findPanel(c);
  return `<div class="kod-rail kod-rail--left">
  ${slideShell('factions', 'Factions', factionsPanel(c, desk, people))}
  ${tags}
</div>
<div class="kod-rail kod-rail--right">
  ${slideShell('find', 'Find', find)}
</div>`;
}

export function mapChrome(c: HallView['community']): string {
  const comm = migrateCommunityLabels(c);
  return `<div class="hall hall--map" data-slug="${escAttr(comm.slug)}" data-source="live" hidden></div>${slideRails(comm, { tags: false, family: true })}`;
}

function slideShell(id: string, word: string, inner: string): string {
  return `<div class="kod-slide" data-slide="${escAttr(id)}" data-open="false">
  ${slideTab(id, word)}
  <div class="kod-slide__panel kod-plate" id="kod-slide-${escAttr(id)}"><span class="kod-slide__rail kod-slide__rail--top" aria-hidden="true"></span><span class="kod-slide__rail kod-slide__rail--bot" aria-hidden="true"></span>${inner}</div>
</div>`;
}

function factionNameplate(l: Label): string {
  const tone = toneParts(l, { h: 30, s: 55, l: 48 });
  const stain = tone.on ? ` data-stain style="--stain: hsl(${tone.h} ${tone.s}% ${tone.l}%)"` : '';
  return `<button type="button" class="member member--drawer" data-faction-id="${escAttr(l.id)}" data-group="${escAttr(l.groupId)}" aria-pressed="false"${stain}><span class="member__stain" aria-hidden="true"></span><span class="member__glow" aria-hidden="true"></span><span class="member__name">${esc(l.name)}</span></button>`;
}

function whoLine(people: { name: string; labelIds: string[] }[], labelId: string): string {
  const names = people.filter((p) => p.labelIds.includes(labelId)).map((p) => p.name);
  return `<p class="desk-label__who">${esc(names.length ? names.join(', ') : '—')}</p>`;
}

function allegiancePicker(
  c: HallView['community'],
  forFind = false,
  desk = false,
  people: { name: string; labelIds: string[] }[] = [],
): string {
  const groups = (c.labelGroups ?? []).filter((g) => {
    if (g.kind !== 'faction') return false;
    if (desk && !forFind) return true;
    return (c.labels ?? []).some((l) => l.groupId === g.id);
  });
  const cats = groups
    .map((g) => {
      const labs = (c.labels ?? []).filter((l) => l.groupId === g.id);
      const plates = labs
        .map((l) => (desk && !forFind ? deskLabelRow(l, people) : factionNameplate(l)))
        .join('');
      const inscribe =
        desk && !forFind
          ? `<input class="desk-write" data-desk-label-new data-group="${escAttr(g.id)}" placeholder="Inscribe a faction" aria-label="Inscribe a faction">`
          : '';
      const catName =
        desk && !forFind
          ? `<div class="allegiance__cat-bar"><div class="kod-btn kod-btn--folio allegiance__cat-head"><input class="desk-write kod-btn__title" data-desk-group-name data-group="${escAttr(g.id)}" value="${escAttr(g.name)}" aria-label="Category name"></div><button type="button" class="desk-mark" data-desk-group-delete data-group="${escAttr(g.id)}" aria-label="Remove ${escAttr(g.name)}" data-tip="Remove"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.4"/></svg></button></div>`
          : `<button type="button" class="kod-btn kod-btn--folio allegiance__pick" data-view-group="${escAttr(g.id)}" aria-pressed="false">
          <span class="kod-btn__title">${esc(g.name)}</span>
        </button>`;
      const deskCat = desk && !forFind;
      return `<div class="allegiance__cat" data-faction-cat="${escAttr(g.id)}"${deskCat ? ' data-open="false"' : ''}>
        ${catName}
        <div class="allegiance__list" data-faction-list ${deskCat ? 'inert' : 'hidden'}>${plates}${inscribe}</div>
      </div>`;
    })
    .join('');
  const extra = forFind
    ? ' data-find-tree'
    : ` data-hall-legend data-view-stave${desk ? ' data-desk-editor' : ''}`;
  const fresh =
    desk && !forFind
      ? `<input class="desk-write" data-desk-group-new placeholder="New category" aria-label="New category">`
      : '';
  return `<div class="allegiance"${extra}>${cats}${fresh}</div>`;
}

function deskLabelRow(l: Label, people: { name: string; labelIds: string[] }[]): string {
  const tone = toneParts(l, { h: 30, s: 55, l: 48 });
  const color = l.hue != null ? hslHex(tone.h, tone.s, tone.l) : '#8c7355';
  const icon = l.icon
    ? `<img src="/api/fortune-icon?file=${escAttr(l.icon)}" alt="">`
    : '';
  const picked = `hsl(${tone.h} ${tone.s}% ${tone.l}%)`;
  const stain = tone.on ? ` data-stain style="--stain:${picked}"` : '';
  const rowStain = tone.on ? ` style="--stain:${picked}"` : '';
  return `<div class="desk-label" data-desk-label-row data-label-id="${escAttr(l.id)}" data-group="${escAttr(l.groupId)}" aria-pressed="false"${rowStain}>
    <div class="desk-label__line">
      <input type="color" class="desk-dye" data-desk-label-color data-label-id="${escAttr(l.id)}" value="${color}" aria-label="Colour of ${escAttr(l.name)}">
      <div class="member member--drawer desk-label__plate"${stain}>
        <span class="member__stain" aria-hidden="true"></span>
        <span class="member__glow" aria-hidden="true"></span>
        <label class="desk-label__seal">${icon}<input type="file" data-desk-label-icon data-label-id="${escAttr(l.id)}" accept="image/jpeg,image/png,image/webp" hidden aria-label="Icon for ${escAttr(l.name)}"></label>
        <input class="desk-write member__name" data-desk-label-name data-label-id="${escAttr(l.id)}" value="${escAttr(l.name)}" aria-label="Name">
      </div>
      <button type="button" class="desk-mark" data-desk-label-delete data-label-id="${escAttr(l.id)}" aria-label="Remove ${escAttr(l.name)}" data-tip="Remove"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.4"/></svg></button>
    </div>
    ${whoLine(people, l.id)}
  </div>`;
}

function clampPct(n: number | undefined, fallback: number): number {
  if (n == null || !Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function hslHex(hue: number, sat: number, light: number): string {
  const h = ((hue % 360) + 360) % 360;
  const s = clampPct(sat, 0) / 100;
  const l = clampPct(light, 0) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.min(1, Math.max(0, color)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function inkFor(light: number): string {
  return light > 58 ? '#14110e' : '#f4efe6';
}

function toneParts(
  raw: { hue?: number; sat?: number; light?: number } | null | undefined,
  fallback: { h: number; s: number; l: number },
): { h: number; s: number; l: number; on: boolean } {
  if (raw?.hue == null || !Number.isFinite(Number(raw.hue))) {
    return { h: fallback.h, s: fallback.s, l: fallback.l, on: false };
  }
  const full = raw.sat != null && raw.light != null;
  return {
    h: Math.round(Number(raw.hue)),
    s: full ? clampPct(raw.sat, fallback.s) : fallback.s,
    l: full ? clampPct(raw.light, fallback.l) : fallback.l,
    on: true,
  };
}

function fortuneToneAttr(raw: { hue?: number; sat?: number; light?: number } | undefined): string {
  const tone = toneParts(raw, { h: 30, s: 42, l: 34 });
  if (!tone.on) return '';
  const picked = `hsl(${tone.h} ${tone.s}% ${tone.l}%)`;
  return ` data-hue="${tone.h}" style="--fortune-h:${tone.h};--fortune-s:${tone.s}%;--fortune-l:${tone.l}%;--kod-pillar:${picked};--on-ink:${inkFor(tone.l)}"`;
}

function axisToneAttr(raw: { hue?: number; sat?: number; light?: number } | undefined): string {
  const tone = toneParts(raw, { h: 30, s: 42, l: 34 });
  if (!tone.on) return '';
  const picked = `hsl(${tone.h} ${tone.s}% ${tone.l}%)`;
  return ` data-hue="${tone.h}" style="--axis-h:${tone.h};--axis-s:${tone.s}%;--axis-l:${tone.l}%;--picked:${picked};--on-ink:${inkFor(tone.l)}"`;
}

function findPanel(c: HallView['community'], family = false): string {
  const fam = family
    ? `<button type="button" class="kod-cmap__family" data-cmap-family disabled>Family</button>`
    : '';
  return `<div class="hall-search" data-hall-search>
  <label class="hall-search__label" for="kod-hall-q">Name</label>
  <input id="kod-hall-q" class="hall-search__q" type="search" name="hall-q" autocomplete="off" placeholder="Name…" data-hall-q/>
  ${fam}
  <p class="hall-search__kicker">Filter by Allegiance</p>
  ${allegiancePicker(c, true)}
</div>`;
}

function factionsPanel(
  c: HallView['community'],
  desk = false,
  people: { name: string; labelIds: string[] }[] = [],
): string {
  return allegiancePicker(c, false, desk, people);
}

function tagsPanel(
  c: HallView['community'],
  desk = false,
  people: { name: string; labelIds: string[] }[] = [],
): string {
  const tags = (c.labels ?? []).filter((l) => l.groupId === TAG_GROUP_ID);
  const rows = tags
    .map((t) =>
      desk
        ? deskLabelRow(t, people)
        : `<button type="button" class="kod-btn tag-row" data-tag-id="${escAttr(t.id)}" aria-pressed="false"><span>${esc(t.name)}</span></button>`,
    )
    .join('');
  const inscribe = desk
    ? `<input class="desk-write" data-desk-label-new data-group="${escAttr(TAG_GROUP_ID)}" placeholder="Inscribe a tag" aria-label="Inscribe a tag">`
    : '';
  if (!tags.length && !desk) return `<p class="empty">No tags yet.</p>`;
  return `<div class="tag-list" data-tag-list data-group="${escAttr(TAG_GROUP_ID)}">${rows}${inscribe}</div>`;
}

function fortuneTitle(k: string): string {
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function fortunePlates(c: HallView['community'], desk = false): string {
  const fortunes = c.fortunes ?? {};
  const look = c.fortuneLook ?? {};
  const plates = FORTUNE_ORDER.map((k) => {
    const v = Math.min(3, Math.max(0, fortunes[k] ?? 0));
    const label = FORTUNE_LABELS[v] ?? '';
    const title = fortuneTitle(k);
    const icon = look[k]?.icon;
    const stain = fortuneToneAttr(look[k]);
    const iconClass = icon ? ' kod-fortune__icon--custom' : '';
    const iconInner = icon
      ? `<img src="/api/fortune-icon?file=${escAttr(icon)}" alt="">`
      : '';
    const reset =
      desk && icon
        ? `<button type="button" class="desk-reset" data-desk-icon-reset data-kind="fortune" data-key="${escAttr(k)}" aria-label="Reset icon">Reset</button>`
        : '';
    if (!desk) {
      return `<div class="kod-fortune kod-fortune--${escAttr(k)}" data-fortune="${escAttr(k)}" data-level="${v}" role="listitem" aria-label="${escAttr(title)}, ${escAttr(label)}"${stain}>
      <span class="kod-fortune__icon${iconClass}" aria-hidden="true">${iconInner}</span>
      <span class="kod-fortune__name">${esc(title)}</span>
      <span class="kod-fortune__tree" aria-hidden="true"></span>
      <span class="kod-fortune__states"><span class="kod-fortune__state">${esc(label)}</span></span>
    </div>`;
    }
    const swatch = toneParts(look[k], { h: 30, s: 42, l: 34 });
    const states = [0, 1, 2, 3]
      .map(
        (level) =>
          `<button type="button" data-desk-state="${level}" aria-pressed="${level === v ? 'true' : 'false'}">${esc(FORTUNE_LABELS[level] ?? '')}</button>`,
      )
      .join('');
    return `<div class="kod-fortune kod-fortune--${escAttr(k)}" data-fortune="${escAttr(k)}" data-desk-fortune="${escAttr(k)}" data-level="${v}" role="listitem" aria-label="${escAttr(title)}"${stain}>
      <label class="kod-fortune__icon${iconClass}">${iconInner}<input type="file" data-desk-fortune-icon accept="image/jpeg,image/png,image/webp" hidden aria-label="Icon for ${escAttr(title)}"></label>
      ${reset}
      <span class="kod-fortune__name">${esc(title)}</span>
      <span class="kod-fortune__tree" aria-hidden="true"></span>
      <input type="color" class="desk-dye" data-desk-fortune-color value="${hslHex(swatch.h, swatch.s, swatch.l)}" aria-label="Colour of ${escAttr(title)}">
      <div class="kod-fortune__states desk-states" role="radiogroup" aria-label="${escAttr(title)} state">${states}</div>
    </div>`;
  }).join('');
  return `<section class="hall__sky" aria-labelledby="f-h">
    ${sectionHead('f-h', 'Fortunes', 'Community-wide pressure — not a second character sheet. Weather, not a ledger.', 'About Fortunes')}
    <div class="kod-fortune-row" role="list">${plates}</div>
  </section>`;
}

function memberName(opts: {
  name: string;
  slug?: string;
  pc?: boolean;
  pending?: boolean;
  tip?: string;
  kind?: string;
  personId: string;
  roving?: boolean;
  labels?: Label[];
  deskFrom?: string;
}): string {
  const labels = opts.labels ?? [];
  const ids = labels.map((l) => l.id).join(' ');
  const cls = [
    'member',
    opts.pc && 'member--pc',
    opts.pending && 'member--pending',
    opts.kind === 'outsider' && 'member--outsider',
  ]
    .filter(Boolean)
    .join(' ');
  const pending = opts.pending
    ? `<span class="member__knot" aria-hidden="true">◆</span><span class="member__name">${esc(opts.name)}</span><span class="member__pending">pending</span>`
    : `<span class="member__name">${esc(opts.name)}</span>`;
  const inner = `<span class="member__stain" aria-hidden="true"></span><span class="member__glow" aria-hidden="true"></span>${pending}`;
  const drag = opts.deskFrom
    ? ` draggable="false" data-desk-person data-desk-from="${escAttr(opts.deskFrom)}"`
    : '';
  const data = `class="${cls}" data-inspect-id="${escAttr(opts.personId)}" data-name="${escAttr(opts.name)}" data-kind="${escAttr(opts.kind ?? 'npc')}"${opts.slug ? ` data-slug="${escAttr(opts.slug)}"` : ''}${opts.tip ? ` data-tip="${escAttr(opts.tip)}"` : ''}${opts.roving ? ' tabindex="-1"' : ''}${ids ? ` data-label-ids="${escAttr(ids)}"` : ''}${drag}`;
  if (opts.slug) return `<a ${data} href="/characters/${escAttr(opts.slug)}/">${inner}</a>`;
  return `<span ${data}>${inner}</span>`;
}

function hierarchy(
  c: HallView['community'],
  tips: Map<string, string>,
  pcSlugs: Set<string>,
  live: boolean,
  bySlug: Map<string, CharacterRecord>,
  desk = false,
  characters: CharacterRecord[] = [],
): string {
  const isPc = (slug?: string) => Boolean(slug && pcSlugs.has(slug));
  const tipFor = (name: string, slug?: string, note?: string) => {
    if (note) return note;
    if (slug && tips.has(slug)) return tips.get(slug)!;
    return tips.get(name.toLowerCase()) ?? '';
  };
  const rulerLook = c.rulerLook ?? {};
  const rulerTitle = rulerLook.title?.trim() || 'Ruler';
  const rulerSwatch = toneParts(rulerLook, { h: 280, s: 42, l: 34 });
  const rulerStain = axisToneAttr(rulerLook);
  const rulerFile = rulerLook.icon ? ' kod-hier-ruler--file' : '';
  const rulerImg = rulerLook.icon
    ? `<img class="kod-hier-seal__img" src="/api/fortune-icon?file=${escAttr(rulerLook.icon)}" alt="">`
    : '';
  const rulerId = c.ruler ? inspectId(c.ruler, c.rulerCharacterSlug) : '';
  const rulerBlock = c.ruler
    ? memberName({
        name: c.ruler,
        slug: c.rulerCharacterSlug,
        pc: isPc(c.rulerCharacterSlug),
        tip: tipFor(c.ruler, c.rulerCharacterSlug),
        kind: isPc(c.rulerCharacterSlug) ? 'pc' : 'npc',
        personId: rulerId,
        labels: labelsForPerson(c, bySlug, c.ruler, c.rulerCharacterSlug),
        deskFrom: desk ? 'ruler' : undefined,
      })
    : `<p class="hier-ruler__note">One seat for the whole community — none claimed.</p>`;
  const add = live
    ? `<div class="hier-add"><button type="button" class="kod-plus" data-rite-open="figure" aria-label="Add a character"></button></div>`
    : '';
  const rulerDrop = desk ? ' data-desk-drop="ruler"' : '';
  const axisCount = (c.hierarchyAxes ?? []).length;
  const axes = (c.hierarchyAxes ?? [])
    .map((axis, ai) => {
      const onAxis = (c.placements ?? []).filter((p) => p.axis === axis);
      const key = axisKey(axis, ai);
      const rungs = TIERS.map((tier) => {
        const members = onAxis.filter((p) => p.tier === tier);
        const people = members
          .map((m) => {
            const tip = tipFor(m.name, m.characterSlug, m.note);
            return memberName({
              name: m.name,
              slug: m.characterSlug,
              pc: isPc(m.characterSlug),
              tip,
              kind: isPc(m.characterSlug) ? 'pc' : 'npc',
              personId: inspectId(m.name, m.characterSlug),
              roving: true,
              labels: labelsForPerson(c, bySlug, m.name, m.characterSlug),
              deskFrom: desk ? `rung:${axis}:${tier}` : undefined,
            });
          })
          .join('');
        const drop = desk
          ? ` data-desk-drop="rung" data-axis="${escAttr(axis)}" data-tier="${escAttr(tier)}"`
          : '';
        return `<li data-tier="${escAttr(tier)}"${drop}><strong class="kod-hier-rung-label">${esc(tier)}</strong><div class="kod-hier-rung__people">${people}</div></li>`;
      }).join('');
      const look = c.axisLook?.[axis] ?? {};
      const axisSwatch = toneParts(look, { h: 30, s: 42, l: 34 });
      const axisStain = axisToneAttr(look);
      const seal = look.icon
        ? `<img class="kod-hier-seal__img" src="/api/fortune-icon?file=${escAttr(look.icon)}" alt="">`
        : '';
      const head = desk
        ? `<label class="kod-hier-seal"${look.icon ? ' data-seal="file"' : ''}>${seal}<input type="file" data-desk-seal="axis" data-key="${escAttr(axis)}" accept="image/jpeg,image/png,image/webp" hidden aria-label="Icon for ${escAttr(axis)}"></label>${
            look.icon
              ? `<button type="button" class="desk-reset" data-desk-icon-reset data-kind="axis" data-key="${escAttr(axis)}" aria-label="Reset icon">Reset</button>`
              : ''
          }<input class="desk-write kod-hier-axis__name" data-desk-axis-name data-axis="${escAttr(axis)}" value="${escAttr(axis)}" aria-label="Ladder name"><input type="color" class="desk-dye" data-desk-axis-color data-axis="${escAttr(axis)}" value="${hslHex(axisSwatch.h, axisSwatch.s, axisSwatch.l)}" aria-label="Colour of ${escAttr(axis)}">${
            axisCount > 3
              ? `<button type="button" class="desk-mark" data-desk-axis-delete data-axis="${escAttr(axis)}" aria-label="Remove ${escAttr(axis)}" data-tip="Remove ${escAttr(axis)}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.4"/></svg></button>`
              : ''
          }`
        : `${seal}<p class="kod-hier-axis__name">${esc(axis)}</p>`;
      return `<div class="kod-hier-axis" data-axis="${escAttr(key)}" data-axis-name="${escAttr(axis)}"${axisStain}${look.icon ? ' data-seal="file"' : ''}>
        <div class="kod-hier-axis__plate">
          <div class="kod-hier-axis__head" data-axis-focus="${escAttr(key)}" tabindex="${ai === 0 ? 0 : -1}">
            ${head}
          </div>
          <ol class="kod-hier-rungs">${rungs}</ol>
        </div>
      </div>`;
    })
    .join('');
  const showBlank = desk && axisCount < 5;
  const blankAxis = showBlank
    ? `<div class="kod-hier-axis kod-hier-axis--blank"><div class="kod-hier-axis__plate"><div class="kod-hier-axis__head"><input class="desk-write kod-hier-axis__name" data-desk-axis-new placeholder="Name an axis" aria-label="Name an axis"></div></div></div>`
    : '';
  const ladderCols = Math.max(1, axisCount + (showBlank ? 1 : 0));
  const rulerHead = desk
    ? `<label class="kod-hier-seal">${rulerImg}<input type="file" data-desk-seal="ruler" data-key="ruler" accept="image/jpeg,image/png,image/webp" hidden aria-label="Icon for the ruler"></label>${
        rulerLook.icon
          ? `<button type="button" class="desk-reset" data-desk-icon-reset data-kind="ruler" data-key="ruler" aria-label="Reset icon">Reset</button>`
          : ''
      }<input class="desk-write kod-hier-ruler__title" data-desk-ruler-name value="${escAttr(rulerTitle)}" aria-label="Ruler title"><input type="color" class="desk-dye" data-desk-ruler-color value="${hslHex(rulerSwatch.h, rulerSwatch.s, rulerSwatch.l)}" aria-label="Colour of the ruler">`
    : `<p class="kod-hier-ruler__title">${esc(rulerTitle)}</p>${rulerImg}`;
  return `<div class="kod-hier-diagram hall__diagram"${desk ? ' data-desk-diagram' : ''}>
    <div class="kod-hier-ruler${rulerFile}"${rulerStain}${rulerDrop}>${rulerHead}${rulerBlock}${add}</div>
    <div class="kod-hier-body">
    <div class="kod-hier-axes" style="--ladder-cols:${ladderCols}" role="region" aria-label="Hierarchy ladders">${axes}${blankAxis}</div>
    ${unassignedPool(c, characters, pcSlugs, tips, bySlug, desk)}
    ${outsiders(c, bySlug, desk)}
    </div>
  </div>`;
}

function unassignedPool(
  c: HallView['community'],
  characters: CharacterRecord[],
  pcSlugs: Set<string>,
  tips: Map<string, string>,
  bySlug: Map<string, CharacterRecord>,
  desk: boolean,
): string {
  const filed = new Set<string>();
  for (const p of c.placements ?? []) {
    if (p.characterSlug) filed.add(p.characterSlug);
    filed.add(p.name.toLowerCase());
  }
  for (const o of c.outsiders ?? []) {
    if (o.characterSlug) filed.add(o.characterSlug);
    filed.add(o.name.toLowerCase());
  }
  if (c.rulerCharacterSlug) filed.add(c.rulerCharacterSlug);
  if (c.ruler) filed.add(c.ruler.toLowerCase());
  const waiting = characters.filter(
    (ch) =>
      ch.status !== 'draft' &&
      ch.status !== 'dead' &&
      !filed.has(ch.slug) &&
      !filed.has(ch.name.toLowerCase()),
  );
  const people = waiting
    .map((ch) =>
      memberName({
        name: ch.name,
        slug: ch.slug,
        pc: pcSlugs.has(ch.slug),
        tip: tips.get(ch.slug) ?? tips.get(ch.name.toLowerCase()) ?? '',
        kind: pcSlugs.has(ch.slug) ? 'pc' : 'npc',
        personId: inspectId(ch.name, ch.slug),
        labels: labelsForPerson(c, bySlug, ch.name, ch.slug),
        deskFrom: desk ? 'unassigned' : undefined,
      }),
    )
    .join('');
  const npc = desk
    ? `<form class="desk-npc" data-desk-npc><input class="desk-write" name="name" placeholder="New NPC" aria-label="New NPC" autocomplete="off"></form>`
    : '';
  const drop = desk ? ' data-desk-drop="unassigned"' : '';
  return `<aside class="kod-hier-porch kod-hier-unassigned" aria-label="Unassigned"${drop}>
    <div class="kod-hier-porch__head"><p class="kod-hier-porch__title">Unassigned</p></div>
    <div class="kod-hier-porch__people">${people || '<p class="empty">None waiting.</p>'}</div>
    ${npc}
  </aside>`;
}

function outsiders(c: HallView['community'], bySlug: Map<string, CharacterRecord>, desk = false): string {
  const list = c.outsiders ?? [];
  const items =
    list.length === 0
      ? `<p class="empty">None tracked.</p>`
      : list
          .map((o) =>
            memberName({
              name: o.name,
              slug: o.characterSlug,
              tip: o.note,
              kind: 'outsider',
              personId: inspectId(o.name, o.characterSlug),
              labels: labelsForPerson(c, bySlug, o.name, o.characterSlug),
              deskFrom: desk ? 'porch' : undefined,
            }),
          )
          .join('');
  const drop = desk ? ' data-desk-drop="porch"' : '';
  return `<aside class="kod-hier-porch" aria-labelledby="o-h"${drop}>
    <div class="kod-hier-porch__head"><p class="kod-hier-porch__title" id="o-h">Outsiders</p>${infoBtn('About Outsiders', 'Never of this community. Sit apart until inducted (then Outcast on the axes that apply).')}</div>
    <div class="kod-hier-porch__people">${items}</div>
  </aside>`;
}

const EFFECT_CARDS: { kind: string; sentence: string }[] = [
  { kind: 'exertion_free', sentence: 'One Exertion, and it stays in the pool.' },
  { kind: 'exertion_forced', sentence: 'The roll demands an extra Exertion.' },
  { kind: 'advantage', sentence: 'The die is advantaged, or disadvantaged.' },
  { kind: 'omen_faces', sentence: 'The Omen shows these faces.' },
  { kind: 'practice_mod', sentence: 'Practice on a named Skill comes faster, slower, or counts as Foundation 3.' },
  { kind: 'tide_mod', sentence: 'Tide starts higher or lower, or its threshold moves.' },
  { kind: 'trait_grant', sentence: 'A Trait is offered to everyone, or taken off the table, for now or for good.' },
];

function mythSentence(kind: string): string {
  if (kind === 'disadvantage') return EFFECT_CARDS[2]!.sentence;
  if (kind === 'trait_deny') return EFFECT_CARDS[6]!.sentence;
  return EFFECT_CARDS.find((card) => card.kind === kind)?.sentence ?? kind;
}

function ask(name: string, words: string, value: string, numeric = false): string {
  const type = numeric ? 'number' : 'text';
  return `<label class="desk-myth-ask">${esc(words)} <input class="kod-ink" type="${type}" data-fx="${name}" value="${escAttr(value)}"></label>`;
}

function faceTaps(faces: number[] | undefined): string {
  const on = new Set(faces ?? []);
  const btns = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return `<button type="button" data-face="${n}" aria-pressed="${on.has(n) ? 'true' : 'false'}">${n}</button>`;
  }).join('');
  return `<div class="desk-myth-faces" aria-label="Faces the Omen shows">${btns}</div>`;
}

function mythChoices(): string {
  return EFFECT_CARDS.map(
    (card) =>
      `<button type="button" data-desk-effect-kind="${escAttr(card.kind)}">${esc(card.sentence)}</button>`,
  ).join('');
}

function effectRow(
  e: {
    kind: string;
    match?: string;
    amount?: number;
    threshold?: number;
    faces?: number[];
    skill?: string;
    mode?: string;
    traitName?: string;
    permanence?: string;
    detail?: string;
  },
  myth: number,
  row: number,
): string {
  const sentence = mythSentence(e.kind);
  let fields = '';
  if (e.kind === 'exertion_free' || e.kind === 'exertion_forced') {
    fields = ask('match', 'When the roll is about', e.match ?? '');
  } else if (e.kind === 'advantage' || e.kind === 'disadvantage') {
    const which = e.kind === 'disadvantage' ? 'disadvantage' : 'advantage';
    fields =
      `<label class="desk-myth-ask">The die <select data-fx="die-kind">
        <option value="advantage"${which === 'advantage' ? ' selected' : ''}>is advantaged</option>
        <option value="disadvantage"${which === 'disadvantage' ? ' selected' : ''}>is disadvantaged</option>
      </select></label>` + ask('match', 'When the roll is about', e.match ?? '');
  } else if (e.kind === 'omen_faces') {
    fields = ask('match', 'When the roll is about', e.match ?? '') + faceTaps(e.faces);
  } else if (e.kind === 'practice_mod') {
    const mode = e.mode ?? 'extra';
    fields =
      ask('match', 'When the roll is about', e.match ?? '') +
      ask('skill', 'The Skill', e.skill ?? '') +
      `<label class="desk-myth-ask">Practice <select data-fx="mode">
        <option value="extra"${mode === 'extra' ? ' selected' : ''}>comes faster</option>
        <option value="reduced"${mode === 'reduced' ? ' selected' : ''}>comes slower</option>
        <option value="foundation"${mode === 'foundation' ? ' selected' : ''}>counts as Foundation 3</option>
      </select></label>` +
      (mode === 'foundation' ? '' : ask('amount', 'By how much', String(e.amount ?? 1), true));
  } else if (e.kind === 'tide_mod') {
    fields =
      ask('amount', 'Tide starts higher or lower by', String(e.amount ?? 0), true) +
      ask('threshold', 'Its threshold moves by', String(e.threshold ?? 0), true);
  } else if (e.kind === 'trait_grant' || e.kind === 'trait_deny') {
    const which = e.kind === 'trait_deny' ? 'trait_deny' : 'trait_grant';
    const stay = e.permanence === 'permanent' ? 'permanent' : 'temporary';
    fields =
      `<label class="desk-myth-ask">The Trait <select data-fx="trait-kind">
        <option value="trait_grant"${which === 'trait_grant' ? ' selected' : ''}>is offered to everyone</option>
        <option value="trait_deny"${which === 'trait_deny' ? ' selected' : ''}>is taken off the table</option>
      </select></label>` +
      ask('traitName', 'Named', e.traitName ?? '') +
      `<label class="desk-myth-ask">It lasts <select data-fx="permanence">
        <option value="temporary"${stay === 'temporary' ? ' selected' : ''}>for now</option>
        <option value="permanent"${stay === 'permanent' ? ' selected' : ''}>for good</option>
      </select></label>`;
  }
  return `<div class="desk-myth-row" data-desk-myth-row data-kind="${escAttr(e.kind)}" data-label="${escAttr(sentence)}" data-myth="${myth}" data-row="${row}">
    <span class="desk-myth-row__kind">${esc(sentence)}</span>
    ${fields}
    <button type="button" class="desk-mark" data-desk-row-delete aria-label="Remove modifier" data-tip="Remove"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.4"/></svg></button>
  </div>`;
}

function mythDesk(
  list: {
    title: string;
    summary?: string;
    effects?: {
      kind: string;
      match?: string;
      amount?: number;
      threshold?: number;
      faces?: number[];
      skill?: string;
      mode?: string;
      traitName?: string;
      permanence?: string;
      detail?: string;
    }[];
  }[],
): string {
  const choices = mythChoices();
  const frames = [0, 1, 2]
    .map((i) => {
      const myth = list[i];
      if (!myth) {
        return `<article class="kod-plate myth-card myth-card--blank" data-desk-myth="${i}">
          <p class="myth-card__kicker">Foundation Myth</p>
          <input class="desk-write desk-write--title" data-desk-myth-title data-myth="${i}" placeholder="Write a myth" aria-label="Myth title">
        </article>`;
      }
      const effects = myth.effects ?? [];
      const rows = effects.map((e, r) => effectRow(e, i, r)).join('');
      const seat =
        effects.length < 5
          ? `<div class="desk-myth-seat" data-desk-effect-add><button type="button" class="kod-btn" data-desk-effect-open>Add a modifier</button><div class="desk-myth-cards">${choices}</div></div>`
          : '';
      return `<article class="kod-plate myth-card" data-desk-myth="${i}">
        <p class="myth-card__kicker">Foundation Myth</p>
        <input class="desk-write desk-write--title" data-desk-myth-title data-myth="${i}" value="${escAttr(myth.title)}" aria-label="Myth title">
        <textarea class="desk-write desk-write--summary" data-desk-myth-summary data-myth="${i}" rows="2" aria-label="Myth summary">${esc(myth.summary ?? '')}</textarea>
        <div class="desk-myth-rows">${rows}</div>
        ${seat}
        <button type="button" class="kod-btn" data-desk-myth-delete data-myth="${i}">Delete</button>
      </article>`;
    })
    .join('');
  return `<section class="hall__crypt" aria-labelledby="m-h">
    ${sectionHead('m-h', 'Foundation Myths', 'Three frames. A roll must name the myth before a row fires.', 'About Foundation Myths')}
    <div class="myth-list">${frames}</div>
  </section>`;
}

function myths(
  list: { title: string; summary?: string; effects?: { kind: string; label: string; detail?: string }[] }[],
): string {
  const cards =
    list.length === 0
      ? `<article class="kod-plate myth-card myth-card--empty"><p class="empty">No active Foundation Myths.</p></article>`
      : `<div class="myth-list">${list
          .map((m) => {
            const fx =
              (m.effects ?? []).length === 0
                ? `<span class="empty">No listed effects.</span>`
                : (m.effects ?? [])
                    .map(
                      (e) =>
                        `<span class="fx" data-kind="${escAttr(e.kind)}"><span class="fx__kind">${esc(e.kind.replace(/_/g, ' '))}</span><span class="fx__label">${esc(e.label)}</span>${e.detail ? infoBtn('Effect detail', e.detail) : ''}</span>`,
                    )
                    .join('');
            return `<article class="kod-plate myth-card">
              <p class="myth-card__kicker">Foundation Myth</p>
              <h3 class="myth-card__title">${esc(m.title)}</h3>
              ${m.summary ? `<p class="myth-card__summary">${esc(m.summary)}</p>` : ''}
              <div class="myth-card__fx">${fx}</div>
            </article>`;
          })
          .join('')}</div>`;
  return `<section class="hall__crypt" aria-labelledby="m-h">
    ${sectionHead('m-h', 'Foundation Myths', 'Active myths of this community. Effects fire only when a roll tags the Myth.', 'About Foundation Myths')}
    ${cards}
  </section>`;
}

function inspectPeople(view: HallView): {
  id: string;
  kind: string;
  name: string;
  slug?: string;
  whoWeSee: string;
  pc: boolean;
  placements: { axis: string; tier: string }[];
  labelIds: string[];
}[] {
  const map = new Map<
    string,
    {
      id: string;
      kind: string;
      name: string;
      slug?: string;
      whoWeSee: string;
      pc: boolean;
      placements: { axis: string; tier: string }[];
      labelIds: string[];
    }
  >();
  const pc = new Set(
    view.characters.filter((ch) => (ch.kind ?? 'pc') !== 'npc' && ch.kind !== 'notable').map((ch) => ch.slug),
  );
  for (const ch of view.characters) {
    const id = inspectId(ch.name, ch.slug);
    map.set(id, {
      id,
      kind: 'member',
      name: ch.name,
      slug: ch.slug,
      whoWeSee: ch.whoWeSee ?? '',
      pc: pc.has(ch.slug),
      placements: (ch.hierarchy ?? []).map((h) => ({ axis: h.axis, tier: h.tier })),
      labelIds: [...(ch.labelIds ?? [])],
    });
  }
  for (const p of view.community.placements ?? []) {
    const id = inspectId(p.name, p.characterSlug);
    const cur = map.get(id);
    if (cur) {
      if (!cur.placements.some((x) => x.axis === p.axis && x.tier === p.tier)) {
        cur.placements.push({ axis: p.axis, tier: p.tier });
      }
      if (p.note && !cur.whoWeSee) cur.whoWeSee = p.note;
      if (!p.characterSlug && p.labelIds?.length) {
        for (const lid of p.labelIds) {
          if (!cur.labelIds.includes(lid)) cur.labelIds.push(lid);
        }
      }
    } else {
      map.set(id, {
        id,
        kind: 'member',
        name: p.name,
        slug: p.characterSlug,
        whoWeSee: p.note ?? '',
        pc: Boolean(p.characterSlug && pc.has(p.characterSlug)),
        placements: [{ axis: p.axis, tier: p.tier }],
        labelIds: [...(p.labelIds ?? [])],
      });
    }
  }
  for (const o of view.community.outsiders ?? []) {
    const id = inspectId(o.name, o.characterSlug);
    const cur = map.get(id);
    if (cur) {
      cur.kind = 'outsider';
      if (o.note && !cur.whoWeSee) cur.whoWeSee = o.note;
      for (const lid of o.labelIds ?? []) {
        if (!cur.labelIds.includes(lid)) cur.labelIds.push(lid);
      }
    } else {
      map.set(id, {
        id,
        kind: 'outsider',
        name: o.name,
        slug: o.characterSlug,
        whoWeSee: o.note ?? '',
        pc: false,
        placements: [],
        labelIds: [...(o.labelIds ?? [])],
      });
    }
  }
  return [...map.values()];
}
