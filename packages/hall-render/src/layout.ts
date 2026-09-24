import { esc, escAttr } from './escape.js';

export type LayoutPrimary = 'overview' | 'hierarchy' | 'characters' | 'map';

export const HIERARCHY_TAB_TIP =
  'One crown, then parallel ladders. Same four tiers on every axis (Honoured → Outcast). Colour marks the axis; saturation falls toward Outcast. Hover a name for who they are; click to open the sheet.';

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
  ${ORNAMENT_PENDING_SCRIPT}
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
      <a href="/community/"${opts.primary === 'overview' ? ' aria-current="page"' : ''}>Overview</a>
      <span class="tabs__cluster"><a href="/community/hierarchy/"${opts.primary === 'hierarchy' ? ' aria-current="page"' : ''}>Hierarchy</a>${infoBtn('About Hierarchy', HIERARCHY_TAB_TIP)}</span>
      <a href="/characters/"${opts.primary === 'characters' ? ' aria-current="page"' : ''}>Characters</a>
    </nav>
    ${opts.body}
  </div>
  <div id="kod-tip" class="tip" role="tooltip" hidden></div>
  ${LAYOUT_SCRIPT}
  ${ORNAMENT_READY_SCRIPT}
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

/** Hide ornaments until the ready script below has decoded them. */
export const ORNAMENT_PENDING_SCRIPT = `<script>
document.documentElement.setAttribute('data-ornaments','pending');
setTimeout(function(){
  if(document.documentElement.getAttribute('data-ornaments')!=='ready'){
    document.documentElement.setAttribute('data-ornaments','ready');
  }
},3200);
</script>`;

/** Decode fonts, images, and CSS ornament urls, then fade the page in. */
export const ORNAMENT_READY_SCRIPT = `<script>
(function(){
  var root=document.documentElement;
  function done(){
    if(root.getAttribute('data-ornaments')==='ready')return;
    root.setAttribute('data-ornaments','ready');
  }
  function decodeOne(img){
    if(!img)return Promise.resolve();
    if(img.complete&&img.naturalWidth)return Promise.resolve();
    if(typeof img.decode==='function')return img.decode().then(function(){},function(){});
    return new Promise(function(res){
      img.addEventListener('load',res,{once:true});
      img.addEventListener('error',res,{once:true});
    });
  }
  function cssUrls(){
    var cs=getComputedStyle(root);
    var keys=['--kod-nameplate','--kod-nameplate-glass','--kod-panel-corner','--kod-panel-cut','--kod-page-end','--kod-tree-0','--kod-tree-1','--kod-tree-2','--kod-tree-3','--kod-btn-night','--kod-btn-moon','--kod-btn-round','--kod-btn-round-moon','--kod-slide-tab-top','--kod-slide-tab-mid','--kod-slide-tab-bot','--kod-slide-tab-chev','--kod-fortune-vitality','--kod-fortune-cohesion','--kod-fortune-surplus','--kod-fortune-standing','--kod-fortune-tradition'];
    var out=[];
    for(var i=0;i<keys.length;i++){
      var v=cs.getPropertyValue(keys[i]);
      var m=/url\\((['"]?)(.+?)\\1\\)/.exec(v);
      if(m&&m[2]&&m[2]!=='none')out.push(m[2]);
    }
    return out;
  }
  function run(){
    var jobs=[];
    var imgs=document.images;
    for(var i=0;i<imgs.length;i++)jobs.push(decodeOne(imgs[i]));
    var links=document.querySelectorAll('link[rel="preload"][as="image"]');
    for(var j=0;j<links.length;j++){
      var im=new Image();
      im.src=links[j].href;
      jobs.push(decodeOne(im));
    }
    var urls=cssUrls();
    for(var k=0;k<urls.length;k++){
      var im2=new Image();
      im2.src=urls[k];
      jobs.push(decodeOne(im2));
    }
    if(document.fonts&&document.fonts.ready)jobs.push(document.fonts.ready.catch(function(){}));
    var cap=new Promise(function(res){setTimeout(res,2800);});
    Promise.race([Promise.all(jobs),cap]).then(done,done);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);
  else run();
})();
</script>`;

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
