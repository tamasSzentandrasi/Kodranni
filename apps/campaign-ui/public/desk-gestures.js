(function () {
  const TIERS = ['Honoured', 'Trusted', 'Acknowledged', 'Outcast'];
  let note = null;
  let mythTimer = 0;
  let dyeTimer = 0;
  let picked = null;
  let suppressClick = false;

  function clearAsks(except) {
    document.querySelectorAll('[data-confirm="1"]').forEach(function (btn) {
      if (btn === except) return;
      btn.removeAttribute('data-confirm');
      const idle = btn.getAttribute('data-idle');
      if (!idle) return;
      if (btn.querySelector('svg')) {
        btn.setAttribute('aria-label', idle);
        btn.setAttribute('data-tip', idle);
      } else btn.textContent = idle;
    });
    document.querySelectorAll('[data-desk-remove-ask]').forEach(function (el) {
      el.remove();
    });
  }

  function arm(btn, prompt) {
    const mark = Boolean(btn.querySelector('svg'));
    if (!btn.getAttribute('data-idle')) {
      btn.setAttribute('data-idle', mark ? btn.getAttribute('aria-label') || '' : (btn.textContent || '').trim());
    }
    clearAsks(btn);
    if (btn.getAttribute('data-confirm') === '1') return true;
    btn.setAttribute('data-confirm', '1');
    if (mark) {
      btn.setAttribute('aria-label', prompt);
      btn.setAttribute('data-tip', prompt);
      say(prompt);
    } else btn.textContent = prompt;
    return false;
  }

  function say(text) {
    if (!note) {
      note = document.createElement('p');
      note.className = 'desk-note';
      note.setAttribute('role', 'status');
      document.body.appendChild(note);
    }
    note.hidden = !text;
    note.textContent = text || '';
  }

  async function post(body, reload, hold) {
    const res = await fetch('/api/desk/edit', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      say(data.error || 'Could not save');
      // A reload while the native colour dialog is open dismisses it and leaves the control dead.
      if (!reload && !hold) location.reload();
      return null;
    }
    say('');
    if (reload) location.reload();
    return data;
  }

  function hexToHsl(hex) {
    const m = /^#?([0-9a-f]{6})/i.exec(String(hex || '').trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const light = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: Math.round(light * 100) };
    const d = max - min;
    const sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return { h: h, s: Math.round(sat * 100), l: Math.round(light * 100) };
  }

  function inkFor(light) {
    return light > 58 ? '#14110e' : '#f4efe6';
  }

  function hslOf(tone) {
    return 'hsl(' + tone.h + ' ' + tone.s + '% ' + tone.l + '%)';
  }

  function paintSurface(el, tone, kind) {
    if (!el || !tone) return;
    // Presence only. Rewriting the attribute on every drag step closes Chromium's colour dialog.
    if (!el.hasAttribute('data-hue')) el.setAttribute('data-hue', String(tone.h));
    el.style.setProperty('--on-ink', inkFor(tone.l));
    if (kind === 'fortune') {
      el.style.setProperty('--fortune-h', String(tone.h));
      el.style.setProperty('--fortune-s', tone.s + '%');
      el.style.setProperty('--fortune-l', tone.l + '%');
      el.style.setProperty('--kod-pillar', hslOf(tone));
      return;
    }
    el.style.setProperty('--axis-h', String(tone.h));
    el.style.setProperty('--axis-s', tone.s + '%');
    el.style.setProperty('--axis-l', tone.l + '%');
    el.style.setProperty('--picked', hslOf(tone));
  }

  function dyeBody(op, extra, tone) {
    const body = { op: op, hue: tone.h, sat: tone.s, light: tone.l };
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        body[key] = extra[key];
      });
    }
    return body;
  }

  let dyeTail = Promise.resolve();

  function sendDye(body) {
    dyeTail = dyeTail.then(function () {
      return post(body, false, true);
    });
  }

  function queueDye(body) {
    window.clearTimeout(dyeTimer);
    dyeTimer = window.setTimeout(function () {
      sendDye(body);
    }, 160);
  }

  function flushDye(body) {
    window.clearTimeout(dyeTimer);
    sendDye(body);
  }

  function toneOf(input) {
    return input instanceof HTMLInputElement ? hexToHsl(input.value) : null;
  }

  function parseSeat(raw) {
    if (raw === 'unassigned' || raw === 'porch' || raw === 'ruler') return { kind: raw };
    if (!raw || raw.indexOf('rung:') !== 0) return null;
    const rest = raw.slice(5);
    const tier = TIERS.find(function (t) {
      return rest.endsWith(':' + t);
    });
    if (!tier) return null;
    return { kind: 'rung', axis: rest.slice(0, -(tier.length + 1)), tier: tier };
  }

  function fieldValue(row, name) {
    const el = row.querySelector('[data-fx="' + name + '"]');
    return el && 'value' in el ? String(el.value).trim() : '';
  }

  function readMyths() {
    const myths = [];
    document.querySelectorAll('[data-desk-myth]').forEach(function (frame) {
      const titleEl = frame.querySelector('[data-desk-myth-title]');
      const title = titleEl && 'value' in titleEl ? String(titleEl.value).trim() : '';
      if (!title) return;
      const summaryEl = frame.querySelector('[data-desk-myth-summary]');
      const summary =
        summaryEl && 'value' in summaryEl ? String(summaryEl.value).trim() : '';
      const effects = [];
      frame.querySelectorAll('[data-desk-myth-row]').forEach(function (row) {
        let kind = row.getAttribute('data-kind') || '';
        const die = fieldValue(row, 'die-kind');
        const traitKind = fieldValue(row, 'trait-kind');
        if (die === 'advantage' || die === 'disadvantage') kind = die;
        if (traitKind === 'trait_grant' || traitKind === 'trait_deny') kind = traitKind;
        const label = row.getAttribute('data-label') || kind;
        const effect = { kind: kind, label: label };
        const match = fieldValue(row, 'match');
        const skill = fieldValue(row, 'skill');
        const mode = fieldValue(row, 'mode');
        const traitName = fieldValue(row, 'traitName');
        const permanence = fieldValue(row, 'permanence');
        const detail = fieldValue(row, 'detail');
        const amount = fieldValue(row, 'amount');
        const threshold = fieldValue(row, 'threshold');
        const faces = [];
        row.querySelectorAll('[data-face][aria-pressed="true"]').forEach(function (btn) {
          const n = Number(btn.getAttribute('data-face'));
          if (n >= 1 && n <= 20) faces.push(n);
        });
        if (match) effect.match = match;
        if (skill) effect.skill = skill;
        if (mode) effect.mode = mode;
        if (traitName) effect.traitName = traitName;
        if (permanence) effect.permanence = permanence;
        if (detail) effect.detail = detail;
        if (amount !== '') effect.amount = Math.round(Number(amount));
        if (threshold !== '') effect.threshold = Math.round(Number(threshold));
        if (faces.length) effect.faces = faces;
        effects.push(effect);
      });
      myths.push(summary ? { title: title, summary: summary, effects: effects } : { title: title, effects: effects });
    });
    return myths;
  }

  const MYTH_CARDS = [
    { kind: 'exertion_free', sentence: 'One Exertion, and it stays in the pool.' },
    { kind: 'exertion_forced', sentence: 'The roll demands an extra Exertion.' },
    { kind: 'advantage', sentence: 'The die is advantaged, or disadvantaged.' },
    { kind: 'omen_faces', sentence: 'The Omen shows these faces.' },
    { kind: 'practice_mod', sentence: 'Practice on a named Skill comes faster, slower, or counts as Foundation 3.' },
    { kind: 'tide_mod', sentence: 'Tide starts higher or lower, or its threshold moves.' },
    { kind: 'trait_grant', sentence: 'A Trait is offered to everyone, or taken off the table, for now or for good.' },
  ];

  function mythSentence(kind) {
    if (kind === 'disadvantage') return MYTH_CARDS[2].sentence;
    if (kind === 'trait_deny') return MYTH_CARDS[6].sentence;
    const card = MYTH_CARDS.find(function (item) {
      return item.kind === kind;
    });
    return card ? card.sentence : kind;
  }

  function askHtml(name, words, value, numeric) {
    const type = numeric ? 'number' : 'text';
    return (
      '<label class="desk-myth-ask">' +
      words +
      ' <input class="kod-ink" type="' +
      type +
      '" data-fx="' +
      name +
      '" value="' +
      value +
      '"></label>'
    );
  }

  function chipHtml(kind) {
    const sentence = mythSentence(kind);
    let fields = '';
    if (kind === 'exertion_free' || kind === 'exertion_forced') {
      fields = askHtml('match', 'When the roll is about', '');
    } else if (kind === 'advantage') {
      fields =
        '<label class="desk-myth-ask">The die <select data-fx="die-kind"><option value="advantage" selected>is advantaged</option><option value="disadvantage">is disadvantaged</option></select></label>' +
        askHtml('match', 'When the roll is about', '');
    } else if (kind === 'omen_faces') {
      let faces = '';
      for (let n = 1; n <= 20; n += 1) {
        faces += '<button type="button" data-face="' + n + '" aria-pressed="false">' + n + '</button>';
      }
      fields =
        askHtml('match', 'When the roll is about', '') +
        '<div class="desk-myth-faces" aria-label="Faces the Omen shows">' +
        faces +
        '</div>';
    } else if (kind === 'practice_mod') {
      fields =
        askHtml('match', 'When the roll is about', '') +
        askHtml('skill', 'The Skill', '') +
        '<label class="desk-myth-ask">Practice <select data-fx="mode"><option value="extra" selected>comes faster</option><option value="reduced">comes slower</option><option value="foundation">counts as Foundation 3</option></select></label>' +
        askHtml('amount', 'By how much', '1', true);
    } else if (kind === 'tide_mod') {
      fields =
        askHtml('amount', 'Tide starts higher or lower by', '0', true) +
        askHtml('threshold', 'Its threshold moves by', '0', true);
    } else if (kind === 'trait_grant') {
      fields =
        '<label class="desk-myth-ask">The Trait <select data-fx="trait-kind"><option value="trait_grant" selected>is offered to everyone</option><option value="trait_deny">is taken off the table</option></select></label>' +
        askHtml('traitName', 'Named', '') +
        '<label class="desk-myth-ask">It lasts <select data-fx="permanence"><option value="temporary" selected>for now</option><option value="permanent">for good</option></select></label>';
    }
    return (
      '<div class="desk-myth-row" data-desk-myth-row data-kind="' +
      kind +
      '" data-label="' +
      sentence +
      '"><span class="desk-myth-row__kind">' +
      sentence +
      '</span>' +
      fields +
      '<button type="button" class="desk-mark" data-desk-row-delete aria-label="Remove modifier" data-tip="Remove"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.4"/></svg></button></div>'
    );
  }

  function seatElement() {
    const existing = document.querySelector('.desk-myth-seat');
    if (existing) {
      const clone = existing.cloneNode(true);
      clone.classList.remove('is-open');
      return clone;
    }
    const seat = document.createElement('div');
    seat.className = 'desk-myth-seat';
    seat.setAttribute('data-desk-effect-add', '');
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'kod-btn';
    open.setAttribute('data-desk-effect-open', '');
    open.textContent = 'Add a modifier';
    const cards = document.createElement('div');
    cards.className = 'desk-myth-cards';
    MYTH_CARDS.forEach(function (card) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-desk-effect-kind', card.kind);
      btn.textContent = card.sentence;
      cards.appendChild(btn);
    });
    seat.appendChild(open);
    seat.appendChild(cards);
    return seat;
  }

  function blankArticle(index) {
    const article = document.createElement('article');
    article.className = 'kod-plate myth-card myth-card--blank';
    article.setAttribute('data-desk-myth', String(index));
    article.innerHTML =
      '<p class="myth-card__kicker">Foundation Myth</p><input class="desk-write desk-write--title" data-desk-myth-title data-myth="' +
      index +
      '" placeholder="Write a myth" aria-label="Myth title">';
    return article;
  }

  function fillBlank(frame) {
    if (!frame.classList.contains('myth-card--blank')) return;
    frame.classList.remove('myth-card--blank');
    const index = frame.getAttribute('data-desk-myth') || '0';
    const summary = document.createElement('textarea');
    summary.className = 'desk-write desk-write--summary';
    summary.setAttribute('data-desk-myth-summary', '');
    summary.setAttribute('data-myth', index);
    summary.rows = 2;
    summary.setAttribute('aria-label', 'Myth summary');
    const rows = document.createElement('div');
    rows.className = 'desk-myth-rows';
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'kod-btn';
    del.setAttribute('data-desk-myth-delete', '');
    del.setAttribute('data-myth', index);
    del.textContent = 'Delete';
    frame.appendChild(summary);
    frame.appendChild(rows);
    frame.appendChild(seatElement());
    frame.appendChild(del);
  }

  function saveMyth(frame) {
    if (!frame) return Promise.resolve(null);
    frame.classList.add('is-saving');
    return post({ op: 'myths', myths: readMyths() }, false).then(function (data) {
      frame.classList.remove('is-saving');
      if (!data) location.reload();
      return data;
    });
  }

  function labelIdsOf(el) {
    return (el.getAttribute('data-label-ids') || '').split(/\s+/).filter(Boolean);
  }

  function rowById(id) {
    let found = null;
    document.querySelectorAll('[data-desk-label-row]').forEach(function (el) {
      if (el.getAttribute('data-label-id') === id) found = el;
    });
    return found;
  }

  function labelTone(row) {
    const dye = row.querySelector('[data-desk-label-color]');
    const tone = dye && dye.value ? hexToHsl(dye.value) : null;
    return tone || { h: 40, s: 55, l: 48 };
  }

  function paintLabel(row, tone) {
    if (!row || !tone) return;
    const plate = row.querySelector('.desk-label__plate') || row;
    const colour = hslOf(tone);
    if (!plate.hasAttribute('data-stain')) plate.setAttribute('data-stain', '');
    plate.style.setProperty('--stain', colour);
    row.style.setProperty('--stain', colour);
  }

  function clearMember(el) {
    el.removeAttribute('data-stain');
    el.removeAttribute('data-lit');
    el.style.removeProperty('--stain');
    el.style.removeProperty('--lit-h');
    el.style.removeProperty('--lit-s');
  }

  function deskMemoryKey() {
    const hall = document.querySelector('.hall');
    const slug = hall ? hall.getAttribute('data-slug') || 'hall' : 'hall';
    return 'kod-desk-cat:' + slug;
  }

  function rememberDesk() {
    const open = document.querySelector('[data-desk-editor] [data-faction-cat][data-open="true"]');
    try {
      sessionStorage.setItem(
        deskMemoryKey(),
        JSON.stringify({
          cat: open ? open.getAttribute('data-faction-cat') || '' : '',
          label: picked ? picked.id : '',
        }),
      );
    } catch {
      /* private mode */
    }
  }

  function paintCategory(groupId) {
    const rows = [];
    document.querySelectorAll('[data-faction-cat="' + groupId + '"] [data-desk-label-row]').forEach(function (row) {
      rows.push(row);
    });
    const toneById = {};
    rows.forEach(function (row) {
      toneById[row.getAttribute('data-label-id')] = labelTone(row);
    });
    document.querySelectorAll('[data-desk-diagram] [data-desk-person]').forEach(function (el) {
      clearMember(el);
      const ids = labelIdsOf(el);
      const tones = ids.map(function (lid) { return toneById[lid]; }).filter(Boolean);
      if (tones.length) {
        el.setAttribute('data-stain', '');
        el.style.setProperty(
          '--stain',
          tones
            .map(function (tone, i) {
              const a = (i / tones.length) * 100;
              const b = ((i + 1) / tones.length) * 100;
              return hslOf(tone) + ' ' + a + '% ' + b + '%';
            })
            .join(', '),
        );
      }
      if (picked && ids.indexOf(picked.id) >= 0) {
        el.setAttribute('data-lit', '');
        el.style.setProperty('--lit-h', picked.hue || '40');
        el.style.setProperty('--lit-s', (picked.sat != null ? picked.sat : 80) + '%');
      }
    });
  }

  function paintTag() {
    document.querySelectorAll('[data-desk-diagram] [data-desk-person]').forEach(function (el) {
      clearMember(el);
      if (!picked) return;
      if (labelIdsOf(el).indexOf(picked.id) < 0) return;
      el.setAttribute('data-lit', '');
      el.style.setProperty('--lit-h', picked.hue || '40');
      el.style.setProperty('--lit-s', (picked.sat != null ? picked.sat : 55) + '%');
      el.setAttribute('data-stain', '');
      el.style.setProperty(
        '--stain',
        'hsl(' +
          (picked.hue || '40') +
          ' ' +
          (picked.sat != null ? picked.sat : 55) +
          '% ' +
          (picked.light != null ? picked.light : 48) +
          '%)',
      );
    });
  }

  function closeCategories() {
    document.querySelectorAll('[data-desk-editor] [data-faction-cat]').forEach(function (cat) {
      cat.setAttribute('data-open', 'false');
      const list = cat.querySelector('[data-faction-list]');
      if (list) list.inert = true;
    });
  }

  function openCategory(id) {
    if (!id) return;
    document.querySelectorAll('[data-desk-editor] [data-faction-cat]').forEach(function (cat) {
      const on = cat.getAttribute('data-faction-cat') === id;
      cat.setAttribute('data-open', on ? 'true' : 'false');
      const list = cat.querySelector('[data-faction-list]');
      if (list) list.inert = !on;
    });
    if (picked) {
      const row = rowById(picked.id);
      const cat = row && row.closest('[data-faction-cat]');
      if (!cat || cat.getAttribute('data-faction-cat') !== id) {
        picked = null;
        document.querySelectorAll('[data-desk-label-row]').forEach(function (el) {
          el.setAttribute('aria-pressed', 'false');
        });
      }
    }
    paintCategory(id);
    rememberDesk();
  }

  function selectRow(row) {
    const id = row.getAttribute('data-label-id');
    if (!id) return;
    document.querySelectorAll('[data-desk-label-row]').forEach(function (el) {
      el.setAttribute('aria-pressed', el === row ? 'true' : 'false');
    });
    const tone = labelTone(row);
    picked = {
      id: id,
      hue: String(tone.h),
      sat: tone.s,
      light: tone.l,
      group: row.getAttribute('data-group') || '',
    };
    const cat = row.closest('[data-faction-cat]');
    if (cat) openCategory(cat.getAttribute('data-faction-cat'));
    else {
      closeCategories();
      paintTag();
      rememberDesk();
    }
  }

  function restoreDeskPick() {
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(deskMemoryKey()) || 'null');
    } catch {
      return;
    }
    if (!saved || typeof saved !== 'object') return;
    if (saved.cat) openCategory(saved.cat);
    if (saved.label) {
      const row = rowById(saved.label);
      if (row) selectRow(row);
    }
  }

  async function upload(kind, key, file) {
    const fd = new FormData();
    fd.set('kind', kind);
    fd.set('key', key);
    fd.set('file', file);
    const res = await fetch('/api/desk/upload', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      say(data.error || 'Could not store the icon');
      return;
    }
    location.reload();
  }

  const title = document.querySelector('[data-desk-rename]');
  if (title) {
    let timer = 0;
    const save = function () {
      post({ op: 'rename', name: title.value }, false);
    };
    title.addEventListener('change', save);
    title.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(save, 500);
    });
  }

  document.querySelectorAll('[data-desk-field]').forEach(function (el) {
    el.addEventListener('change', function () {
      const root = document.querySelector('[data-desk-sheet]');
      if (!root) return;
      const slug = root.getAttribute('data-desk-sheet');
      const patch = {};
      document.querySelectorAll('[data-desk-field]').forEach(function (field) {
        patch[field.getAttribute('data-desk-field')] = field.value;
      });
      fetch('/api/character/' + encodeURIComponent(slug), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'st-edit', patch: patch }),
      }).then(async function (res) {
        const data = await res.json().catch(function () {
          return {};
        });
        if (!res.ok) say(data.error || 'Could not save');
        else if (el.getAttribute('data-desk-field') === 'name') location.reload();
      });
    });
  });

  if (new URLSearchParams(location.search).has('name')) {
    const named = document.querySelector('[data-desk-field="name"]');
    if (named instanceof HTMLInputElement) {
      named.focus();
      named.select();
    }
  }

  const book = document.querySelector('[data-desk-notebook]');
  if (book) {
    let timer = 0;
    book.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        post({ op: 'notebook', text: book.value }, false);
      }, 500);
    });
  }

  const mapIn = document.querySelector('[data-desk-map-import]');
  const mapPick = document.querySelector('[data-desk-map-pick]');
  const mapDrawer = document.querySelector('.desk-map');
  const mapToggle = document.querySelector('[data-desk-map-toggle]');
  const mapPanel = document.querySelector('.desk-map__panel');
  function setMapDrawer(open) {
    if (!mapDrawer || !mapToggle) return;
    mapDrawer.setAttribute('data-open', open ? 'true' : 'false');
    mapToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (mapPanel) mapPanel.inert = !open;
  }
  if (mapToggle) {
    mapToggle.addEventListener('click', function () {
      setMapDrawer(mapDrawer.getAttribute('data-open') !== 'true');
    });
  }
  if (mapPick && mapIn) {
    mapPick.addEventListener('click', function () {
      setMapDrawer(true);
      mapIn.click();
    });
  }
  if (mapIn) {
    mapIn.addEventListener('change', async function () {
      const file = mapIn.files && mapIn.files[0];
      if (!file) return;
      let map;
      try {
        map = JSON.parse(await file.text());
      } catch {
        say('That file is not a map');
        return;
      }
      const res = await fetch('/api/desk/map', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(map),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (res.ok) location.reload();
      else say(data.error || 'Could not import');
    });
  }

  const restoreBtn = document.querySelector('[data-desk-restore]');
  const restoreFile = document.querySelector('[data-desk-restore-file]');
  if (restoreBtn && restoreFile instanceof HTMLInputElement) {
    restoreBtn.addEventListener('click', function () {
      restoreFile.click();
    });
    restoreFile.addEventListener('change', function () {
      if (restoreFile.files && restoreFile.files[0] && restoreFile.form) restoreFile.form.submit();
    });
  }

  document.addEventListener('submit', function (ev) {
    const form = ev.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-desk-npc')) return;
    ev.preventDefault();
    const input = form.querySelector('input');
    const name = input && input.value.trim();
    if (!name) return;
    post({ op: 'npc', name: name }, false).then(function (data) {
      if (data && data.slug) location.href = '/characters/' + encodeURIComponent(data.slug) + '/';
    });
  });

  document.addEventListener('click', function (ev) {
    if (suppressClick) {
      suppressClick = false;
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    const t = ev.target;
    if (!(t instanceof Element)) return;
    const fileInput =
      t instanceof HTMLInputElement && t.type === 'file'
        ? t
        : t.closest('label')?.querySelector('input[type="file"]');
    if (fileInput instanceof HTMLInputElement) fileInput.value = '';
    if (!t.closest('[data-confirm="1"], [data-desk-remove-ask]')) clearAsks(null);

    const state = t.closest('[data-desk-state]');
    if (state) {
      const card = state.closest('[data-desk-fortune]');
      if (!card) return;
      const level = state.getAttribute('data-desk-state');
      card.setAttribute('data-level', level || '0');
      card.querySelectorAll('[data-desk-state]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn === state ? 'true' : 'false');
      });
      post(
        { op: 'fortune', key: card.getAttribute('data-desk-fortune'), level: Number(level) },
        false,
      );
      return;
    }
    const reset = t.closest('[data-desk-icon-reset]');
    if (reset) {
      const kind = reset.getAttribute('data-kind');
      const key = reset.getAttribute('data-key') || '';
      if (kind === 'fortune') post({ op: 'fortuneLook', key: key, icon: '' }, true);
      else if (kind === 'axis') post({ op: 'axisLook', name: key, icon: '' }, true);
      else post({ op: 'rulerLook', icon: '' }, true);
      return;
    }
    const addCharacter = t.closest('[data-desk-add-character]');
    if (addCharacter) {
      post({ op: 'npc', name: 'Unnamed' }, false).then(function (data) {
        if (data && data.slug) location.href = '/characters/' + encodeURIComponent(data.slug) + '/?name=1';
      });
      return;
    }
    const face = t.closest('[data-face]');
    if (face) {
      face.setAttribute('aria-pressed', face.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      saveMyth(face.closest('[data-desk-myth]'));
      return;
    }
    const effectOpen = t.closest('[data-desk-effect-open]');
    if (effectOpen) {
      const seat = effectOpen.closest('.desk-myth-seat');
      if (seat) seat.classList.toggle('is-open');
      return;
    }
    if (t.closest('[data-desk-found]')) {
      post({ op: 'found' }, true);
      return;
    }
    const mythDelete = t.closest('[data-desk-myth-delete]');
    if (mythDelete) {
      const frame = mythDelete.closest('[data-desk-myth]');
      if (!frame) return;
      const blank = blankArticle(frame.getAttribute('data-desk-myth') || '0');
      frame.replaceWith(blank);
      saveMyth(blank);
      return;
    }
    const rowDelete = t.closest('[data-desk-row-delete]');
    if (rowDelete) {
      const row = rowDelete.closest('[data-desk-myth-row]');
      const frame = row && row.closest('[data-desk-myth]');
      if (!row || !frame) return;
      row.classList.add('is-leaving');
      window.setTimeout(function () {
        row.remove();
        if (frame.querySelectorAll('[data-desk-myth-row]').length < 5 && !frame.querySelector('.desk-myth-seat')) {
          const rows = frame.querySelector('.desk-myth-rows');
          if (rows) rows.after(seatElement());
        }
        saveMyth(frame);
      }, 320);
      return;
    }
    const kindBtn = t.closest('[data-desk-effect-kind]');
    if (kindBtn) {
      const frame = kindBtn.closest('[data-desk-myth]');
      if (!frame || frame.classList.contains('myth-card--blank')) return;
      const rows = frame.querySelector('.desk-myth-rows');
      if (!rows) return;
      const holder = document.createElement('div');
      holder.innerHTML = chipHtml(kindBtn.getAttribute('data-desk-effect-kind') || '');
      const chip = holder.firstElementChild;
      if (!chip) return;
      rows.appendChild(chip);
      const seat = frame.querySelector('.desk-myth-seat');
      if (seat) seat.classList.remove('is-open');
      if (rows.querySelectorAll('[data-desk-myth-row]').length >= 5 && seat) seat.remove();
      saveMyth(frame);
      return;
    }
    const axisDelete = t.closest('[data-desk-axis-delete]');
    if (axisDelete) {
      const name = axisDelete.getAttribute('data-axis') || '';
      if (!arm(axisDelete, 'Remove ' + name + '?')) return;
      post({ op: 'axisRemove', name: name }, true);
      return;
    }
    const groupDelete = t.closest('[data-desk-group-delete]');
    if (groupDelete) {
      if (!arm(groupDelete, 'Remove this category?')) return;
      post({ op: 'groupRemove', id: groupDelete.getAttribute('data-group') }, true);
      return;
    }
    const labelDelete = t.closest('[data-desk-label-delete]');
    if (labelDelete) {
      if (!arm(labelDelete, 'Remove this plate?')) return;
      post({ op: 'labelRemove', id: labelDelete.getAttribute('data-label-id') }, true);
      return;
    }
    const catHead = t.closest('[data-desk-editor] [data-faction-cat]');
    if (
      catHead &&
      !t.closest('[data-desk-label-row], [data-desk-label-new], [data-desk-group-delete]')
    ) {
      openCategory(catHead.getAttribute('data-faction-cat'));
    }
    const row = t.closest('[data-desk-label-row]');
    if (row && !t.closest('input, textarea, button, a, label')) {
      selectRow(row);
      return;
    }
    const dead = t.closest('[data-desk-dead]');
    if (dead) {
      ev.preventDefault();
      if (!arm(dead, 'Mark dead?')) return;
      post({ op: 'dead', slug: dead.getAttribute('data-slug') }, true);
      return;
    }
    const remove = t.closest('[data-desk-remove]');
    if (remove) {
      ev.preventDefault();
      const name = remove.getAttribute('data-name') || '';
      const host = remove.parentElement;
      let ask = host && host.querySelector('[data-desk-remove-ask]');
      if (!ask) {
        clearAsks(null);
        ask = document.createElement('input');
        ask.className = 'desk-write desk-write--ask';
        ask.setAttribute('data-desk-remove-ask', '');
        ask.setAttribute('aria-label', 'Type ' + name + ' to remove them');
        ask.placeholder = 'Type the name';
        remove.after(ask);
        ask.focus();
      }
      return;
    }
    if (picked) {
      const person = t.closest('[data-desk-diagram] [data-desk-person]');
      if (person) {
        ev.preventDefault();
        const slug = person.getAttribute('data-slug');
        if (!slug) {
          say('That person has no sheet');
          return;
        }
        const ids = labelIdsOf(person);
        const on = ids.indexOf(picked.id) < 0;
        const next = on ? ids.concat(picked.id) : ids.filter(function (id) { return id !== picked.id; });
        const personName = person.getAttribute('data-name') || '';
        document.querySelectorAll('[data-desk-diagram] [data-desk-person]').forEach(function (el) {
          const same = slug
            ? el.getAttribute('data-slug') === slug
            : el.getAttribute('data-name') === personName;
          if (same) el.setAttribute('data-label-ids', next.join(' '));
        });
        const plate = rowById(picked.id);
        if (plate) {
          const who = plate.querySelector('.desk-label__who');
          if (who) {
            const names = [];
            document.querySelectorAll('[data-desk-diagram] [data-desk-person]').forEach(function (el) {
              if (labelIdsOf(el).indexOf(picked.id) < 0) return;
              const personName = el.getAttribute('data-name') || '';
              if (personName && names.indexOf(personName) < 0) names.push(personName);
            });
            who.textContent = names.length ? names.join(', ') : '—';
          }
        }
        if (plate && plate.closest('[data-faction-cat]')) paintCategory(plate.closest('[data-faction-cat]').getAttribute('data-faction-cat'));
        else paintTag();
        post({ op: 'membership', slug: slug, labelId: picked.id, on: on }, false).then(function (data) {
          if (!data) location.reload();
        });
      }
    }
  });

  document.addEventListener('focusin', function (ev) {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    const row = t.closest('[data-desk-label-row]');
    if (row && t.matches('input, textarea') && t.type !== 'color') selectRow(row);
    else if (t.matches('[data-desk-group-name]')) {
      const cat = t.closest('[data-faction-cat]');
      if (cat) openCategory(cat.getAttribute('data-faction-cat'));
    }
  });

  document.addEventListener('change', function (ev) {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.hasAttribute('data-desk-remove-ask')) {
      const remove = t.previousElementSibling;
      const name = remove ? remove.getAttribute('data-name') || '' : '';
      if (t.value !== name) {
        say('Type the name exactly');
        return;
      }
      post({ op: 'remove', slug: remove.getAttribute('data-slug'), confirm: t.value }, true);
      return;
    }
    if (t.hasAttribute('data-desk-fortune-color')) {
      const card = t.closest('[data-desk-fortune]');
      const tone = toneOf(t);
      if (!card || !tone) return;
      paintSurface(card, tone, 'fortune');
      flushDye(dyeBody('fortuneLook', { key: card.getAttribute('data-desk-fortune') }, tone));
      return;
    }
    if (t.hasAttribute('data-desk-seal') && t instanceof HTMLInputElement && t.files && t.files[0]) {
      upload(t.getAttribute('data-desk-seal') || '', t.getAttribute('data-key') || '', t.files[0]);
      return;
    }
    if (t.hasAttribute('data-desk-fortune-icon') && t instanceof HTMLInputElement && t.files && t.files[0]) {
      const card = t.closest('[data-desk-fortune]');
      if (card) upload('fortune', card.getAttribute('data-desk-fortune'), t.files[0]);
      return;
    }
    if (t.hasAttribute('data-desk-label-color')) {
      const tone = toneOf(t);
      const row = t.closest('[data-desk-label-row]');
      if (!tone) return;
      paintLabel(row, tone);
      if (row) selectRow(row);
      flushDye(dyeBody('labelHue', { id: t.getAttribute('data-label-id') }, tone));
      return;
    }
    if (t.hasAttribute('data-desk-axis-color')) {
      const tone = toneOf(t);
      if (!tone) return;
      paintSurface(t.closest('.kod-hier-axis'), tone, 'axis');
      flushDye(dyeBody('axisLook', { name: t.getAttribute('data-axis') }, tone));
      return;
    }
    if (t.hasAttribute('data-desk-ruler-color')) {
      const tone = toneOf(t);
      if (!tone) return;
      paintSurface(t.closest('.kod-hier-ruler'), tone, 'ruler');
      flushDye(dyeBody('rulerLook', {}, tone));
      return;
    }
    if (t.hasAttribute('data-desk-ruler-name')) {
      post({ op: 'rulerLook', title: t.value }, false);
      return;
    }
    if (t.hasAttribute('data-desk-label-icon') && t instanceof HTMLInputElement && t.files && t.files[0]) {
      upload('label', t.getAttribute('data-label-id'), t.files[0]);
      return;
    }
    if (t.hasAttribute('data-desk-effect-add') && t instanceof HTMLSelectElement) {
      const kind = t.value;
      if (!kind) return;
      const frame = t.closest('[data-desk-myth]');
      const myths = readMyths();
      const filled = Array.from(document.querySelectorAll('[data-desk-myth]')).filter(function (frameEl) {
        const input = frameEl.querySelector('[data-desk-myth-title]');
        return input && 'value' in input && String(input.value).trim();
      });
      const at = filled.indexOf(frame);
      if (at < 0 || !myths[at]) return;
      const label = t.selectedOptions[0] ? t.selectedOptions[0].textContent : kind;
      myths[at].effects.push({ kind: kind, label: label });
      post({ op: 'myths', myths: myths }, true);
      return;
    }
    if (t.hasAttribute('data-desk-myth-title') || t.hasAttribute('data-desk-myth-summary') || t.closest('[data-desk-myth-row]')) {
      const frame = t.closest('[data-desk-myth]');
      if (!frame) return;
      const die = t.getAttribute('data-fx');
      if (die === 'die-kind' || die === 'trait-kind') {
        const row = t.closest('[data-desk-myth-row]');
        if (row && t.value) row.setAttribute('data-kind', t.value);
      }
      if (frame.classList.contains('myth-card--blank')) {
        const input = frame.querySelector('[data-desk-myth-title]');
        if (input && 'value' in input && String(input.value).trim()) {
          fillBlank(frame);
          saveMyth(frame);
        }
        return;
      }
      window.clearTimeout(mythTimer);
      mythTimer = window.setTimeout(function () {
        saveMyth(frame);
      }, 500);
      return;
    }
    if (t.hasAttribute('data-desk-axis-name')) {
      const from = t.getAttribute('data-axis') || '';
      if (t.value.trim() && t.value.trim() !== from) post({ op: 'axisRename', from: from, to: t.value }, true);
      return;
    }
    if (t.hasAttribute('data-desk-axis-new') && t.value.trim()) {
      post({ op: 'axisAdd', name: t.value }, true);
      return;
    }
    if (t.hasAttribute('data-desk-group-name')) {
      post({ op: 'groupRename', id: t.getAttribute('data-group'), name: t.value }, false);
      return;
    }
    if (t.hasAttribute('data-desk-group-new') && t.value.trim()) {
      post({ op: 'groupAdd', name: t.value }, true);
      return;
    }
    if (t.hasAttribute('data-desk-label-new') && t.value.trim()) {
      post({ op: 'labelAdd', groupId: t.getAttribute('data-group'), name: t.value }, true);
      return;
    }
    if (t.hasAttribute('data-desk-label-name') && t.value.trim()) {
      post({ op: 'labelRename', id: t.getAttribute('data-label-id'), name: t.value.trim() }, false);
    }
  });

  document.addEventListener('input', function (ev) {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.hasAttribute('data-desk-fortune-color')) {
      const card = t.closest('[data-desk-fortune]');
      const tone = toneOf(t);
      if (!tone) return;
      paintSurface(card, tone, 'fortune');
      if (card) queueDye(dyeBody('fortuneLook', { key: card.getAttribute('data-desk-fortune') }, tone));
      return;
    }
    if (t.hasAttribute('data-desk-label-color')) {
      const row = t.closest('[data-desk-label-row]');
      const tone = toneOf(t);
      if (!tone) return;
      paintLabel(row, tone);
      if (picked && row && picked.id === row.getAttribute('data-label-id')) {
        picked.hue = String(tone.h);
        picked.sat = tone.s;
        picked.light = tone.l;
        const cat = row.closest('[data-faction-cat]');
        if (cat) paintCategory(cat.getAttribute('data-faction-cat'));
        else paintTag();
      }
      queueDye(dyeBody('labelHue', { id: t.getAttribute('data-label-id') }, tone));
      return;
    }
    if (t.hasAttribute('data-desk-axis-color')) {
      const tone = toneOf(t);
      if (!tone) return;
      paintSurface(t.closest('.kod-hier-axis'), tone, 'axis');
      queueDye(dyeBody('axisLook', { name: t.getAttribute('data-axis') }, tone));
      return;
    }
    if (t.hasAttribute('data-desk-ruler-color')) {
      const tone = toneOf(t);
      if (!tone) return;
      paintSurface(t.closest('.kod-hier-ruler'), tone, 'ruler');
      queueDye(dyeBody('rulerLook', {}, tone));
      return;
    }
    if (!t.closest('[data-desk-myth]')) return;
    if (t.closest('.myth-card--blank')) return;
    window.clearTimeout(mythTimer);
    const frame = t.closest('[data-desk-myth]');
    mythTimer = window.setTimeout(function () {
      saveMyth(frame);
    }, 600);
  });

  let pointer = null;

  function underPoint(x, y, skip) {
    return document.elementsFromPoint(x, y).filter(function (node) {
      if (!(node instanceof Element)) return false;
      if (node.classList.contains('desk-ghost')) return false;
      if (skip && (node === skip || skip.contains(node))) return false;
      return true;
    });
  }

  function firstMatch(nodes, selector) {
    for (let i = 0; i < nodes.length; i++) {
      const found = nodes[i].closest(selector);
      if (found) return found;
    }
    return null;
  }

  function sameSeat(a, b) {
    if (!a || !b || a.kind !== b.kind) return false;
    if (a.kind === 'rung') return a.axis === b.axis && a.tier === b.tier;
    return true;
  }

  function markDrop(el) {
    document.querySelectorAll('.is-drop').forEach(function (node) {
      if (node !== el) node.classList.remove('is-drop');
    });
    if (el) el.classList.add('is-drop');
  }

  function finishPointer(commit) {
    if (!pointer) return;
    const state = pointer;
    pointer = null;
    document.body.classList.remove('desk-dragging');
    document.querySelectorAll('.is-drop').forEach(function (node) {
      node.classList.remove('is-drop');
    });
    if (state.el) state.el.classList.remove('is-lifting');
    if (state.ghost) state.ghost.remove();
    if (state.active && commit) suppressClick = true;
    if (commit && state.active) commitDrag(state);
  }

  function placeBefore(host, el, y) {
    const rect = host.getBoundingClientRect();
    if (y > rect.top + rect.height / 2) host.after(el);
    else host.parentElement.insertBefore(el, host);
  }

  function samePerson(el, slug, name) {
    if (slug && el.getAttribute('data-slug')) return el.getAttribute('data-slug') === slug;
    return (el.getAttribute('data-name') || '') === name;
  }

  function peopleOf(slug, name) {
    return Array.from(document.querySelectorAll('[data-desk-diagram] [data-desk-person]')).filter(function (el) {
      return samePerson(el, slug, name);
    });
  }

  function dropHost(zone) {
    if (!zone) return null;
    if (zone.getAttribute('data-desk-drop') === 'ruler') return zone;
    return zone.querySelector('.kod-hier-rung__people, .kod-hier-porch__people') || zone;
  }

  function clearEmpty(host) {
    const empty = host && host.querySelector(':scope > .empty');
    if (empty) empty.remove();
  }

  function markEmpty(host) {
    if (!host || host.querySelector('[data-desk-person]') || host.querySelector(':scope > .empty')) return;
    const porch = host.closest('.kod-hier-unassigned, .kod-hier-porch');
    if (!porch) return;
    const note = document.createElement('p');
    note.className = 'empty';
    note.textContent = porch.classList.contains('kod-hier-unassigned') ? 'None waiting.' : 'None tracked.';
    host.appendChild(note);
  }

  function rulerNote(zone) {
    if (zone.querySelector('[data-desk-person]')) {
      const note = zone.querySelector('.hier-ruler__note');
      if (note) note.remove();
      return;
    }
    if (zone.querySelector('.hier-ruler__note')) return;
    const note = document.createElement('p');
    note.className = 'hier-ruler__note';
    note.textContent = 'One seat for the whole community — none claimed.';
    zone.appendChild(note);
  }

  function parkUnassigned(el) {
    const host = document.querySelector('[data-desk-drop="unassigned"] .kod-hier-porch__people');
    if (!host) return;
    el.setAttribute('data-desk-from', 'unassigned');
    clearEmpty(host);
    host.appendChild(el);
  }

  function settleDrop(state, zone, to) {
    const slug = state.slug;
    const name = state.name;
    const from = state.from;
    let copy = Boolean(state.copy);
    if (copy && (to.kind === 'porch' || (from && from.kind === 'porch'))) {
      say('an outsider is not also on a ladder');
      return false;
    }
    if (copy && to.kind === 'ruler' && zone.querySelector('[data-desk-person]')) {
      say('the ruler seat is taken');
      return false;
    }
    if (copy && from && from.kind === 'rung' && to.kind === 'rung' && from.axis === to.axis) copy = false;
    if (!copy && sameSeat(from, to)) return false;
    const host = dropHost(zone);
    if (!host) return false;
    const node = copy ? state.el.cloneNode(true) : state.el;
    const fromAttr = to.kind === 'rung' ? 'rung:' + to.axis + ':' + to.tier : to.kind;
    if (to.kind === 'unassigned') {
      const others = peopleOf(slug, name).filter(function (el) {
        return el !== node;
      });
      if (others.length) {
        const parent = node.parentElement;
        node.remove();
        markEmpty(parent);
        return true;
      }
    }
    if (to.kind === 'porch') {
      peopleOf(slug, name).forEach(function (el) {
        if (el !== node) el.remove();
      });
      const ruler = document.querySelector('[data-desk-drop="ruler"]');
      if (ruler) {
        const sitting = ruler.querySelector('[data-desk-person]');
        if (sitting && samePerson(sitting, slug, name)) sitting.remove();
        rulerNote(ruler);
      }
    } else if (to.kind === 'ruler') {
      if (!copy) {
        peopleOf(slug, name).forEach(function (el) {
          if (el !== node && el.getAttribute('data-desk-from') === 'porch') el.remove();
        });
      }
      const previous = Array.from(zone.querySelectorAll('[data-desk-person]')).find(function (el) {
        return el !== node;
      });
      if (previous) {
        const prevSlug = previous.getAttribute('data-slug') || '';
        const prevName = previous.getAttribute('data-name') || '';
        const others = peopleOf(prevSlug, prevName).filter(function (el) {
          return el !== previous;
        });
        if (others.length) previous.remove();
        else parkUnassigned(previous);
      }
    } else if (to.kind === 'rung' && !copy) {
      peopleOf(slug, name).forEach(function (el) {
        if (el === node) return;
        const seat = parseSeat(el.getAttribute('data-desk-from') || '');
        if (!seat) return;
        if (seat.kind === 'porch' || (seat.kind === 'rung' && seat.axis === to.axis)) el.remove();
      });
    }
    node.setAttribute('data-desk-from', fromAttr);
    clearEmpty(host);
    host.appendChild(node);
    const ruler = document.querySelector('[data-desk-drop="ruler"]');
    if (ruler) rulerNote(ruler);
    document.querySelectorAll('.kod-hier-rung__people, .kod-hier-porch__people').forEach(markEmpty);
    return true;
  }

  function commitDrag(state) {
    const nodes = underPoint(state.x, state.y, state.el);
    if (state.kind === 'myth') {
      const row = firstMatch(nodes, '[data-desk-myth-row]');
      const frame = state.el.closest('[data-desk-myth]');
      if (!row || row === state.el || !frame || row.closest('[data-desk-myth]') !== frame) return;
      placeBefore(row, state.el, state.y);
      saveMyth(frame);
      return;
    }
    if (state.kind === 'label') {
      const row = firstMatch(nodes, '[data-desk-label-row]');
      const host = firstMatch(nodes, '.allegiance__list, [data-tag-list]');
      if (!host) return;
      if (row && row !== state.el) placeBefore(row, state.el, state.y);
      else if (host !== state.el.parentElement) {
        const inscribe = host.querySelector('[data-desk-label-new]');
        if (inscribe) host.insertBefore(state.el, inscribe);
        else host.appendChild(state.el);
      } else return;
      const groupId =
        host.getAttribute('data-group') ||
        (host.closest('[data-faction-cat]') &&
          host.closest('[data-faction-cat]').getAttribute('data-faction-cat')) ||
        state.el.getAttribute('data-group');
      const ids = Array.from(host.querySelectorAll('[data-desk-label-row]')).map(function (el) {
        return el.getAttribute('data-label-id');
      });
      const same = state.el.getAttribute('data-group') === groupId;
      post(
        same
          ? { op: 'labelOrder', groupId: groupId, ids: ids }
          : { op: 'labelMove', id: state.el.getAttribute('data-label-id'), groupId: groupId, ids: ids },
        false,
      ).then(function (data) {
        if (!data) location.reload();
      });
      return;
    }
    const zone = firstMatch(nodes, '[data-desk-drop]');
    if (!zone || !state.from) return;
    const kind = zone.getAttribute('data-desk-drop');
    const to =
      kind === 'rung'
        ? { kind: 'rung', axis: zone.getAttribute('data-axis'), tier: zone.getAttribute('data-tier') }
        : { kind: kind };
    if (to.kind === 'unassigned' && state.copy) {
      say('A copy needs another ladder');
      return;
    }
    if (!settleDrop(state, zone, to)) return;
    post(
      {
        op: 'place',
        slug: state.slug || undefined,
        name: state.name,
        from: state.from,
        to: to,
        copy: state.copy,
      },
      false,
    ).then(function (data) {
      if (!data) location.reload();
    });
  }

  document.addEventListener(
    'pointerdown',
    function (ev) {
      const t = ev.target;
      if (!(t instanceof HTMLInputElement) || t.type !== 'color' || !t.classList.contains('desk-dye')) return;
      const slide = t.closest('.kod-slide');
      // An open drawer still carries translateX(0), and that transform detaches the native picker.
      if (slide && slide.getAttribute('data-open') === 'true') slide.style.transform = 'none';
      const tone = toneOf(t);
      if (!tone) return;
      if (t.hasAttribute('data-desk-fortune-color')) paintSurface(t.closest('[data-desk-fortune]'), tone, 'fortune');
      else if (t.hasAttribute('data-desk-label-color')) paintLabel(t.closest('[data-desk-label-row]'), tone);
      else if (t.hasAttribute('data-desk-axis-color')) paintSurface(t.closest('.kod-hier-axis'), tone, 'axis');
      else if (t.hasAttribute('data-desk-ruler-color')) paintSurface(t.closest('.kod-hier-ruler'), tone, 'ruler');
    },
    true,
  );

  function releaseSlideTransform(slide) {
    if (slide) slide.style.transform = '';
  }

  document.addEventListener('focusout', function (ev) {
    const t = ev.target;
    if (!(t instanceof Element) || !t.classList.contains('desk-dye')) return;
    releaseSlideTransform(t.closest('.kod-slide'));
  });

  document.addEventListener('click', function (ev) {
    const t = ev.target;
    if (!(t instanceof Element) || !t.closest('[data-slide-toggle]')) return;
    document.querySelectorAll('.kod-slide').forEach(releaseSlideTransform);
  });

  document.addEventListener('pointerdown', function (ev) {
    if (mapDrawer && mapDrawer.getAttribute('data-open') === 'true') {
      const hit = ev.target;
      if (hit instanceof Node && !mapDrawer.contains(hit)) setMapDrawer(false);
    }
    if (suppressClick) suppressClick = false;
    if (pointer || ev.button !== 0) return;
    const t = ev.target;
    if (!(t instanceof Element)) return;
    if (t.closest('input, textarea, select, button, summary, label')) return;
    let kind = '';
    let el = null;
    let label = '';
    const mythHandle = t.closest('.desk-myth-row__kind');
    const plate = t.closest('[data-desk-label-row]');
    const person = t.closest('[data-desk-person]');
    if (mythHandle) {
      kind = 'myth';
      el = mythHandle.closest('[data-desk-myth-row]');
      label = (el && el.getAttribute('data-label')) || (mythHandle.textContent || '').trim();
    } else if (plate) {
      kind = 'label';
      el = plate;
      const name = el.querySelector('[data-desk-label-name]');
      label = name && 'value' in name ? String(name.value) : '';
    } else if (person && person.closest('[data-desk-diagram]')) {
      kind = 'person';
      el = person;
      label = person.getAttribute('data-name') || '';
    }
    if (!el) return;
    pointer = {
      id: ev.pointerId,
      kind: kind,
      el: el,
      label: label,
      name: person ? person.getAttribute('data-name') || '' : '',
      slug: person ? person.getAttribute('data-slug') || '' : '',
      from: person ? parseSeat(person.getAttribute('data-desk-from') || '') : null,
      x0: ev.clientX,
      y0: ev.clientY,
      x: ev.clientX,
      y: ev.clientY,
      active: false,
      copy: false,
      ghost: null,
    };
    try {
      el.setPointerCapture(ev.pointerId);
    } catch {
      /* capture can fail if the pointer already ended */
    }
  });

  document.addEventListener('pointermove', function (ev) {
    if (!pointer || ev.pointerId !== pointer.id) return;
    const dx = ev.clientX - pointer.x0;
    const dy = ev.clientY - pointer.y0;
    if (!pointer.active) {
      if (dx * dx + dy * dy < 64) return;
      pointer.active = true;
      document.body.classList.add('desk-dragging');
      pointer.el.classList.add('is-lifting');
      pointer.ghost = document.createElement('div');
      pointer.ghost.className = 'desk-ghost';
      document.body.appendChild(pointer.ghost);
    }
    pointer.x = ev.clientX;
    pointer.y = ev.clientY;
    pointer.copy = ev.ctrlKey || ev.metaKey;
    if (pointer.ghost) {
      pointer.ghost.textContent = pointer.copy && pointer.kind === 'person' ? pointer.label + ' · copy' : pointer.label;
      pointer.ghost.style.left = ev.clientX + 'px';
      pointer.ghost.style.top = ev.clientY + 'px';
    }
    const nodes = underPoint(ev.clientX, ev.clientY, pointer.el);
    if (pointer.kind === 'person') markDrop(firstMatch(nodes, '[data-desk-drop]'));
    else if (pointer.kind === 'myth') markDrop(firstMatch(nodes, '[data-desk-myth-row]'));
    else markDrop(firstMatch(nodes, '[data-desk-label-row], .allegiance__list, [data-tag-list]'));
  });

  document.addEventListener('pointerup', function (ev) {
    if (!pointer || ev.pointerId !== pointer.id) return;
    pointer.x = ev.clientX;
    pointer.y = ev.clientY;
    pointer.copy = ev.ctrlKey || ev.metaKey;
    finishPointer(true);
  });

  document.addEventListener('pointercancel', function (ev) {
    if (!pointer || ev.pointerId !== pointer.id) return;
    finishPointer(false);
  });

  restoreDeskPick();
})();
