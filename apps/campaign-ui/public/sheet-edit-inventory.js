(function () {
  const panel = document.getElementById('inventory-panel');
  if (!panel || panel.getAttribute('data-can-edit') !== '1') return;
  const slug = panel.getAttribute('data-slug');
  if (!slug) return;

  const KINDS = ['none', 'light', 'heavy'];
  const LABELS = { none: 'None', light: 'Light', heavy: 'Heavy' };

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
      state.textContent =
        k === 'none'
          ? 'No armour'
          : d
            ? 'Donned — counts for physical Harm'
            : 'Not donned';
    }
  }

  panel.querySelector('[data-armour-cycle]')?.addEventListener('click', () => {
    const i = KINDS.indexOf(kind());
    const next = KINDS[(i + 1) % KINDS.length];
    panel.setAttribute('data-armour-kind', next);
    if (next === 'none') panel.setAttribute('data-armour-donned', '0');
    paintArmour();
  });

  panel.querySelector('[data-armour-donned-toggle]')?.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement)) return;
    panel.setAttribute('data-armour-donned', t.checked ? '1' : '0');
    paintArmour();
  });

  panel.querySelectorAll('[data-supply]').forEach((box) => {
    box.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const delta = t.getAttribute('data-supply-delta');
      if (!delta) return;
      const valEl = box.querySelector('[data-supply-val]');
      if (!valEl) return;
      const next = Math.max(0, Number(valEl.textContent || 0) + Number(delta));
      valEl.textContent = String(next);
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
    if (t.closest('[data-item-remove]')) t.closest('[data-item-idx]')?.remove();
  });

  panel.querySelector('[data-save-inventory]')?.addEventListener('click', async () => {
    const msg = panel.querySelector('[data-inv-msg]');
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
    const armour = {
      kind: kind(),
      donned: kind() !== 'none' && donned(),
    };
    const res = await fetch('/api/character/' + encodeURIComponent(slug), {
      method: 'POST',
      headers: tokenHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'st-edit',
        patch: { foodDays: food, waterDays: water, inventoryItems, armour },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (msg) {
      msg.hidden = false;
      msg.textContent = res.ok ? 'Saved.' : data.error || 'Failed';
      msg.className = 'draft-msg ' + (res.ok ? 'draft-msg--ok' : 'draft-msg--err');
    }
    if (res.ok) setTimeout(() => location.reload(), 450);
  });
})();
