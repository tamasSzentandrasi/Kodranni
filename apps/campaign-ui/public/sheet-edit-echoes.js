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

  function readEchoes() {
    return Array.from(panel.querySelectorAll('[data-echo-idx]')).map((art) => {
      const w = Number(art.querySelector('[data-echo-weight]')?.getAttribute('data-weight') || 1);
      const title = art.querySelector('[data-echo-title]')?.value?.trim() || 'Echo';
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
    });
  }

  function readTraits() {
    if (!traitList) return [];
    return Array.from(traitList.querySelectorAll('[data-trait-idx]'))
      .map((li) => {
        const name = li.querySelector('[data-trait-name]')?.value?.trim();
        if (!name) return null;
        const note = li.querySelector('[data-trait-note]')?.value?.trim();
        return { name, note: note || undefined };
      })
      .filter(Boolean);
  }

  function addEchoCard(weight, title, invoke) {
    if (!list) return;
    const empty = list.querySelector('.empty');
    if (empty) empty.remove();
    const idx = list.querySelectorAll('[data-echo-idx]').length;
    const art = document.createElement('article');
    art.className = 'kod-plate echo';
    art.setAttribute('data-echo-idx', String(idx));
    art.innerHTML =
      '<div class="echo__weight echo__weight--edit" data-echo-weight data-weight="' +
      weight +
      '" tabindex="0" data-tip="Left-click +1 · right-click −1 (1–3)">' +
      '<span class="weight-segs" aria-label="Weight ' +
      weight +
      '"><i class="on"></i><i></i><i></i></span>' +
      '<span class="weight-band">' +
      (BAND[weight] || weight) +
      '</span></div>' +
      '<div class="echo__body">' +
      '<input class="echo__title-input kod-ink" data-echo-title value="' +
      (title || '').replace(/"/g, '&quot;') +
      '" placeholder="Echo title…" />' +
      '<label class="echo__invoke-edit"><span class="echo__invoke-lab">Invoke when</span>' +
      '<textarea class="kod-ink" data-echo-invoke rows="2" placeholder="When the table agrees the scene matches…">' +
      (invoke || '') +
      '</textarea></label>' +
      '<div class="echo__circle" data-echo-circle hidden>' +
      '<p class="echo__circle-lab">Who shares this</p>' +
      '<ul class="echo__people" data-echo-group></ul>' +
      '<label class="echo__pick"><span class="echo__pick-lab">Add a character</span>' +
      '<select class="kod-ink" data-echo-group-pick><option value="">Choose…</option></select></label></div>' +
      '<p class="echo__circle-all" data-echo-all hidden>The whole community.</p>' +
      '<button type="button" class="echo__remove" data-echo-remove>Remove</button></div>';
    list.appendChild(art);
    paintWeight(art.querySelector('[data-echo-weight]'), weight);
  }

  panel.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-echo-add]')) {
      addEchoCard(1, '', '');
      saveSoon();
      return;
    }
    if (t.closest('[data-echo-remove]')) {
      t.closest('[data-echo-idx]')?.remove();
      saveSoon();
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
    if (wEl instanceof HTMLElement && wEl.classList.contains('echo__weight--edit')) {
      ev.preventDefault();
      const cur = Number(wEl.getAttribute('data-weight') || 1);
      paintWeight(wEl, Math.max(1, cur - 1));
      saveSoon();
    }
  });

  document.querySelector('[data-trait-add]')?.addEventListener('click', () => {
    if (!traitList) return;
    const empty = traitList.querySelector('.empty');
    if (empty) empty.remove();
    const idx = traitList.querySelectorAll('[data-trait-idx]').length;
    const li = document.createElement('li');
    li.className = 'kod-plate trait';
    li.setAttribute('data-trait-idx', String(idx));
    li.innerHTML =
      '<div class="trait__edit">' +
      '<input class="kod-ink" data-trait-name value="" placeholder="Trait name…" />' +
      '<input class="kod-ink" data-trait-note value="" placeholder="Optional note" />' +
      '<button type="button" data-trait-remove>Remove</button></div>';
    traitList.appendChild(li);
    saveSoon();
  });

  document.querySelector('#traits-panel')?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-trait-remove]')) {
      t.closest('[data-trait-idx]')?.remove();
      saveSoon();
    }
  });

  let saveTimer = 0;
  function saveSoon() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveNow, 550);
  }

  async function saveNow() {
    const msg = document.querySelector('[data-echoes-msg]');
    const res = await fetch('/api/character/' + encodeURIComponent(slug), {
      method: 'POST',
      headers: tokenHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'st-edit',
        patch: { echoes: readEchoes(), traits: readTraits() },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (msg && !res.ok) {
      msg.hidden = false;
      msg.textContent = data.error || 'Failed';
      msg.className = 'draft-msg draft-msg--err';
    }
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

  panel.addEventListener('input', saveSoon);
  traitList?.addEventListener('input', saveSoon);
})();
