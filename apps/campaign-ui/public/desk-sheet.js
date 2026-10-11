(function () {
  function boot() {
    const root = document.querySelector('[data-desk-sheet]');
    if (!root) return;
    const slug = root.getAttribute('data-desk-sheet');
    if (!slug) return;

    const ROMAN = ['∅', 'I', 'II', 'III', 'IV'];

    function roman(n) {
      return ROMAN[n] ?? String(n);
    }

    function say(text) {
      let note = document.querySelector('.desk-note');
      if (!note) {
        note = document.createElement('p');
        note.className = 'desk-note';
        note.setAttribute('role', 'status');
        document.body.appendChild(note);
      }
      note.hidden = !text;
      note.textContent = text || '';
    }

    let chain = Promise.resolve();
    let seq = 0;

    function post(body) {
      const mine = ++seq;
      const run = chain.then(function () {
        return fetch('/api/desk/edit', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }).then(async function (res) {
          const data = await res.json().catch(function () {
            return {};
          });
          return { ok: res.ok, data: data, mine: mine };
        });
      });
      chain = run.then(
        function () {
          return null;
        },
        function () {
          return null;
        },
      );
      return run;
    }

    function paintFoundations(data) {
      document.querySelectorAll('[data-desk-foundation]').forEach(function (el) {
        const name = el.getAttribute('data-desk-foundation');
        const raw = data.foundations ? data.foundations[name] : undefined;
        if (raw == null) return;
        const eff = data.foundationsEffective ? data.foundationsEffective[name] : raw;
        el.setAttribute('data-rating', String(raw));
        el.setAttribute('aria-label', name + ' ' + roman(raw));
        const mark = el.querySelector('[data-roman]');
        if (mark) mark.textContent = roman(raw);
        const val = el.closest('.found-row__val');
        if (!val) return;
        let note = val.querySelector('[data-effective]');
        if (eff != null && eff !== raw) {
          if (!note) {
            note = document.createElement('span');
            note.setAttribute('data-effective', '');
            val.appendChild(note);
          }
          note.textContent = 'effective ' + roman(eff);
        } else if (note) note.remove();
      });
    }

    function paintHarm(data) {
      document.querySelectorAll('[data-desk-harm]').forEach(function (el) {
        const track = el.getAttribute('data-desk-harm');
        const pts = data.harm ? data.harm[track] : undefined;
        if (pts == null) return;
        el.querySelectorAll('.pip').forEach(function (pip, i) {
          pip.classList.toggle('pip--on', i < pts);
        });
        const pips = el.querySelector('.pips');
        if (pips) pips.setAttribute('aria-label', pts + ' of 3');
      });
      const groups = document.querySelector('.found-groups');
      let stab = document.querySelector('[data-desk-stabilise]');
      if (data.dying && !stab && groups) {
        stab = document.createElement('button');
        stab.type = 'button';
        stab.className = 'kod-btn';
        stab.setAttribute('data-desk-stabilise', '');
        stab.textContent = 'Stabilise';
        stab.addEventListener('click', function () {
          send({ op: 'stabilise', slug: slug });
        });
        groups.after(stab);
      } else if (!data.dying && stab) stab.remove();
    }

    function practiceFrac(rating, practice, threshold) {
      if (rating >= 3) return 1;
      if (rating <= 0 || threshold <= 0) return 0;
      return Math.max(0, Math.min(1, practice / threshold));
    }

    function paintSkill(el, row) {
      const rating = row.rating;
      const practice = row.practice;
      const threshold = row.threshold;
      const p = practiceFrac(rating, practice, threshold);
      el.setAttribute('data-rating', String(rating));
      el.setAttribute('data-rated', rating > 0 ? 'true' : 'false');
      el.setAttribute('data-practice', String(practice));
      el.setAttribute('data-threshold', String(threshold));
      el.style.setProperty('--p', String(p));
      const ring = el.querySelector('.skill__ring');
      if (ring) ring.style.setProperty('--p', String(p));
      const inner = el.querySelector('.skill__inner');
      if (inner) inner.textContent = roman(rating);
      const count = el.querySelector('.skill__practice');
      if (count) {
        const show = rating > 0 && rating < 3;
        count.hidden = !show;
        count.textContent = show ? practice + '/' + threshold : '';
      }
    }

    function paintExertion(data) {
      const well = document.querySelector('[data-desk-exertion]');
      if (!well || !data.exertion) return;
      const max = data.exertion.max;
      const current = data.exertion.current;
      well.setAttribute('data-max', String(max));
      const aside = well.closest('.vtrack');
      if (!aside) return;
      aside.style.setProperty('--well-p', String(max > 0 ? current / max : 0));
      aside.setAttribute('aria-label', 'Exertion ' + current + ' of ' + max);
      const read = aside.querySelector('.vtrack__readout');
      if (read) {
        read.textContent = '';
        read.append(String(current));
        const of = document.createElement('span');
        of.className = 'vtrack__of';
        of.textContent = '/' + max;
        read.append(of);
      }
    }

    function paint(data) {
      if (!data) return;
      if (data.foundations) paintFoundations(data);
      if (data.harm) paintHarm(data);
      if (data.skills) {
        data.skills.forEach(function (row) {
          const el = document.querySelector('[data-desk-skill="' + CSS.escape(row.name) + '"]');
          if (el) paintSkill(el, row);
        });
      }
      if (data.exertion) paintExertion(data);
    }

    function send(body) {
      return post(body).then(function (res) {
        if (!res || res.mine !== seq) return res;
        if (!res.ok) {
          say((res.data && res.data.error) || 'Could not save');
          location.reload();
          return res;
        }
        say('');
        paint(res.data);
        return res;
      });
    }

    function bindStep(el, onStep) {
      el.addEventListener('pointerdown', function (ev) {
        if (ev.button !== 0 && ev.button !== 2) return;
        if (ev.button === 2) ev.preventDefault();
        try {
          el.setPointerCapture(ev.pointerId);
        } catch {
          /* the pointer can already be gone */
        }
      });
      el.addEventListener('pointerup', function (ev) {
        if (ev.button !== 0 && ev.button !== 2) return;
        onStep(ev.button === 2 ? -1 : 1);
      });
      el.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
      });
    }

    document.querySelectorAll('[data-desk-foundation]').forEach(function (el) {
      bindStep(el, function (delta) {
        const raw = Number(el.getAttribute('data-rating') || 0);
        const next = Math.max(0, Math.min(4, raw + delta));
        if (next === raw) return;
        el.setAttribute('data-rating', String(next));
        const mark = el.querySelector('[data-roman]');
        if (mark) mark.textContent = roman(next);
        send({
          op: 'foundation',
          slug: slug,
          name: el.getAttribute('data-desk-foundation'),
          delta: delta,
        });
      });
    });

    document.querySelectorAll('[data-desk-harm]').forEach(function (el) {
      bindStep(el, function (delta) {
        const on = el.querySelectorAll('.pip--on').length;
        const next = Math.max(0, Math.min(3, on + delta));
        if (next === on) return;
        el.querySelectorAll('.pip').forEach(function (pip, i) {
          pip.classList.toggle('pip--on', i < next);
        });
        send({ op: 'harm', slug: slug, track: el.getAttribute('data-desk-harm'), delta: delta });
      });
    });

    const stabilise = document.querySelector('[data-desk-stabilise]');
    if (stabilise) {
      stabilise.addEventListener('click', function () {
        send({ op: 'stabilise', slug: slug });
      });
    }

    document.querySelectorAll('[data-desk-skill]').forEach(function (el) {
      const name = el.getAttribute('data-desk-skill');
      let hold = null;

      function stopHold() {
        if (!hold) return;
        window.clearTimeout(hold.timer);
        window.clearInterval(hold.interval);
      }

      function pulse(dir) {
        const rating = Number(el.getAttribute('data-rating') || 0);
        const practice = Number(el.getAttribute('data-practice') || 0);
        const threshold = Number(el.getAttribute('data-threshold') || 0);
        if (rating <= 0 || rating >= 3) return;
        if (dir < 0 && practice <= 0) return;
        const next = Math.max(0, practice + dir);
        paintSkill(el, { rating: rating, practice: next, threshold: threshold });
        send({ op: 'skill', slug: slug, name: name, ratingDelta: 0, practiceDelta: dir });
      }

      el.addEventListener('pointerdown', function (ev) {
        if (ev.button !== 0 && ev.button !== 2) return;
        if (ev.target instanceof Element && ev.target.closest('.skill__more')) return;
        if (ev.button === 2) ev.preventDefault();
        try {
          el.setPointerCapture(ev.pointerId);
        } catch {
          /* the pointer can already be gone */
        }
        stopHold();
        const dir = ev.button === 2 ? -1 : 1;
        hold = { dir: dir, practiced: false, timer: 0, interval: 0 };
        hold.timer = window.setTimeout(function () {
          if (!hold) return;
          hold.practiced = true;
          pulse(dir);
          hold.interval = window.setInterval(function () {
            pulse(dir);
          }, 280);
        }, 450);
      });

      el.addEventListener('pointerup', function (ev) {
        const state = hold;
        stopHold();
        hold = null;
        if (!state || state.practiced) return;
        if (ev.button !== 0 && ev.button !== 2) return;
        const rating = Number(el.getAttribute('data-rating') || 0);
        const next = Math.max(0, Math.min(3, rating + state.dir));
        if (next === rating) return;
        const practice = Number(el.getAttribute('data-practice') || 0);
        const threshold = Number(el.getAttribute('data-threshold') || 0);
        paintSkill(el, { rating: next, practice: practice, threshold: threshold });
        send({ op: 'skill', slug: slug, name: name, ratingDelta: state.dir, practiceDelta: 0 });
      });

      el.addEventListener('pointercancel', function () {
        stopHold();
        hold = null;
      });

      el.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
      });
    });

    const well = document.querySelector('[data-desk-exertion]');
    if (well) {
      well.addEventListener('click', function (ev) {
        const rect = well.getBoundingClientRect();
        if (!rect.height) return;
        const ratio = 1 - (ev.clientY - rect.top) / rect.height;
        const max = Number(well.getAttribute('data-max') || 0);
        const current = Math.max(0, Math.min(max, Math.round(Math.max(0, Math.min(1, ratio)) * max)));
        const aside = well.closest('.vtrack');
        if (aside) aside.style.setProperty('--well-p', String(max > 0 ? current / max : 0));
        send({ op: 'exertion', slug: slug, current: current });
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
