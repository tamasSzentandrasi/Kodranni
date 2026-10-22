(function () {
  const panel = document.getElementById('inventory-panel');
  if (!panel || panel.getAttribute('data-can-edit') !== '1') return;
  const slug = panel.getAttribute('data-slug');
  if (!slug) return;

  const KINDS = ['none', 'light', 'heavy'];
  const LABELS = { none: 'None', light: 'Light', heavy: 'Heavy' };
  let saveTimer = 0;
  let focusSave = 0;
  let saveChain = Promise.resolve(true);
  let iconPicking = false;
  let iconUploading = false;
  const ICON_CAP = 2 * 1024 * 1024;

  function tokenHeaders() {
    return { 'Content-Type': 'application/json' };
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
    window.clearTimeout(focusSave);
    saveTimer = window.setTimeout(saveNow, 500);
  }

  function namedRowIndex(li) {
    const rows = Array.from(panel.querySelectorAll('[data-item-idx], [data-item-new]'));
    let n = 0;
    for (const row of rows) {
      const name = row.querySelector('[data-item-name]')?.value?.trim();
      if (!name) continue;
      if (row === li) return n;
      n += 1;
    }
    return -1;
  }

  function iconError(li, text) {
    const msg = panel.querySelector('[data-inv-msg]');
    if (msg) {
      msg.hidden = false;
      msg.textContent = text;
      msg.className = 'draft-msg draft-msg--err';
    }
    let rowMsg = li.querySelector('[data-item-icon-msg]');
    if (!rowMsg) {
      rowMsg = document.createElement('p');
      rowMsg.className = 'draft-msg draft-msg--err';
      rowMsg.setAttribute('data-item-icon-msg', '');
      li.appendChild(rowMsg);
    }
    rowMsg.hidden = false;
    rowMsg.textContent = text;
  }

  function ensureIcon(li) {
    const hit = li.querySelector('.item__icon-hit') || li;
    let img = hit.querySelector('img.item__icon');
    if (!img) {
      img = document.createElement('img');
      img.className = 'item__icon';
      img.width = 36;
      img.height = 36;
      img.alt = '';
      const empty = hit.querySelector('.item__icon--empty');
      if (empty) empty.replaceWith(img);
      else hit.prepend(img);
    }
    return img;
  }

  function showIcon(li, url) {
    const img = ensureIcon(li);
    if (String(url).startsWith('blob:')) {
      img.dataset.preview = url;
      img.src = url;
      return;
    }
    const probe = new Image();
    probe.onload = function () {
      if (img.isConnected) img.src = url;
    };
    probe.onerror = function () {
      const preview = img.dataset.preview;
      if (preview && img.getAttribute('src') !== preview) img.src = preview;
      iconError(li, 'Icon did not load.');
    };
    probe.src = url;
  }

  async function writePatch() {
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

  function saveNow() {
    const run = saveChain.then(() => writePatch());
    saveChain = run.then(
      (ok) => ok,
      () => false,
    );
    return run;
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
      '<input type="file" class="item__icon-file" data-item-icon-file accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-label="Icon for the new item" /></label>' +
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
      '<label class="item__icon-hit"><span class="item__icon item__icon--empty" aria-hidden="true"></span>' +
      '<input type="file" class="item__icon-file" data-item-icon-file accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-label="Item icon" /></label>' +
      '<div class="item__edit">' +
      '<input class="kod-ink" data-item-name placeholder="Item name…" value="" />' +
      '<input class="kod-ink" data-item-note placeholder="Short description (optional)" value="" />' +
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

  panel.addEventListener('pointerdown', (ev) => {
    const t = ev.target;
    if (!(t instanceof Element) || !t.closest('.item__icon-hit')) return;
    iconPicking = true;
    window.clearTimeout(saveTimer);
    window.clearTimeout(focusSave);
  });

  panel.addEventListener(
    'cancel',
    (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLInputElement) || !t.hasAttribute('data-item-icon-file')) return;
      iconPicking = false;
    },
    true,
  );

  window.addEventListener('focus', () => {
    if (!iconPicking || iconUploading) return;
    window.setTimeout(() => {
      if (!iconUploading) iconPicking = false;
    }, 500);
  });

  panel.addEventListener('change', async (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement) || t.getAttribute('data-item-icon-file') == null) return;
    const li = t.closest('[data-item-idx], [data-item-new]');
    const file = t.files && t.files[0];
    iconPicking = false;
    if (!li || !file) return;
    const reject = (text) => {
      iconError(li, text);
      t.value = '';
    };
    if (file.size > ICON_CAP) {
      reject('Use a jpg, png, or webp under 2MB.');
      return;
    }
    const named = li.querySelector('[data-item-name]')?.value?.trim();
    if (!named) {
      reject('Name the item, then add the picture.');
      return;
    }
    const typeOk =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/webp' ||
      /\.(jpe?g|png|webp)$/i.test(file.name || '');
    if (!typeOk) {
      reject('Use a jpg, png, or webp under 2MB.');
      return;
    }
    t.value = '';
    const preview = URL.createObjectURL(file);
    showIcon(li, preview);
    iconUploading = true;
    window.clearTimeout(saveTimer);
    window.clearTimeout(focusSave);
    try {
      const ok = await saveNow();
      if (!ok) {
        reject('The item did not save, so the picture was not stored.');
        return;
      }
      const idx = namedRowIndex(li);
      if (idx < 0) {
        reject('Name the item, then add the picture.');
        return;
      }
      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('index', String(idx));
      fd.append('name', named);
      const res = await fetch('/api/character/' + encodeURIComponent(slug) + '/item-icon', {
        method: 'POST',
        credentials: 'same-origin',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        reject(data.error || 'Icon failed');
        return;
      }
      if (data.icon) {
        const rowMsg = li.querySelector('[data-item-icon-msg]');
        if (rowMsg) rowMsg.hidden = true;
        li.setAttribute('data-item-icon', data.icon);
        const bust = data.url + (String(data.url).includes('?') ? '&' : '?') + 'v=' + Date.now().toString(36);
        showIcon(li, bust);
        await saveNow();
      }
    } finally {
      iconUploading = false;
    }
  });

  panel.addEventListener('focusout', (ev) => {
    const next = ev.relatedTarget;
    if (next instanceof Node && panel.contains(next)) return;
    if (iconPicking || iconUploading) return;
    window.clearTimeout(focusSave);
    focusSave = window.setTimeout(saveNow, 0);
  });
})();
