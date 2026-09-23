/**
 * Hall: Find spotlight, Factions/Tags light, tab-rides-panel drawers, rev poll.
 * Loaded from community/index.astro — not CampaignLayout.
 */
(function () {
  const hall = document.querySelector('.hall');
  if (!hall) return;

  const slug = hall.getAttribute('data-slug') || 'hall';
  const storageKey = 'kod-hall:' + slug;
  const POLL_MS = 8000;
  const TAG_GROUP = 'g-tag';
  const COUNT_WORDS = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
  ];

  /** @type {{ q: string, kind: string, id: string, findFaction: string, findGroup: string, kinds: string[], open: string }} */
  let bag = { q: '', kind: 'none', id: '', findFaction: '', findGroup: '', kinds: [], open: '' };

  function loadBag() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      bag.q = typeof parsed.q === 'string' ? parsed.q : '';
      bag.kind =
        parsed.kind === 'category' ||
        parsed.kind === 'faction' ||
        parsed.kind === 'tag' ||
        parsed.kind === 'find'
          ? parsed.kind
          : 'none';
      bag.id = typeof parsed.id === 'string' ? parsed.id : '';
      bag.findFaction = typeof parsed.findFaction === 'string' ? parsed.findFaction : '';
      bag.findGroup = typeof parsed.findGroup === 'string' ? parsed.findGroup : '';
      bag.kinds = Array.isArray(parsed.kinds) ? parsed.kinds.map(String) : [];
      bag.open = typeof parsed.open === 'string' ? parsed.open : '';
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

  function groupById(id) {
    return catalogGroups.find((g) => g.id === id);
  }

  function labelIdsOf(el) {
    return (el.getAttribute('data-label-ids') || '').split(/\s+/).filter(Boolean);
  }

  function factionLabels(ids) {
    return ids
      .map(labelById)
      .filter((l) => l && l.groupId !== TAG_GROUP && l.hue != null);
  }

  function tokens(q) {
    return String(q || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  function nameHay(el) {
    return (el.getAttribute('data-name') || '').toLowerCase();
  }

  function nameOk(el) {
    const ts = tokens(bag.q);
    if (!ts.length) return true;
    const hay = nameHay(el);
    return ts.every((t) => hay.includes(t));
  }

  function personKind(el) {
    const k = el.getAttribute('data-kind') || '';
    if (k === 'outsider' || el.classList.contains('member--outsider')) return 'outsider';
    if (k === 'pc' || el.classList.contains('member--pc')) return 'pc';
    return 'npc';
  }

  function kindOk(el) {
    if (!bag.kinds.length) return true;
    return bag.kinds.includes(personKind(el));
  }

  function stainStops(list) {
    return list
      .map((l, i) => {
        const a = (i / list.length) * 100;
        const b = ((i + 1) / list.length) * 100;
        return 'hsl(' + l.hue + ' 55% 48%) ' + a + '% ' + b + '%';
      })
      .join(', ');
  }

  function clearPaint(el) {
    el.removeAttribute('data-stain');
    el.removeAttribute('data-lit');
    el.removeAttribute('data-view');
    el.style.removeProperty('--stain');
    el.style.removeProperty('--lit-h');
    el.style.removeProperty('--lit-s');
  }

  function paintStain(el, list) {
    if (!list.length) return;
    el.style.setProperty('--stain', stainStops(list));
    el.setAttribute('data-stain', '');
  }

  function paintLit(el, hue, sat) {
    el.style.setProperty('--lit-h', String(hue == null ? 40 : hue));
    el.style.setProperty('--lit-s', String(sat == null ? 70 : sat) + '%');
    el.setAttribute('data-lit', '');
  }

  function hallMembers() {
    return [...document.querySelectorAll('.hall .member[data-inspect-id]')];
  }

  function uniqueHits(pred) {
    const seen = new Set();
    const hits = [];
    hallMembers().forEach((el) => {
      const id = el.getAttribute('data-inspect-id') || '';
      if (!id || seen.has(id)) return;
      if (!pred(el)) return;
      seen.add(id);
      hits.push({
        id,
        name: el.getAttribute('data-name') || '',
        el,
      });
    });
    return hits;
  }

  function countPhrase(n) {
    const word = n < COUNT_WORDS.length ? COUNT_WORDS[n] : String(n);
    return word + ' in the hall';
  }

  function setCatchword(text) {
    const line = document.querySelector('[data-catchword]');
    const span = document.querySelector('[data-catchword-text]');
    if (!line || !span) return;
    span.textContent = text || '';
    line.setAttribute('data-empty', text ? 'false' : 'true');
  }

  function fillRoster(host, hits) {
    if (!host) return;
    host.replaceChildren();
    if (!hits || hits.length < 3) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    hits.forEach((h) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'member member--drawer';
      b.setAttribute('data-jump', h.id);
      b.innerHTML =
        '<span class="member__stain" aria-hidden="true"></span><span class="member__glow" aria-hidden="true"></span><span class="member__name"></span>';
      b.querySelector('.member__name').textContent = h.name;
      b.addEventListener('click', () => {
        const el = document.querySelector(
          '.hall .member[data-inspect-id="' + String(h.id).replace(/"/g, '') + '"]',
        );
        if (el instanceof HTMLElement) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      host.appendChild(b);
    });
  }

  function clearView() {
    bag.kind = 'none';
    bag.id = '';
    bag.q = '';
    bag.findFaction = '';
    bag.findGroup = '';
    bag.kinds = [];
    if (qInput) qInput.value = '';
    saveBag();
    applyView();
  }

  function syncAllegiance(root, groupId, factionId) {
    if (!root) return;
    root.querySelectorAll('.allegiance__cat').forEach((cat) => {
      const gid = cat.getAttribute('data-faction-cat') || '';
      const open = Boolean(groupId) && gid === groupId;
      cat.hidden = Boolean(groupId) && !open;
      const pick = cat.querySelector('.allegiance__pick');
      const list = cat.querySelector('[data-faction-list]');
      if (pick) pick.setAttribute('aria-pressed', open ? 'true' : 'false');
      if (list) list.hidden = !open;
    });
    root.querySelectorAll('[data-faction-id]').forEach((btn) => {
      const fid = btn.getAttribute('data-faction-id') || '';
      const on = Boolean(factionId) && fid === factionId;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        const lab = labelById(fid);
        paintLit(btn, lab && lab.hue != null ? lab.hue : 40, 85);
      } else {
        btn.removeAttribute('data-lit');
        btn.style.removeProperty('--lit-h');
        btn.style.removeProperty('--lit-s');
      }
    });
  }

  function applyView() {
    const kind = bag.kind;
    const id = bag.id;
    const findFaction = bag.findFaction;
    const findGroup = bag.findGroup;
    const qOn = tokens(bag.q).length > 0;
    const findOn = kind === 'find' && (qOn || Boolean(findFaction) || Boolean(findGroup));

    const legend = document.querySelector('[data-hall-legend]');
    const findTree = document.querySelector('[data-find-tree]');
    if (kind === 'category') syncAllegiance(legend, id, '');
    else if (kind === 'faction') {
      const lab = labelById(id);
      syncAllegiance(legend, lab ? lab.groupId : '', id);
    } else syncAllegiance(legend, '', '');
    if (kind === 'find') syncAllegiance(findTree, findGroup, findFaction);
    else syncAllegiance(findTree, '', '');

    document.querySelectorAll('.tag-row').forEach((row) => {
      const tid = row.getAttribute('data-tag-id') || '';
      row.setAttribute('aria-pressed', kind === 'tag' && tid === id ? 'true' : 'false');
    });

    let catchText = '';

    hallMembers().forEach((el) => {
      if (el.closest('.kod-slide')) return;
      clearPaint(el);
      const ids = labelIdsOf(el);

      if (kind === 'category') {
        const painted = factionLabels(ids).filter((l) => l.groupId === id);
        const hit = painted.length > 0;
        el.setAttribute('data-view', hit ? 'hit' : 'rest');
        if (hit) paintStain(el, painted);
        return;
      }

      if (kind === 'faction') {
        const lab = labelById(id);
        const hit = ids.includes(id);
        el.setAttribute('data-view', hit ? 'hit' : 'rest');
        if (hit && lab && lab.hue != null) {
          paintStain(el, [lab]);
          paintLit(el, lab.hue, 85);
        }
        return;
      }

      if (kind === 'tag') {
        const hit = ids.includes(id);
        el.setAttribute('data-view', hit ? 'hit' : 'rest');
        if (hit) paintLit(el, 40, 12);
        return;
      }

      if (findOn) {
        const nameHit = nameOk(el);
        let allegianceHit = true;
        if (findFaction) allegianceHit = ids.includes(findFaction);
        else if (findGroup) allegianceHit = factionLabels(ids).some((l) => l.groupId === findGroup);
        const hit = nameHit && allegianceHit;
        el.setAttribute('data-view', hit ? 'hit' : 'rest');
        if (!hit) return;
        if (findFaction) {
          const lab = labelById(findFaction);
          if (lab && lab.hue != null) {
            paintStain(el, [lab]);
            paintLit(el, lab.hue, 85);
          } else {
            paintLit(el, 40, 12);
          }
        } else if (findGroup) {
          const painted = factionLabels(ids).filter((l) => l.groupId === findGroup);
          if (painted.length) paintStain(el, painted);
          paintLit(el, painted[0] && painted[0].hue != null ? painted[0].hue : 40, painted.length ? 85 : 12);
        } else {
          paintLit(el, 40, 12);
        }
      }
    });

    if (kind === 'category') {
      const g = groupById(id);
      catchText = g ? g.name : '';
    } else if (kind === 'faction') {
      const lab = labelById(id);
      catchText = lab ? lab.name : '';
    } else if (kind === 'tag') {
      const lab = labelById(id);
      catchText = lab ? lab.name : '';
    } else if (findOn) {
      const bits = [];
      if (qOn) bits.push('“' + bag.q.trim() + '”');
      if (findFaction) {
        const lab = labelById(findFaction);
        if (lab) bits.push(lab.name);
      } else if (findGroup) {
        const g = groupById(findGroup);
        if (g) bits.push(g.name);
      }
      catchText = bits.join(' · ');
    }

    setCatchword(catchText);
    requestAnimationFrame(fitSlides);
  }

  function setKind(kind, id) {
    bag.kind = kind;
    bag.id = id || '';
    if (kind !== 'find') {
      bag.q = '';
      bag.findFaction = '';
      bag.findGroup = '';
      bag.kinds = [];
      if (qInput) qInput.value = '';
    }
    saveBag();
    applyView();
  }

  const qInput = document.querySelector('[data-hall-q]');

  function setSlideOpen(id, open) {
    document.querySelectorAll('.kod-rail [data-slide]').forEach((el) => {
      const mine = el.getAttribute('data-slide') === id && open;
      el.setAttribute('data-open', mine ? 'true' : 'false');
    });
    document.querySelectorAll('[data-slide-toggle]').forEach((btn) => {
      const mine = btn.getAttribute('data-slide-toggle') === id && open;
      btn.setAttribute('aria-expanded', mine ? 'true' : 'false');
    });
    bag.open = open ? id : '';
    saveBag();
    requestAnimationFrame(fitSlides);
  }

  function bindSlides() {
    document.querySelectorAll('[data-slide-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-slide-toggle') || '';
        const slide = document.querySelector('.kod-rail [data-slide="' + id + '"]');
        const open = !(slide && slide.getAttribute('data-open') === 'true');
        setSlideOpen(id, open);
        if (open && id === 'find' && qInput) qInput.focus();
      });
    });
    if (bag.open) setSlideOpen(bag.open, true);
  }

  function findActive() {
    return Boolean(tokens(bag.q).length || bag.findFaction || bag.findGroup);
  }

  function scrollToDiagram() {
    const el = document.querySelector('.kod-hier-diagram') || document.querySelector('.hall__hier');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fitSlides() {
    const factions = document.querySelector('.kod-rail [data-slide="factions"]');
    const tags = document.querySelector('.kod-rail [data-slide="tags"]');
    if (factions && tags) {
      const gap = 10;
      tags.style.top = Math.round(factions.getBoundingClientRect().bottom + gap) + 'px';
    }
  }

  function bindFactions() {
    document.querySelectorAll('[data-hall-legend] [data-view-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gid = btn.getAttribute('data-view-group') || '';
        if (!gid) return;
        const lab = bag.kind === 'faction' ? labelById(bag.id) : null;
        if (lab && lab.groupId === gid) setKind('category', gid);
        else if (bag.kind === 'category' && bag.id === gid) setKind('none', '');
        else setKind('category', gid);
      });
    });
    document.querySelectorAll('[data-hall-legend] [data-faction-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fid = btn.getAttribute('data-faction-id') || '';
        if (!fid) return;
        if (bag.kind === 'faction' && bag.id === fid) {
          const lab = labelById(fid);
          setKind('category', lab ? lab.groupId : '');
        } else setKind('faction', fid);
      });
    });
  }

  function bindTags() {
    document.querySelectorAll('[data-tag-list] .tag-row').forEach((row) => {
      row.addEventListener('click', () => {
        const tid = row.getAttribute('data-tag-id') || '';
        if (!tid) return;
        if (bag.kind === 'tag' && bag.id === tid) setKind('none', '');
        else setKind('tag', tid);
      });
    });
  }

  function bindFind() {
    if (qInput) {
      qInput.value = bag.q;
      qInput.addEventListener('input', () => {
        bag.q = qInput.value;
        bag.kind = findActive() || tokens(bag.q).length ? 'find' : 'none';
        if (bag.kind === 'find') bag.id = '';
        saveBag();
        applyView();
      });
    }
    document.querySelectorAll('[data-find-tree] [data-view-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gid = btn.getAttribute('data-view-group') || '';
        if (!gid) return;
        if (bag.findGroup === gid && !bag.findFaction) bag.findGroup = '';
        else {
          bag.findGroup = gid;
          bag.findFaction = '';
        }
        bag.kind = findActive() ? 'find' : 'none';
        bag.id = '';
        saveBag();
        applyView();
      });
    });
    document.querySelectorAll('[data-find-tree] [data-faction-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fid = btn.getAttribute('data-faction-id') || '';
        if (!fid) return;
        bag.findFaction = bag.findFaction === fid ? '' : fid;
        if (bag.findFaction) {
          const lab = labelById(fid);
          if (lab) bag.findGroup = lab.groupId;
        }
        bag.kind = findActive() ? 'find' : 'none';
        bag.id = '';
        saveBag();
        applyView();
      });
    });
    document.querySelectorAll('[data-catchword-clear]').forEach((btn) => {
      btn.addEventListener('click', () => clearView());
    });
    document.querySelectorAll('.kod-rail .kod-slide__panel').forEach((panel) => {
      panel.addEventListener('click', () => scrollToDiagram());
    });
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      const t = e.target;
      const typing =
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable);
      if ((e.key === '/' || e.key === 'f' || e.key === 'F') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSlideOpen('find', true);
        if (qInput) qInput.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (bag.kind !== 'none' || findActive()) {
          clearView();
        } else {
          setSlideOpen('', false);
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

  function axisColumns() {
    return [...document.querySelectorAll('.kod-hier-axes .kod-hier-axis')];
  }

  function itemsInAxis(axis) {
    const items = [];
    const head = axis.querySelector('.kod-hier-axis__head');
    if (head) items.push(head);
    axis.querySelectorAll('.kod-hier-rungs .member').forEach((m) => items.push(m));
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
    if (el) el.setAttribute('tabindex', '0');
  }

  function initRoving() {
    const cols = axisColumns();
    cols.forEach((axis, i) => {
      itemsInAxis(axis).forEach((n) => n.setAttribute('tabindex', '-1'));
      const head = axis.querySelector('.kod-hier-axis__head');
      if (head) head.setAttribute('tabindex', i === 0 ? '0' : '-1');
    });
  }

  function moveRoving(dx, dy) {
    const cols = axisColumns();
    if (cols.length === 0) return;
    const cur = currentRoving();
    if (!cur) return;
    const axis = cur.closest('.kod-hier-axis');
    const colIdx = Math.max(0, cols.indexOf(axis));
    if (dx !== 0) {
      const nextCol = cols[colIdx + dx];
      if (!nextCol) return;
      const items = itemsInAxis(nextCol);
      const dest = items[0];
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

  const nave = document.querySelector('.kod-hier-axes');
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
      const host = e.target.closest('.kod-hier-axis__head, .member');
      if (host && nave.contains(host)) setRovingStop(host);
    });
  }

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

  function mountCartouche(el) {
    if (!el || el.querySelector(':scope > .kod-cn')) return;
    const skin = document.createElement('span');
    skin.className = 'kod-skin';
    skin.setAttribute('aria-hidden', 'true');
    const cs = getComputedStyle(el);
    skin.style.background = cs.background;
    skin.style.border = cs.border;
    el.style.background = 'none';
    el.style.borderColor = 'transparent';
    el.style.boxShadow = 'none';
    const cutTl = document.createElement('span');
    cutTl.className = 'kod-cut kod-cut--tl';
    const cutTr = document.createElement('span');
    cutTr.className = 'kod-cut kod-cut--tr';
    skin.append(cutTl, cutTr);
    const tl = document.createElement('span');
    tl.className = 'kod-cn kod-cn--tl';
    tl.setAttribute('aria-hidden', 'true');
    const tr = document.createElement('span');
    tr.className = 'kod-cn kod-cn--tr';
    tr.setAttribute('aria-hidden', 'true');
    el.insertBefore(tr, el.firstChild);
    el.insertBefore(tl, el.firstChild);
    el.insertBefore(skin, el.firstChild);
  }

  function boot() {
    document.querySelectorAll('.kod-hier-ruler').forEach(mountCartouche);
    loadBag();
    if (bag.kind === 'category' && !groupById(bag.id)) bag.kind = 'none';
    if (bag.kind === 'faction' && !labelById(bag.id)) bag.kind = 'none';
    if (bag.kind === 'tag' && !labelById(bag.id)) bag.kind = 'none';
    bindSlides();
    bindFactions();
    bindTags();
    bindFind();
    bindRites();
    applyView();
    initRoving();
    bindPoll();
    fitSlides();
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => fitSlides());
      document.querySelectorAll('.kod-rail .kod-slide__panel').forEach((p) => ro.observe(p));
    }
    window.addEventListener('resize', fitSlides);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
