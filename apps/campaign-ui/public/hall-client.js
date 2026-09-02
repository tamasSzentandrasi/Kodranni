/**
 * Hall-only: nave search, collapse persist, roving tabindex, rev poll.
 * Loaded from community/index.astro — not CampaignLayout. No founding handlers.
 */
(function () {
  const hall = document.querySelector('.hall');
  if (!hall) return;

  const slug = hall.getAttribute('data-slug') || 'hall';
  const storageKey = 'kod-hall:' + slug;
  const POLL_MS = 8000;

  /** @type {{ q: string, collapse: Record<string, boolean>, group: string, viewGroup: string, labels: string[], axis: string, axes: string[], tiers: string[], kinds: string[], findOpen: boolean | null }} */
  let bag = {
    q: '',
    collapse: {},
    group: 'g-faction',
    viewGroup: 'g-faction',
    labels: [],
    axis: '',
    axes: [],
    tiers: [],
    kinds: [],
    findOpen: null,
  };

  function loadBag() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      bag.q = typeof parsed.q === 'string' ? parsed.q : '';
      bag.collapse =
        parsed.collapse && typeof parsed.collapse === 'object' ? parsed.collapse : {};
      bag.group = typeof parsed.group === 'string' && parsed.group ? parsed.group : 'g-faction';
      bag.viewGroup =
        typeof parsed.viewGroup === 'string' && parsed.viewGroup ? parsed.viewGroup : bag.group;
      bag.labels = Array.isArray(parsed.labels) ? parsed.labels.map(String) : [];
      bag.axis = typeof parsed.axis === 'string' ? parsed.axis : '';
      bag.axes = Array.isArray(parsed.axes) ? parsed.axes.map(String) : [];
      bag.tiers = Array.isArray(parsed.tiers) ? parsed.tiers.map(String) : [];
      bag.kinds = Array.isArray(parsed.kinds) ? parsed.kinds.map(String) : [];
      if (typeof parsed.findOpen === 'boolean') bag.findOpen = parsed.findOpen;
    } catch {
      /* ignore */
    }
  }

  function saveBag() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(bag));
    } catch {
      /* ignore */
    }
  }

  function rungKey(rung) {
    const axis = rung.closest('.hier-axis');
    const axisName = (axis && axis.getAttribute('data-axis-name')) || '';
    const tier = rung.getAttribute('data-tier') || '';
    return axisName + ':' + tier;
  }

  function setCollapsed(rung, collapsed) {
    if (rung.getAttribute('data-pending') === 'true') collapsed = false;
    rung.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
    const head = rung.querySelector('[data-rung-toggle]');
    if (head) head.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    const chev = rung.querySelector('.hier-rung__chev, .rung__chev');
    if (chev) chev.textContent = '';
  }

  function persistCollapse() {
    const collapse = {};
    document.querySelectorAll('.hier-rung[data-tier]').forEach((rung) => {
      collapse[rungKey(rung)] = rung.getAttribute('data-collapsed') === 'true';
    });
    bag.collapse = collapse;
    saveBag();
  }

  function restoreCollapse() {
    document.querySelectorAll('.hier-rung[data-tier]').forEach((rung) => {
      const stored = bag.collapse[rungKey(rung)];
      if (typeof stored === 'boolean') setCollapsed(rung, stored);
      else if (rung.getAttribute('data-pending') === 'true') setCollapsed(rung, false);
    });
  }

  // —— People index (search) ——————————————————————————————————————————

  /** @type {Map<string, Record<string, unknown>>} */
  const people = new Map();
  try {
    const node = document.getElementById('kod-hall-people');
    const list = node ? JSON.parse(node.textContent || '[]') : [];
    for (const p of list) {
      if (p && p.id) {
        people.set(String(p.id), p);
        if (p.name) people.set(String(p.name).toLowerCase(), p);
        if (p.slug) people.set(String(p.slug).toLowerCase(), p);
      }
    }
  } catch {
    /* ignore */
  }

  /** @type {{ id: string, groupId: string, name: string, hue?: number }[]} */
  let catalogLabels = [];
  /** @type {{ id: string, name: string, kind?: string }[]} */
  let catalogGroups = [];
  try {
    const node = document.getElementById('kod-hall-labels');
    const parsed = node ? JSON.parse(node.textContent || '{}') : {};
    catalogLabels = Array.isArray(parsed.labels) ? parsed.labels : [];
    catalogGroups = Array.isArray(parsed.groups) ? parsed.groups : [];
  } catch {
    /* ignore */
  }

  function labelById(id) {
    return catalogLabels.find((l) => l.id === id);
  }

  // —— Search ————————————————————————————————————————————————————————

  const searchRoot = document.querySelector('[data-hall-search]');
  const qInput = document.querySelector('[data-hall-q]');
  const hitsEl = document.querySelector('[data-hall-hits]');
  const countEl = document.querySelector('[data-hall-count]');
  const findToggle = document.querySelector('[data-find-toggle]');

  const labelNameById = new Map();
  const labelGroupById = new Map();
  document.querySelectorAll('[data-filter="label"]').forEach((btn) => {
    const id = btn.getAttribute('data-value') || '';
    if (!id) return;
    labelNameById.set(id, (btn.textContent || '').trim());
    labelGroupById.set(id, btn.getAttribute('data-group') || '');
  });

  function tokens(q) {
    return String(q || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  function kindOf(el) {
    return el.getAttribute('data-kind') || (el.classList.contains('member--pc') ? 'pc' : 'npc');
  }

  function labelIdsOf(el) {
    return (el.getAttribute('data-label-ids') || '').split(/\s+/).filter(Boolean);
  }

  function haystackPerson(p) {
    const names = (Array.isArray(p.labelIds) ? p.labelIds : [])
      .map((id) => labelNameById.get(id) || '')
      .join(' ');
    return (String(p.name || '') + ' ' + names).toLowerCase();
  }

  function haystackEl(el) {
    const names = labelIdsOf(el)
      .map((id) => labelNameById.get(id) || '')
      .join(' ');
    return ((el.getAttribute('data-name') || '') + ' ' + names).toLowerCase();
  }

  function queryOk(hay) {
    const ts = tokens(qInput && qInput.value);
    if (!ts.length) return true;
    return ts.every((t) => hay.includes(t));
  }

  function labelsOk(ids) {
    const selected = bag.labels;
    if (!selected.length) return true;
    const byGroup = new Map();
    for (const id of selected) {
      const g = labelGroupById.get(id) || '_';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(id);
    }
    for (const need of byGroup.values()) {
      if (!need.some((id) => ids.includes(id))) return false;
    }
    return true;
  }

  function placesOk(places) {
    const axes = bag.axes;
    const tiers = bag.tiers;
    if (!axes.length && !tiers.length) return true;
    if (!places.length) return false;
    return places.some(
      (pl) =>
        (!axes.length || axes.includes(pl.axis)) && (!tiers.length || tiers.includes(pl.tier)),
    );
  }

  function kindOk(kind, pc) {
    const kinds = bag.kinds;
    if (!kinds.length) return true;
    if (kinds.includes('pc') && (kind === 'pc' || pc)) return true;
    if (kinds.includes('outsider') && kind === 'outsider') return true;
    if (kinds.includes('npc') && kind !== 'pc' && kind !== 'outsider' && !pc) return true;
    return false;
  }

  function activeFilters() {
    return Boolean(
      tokens(qInput && qInput.value).length ||
        bag.axes.length ||
        bag.tiers.length ||
        bag.kinds.length ||
        bag.labels.length,
    );
  }

  function chipMatch(el) {
    const axisEl = el.closest('.hier-axis');
    const rung = el.closest('.hier-rung');
    const elAxis = (axisEl && axisEl.getAttribute('data-axis-name')) || '';
    const elTier = (rung && rung.getAttribute('data-tier')) || '';
    const kind = kindOf(el);
    const places = elAxis ? [{ axis: elAxis, tier: elTier }] : [];
    if (!queryOk(haystackEl(el))) return false;
    if (!labelsOk(labelIdsOf(el))) return false;
    if (!placesOk(places) && (bag.axes.length || bag.tiers.length)) {
      if (kind === 'outsider') return false;
      return false;
    }
    if (!kindOk(kind, el.classList.contains('member--pc'))) return false;
    return true;
  }

  function personMatches(p) {
    const kind = p.kind === 'outsider' ? 'outsider' : p.pc ? 'pc' : 'npc';
    const places = Array.isArray(p.placements) ? p.placements : [];
    if (!queryOk(haystackPerson(p))) return false;
    if (!labelsOk(Array.isArray(p.labelIds) ? p.labelIds : [])) return false;
    if (!placesOk(places)) return false;
    if (!kindOk(kind, p.pc)) return false;
    return true;
  }

  function syncFacetButtons() {
    if (!searchRoot) return;
    searchRoot.querySelectorAll('[data-filter]').forEach((btn) => {
      const key = btn.getAttribute('data-filter');
      const value = btn.getAttribute('data-value') || '';
      let on = false;
      if (key === 'axis') on = bag.axes.includes(value);
      else if (key === 'tier') on = bag.tiers.includes(value);
      else if (key === 'kind') on = bag.kinds.includes(value);
      else if (key === 'label') on = bag.labels.includes(value);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function toggleIn(arr, value) {
    const i = arr.indexOf(value);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(value);
  }

  function applySearch() {
    const on = activeFilters();
    document.querySelectorAll('.member[data-inspect-id]').forEach((el) => {
      if (!on) {
        el.removeAttribute('data-search');
        return;
      }
      el.setAttribute('data-search', chipMatch(el) ? 'hit' : 'miss');
    });
    if (on) {
      document.querySelectorAll('.hier-rung').forEach((rung) => {
        if (rung.querySelector('[data-search="hit"]')) setCollapsed(rung, false);
      });
    }

    const seen = new Set();
    const hits = [];
    people.forEach((p, key) => {
      if (seen.has(p)) return;
      if (key !== p.id) return;
      seen.add(p);
      if (personMatches(p)) hits.push(p);
    });

    if (countEl) {
      if (!on) {
        countEl.hidden = true;
      } else {
        countEl.hidden = false;
        countEl.textContent = hits.length === 1 ? '1 person' : hits.length + ' people';
      }
    }

    if (!hitsEl) return;
    hitsEl.replaceChildren();
    if (!on) {
      hitsEl.hidden = true;
      return;
    }
    if (hits.length === 0) {
      hitsEl.hidden = false;
      const li = document.createElement('li');
      li.className = 'hall-search__empty';
      li.textContent = 'No one matches.';
      hitsEl.appendChild(li);
      return;
    }
    hitsEl.hidden = false;
    hits.forEach((p, i) => {
      const li = document.createElement('li');
      const meta =
        p.kind === 'outsider' ? 'Outsider' : p.pc ? 'Player' : 'NPC';
      const node = p.slug ? document.createElement('a') : document.createElement('button');
      if (!p.slug) node.type = 'button';
      node.className = 'hall-search__hit';
      node.setAttribute('data-hit-index', String(i));
      if (p.slug) node.href = '/characters/' + encodeURIComponent(String(p.slug)) + '/';
      node.innerHTML =
        '<span class="hall-search__hit-name"></span><span class="hall-search__hit-meta"></span>';
      node.querySelector('.hall-search__hit-name').textContent = String(p.name);
      node.querySelector('.hall-search__hit-meta').textContent = meta;
      if (!p.slug) {
        node.addEventListener('click', () => {
          const el = document.querySelector('.member[data-inspect-id="' + String(p.id).replace(/"/g, '') + '"]');
          if (el instanceof HTMLElement) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
      }
      li.appendChild(node);
      hitsEl.appendChild(li);
    });
  }

  function findIsOpen() {
    if (bag.findOpen === true) return true;
    return false;
  }

  function setFindOpen(open) {
    bag.findOpen = open;
    document.documentElement.classList.toggle('find-closed', !open);
    const drawer = document.querySelector('[data-find-drawer]');
    if (drawer) drawer.setAttribute('data-open', open ? 'true' : 'false');
    if (findToggle) findToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    saveBag();
  }

  function bindSearch() {
    if (!searchRoot) return;
    setFindOpen(findIsOpen());
    if (qInput) {
      qInput.value = bag.q;
      qInput.addEventListener('input', () => {
        bag.q = qInput.value;
        saveBag();
        applySearch();
      });
    }
    syncFacetButtons();
    const clearBtn = searchRoot.querySelector('[data-hall-clear]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (qInput) qInput.value = '';
        bag.q = '';
        bag.axes = [];
        bag.tiers = [];
        bag.kinds = [];
        bag.labels = [];
        syncFacetButtons();
        saveBag();
        applySearch();
        applyView();
        if (qInput) qInput.focus();
      });
    }
    searchRoot.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-filter');
        const value = btn.getAttribute('data-value') || '';
        if (key === 'axis') toggleIn(bag.axes, value);
        else if (key === 'tier') toggleIn(bag.tiers, value);
        else if (key === 'kind') toggleIn(bag.kinds, value);
        else if (key === 'label') toggleIn(bag.labels, value);
        else return;
        syncFacetButtons();
        saveBag();
        applySearch();
        applyView();
      });
    });
    if (findToggle) {
      findToggle.addEventListener('click', () => {
        const open = !findIsOpen();
        setFindOpen(open);
        if (open && qInput) qInput.focus();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      const t = e.target;
      const typing =
        t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if ((e.key === '/' || e.key === 'f' || e.key === 'F') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setFindOpen(true);
        if (qInput) qInput.focus();
        return;
      }
      if (e.key === 'Escape' && searchRoot && !searchRoot.hidden) {
        if (activeFilters()) {
          if (qInput) qInput.value = '';
          bag.q = '';
          bag.axes = [];
          bag.tiers = [];
          bag.kinds = [];
          bag.labels = [];
          syncFacetButtons();
          saveBag();
          applySearch();
          applyView();
        } else {
          setFindOpen(false);
        }
        e.preventDefault();
      }
    });
  }

  function hexToHue(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return 0;
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return h;
  }

  async function postFigure(body) {
    const res = await fetch('/api/community/figures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({ error: 'Bad response' }));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function resetFigureForm(form) {
    const kindStep = form.querySelector('[data-step="kind"]');
    const details = form.querySelector('[data-step="details"]');
    const factionField = form.querySelector('[data-add-faction-field]');
    const outsiderInput = form.querySelector('[data-add-outsider]');
    const select = form.querySelector('[name="faction"]');
    const name = form.querySelector('[name="name"]');
    const note = form.querySelector('[data-figure-note]');
    if (kindStep) kindStep.hidden = false;
    if (details) details.hidden = true;
    if (factionField) factionField.hidden = true;
    if (select instanceof HTMLSelectElement) {
      select.disabled = true;
      select.value = '';
    }
    if (outsiderInput) outsiderInput.value = '';
    if (name instanceof HTMLInputElement) name.value = '';
    if (note) note.textContent = 'Kin land Outcast on every axis until the table moves them.';
    form.querySelectorAll('[data-pick-kind]').forEach((b) => b.removeAttribute('aria-pressed'));
  }

  function openRite(name) {
    const rite = document.querySelector('[data-rite="' + name + '"]');
    if (!rite) return;
    if (name === 'figure') {
      const form = rite.querySelector('[data-add-figure-form]');
      if (form) resetFigureForm(form);
    }
    rite.hidden = false;
    requestAnimationFrame(() => rite.setAttribute('data-open', 'true'));
    const first = rite.querySelector('[data-step="kind"] button, input, select');
    if (first instanceof HTMLElement) first.focus();
  }

  function closeRite(rite) {
    if (!rite) return;
    rite.setAttribute('data-open', 'false');
    window.setTimeout(() => {
      if (rite.getAttribute('data-open') === 'false') rite.hidden = true;
    }, 220);
  }

  function bindRites() {
    document.querySelectorAll('[data-rite-open]').forEach((btn) => {
      btn.addEventListener('click', () => openRite(btn.getAttribute('data-rite-open') || ''));
    });
    document.querySelectorAll('[data-rite]').forEach((rite) => {
      rite.querySelectorAll('[data-rite-dismiss]').forEach((btn) => {
        btn.addEventListener('click', () => closeRite(rite));
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('[data-rite][data-open="true"]').forEach((rite) => closeRite(rite));
    });

    const figureForm = document.querySelector('[data-add-figure-form]');
    if (figureForm) {
      const kindStep = figureForm.querySelector('[data-step="kind"]');
      const details = figureForm.querySelector('[data-step="details"]');
      const factionField = figureForm.querySelector('[data-add-faction-field]');
      const outsiderInput = figureForm.querySelector('[data-add-outsider]');
      const note = figureForm.querySelector('[data-figure-note]');
      const msgEl = figureForm.querySelector('[data-add-figure-msg]');
      function setMsg(text, ok) {
        if (!msgEl) return;
        msgEl.hidden = !text;
        msgEl.textContent = text || '';
        msgEl.classList.toggle('rite__msg--err', !ok && !!text);
      }
      figureForm.querySelectorAll('[data-pick-kind]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const kind = btn.getAttribute('data-pick-kind');
          const isOut = kind === 'outsider';
          if (outsiderInput) outsiderInput.value = isOut ? '1' : '';
          if (factionField) factionField.hidden = !isOut;
          const select = figureForm.querySelector('[name="faction"]');
          if (select instanceof HTMLSelectElement) {
            select.disabled = !isOut;
            if (!isOut) select.value = '';
          }
          if (note) {
            note.textContent = isOut
              ? 'Outsiders stay on the porch until inducted.'
              : 'Kin land Outcast on every axis until the table moves them.';
          }
          figureForm.querySelectorAll('[data-pick-kind]').forEach((b) => {
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
          if (kindStep) kindStep.hidden = true;
          if (details) details.hidden = false;
          const name = figureForm.querySelector('[name="name"]');
          if (name instanceof HTMLInputElement) name.focus();
        });
      });
      figureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(figureForm);
        const name = String(fd.get('name') || '').trim();
        const isOut = String(fd.get('outsider') || '') === '1';
        const faction = String(fd.get('faction') || '').trim();
        if (!name) {
          setMsg('Name required.', false);
          return;
        }
        try {
          await postFigure({ name, outsider: isOut, faction: isOut ? faction : undefined });
          location.reload();
        } catch (err) {
          setMsg(err instanceof Error ? err.message : String(err), false);
        }
      });
    }

    const factionForm = document.querySelector('[data-add-faction]');
    if (factionForm) {
      const msgEl = factionForm.querySelector('[data-add-faction-msg]');
      const colorEl = factionForm.querySelector('[name="faction-color"]');
      const bannerBtn = factionForm.querySelector('[data-banner-submit]');
      function paintBanner() {
        if (!(colorEl instanceof HTMLInputElement) || !(bannerBtn instanceof HTMLElement)) return;
        bannerBtn.style.setProperty('--rite-banner', colorEl.value);
      }
      if (colorEl) colorEl.addEventListener('input', paintBanner);
      paintBanner();
      factionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameEl = factionForm.querySelector('[name="faction-name"]');
        const colorEl = factionForm.querySelector('[name="faction-color"]');
        const name = nameEl && 'value' in nameEl ? String(nameEl.value).trim() : '';
        const hue = hexToHue(colorEl && 'value' in colorEl ? String(colorEl.value) : '#8a3030');
        if (!name) return;
        try {
          await postFigure({ kind: 'faction', name, hue });
          location.reload();
        } catch (err) {
          if (msgEl) {
            msgEl.hidden = false;
            msgEl.textContent = err instanceof Error ? err.message : String(err);
            msgEl.classList.add('rite__msg--err');
          }
        }
      });
    }

  }

  // —— Roving tabindex ————————————————————————————————————————————————

  function axisColumns() {
    return [...document.querySelectorAll('.hall__nave .hier-axis')];
  }

  function itemsInAxis(axis) {
    const items = [];
    const head = axis.querySelector('.hier-axis__head');
    if (head) items.push(head);
    axis.querySelectorAll('.hier-rung').forEach((rung) => {
      const rh = rung.querySelector('.hier-rung__head');
      if (rh) items.push(rh);
      if (rung.getAttribute('data-collapsed') !== 'true') {
        rung.querySelectorAll('.member').forEach((m) => items.push(m));
      }
    });
    return items;
  }

  function allRoving() {
    return axisColumns().flatMap(itemsInAxis);
  }

  function currentRoving() {
    const all = allRoving();
    const ae = document.activeElement;
    if (ae && all.includes(ae)) return ae;
    return all.find((n) => n.getAttribute('tabindex') === '0') || all[0] || null;
  }

  function setRovingStop(el) {
    allRoving().forEach((n) => n.setAttribute('tabindex', '-1'));
    if (el) {
      el.setAttribute('tabindex', '0');
    }
  }

  function initRoving() {
    const cols = axisColumns();
    cols.forEach((axis, i) => {
      itemsInAxis(axis).forEach((n) => n.setAttribute('tabindex', '-1'));
      const head = axis.querySelector('.hier-axis__head');
      if (head) head.setAttribute('tabindex', i === 0 ? '0' : '-1');
    });
  }

  function moveRoving(dx, dy) {
    const cols = axisColumns();
    if (cols.length === 0) return;
    const cur = currentRoving();
    if (!cur) return;
    const axis = cur.closest('.hier-axis');
    const colIdx = Math.max(0, cols.indexOf(axis));
    if (dx !== 0) {
      const nextCol = cols[colIdx + dx];
      if (!nextCol) return;
      const items = itemsInAxis(nextCol);
      const tier = (cur.closest('.hier-rung') && cur.closest('.hier-rung').getAttribute('data-tier')) || '';
      let dest =
        (tier &&
          items.find(
            (n) =>
              n.classList.contains('hier-rung__head') &&
              n.closest('.hier-rung') &&
              n.closest('.hier-rung').getAttribute('data-tier') === tier,
          )) ||
        items[0];
      if (!dest) return;
      setRovingStop(dest);
      dest.focus();
      return;
    }
    const items = itemsInAxis(axis || cols[colIdx]);
    const idx = items.indexOf(cur);
    const dest = items[idx + dy];
    if (!dest) return;
    setRovingStop(dest);
    dest.focus();
  }

  const nave = document.querySelector('.hall__nave');
  if (nave) {
    nave.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveRoving(0, 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveRoving(0, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveRoving(1, 0);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveRoving(-1, 0);
      }
    });
    nave.addEventListener('focusin', (e) => {
      const host = e.target.closest('.hier-axis__head, .hier-rung__head, .member');
      if (host && nave.contains(host)) setRovingStop(host);
    });
  }

  // —— Collapse persist after layout toggle ————————————————————————————

  function bindRungPersist() {
    hall.addEventListener(
      'click',
      (e) => {
        const head = e.target.closest('[data-rung-toggle]');
        if (!head || !hall.contains(head)) return;
        const rung = head.closest('.hier-rung, .rung');
        if (!rung) return;
        if (rung.getAttribute('data-pending') === 'true') {
          e.stopPropagation();
          setCollapsed(rung, false);
          persistCollapse();
        }
      },
      true,
    );
    document.querySelectorAll('.hall [data-rung-toggle]').forEach((head) => {
      head.addEventListener('click', () => {
        const rung = head.closest('.hier-rung, .rung');
        if (!rung) return;
        if (rung.getAttribute('data-pending') === 'true') setCollapsed(rung, false);
        persistCollapse();
      });
    });
  }

  // —— Live poll ——————————————————————————————————————————————————————

  const source = hall.getAttribute('data-source') || '';
  const founded = hall.getAttribute('data-founded') || '';
  const banner = document.getElementById('kod-hall-banner');
  let lastRev = null;
  let timer = null;
  let abort = null;

  function stopPoll() {
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
    if (abort) {
      abort.abort();
      abort = null;
    }
  }

  function onRevChanged(rev) {
    lastRev = rev;
    location.reload();
  }

  async function tick() {
    if (abort) abort.abort();
    abort = new AbortController();
    try {
      const res = await fetch('/api/community/rev', {
        cache: 'no-store',
        signal: abort.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || typeof data.rev !== 'string') return;
      if (lastRev == null) {
        lastRev = data.rev;
        return;
      }
      if (data.rev !== lastRev) onRevChanged(data.rev);
    } catch (e) {
      if (e && e.name !== 'AbortError') console.warn('hall rev poll failed');
    }
  }

  function startPoll() {
    stopPoll();
    if (document.visibilityState !== 'visible') return;
    timer = setInterval(tick, POLL_MS);
  }

  function bindPoll() {
    if (source !== 'live' || !founded) return;
    if (banner) banner.addEventListener('click', () => location.reload());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') startPoll();
      else stopPoll();
    });
    if (document.visibilityState === 'visible') startPoll();
  }

  let hoverId = '';

  function applyView() {
    const selected = new Set(bag.labels || []);
    const viewGroup = bag.viewGroup || 'g-faction';
    hall.setAttribute('data-view-group', viewGroup);
    if (selected.size) hall.setAttribute('data-view-labels', [...selected].join(' '));
    else hall.removeAttribute('data-view-labels');
    if (hoverId) hall.setAttribute('data-legend-hover', hoverId);
    else hall.removeAttribute('data-legend-hover');

    document.querySelectorAll('[data-view-group]').forEach((btn) => {
      if (!btn.classList.contains('view-stave__cat')) return;
      const id = btn.getAttribute('data-view-group') || '';
      btn.setAttribute('aria-pressed', id === viewGroup ? 'true' : 'false');
    });
    document.querySelectorAll('[data-legend-group]').forEach((el) => {
      const id = el.getAttribute('data-legend-group') || '';
      el.hidden = id !== viewGroup;
    });

    document.querySelectorAll('.hall-legend__item').forEach((btn) => {
      const id = btn.getAttribute('data-label-id') || '';
      btn.setAttribute('aria-pressed', selected.has(id) ? 'true' : 'false');
    });

    document.querySelectorAll('.member[data-inspect-id]').forEach((el) => {
      const ids = labelIdsOf(el);
      const painted = ids.map(labelById).find((l) => l && l.groupId === viewGroup);
      if (painted && painted.hue != null) {
        el.style.setProperty('--view-h', String(painted.hue));
        el.setAttribute('data-view-faction', painted.id);
      } else {
        el.style.removeProperty('--view-h');
        el.removeAttribute('data-view-faction');
      }
      if (selected.size) {
        el.setAttribute('data-view', ids.some((id) => selected.has(id)) ? 'hit' : 'rest');
      } else {
        el.removeAttribute('data-view');
      }
      if (hoverId) {
        el.setAttribute('data-hover', ids.includes(hoverId) ? 'hit' : 'rest');
      } else {
        el.removeAttribute('data-hover');
      }
    });

    const axis = bag.axis || '';
    if (axis) hall.setAttribute('data-focus-axis', axis);
    else hall.removeAttribute('data-focus-axis');
    document.querySelectorAll('.hier-axis').forEach((col) => {
      const key = col.getAttribute('data-axis') || '';
      const on = Boolean(axis) && key === axis;
      col.classList.toggle('hier-axis--rest', Boolean(axis) && !on);
      const head = col.querySelector('[data-axis-focus]');
      if (head) head.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function setHover(id) {
    hoverId = id || '';
    applyView();
  }

  function bindLegend() {
    const root = document.querySelector('[data-hall-legend]');
    if (root) {
      root.querySelectorAll('.view-stave__cat').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-view-group') || '';
          if (!id) return;
          bag.viewGroup = id;
          saveBag();
          applyView();
        });
      });
      root.querySelectorAll('[data-label-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-label-id') || '';
          if (!id) return;
          toggleIn(bag.labels, id);
          syncFacetButtons();
          saveBag();
          applyView();
          applySearch();
        });
        btn.addEventListener('mouseenter', () => setHover(btn.getAttribute('data-label-id') || ''));
        btn.addEventListener('mouseleave', () => setHover(''));
        btn.addEventListener('focus', () => setHover(btn.getAttribute('data-label-id') || ''));
        btn.addEventListener('blur', () => setHover(''));
      });
    }
    document.querySelectorAll('.member .mark[data-label-id]').forEach((mark) => {
      mark.addEventListener('mouseenter', () => setHover(mark.getAttribute('data-label-id') || ''));
      mark.addEventListener('mouseleave', () => setHover(''));
    });
    document.querySelectorAll('[data-filter="label"]').forEach((btn) => {
      btn.addEventListener('mouseenter', () => setHover(btn.getAttribute('data-value') || ''));
      btn.addEventListener('mouseleave', () => setHover(''));
    });
    applyView();
  }

  function bindAxisFocus() {
    document.querySelectorAll('[data-axis-focus]').forEach((head) => {
      head.addEventListener('click', (e) => {
        if (e.target.closest('[data-rung-toggle]')) return;
        const key = head.getAttribute('data-axis-focus') || '';
        bag.axis = bag.axis === key ? '' : key;
        saveBag();
        applyView();
      });
    });
  }

  function boot() {
    loadBag();
    restoreCollapse();
    bindRungPersist();
    bindSearch();
    bindRites();
    bindLegend();
    bindAxisFocus();
    applySearch();
    initRoving();
    bindPoll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
