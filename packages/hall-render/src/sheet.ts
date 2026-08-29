import { FOUNDATION_NAMES } from '@kodranni/domain';
import type { CharacterRecord } from '@kodranni/store';
import { esc, escAttr } from './escape.js';
import { avatarUrl, monogram, roman } from './format.js';

export function sheetInner(ch: CharacterRecord, communityName: string): string {
  void communityName;
  const av = avatarUrl(ch.slug, ch.avatar);
  const portrait = av
    ? `<img class="avatar avatar--lg" src="${escAttr(av)}" alt="" width="84" height="84"/>`
    : `<span class="avatar avatar--lg avatar--mono" aria-hidden="true">${esc(monogram(ch.name))}</span>`;
  const statusLabel = ch.status === 'pending_review' ? 'pending review' : ch.status;
  const foundations = FOUNDATION_NAMES.map((name) => {
    const raw = ch.foundations?.[name] ?? 0;
    const eff = ch.foundationsEffective?.[name] ?? raw;
    return `<li class="found-row"><span class="found-row__name">${esc(name)}</span><span class="found-row__rating">${esc(roman(eff))}${eff !== raw ? ` <span class="found-row__raw">(${esc(roman(raw))})</span>` : ''}</span></li>`;
  }).join('');
  const skills =
    ch.skills.length === 0
      ? `<p class="empty">No skills recorded.</p>`
      : `<ul class="skill-list">${ch.skills
          .map(
            (s) =>
              `<li class="skill-row"><span class="skill-row__name">${esc(s.name)}</span><span class="skill-row__rating">${esc(roman(s.rating))}</span>${s.foundation ? `<span class="skill-row__found">${esc(s.foundation)}</span>` : ''}</li>`,
          )
          .join('')}</ul>`;
  const traits =
    ch.traits.length === 0
      ? `<p class="empty">No traits recorded.</p>`
      : `<ul class="trait-list">${ch.traits
          .map(
            (t) =>
              `<li class="trait-row"><span class="trait-row__name">${esc(t.name)}</span>${t.note ? `<span class="trait-row__note">${esc(t.note)}</span>` : ''}</li>`,
          )
          .join('')}</ul>`;
  const echoes = (ch.echoes ?? []).filter((e) => !e.resolved);
  const echoBlock =
    echoes.length === 0
      ? `<p class="empty">No living Echoes.</p>`
      : `<ul class="echo-list">${echoes
          .map(
            (e) =>
              `<li class="echo-card"><p class="echo-card__title">${esc(e.title)}</p><p class="echo-card__when">${esc(e.invokeWhen)}</p></li>`,
          )
          .join('')}</ul>`;
  const harm = Object.entries(ch.harm ?? {})
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `<span class="harm-chip">${esc(k)} · ${n}</span>`)
    .join('');
  return `<nav class="sheet-tabs" aria-label="Sheet sections">
    <a href="/characters/${escAttr(ch.slug)}/" aria-current="page">Core</a>
    <a href="/characters/${escAttr(ch.slug)}/echoes/">Echoes · Traits</a>
    <a href="/characters/${escAttr(ch.slug)}/inventory/">Inventory</a>
  </nav>
  <div class="sheet-stage sheet-stage--core">
    <div class="kod-plate sheet-identity">
      <div class="sheet-identity__portrait">${portrait}</div>
      <div>
        <h2 class="sheet-identity__name">${esc(ch.name)}</h2>
        ${ch.whoWeSee ? `<blockquote class="sheet-identity__see">${esc(ch.whoWeSee)}</blockquote>` : ''}
        <p class="sheet-identity__meta"><span class="char-card__status${ch.dying ? ' char-card__status--dying' : ''}">${esc(statusLabel)}${ch.dying ? ' · dying' : ''}</span>${ch.player?.displayName ? ` · ${esc(ch.player.displayName)}` : ''}</p>
      </div>
    </div>
    ${ch.communityTie ? `<p class="sheet-tie">${esc(ch.communityTie)}</p>` : ''}
    <section class="kod-plate" aria-labelledby="found-h">
      <h3 id="found-h">Foundations</h3>
      <ul class="found-list">${foundations}</ul>
    </section>
    <section class="kod-plate" aria-labelledby="sk-h">
      <h3 id="sk-h">Skills</h3>
      ${skills}
    </section>
    <section class="kod-plate" aria-labelledby="tr-h">
      <h3 id="tr-h">Traits</h3>
      ${traits}
    </section>
    <section class="kod-plate" aria-labelledby="ec-h">
      <h3 id="ec-h">Echoes</h3>
      ${echoBlock}
    </section>
    <section class="kod-plate" aria-labelledby="hm-h">
      <h3 id="hm-h">Harm</h3>
      ${harm || '<p class="empty">Unhurt.</p>'}
    </section>
  </div>`;
}

