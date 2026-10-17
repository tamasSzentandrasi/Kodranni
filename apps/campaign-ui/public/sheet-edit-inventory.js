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
    const inventoryItems = Array.from(panel.querySelectorAll('[data-item-idx], [data-item-new]'))
      .map((li) => {
        const name = li.querySelector('[data-item-name]')?.value?.trim();
        if (!name) return null;
        const note = li.querySelector('[data-item-note]')?.value?.trim();
        const icon = li.getAttribute('data-item-icon') || undefined;
        return { name, note: note || undefined, icon };
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
    if (res.ok && panel.getAttribute('data-desk') === '1') promoteNewItem();
    return res.ok;
  }

  function promoteNewItem() {
    const fresh = panel.querySelector('[data-item-new]');
    if (!fresh || fresh.contains(document.activeElement)) return;
    const nameEl = fresh.querySelector('[data-item-name]');
    const name = nameEl && 'value' in nameEl ? String(nameEl.value).trim() : '';
    if (!name) return;
    const idx = panel.querySelectorAll('[data-item-idx]').length;
    fresh.setAttribute('data-item-idx', String(idx));
    fresh.removeAttribute('data-item-new');
    const edit = fresh.querySelector('.item__edit');
    if (edit && !edit.querySelector('[data-item-remove]')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'desk-mark';
      btn.setAttribute('data-item-remove', '');
      btn.setAttribute('aria-label', 'Remove');
      btn.setAttribute('data-tip', 'Remove');
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.4"/></svg>';
      edit.appendChild(btn);
    }
    const list = panel.querySelector('[data-item-list]');
    if (!list) return;
    const li = document.createElement('li');
    li.className = 'kod-plate item';
    li.setAttribute('data-item-new', '');
    li.innerHTML =
      '<label class="item__icon-hit"><span class="item__icon item__icon--empty" aria-hidden="true"></span>' +
      '<input type="file" data-item-icon-file accept="image/jpeg,image/png,image/webp" hidden aria-label="Icon for the new item" /></label>' +
      '<div class="item__edit"><input class="kod-ink" data-item-name placeholder="Item name" />' +
      '<input class="kod-ink" data-item-note placeholder="Description" /></div>';
    list.appendChild(li);
  }

  const armourBtn = panel.querySelector('[data-armour-cycle]');
  armourBtn?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t instanceof HTMLElement && t.closest('[data-armour-state]')) {
      if (kind() === 'none') return;
      panel.setAttribute('data-armour-donned', donned() ? '0' : '1');
      paintArmour();
      saveSoon();
      return;
    }
    cycle(1);
  });
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
    li.className = 'kod-plate item';
    li.setAttribute('data-item-idx', String(idx));
    li.innerHTML =
      '<span class="item__icon item__icon--empty" aria-hidden="true"></span>' +
      '<div class="item__edit">' +
      '<input class="kod-ink" data-item-name placeholder="Item name…" value="" />' +
      '<input class="kod-ink" data-item-note placeholder="Short description (optional)" value="" />' +
      '<label class="item__icon-upload">Icon<input type="file" data-item-icon-file accept="image/jpeg,image/png,image/webp" hidden /></label>' +
      '<button type="button" data-item-remove>Remove</button></div>';
    list.appendChild(li);
  });

  function clearRemoveAsk() {
    panel.querySelectorAll('[data-confirm="1"]').forEach((btn) => {
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

  panel.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const remove = t.closest('[data-item-remove]');
    if (!remove) {
      clearRemoveAsk();
      return;
    }
    if (remove.getAttribute('data-confirm') !== '1') {
      armRemove(remove);
      return;
    }
    remove.closest('[data-item-idx]')?.remove();
    saveSoon();
  });

  document.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t instanceof Element && t.closest('#inventory-panel [data-confirm="1"]')) return;
    clearRemoveAsk();
  });

  panel.addEventListener('input', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-item-name], [data-item-note]')) saveSoon();
  });

  panel.addEventListener('change', async (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement) || t.getAttribute('data-item-icon-file') == null) return;
    const li = t.closest('[data-item-idx], [data-item-new]');
    const file = t.files && t.files[0];
    if (!li || !file) return;
    if (file.size > 256 * 1024) {
      const msg = panel.querySelector('[data-inv-msg]');
      if (msg) {
        msg.hidden = false;
        msg.textContent = 'Max 256KB';
        msg.className = 'draft-msg draft-msg--err';
      }
      t.value = '';
      return;
    }
    const named = li.querySelector('[data-item-name]')?.value?.trim();
    if (li.hasAttribute('data-item-new') && !named) {
      const msg = panel.querySelector('[data-inv-msg]');
      if (msg) {
        msg.hidden = false;
        msg.textContent = 'Name the item first';
        msg.className = 'draft-msg draft-msg--err';
      }
      t.value = '';
      return;
    }
    let idx = li.hasAttribute('data-item-new')
      ? panel.querySelectorAll('[data-item-idx]').length
      : Number(li.getAttribute('data-item-idx'));
    t.value = '';
    const ok = await saveNow();
    if (!ok) return;
    if (li.hasAttribute('data-item-idx')) idx = Number(li.getAttribute('data-item-idx'));
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('index', String(idx));
    const headers = {};
    const m = document.cookie.match(/(?:^|;\s*)kod_edit=([^;]+)/);
    if (m) headers.Authorization = 'Bearer ' + decodeURIComponent(m[1]);
    const res = await fetch('/api/character/' + encodeURIComponent(slug) + '/item-icon', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = panel.querySelector('[data-inv-msg]');
      if (msg) {
        msg.hidden = false;
        msg.textContent = data.error || 'Icon failed';
        msg.className = 'draft-msg draft-msg--err';
      }
      return;
    }
    if (data.icon) {
      li.setAttribute('data-item-icon', data.icon);
      const hit = li.querySelector('.item__icon-hit') || li;
      hit.querySelector('.item__icon--empty')?.remove();
      let img = hit.querySelector('img.item__icon') || li.querySelector('img.item__icon');
      if (!img) {
        img = document.createElement('img');
        img.className = 'item__icon';
        img.width = 36;
        img.height = 36;
        img.alt = '';
      }
      const input = hit.querySelector('input');
      if (img.parentElement !== hit) hit.insertBefore(img, input || null);
      const bust = data.url + (String(data.url).includes('?') ? '&' : '?') + 'v=' + Date.now().toString(36);
      img.src = bust;
    }
  });

  panel.addEventListener('focusout', (ev) => {
    const next = ev.relatedTarget;
    if (next instanceof Node && panel.contains(next)) return;
    window.setTimeout(saveNow, 0);
  });
})();
