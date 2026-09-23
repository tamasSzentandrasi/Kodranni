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
  axisDomain,
  axisKey,
  inspectId,
  type HallView,
} from './format.js';
import { infoBtn, sectionHead } from './layout.js';

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
  opts?: { live?: boolean; canEdit?: boolean },
): string {
  const live = opts?.live === true;
  const c = migrateCommunityLabels(view.community);
  const shell = hallShell(c, live, 'hall--overview');
  return `${shell.open}
  ${fortunePlates(c.fortunes)}
  ${myths(c.myths ?? [])}
${shell.close}
<script src="/hall-client.js"></script>`;
}

/** Hierarchy diagram with Find, Factions, and Tags drawers. */
export function hierarchyInner(
  view: HallView,
  opts?: { live?: boolean; canEdit?: boolean },
): string {
  const live = opts?.live === true;
  const canEdit = live && opts?.canEdit === true;
  const c = migrateCommunityLabels(view.community);
  const tips = whoWeSeeMap(view.characters, c.placements ?? [], c.outsiders ?? []);
  const pcSlugs = new Set(
    view.characters.filter((ch) => (ch.kind ?? 'pc') !== 'npc' && ch.kind !== 'notable').map((ch) => ch.slug),
  );
  const bySlug = new Map(view.characters.map((ch) => [ch.slug, ch] as const));
  const people = inspectPeopleJson({ ...view, community: c });
  const labelCatalog = JSON.stringify({
    groups: c.labelGroups ?? [],
    labels: c.labels ?? [],
  });
  const shell = hallShell(c, live, 'hall--hierarchy');
  return `${slideRails(c)}
${shell.open}
  <section class="hall__htitle" aria-labelledby="h-h">
    ${sectionHead('h-h', 'Hierarchy', 'One crown, then parallel ladders. Same four tiers on every axis (Honoured → Outcast). Colour marks the axis; saturation falls toward Outcast. Hover a name for who they are; click to open the sheet.', 'About Hierarchy')}
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
    ${hierarchy(c, tips, pcSlugs, canEdit, bySlug)}
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

function slideRails(c: HallView['community']): string {
  return `<div class="kod-rail kod-rail--left">
  ${slideShell('factions', 'Factions', factionsPanel(c))}
  ${slideShell('tags', 'Tags', tagsPanel(c))}
</div>
<div class="kod-rail kod-rail--right">
  ${slideShell('find', 'Find', findPanel(c))}
</div>`;
}

function slideShell(id: string, word: string, inner: string): string {
  return `<div class="kod-slide" data-slide="${escAttr(id)}" data-open="false">
  ${slideTab(id, word)}
  <div class="kod-slide__panel kod-plate" id="kod-slide-${escAttr(id)}"><span class="kod-slide__rail kod-slide__rail--top" aria-hidden="true"></span><span class="kod-slide__rail kod-slide__rail--bot" aria-hidden="true"></span>${inner}</div>
</div>`;
}

function factionNameplate(l: Label): string {
  const stain =
    l.hue != null ? ` data-stain style="--stain: hsl(${l.hue} 55% 48%)"` : '';
  return `<button type="button" class="member member--drawer" data-faction-id="${escAttr(l.id)}" data-group="${escAttr(l.groupId)}" aria-pressed="false"${stain}><span class="member__stain" aria-hidden="true"></span><span class="member__glow" aria-hidden="true"></span><span class="member__name">${esc(l.name)}</span></button>`;
}

function allegiancePicker(c: HallView['community'], forFind = false): string {
  const groups = (c.labelGroups ?? []).filter(
    (g) => g.kind === 'faction' && (c.labels ?? []).some((l) => l.groupId === g.id),
  );
  const cats = groups
    .map((g) => {
      const labs = (c.labels ?? []).filter((l) => l.groupId === g.id);
      const plates = labs.map((l) => factionNameplate(l)).join('');
      return `<div class="allegiance__cat" data-faction-cat="${escAttr(g.id)}">
        <button type="button" class="kod-btn kod-btn--folio allegiance__pick" data-view-group="${escAttr(g.id)}" aria-pressed="false">
          <span class="kod-btn__title">${esc(g.name)}</span>
        </button>
        <div class="allegiance__list" data-faction-list hidden>${plates}</div>
      </div>`;
    })
    .join('');
  const extra = forFind ? ' data-find-tree' : ' data-hall-legend data-view-stave';
  return `<div class="allegiance"${extra}>${cats}</div>`;
}

function findPanel(c: HallView['community']): string {
  return `<div class="hall-search" data-hall-search>
  <label class="hall-search__label" for="kod-hall-q">Name</label>
  <input id="kod-hall-q" class="hall-search__q" type="search" name="hall-q" autocomplete="off" placeholder="Name…" data-hall-q/>
  <p class="hall-search__kicker">Filter by Allegiance</p>
  ${allegiancePicker(c, true)}
</div>`;
}

function factionsPanel(c: HallView['community']): string {
  return allegiancePicker(c, false);
}

function tagsPanel(c: HallView['community']): string {
  const tags = (c.labels ?? []).filter((l) => l.groupId === TAG_GROUP_ID);
  if (!tags.length) return `<p class="empty">No tags yet.</p>`;
  const rows = tags
    .map(
      (t) =>
        `<button type="button" class="kod-btn tag-row" data-tag-id="${escAttr(t.id)}" aria-pressed="false"><span>${esc(t.name)}</span></button>`,
    )
    .join('');
  return `<div class="tag-list" data-tag-list>${rows}</div>`;
}

function fortuneTitle(k: string): string {
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function fortunePlates(values: Record<string, number> | undefined): string {
  const fortunes = values ?? {};
  const plates = FORTUNE_ORDER.map((k) => {
    const v = Math.min(3, Math.max(0, fortunes[k] ?? 0));
    const label = FORTUNE_LABELS[v] ?? '';
    const title = fortuneTitle(k);
    return `<div class="kod-fortune kod-fortune--${escAttr(k)}" data-fortune="${escAttr(k)}" data-level="${v}" role="listitem" aria-label="${escAttr(title)}, ${escAttr(label)}">
      <span class="kod-fortune__icon" aria-hidden="true"></span>
      <span class="kod-fortune__name">${esc(title)}</span>
      <span class="kod-fortune__tree" aria-hidden="true"></span>
      <span class="kod-fortune__states"><span class="kod-fortune__state">${esc(label)}</span></span>
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
  const data = `class="${cls}" data-inspect-id="${escAttr(opts.personId)}" data-name="${escAttr(opts.name)}" data-kind="${escAttr(opts.kind ?? 'npc')}"${opts.slug ? ` data-slug="${escAttr(opts.slug)}"` : ''}${opts.tip ? ` data-tip="${escAttr(opts.tip)}"` : ''}${opts.roving ? ' tabindex="-1"' : ''}${ids ? ` data-label-ids="${escAttr(ids)}"` : ''}`;
  if (opts.slug) return `<a ${data} href="/characters/${escAttr(opts.slug)}/">${inner}</a>`;
  return `<span ${data}>${inner}</span>`;
}

