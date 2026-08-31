import type { CharacterRecord, HierarchyPlacement, OutsiderRecord } from '@kodranni/store';
import { esc, escAttr } from './escape.js';
import {
  FORTUNE_BLURBS,
  FORTUNE_LABELS,
  FORTUNE_ORDER,
  TIERS,
  axisDomain,
  axisKey,
  collectFactions,
  inspectId,
  resolveFactionHue,
  type FactionOpt,
  type HallView,
} from './format.js';
import { infoBtn, sectionHead } from './layout.js';

export function communityInner(
  view: HallView,
  opts?: { live?: boolean; canEdit?: boolean },
): string {
  const live = opts?.live === true;
  const canEdit = live && opts?.canEdit === true;
  const c = view.community;
  const factions = collectFactions(c.factions, c.outsiders ?? []);
  const tips = whoWeSeeMap(view.characters, c.placements ?? [], c.outsiders ?? []);
  const pcSlugs = new Set(
    view.characters.filter((ch) => (ch.kind ?? 'pc') !== 'npc' && ch.kind !== 'notable').map((ch) => ch.slug),
  );
  const people = inspectPeopleJson(view, factions);
  const source = live ? 'live' : 'snapshot';
  const founded = live && c.fortunesFoundedAt ? c.fortunesFoundedAt : '';
  return `${findPanel(c.hierarchyAxes ?? [], factions)}
<div class="hall" data-slug="${escAttr(c.slug)}" data-source="${escAttr(source)}" data-founded="${escAttr(founded)}">
  ${fortunePlates(c.fortunes)}
  ${hierarchy(c, tips, pcSlugs, canEdit)}
  <div class="hall__porch">
    ${outsiders(c.outsiders ?? [], factions)}
    ${factionList(factions, canEdit)}
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

function findPanel(axes: string[], factions: FactionOpt[]): string {
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
  const factionChips =
    factions.length === 0
      ? `<p class="hall-search__empty">None listed yet.</p>`
      : factions
          .map(
            (f) =>
              `<button type="button" class="hall-search__chip hall-search__chip--faction" data-filter="faction" data-value="${escAttr(f.name)}" aria-pressed="false" style="--faction-h: ${f.hue}">${esc(f.name)}</button>`,
          )
          .join('');
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
    <div class="hall-search__group" role="group" aria-label="Faction">
      <p class="hall-search__legend">Factions</p>${factionChips}
    </div>
  </div>
  <ul class="hall-search__hits" data-hall-hits hidden></ul>
</aside>`;
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
}): string {
  const cls = ['member', opts.pc && 'member--pc', opts.pending && 'member--pending']
    .filter(Boolean)
    .join(' ');
  const pending = opts.pending
    ? `<span class="member__knot" aria-hidden="true">◆</span>${esc(opts.name)}<span class="member__pending">pending</span>`
    : esc(opts.name);
  const data = `class="${cls}" data-inspect-id="${escAttr(opts.personId)}" data-name="${escAttr(opts.name)}" data-kind="${escAttr(opts.kind ?? 'npc')}"${opts.slug ? ` data-slug="${escAttr(opts.slug)}"` : ''}${opts.tip ? ` data-tip="${escAttr(opts.tip)}"` : ''}${opts.roving ? ' tabindex="-1"' : ''}`;
  if (opts.slug) return `<a ${data} href="/characters/${escAttr(opts.slug)}/">${pending}</a>`;
  return `<span ${data}>${pending}</span>`;
}

