(function () {
  const panel = document.getElementById('inventory-panel');
  if (!panel || panel.getAttribute('data-can-edit') !== '1') return;
  const slug = panel.getAttribute('data-slug');
  if (!slug) return;

  const KINDS = ['none', 'light', 'heavy'];
  const LABELS = { none: 'None', light: 'Light', heavy: 'Heavy' };
  let saveTimer = 0;

  function tokenHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const m = document.cookie.match(/(?:^|;\s*)kod_edit=([^;]+)/);
    if (m) headers.Authorization = 'Bearer ' + decodeURIComponent(m[1]);
    return headers;
  }

  function kind() {
    return panel.getAttribute('data-armour-kind') || 'none';
  }

  function donned() {
    return panel.getAttribute('data-armour-donned') === '1';
  }

  function paintArmour() {
    const k = kind();
    const d = donned();
    const btn = panel.querySelector('[data-armour-cycle]');
    const label = panel.querySelector('[data-armour-label]');
    const state = panel.querySelector('[data-armour-state]');
    if (btn) {
      btn.setAttribute('data-kind', k);
      btn.setAttribute('data-donned', String(d));
    }
    if (label) label.textContent = LABELS[k] || k;
    if (state) {
      state.textContent = k === 'none' ? 'None worn' : d ? 'Donned' : 'Carried';
    }
  }

  function cycle(dir) {
    const i = KINDS.indexOf(kind());
    const next = KINDS[(i + dir + KINDS.length) % KINDS.length];
    panel.setAttribute('data-armour-kind', next);
    panel.setAttribute('data-armour-donned', next === 'none' ? '0' : '1');
    paintArmour();
    saveSoon();
  }

  function readPatch() {
    const food = Number(
      panel.querySelector('[data-supply="food"] [data-supply-val]')?.textContent || 0,
    );
    const water = Number(
      panel.querySelector('[data-supply="water"] [data-supply-val]')?.textContent || 0,
    );
    const inventoryItems = Array.from(panel.querySelectorAll('[data-item-idx]'))
      .map((li) => {
        const name = li.querySelector('[data-item-name]')?.value?.trim();
        if (!name) return null;
        const note = li.querySelector('[data-item-note]')?.value?.trim();
        return { name, note: note || undefined };
      })
      .filter(Boolean);
    return {
      foodDays: food,
      waterDays: water,
      inventoryItems,
      armour: { kind: kind(), donned: kind() !== 'none' && donned() },
    };
  }

  function saveSoon() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveNow, 500);
  }

  async function saveNow() {
    const msg = panel.querySelector('[data-inv-msg]');
    const res = await fetch('/api/character/' + encodeURIComponent(slug), {
      method: 'POST',
      headers: tokenHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'st-edit', patch: readPatch() }),
    });
    const data = await res.json().catch(() => ({}));
    if (msg) {
      msg.hidden = !res.ok;
      if (!res.ok) {
        msg.textContent = data.error || 'Failed';
        msg.className = 'draft-msg draft-msg--err';
      }
    }
  }

  const armourBtn = panel.querySelector('[data-armour-cycle]');
  armourBtn?.addEventListener('click', () => cycle(1));
  armourBtn?.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    cycle(-1);
  });

  panel.querySelectorAll('[data-supply]').forEach((box) => {
    box.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('[data-supply-delta]');
      if (!btn) return;
      const valEl = box.querySelector('[data-supply-val]');
      if (!valEl) return;
      const next = Math.max(0, Number(valEl.textContent || 0) + Number(btn.getAttribute('data-supply-delta')));
      valEl.textContent = String(next);
      saveSoon();
    });
  });

  panel.querySelector('[data-item-add]')?.addEventListener('click', () => {
    const list = panel.querySelector('[data-item-list]');
    if (!list) return;
    list.querySelector('.empty')?.remove();
    const idx = list.querySelectorAll('[data-item-idx]').length;
    const li = document.createElement('li');
    li.className = 'item';
    li.setAttribute('data-item-idx', String(idx));
    li.innerHTML =
      '<div class="item__edit">' +
      '<input class="kod-ink" data-item-name placeholder="Item name…" value="" />' +
      '<input class="kod-ink" data-item-note placeholder="Short description (optional)" value="" />' +
      '<button type="button" data-item-remove>Remove</button></div>';
    list.appendChild(li);
  });

  panel.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-item-remove]')) {
      t.closest('[data-item-idx]')?.remove();
      saveSoon();
    }
  });

  panel.addEventListener('input', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-item-name], [data-item-note]')) saveSoon();
  });
})();
