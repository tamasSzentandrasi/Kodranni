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

  /** @type {{ q: string, collapse: Record<string, boolean>, group: string, labels: string[], axis: string }} */
  let bag = { q: '', collapse: {}, group: 'g-faction', labels: [], axis: '' };

  function loadBag() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      bag.q = typeof parsed.q === 'string' ? parsed.q : '';
      bag.collapse =
        parsed.collapse && typeof parsed.collapse === 'object' ? parsed.collapse : {};
      bag.group = typeof parsed.group === 'string' && parsed.group ? parsed.group : 'g-faction';
      bag.labels = Array.isArray(parsed.labels) ? parsed.labels.map(String) : [];
      bag.axis = typeof parsed.axis === 'string' ? parsed.axis : '';
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

  // —— Search ————————————————————————————————————————————————————————

  const searchRoot = document.querySelector('[data-hall-search]');
  const qInput = document.querySelector('[data-hall-q]');
  const hitsEl = document.querySelector('[data-hall-hits]');
  const filters = { axis: '', tier: '', kind: '' };

  function activeFilters() {
    return Boolean(
      filters.axis || filters.tier || filters.kind || (qInput && qInput.value.trim()),
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
    const kind = kindOf(el);
    if (q && !name.includes(q)) return false;
    if (filters.axis && elAxis !== filters.axis) return false;
    if (filters.tier && elTier !== filters.tier) return false;
    if (filters.kind === 'pc' && kind !== 'pc') return false;
    if (filters.kind === 'npc' && kind === 'pc') return false;
    return true;
  }

  function personMatches(p) {
    const q = (qInput && qInput.value.trim().toLowerCase()) || '';
    if (q && !String(p.name || '').toLowerCase().includes(q)) return false;
    if (filters.kind === 'pc' && !p.pc) return false;
    if (filters.kind === 'npc' && p.pc) return false;
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
      const firstHit = document.querySelector('[data-search="hit"]');
      if (firstHit instanceof HTMLElement) {
        firstHit.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
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
      const tag = p.kind === 'outsider' ? ' (outsider)' : p.pc ? '' : ' (npc)';
      const label = p.name + tag;
      if (p.slug) {
        const a = document.createElement('a');
        a.className = 'hall-search__hit';
        a.href = '/characters/' + encodeURIComponent(String(p.slug)) + '/';
        a.textContent = label;
        li.appendChild(a);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hall-search__hit';
        btn.textContent = label;
        btn.setAttribute('data-name', p.name);
        btn.addEventListener('click', () => {
          const el = document.querySelector(
            '.member[data-name="' +
              String(p.name).replace(/"/g, '') +
              '"], .outsider[data-name="' +
              String(p.name).replace(/"/g, '') +
              '"]',
          );
          if (el instanceof HTMLElement) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
        li.appendChild(btn);
      }
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

  function labelIdsOf(el) {
    return (el.getAttribute('data-label-ids') || '').split(/\s+/).filter(Boolean);
  }

  function applyView() {
    const group = bag.group || 'g-faction';
    const selected = new Set(bag.labels || []);
    hall.setAttribute('data-view-group', group);
    if (selected.size) hall.setAttribute('data-view-labels', [...selected].join(' '));
    else hall.removeAttribute('data-view-labels');

    document.querySelectorAll('[data-aspect-group]').forEach((tab) => {
      const on = tab.getAttribute('data-aspect-group') === group;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-aspect-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-aspect-panel') !== group;
    });
    document.querySelectorAll('[data-label-id]').forEach((btn) => {
      const id = btn.getAttribute('data-label-id') || '';
      btn.setAttribute('aria-pressed', selected.has(id) ? 'true' : 'false');
    });

    document.querySelectorAll('.member[data-inspect-id]').forEach((el) => {
      const ids = labelIdsOf(el);
      if (!selected.size) {
        el.removeAttribute('data-view');
        return;
      }
      const hit = ids.some((id) => selected.has(id));
      el.setAttribute('data-view', hit ? 'hit' : 'rest');
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

  function bindAspects() {
    const root = document.querySelector('[data-hall-aspects]');
    if (!root) return;
    root.querySelectorAll('[data-aspect-group]').forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-aspect-group') || '';
        if (!id) return;
        bag.group = id;
        bag.labels = [];
        saveBag();
        applyView();
      });
    });
    root.querySelectorAll('[data-label-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-label-id') || '';
        if (!id) return;
        const i = bag.labels.indexOf(id);
        if (i >= 0) bag.labels.splice(i, 1);
        else bag.labels.push(id);
        saveBag();
        applyView();
      });
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
    bindAspects();
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