function hierarchy(
  c: HallView['community'],
  tips: Map<string, string>,
  pcSlugs: Set<string>,
  live: boolean,
  bySlug: Map<string, CharacterRecord>,
): string {
  const isPc = (slug?: string) => Boolean(slug && pcSlugs.has(slug));
  const tipFor = (name: string, slug?: string, note?: string) => {
    if (note) return note;
    if (slug && tips.has(slug)) return tips.get(slug)!;
    return tips.get(name.toLowerCase()) ?? '';
  };
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
      })
    : `<p class="hier-ruler__note">One seat for the whole community — none claimed.</p>`;
  const add = live
    ? `<div class="hier-add"><button type="button" class="kod-plus" data-rite-open="figure" aria-label="Add a character"></button></div>`
    : '';
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
            });
          })
          .join('');
        return `<li data-tier="${escAttr(tier)}"><strong class="kod-hier-rung-label">${esc(tier)}</strong><div class="kod-hier-rung__people">${people}</div></li>`;
      }).join('');
      return `<div class="kod-hier-axis" data-axis="${escAttr(key)}" data-axis-name="${escAttr(axis)}">
        <p class="kod-hier-axis__domain">${esc(axisDomain(axis))}</p>
        <div class="kod-hier-axis__plate">
          <div class="kod-hier-axis__head" data-axis-focus="${escAttr(key)}" tabindex="${ai === 0 ? 0 : -1}">
            <p class="kod-hier-axis__name">${esc(axis)}</p>
          </div>
          <ol class="kod-hier-rungs">${rungs}</ol>
        </div>
      </div>`;
    })
    .join('');
  return `<div class="kod-hier-diagram hall__diagram">
    <div class="kod-hier-ruler"><p class="kod-hier-ruler__title">Ruler</p>${rulerBlock}${add}</div>
    <div class="kod-hier-body">
    <div class="kod-hier-axes" role="region" aria-label="Hierarchy ladders">${axes}</div>
    ${outsiders(c, bySlug)}
    </div>
  </div>`;
}

function outsiders(c: HallView['community'], bySlug: Map<string, CharacterRecord>): string {
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
            }),
          )
          .join('');
  return `<aside class="kod-hier-porch" aria-labelledby="o-h">
    <div class="kod-hier-porch__head"><p class="kod-hier-porch__title" id="o-h">Outsiders</p>${infoBtn('About Outsiders', 'Never of this community. Sit apart until inducted (then Outcast on the axes that apply).')}</div>
    <div class="kod-hier-porch__people">${items}</div>
  </aside>`;
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

function inspectPeopleJson(view: HallView): string {
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
  return JSON.stringify([...map.values()]);
}
