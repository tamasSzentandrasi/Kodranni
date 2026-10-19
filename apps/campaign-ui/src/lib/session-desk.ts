import {
  omenDieHtml,
  omenHeadHtml,
  sessionBetweenHtml,
  sessionReading,
  sessionSharedHtml,
  storytellerDie,
  tideBarHtml,
  tideHeadHtml,
  tideMarkerWords,
  type SessionDieFace,
  type SessionReading,
} from '@kodranni/hall-render';
import { TIDE_DYES, type AuditEvent, type CharacterRecord, type OpenTide, type TableState } from '@kodranni/store';

export interface SessionDiscordFields {
  guildId: string;
  channelId: string;
  roleId: string;
}

export interface SessionFluxerFields {
  guildId: string;
  channelId: string;
  roleId: string;
}

export interface SessionRestPerson {
  slug: string;
  name: string;
  kind: 'pc' | 'npc' | 'notable';
  foodDays: number;
  waterDays: number;
  exertion: number;
  exertionMax: number;
}

export interface SessionDeskModel {
  die: SessionDieFace[];
  whispers: { face: number; effect: string }[];
  pending: { slug: string; name: string; sentBy: string }[];
  pcs: SessionRestPerson[];
  npcs: SessionRestPerson[];
  groups: { id: string; name: string; members: string[] }[];
  tide: OpenTide | null;
  discord: SessionDiscordFields;
  fluxer: SessionFluxerFields;
  discordLive?: boolean;
  fluxerLive?: boolean;
  bound: { name: string; displayName: string }[];
}

const FOOTING_STOPS = ['severeA', 'slightA', 'equal', 'slightB', 'severeB'] as const;
const SIZE_CHIPS = [
  ['small', 'Small'],
  ['skirmish', 'Skirmish'],
  ['battle', 'Battle'],
] as const;

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function payloadSlug(event: AuditEvent): string {
  const payload = event.payload;
  if (!payload || typeof payload !== 'object') return '';
  const slug = (payload as { characterSlug?: unknown }).characterSlug;
  return typeof slug === 'string' ? slug : '';
}

export function restPerson(ch: CharacterRecord): SessionRestPerson {
  return {
    slug: ch.slug,
    name: ch.name,
    kind: ch.kind ?? 'pc',
    foodDays: ch.inventory.foodDays,
    waterDays: ch.inventory.waterDays,
    exertion: ch.exertion.current,
    exertionMax: ch.exertion.max,
  };
}

export function inboxSentBy(ch: {
  initiator?: { displayName?: string; accountId?: string };
}): string {
  return ch.initiator?.displayName || ch.initiator?.accountId || 'the table';
}

