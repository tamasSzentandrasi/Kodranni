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
  /** @type {{ need: number, picks: Record<string, number> } | null} */
  let payPick = null;
  /** @type {{ mode: 'raise-one' | 'raise-two' | 'reduce-one', selected: string[] } | null} */
  let foundPick = null;

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
    if (rating === 0) return 1; // restore ∅ → I
    if (rating === 1) return 1;
    if (rating === 2) return 2;
    return null;
  }
  function refundFoundCost(rating) {
    if (rating === 2) return 1;
    if (rating === 3) return 2;
    return null; // cannot lower I or ∅ via refund
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

  let lastWordsSeen = wordsAvailable;

  function setBudget(creation) {
    if (!creation) return;
    const fp = creation.foundationPoints;
    const sp = creation.skillPoints;
    const w = creation.words;
    const wordsGrew = typeof lastWordsSeen === 'number' && w > lastWordsSeen;
    wordsAvailable = w;
    lastWordsSeen = w;
    [dock, draft].filter(Boolean).forEach((el) => {
      el.setAttribute('data-foundation-points', String(fp));
      el.setAttribute('data-skill-points', String(sp));
      el.setAttribute('data-words', String(w));
    });

    const fSpent = computeFoundationSpent();
    const sSpent = computeSkillSpent();
    const fPool = fSpent + fp;
    const sPool = sSpent + sp;
    const wordsOpen = Math.max(0, w - staged.length);

    const patch = (scope) => {
      if (!scope) return;
      const set = (sel, val) => {
        const el = scope.querySelector(sel);
        if (el) el.textContent = String(val);
      };
      set('[data-field="foundationPoints"]', fp);
      set('[data-field="skillPoints"]', sp);
      set('[data-field="words"]', w);
      set('[data-field="words-open"]', wordsOpen);
      set('[data-field="words-staged"]', staged.length);
      const wordsCard = scope.querySelector('[data-budget="words"]');
      if (wordsCard instanceof HTMLElement) {
        wordsCard.classList.toggle('budget-card--empty', w <= 0);
        const cta = wordsCard.querySelector('.budget-card__cta');
        if (cta) {
          cta.textContent = w > 0 ? 'Open Wanting →' : 'Awaiting Words at the table';
        }
        if (wordsGrew) {
          wordsCard.classList.remove('budget-card--pulse');
          void wordsCard.offsetWidth;
          wordsCard.classList.add('budget-card--pulse');
        }
      }
      set('[data-field="foundationSpent"]', fSpent);
      set('[data-field="skillSpent"]', sSpent);
      set('[data-field="foundationPool"]', fPool);
      set('[data-field="skillPool"]', sPool);
      const ff = scope.querySelector('[data-field="foundationFill"]');
      const sf = scope.querySelector('[data-field="skillFill"]');
      if (ff) ff.style.width = (fPool > 0 ? Math.round((fSpent / fPool) * 100) : 0) + '%';
      if (sf) sf.style.width = (sPool > 0 ? Math.round((sSpent / sPool) * 100) : 0) + '%';
      if (creation.birthOmenGranted != null) {
        const bf = scope.querySelector('[data-field="birthOmenFlag"]');
        if (bf) {
          bf.textContent = creation.birthOmenGranted ? 'Birth Omen ✓' : 'Birth Omen pending';
          bf.classList.toggle('flag--ok', !!creation.birthOmenGranted);
        }
      }
      if (creation.guidingHandGranted != null) {
        const gf = scope.querySelector('[data-field="guidingHandFlag"]');
        if (gf) {
          gf.textContent = creation.guidingHandGranted
            ? 'Guiding Hand ✓'
            : 'Guiding Hand pending';
          gf.classList.toggle('flag--ok', !!creation.guidingHandGranted);
        }
      }
    };
    patch(dock);
    patch(draft);
    patch(wanting);

    refreshAffordability(fp, sp);
  }

  async function pollCreation() {
    if (!dock) return;
    try {
      const res = await fetch('/api/character/' + encodeURIComponent(slug), {
        credentials: 'same-origin',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.creation) return;
      if (data.creation.locked || data.status === 'pending_review' || data.status === 'active') {
        // Creation finished out-of-band — refresh to drop edit docks
        if (document.body.classList.contains('creation-edit')) {
          location.reload();
        }
        return;
      }
      if (Array.isArray(data.skills)) {
        document.querySelectorAll('[data-spend-skill]').forEach((el) => {
          if (!(el instanceof HTMLElement)) return;
          const name = el.getAttribute('data-spend-skill');
          const entry = data.skills.find((s) => s && s.name === name);
          const rating = entry ? Number(entry.rating) : 0;
          paintSeal(el, rating);
        });
      }
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
      setBudget(data.creation);
    } catch {
      /* ignore */
    }
  }

  // Live budget / Words refresh (bot grants Omen, Hand, Words out-of-band)
  if (dock) {
    setInterval(() => {
      void pollCreation();
    }, 2000);
    // Immediate first poll so Discord awards appear without waiting a full interval
    void pollCreation();
  }

  function refreshAffordability(fp, sp) {
    const locked = document.body.classList.contains('wanting-lock');
    const wantingPay = document.body.classList.contains('wanting-pay');
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

      if (wantingPay) {
        if (chip) chip.textContent = rating === 0 ? '∅' : ROMAN[rating] || String(rating);
        btn.disabled = false;
        btn.removeAttribute('data-unaffordable');
        btn.classList.remove('found-row__spend--blocked');
        btn.setAttribute(
          'data-tip',
          foundPick
            ? rating === 0 && foundPick.mode !== 'reduce-one'
              ? 'Wanting: select ∅ Foundation to raise · right-click clears'
              : 'Wanting: left-click to select Foundation · right-click to clear'
            : 'Finish Wanting pay-path setup first',
        );
        return;
      }

      if (cost == null) {
        if (chip) chip.textContent = refund != null ? 'refund ' + refund : 'max';
      } else if (chip) {
        chip.textContent = canRaise ? '−' + cost : 'need ' + cost;
      }

      if (!canRaise && cost != null) {
        btn.classList.add('found-row__spend--blocked');
        btn.setAttribute('data-unaffordable', '1');
      }
      btn.disabled = locked || (!canRaise && !canLower);

      let raiseTip =
        canRaise
          ? 'Left-click: raise (costs ' + cost + ')'
          : cost != null
            ? 'Need ' + cost + ' Foundation pts'
            : rating >= 3
              ? 'At maximum (III)'
              : 'Cannot raise';
      if (rating === 0) {
        raiseTip = canRaise
          ? 'Rank ∅ — left-click to restore to I (costs ' + cost + ')'
          : locked
            ? 'Rank ∅ — open Wanting to raise, or finish Wanting first'
            : 'Rank ∅ — need ' + (cost != null ? cost : 1) + ' Foundation pts (or Wanting +1)';
      }
      const lowerTip = canLower
        ? 'Right-click: lower (refund ' + refund + ')'
        : rating <= 0
          ? 'Already at ∅'
          : 'Cannot lower below I';
      btn.setAttribute('data-tip', raiseTip + ' · ' + lowerTip);
    });

    document.querySelectorAll('[data-spend-skill]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const rating = Number(el.getAttribute('data-rating') || '0');
      const cost = nextSkillCost(rating);
      const refund = refundSkillCostVal(rating);
      const costEl = el.querySelector('.skill__cost');
      el.classList.remove('skill--spendable', 'skill--unaffordable', 'skill--refundable');
      el.setAttribute('data-refund', refund != null ? String(refund) : '');

      if (wantingPay) {
        if (costEl) costEl.textContent = rating > 0 ? 'mark' : '—';
        el.classList.toggle('skill--wanting-selectable', rating > 0);
        el.setAttribute(
          'data-tip',
          rating > 0
            ? 'Wanting: left-click mark rank · right-click unmark'
            : 'Untrained — cannot pay ranks',
        );
        return;
      }

      if (cost == null) {
        if (costEl) costEl.textContent = refund != null ? '+' + refund : 'max';
      } else if (costEl) {
        costEl.textContent = !locked && sp >= cost ? '−' + cost : 'need ' + cost;
      }

      if (!locked && cost != null && sp >= cost) el.classList.add('skill--spendable');
      else if (cost != null) el.classList.add('skill--unaffordable');
      if (!locked && refund != null) el.classList.add('skill--refundable');

      const tipText =
        (!locked && cost != null && sp >= cost
          ? 'Left-click: raise (costs ' + cost + ')'
          : cost != null
            ? 'Need ' + cost + ' Skill pts'
            : 'At maximum') +
        ' · ' +
        (refund != null && !locked
          ? 'Right-click: lower (refund ' + refund + ')'
          : 'Cannot lower below 0');
      el.setAttribute('data-tip', tipText);
      const more = el.querySelector('.skill__more p');
      if (more) more.textContent = tipText;
    });
  }

  function paintSeal(skillEl, rating, practice, threshold) {
    skillEl.setAttribute('data-rating', String(rating));
    skillEl.setAttribute('data-rated', rating > 0 ? 'true' : 'false');
    const n = skillEl.querySelector('.skill-ring__n');
    if (n) n.textContent = String(rating);
    const seal = skillEl.querySelector('.skill-ring');
    if (!(seal instanceof HTMLElement)) return;
    seal.classList.remove('skill-ring--empty', 'skill-ring--practice', 'skill-ring--max');
    const kind = rating <= 0 ? 'empty' : rating >= 3 ? 'max' : 'practice';
    seal.classList.add('skill-ring--' + kind);
    let p = 0;
    if (rating >= 3) p = 1;
    else if (rating > 0 && Number(threshold) > 0) {
      p = Math.min(1, Math.max(0, Number(practice) / Number(threshold)));
    }
    seal.style.setProperty('--p', String(p));
    skillEl.style.setProperty('--p', String(p));
  }

  function toggleFoundPick(btn) {
    if (!foundPick) return;
    const name = btn.getAttribute('data-spend-foundation');
    if (!name) return;
    const max = foundPick.mode === 'raise-two' ? 2 : 1;
    const idx = foundPick.selected.indexOf(name);
    if (idx >= 0) {
      foundPick.selected.splice(idx, 1);
    } else if (foundPick.selected.length < max) {
      foundPick.selected.push(name);
    } else if (max === 1) {
      foundPick.selected = [name];
    } else {
      msg('wanting', 'Already selected ' + max + ' Foundations.', false);
      return;
    }
    updateFoundPickUi();
  }

  async function applyFoundation(btn, refund) {
    if (foundPick) {
      if (!refund) toggleFoundPick(btn);
      else {
        const name = btn.getAttribute('data-spend-foundation');
        if (name) {
          foundPick.selected = foundPick.selected.filter((n) => n !== name);
          updateFoundPickUi();
        }
      }
      return;
    }
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

  function payPickTotal() {
    if (!payPick) return 0;
    return Object.values(payPick.picks).reduce((a, b) => a + b, 0);
  }

  function updatePayPickUi() {
    document.querySelectorAll('[data-spend-skill]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const name = el.getAttribute('data-spend-skill');
      const n = (payPick && name && payPick.picks[name]) || 0;
      el.classList.toggle('skill--wanting-pay', n > 0);
      el.classList.toggle('skill--wanting-selectable', !!payPick);
      let badge = el.querySelector('.skill__pay');
      if (n > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'skill__pay';
          el.appendChild(badge);
        }
        badge.textContent = '−' + n;
      } else if (badge) {
        badge.remove();
      }
    });
    updateFoundPickUi();
    renderWantingTracker();
  }

  function clearPayPick() {
    payPick = null;
    foundPick = null;
    document.body.classList.remove('wanting-pay');
    updatePayPickUi();
  }

  function updateFoundPickUi() {
    document.querySelectorAll('[data-spend-foundation]').forEach((btn) => {
      if (!(btn instanceof HTMLElement)) return;
      const name = btn.getAttribute('data-spend-foundation');
      const on = !!(foundPick && name && foundPick.selected.includes(name));
      btn.classList.toggle('found-row__spend--wanting', on);
      btn.classList.toggle('found-row__spend--wanting-selectable', !!foundPick);
    });
    renderWantingTracker();
  }

  function wantingOpen() {
    return document.body.classList.contains('wanting-open');
  }

  function renderWantingTracker() {
    const tracker = document.getElementById('wanting-tracker');
    if (!tracker) return;
    const title = tracker.querySelector('[data-wanting-tracker-title]');
    const body = tracker.querySelector('[data-wanting-tracker-body]');
    const status = tracker.querySelector('[data-wanting-tracker-status]');
    if (!body) return;
    if (!wantingOpen()) {
      tracker.hidden = true;
      return;
    }
    tracker.hidden = false;
    const titles = {
      plus_one_foundation: '+1 Foundation',
      plus_two_foundation_split: '+2 Foundations (split)',
      plus_five_skill: '+5 Skill points',
      positive_trait: 'Positive Trait',
    };
    if (title) {
      title.textContent = (formMenu && titles[formMenu]) || 'Pick a Wanting line';
    }

    const rows = [];
    if (!formMenu) {
      rows.push({
        label: 'Menu',
        value: 'Choose +1 Found · +2 · +5 Skill · Trait',
        done: false,
      });
    }
    if (foundPick) {
      const need = foundPick.mode === 'raise-two' ? 2 : 1;
      const kind = foundPick.mode === 'reduce-one' ? 'Reduce' : 'Raise';
      const done = foundPick.selected.length >= need;
      rows.push({
        label: kind + ' Foundation' + (need > 1 ? 's' : '') + ' on Core',
        value:
          (foundPick.selected.join(', ') || 'tap a Found button') +
          ' · ' +
          foundPick.selected.length +
          '/' +
          need,
        done,
      });
    }
    if (payPick) {
      const done = payPickTotal() >= payPick.need;
      const detail = Object.entries(payPick.picks)
        .map(([k, v]) => k + ' −' + v)
        .join(', ');
      rows.push({
        label: 'Skill ranks to pay on Core',
        value:
          payPickTotal() +
          '/' +
          payPick.need +
          (detail ? ' · ' + detail : ' · mark rings'),
        done,
      });
    }
    const traitInput = document.querySelector('#wanting-form input[name="traitName"]');
    const negInput = document.querySelector('#wanting-form input[name="negativeTrait"]');
    const payPath = document.querySelector('#wanting-form select[name="payPath"]');
    if (formMenu === 'positive_trait') {
      const n = traitInput && 'value' in traitInput ? String(traitInput.value).trim() : '';
      rows.push({ label: 'Trait name', value: n || 'type it in The Wanting', done: !!n });
    }
    if (formMenu === 'plus_two_foundation_split') {
      const path = payPath && 'value' in payPath ? String(payPath.value) : '';
      rows.push({
        label: 'Pay path',
        value: path === 'skills' ? 'Skill ranks' : path === 'trait' ? 'Negative Trait' : 'choose…',
        done: path === 'skills' || path === 'trait',
      });
      if (path === 'trait') {
        const n = negInput && 'value' in negInput ? String(negInput.value).trim() : '';
        rows.push({ label: 'Negative Trait', value: n || 'name it', done: !!n });
      }
    }
    if (staged.length) {
      rows.push({
        label: 'Staged Words',
        value: staged.length + ' ready to Confirm',
        done: true,
      });
    }

    const allDone = rows.length > 0 && rows.every((r) => r.done);
    if (status) {
      status.textContent = !formMenu
        ? 'Waiting for menu'
        : allDone
          ? 'Ready to Stage'
          : 'In progress';
      status.classList.toggle('is-ready', allDone && !!formMenu);
    }

    body.innerHTML = rows
      .map(
        (r) =>
          '<div class="wanting-tracker__row' +
          (r.done ? ' is-done' : ' is-pending') +
          '"><span>' +
          r.label +
          '</span><strong>' +
          r.value +
          '</strong></div>',
      )
      .join('');
  }

  function togglePayPick(skillEl) {
    if (!payPick) return;
    const skill = skillEl.getAttribute('data-spend-skill');
    if (!skill) return;
    const rating = Number(skillEl.getAttribute('data-rating') || '0');
    if (rating <= 0) {
      msg('wanting', 'Only rated skills can pay ranks.', false);
      return;
    }
    const cur = payPick.picks[skill] || 0;
    if (cur >= rating) {
      msg('wanting', 'No more ranks on ' + skill + '.', false);
      return;
    }
    if (payPickTotal() >= payPick.need) {
      msg('wanting', 'Already marked ' + payPick.need + ' ranks.', false);
      return;
    }
    payPick.picks[skill] = cur + 1;
    updatePayPickUi();
  }

  function untogglePayPick(skillEl) {
    if (!payPick) return;
    const skill = skillEl.getAttribute('data-spend-skill');
    if (!skill || !payPick.picks[skill]) return;
    payPick.picks[skill] -= 1;
    if (payPick.picks[skill] <= 0) delete payPick.picks[skill];
    updatePayPickUi();
  }

  async function applySkill(skillEl, refund) {
    if (payPick) {
      if (refund) untogglePayPick(skillEl);
      else togglePayPick(skillEl);
      return;
    }
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
      paintSeal(skillEl, next, entry && entry.practice, entry && entry.threshold);
      setBudget(data.creation);
      msg('spend', skill + (refund ? ' lowered.' : ' raised.'), true);
    } catch (e) {
      msg('spend', e instanceof Error ? e.message : String(e), false);
    }
  }

  function wantingTabbables() {
    if (!wanting) return [];
    return Array.from(
      wanting.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.hidden || el.closest('[hidden]')) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function setConfirmHidden(hide) {
    const confirmEl = document.getElementById('draft-confirm');
    if (confirmEl) confirmEl.hidden = hide;
  }

  function syncWantingMenuAfford() {
    if (!wanting) return;
    const open = Math.max(0, wordsAvailable - staged.length);
    wanting.querySelectorAll('[data-wanting-menu]').forEach((btn) => {
      if (!(btn instanceof HTMLElement)) return;
      btn.disabled = open <= 0;
      btn.classList.toggle('wanting-menu__item--disabled', open <= 0);
    });
  }

  function openWanting() {
    if (!wanting) return;
    wanting.hidden = false;
    document.body.classList.add('wanting-open', 'wanting-lock');
    document.body.classList.add('creation-edit');
    setConfirmHidden(true);
    const tracker = document.getElementById('wanting-tracker');
    if (tracker) tracker.hidden = false;
    renderStaged();
    renderWantingTracker();
    syncWantingMenuAfford();
    setBudget({
      foundationPoints: Number(root.getAttribute('data-foundation-points') || '0'),
      skillPoints: Number(root.getAttribute('data-skill-points') || '0'),
      words: wordsAvailable,
    });
    if (wordsAvailable <= 0) {
      msg(
        'wanting',
        'No Words yet — the Storyteller awards them at the table (/award-word). Budgets still update live when they do.',
        false,
      );
    } else {
      msg('wanting', '', true);
    }
    const closeBtn = wanting.querySelector('[data-wanting-close]');
    if (closeBtn instanceof HTMLElement) closeBtn.focus();
  }

  function closeWanting(discard) {
    if (!wanting) return;
    if (discard) staged = [];
    wanting.hidden = true;
    document.body.classList.remove('wanting-open', 'wanting-lock');
    setConfirmHidden(false);
    const form = document.getElementById('wanting-form');
    if (form) form.hidden = true;
    formMenu = null;
    clearPayPick();
    const tracker = document.getElementById('wanting-tracker');
    if (tracker) tracker.hidden = true;
    renderStaged();
    setBudget({
      foundationPoints: Number(root.getAttribute('data-foundation-points') || '0'),
      skillPoints: Number(root.getAttribute('data-skill-points') || '0'),
      words: wordsAvailable,
    });
    const wordsCard = dock && dock.querySelector('[data-open-wanting]');
    if (wordsCard instanceof HTMLElement) wordsCard.focus();
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
    syncWantingMenuAfford();
  }

  function catalogFoundations() {
    const tpl = document.getElementById('wanting-field-catalog');
    if (!tpl) return null;
    const src = tpl.content.querySelector('[data-foundations]');
    return src ? src.cloneNode(true) : null;
  }

  function removeSkillsFromPayPick() {
    if (!payPick) return [];
    return Object.entries(payPick.picks).map(([skill, ranks]) => ({ skill, ranks }));
  }

  function showWantingForm(menu) {
    const form = document.getElementById('wanting-form');
    const fields = wanting && wanting.querySelector('[data-wanting-form-fields]');
    const title = wanting && wanting.querySelector('[data-wanting-form-title]');
    if (!form || !fields || !title) return;
    formMenu = menu;
    form.hidden = false;
    fields.innerHTML = '';
    clearPayPick();
    document.body.classList.add('wanting-pay');

    const labels = {
      plus_one_foundation: '+1 Foundation · pick Found + 3 skill ranks on Core',
      plus_two_foundation_split: '+2 Foundations · pick two on Core, then pay path',
      plus_five_skill: '+5 Skill points · pick Found to reduce on Core',
      positive_trait: 'Positive Trait · name + 3 skill ranks on Core',
    };
    title.textContent = labels[menu] || menu;

    function lab(text, node) {
      const l = document.createElement('label');
      l.appendChild(document.createTextNode(text));
      if (node) l.appendChild(node);
      fields.appendChild(l);
    }

    if (menu === 'plus_one_foundation') {
      lab('On Core: click one Foundation to raise (∅ allowed), mark 3 skill ranks.', null);
      foundPick = { mode: 'raise-one', selected: [] };
      payPick = { need: 3, picks: {} };
      updatePayPickUi();
    } else if (menu === 'positive_trait') {
      const inp = document.createElement('input');
      inp.name = 'traitName';
      inp.className = 'kod-ink';
      inp.required = true;
      inp.autocomplete = 'off';
      inp.placeholder = 'Name the Trait…';
      inp.addEventListener('input', renderWantingTracker);
      lab('Trait name', inp);
      foundPick = null;
      payPick = { need: 3, picks: {} };
      updatePayPickUi();
    } else if (menu === 'plus_two_foundation_split') {
      lab('On Core: click two Foundations to raise (∅ allowed).', null);
      foundPick = { mode: 'raise-two', selected: [] };
      const pay = document.createElement('select');
      pay.name = 'payPath';
      pay.className = 'kod-ink kod-ink--empty';
      pay.required = true;
      pay.innerHTML =
        '<option value="" disabled selected>Choose pay path…</option>' +
        '<option value="skills">5 skill ranks on Core</option>' +
        '<option value="trait">Negative Trait</option>';
      lab('Pay with (exclusive)', pay);
      const nt = document.createElement('input');
      nt.name = 'negativeTrait';
      nt.className = 'kod-ink';
      nt.placeholder = 'Name the Negative Trait…';
      nt.disabled = true;
      nt.addEventListener('input', renderWantingTracker);
      lab('If Trait path', nt);
      const syncPayEmpty = () => {
        pay.classList.toggle('kod-ink--empty', !pay.value);
      };
      pay.addEventListener('change', () => {
        payPick = null;
        syncPayEmpty();
        if (pay.value === 'skills') {
          payPick = { need: 5, picks: {} };
          nt.value = '';
          nt.disabled = true;
        } else if (pay.value === 'trait') {
          nt.disabled = false;
          nt.focus();
        }
        updatePayPickUi();
      });
      syncPayEmpty();
      updatePayPickUi();
    } else if (menu === 'plus_five_skill') {
      lab('On Core: click the Foundation to reduce by 1.', null);
      foundPick = { mode: 'reduce-one', selected: [] };
      payPick = null;
      updatePayPickUi();
    }
    renderWantingTracker();
  }

  /** @returns {boolean} true if a Word was staged */
  function stageFromForm(ev) {
    if (ev) ev.preventDefault();
    if (!formMenu) return false;
    if (staged.length >= wordsAvailable) {
      msg('wanting', 'No Words left to stage.', false);
      return false;
    }
    const form = document.getElementById('wanting-form');
    if (!form) return false;
    const fd = new FormData(form);
    const readInput = (name) => {
      const el = form.querySelector('[name="' + name + '"]');
      if (el && 'value' in el) return String(el.value || '').trim();
      const fromFd = fd.get(name);
      return fromFd != null ? String(fromFd).trim() : '';
    };
    const payload = { menu: formMenu };
    let label = formMenu;

    if (formMenu === 'plus_one_foundation') {
      if (!foundPick || foundPick.selected.length !== 1) {
        msg('wanting', 'Select exactly one Foundation on Core.', false);
        return false;
      }
      if (!payPick || payPickTotal() !== 3) {
        msg('wanting', 'Mark exactly 3 skill ranks on Core.', false);
        return false;
      }
      payload.foundation = foundPick.selected[0];
      payload.removeSkills = removeSkillsFromPayPick();
      label = '+1 ' + payload.foundation + ' (−3 skill ranks)';
    } else if (formMenu === 'plus_two_foundation_split') {
      const path = readInput('payPath');
      if (!foundPick || foundPick.selected.length !== 2) {
        msg('wanting', 'Select exactly two Foundations on Core.', false);
        return false;
      }
      if (path !== 'skills' && path !== 'trait') {
        msg('wanting', 'Choose Trait or skill-rank pay path.', false);
        return false;
      }
      payload.foundations = [foundPick.selected[0], foundPick.selected[1]];
      if (path === 'trait') {
        const name = readInput('negativeTrait');
        if (!name) {
          msg('wanting', 'Name the Negative Trait.', false);
          return false;
        }
        payload.negativeTrait = { name };
        label =
          '+1 ' + payload.foundations[0] + ' & +1 ' + payload.foundations[1] + ' (Negative Trait)';
      } else {
        if (!payPick || payPickTotal() !== 5) {
          msg('wanting', 'Mark exactly 5 skill ranks on Core.', false);
          return false;
        }
        payload.removeSkills = removeSkillsFromPayPick();
        label =
          '+1 ' + payload.foundations[0] + ' & +1 ' + payload.foundations[1] + ' (−5 skill ranks)';
      }
    } else if (formMenu === 'plus_five_skill') {
      if (!foundPick || foundPick.selected.length !== 1) {
        msg('wanting', 'Select one Foundation to reduce on Core.', false);
        return false;
      }
      payload.foundation = foundPick.selected[0];
      payload.addSkillPoints = 5;
      label = '+5 Skill pts (−1 ' + payload.foundation + ')';
    } else if (formMenu === 'positive_trait') {
      payload.traitName = readInput('traitName');
      if (!payload.traitName) {
        msg('wanting', 'Trait name required.', false);
        return false;
      }
      if (!payPick || payPickTotal() !== 3) {
        msg('wanting', 'Mark exactly 3 skill ranks on Core.', false);
        return false;
      }
      payload.removeSkills = removeSkillsFromPayPick();
      label = 'Trait “' + payload.traitName + '” (−3 skill ranks)';
    } else {
      msg('wanting', 'Unknown Wanting menu.', false);
      return false;
    }

    staged.push({
      id: String(Date.now()) + Math.random(),
      menu: formMenu,
      label,
      payload,
    });
    form.hidden = true;
    formMenu = null;
    clearPayPick();
    renderStaged();
    renderWantingTracker();
    msg('wanting', 'Staged. Undo anytime before Confirm.', true);
    return true;
  }

  async function confirmWanting() {
    // If a menu form is still open, stage it first (avoids losing a filled Trait)
    if (formMenu) {
      const ok = stageFromForm(null);
      if (!ok) {
        msg(
          'wanting',
          'Finish or Back the open Wanting line before Confirm (Stage this Word).',
          false,
        );
        return;
      }
    }
    if (!staged.length) {
      msg('wanting', 'Nothing staged — pick a menu line, Stage this Word, then Confirm.', false);
      return;
    }
    try {
      let creation = null;
      let lastTraits = null;
      for (const item of staged) {
        const body = {
          action: 'spend-wanting',
          ...item.payload,
          menu: item.menu || (item.payload && item.payload.menu),
        };
        const data = await post(body);
        creation = data.creation;
        if (Array.isArray(data.traits)) lastTraits = data.traits;
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
            paintSeal(el, rating, entry && entry.practice, entry && entry.threshold);
          });
        }
      }
      staged = [];
      if (creation) {
        wordsAvailable = creation.words ?? wordsAvailable;
        setBudget(creation);
      }
      closeWanting(false);
      const traitNote =
        Array.isArray(lastTraits) && lastTraits.length
          ? ' · Traits: ' + lastTraits.map((t) => t.name).join(', ')
          : '';
      msg('spend', 'Wanting confirmed' + traitNote + '.', true);
      await pollCreation();
      setTimeout(() => {
        if (Array.isArray(lastTraits) && lastTraits.length) {
          location.href = '/characters/' + encodeURIComponent(slug) + '/echoes/';
        } else {
          location.reload();
        }
      }, 600);
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
        const val = (sel) => {
          const el = draft.querySelector(sel);
          return el && 'value' in el ? String(el.value) : undefined;
        };
        await post({
          action: 'update-concept',
          name: val('[data-field="name"]'),
          concept: val('[data-field="concept"]'),
          communityTie: val('[data-field="communityTie"]'),
          whoWeSee: val('[data-field="whoWeSee"]'),
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
      clearPayPick();
      return;
    }

    const foundBtn = t.closest('[data-spend-foundation]');
    if (foundBtn instanceof HTMLElement) {
      void applyFoundation(foundBtn, false);
      return;
    }
    const skillEl = t.closest('[data-spend-skill]');
    if (skillEl instanceof HTMLElement) {
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

  document.addEventListener('keydown', (ev) => {
    if (!wanting || wanting.hidden) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      closeWanting(true);
      return;
    }
    if (ev.key !== 'Tab') return;
    const list = wantingTabbables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    const inside = wanting.contains(document.activeElement);
    if (!inside) {
      ev.preventDefault();
      (ev.shiftKey ? last : first).focus();
      return;
    }
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  });

  // Docks overlay — do not compress the middle content column.
})();