function hierarchy(
  c: HallView['community'],
  tips: Map<string, string>,
  pcSlugs: Set<string>,
  live: boolean,
): string {
  const isPc = (slug?: string) => Boolean(slug && pcSlugs.has(slug));
  const tipFor = (name: string, slug?: string, note?: string) => {
    if (note) return note;
    if (slug && tips.has(slug)) return tips.get(slug)!;
    return tips.get(name.toLowerCase()) ?? '';
  };
  const personKey = (name: string, slug?: string) => (slug ?? name).toLowerCase();
  const rulerId = c.ruler ? inspectId(c.ruler, c.rulerCharacterSlug) : '';
  const rulerBlock = c.ruler
    ? memberName({
        name: c.ruler,
        slug: c.rulerCharacterSlug,
        pc: isPc(c.rulerCharacterSlug),
        tip: tipFor(c.ruler, c.rulerCharacterSlug),
        kind: isPc(c.rulerCharacterSlug) ? 'pc' : 'npc',
        personId: rulerId,
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
        <div class="hier-axis__head" tabindex="${ai === 0 ? 0 : -1}">
          <p class="hier-axis__name">${esc(axis)}</p>
          <p class="hier-axis__domain">${esc(axisDomain(axis))}</p>
          <span class="hier-axis__count">${onAxis.length} placed</span>
        </div>
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

function outsiders(list: OutsiderRecord[], factions: FactionOpt[]): string {
  const items =
    list.length === 0
      ? `<li class="empty">None tracked.</li>`
      : list
          .map((o) => {
            const hue = o.faction ? resolveFactionHue(o.faction, factions) : 0;
            const href = o.characterSlug ? `/characters/${encodeURIComponent(o.characterSlug)}/` : undefined;
            const style = o.faction ? ` style="--faction-h: ${hue}"` : '';
            const data = `class="outsider"${style} data-inspect-id="${escAttr(inspectId(o.name, o.characterSlug))}" data-name="${escAttr(o.name)}" data-kind="outsider" data-faction="${escAttr(o.faction ?? '')}" data-tip="${escAttr(o.note ?? '')}"${o.characterSlug ? ` data-slug="${escAttr(o.characterSlug)}"` : ''}`;
            const inner = `<span class="outsider__name">${esc(o.name)}</span>${o.faction ? `<span class="outsider__faction">${esc(o.faction)}</span>` : ''}`;
            return `<li>${href ? `<a ${data} href="${escAttr(href)}">${inner}</a>` : `<div ${data}>${inner}</div>`}</li>`;
          })
          .join('');
  return `<aside class="kod-plate outsiders" aria-labelledby="o-h">
    <div class="section-head" style="margin:0"><h3 id="o-h">Outsiders</h3>${infoBtn('About Outsiders', 'Named individuals only. Faction is a coloured property. Not on any ladder until inducted. Hover for who they are; click a sheeted name to open it.')}</div>
    <ul class="outsiders__list kod-scroll">${items}</ul>
  </aside>`;
}

function factionList(factions: FactionOpt[], live: boolean): string {
  const items =
    factions.length === 0
      ? `<li class="empty">None listed yet.</li>`
      : factions
          .map(
            (f) =>
              `<li><button type="button" class="faction-row" data-preview-faction="${escAttr(f.name)}" style="--faction-h: ${f.hue}"><span class="faction-row__swatch" aria-hidden="true"></span><span class="faction-row__name">${esc(f.name)}</span></button></li>`,
          )
          .join('');
  const add = live
    ? `<div class="factions__add"><button type="button" class="kod-plus kod-plus--sm" data-rite-open="faction" aria-label="Add a faction"><span class="kod-plus__ring" aria-hidden="true"></span><span class="kod-plus__mark" aria-hidden="true">+</span></button></div>`
    : '';
  return `<aside class="kod-plate factions" aria-labelledby="fac-h">
    <div class="section-head" style="margin:0"><h3 id="fac-h">Factions</h3>${infoBtn('About Factions', 'Banners outsiders may answer to. Colour is theirs. Find still filters the hall; this list is the record.')}</div>
    <ul class="factions__list">${items}</ul>
    ${add}
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

function inspectPeopleJson(view: HallView, _factions: FactionOpt[]): string {
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
    } else {
      map.set(id, {
        id,
        kind: 'member',
        name: p.name,
        slug: p.characterSlug,
        whoWeSee: p.note ?? '',
        pc: Boolean(p.characterSlug && pc.has(p.characterSlug)),
        placements: [{ axis: p.axis, tier: p.tier }],
      });
    }
  }
  return JSON.stringify([...map.values()]);
}
