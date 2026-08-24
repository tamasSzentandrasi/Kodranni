/**
 * Hall-only: inspect drawer, nave search, collapse persist, roving tabindex, rev poll.
 * Loaded from community/index.astro — not CampaignLayout. No founding handlers.
 */
(function () {
  const hall = document.querySelector('.hall');
  if (!hall) return;

  const slug = hall.getAttribute('data-slug') || 'hall';
  const storageKey = 'kod-hall:' + slug;
  const POLL_MS = 8000;

  /** @type {{ q: string, collapse: Record<string, boolean> }} */
  let bag = { q: '', collapse: {} };

  function loadBag() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      bag.q = typeof parsed.q === 'string' ? parsed.q : '';
      bag.collapse =
        parsed.collapse && typeof parsed.collapse === 'object' ? parsed.collapse : {};
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
    if (chev) chev.textContent = collapsed ? '▸' : '▾';
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

  // —— Inspect drawer ————————————————————————————————————————————————

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

  const drawer = document.getElementById('kod-inspect');
  const panel = document.getElementById('kod-inspect-panel');
  const titleEl = document.getElementById('kod-inspect-title');
  const bodyEl = document.getElementById('kod-inspect-body');
  const closeBtn = drawer && drawer.querySelector('[data-inspect-close]');
  let inspectReturn = null;

  function inspectOpen() {
    return drawer && drawer.getAttribute('data-open') === 'true';
  }

  function hideTip() {
    const tip = document.getElementById('kod-tip');
    if (tip) tip.hidden = true;
  }

  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function fillInspect(person) {
    if (!titleEl || !bodyEl) return;
    titleEl.textContent = person.name || 'Inspect';
    bodyEl.replaceChildren();

    const kicker = el('p', 'kod-drawer__kicker');
    const bits = [];
    if (person.ruler) bits.push('Ruler');
    if (person.pc) bits.push('PC');
    else if (person.kind === 'outsider') bits.push('Outsider');
    else bits.push('NPC');
    kicker.textContent = bits.join(' · ');
    bodyEl.appendChild(kicker);

    if (person.faction) {
      const fac = el('p', 'kod-drawer__faction', 'Faction: ' + person.faction);
      bodyEl.appendChild(fac);
    }

    const who = el('blockquote', 'kod-drawer__who');
    const quote = person.whoWeSee ? String(person.whoWeSee) : 'No who-we-see yet.';
    who.textContent = quote;
    bodyEl.appendChild(who);

    if (person.kind === 'outsider') {
      bodyEl.appendChild(el('p', 'kod-drawer__note', 'Not on a ladder.'));
    }

    const placements = Array.isArray(person.placements) ? person.placements : [];
    const pending = Array.isArray(person.pending) ? person.pending : [];
    if (placements.length || pending.length) {
      const list = el('ul', 'kod-drawer__places');
      const pendingByAxis = new Map();
      for (const mv of pending) {
        pendingByAxis.set(mv.axis, mv);
      }
      const seen = new Set();
      for (const pl of placements) {
        seen.add(pl.axis);
        const li = el('li', '');
        const mv = pendingByAxis.get(pl.axis);
        if (mv && mv.fromTier === pl.tier) {
          li.textContent =
            pl.axis + ': ' + pl.tier + ' → ' + mv.toTier + ' (pending)';
        } else if (mv) {
          li.textContent =
            pl.axis +
            ': ' +
            pl.tier +
            ' · pending: ' +
            mv.fromTier +
            ' → ' +
            mv.toTier;
        } else {
          li.textContent = pl.axis + ': ' + pl.tier;
        }
        list.appendChild(li);
      }
      for (const mv of pending) {
        if (seen.has(mv.axis)) continue;
        const li = el('li', '');
        li.textContent = 'pending: ' + mv.fromTier + ' → ' + mv.toTier + ' (' + mv.axis + ')';
        list.appendChild(li);
      }
      bodyEl.appendChild(list);
    }

    if (person.slug) {
      const a = el('a', 'kod-drawer__sheet', 'Open sheet');
      a.href = '/characters/' + encodeURIComponent(String(person.slug)) + '/';
      bodyEl.appendChild(a);
    }
  }

  function tabbables() {
    if (!panel) return [];
    return [...panel.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')].filter(
      (n) => !n.hasAttribute('disabled') && n.tabIndex !== -1 && n.offsetParent !== null,
    );
  }

  function openInspect(fromEl) {
    const id = fromEl.getAttribute('data-inspect-id');
    const person = (id && people.get(id)) || people.get((fromEl.getAttribute('data-name') || '').toLowerCase());
    if (!person || !drawer) return;
    inspectReturn = fromEl;
    fillInspect(person);
    drawer.hidden = false;
    drawer.setAttribute('data-open', 'true');
    hideTip();
    const focusTarget = closeBtn || panel;
    if (focusTarget) focusTarget.focus();
  }

  function closeInspect() {
    if (!drawer) return;
    drawer.setAttribute('data-open', 'false');
    drawer.hidden = true;
    const back = inspectReturn;
    inspectReturn = null;
    if (back && typeof back.focus === 'function') back.focus();
  }

  function onInspectClick(e) {
    if (e.target.closest('.info, [data-rung-toggle]')) return;
    const host = e.target.closest('[data-inspect-id]');
    if (!host) return;
    e.preventDefault();
    openInspect(host);
  }

  function onInspectKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('[data-rung-toggle], .hall-search, .kod-btn, a.kod-drawer__sheet')) return;
    const host = e.target.closest('[data-inspect-id]');
    if (!host || e.target !== host) return;
    e.preventDefault();
    openInspect(host);
  }

  document.addEventListener('click', onInspectClick);
  document.addEventListener('keydown', onInspectKey);

  if (closeBtn) closeBtn.addEventListener('click', () => closeInspect());
  const dismiss = drawer && drawer.querySelector('[data-inspect-dismiss]');
  if (dismiss) dismiss.addEventListener('click', () => closeInspect());

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !inspectOpen()) return;
    e.preventDefault();
    closeInspect();
  });

  if (panel) {
    panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !inspectOpen()) return;
      const list = tabbables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // —— Search ————————————————————————————————————————————————————————

  const searchRoot = document.querySelector('[data-hall-search]');
  const qInput = document.querySelector('[data-hall-q]');
  const hitsEl = document.querySelector('[data-hall-hits]');
  const filters = { axis: '', tier: '', kind: '', faction: '' };

  function activeFilters() {
    return Boolean(
      filters.axis ||
        filters.tier ||
        filters.kind ||
        filters.faction ||
        (qInput && qInput.value.trim()),
    );
  }

  function kindOf(el) {
    return el.getAttribute('data-kind') || (el.classList.contains('member--pc') ? 'pc' : 'npc');
  }

  function chipMatch(el) {
    const name = (el.getAttribute('data-name') || el.textContent || '').toLowerCase();
    const q = (qInput && qInput.value.trim().toLowerCase()) || '';
    const axisEl = el.closest('.hier-axis');
    const rung = el.closest('.hier-rung');
    const elAxis = (axisEl && axisEl.getAttribute('data-axis-name')) || '';
    const elTier = (rung && rung.getAttribute('data-tier')) || '';
    const elFaction = el.getAttribute('data-faction') || '';
    const kind = kindOf(el);
    if (q && !name.includes(q)) return false;
    if (filters.axis && elAxis !== filters.axis) return false;
    if (filters.tier && elTier !== filters.tier) return false;
    if (filters.kind === 'pc' && kind !== 'pc') return false;
    if (filters.kind === 'npc' && kind === 'pc') return false;
    if (filters.faction && elFaction !== filters.faction) return false;
    return true;
  }

  function personMatches(p) {
    const q = (qInput && qInput.value.trim().toLowerCase()) || '';
    if (q && !String(p.name || '').toLowerCase().includes(q)) return false;
    if (filters.kind === 'pc' && !p.pc) return false;
    if (filters.kind === 'npc' && p.pc) return false;
    if (filters.faction && (p.faction || '') !== filters.faction) return false;
    if (filters.axis || filters.tier) {
      const places = Array.isArray(p.placements) ? p.placements : [];
      const hit = places.some(
        (pl) =>
          (!filters.axis || pl.axis === filters.axis) &&
          (!filters.tier || pl.tier === filters.tier),
      );
      if (!hit) return false;
    }
    return true;
  }

  function applySearch() {
    const on = activeFilters();
    if (hall) {
      if (filters.faction) hall.setAttribute('data-preview-faction', filters.faction);
      else hall.removeAttribute('data-preview-faction');
    }
    document.querySelectorAll('.member[data-inspect-id], .outsider[data-inspect-id]').forEach((el) => {
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

    if (!hitsEl) return;
    hitsEl.replaceChildren();
    if (!on) {
      hitsEl.hidden = true;
      return;
    }
    const seen = new Set();
    const hits = [];
    people.forEach((p, key) => {
      if (seen.has(p)) return;
      if (key !== p.id) return;
      seen.add(p);
      if (personMatches(p)) hits.push(p);
    });
    if (hits.length === 0) {
      hitsEl.hidden = true;
      return;
    }
    hitsEl.hidden = false;
    for (const p of hits) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hall-search__hit';
      const tag = p.kind === 'outsider' ? ' (outsider)' : p.pc ? '' : ' (named)';
      btn.textContent = p.name + tag;
      btn.setAttribute('data-inspect-id', p.id);
      btn.setAttribute('data-name', p.name);
      li.appendChild(btn);
      hitsEl.appendChild(li);
    }
  }

  function bindSearch() {
    if (!searchRoot) return;
    if (qInput) {
      qInput.value = bag.q;
      qInput.addEventListener('input', () => {
        bag.q = qInput.value;
        saveBag();
        applySearch();
      });
    }
    const clearBtn = searchRoot.querySelector('[data-hall-clear]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (qInput) qInput.value = '';
        bag.q = '';
        filters.axis = '';
        filters.tier = '';
        filters.kind = '';
        filters.faction = '';
        searchRoot.querySelectorAll('[data-filter]').forEach((btn) => {
          btn.setAttribute('aria-pressed', 'false');
        });
        saveBag();
        applySearch();
        if (qInput) qInput.focus();
      });
    }
    searchRoot.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-filter');
        const value = btn.getAttribute('data-value') || '';
        if (!key || !(key in filters)) return;
        const on = filters[key] === value;
        filters[key] = on ? '' : value;
        searchRoot.querySelectorAll('[data-filter="' + key + '"]').forEach((b) => {
          b.setAttribute('aria-pressed', b.getAttribute('data-value') === filters[key] ? 'true' : 'false');
        });
        applySearch();
      });
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

    document.querySelectorAll('[data-preview-faction]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-preview-faction') || '';
        const on = hall && hall.getAttribute('data-preview-faction') === value;
        const next = on ? '' : value;
        if (hall) {
          if (next) hall.setAttribute('data-preview-faction', next);
          else hall.removeAttribute('data-preview-faction');
        }
        document.querySelectorAll('[data-preview-faction]').forEach((b) => {
          b.setAttribute(
            'aria-pressed',
            b.getAttribute('data-preview-faction') === next ? 'true' : 'false',
          );
        });
        document.querySelectorAll('.outsider[data-inspect-id]').forEach((el) => {
          if (!next) {
            el.removeAttribute('data-search');
            return;
          }
          el.setAttribute('data-search', el.getAttribute('data-faction') === next ? 'hit' : 'miss');
        });
      });
    });
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
      if (inspectOpen()) return;
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
    if (inspectOpen()) {
      if (banner) banner.hidden = false;
      return;
    }
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

  function boot() {
    loadBag();
    restoreCollapse();
    bindRungPersist();
    bindSearch();
    bindRites();
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
