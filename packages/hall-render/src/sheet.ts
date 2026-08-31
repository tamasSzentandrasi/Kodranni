import {
  ARCHETYPES,
  FOUNDATION_GROUPS,
  FOUNDATION_HARM,
} from '@kodranni/domain';
import type { CharacterRecord } from '@kodranni/store';
import { esc, escAttr } from './escape.js';
import {
  avatarUrl,
  harmPips,
  monogram,
  roman,
  segments,
  WEIGHT_BAND,
} from './format.js';
import { infoBtn, sectionHead } from './layout.js';

type SheetTab = 'core' | 'echoes' | 'inventory';

function sheetTabs(slug: string, tab: SheetTab): string {
  const s = escAttr(slug);
  const cur = (t: SheetTab) => (t === tab ? ' aria-current="page"' : '');
  return `<nav class="sheet-tabs" aria-label="Sheet sections">
  <a href="/characters/${s}/"${cur('core')}>Core</a>
  <a href="/characters/${s}/echoes/"${cur('echoes')}>Echoes · Traits</a>
  <a href="/characters/${s}/inventory/"${cur('inventory')}>Inventory</a>
</nav>`;
}

function identity(ch: CharacterRecord): string {
  const av = avatarUrl(ch.slug, ch.avatar);
  const portrait = av
    ? `<img class="avatar avatar--lg" src="${escAttr(av)}" alt="" width="84" height="84"/>`
    : `<span class="avatar avatar--lg avatar--mono" aria-hidden="true">${esc(monogram(ch.name))}</span>`;
  const statusLabel = ch.status === 'pending_review' ? 'pending review' : ch.status;
  const player = ch.player?.displayName
    ? `played by <strong>${esc(ch.player.displayName)}</strong>${ch.player.platform ? ` · ${esc(ch.player.platform)}` : ''}`
    : `<span class="empty">No player mapped</span>`;
  const flags = [
    ch.dying ? `<span class="flag">Dying</span>` : '',
    ch.flags?.decadence
      ? `<span class="flag" data-tip="No active Echoes — −1 die on every roll">Decadence</span>`
      : '',
    ch.flags?.overCapacity
      ? `<span class="flag" data-tip="−1 die only on rolls that involve an Echo">Over capacity</span>`
      : '',
  ].join('');
  const who = ch.whoWeSee
    ? `<div class="sheet-identity__who">
      <p class="sheet-identity__who-lab">Who do we see?</p>
      <p class="sheet-identity__who-text">${esc(ch.whoWeSee)}</p>
    </div>`
    : '';
  return `<div class="kod-plate sheet-identity">
    <div class="sheet-identity__portrait">${portrait}</div>
    <div class="sheet-identity__text">
      <h1 class="sheet-identity__name">${esc(ch.name)}</h1>
      <p class="sheet-identity__player">${player}</p>
      <p class="sheet-identity__chips">
        <span class="char-card__status" data-status="${escAttr(ch.status)}">${esc(statusLabel)}</span>
        ${flags}
      </p>
    </div>
    ${who}
  </div>`;
}

function vtrack(opts: {
  echo?: boolean;
  label: string;
  filled: number;
  max: number;
  tip: string;
  about: string;
}): string {
  const segs = segments(opts.filled, opts.max)
    .map(
      (s) =>
        `<span class="vtrack__seg${s.on ? ' vtrack__seg--on' : ''}${s.over ? ' vtrack__seg--over' : ''}"></span>`,
    )
    .join('');
  return `<aside class="kod-plate vtrack${opts.echo ? ' vtrack--echo' : ''}" aria-label="${escAttr(`${opts.label} ${opts.filled} of ${opts.max}`)}">
    <span class="vtrack__label">${esc(opts.label)}</span>
    <div class="vtrack__segs">${segs}</div>
    <div class="vtrack__readout">${opts.filled}<span class="vtrack__of">/${opts.max}</span></div>
    ${infoBtn(opts.about, opts.tip)}
  </aside>`;
}

function practiceFrac(practice: number, threshold: number, rating: number): number {
  if (rating >= 3) return 1;
  if (rating <= 0 || threshold <= 0) return 0;
  return Math.min(1, Math.max(0, practice / threshold));
}