export function sheetEchoesInner(ch: CharacterRecord): string {
  const echoes = ch.echoes ?? [];
  const live = echoes.filter((e) => !e.resolved);
  const resolved = echoes.filter((e) => e.resolved);
  const card = (e: (typeof echoes)[number], faded: boolean) =>
    `<article class="kod-plate echo-card${faded ? ' echo-card--resolved' : ''}">
      <h3 class="echo-card__title">${esc(e.title)}</h3>
      <p class="echo-card__weight">Weight ${e.weight}</p>
      ${faded && e.resolved ? `<p class="echo-card__res">${esc(e.resolved.narrative)}</p>` : `<p class="echo-card__when">${esc(e.invokeWhen)}</p>`}
    </article>`;
  return `<nav class="sheet-tabs" aria-label="Sheet sections">
    <a href="/characters/${escAttr(ch.slug)}/">Core</a>
    <a href="/characters/${escAttr(ch.slug)}/echoes/" aria-current="page">Echoes · Traits</a>
    <a href="/characters/${escAttr(ch.slug)}/inventory/">Inventory</a>
  </nav>
  <div class="sheet-stage">
    <section aria-labelledby="ec-h"><h2 id="ec-h">Echoes</h2>${live.length ? live.map((e) => card(e, false)).join('') : '<p class="empty">No living Echoes.</p>'}</section>
    ${resolved.length ? `<section aria-labelledby="res-h"><h2 id="res-h">Resolved</h2>${resolved.map((e) => card(e, true)).join('')}</section>` : ''}
    <section aria-labelledby="tr-h"><h3 id="tr-h">Traits</h3>${
      ch.traits.length
        ? `<ul class="trait-list">${ch.traits.map((t) => `<li><strong>${esc(t.name)}</strong>${t.note ? ` — ${esc(t.note)}` : ''}</li>`).join('')}</ul>`
        : '<p class="empty">No traits recorded.</p>'
    }</section>
  </div>`;
}

export function sheetInventoryInner(ch: CharacterRecord): string {
  const items = ch.inventory?.items ?? [];
  return `<nav class="sheet-tabs" aria-label="Sheet sections">
    <a href="/characters/${escAttr(ch.slug)}/">Core</a>
    <a href="/characters/${escAttr(ch.slug)}/echoes/">Echoes · Traits</a>
    <a href="/characters/${escAttr(ch.slug)}/inventory/" aria-current="page">Inventory</a>
  </nav>
  <div class="sheet-stage">
    <section class="kod-plate" aria-labelledby="inv-h">
      <h2 id="inv-h">Inventory</h2>
      <p>Food ${ch.inventory?.foodDays ?? 0} days · Water ${ch.inventory?.waterDays ?? 0} days · Armour ${esc(ch.armour?.kind ?? 'none')}${ch.armour?.donned ? ' (donned)' : ''}</p>
      ${
        items.length
          ? `<ul>${items.map((i) => `<li>${esc(i.name)}${i.note ? ` — ${esc(i.note)}` : ''}</li>`).join('')}</ul>`
          : '<p class="empty">Nothing carried.</p>'
      }
    </section>
  </div>`;
}
