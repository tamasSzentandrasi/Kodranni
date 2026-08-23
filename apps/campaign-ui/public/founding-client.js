/**
 * Storyteller desk — set or revise Fortunes. Loaded only on /community/setup/.
 * The table hall is read-only weather.
 */
(function () {
  const sky = document.querySelector('.hall__sky[data-editable]');
  if (!sky) return;

  const LABELS = ['Crisis', 'Strained', 'Steady', 'Abundance'];
  const pillars = Array.from(sky.querySelectorAll('.fortune[data-key]'));
  const storeBtn = sky.querySelector('[data-founding-store]');
  const msgEl = sky.querySelector('[data-founding-msg]');
  if (!(storeBtn instanceof HTMLButtonElement) || !pillars.length) return;

  const founded = sky.getAttribute('data-founded') === 'true';
  let touched = false;

  function clamp(n) {
    return Math.max(0, Math.min(3, n | 0));
  }

  function allSteady() {
    return pillars.every((p) => Number(p.getAttribute('data-level')) === 2);
  }

  function syncStore() {
    if (founded) {
      storeBtn.disabled = !touched;
      return;
    }
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
  }

  function markTouched() {
    if (!touched) touched = true;
    syncStore();
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
    pillar.addEventListener('click', (e) => {
      if (e.target instanceof Element && e.target.closest('details, a, button')) return;
      const cur = Number(pillar.getAttribute('data-level'));
      setLevel(pillar, (cur + 1) % 4);
      markTouched();
    });
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
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setLevel(pillar, (cur + 1) % 4);
        markTouched();
      }
    });
  }

  storeBtn.addEventListener('click', async () => {
    if (storeBtn.disabled) return;
    if (!founded && allSteady()) {
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