function skillWheel(ch: CharacterRecord): string {
  const skillMap = new Map((ch.skills ?? []).map((s) => [s.name, s]));
  const arches = ARCHETYPES.map((arch) => {
    const skills = arch.skills
      .map((def) => {
        const prog = skillMap.get(def.name);
        const rating = prog?.rating ?? 0;
        const practice = prog?.practice ?? 0;
        const threshold = prog?.threshold ?? 24;
        const p = practiceFrac(practice, threshold, rating);
        const pct = Math.round(p * 100);
        const tip =
          rating <= 0
            ? `Untrained · ${def.foundation}`
            : rating >= 3
              ? `Rating 3 (max) · ${def.foundation}`
              : `Rating ${rating} · Practice ${practice}/${threshold} (${pct}% to next) · ${def.foundation}`;
        return `<li class="skill" data-rating="${rating}" data-rated="${rating > 0 ? 'true' : 'false'}" style="--p: ${p}" data-tip="${escAttr(tip)}" tabindex="0">
          <span class="skill__ring" style="--p: ${p}"><span class="skill__inner">${rating}</span></span>
          <span class="skill__name">${esc(def.name)}</span>
          <details class="skill__more"><summary>About</summary><p>${esc(tip)}</p></details>
        </li>`;
      })
      .join('');
    return `<div class="arch arch--${escAttr(arch.id)}">
      <div class="arch__art" aria-hidden="true">
        <img src="/archetypes/${escAttr(arch.id)}.jpg" alt="" width="400" height="400" loading="lazy" decoding="async"/>
      </div>
      <div class="arch__body">
        <div class="arch__head">
          <span class="arch__name">${esc(arch.name)}</span>
          <span class="arch__tag">${esc(arch.tag)}</span>
        </div>
        <ul class="arch__skills">${skills}</ul>
      </div>
    </div>`;
  }).join('');
  return `<div class="skill-wheel">${arches}</div>`;
}

function foundGroups(ch: CharacterRecord): string {
  const groups = Object.entries(FOUNDATION_GROUPS)
    .map(([group, keys]) => {
      const rows = keys
        .map((fname) => {
          const raw = ch.foundations?.[fname] ?? 0;
          const eff = ch.foundationsEffective?.[fname] ?? raw;
          const harmName = FOUNDATION_HARM[fname] ?? '';
          const harmPts = ch.harm?.[harmName] ?? 0;
          const tip =
            eff !== raw ? `Effective ${roman(eff)} · raw ${roman(raw)}` : `Rank ${roman(eff)}`;
          const pips = harmPips(harmPts)
            .map((on) => `<span class="pip${on ? ' pip--on' : ''}"></span>`)
            .join('');
          return `<div class="found-row">
            <span class="found-row__name">${esc(fname)}</span>
            <span class="found-row__val"><span data-tip="${escAttr(tip)}">${esc(roman(eff))}${eff !== raw ? '*' : ''}</span></span>
            <span class="found-row__harm">
              <span class="found-row__harm-name">${esc(harmName)}</span>
              <span class="pips" aria-label="${harmPts} of 3">${pips}</span>
            </span>
          </div>`;
        })
        .join('');
      return `<div class="kod-plate found-group found-group--${group.toLowerCase()}">
        <p class="found-group__title">${esc(group)}</p>
        ${rows}
      </div>`;
    })
    .join('');
  return `<div class="found-groups">${groups}</div>`;
}

export function sheetInner(ch: CharacterRecord, communityName: string): string {
  void communityName;
  const exertion = ch.exertion ?? { current: 0, max: 0 };
  const echoMax = ch.echoCapacity ?? 0;
  const echoLoad = ch.echoWeight ?? 0;
  return `${sheetTabs(ch.slug, 'core')}
<div class="sheet-stage sheet-stage--core">
  ${identity(ch)}
  <div class="core-grid">
    ${vtrack({
      label: 'Exertion',
      filled: exertion.current,
      max: exertion.max,
      about: 'About Exertion',
      tip: 'Res + Con + Cha. One segment = 1. Empty pool → −2 dice on rolls.',
    })}
    <div class="core-main">
      ${ch.communityTie ? `<p class="sheet-tie">${esc(ch.communityTie)}</p>` : ''}
      <section class="kod-plate" id="section-foundations">
        ${sectionHead('found-h', 'Foundations · Harm', 'Physical / Mental / Social. Rank as Roman mark; Harm as blood pips on the paired track (max 3).', 'About Foundations')}
        ${foundGroups(ch)}
      </section>
      <section class="kod-plate" id="section-skills">
        ${sectionHead('sk-h', 'Skills by Archetype', 'Centre = rating. The coloured ring fills with Practice toward the next rank. Hover a skill for Practice and Foundation; open About on touch.', 'About Skills')}
        ${skillWheel(ch)}
      </section>
    </div>
    ${vtrack({
      echo: true,
      label: 'Echo load',
      filled: echoLoad,
      max: echoMax,
      about: 'About Echo load',
      tip: 'max(Str, Dex) + Int + Auth. Only unresolved Echoes count. Over capacity → −1 on Echo-involved rolls only.',
    })}
  </div>
</div>`;
}