export function assembleSession(input: {
  desk: boolean;
  state: TableState;
  characters: CharacterRecord[];
  events: AuditEvent[];
  discord: SessionDiscordFields;
  fluxer: SessionFluxerFields;
  discordLive?: boolean;
  fluxerLive?: boolean;
}): { reading: SessionReading; desk: SessionDeskModel | null } {
  const reading = sessionReading(input.state);
  if (!input.desk) return { reading, desk: null };
  const order = new Map<string, number>();
  input.events.forEach((event, index) => {
    const slug = payloadSlug(event);
    if (slug && !order.has(slug)) order.set(slug, index);
  });
  const pending = input.characters
    .filter((ch) => ch.status === 'pending_review')
    .sort((a, b) => {
      const ai = order.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
      const bi = order.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    })
    .map((ch) => ({
      slug: ch.slug,
      name: ch.name,
      sentBy: inboxSentBy(ch),
    }));
  const active = input.characters
    .filter((ch) => ch.status === 'active')
    .map(restPerson)
    .sort((a, b) => a.name.localeCompare(b.name));
  const bound = input.characters
    .filter((ch) => ch.status === 'active' && ch.player?.accountId)
    .map((ch) => ({
      name: ch.name,
      displayName: ch.player?.displayName ?? '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    reading,
    desk: {
      die: storytellerDie(input.state),
      whispers: input.state.whispers.map((row) => ({ face: row.face, effect: row.effect })),
      pending,
      pcs: active.filter((person) => person.kind === 'pc'),
      npcs: active.filter((person) => person.kind !== 'pc'),
      groups: input.state.restGroups.map((group) => ({
        id: group.id,
        name: group.name,
        members: [...group.members],
      })),
      tide: input.state.tide,
      discord: input.discord,
      fluxer: input.fluxer,
      discordLive: input.discordLive === true,
      fluxerLive: input.fluxerLive === true,
      bound,
    },
  };
}

function stepper(kind: 'food' | 'water', value: number, name: string): string {
  const label = kind === 'food' ? 'Food' : 'Water';
  return `<span class="rest-supply rest-supply--${kind}">
    <span class="rest-supply__label">${label}</span>
    <span class="stepper">
      <button type="button" data-step="-1" data-supply="${kind}" aria-label="Less ${label.toLowerCase()} for ${esc(name)}">‹</button>
      <span class="stepper__n" data-supply-value="${kind}">${esc(value)}</span>
      <button type="button" data-step="1" data-supply="${kind}" aria-label="More ${label.toLowerCase()} for ${esc(name)}">›</button>
    </span>
  </span>`;
}

function exertionStepper(person: SessionRestPerson): string {
  return `<div class="rest-exertion">
    <span class="rest-exertion__k">Exertion</span>
    <span class="stepper">
      <button type="button" data-step="-1" data-exertion aria-label="Less exertion for ${esc(person.name)}">‹</button>
      <b class="stepper__n" data-exertion-read>${esc(person.exertion)} / ${esc(person.exertionMax)}</b>
      <button type="button" data-step="1" data-exertion aria-label="More exertion for ${esc(person.name)}">›</button>
    </span>
  </div>`;
}

/** Arrows only. Members do not share one number. */
function groupExertion(): string {
  return `<span class="rest-nudge">
    <button type="button" data-group-exertion="-1" aria-label="Lower exertion for everyone here">‹</button>
    <span class="rest-nudge__k">Exertion</span>
    <button type="button" data-group-exertion="1" aria-label="Raise exertion for everyone here">›</button>
  </span>`;
}

function restoreMarkSvg(): string {
  return `<svg class="session-glyph__svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path d="M7.6 8.2h9.4c1 4.4.2 7.6-2.3 9.4h-4.8C7.4 15.8 6.6 12.6 7.6 8.2Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M12.3 17.6v4.4M9.6 22h5.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M21.2 9.4c.4 2.6 1.5 4.4 3.2 5.3 1.5.8 2.8.5 3.6-.6" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
    <path d="M22.5 7c.7 1.3.7 2.4 0 3.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
}

function personRow(person: SessionRestPerson, inGroup: boolean): string {
  const out = inGroup
    ? `<button type="button" class="rest-out" data-rest-out aria-label="Remove ${esc(person.name)} from this group">×</button>`
    : '';
  return `<article class="rest-soul" data-rest-person data-slug="${esc(person.slug)}" data-kind="${esc(person.kind)}" data-name="${esc(person.name)}" data-max="${esc(person.exertionMax)}">
    <h3 class="rest-soul__name"><a href="/characters/${esc(person.slug)}/">${esc(person.name)}</a></h3>
    ${exertionStepper(person)}
    <div class="rest-soul__wells">
      ${stepper('food', person.foodDays, person.name)}
      ${stepper('water', person.waterDays, person.name)}
    </div>
    ${out}
  </article>`;
}

function restButtons(): string {
  return `<button type="button" class="session-quiet" data-rest-kind="short">Short rest +0</button>
    <button type="button" class="session-quiet" data-rest-kind="long">Long rest +1</button>
    <label class="rest-ample"><input type="checkbox" data-ample="food"> Ample food</label>
    <label class="rest-ample"><input type="checkbox" data-ample="water"> Ample water</label>`;
}

function addSelect(): string {
  return `<label class="rest-add">Add <select class="rest-add__pick" data-rest-add aria-label="Add someone to this group"><option value="">Someone</option></select></label>`;
}

function sceneBoard(model: SessionDeskModel): string {
  const items = model.whispers
    .map((row) => `<li>Face ${esc(row.face)}. ${esc(row.effect)}</li>`)
    .join('');
  const whispers = `<div class="omen-whispers" data-omen-whispers${items ? '' : ' hidden'}>
    <div class="omen-whispers__bar"><span>Whispers</span><button type="button" class="session-quiet" data-whisper-clear>Clear</button></div>
    <ul data-whisper-list>${items}</ul>
  </div>`;
  const lectern = `<div class="omen-lectern" data-omen-lectern>
    <p class="omen-lectern__idle">Choose a face.</p>
    <div class="omen-lectern__work" hidden>
      <span class="omen-lectern__n" data-omen-n></span>
      <textarea class="kod-ink" data-omen-line rows="2" maxlength="240" aria-label="Omen line"></textarea>
      <div class="omen-pop__row">
        <span class="omen-tones" role="radiogroup" aria-label="Tone">
          <button type="button" data-tone-pick="positive" aria-label="Positive"></button>
          <button type="button" data-tone-pick="negative" aria-label="Negative"></button>
          <button type="button" data-tone-pick="mixed" aria-label="Mixed"></button>
        </span>
        <label class="omen-whisper"><input type="checkbox" data-omen-whisper> Whisper</label>
      </div>
    </div>
  </div>`;
  return `<section class="kod-plate session-board" data-session-board>
    ${omenHeadHtml()}
    <div class="omen-stage"><div data-session-scene>${omenDieHtml(model.die, { edit: true })}</div></div>
    ${lectern}
    ${whispers}
    <p class="omen-post"><button type="button" class="session-quiet" data-omen-post>Post the omens</button> <span data-omen-post-note></span></p>
  </section>`;
}

function inbox(pending: SessionDeskModel['pending']): string {
  const count = pending.length;
  const badge = `<span class="session-count" data-inbox-count${count ? '' : ' hidden'}>${count ? esc(count) : ''}</span>`;
  const body =
    count === 0
      ? '<p data-inbox-empty>No one is waiting.</p>'
      : `<div class="inbox-cards">${pending
          .map(
            (row) => `<article class="inbox-card" data-inbox-row data-slug="${esc(row.slug)}">
              <h3>${esc(row.name)}</h3>
              <p class="inbox-card__from">Sent by ${esc(row.sentBy)}</p>
              <p class="inbox-card__actions">
                <a href="/characters/${esc(row.slug)}/">Open</a>
                <button type="button" class="session-quiet" data-review="approve">Approve</button>
                <button type="button" class="session-quiet" data-review="request_changes">Send back</button>
              </p>
            </article>`,
          )
          .join('')}</div>`;
  return `<div class="kod-rail kod-rail--right session-approvals">
    <div class="kod-slide" data-slide="approvals" data-open="false">
      <button type="button" class="kod-slide__tab" data-slide-toggle="approvals" aria-controls="kod-slide-approvals" aria-expanded="false" aria-label="Approvals">
        <span class="kod-slide__skin" aria-hidden="true">
          <span class="kod-slide__cap kod-slide__cap--top"></span>
          <span class="kod-slide__mid"></span>
          <span class="kod-slide__cap kod-slide__cap--bot"></span>
          <span class="kod-slide__chev"></span>
        </span>
        <span class="kod-slide__word">Approvals</span>
        ${badge}
      </button>
      <div class="kod-slide__panel" id="kod-slide-approvals" data-session-inbox>
        <span class="kod-slide__rail kod-slide__rail--top" aria-hidden="true"></span>
        <span class="kod-slide__rail kod-slide__rail--bot" aria-hidden="true"></span>
        <div data-inbox-body>${body}</div>
      </div>
    </div>
  </div>`;
}

function restore(model: SessionDeskModel): string {
  const grouped = new Set(model.groups.flatMap((group) => group.members));
  const bySlug = new Map(
    [...model.pcs, ...model.npcs].map((person) => [person.slug, person]),
  );
  const tableRows = model.pcs
    .filter((person) => !grouped.has(person.slug))
    .map((person) => personRow(person, false))
    .join('');
  const groups = model.groups
    .map((group) => {
      const rows = group.members
        .map((slug) => bySlug.get(slug))
        .filter((person): person is SessionRestPerson => Boolean(person))
        .map((person) => personRow(person, true))
        .join('');
      return `<section class="rest-company" data-rest-band data-rest-group data-group-id="${esc(group.id)}">
        <header class="rest-company__bar">
          <input class="rest-band__name" data-group-name value="${esc(group.name)}" maxlength="40" aria-label="Group name">
          ${groupExertion()}
          ${restButtons()}
          <button type="button" class="rest-out" data-group-dissolve aria-label="Dissolve ${esc(group.name)}">×</button>
        </header>
        <div class="rest-company__people" data-rest-people>${rows}</div>
        ${addSelect()}
      </section>`;
    })
    .join('');
  const pool = model.npcs
    .filter((person) => !grouped.has(person.slug))
    .map((person) => personRow(person, false))
    .join('');
  return `<section class="kod-plate" data-session-restore>
    <h2 class="session-head"><span class="session-glyph" aria-hidden="true">${restoreMarkSvg()}</span> Restore &amp; Restock</h2>
    <section class="rest-company" data-rest-band="players">
      <header class="rest-company__bar">
        <span class="rest-band__title">Players</span>
        ${groupExertion()}
        ${restButtons()}
      </header>
      <div class="rest-company__people" data-rest-people>${tableRows}</div>
    </section>
    <div data-rest-groups>${groups}</div>
    <p class="rest-new"><button type="button" class="session-quiet" data-group-new>New group</button></p>
    <div hidden data-npc-pool>${pool}</div>
  </section>`;
}

function footingWords(footing: OpenTide['footing'], sideA: string, sideB: string): string {
  if (footing === 'equal') return 'Equal footing';
  if (footing === 'slightA') return `${sideA || 'Side A'} at a slight disadvantage`;
  if (footing === 'slightB') return `${sideB || 'Side B'} at a slight disadvantage`;
  if (footing === 'severeA') return `${sideA || 'Side A'} at a severe disadvantage`;
  if (footing === 'severeB') return `${sideB || 'Side B'} at a severe disadvantage`;
  return 'Equal footing';
}

function tideStudio(tide: OpenTide | null): string {
  const locked = Boolean(tide);
  const size = tide?.size ?? 'skirmish';
  const footing = tide?.footing ?? 'equal';
  const dyeA = tide?.dyeA ?? TIDE_DYES[0]!.hex;
  const dyeB = tide?.dyeB ?? TIDE_DYES[8]!.hex;
  const sideA = tide?.sideA ?? '';
  const sideB = tide?.sideB ?? '';
  const position = tide?.position ?? 8;
  const length = tide?.length ?? 15;
  const stop = Math.max(0, FOOTING_STOPS.indexOf(footing));
  const bar = tideBarHtml({
    sideA: sideA || 'Side A',
    sideB: sideB || 'Side B',
    position,
    length,
    dyeA,
    dyeB,
    marker: tideMarkerWords({
      sideA: sideA || 'Side A',
      sideB: sideB || 'Side B',
      position,
      length,
    }),
  });
  const dyes = (side: 'a' | 'b', selected: string) =>
    TIDE_DYES.map((dye) => {
      const pressed = dye.hex.toLowerCase() === selected.toLowerCase();
      return `<button type="button" class="tide-dye" data-tide-dye="${side}" data-hex="${esc(dye.hex)}" style="background:${esc(dye.hex)}" aria-label="${esc(dye.name)}" aria-pressed="${pressed ? 'true' : 'false'}"${locked ? ' disabled' : ''}></button>`;
    }).join('');
  const marks = size === 'small' ? '1 mark a step' : size === 'battle' ? '3 marks a step' : '2 marks a step';
  const sizes = SIZE_CHIPS.map(
    ([value, label]) =>
      `<button type="button" class="session-quiet" data-tide-size="${value}" aria-pressed="${value === size ? 'true' : 'false'}"${locked ? ' disabled' : ''}>${label}</button>`,
  ).join('');
  const open = locked
    ? '<button type="button" class="session-quiet" data-tide-close>Close the Tide</button><p class="tide-studio__note" data-tide-rule>One Tide at a time. Close it to post the next.</p>'
    : '<button type="button" class="session-quiet" data-tide-open disabled>Post the Tide</button>';
  return `<section class="kod-plate tide-studio" data-session-tide-open style="--tide-a: ${esc(dyeA)}; --tide-b: ${esc(dyeB)}"${locked ? ' data-tide-locked="1"' : ''}>
    ${tideHeadHtml()}
    <div class="tide-studio__sides">
      <div class="tide-side">
        <input class="kod-ink" data-tide-a maxlength="32" value="${esc(sideA)}" placeholder="Side A" aria-label="First side"${locked ? ' readonly' : ''}>
        <div class="tide-dyes" data-tide-dyes="a">${dyes('a', dyeA)}</div>
      </div>
      <div class="tide-side tide-side--b">
        <input class="kod-ink" data-tide-b maxlength="32" value="${esc(sideB)}" placeholder="Side B" aria-label="Second side"${locked ? ' readonly' : ''}>
        <div class="tide-dyes" data-tide-dyes="b">${dyes('b', dyeB)}</div>
      </div>
    </div>
    <div data-tide-preview>${bar}</div>
    <div class="tide-studio__foot">
      <div class="tide-sizes" role="radiogroup" aria-label="Size">${sizes}<span class="tide-scale" data-tide-scale>${marks}</span></div>
      <label class="tide-range">
        <span data-tide-footing-label>${esc(footingWords(footing, sideA, sideB))}</span>
        <input type="range" min="0" max="4" step="1" value="${esc(stop)}" data-tide-footing aria-label="Footing"${locked ? ' disabled' : ''}>
      </label>
    </div>
    <div class="tide-studio__actions">${open}</div>
  </section>`;
}

function chatCategory(opts: {
  heading: string;
  platform: 'discord' | 'fluxer';
  attrs: string;
  guildAttr: string;
  channelAttr: string;
  roleAttr: string;
  guildLabel: string;
  channelLabel: string;
  roleLabel: string;
  fields: SessionDiscordFields;
  live: boolean;
}): string {
  const fields = opts.fields;
  const kept = opts.platform === 'fluxer' && !opts.live;
  const op = opts.live ? 'end' : 'live';
  const verb = opts.live ? 'Turn off' : 'Go live';
  const control = kept
    ? 'Fluxer waits for the same controls.'
    : `<button type="button" class="session-quiet" data-chat-platform="${opts.platform}" data-chat-op="${op}">${verb}</button>`;
  return `<section class="session-chat" ${opts.attrs}>
    <h3>${opts.heading}</h3>
    <div class="session-menu__grid">
      <label>Guild <input class="kod-ink" ${opts.guildAttr} value="${esc(fields.guildId)}" inputmode="numeric" autocomplete="off" aria-label="${opts.guildLabel}"></label>
      <label>Play channel <input class="kod-ink" ${opts.channelAttr} value="${esc(fields.channelId)}" inputmode="numeric" autocomplete="off" aria-label="${opts.channelLabel}"></label>
      <label>Storyteller role <input class="kod-ink" ${opts.roleAttr} value="${esc(fields.roleId)}" inputmode="numeric" autocomplete="off" aria-label="${opts.roleLabel}"></label>
    </div>
    <p class="session-menu__meta session-chat__live">
      <span data-chat-state="${opts.platform}">${kept ? 'Kept' : opts.live ? 'Bound' : 'Off'}</span>
      ${control}
    </p>
  </section>`;
}

function chat(model: SessionDeskModel): string {
  const bound =
    model.bound.length === 0
      ? '<p>No one is bound yet.</p>'
      : `<ul>${model.bound
          .map(
            (row) =>
              `<li>${esc(row.name)}${row.displayName ? ` — ${esc(row.displayName)}` : ''}</li>`,
          )
          .join('')}</ul>`;
  return `<details class="session-menu" data-session-chat>
    <summary>Table chat</summary>
    <div class="session-menu__body">
      ${chatCategory({
        heading: 'Discord',
        platform: 'discord',
        attrs: 'data-session-discord',
        guildAttr: 'data-discord-guild',
        channelAttr: 'data-discord-channel',
        roleAttr: 'data-discord-role',
        guildLabel: 'Discord guild',
        channelLabel: 'Discord play channel',
        roleLabel: 'Discord Storyteller role',
        fields: model.discord,
        live: model.discordLive === true,
      })}
      ${chatCategory({
        heading: 'Fluxer',
        platform: 'fluxer',
        attrs: 'data-session-fluxer',
        guildAttr: 'data-fluxer-guild',
        channelAttr: 'data-fluxer-channel',
        roleAttr: 'data-fluxer-role',
        guildLabel: 'Fluxer guild',
        channelLabel: 'Fluxer play channel',
        roleLabel: 'Fluxer Storyteller role',
        fields: model.fluxer,
        live: model.fluxerLive === true,
      })}
      <p class="session-menu__meta">
        <span class="session-info" tabindex="0">Characters
          <span class="session-info__tip" role="tooltip">${bound}</span>
        </span>
      </p>
    </div>
  </details>`;
}

/** Storyteller half. Loopback only. The die is both the view and the editor. */
export function sessionDeskHtml(model: SessionDeskModel): string {
  return [
    sceneBoard(model),
    inbox(model.pending),
    restore(model),
    tideStudio(model.tide),
    chat(model),
    '<p class="desk-note" data-session-note hidden></p>',
  ].join('');
}

/** Public name plus whether the night is open. The Session tab shows this on the desk. */
export function sessionNightLine(publicUrl: string, live: boolean): string {
  return live ? `${publicUrl} is live.` : `${publicUrl} is between sessions.`;
}

export function sessionPageHtml(opts: {
  between: boolean;
  reading: SessionReading;
  desk: SessionDeskModel | null;
}): string {
  if (opts.between) return sessionBetweenHtml();
  if (!opts.desk) return sessionSharedHtml(opts.reading);
  return sessionDeskHtml(opts.desk);
}
