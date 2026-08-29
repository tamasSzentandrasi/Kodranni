import { esc, escAttr } from './escape.js';

export type LayoutPrimary = 'community' | 'characters';

export function layoutDocument(opts: {
  title: string;
  communityName: string;
  generatedAt: string;
  primary: LayoutPrimary;
  sourceLabel: string;
  body: string;
  extraHead?: string;
  extraScripts?: string;
}): string {
  const asOf = formatAsOf(opts.generatedAt);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <meta name="robots" content="noindex"/>
  <link rel="icon" href="/brand/falcon-logo.png" type="image/png"/>
  <link rel="stylesheet" href="/design/campaign.css"/>
  ${opts.extraHead ?? ''}
  <title>${esc(opts.title)} · ${esc(opts.communityName)}</title>
</head>
<body>
  <div class="app">
    <header class="app__brand">
      <img class="app__logo" src="/brand/falcon-logo.png" width="34" height="34" alt=""/>
      <div>
        <span class="app__mark">Kodranni</span>
        <h1 class="app__title">${esc(opts.communityName)}</h1>
      </div>
    </header>
    <p class="app__meta">
      As of ${esc(asOf)} · living record · <span class="src">${esc(opts.sourceLabel)}</span>
    </p>
    <nav class="tabs" aria-label="Primary">
      <a href="/community/"${opts.primary === 'community' ? ' aria-current="page"' : ''}>Community</a>
      <a href="/characters/"${opts.primary === 'characters' ? ' aria-current="page"' : ''}>Characters</a>
    </nav>
    ${opts.body}
  </div>
  <div id="kod-tip" class="tip" role="tooltip" hidden></div>
  ${LAYOUT_SCRIPT}
  ${opts.extraScripts ?? ''}
</body>
</html>`;
}

function formatAsOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** Rung collapse + hover tips — same behaviour as CampaignLayout. */
export const LAYOUT_SCRIPT = `<script>
(function () {
  document.querySelectorAll('[data-rung-toggle]').forEach((head) => {
    head.addEventListener('click', () => {
      const rung = head.closest('.hier-rung, .rung');
      if (!rung) return;
      if (rung.getAttribute('data-pending') === 'true') return;
      const c = rung.getAttribute('data-collapsed') === 'true';
      rung.setAttribute('data-collapsed', c ? 'false' : 'true');
      head.setAttribute('aria-expanded', c ? 'true' : 'false');
    });
  });
  const tip = document.getElementById('kod-tip');
  if (!tip) return;
  let sticky = false;
  let stickyEl = null;
  function show(el, text) {
    if (!text) return;
    tip.textContent = text;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 260, Math.max(8, r.left));
    let top = r.bottom + 6;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    requestAnimationFrame(() => {
      if (top + tip.offsetHeight > window.innerHeight - 8) {
        tip.style.top = Math.max(8, r.top - tip.offsetHeight - 6) + 'px';
      }
    });
  }
  function hide() {
    tip.hidden = true;
    sticky = false;
    stickyEl = null;
  }
  document.querySelectorAll('[data-tip]').forEach((el) => {
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || sticky) return;
      show(el, el.getAttribute('data-tip') || '');
    });
    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || sticky) return;
      hide();
    });
    el.addEventListener('focus', () => {
      if (sticky) return;
      show(el, el.getAttribute('data-tip') || '');
    });
    el.addEventListener('blur', () => {
      if (sticky) return;
      hide();
    });
  });
  document.querySelectorAll('.info[data-tip]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => { el._kodPtr = e.pointerType; });
    el.addEventListener('click', (e) => {
      const mouse = el._kodPtr === 'mouse' || (el._kodPtr == null && !window.matchMedia('(pointer: coarse)').matches);
      if (mouse) return;
      e.preventDefault();
      e.stopPropagation();
      const text = el.getAttribute('data-tip') || '';
      if (sticky && stickyEl === el) { hide(); return; }
      sticky = true;
      stickyEl = el;
      show(el, text);
    });
  });
  document.addEventListener('pointerdown', (e) => {
    if (!sticky) return;
    if (stickyEl && stickyEl.contains(e.target)) return;
    hide();
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
})();
</script>`;

export function infoBtn(label: string, tip: string): string {
  return `<button type="button" class="info" data-tip="${escAttr(tip)}" aria-label="${escAttr(label)}">i</button>`;
}

export function sectionHead(id: string, title: string, tip: string, about: string): string {
  return `<div class="section-head"><h2 id="${escAttr(id)}">${esc(title)}</h2>${infoBtn(about, tip)}</div>`;
}