export function sheetEchoesInner(ch: CharacterRecord): string {
  const echoes = ch.echoes ?? [];
  const live = echoes.filter((e) => !e.resolved);
  const resolved = echoes.filter((e) => e.resolved);
  const card = (e: (typeof echoes)[number], faded: boolean) => {
    const w = (e.weight === 2 || e.weight === 3 ? e.weight : 1) as 1 | 2 | 3;
    const segs = [1, 2, 3].map((i) => `<i class="${i <= w ? 'on' : ''}"></i>`).join('');
    if (faded) {
      return `<article class="kod-plate echo echo--resolved">
        <div class="echo__weight" data-weight="${w}">
          <span class="weight-segs" aria-label="Weight ${w}">${segs}</span>
          <span class="weight-band">${WEIGHT_BAND[w]}</span>
        </div>
        <div class="echo__body">
          <h3 class="echo__title">${esc(e.title)}</h3>
          ${e.resolved ? `<p class="echo-card__res">${esc(e.resolved.narrative)}</p>` : ''}
        </div>
      </article>`;
    }
    return `<article class="kod-plate echo">
      <div class="echo__weight" data-weight="${w}">
        <span class="weight-segs" aria-label="Weight ${w}">${segs}</span>
        <span class="weight-band">${WEIGHT_BAND[w]}</span>
      </div>
      <div class="echo__body">
        <h3 class="echo__title">${esc(e.title)}</h3>
        <div class="echo__invoke"><span class="echo__invoke-lab">Invoke when</span> ${esc(e.invokeWhen)}</div>
      </div>
    </article>`;
  };
  const traits = ch.traits.length
    ? `<ul class="trait-list">${ch.traits
        .map(
          (t) =>
            `<li class="kod-plate trait"><strong>${esc(t.name)}</strong>${t.note ? ` — ${esc(t.note)}` : ''}</li>`,
        )
        .join('')}</ul>`
    : '<p class="empty">No traits recorded.</p>';
  return `${sheetTabs(ch.slug, 'echoes')}
<div class="sheet-stage">
  ${identity(ch)}
  <section class="kod-plate" aria-labelledby="ec-h">
    ${sectionHead('ec-h', 'Active Echoes', 'Left column = weight (1–3).', 'About active Echoes')}
    <div class="echo-list">${live.length ? live.map((e) => card(e, false)).join('') : '<p class="empty">None active — Decadence if this stands (−1 die on every roll).</p>'}</div>
  </section>
  ${
    resolved.length
      ? `<section class="kod-plate" aria-labelledby="res-h"><h2 id="res-h">Resolved</h2>${resolved.map((e) => card(e, true)).join('')}</section>`
      : ''
  }
  <section class="kod-plate" aria-labelledby="tr-h">
    <h2 id="tr-h">Traits</h2>
    ${traits}
  </section>
</div>`;
}

export function sheetInventoryInner(ch: CharacterRecord): string {
  const items = ch.inventory?.items ?? [];
  const kind = ch.armour?.kind ?? 'none';
  const donned = Boolean(ch.armour?.donned);
  const armourLabel = kind === 'none' ? 'None' : kind === 'light' ? 'Light' : 'Heavy';
  const armourState =
    kind === 'none' ? 'None worn' : donned ? 'Donned' : 'Carried';
  const itemList = items.length
    ? items
        .map(
          (i) =>
            `<li class="kod-plate item"><span class="item__name">${esc(i.name)}</span>${i.note ? `<span class="item__note">${esc(i.note)}</span>` : ''}</li>`,
        )
        .join('')
    : '<li class="empty">None declared.</li>';
  return `${sheetTabs(ch.slug, 'inventory')}
<div class="sheet-stage">
  ${identity(ch)}
  <section class="kod-plate" id="inventory-panel">
    ${sectionHead('inv-h', 'Inventory', 'Armour, food, water, and named items as last published.', 'About Inventory')}
    <div class="inv-grid">
      <div>
        <div class="kod-plate armour" data-kind="${escAttr(kind)}" data-donned="${donned}">
          <span class="armour__lab">Armour</span>
          <span class="armour__val">${esc(armourLabel)}</span>
          <span class="armour__state">${esc(armourState)}</span>
        </div>
        <div class="supplies">
          <div class="kod-plate supply" data-supply="food">
            <span class="supply__lab">Food</span>
            <span class="supply__val">${ch.inventory?.foodDays ?? 0}</span>
            <span class="supply__unit">days</span>
          </div>
          <div class="kod-plate supply" data-supply="water">
            <span class="supply__lab">Water</span>
            <span class="supply__val">${ch.inventory?.waterDays ?? 0}</span>
            <span class="supply__unit">days</span>
          </div>
        </div>
      </div>
      <div>
        <h3 style="font-size:1rem;margin:0 0 0.4rem">Named items</h3>
        <ul class="item-list">${itemList}</ul>
      </div>
    </div>
  </section>
</div>`;
}
