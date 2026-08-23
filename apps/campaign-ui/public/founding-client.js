/**
 * One-shot starting Fortunes board. Loaded only on live + unfounded hall.
 * Play-time −/+ is not a web control.
 */
(function () {
  const sky = document.querySelector('.hall__sky[data-founding]');
  if (!sky) return;

  const LABELS = ['Crisis', 'Strained', 'Steady', 'Abundance'];
  const pillars = Array.from(sky.querySelectorAll('.fortune[data-key]'));
  const storeBtn = sky.querySelector('[data-founding-store]');
  const msgEl = sky.querySelector('[data-founding-msg]');
  if (!(storeBtn instanceof HTMLButtonElement) || !pillars.length) return;

  let touched = false;

  function clamp(n) {
    return Math.max(0, Math.min(3, n | 0));
  }

  function allSteady() {
    return pillars.every((p) => Number(p.getAttribute('data-level')) === 2);
  }

  function syncStore() {
    storeBtn.disabled = !(touched || allSteady());
  }

  function setLevel(pillar, level) {
    level = clamp(level);
    const key = pillar.getAttribute('data-key') || '';
    const label = LABELS[level] || '';
    pillar.setAttribute('data-level', String(level));
    pillar.setAttribute('aria-valuenow', String(level));
    pillar.setAttribute('aria-valuetext', label);
    pillar.setAttribute('aria-label', key + ', ' + label);
    const state = pillar.querySelector('.fortune__state');
    if (state) state.textContent = label;
    const well = pillar.querySelector('.fortune__well');
    let ember = pillar.querySelector('.fortune__ember');
    if (level === 0) {
      if (!ember && well) {
        ember = document.createElement('span');
        ember.className = 'fortune__ember';
        well.appendChild(ember);
      }
    } else if (ember) {
      ember.remove();
    }
  }

  function markTouched() {
    if (!touched) touched = true;
    syncStore();
  }

  function levelFromWellClick(well, clientY) {
    const r = well.getBoundingClientRect();
    const t = r.height <= 0 ? 1 : (clientY - r.top) / r.height;
    if (t < 0.25) return 3;
    if (t < 0.5) return 2;
    if (t < 0.75) return 1;
    return 0;
  }

  function readFortunes() {
    /** @type {Record<string, number>} */
    const fortunes = {};
    for (const p of pillars) {
      const key = p.getAttribute('data-key');
      if (key) fortunes[key] = clamp(Number(p.getAttribute('data-level')));
    }
    return fortunes;
  }

  function showMsg(text) {
    if (!msgEl) return;
    msgEl.hidden = !text;
    msgEl.textContent = text || '';
  }

  for (const pillar of pillars) {
    const well = pillar.querySelector('.fortune__well');
    const state = pillar.querySelector('.fortune__state');
    if (well) {
      well.addEventListener('click', (e) => {
        setLevel(pillar, levelFromWellClick(well, e.clientY));
        markTouched();
      });
    }
    if (state) {
      state.addEventListener('click', () => {
        const cur = Number(pillar.getAttribute('data-level'));
        setLevel(pillar, (cur + 1) % 4);
        markTouched();
      });
    }
    pillar.addEventListener('keydown', (e) => {
      const cur = Number(pillar.getAttribute('data-level'));
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        setLevel(pillar, cur + 1);
        markTouched();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setLevel(pillar, cur - 1);
        markTouched();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setLevel(pillar, 0);
        markTouched();
      } else if (e.key === 'End') {
        e.preventDefault();
        setLevel(pillar, 3);
        markTouched();
      }
    });
  }

  storeBtn.addEventListener('click', async () => {
    if (storeBtn.disabled) return;
    if (allSteady()) {
      const ok = window.confirm('This people is Steady in every Fortune — store that?');
      if (!ok) return;
    }
    storeBtn.disabled = true;
    showMsg('');
    try {
      const res = await fetch('/api/community/fortunes/founding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ fortunes: readFortunes() }),
      });
      const data = await res.json().catch(() => ({ error: 'Bad response' }));
      if (res.status === 409) {
        location.reload();
        return;
      }
      if (!res.ok) throw new Error(data.error || res.statusText);
      location.reload();
    } catch (err) {
      storeBtn.disabled = false;
      syncStore();
      showMsg(err instanceof Error ? err.message : String(err));
    }
  });

  syncStore();
})();
