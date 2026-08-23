(function () {
  const panel = document.getElementById('echoes-panel');
  if (!panel || panel.getAttribute('data-can-edit') !== '1') return;
  const slug = panel.getAttribute('data-slug');
  if (!slug) return;
  const list = panel.querySelector('[data-echo-list]');
  const traitList = document.querySelector('[data-trait-list]');
  const BAND = { 1: 'Individual', 2: 'Group', 3: 'Pivotal' };

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
  }

  function readEchoes() {
    return Array.from(panel.querySelectorAll('[data-echo-idx]')).map((art) => {
      const w = Number(art.querySelector('[data-echo-weight]')?.getAttribute('data-weight') || 1);
      const title = art.querySelector('[data-echo-title]')?.value?.trim() || 'Echo';
      const invokeWhen =
        art.querySelector('[data-echo-invoke]')?.value?.trim() ||
        'When the table agrees the scene matches.';
      return { title, weight: Math.min(3, Math.max(1, w)), invokeWhen };
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
    art.className = 'echo';
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
      '<button type="button" class="echo__remove" data-echo-remove>Remove</button></div>';
    list.appendChild(art);
    paintWeight(art.querySelector('[data-echo-weight]'), weight);
  }

  panel.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-echo-add]')) {
      addEchoCard(1, '', '');
      return;
    }
    if (t.closest('[data-echo-remove]')) {
      t.closest('[data-echo-idx]')?.remove();
      return;
    }
    const wEl = t.closest('[data-echo-weight]');
    if (wEl instanceof HTMLElement && wEl.classList.contains('echo__weight--edit')) {
      const cur = Number(wEl.getAttribute('data-weight') || 1);
      paintWeight(wEl, Math.min(3, cur + 1));
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
    }
  });

  document.querySelector('[data-trait-add]')?.addEventListener('click', () => {
    if (!traitList) return;
    const empty = traitList.querySelector('.empty');
    if (empty) empty.remove();
    const idx = traitList.querySelectorAll('[data-trait-idx]').length;
    const li = document.createElement('li');
    li.className = 'trait';
    li.setAttribute('data-trait-idx', String(idx));
    li.innerHTML =
      '<div class="trait__edit">' +
      '<input class="kod-ink" data-trait-name value="" placeholder="Trait name…" />' +
      '<input class="kod-ink" data-trait-note value="" placeholder="Optional note" />' +
      '<button type="button" data-trait-remove>Remove</button></div>';
    traitList.appendChild(li);
  });

  document.querySelector('#traits-panel')?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-trait-remove]')) t.closest('[data-trait-idx]')?.remove();
  });

  document.querySelector('[data-save-echoes-traits]')?.addEventListener('click', async () => {
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
    if (msg) {
      msg.hidden = false;
      msg.textContent = res.ok ? 'Saved.' : data.error || 'Failed';
      msg.className = 'draft-msg ' + (res.ok ? 'draft-msg--ok' : 'draft-msg--err');
    }
    if (res.ok) setTimeout(() => location.reload(), 450);
  });
})();
