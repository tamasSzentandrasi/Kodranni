import type { CharacterRecord, HierarchyPlacement, Label, OutsiderRecord } from '@kodranni/store';
import { FACTION_GROUP_ID, labelsByIds, migrateCommunityLabels, personLabelIds } from '@kodranni/store';
import { esc, escAttr } from './escape.js';
import {
  FORTUNE_BLURBS,
  FORTUNE_LABELS,
  FORTUNE_ORDER,
  TIERS,
  axisDomain,
  axisKey,
  inspectId,
  type HallView,
} from './format.js';
import { infoBtn, sectionHead } from './layout.js';

export function communityInner(
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
  const source = live ? 'live' : 'snapshot';
  const founded = live && c.fortunesFoundedAt ? c.fortunesFoundedAt : '';
  return `${findPanel(c.hierarchyAxes ?? [])}
<div class="hall" data-slug="${escAttr(c.slug)}" data-source="${escAttr(source)}" data-founded="${escAttr(founded)}" data-view-group="${escAttr(FACTION_GROUP_ID)}">
  ${fortunePlates(c.fortunes)}
  ${aspectsRail(c)}
  ${hierarchy(c, tips, pcSlugs, canEdit, bySlug)}
  <div class="hall__porch">
    ${outsiders(c, bySlug)}
  </div>
  ${myths(c.myths ?? [])}
</div>
<div id="kod-hall-people" hidden>${esc(people)}</div>
<script src="/hall-client.js"></script>`;
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

function markVars(labels: Label[]): { n: number; style: string; ids: string } {
  const shown = labels.slice(0, 3);
  const parts: string[] = [];
  shown.forEach((l, i) => {
    if (l.hue != null) parts.push(`--m${i + 1}-h:${l.hue}`);
    else parts.push(`--m${i + 1}-h:36`);
  });
  return {
    n: shown.length,
    style: parts.join(';'),
    ids: labels.map((l) => l.id).join(' '),
  };
}

function findPanel(axes: string[]): string {
  const axisChips = axes
    .map(
      (axis) =>
        `<button type="button" class="hall-search__chip" data-filter="axis" data-value="${escAttr(axis)}" aria-pressed="false">${esc(axis)}</button>`,
    )
    .join('');
  const tierChips = TIERS.map(
    (tier) =>
      `<button type="button" class="hall-search__chip" data-filter="tier" data-value="${escAttr(tier)}" aria-pressed="false">${esc(tier)}</button>`,
  ).join('');
  return `<aside class="kod-plate hall-search" data-hall-search aria-label="Find someone in the hall">
  <header class="hall-search__head">
    <p class="hall-search__kicker">Hall</p>
    <h2 class="hall-search__title">Find</h2>
  </header>
  <div class="hall-search__lookup">
    <label class="hall-search__label" for="kod-hall-q">Name</label>
    <input id="kod-hall-q" class="hall-search__q" type="search" name="hall-q" autocomplete="off" placeholder="Optional — filters still list" data-hall-q/>
    <button type="button" class="hall-search__clear" data-hall-clear aria-label="Clear search">Clear</button>
  </div>
  <div class="hall-search__filters" data-hall-filters>
    <div class="hall-search__group" role="group" aria-label="Axis">
      <p class="hall-search__legend">Axis</p>${axisChips}
    </div>
    <div class="hall-search__group" role="group" aria-label="Standing">
      <p class="hall-search__legend">Standing</p>${tierChips}
    </div>
    <div class="hall-search__group" role="group" aria-label="Kind">
      <p class="hall-search__legend">Kind</p>
      <button type="button" class="hall-search__chip" data-filter="kind" data-value="pc" aria-pressed="false">Player</button>
      <button type="button" class="hall-search__chip" data-filter="kind" data-value="npc" aria-pressed="false">NPC</button>
    </div>
  </div>
  <ul class="hall-search__hits" data-hall-hits hidden></ul>
</aside>`;
}

function aspectsRail(c: HallView['community']): string {
  const groups = (c.labelGroups ?? []).filter((g) => {
    if (g.id === FACTION_GROUP_ID) return true;
    return (c.labels ?? []).some((l) => l.groupId === g.id);
  });
  if (groups.length === 0) return '';
  const tabs = groups
    .map((g, i) => {
      const selected = g.id === FACTION_GROUP_ID || (i === 0 && !groups.some((x) => x.id === FACTION_GROUP_ID));
      return `<button type="button" class="hall-aspects__tab" role="tab" id="aspect-tab-${escAttr(g.id)}" data-aspect-group="${escAttr(g.id)}" aria-selected="${selected ? 'true' : 'false'}" aria-controls="aspect-panel-${escAttr(g.id)}">${esc(g.name)}</button>`;
    })
    .join('');
  const panels = groups
    .map((g) => {
      const selected = g.id === FACTION_GROUP_ID || groups[0]?.id === g.id;
      const labs = (c.labels ?? []).filter((l) => l.groupId === g.id);
      const chips =
        labs.length === 0
          ? `<p class="hall-aspects__empty">None yet.</p>`
          : labs
              .map((l) => {
                const hue = l.hue != null ? ` style="--label-h:${l.hue}"` : '';
                return `<button type="button" class="hall-aspects__label${l.hue != null ? ' hall-aspects__label--hue' : ''}" data-label-id="${escAttr(l.id)}" data-group="${escAttr(g.id)}" aria-pressed="false"${hue}>${esc(l.name)}</button>`;
              })
              .join('');
      return `<div class="hall-aspects__panel" role="tabpanel" id="aspect-panel-${escAttr(g.id)}" data-aspect-panel="${escAttr(g.id)}" ${selected && g.id === FACTION_GROUP_ID ? '' : 'hidden'}>${chips}</div>`;
    })
    .join('');
  return `<section class="hall-aspects kod-plate" data-hall-aspects aria-label="Hall views">
    <p class="hall-aspects__kicker">View</p>
    <div class="hall-aspects__tabs" role="tablist" aria-label="Label groups">${tabs}</div>
    ${panels}
  </section>`;
}

function fortunePlates(values: Record<string, number> | undefined): string {
  const fortunes = values ?? {};
  const plates = FORTUNE_ORDER.map((k) => {
    const v = Math.min(3, Math.max(0, fortunes[k] ?? 0));
    const label = FORTUNE_LABELS[v] ?? '';
    return `<div class="kod-plate fortune" data-key="${k}" data-level="${v}" role="listitem" aria-label="${escAttr(k)}, ${escAttr(label)}">
      <span class="fortune__icon" aria-hidden="true"></span>
      <span class="fortune__name">${esc(k)}${infoBtn(`About ${k}`, FORTUNE_BLURBS[k] ?? '')}</span>
      <div class="fortune__stack" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <span class="fortune__state">${esc(label)}</span>
    </div>`;
  }).join('');
  return `<section class="hall__sky" aria-labelledby="f-h">
    ${sectionHead('f-h', 'Fortunes', 'Community-wide pressure — not a second character sheet. Weather, not a ledger.', 'About Fortunes')}
    <div class="fortune-hall" role="list">${plates}</div>
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
  const marks = markVars(labels);
  const cls = [
    'member',
    opts.pc && 'member--pc',
    opts.pending && 'member--pending',
    opts.kind === 'outsider' && 'member--outsider',
  ]
    .filter(Boolean)
    .join(' ');
  const extra =
    labels.length > 3
      ? `<span class="member__more" aria-hidden="true">+${labels.length - 3}</span>`
      : '';
  const pending = opts.pending
    ? `<span class="member__knot" aria-hidden="true">◆</span>${esc(opts.name)}${extra}<span class="member__pending">pending</span>`
    : `${esc(opts.name)}${extra}`;
  const style = marks.n ? ` style="${escAttr(marks.style)}"` : '';
  const data = `class="${cls}" data-inspect-id="${escAttr(opts.personId)}" data-name="${escAttr(opts.name)}" data-kind="${escAttr(opts.kind ?? 'npc')}"${opts.slug ? ` data-slug="${escAttr(opts.slug)}"` : ''}${opts.tip ? ` data-tip="${escAttr(opts.tip)}"` : ''}${opts.roving ? ' tabindex="-1"' : ''}${marks.ids ? ` data-label-ids="${escAttr(marks.ids)}"` : ''}${marks.n ? ` data-mark-n="${marks.n}"` : ''}${style}`;
  if (opts.slug) return `<a ${data} href="/characters/${escAttr(opts.slug)}/">${pending}</a>`;
  return `<span ${data}>${pending}</span>`;
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
    ? `<div class="hier-add"><button type="button" class="kod-plus" data-rite-open="figure" aria-label="Add a character"><span class="kod-plus__ring" aria-hidden="true"></span><span class="kod-plus__mark" aria-hidden="true">+</span></button></div>`
    : '';
  const axes = (c.hierarchyAxes ?? [])
    .map((axis, ai) => {
      const onAxis = (c.placements ?? []).filter((p) => p.axis === axis);
      const key = axisKey(axis, ai);
      const rungs = TIERS.map((tier) => {
        const members = onAxis.filter((p) => p.tier === tier);
        const empty = members.length === 0;
        const collapsed = empty || (tier === 'Outcast' && members.length > 5);
        const lis = empty
          ? `<li class="empty">—</li>`
          : members
              .map((m) => {
                const tip = tipFor(m.name, m.characterSlug, m.note);
                return `<li>${memberName({
                  name: m.name,
                  slug: m.characterSlug,
                  pc: isPc(m.characterSlug),
                  tip,
                  kind: isPc(m.characterSlug) ? 'pc' : 'npc',
                  personId: inspectId(m.name, m.characterSlug),
                  roving: true,
                  labels: labelsForPerson(c, bySlug, m.name, m.characterSlug),
                })}</li>`;
              })
              .join('');
        return `<li class="hier-rung" data-tier="${escAttr(tier)}" data-collapsed="${collapsed ? 'true' : 'false'}">
          <button type="button" class="hier-rung__head" data-rung-toggle tabindex="-1" aria-expanded="${collapsed ? 'false' : 'true'}">
            <span class="hier-rung__tier">${esc(tier)}</span>
            <span class="hier-rung__n">${members.length}</span>
            <span class="hier-rung__chev" aria-hidden="true"></span>
          </button>
          <ul class="hier-rung__members kod-scroll">${lis}</ul>
        </li>`;
      }).join('');
      return `<div class="kod-plate hier-axis" data-axis="${escAttr(key)}" data-axis-name="${escAttr(axis)}">
        <button type="button" class="hier-axis__head" data-axis-focus="${escAttr(key)}" aria-pressed="false" tabindex="${ai === 0 ? 0 : -1}">
          <p class="hier-axis__name">${esc(axis)}</p>
          <p class="hier-axis__domain">${esc(axisDomain(axis))}</p>
          <span class="hier-axis__count">${onAxis.length} placed</span>
        </button>
        <ol class="hier-rungs">${rungs}</ol>
      </div>`;
    })
    .join('');
  return `<section class="hall__crown" aria-labelledby="h-h">
    ${sectionHead('h-h', 'Hierarchy', 'One crown, then parallel ladders. Same four tiers on every axis (Honoured → Outcast). Colour marks the axis; saturation falls toward Outcast. Hover a name for who they are; click to open the sheet.', 'About Hierarchy')}
    <div class="kod-plate hier-ruler"><p class="hier-ruler__title">Ruler</p>${rulerBlock}</div>
    ${add}
    <p class="hier-join" aria-hidden="true"></p>
  </section>
  <div class="hall__nave" role="region" aria-label="Hierarchy ladders">
    <div class="hier-axes">${axes}</div>
  </div>`;
}

function outsiders(c: HallView['community'], bySlug: Map<string, CharacterRecord>): string {
  const list = c.outsiders ?? [];
  const items =
    list.length === 0
      ? `<li class="empty">None tracked.</li>`
      : list
          .map((o) => {
            return `<li>${memberName({
              name: o.name,
              slug: o.characterSlug,
              tip: o.note,
              kind: 'outsider',
              personId: inspectId(o.name, o.characterSlug),
              labels: labelsForPerson(c, bySlug, o.name, o.characterSlug),
            })}</li>`;
          })
          .join('');
  return `<aside class="kod-plate outsiders" aria-labelledby="o-h">
    <div class="section-head" style="margin:0"><h3 id="o-h">Outsiders</h3>${infoBtn('About Outsiders', 'Never of this community. Sit apart until inducted (then Outcast on the axes that apply). Same name chip as kin; marks are faction and tag memberships.')}</div>
    <ul class="outsiders__list kod-scroll">${items}</ul>
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
