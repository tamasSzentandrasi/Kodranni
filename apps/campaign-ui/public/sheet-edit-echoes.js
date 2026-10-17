(function () {
  const panel = document.getElementById('echoes-panel');
  if (!panel || panel.getAttribute('data-can-edit') !== '1') return;
  const slug = panel.getAttribute('data-slug');
  if (!slug) return;
  const list = panel.querySelector('[data-echo-list]');
  const traitList = document.querySelector('[data-trait-list]');
  const BAND = { 1: 'Individual', 2: 'Group', 3: 'Pivotal' };
  let roster = [];
  try {
    const raw = document.getElementById('echo-roster');
    roster = raw ? JSON.parse(raw.textContent || '[]') : [];
    if (!Array.isArray(roster)) roster = [];
  } catch {
    roster = [];
  }

  function clearRemoveAsk() {
    document.querySelectorAll('#echoes-panel [data-confirm="1"], #traits-panel [data-confirm="1"]').forEach((btn) => {
      btn.removeAttribute('data-confirm');
      const idle = btn.getAttribute('data-idle');
      if (idle) btn.textContent = idle;
    });
  }

  function armRemove(btn) {
    clearRemoveAsk();
    if (!btn.getAttribute('data-idle')) btn.setAttribute('data-idle', (btn.textContent || '').trim());
    btn.setAttribute('data-confirm', '1');
    btn.textContent = 'Remove?';
  }

  function tokenHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const m = document.cookie.match(/(?:^|;\s*)kod_edit=([^;]+)/);
    if (m) headers.Authorization = 'Bearer ' + decodeURIComponent(m[1]);
    return headers;
  }

  function paintWeight(el, w) {
    el.setAttribute('data-weight', String(w));
    const segs = el.querySelectorAll('.weight-segs i');
    segs.forEach((i, idx) => i.classList.toggle('on', idx < w));
    const band = el.querySelector('.weight-band');
    if (band) band.textContent = BAND[w] || String(w);
    const art = el.closest('[data-echo-idx]');
    const circle = art && art.querySelector('[data-echo-circle]');
    const all = art && art.querySelector('[data-echo-all]');
    if (circle) circle.hidden = w !== 2;
    if (all) all.hidden = w !== 3;
    const fortune = art && art.querySelector('[data-echo-fortune-pick]');
    if (fortune) fortune.hidden = w !== 3;
    if (art) refreshPicks(art);
  }

  function groupKey(name, slug) {
    return (slug || name || '').trim().toLowerCase();
  }

  function takenKeys(art) {
    const keys = new Set();
    art.querySelectorAll('[data-echo-group] li').forEach((li) => {
      const slug = li.getAttribute('data-slug') || '';
      const nameEl = li.querySelector('[data-echo-group-name]');
      const name =
        nameEl && 'value' in nameEl
          ? String(nameEl.value).trim()
          : (nameEl && nameEl.textContent ? nameEl.textContent.trim() : '');
      if (slug) keys.add(groupKey('', slug));
      if (name) keys.add(groupKey(name, ''));
    });
    return keys;
  }

  function fillPick(select, art) {
    if (!(select instanceof HTMLSelectElement)) return;
    const taken = takenKeys(art);
    const keep = select.value;
    select.replaceChildren();
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Choose…';
    select.appendChild(blank);
    roster.forEach((row) => {
      const name = String(row.name || '').trim();
      if (!name) return;
      const slug = row.slug ? String(row.slug) : '';
      const opt = document.createElement('option');
      opt.value = slug ? 'slug:' + slug : 'name:' + name;
      opt.textContent = name;
      if (taken.has(groupKey(name, slug)) || taken.has(groupKey(name, '')) || (slug && taken.has(groupKey('', slug)))) {
        opt.disabled = true;
      }
      select.appendChild(opt);
    });
    if ([...select.options].some((o) => o.value === keep && !o.disabled)) select.value = keep;
    else select.value = '';
  }

  function refreshPicks(art) {
    const select = art.querySelector('[data-echo-group-pick]');
    if (select) fillPick(select, art);
  }

  function readGroupName(el) {
    if (!el) return '';
    if ('value' in el) return String(el.value).trim();
    return (el.textContent || '').trim();
  }

  function addGroupRow(list, name, slug) {
    const li = document.createElement('li');
    if (slug) li.setAttribute('data-slug', slug);
    const span = document.createElement('span');
    span.setAttribute('data-echo-group-name', '');
    span.textContent = name;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-echo-group-remove', '');
    btn.textContent = 'Remove';
    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  }

  function storedResolved() {
    try {
      const raw = document.getElementById('echo-resolved');
      const parsed = raw ? JSON.parse(raw.textContent || '[]') : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function readEchoes() {
    const active = Array.from(panel.querySelectorAll('[data-echo-idx], [data-echo-new]'))
      .map((art) => {
      const w = Number(art.querySelector('[data-echo-weight]')?.getAttribute('data-weight') || 1);
      const titleRaw = art.querySelector('[data-echo-title]')?.value?.trim() || '';
      if (art.hasAttribute('data-echo-new') && !titleRaw) return null;
      const title = titleRaw || 'Echo';
      const invokeWhen =
        art.querySelector('[data-echo-invoke]')?.value?.trim() ||
        'When the table agrees the scene matches.';
      const group = Array.from(art.querySelectorAll('[data-echo-group] li'))
        .map((li) => {
          const name = readGroupName(li.querySelector('[data-echo-group-name]'));
          if (!name) return null;
          const slug = li.getAttribute('data-slug') || undefined;
          return slug ? { name, characterSlug: slug } : { name };
        })
        .filter(Boolean);
      return {
        title,
        weight: Math.min(3, Math.max(1, w)),
        invokeWhen,
        group: w === 2 ? group : [],
        groupLabel: w === 2 ? 'Who shares this' : undefined,
      };
    })
      .filter(Boolean);
    const titles = new Set(active.map((e) => e.title));
    const prior = storedResolved().filter((e) => e && e.title && !titles.has(e.title));
    return active.concat(prior);
  }

  let traitSeed = [];
  try {
    const raw = document.getElementById('trait-seed');
    traitSeed = raw ? JSON.parse(raw.textContent || '[]') : [];
    if (!Array.isArray(traitSeed)) traitSeed = [];
  } catch {
    traitSeed = [];
  }
  let traitsDirty = false;

  function restoreTraitSeed() {
    if (!traitList) return;
    const rows = traitList.querySelectorAll('[data-trait-idx]');
    traitSeed.forEach((trait, i) => {
      const li = rows[i];
      if (!li || !trait || !trait.name) return;
      const nameEl = li.querySelector('[data-trait-name]');
      const noteEl = li.querySelector('[data-trait-note]');
      if (nameEl instanceof HTMLInputElement && !nameEl.value) nameEl.value = trait.name;
      if (noteEl instanceof HTMLInputElement && trait.note && !noteEl.value) noteEl.value = trait.note;
    });
  }
  restoreTraitSeed();

  function readTraits() {
    if (!traitList) return [];
    const rows = Array.from(traitList.querySelectorAll('[data-trait-idx]'))
      .map((li) => {
        const name = li.querySelector('[data-trait-name]')?.value?.trim();
        if (!name) return null;
        const note = li.querySelector('[data-trait-note]')?.value?.trim();
        return { name, note: note || undefined };
      })
      .filter(Boolean);
    const fresh = traitList.querySelector('[data-trait-new] [data-trait-name]')?.value?.trim();
    if (fresh) {
      const note = traitList.querySelector('[data-trait-new] [data-trait-note]')?.value?.trim();
      rows.push({ name: fresh, note: note || undefined });
    }
    return rows;
  }

  const desk = panel.getAttribute('data-desk') === '1';

  function addEchoCard(weight, title, invoke) {
    if (!list) return;
    const empty = list.querySelector('.empty');
    if (empty) empty.remove();
    const idx = list.querySelectorAll('[data-echo-idx]').length;
    const art = document.createElement('article');
    art.className = 'kod-plate echo';
    art.setAttribute('data-echo-idx', String(idx));
    const segs = desk
      ? '<i class="on" data-seg="1"></i><i data-seg="2"></i><i data-seg="3"></i>'
      : '<i class="on"></i><i></i><i></i>';
    const tip = desk ? 'Click a segment to set 1, 2, or 3' : 'Left-click +1 · right-click −1 (1–3)';
    const resolve = desk
      ? '<div class="echo__resolve" data-echo-resolve><label>Resolution<textarea class="kod-ink" data-echo-resolution rows="2"></textarea></label>' +
        '<p data-echo-fortune-pick hidden><label>Fortune<select data-echo-fortune><option value="vitality">Vitality</option><option value="cohesion">Cohesion</option><option value="surplus">Surplus</option><option value="standing">Standing</option><option value="tradition">Tradition</option></select></label>' +
        '<label>State<select data-echo-fortune-level><option value="0">Crisis</option><option value="1">Strained</option><option value="2" selected>Steady</option><option value="3">Abundance</option></select></label></p>' +
        '<button type="button" data-echo-resolve-go>Resolve</button></div>'
      : '';
    art.innerHTML =
      '<div class="echo__weight echo__weight--edit" data-echo-weight data-weight="' +
      weight +
      '" tabindex="0" data-tip="' +
      tip +
      '">' +
      '<span class="weight-segs" aria-label="Weight ' +
      weight +
      '">' +
      segs +
      '</span>' +
      '<span class="weight-band">' +
      (BAND[weight] || weight) +
      '</span></div>' +
      '<div class="echo__body">' +
      '<input class="echo__title-input kod-ink" data-echo-title placeholder="Echo title…" />' +
      '<label class="echo__invoke-edit"><span class="echo__invoke-lab">Invoke when</span>' +
      '<textarea class="kod-ink" data-echo-invoke rows="2" placeholder="When the table agrees the scene matches…"></textarea></label>' +
      '<div class="echo__circle" data-echo-circle hidden>' +
      '<p class="echo__circle-lab">Who shares this</p>' +
      '<ul class="echo__people" data-echo-group></ul>' +
      '<label class="echo__pick"><span class="echo__pick-lab">Add a character</span>' +
      '<select class="kod-ink" data-echo-group-pick><option value="">Choose…</option></select></label></div>' +
      '<p class="echo__circle-all" data-echo-all hidden>The whole community.</p>' +
      '<button type="button" class="echo__remove" data-echo-remove>Remove</button>' +
      resolve +
      '</div>';
    const titleEl = art.querySelector('[data-echo-title]');
    const invokeEl = art.querySelector('[data-echo-invoke]');
    if (titleEl) titleEl.value = title || '';
    if (invokeEl) invokeEl.value = invoke || '';
    const fresh = panel.querySelector('[data-echo-new]');
    if (fresh) list.insertBefore(art, fresh);
    else list.appendChild(art);
    paintWeight(art.querySelector('[data-echo-weight]'), weight);
  }

  function promoteNewEcho() {
    const fresh = panel.querySelector('[data-echo-new]');
    if (!fresh || fresh.contains(document.activeElement)) return;
    const titleEl = fresh.querySelector('[data-echo-title]');
    const invokeEl = fresh.querySelector('[data-echo-invoke]');
    const title = titleEl && 'value' in titleEl ? String(titleEl.value).trim() : '';
    if (!title) return;
    const invoke = invokeEl && 'value' in invokeEl ? String(invokeEl.value) : '';
    if (titleEl) titleEl.value = '';
    if (invokeEl) invokeEl.value = '';
    addEchoCard(1, title, invoke);
  }

  function promoteNewTrait() {
    if (!traitList) return;
    const fresh = traitList.querySelector('[data-trait-new]');
    if (!fresh || fresh.contains(document.activeElement)) return;
    const nameEl = fresh.querySelector('[data-trait-name]');
    const noteEl = fresh.querySelector('[data-trait-note]');
    const name = nameEl && 'value' in nameEl ? String(nameEl.value).trim() : '';
    if (!name) return;
    const note = noteEl && 'value' in noteEl ? String(noteEl.value) : '';
    if (nameEl) nameEl.value = '';
    if (noteEl) noteEl.value = '';
    const li = document.createElement('li');
    li.className = 'kod-plate trait';
    li.setAttribute('data-trait-idx', String(traitList.querySelectorAll('[data-trait-idx]').length));
    li.innerHTML =
      '<div class="trait__edit"><input class="kod-ink" data-trait-name placeholder="Trait name" autocomplete="off" />' +
      '<input class="kod-ink" data-trait-note placeholder="Note" autocomplete="off" />' +
      '<button type="button" class="desk-mark" data-trait-remove aria-label="Remove" data-tip="Remove">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
      '<path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.4"/></svg></button></div>';
    const named = li.querySelector('[data-trait-name]');
    const noted = li.querySelector('[data-trait-note]');
    if (named) named.value = name;
    if (noted) noted.value = note;
    traitList.insertBefore(li, fresh);
  }

  panel.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-echo-add]')) {
      addEchoCard(1, '', '');
      saveSoon();
      return;
    }
    const echoRemove = t.closest('[data-echo-remove]');
    if (echoRemove) {
      if (echoRemove.getAttribute('data-confirm') !== '1') {
        armRemove(echoRemove);
        return;
      }
      echoRemove.closest('[data-echo-idx]')?.remove();
      saveSoon();
      return;
    }
    const seg = t.closest('[data-seg]');
    if (panel.getAttribute('data-desk') === '1' && seg) {
      const wEl = seg.closest('[data-echo-weight]');
      if (wEl) paintWeight(wEl, Number(seg.getAttribute('data-seg')));
      saveSoon();
      return;
    }
    if (t.closest('[data-echo-resolve-go]')) {
      resolveEcho(t.closest('[data-echo-idx]'));
      return;
    }
    const reopen = t.closest('[data-desk-reopen]');
    if (reopen) {
      deskOp({ op: 'reopen', slug, title: reopen.getAttribute('data-title') });
      return;
    }
    if (t.closest('[data-echo-group-remove]')) {
      const art = t.closest('[data-echo-idx]');
      t.closest('li')?.remove();
      if (art) refreshPicks(art);
      saveSoon();
      return;
    }
    const wEl = t.closest('[data-echo-weight]');
    if (panel.getAttribute('data-desk') === '1') return;
    if (wEl instanceof HTMLElement && wEl.classList.contains('echo__weight--edit')) {
      const cur = Number(wEl.getAttribute('data-weight') || 1);
      paintWeight(wEl, Math.min(3, cur + 1));
      saveSoon();
    }
  });

  panel.addEventListener('contextmenu', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const wEl = t.closest('[data-echo-weight]');
    if (panel.getAttribute('data-desk') === '1' && wEl) {
      ev.preventDefault();
      return;
    }
    if (wEl instanceof HTMLElement && wEl.classList.contains('echo__weight--edit')) {
      ev.preventDefault();
      const cur = Number(wEl.getAttribute('data-weight') || 1);
      paintWeight(wEl, Math.max(1, cur - 1));
      saveSoon();
    }
  });

  document.querySelector('[data-trait-add]')?.addEventListener('click', () => {
    if (!traitList) return;
    traitsDirty = true;
    const empty = traitList.querySelector('.empty');
    if (empty) empty.remove();
    const idx = traitList.querySelectorAll('[data-trait-idx]').length;
    const li = document.createElement('li');
    li.className = 'kod-plate trait';
    li.setAttribute('data-trait-idx', String(idx));
    li.innerHTML =
      '<div class="trait__edit">' +
      '<input class="kod-ink" data-trait-name value="" placeholder="Trait name…" autocomplete="off" />' +
      '<input class="kod-ink" data-trait-note value="" placeholder="Optional note" autocomplete="off" />' +
      '<button type="button" data-trait-remove>Remove</button></div>';
    traitList.appendChild(li);
    saveSoon();
  });

  document.querySelector('#traits-panel')?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const traitRemove = t.closest('[data-trait-remove]');
    if (traitRemove) {
      if (traitRemove.getAttribute('data-confirm') !== '1') {
        armRemove(traitRemove);
        return;
      }
      traitRemove.closest('[data-trait-idx]')?.remove();
      traitsDirty = true;
      saveSoon();
      return;
    }
    clearRemoveAsk();
  });

  document.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t instanceof Element && t.closest('#echoes-panel [data-confirm="1"], #traits-panel [data-confirm="1"]')) return;
    clearRemoveAsk();
  });

  let saveTimer = 0;
  let saveChain = Promise.resolve();
  function saveSoon() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveNow, 550);
  }

  function saveNow() {
    const run = saveChain.then(commitEchoes);
    saveChain = run.then(
      () => {},
      () => {},
    );
    return run;
  }

  async function commitEchoes() {
    const msg = document.querySelector('[data-echoes-msg]');
    const res = await fetch('/api/character/' + encodeURIComponent(slug), {
      method: 'POST',
      headers: tokenHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'st-edit',
        patch: traitsDirty
          ? { echoes: readEchoes(), traits: readTraits() }
          : { echoes: readEchoes() },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (msg && !res.ok) {
      msg.hidden = false;
      msg.textContent = data.error || 'Failed';
      msg.className = 'draft-msg draft-msg--err';
    }
    if (res.ok && panel.getAttribute('data-desk') === '1') {
      promoteNewEcho();
      promoteNewTrait();
    }
    return res.ok;
  }

  async function deskOp(body) {
    const res = await fetch('/api/desk/edit', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = document.querySelector('[data-echoes-msg]');
      if (msg) {
        msg.hidden = false;
        msg.textContent = data.error || 'Failed';
        msg.className = 'draft-msg draft-msg--err';
      }
      return;
    }
    location.reload();
  }

  async function resolveEcho(art) {
    if (!art) return;
    const narrative = art.querySelector('[data-echo-resolution]')?.value?.trim();
    if (!narrative) return;
    const title = art.querySelector('[data-echo-title]')?.value?.trim() || 'Echo';
    const weight = Number(art.querySelector('[data-echo-weight]')?.getAttribute('data-weight') || 1);
    const echoes = readEchoes().map((echo) =>
      echo.title === title
        ? { ...echo, resolved: { at: new Date().toISOString(), narrative } }
        : echo,
    );
    const body = {
      action: 'st-edit',
      patch: traitsDirty ? { echoes, traits: readTraits() } : { echoes },
    };
    if (weight === 3) {
      const key = art.querySelector('[data-echo-fortune]')?.value || 'vitality';
      const level = Number(art.querySelector('[data-echo-fortune-level]')?.value || 2);
      body.pivotalFortune = { key, level };
    }
    const res = await fetch('/api/character/' + encodeURIComponent(slug), {
      method: 'POST',
      headers: tokenHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = document.querySelector('[data-echoes-msg]');
      if (msg) {
        msg.hidden = false;
        msg.textContent = data.error || 'Failed';
        msg.className = 'draft-msg draft-msg--err';
      }
      return;
    }
    location.reload();
  }

  panel.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLSelectElement) || !t.hasAttribute('data-echo-group-pick')) return;
    const art = t.closest('[data-echo-idx]');
    const list = art && art.querySelector('[data-echo-group]');
    const raw = t.value;
    t.value = '';
    if (!art || !list || !raw) return;
    let name = '';
    let slug = '';
    if (raw.startsWith('slug:')) {
      slug = raw.slice(5);
      const row = roster.find((r) => r && r.slug === slug);
      name = row && row.name ? String(row.name) : slug;
    } else if (raw.startsWith('name:')) {
      name = raw.slice(5);
    }
    if (!name) return;
    const taken = takenKeys(art);
    if (taken.has(groupKey(name, slug)) || taken.has(groupKey(name, '')) || (slug && taken.has(groupKey('', slug)))) {
      return;
    }
    addGroupRow(list, name, slug);
    refreshPicks(art);
    saveSoon();
  });

  panel.querySelectorAll('[data-echo-idx]').forEach((art) => refreshPicks(art));

  document.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const reopen = t.closest('[data-desk-reopen]');
    if (!reopen) return;
    deskOp({ op: 'reopen', slug, title: reopen.getAttribute('data-title') });
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLSelectElement) || !t.hasAttribute('data-desk-claim')) return;
    const toSlug = t.value;
    if (!toSlug) return;
    deskOp({
      op: 'claim',
      fromSlug: slug,
      title: t.getAttribute('data-title') || '',
      toSlug,
    });
  });

  panel.addEventListener('input', saveSoon);
  traitList?.addEventListener('input', () => {
    traitsDirty = true;
    saveSoon();
  });
  function settleOnLeave(ev) {
    const next = ev.relatedTarget;
    const leftEcho = panel.contains(ev.target) && !(next instanceof Node && panel.contains(next));
    const leftTrait = traitList && traitList.contains(ev.target) && !(next instanceof Node && traitList.contains(next));
    if (!leftEcho && !leftTrait) return;
    window.setTimeout(saveNow, 0);
  }
  panel.addEventListener('focusout', settleOnLeave);
  traitList?.addEventListener('focusout', settleOnLeave);
})();
