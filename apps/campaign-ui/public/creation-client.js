/**
 * Live sheet creation: spends, refunds, budget dock, Wanting staging.
 */
(function () {
  const draft = document.getElementById('draft-panel');
  const dock = document.getElementById('budget-dock');
  const wanting = document.getElementById('wanting-panel');
  /** Budget/spend state lives on the dock when on Core; concept/confirm on Draft tab. */
  const root = dock || draft;
  if (!root) return;
  const slug = root.getAttribute('data-slug');
  if (!slug) return;

  document.body.classList.add('creation-edit');
  if (document.getElementById('draft-confirm')) {
    document.body.classList.add('creation-confirm-dock');
  }

  const ROMAN = ['∅', 'I', 'II', 'III', 'IV'];
  /** @type {Array<{ id: string, menu: string, label: string, payload: Record<string, unknown> }>} */
  let staged = [];
  let wordsAvailable = Number(root.getAttribute('data-words') || '0');
  let formMenu = null;

  function msg(key, text, ok) {
    const nodes = [];
    if (draft) draft.querySelectorAll('[data-msg="' + key + '"]').forEach((n) => nodes.push(n));
    const confirmDockEl = document.getElementById('draft-confirm');
    if (confirmDockEl && (key === 'confirm' || key === 'spend')) {
      confirmDockEl.querySelectorAll('[data-msg="' + key + '"]').forEach((n) => nodes.push(n));
    }
    if (dock && key === 'spend') {
      const d = dock.querySelector('[data-msg="spend"]');
      if (d) nodes.push(d);
    }
    if (wanting && key === 'wanting') {
      const d = wanting.querySelector('[data-msg="wanting"]');
      if (d) nodes.push(d);
    }
    for (const el of nodes) {
      el.hidden = !text;
      el.textContent = text || '';
      el.classList.toggle('draft-msg--err', !ok && !!text);
      el.classList.toggle('draft-msg--ok', ok && !!text);
    }
  }

  function readEditToken() {
    const q = new URLSearchParams(location.search).get('edit');
    if (q) return q;
    const m = document.cookie.match(/(?:^|;\s*)kod_edit=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  async function post(body) {
    const headers = { 'Content-Type': 'application/json' };
    const tok = readEditToken();
    if (tok) headers.Authorization = 'Bearer ' + tok;
    const res = await fetch('/api/character/' + encodeURIComponent(slug), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({ error: 'Bad response' }));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  // Persist ?edit= into cookie and clean the address bar
  (function persistEditQuery() {
    const u = new URL(location.href);
    const q = u.searchParams.get('edit');
    if (!q) return;
    document.cookie =
      'kod_edit=' + encodeURIComponent(q) + '; Path=/; Max-Age=86400; SameSite=Lax';
    u.searchParams.delete('edit');
    history.replaceState({}, '', u.pathname + u.search + u.hash);
  })();

  function nextFoundCost(rating) {
    if (rating === 1) return 1;
    if (rating === 2) return 2;
    return null;
  }
  function refundFoundCost(rating) {
    if (rating === 2) return 1;
    if (rating === 3) return 2;
    return null;
  }
  function nextSkillCost(rating) {
    if (rating === 0) return 1;
    if (rating === 1) return 2;
    if (rating === 2) return 3;
    return null;
  }
  function refundSkillCostVal(rating) {
    if (rating === 1) return 1;
    if (rating === 2) return 2;
    if (rating === 3) return 3;
    return null;
  }

  function computeFoundationSpent() {
    let s = 0;
    document.querySelectorAll('[data-spend-foundation]').forEach((btn) => {
      const r = Number(btn.getAttribute('data-rating') || '1');
      if (r >= 2) s += 1;
      if (r >= 3) s += 2;
    });
    return s;
  }

  function computeSkillSpent() {
    let s = 0;
    document.querySelectorAll('[data-spend-skill]').forEach((el) => {
      const r = Number(el.getAttribute('data-rating') || '0');
      if (r >= 1) s += 1;
      if (r >= 2) s += 2;
      if (r >= 3) s += 3;
    });
    return s;
  }

  function setBudget(creation) {
    if (!creation) return;
    const fp = creation.foundationPoints;
    const sp = creation.skillPoints;
    const w = creation.words;
    wordsAvailable = w;
    [dock, draft].filter(Boolean).forEach((el) => {
      el.setAttribute('data-foundation-points', String(fp));
      el.setAttribute('data-skill-points', String(sp));
      el.setAttribute('data-words', String(w));
    });

    const fSpent = computeFoundationSpent();
    const sSpent = computeSkillSpent();
    const fPool = fSpent + fp;
    const sPool = sSpent + sp;

    const patch = (scope) => {
      if (!scope) return;
      const set = (sel, val) => {
        const el = scope.querySelector(sel);
        if (el) el.textContent = String(val);
      };
      set('[data-field="foundationPoints"]', fp);
      set('[data-field="skillPoints"]', sp);
      set('[data-field="words"]', w);
      set('[data-field="words-open"]', w - staged.length);
      set('[data-field="words-staged"]', staged.length);
      set('[data-field="foundationSpent"]', fSpent);
      set('[data-field="skillSpent"]', sSpent);
      set('[data-field="foundationPool"]', fPool);
      set('[data-field="skillPool"]', sPool);
      const ff = scope.querySelector('[data-field="foundationFill"]');
      const sf = scope.querySelector('[data-field="skillFill"]');
      if (ff) ff.style.width = (fPool > 0 ? Math.round((fSpent / fPool) * 100) : 0) + '%';
      if (sf) sf.style.width = (sPool > 0 ? Math.round((sSpent / sPool) * 100) : 0) + '%';
    };
    patch(dock);
    patch(draft);
    patch(wanting);

    refreshAffordability(fp, sp);
  }

  function refreshAffordability(fp, sp) {
    const locked = document.body.classList.contains('wanting-lock');
    document.querySelectorAll('[data-spend-foundation]').forEach((btn) => {
      if (!(btn instanceof HTMLElement)) return;
      const rating = Number(btn.getAttribute('data-rating') || '0');
      const cost = nextFoundCost(rating);
      const refund = refundFoundCost(rating);
      const chip = btn.querySelector('.found-row__cost');
      btn.classList.remove('found-row__spend--blocked');
      btn.removeAttribute('data-unaffordable');
      btn.setAttribute('data-refund', refund != null ? String(refund) : '');

      const canRaise = !locked && cost != null && fp >= cost;
      const canLower = !locked && refund != null;

      if (cost == null) {
        if (chip) chip.textContent = refund != null ? 'refund ' + refund : 'max';
      } else if (chip) {
        chip.textContent = canRaise ? '−' + cost : 'need ' + cost;
      }

      if (!canRaise && cost != null) {
        btn.classList.add('found-row__spend--blocked');
        btn.setAttribute('data-unaffordable', '1');
      }
      // Never native-disable if lower is possible (right-click must work)
      btn.disabled = locked || (!canRaise && !canLower);

      btn.setAttribute(
        'data-tip',
        (canRaise
          ? 'Left-click: raise (costs ' + cost + ')'
          : cost != null
            ? 'Need ' + cost + ' Foundation pts'
            : 'At maximum') +
          ' · ' +
          (canLower ? 'Right-click: lower (refund ' + refund + ')' : 'Cannot lower below I'),
      );
    });

    document.querySelectorAll('[data-spend-skill]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const rating = Number(el.getAttribute('data-rating') || '0');
      const cost = nextSkillCost(rating);
      const refund = refundSkillCostVal(rating);
      const costEl = el.querySelector('.skill__cost');
      el.classList.remove('skill--spendable', 'skill--unaffordable', 'skill--refundable');
      el.setAttribute('data-refund', refund != null ? String(refund) : '');

      if (cost == null) {
        if (costEl) costEl.textContent = refund != null ? '+' + refund : 'max';
      } else if (costEl) {
        costEl.textContent = !locked && sp >= cost ? '−' + cost : 'need ' + cost;
      }

      if (!locked && cost != null && sp >= cost) el.classList.add('skill--spendable');
      else if (cost != null) el.classList.add('skill--unaffordable');
      if (!locked && refund != null) el.classList.add('skill--refundable');

      el.setAttribute(
        'data-tip',
        (!locked && cost != null && sp >= cost
          ? 'Left-click: raise (costs ' + cost + ')'
          : cost != null
            ? 'Need ' + cost + ' Skill pts'
            : 'At maximum') +
          ' · ' +
          (refund != null && !locked
            ? 'Right-click: lower (refund ' + refund + ')'
            : 'Cannot lower below 0'),
      );
    });
  }

  async function applyFoundation(btn, refund) {
    if (document.body.classList.contains('wanting-lock')) {
      msg('spend', 'Finish or cancel The Wanting first.', false);
      return;
    }
    const foundation = btn.getAttribute('data-spend-foundation');
    if (!foundation) return;
    const rating = Number(btn.getAttribute('data-rating') || '0');
    if (refund) {
      if (refundFoundCost(rating) == null) {
        msg('spend', 'Cannot lower below I.', false);
        return;
      }
    } else {
      const cost = nextFoundCost(rating);
      if (cost == null) {
        msg('spend', 'Already at maximum.', false);
        return;
      }
      const fp = Number(root.getAttribute('data-foundation-points') || '0');
      if (fp < cost) {
        msg('spend', 'Not enough Foundation points (need ' + cost + ', have ' + fp + ').', false);
        return;
      }
    }
    try {
      const data = await post({
        action: refund ? 'refund-foundation' : 'spend-foundation',
        foundation,
      });
      const raw = data.foundations && data.foundations[foundation];
      if (typeof raw === 'number') {
        btn.setAttribute('data-rating', String(raw));
        const mark = btn.querySelector('[data-roman]');
        if (mark) mark.textContent = ROMAN[raw] || String(raw);
      }
      setBudget(data.creation);
      msg('spend', foundation + (refund ? ' lowered.' : ' raised.'), true);
    } catch (e) {
      msg('spend', e instanceof Error ? e.message : String(e), false);
      setBudget({
        foundationPoints: Number(root.getAttribute('data-foundation-points') || '0'),
        skillPoints: Number(root.getAttribute('data-skill-points') || '0'),
        words: wordsAvailable,
      });
    }
  }

  async function applySkill(skillEl, refund) {
    if (document.body.classList.contains('wanting-lock')) {
      msg('spend', 'Finish or cancel The Wanting first.', false);
      return;
    }
    const skill = skillEl.getAttribute('data-spend-skill');
    if (!skill) return;
    const rating = Number(skillEl.getAttribute('data-rating') || '0');
    if (refund) {
      if (refundSkillCostVal(rating) == null) {
        msg('spend', 'Cannot lower below 0.', false);
        return;
      }
    } else {
      const cost = nextSkillCost(rating);
      if (cost == null) {
        msg('spend', 'Already at maximum.', false);
        return;
      }
      const sp = Number(root.getAttribute('data-skill-points') || '0');
      if (sp < cost) {
        msg('spend', 'Not enough Skill points (need ' + cost + ', have ' + sp + ').', false);
        return;
      }
    }
    try {
      const data = await post({
        action: refund ? 'refund-skill' : 'spend-skill',
        skill,
      });
      const entry =
        Array.isArray(data.skills) && data.skills.find((s) => s && s.name === skill);
      const next = entry ? Number(entry.rating) : 0;
      skillEl.setAttribute('data-rating', String(next));
      skillEl.setAttribute('data-rated', next > 0 ? 'true' : 'false');
      const inner = skillEl.querySelector('.skill__inner');
      if (inner) inner.textContent = String(next);
      setBudget(data.creation);
      msg('spend', skill + (refund ? ' lowered.' : ' raised.'), true);
    } catch (e) {
      msg('spend', e instanceof Error ? e.message : String(e), false);
    }
  }

  function openWanting() {
    if (!wanting) return;
    wanting.hidden = false;
    document.body.classList.add('wanting-open', 'wanting-lock');
    document.body.classList.add('creation-edit');
    renderStaged();
    setBudget({
      foundationPoints: Number(root.getAttribute('data-foundation-points') || '0'),
      skillPoints: Number(root.getAttribute('data-skill-points') || '0'),
      words: wordsAvailable,
    });
    msg('wanting', '', true);
  }

  function closeWanting(discard) {
    if (!wanting) return;
    if (discard) staged = [];
    wanting.hidden = true;
    document.body.classList.remove('wanting-open', 'wanting-lock');
    const form = document.getElementById('wanting-form');
    if (form) form.hidden = true;
    formMenu = null;
    renderStaged();
    setBudget({
      foundationPoints: Number(root.getAttribute('data-foundation-points') || '0'),
      skillPoints: Number(root.getAttribute('data-skill-points') || '0'),
      words: wordsAvailable,
    });
  }

  function renderStaged() {
    if (!wanting) return;
    const list = wanting.querySelector('[data-wanting-staged]');
    const empty = wanting.querySelector('[data-wanting-empty]');
    if (!list) return;
    list.innerHTML = '';
    staged.forEach((item, idx) => {
      const li = document.createElement('li');
      li.innerHTML =
        '<span>' +
        item.label +
        '</span><button type="button" data-unstaging="' +
        idx +
        '">Undo</button>';
      list.appendChild(li);
    });
    if (empty) empty.hidden = staged.length > 0;
    const wo = wanting.querySelector('[data-field="words-open"]');
    const ws = wanting.querySelector('[data-field="words-staged"]');
    if (wo) wo.textContent = String(Math.max(0, wordsAvailable - staged.length));
    if (ws) ws.textContent = String(staged.length);
  }

  function catalogSelect(kind) {
    const tpl = document.getElementById('wanting-field-catalog');
    if (!tpl) return null;
    const src = tpl.content.querySelector(kind === 'foundations' ? '[data-foundations]' : '[data-skills]');
    if (!src) return null;
    return src.cloneNode(true);
  }

  function showWantingForm(menu) {
    const form = document.getElementById('wanting-form');
    const fields = wanting && wanting.querySelector('[data-wanting-form-fields]');
    const title = wanting && wanting.querySelector('[data-wanting-form-title]');
    if (!form || !fields || !title) return;
    formMenu = menu;
    form.hidden = false;
    fields.innerHTML = '';
    const labels = {
      plus_one_foundation: '+1 Foundation · remove 3 skill ranks',
      plus_two_foundation_split: '+2 Foundations (split) · pay 5 ranks or Negative Trait',
      plus_five_skill: '+5 Skill points · −1 Foundation',
      positive_trait: 'Positive Trait · remove 3 skill ranks',
    };
    title.textContent = labels[menu] || menu;

    function lab(text, node) {
      const l = document.createElement('label');
      l.appendChild(document.createTextNode(text));
      l.appendChild(node);
      fields.appendChild(l);
    }

    if (menu === 'plus_one_foundation' || menu === 'positive_trait') {
      const f = catalogSelect('foundations');
      const sk = catalogSelect('skills');
      if (menu === 'plus_one_foundation' && f) {
        f.setAttribute('name', 'foundation');
        lab('Foundation to raise', f);
      }
      if (menu === 'positive_trait') {
        const inp = document.createElement('input');
        inp.name = 'traitName';
        inp.required = true;
        lab('Trait name', inp);
      }
      if (sk) {
        sk.setAttribute('name', 'removeSkills');
        lab('Skills to remove ranks from (pick ranks totaling 3)', sk);
      }
      const ranks = document.createElement('input');
      ranks.name = 'removeHint';
      ranks.value = 'Select skills below; one rank removed per selected skill (need exactly 3).';
      ranks.readOnly = true;
      lab('Note', ranks);
    } else if (menu === 'plus_two_foundation_split') {
      const a = catalogSelect('foundations');
      const b = catalogSelect('foundations');
      if (a && b) {
        a.setAttribute('name', 'foundationA');
        b.setAttribute('name', 'foundationB');
        lab('First Foundation', a);
        lab('Second Foundation', b);
      }
      const pay = document.createElement('select');
      pay.name = 'payPath';
      pay.innerHTML =
        '<option value="skills">Remove 5 skill ranks</option><option value="trait">Take Negative Trait</option>';
      lab('Pay with', pay);
      const sk = catalogSelect('skills');
      if (sk) {
        sk.setAttribute('name', 'removeSkills');
        lab('Skills (if paying ranks)', sk);
      }
      const nt = document.createElement('input');
      nt.name = 'negativeTrait';
      lab('Negative Trait name (if chosen)', nt);
    } else if (menu === 'plus_five_skill') {
      const f = catalogSelect('foundations');
      if (f) {
        f.setAttribute('name', 'foundation');
        lab('Foundation to reduce by 1', f);
      }
    }
  }

  function stageFromForm(ev) {
    ev.preventDefault();
    if (!formMenu) return;
    if (staged.length >= wordsAvailable) {
      msg('wanting', 'No Words left to stage.', false);
      return;
    }
    const form = document.getElementById('wanting-form');
    if (!form) return;
    const fd = new FormData(form);
    const payload = { menu: formMenu };
    let label = formMenu;

    const selectedSkills = () => {
      const sel = form.querySelector('select[name="removeSkills"]');
      if (!sel) return [];
      return Array.from(sel.selectedOptions).map((o) => ({
        skill: o.value,
        ranks: 1,
      }));
    };

    if (formMenu === 'plus_one_foundation') {
      payload.foundation = String(fd.get('foundation') || '');
      payload.removeSkills = selectedSkills();
      if (payload.removeSkills.length !== 3) {
        msg('wanting', 'Select exactly 3 skills (one rank each).', false);
        return;
      }
      label = '+1 ' + payload.foundation + ' (−3 skill ranks)';
    } else if (formMenu === 'plus_two_foundation_split') {
      const a = String(fd.get('foundationA') || '');
      const b = String(fd.get('foundationB') || '');
      if (!a || !b || a === b) {
        msg('wanting', 'Pick two different Foundations.', false);
        return;
      }
      payload.foundations = [a, b];
      if (String(fd.get('payPath')) === 'trait') {
        const name = String(fd.get('negativeTrait') || '').trim();
        if (!name) {
          msg('wanting', 'Name the Negative Trait.', false);
          return;
        }
        payload.negativeTrait = { name };
        label = '+1 ' + a + ' & +1 ' + b + ' (Negative Trait)';
      } else {
        payload.removeSkills = selectedSkills();
        if (payload.removeSkills.length !== 5) {
          msg('wanting', 'Select exactly 5 skills (one rank each).', false);
          return;
        }
        label = '+1 ' + a + ' & +1 ' + b + ' (−5 skill ranks)';
      }
    } else if (formMenu === 'plus_five_skill') {
      payload.foundation = String(fd.get('foundation') || '');
      payload.addSkillPoints = 5;
      label = '+5 Skill pts (−1 ' + payload.foundation + ')';
    } else if (formMenu === 'positive_trait') {
      payload.traitName = String(fd.get('traitName') || '').trim();
      payload.removeSkills = selectedSkills();
      if (!payload.traitName) {
        msg('wanting', 'Trait name required.', false);
        return;
      }
      if (payload.removeSkills.length !== 3) {
        msg('wanting', 'Select exactly 3 skills (one rank each).', false);
        return;
      }
      label = 'Trait “' + payload.traitName + '” (−3 skill ranks)';
    }

    staged.push({
      id: String(Date.now()) + Math.random(),
      menu: formMenu,
      label,
      payload,
    });
    form.hidden = true;
    formMenu = null;
    renderStaged();
    msg('wanting', 'Staged. Undo anytime before Confirm.', true);
  }

  async function confirmWanting() {
    if (!staged.length) {
      msg('wanting', 'Nothing staged.', false);
      return;
    }
    try {
      let creation = null;
      for (const item of staged) {
        const body = { action: 'spend-wanting', ...item.payload };
        const data = await post(body);
        creation = data.creation;
        if (data.foundations) {
          for (const [name, raw] of Object.entries(data.foundations)) {
            const btn = document.querySelector(
              '[data-spend-foundation="' + CSS.escape(name) + '"]',
            );
            if (btn instanceof HTMLElement && typeof raw === 'number') {
              btn.setAttribute('data-rating', String(raw));
              const mark = btn.querySelector('[data-roman]');
              if (mark) mark.textContent = ROMAN[raw] || String(raw);
            }
          }
        }
        if (Array.isArray(data.skills)) {
          document.querySelectorAll('[data-spend-skill]').forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            const name = el.getAttribute('data-spend-skill');
            const entry = data.skills.find((s) => s && s.name === name);
            const rating = entry ? Number(entry.rating) : 0;
            el.setAttribute('data-rating', String(rating));
            el.setAttribute('data-rated', rating > 0 ? 'true' : 'false');
            const inner = el.querySelector('.skill__inner');
            if (inner) inner.textContent = String(rating);
          });
        }
      }
      staged = [];
      if (creation) setBudget(creation);
      closeWanting(false);
      msg('spend', 'Wanting confirmed.', true);
      // Soft reload so traits / skill lists stay honest
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      msg('wanting', e instanceof Error ? e.message : String(e), false);
    }
  }

  // init affordance
  setBudget({
    foundationPoints: Number(root.getAttribute('data-foundation-points') || '0'),
    skillPoints: Number(root.getAttribute('data-skill-points') || '0'),
    words: wordsAvailable,
  });

  async function handleDraftAction(actionBtn) {
    const action = actionBtn.getAttribute('data-action');
    if (!action) return;
    actionBtn.setAttribute('disabled', 'true');
    try {
      if (action === 'save-concept' && draft) {
        const name = draft.querySelector('[data-field="name"]');
        const concept = draft.querySelector('[data-field="concept"]');
        const communityTie = draft.querySelector('[data-field="communityTie"]');
        const whoWeSee = draft.querySelector('[data-field="whoWeSee"]');
        await post({
          action: 'update-concept',
          name: name && 'value' in name ? name.value : undefined,
          concept: concept && 'value' in concept ? concept.value : undefined,
          communityTie:
            communityTie && 'value' in communityTie ? communityTie.value : undefined,
          whoWeSee: whoWeSee && 'value' in whoWeSee ? whoWeSee.value : undefined,
        });
        msg('concept', 'Saved.', true);
      } else if (action === 'confirm') {
        const data = await post({ action: 'confirm' });
        const body = document.querySelector('.draft-foot__body');
        if (body) {
          body.innerHTML =
            '<p class="flag flag--ok">Returned to table · awaiting Storyteller review</p>' +
            '<p class="draft-hint">A review card should appear in the play channel. If not, ST: <code>/review</code>.</p>';
        }
        msg(
          'confirm',
          'Returned to table' +
            (data.mention ? ' (@' + data.mention.displayName + ')' : '') +
            '.',
          true,
        );
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (action === 'save-concept') msg('concept', m, false);
      else if (action === 'confirm') msg('confirm', m, false);
    } finally {
      actionBtn.removeAttribute('disabled');
    }
  }

  if (draft) {
    draft.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const actionBtn = t.closest('[data-action]');
      if (!actionBtn || !(actionBtn instanceof HTMLElement) || !draft.contains(actionBtn)) return;
      void handleDraftAction(actionBtn);
    });
  }

  const confirmDock = document.getElementById('draft-confirm');
  if (confirmDock) {
    confirmDock.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const actionBtn = t.closest('[data-action="confirm"]');
      if (!actionBtn || !(actionBtn instanceof HTMLElement)) return;
      void handleDraftAction(actionBtn);
    });
  }

  // Clearance under the fixed Confirm dock so skills remain reachable
  if (document.body.classList.contains('creation-confirm-dock')) {
    const style = document.createElement('style');
    style.textContent =
      'body.creation-confirm-dock .app{padding-bottom:11rem;}' +
      'body.creation-confirm-dock #section-skills{scroll-margin-bottom:11rem;}';
    document.head.appendChild(style);
  }

  document.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;

    const jump = t.closest('[data-jump]');
    if (jump instanceof HTMLElement) {
      const id = jump.getAttribute('data-jump');
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (t.closest('[data-open-wanting]')) {
      openWanting();
      return;
    }
    if (t.closest('[data-wanting-close]') || t.closest('[data-wanting-cancel]')) {
      closeWanting(true);
      return;
    }
    if (t.closest('[data-wanting-confirm]')) {
      void confirmWanting();
      return;
    }
    const unstage = t.closest('[data-unstaging]');
    if (unstage instanceof HTMLElement) {
      const idx = Number(unstage.getAttribute('data-unstaging'));
      if (!Number.isNaN(idx)) {
        staged.splice(idx, 1);
        renderStaged();
      }
      return;
    }
    const menuBtn = t.closest('[data-wanting-menu]');
    if (menuBtn instanceof HTMLElement) {
      const menu = menuBtn.getAttribute('data-wanting-menu');
      if (menu) showWantingForm(menu);
      return;
    }
    if (t.closest('[data-wanting-form-cancel]')) {
      const form = document.getElementById('wanting-form');
      if (form) form.hidden = true;
      formMenu = null;
      return;
    }

    const foundBtn = t.closest('[data-spend-foundation]');
    if (foundBtn instanceof HTMLElement) {
      void applyFoundation(foundBtn, false);
      return;
    }
    const skillEl = t.closest('[data-spend-skill]');
    if (
      skillEl instanceof HTMLElement &&
      (t.closest('.skill__ring') || t.closest('.skill__name') || t === skillEl)
    ) {
      void applySkill(skillEl, false);
    }
  });

  document.addEventListener('contextmenu', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const foundBtn = t.closest('[data-spend-foundation]');
    if (foundBtn instanceof HTMLElement) {
      ev.preventDefault();
      void applyFoundation(foundBtn, true);
      return;
    }
    const skillEl = t.closest('[data-spend-skill]');
    if (skillEl instanceof HTMLElement) {
      ev.preventDefault();
      void applySkill(skillEl, true);
    }
  });

  const form = document.getElementById('wanting-form');
  if (form) form.addEventListener('submit', stageFromForm);

  // Docks overlay — do not compress the middle content column.
})();
