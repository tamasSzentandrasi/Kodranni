(function () {
  var FOOTINGS = [
    { id: 'severeA', a: 6, b: 12 },
    { id: 'slightA', a: 6, b: 8 },
    { id: 'equal', a: 8, b: 8 },
    { id: 'slightB', a: 8, b: 6 },
    { id: 'severeB', a: 12, b: 6 },
  ];
  var MARKS = { small: '1 mark a step', skirmish: '2 marks a step', battle: '3 marks a step' };
  var sceneTimer = 0;

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function deskOn() {
    return document.documentElement.getAttribute('data-desk') === '1';
  }

  function note(text) {
    var el = document.querySelector('[data-session-note]');
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || '';
  }

  function lighten(hex) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    function mix(channel, toward) {
      return Math.round(channel + (toward - channel) * 0.28);
    }
    var r = mix((n >> 16) & 255, 0xf4);
    var g = mix((n >> 8) & 255, 0xef);
    var b = mix(n & 255, 0xe6);
    return '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
  }

  function fills(dyeA, dyeB) {
    if (String(dyeA).toLowerCase() === String(dyeB).toLowerCase()) return { a: dyeA, b: lighten(dyeB) };
    return { a: dyeA, b: dyeB };
  }

  function markerWords(sideA, sideB, position, length) {
    if (position <= 0) return sideA + ' has collapsed.';
    if (position >= length) return sideB + ' has collapsed.';
    return 'The marker stands at ' + position + ' of ' + length + '.';
  }

  function barHtml(tide) {
    var length = tide.length || 0;
    var at = length > 0 ? (tide.position / length) * 100 : 0;
    var fill = fills(tide.dyeA, tide.dyeB);
    var marker = tide.marker || markerWords(tide.sideA, tide.sideB, tide.position, length);
    return (
      '<div class="kod-tide" style="--tide-at: ' + at.toFixed(1) + '%; --tide-a: ' + esc(fill.a) + '; --tide-b: ' + esc(fill.b) + '" aria-label="' + esc(marker) + '">' +
      '<div class="kod-tide__labels">' +
      '<span class="kod-tide__label kod-tide__label--a">' + esc(tide.sideA) + ' · 0</span>' +
      '<span class="kod-tide__label kod-tide__label--mid">' + esc(tide.position) + ' of ' + esc(length) + '</span>' +
      '<span class="kod-tide__label kod-tide__label--b">' + esc(length) + ' · ' + esc(tide.sideB) + '</span>' +
      '</div>' +
      '<div class="kod-tide__rail"><div class="kod-tide__track">' +
      '<div class="kod-tide__fill kod-tide__fill--a"></div>' +
      '<div class="kod-tide__fill kod-tide__fill--b"></div>' +
      '</div><div class="kod-tide__marker" aria-hidden="true">' +
      '<span class="kod-tide__marker-head"></span><span class="kod-tide__marker-stem"></span><span class="kod-tide__marker-foot"></span>' +
      '</div></div><p class="kod-tide__readout">' + esc(marker) + '</p></div>'
    );
  }

  // Keep in step with OMEN_NET in packages/hall-render/src/session.ts.
  var NET = [
    null,
    [1, 0, 'up'],
    [0.5, 1, 'up'],
    [1, 1, 'down'],
    [1.5, 1, 'up'],
    [0, 2, 'up'],
    [0.5, 2, 'down'],
    [1, 2, 'up'],
    [1.5, 2, 'down'],
    [2, 2, 'up'],
    [0.5, 3, 'up'],
    [1, 3, 'down'],
    [1.5, 3, 'up'],
    [0.5, 4, 'down'],
    [1, 4, 'up'],
    [1.5, 4, 'down'],
    [0.5, 5, 'up'],
    [1, 5, 'down'],
    [1.5, 5, 'up'],
    [0.5, 6, 'down'],
    [1, 6, 'up'],
  ];

  function dieHtml(die) {
    var cells = (die || []).map(function (face) {
      var seat = NET[face.face] || NET[1];
      var cls = 'omen-face';
      if (face.tone) cls += ' omen-face--' + face.tone;
      if (face.fixed) cls += ' is-locked';
      var line = face.effect ? '<span class="omen-face__line">' + esc(face.effect) + '</span>' : '';
      var title = face.effect ? ' title="' + esc(face.effect) + '"' : '';
      return '<li class="' + cls + '" data-face="' + esc(face.face) + '" data-tone="' + esc(face.tone || '') + '" data-point="' + seat[2] + '" style="--x:' + seat[0] + ';--y:' + seat[1] + '"' + title + '><span class="omen-face__n">' + esc(face.face) + '</span>' + line + '</li>';
    }).join('');
    return '<ol class="omen-die">' + cells + '</ol>';
  }

  function paint(reading) {
    if (!reading || deskOn()) return;
    var scene = document.querySelector('[data-session-scene]');
    var tide = document.querySelector('[data-session-tide]');
    if (scene && reading.die) scene.innerHTML = dieHtml(reading.die);
    if (tide) tide.innerHTML = reading.tide ? barHtml(reading.tide) : '<p data-session-tide-empty>No Tide is open.</p>';
  }

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          note(data.error || 'Could not save');
          return null;
        }
        note('');
        if (data.reading) paint(data.reading);
        return data;
      });
    }).catch(function () {
      note('Could not save');
      return null;
    });
  }

  function restAward(kind, food, water) {
    var n = kind === 'short' ? 1 : 2;
    if (food) n += 1;
    if (!food || !water) n -= 1;
    return Math.max(0, n);
  }

  function paintAwards(band) {
    var food = band.querySelector('[data-ample="food"]');
    var water = band.querySelector('[data-ample="water"]');
    var ampleFood = food instanceof HTMLInputElement && food.checked;
    var ampleWater = water instanceof HTMLInputElement && water.checked;
    var shortBtn = band.querySelector('[data-rest-kind="short"]');
    var longBtn = band.querySelector('[data-rest-kind="long"]');
    if (shortBtn) shortBtn.textContent = 'Short rest +' + restAward('short', ampleFood, ampleWater);
    if (longBtn) longBtn.textContent = 'Long rest +' + restAward('long', ampleFood, ampleWater);
  }

  function readFaces() {
    return Array.from(document.querySelectorAll('.omen-die [data-face]')).map(function (li) {
      if (li.classList.contains('is-locked')) return null;
      var text = '';
      var line = li.querySelector('.omen-face__line');
      text = line ? line.textContent.trim() : '';
      if (!text) return null;
      var tone = li.getAttribute('data-tone') || 'mixed';
      if (tone !== 'positive' && tone !== 'negative' && tone !== 'mixed') tone = 'mixed';
      return {
        face: Number(li.getAttribute('data-face')),
        effect: text,
        tone: tone,
        hidden: li.getAttribute('data-whisper') === '1',
      };
    }).filter(Boolean);
  }

  function scheduleScene() {
    window.clearTimeout(sceneTimer);
    sceneTimer = window.setTimeout(function () {
      post('/api/desk/table', { op: 'scene', faces: readFaces() });
    }, 160);
  }

  function setTone(li, tone) {
    li.setAttribute('data-tone', tone);
    li.classList.remove('omen-face--positive', 'omen-face--negative', 'omen-face--mixed');
    if (tone) li.classList.add('omen-face--' + tone);
    var box = lectern();
    var root = box && box.getAttribute('data-face') === li.getAttribute('data-face') ? box : li;
    root.querySelectorAll('[data-tone-pick]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-tone-pick') === tone ? 'true' : 'false');
    });
  }

  function syncLine(li, text) {
    var hit = li.querySelector('.omen-face__hit');
    if (!hit) return;
    var line = hit.querySelector('.omen-face__line');
    if (!text) {
      if (line) line.remove();
      return;
    }
    if (!line) {
      line = document.createElement('span');
      line.className = 'omen-face__line';
      hit.appendChild(line);
    }
    line.textContent = text;
  }

  function syncVeil(li, on) {
    var hit = li.querySelector('.omen-face__hit');
    if (!hit) return;
    var veil = hit.querySelector('.omen-face__veil');
    if (on && !veil) {
      veil = document.createElement('span');
      veil.className = 'omen-face__veil';
      veil.textContent = 'Whisper';
      hit.appendChild(veil);
    }
    if (!on && veil) veil.remove();
  }

  function lectern() {
    return document.querySelector('[data-omen-lectern]');
  }

  function selectedFace() {
    return document.querySelector('.omen-face.is-selected');
  }

  function restLectern() {
    var box = lectern();
    if (!box || selectedFace()) return;
    box.removeAttribute('data-face');
    var idle = box.querySelector('.omen-lectern__idle');
    var work = box.querySelector('.omen-lectern__work');
    if (idle) idle.hidden = false;
    if (work) work.hidden = true;
  }

  function closeFace(li, keep) {
    if (!li) return;
    var box = lectern();
    if (box && box.getAttribute('data-face') === li.getAttribute('data-face')) {
      var area = box.querySelector('[data-omen-line]');
      var text = area instanceof HTMLTextAreaElement ? area.value.trim() : '';
      syncLine(li, text);
      if (!text) {
        setTone(li, '');
        li.removeAttribute('data-tone');
        li.removeAttribute('data-whisper');
        li.classList.remove('is-whisper');
        syncVeil(li, false);
      }
    }
    li.classList.remove('is-selected');
    if (!keep) restLectern();
  }

  function openFace(li) {
    if (li.classList.contains('is-selected')) {
      closeFace(li);
      scheduleScene();
      return;
    }
    var previous = selectedFace();
    if (previous) closeFace(previous, true);
    var box = lectern();
    if (!box) return;
    var hit = li.querySelector('.omen-face__hit');
    var line = hit ? hit.querySelector('.omen-face__line') : null;
    var area = box.querySelector('[data-omen-line]');
    var whisper = box.querySelector('[data-omen-whisper]');
    var numeral = box.querySelector('[data-omen-n]');
    if (!(area instanceof HTMLTextAreaElement) || !(whisper instanceof HTMLInputElement)) return;
    area.value = line ? line.textContent : '';
    box.setAttribute('data-face', li.getAttribute('data-face') || '');
    var tone = li.getAttribute('data-tone') || 'mixed';
    if (!li.getAttribute('data-tone')) setTone(li, 'mixed');
    else setTone(li, tone);
    whisper.checked = li.getAttribute('data-whisper') === '1';
    if (numeral) numeral.textContent = li.getAttribute('data-face') || '';
    var idle = box.querySelector('.omen-lectern__idle');
    var work = box.querySelector('.omen-lectern__work');
    if (idle) idle.hidden = true;
    if (work) work.hidden = false;
    li.classList.add('is-selected');
    area.focus({ preventScroll: true });
  }

  function readGroups() {
    return Array.from(document.querySelectorAll('[data-rest-group]')).map(function (band) {
      var name = band.querySelector('[data-group-name]');
      return {
        id: band.getAttribute('data-group-id'),
        name: name instanceof HTMLInputElement && name.value.trim() ? name.value.trim() : 'Group',
        members: Array.from(band.querySelectorAll('[data-rest-people] [data-rest-person]')).map(function (row) {
          return row.getAttribute('data-slug');
        }),
      };
    });
  }

  function saveGroups() {
    return post('/api/desk/table', { op: 'groups', groups: readGroups() });
  }

  function ensureOut(row) {
    if (row.querySelector('[data-rest-out]')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rest-out';
    btn.setAttribute('data-rest-out', '');
    btn.setAttribute('aria-label', 'Remove ' + (row.getAttribute('data-name') || 'them') + ' from this group');
    btn.textContent = '×';
    row.appendChild(btn);
  }

  function playersHome() {
    return document.querySelector('[data-rest-band="players"] [data-rest-people]');
  }

  function dropOut(row) {
    var btn = row.querySelector('[data-rest-out]');
    if (btn) btn.remove();
  }

  function fillAdds() {
    document.querySelectorAll('[data-rest-group]').forEach(function (group) {
      var select = group.querySelector('[data-rest-add]');
      if (!(select instanceof HTMLSelectElement)) return;
      var here = {};
      group.querySelectorAll('[data-rest-people] [data-rest-person]').forEach(function (row) {
        here[row.getAttribute('data-slug')] = true;
      });
      var html = '<option value="">Someone</option>';
      document.querySelectorAll('[data-rest-person][data-kind="pc"]').forEach(function (row) {
        var slug = row.getAttribute('data-slug');
        if (!slug || here[slug]) return;
        html += '<option value="' + esc(slug) + '">' + esc(row.getAttribute('data-name')) + '</option>';
      });
      document.querySelectorAll('[data-npc-pool] [data-rest-person]').forEach(function (row) {
        var slug = row.getAttribute('data-slug');
        if (!slug) return;
        html += '<option value="' + esc(slug) + '">' + esc(row.getAttribute('data-name')) + '</option>';
      });
      select.innerHTML = html;
    });
  }

  function paintBadge(count) {
    var n = Number(count) || 0;
    document.querySelectorAll('[data-inbox-count], [data-inbox-badge]').forEach(function (badge) {
      badge.hidden = n < 1;
      badge.textContent = n > 0 ? String(n) : '';
    });
    var link = document.querySelector('a[href="/session/"]');
    if (link && n > 0 && !link.querySelector('[data-inbox-badge]')) {
      var span = document.createElement('span');
      span.className = 'tab-count';
      span.setAttribute('data-inbox-badge', '');
      span.textContent = String(n);
      link.appendChild(span);
    }
  }

  function paintWhispers(rows) {
    var host = document.querySelector('[data-omen-whispers]');
    var list = document.querySelector('[data-whisper-list]');
    if (!host || !list) return;
    var items = rows || [];
    host.hidden = items.length === 0;
    list.innerHTML = items.map(function (row) {
      return '<li>Face ' + esc(row.face) + '. ' + esc(row.effect) + '</li>';
    }).join('');
  }

  function footingWords(stop, sideA, sideB) {
    var id = (FOOTINGS[stop] || FOOTINGS[2]).id;
    if (id === 'slightA') return (sideA || 'Side A') + ' at a slight disadvantage';
    if (id === 'severeA') return (sideA || 'Side A') + ' at a severe disadvantage';
    if (id === 'slightB') return (sideB || 'Side B') + ' at a slight disadvantage';
    if (id === 'severeB') return (sideB || 'Side B') + ' at a severe disadvantage';
    return 'Equal footing';
  }

  function tideSize() {
    var pressed = document.querySelector('[data-tide-size][aria-pressed="true"]');
    return pressed ? pressed.getAttribute('data-tide-size') : 'skirmish';
  }

  function tideHex(side) {
    var pressed = document.querySelector('[data-tide-dye="' + side + '"][aria-pressed="true"]');
    return pressed ? pressed.getAttribute('data-hex') : side === 'a' ? '#a01818' : '#3a5c6c';
  }

  function paintTide() {
    var host = document.querySelector('[data-tide-preview]');
    var studio = document.querySelector('[data-session-tide-open]');
    if (!host || !studio || studio.getAttribute('data-tide-locked') === '1') return;
    var sideA = document.querySelector('[data-tide-a]');
    var sideB = document.querySelector('[data-tide-b]');
    var range = document.querySelector('[data-tide-footing]');
    var nameA = sideA instanceof HTMLInputElement && sideA.value.trim() ? sideA.value.trim() : 'Side A';
    var nameB = sideB instanceof HTMLInputElement && sideB.value.trim() ? sideB.value.trim() : 'Side B';
    var stop = range instanceof HTMLInputElement ? Number(range.value) : 2;
    var weights = FOOTINGS[stop] || FOOTINGS[2];
    var length = weights.a + weights.b - 1;
    var dyeA = tideHex('a');
    var dyeB = tideHex('b');
    studio.style.setProperty('--tide-a', dyeA);
    studio.style.setProperty('--tide-b', dyeB);
    host.innerHTML = barHtml({
      sideA: nameA,
      sideB: nameB,
      position: weights.a,
      length: length,
      dyeA: dyeA,
      dyeB: dyeB,
    });
    var label = document.querySelector('[data-tide-footing-label]');
    if (label) {
      label.textContent = footingWords(stop, sideA instanceof HTMLInputElement ? sideA.value.trim() : '', sideB instanceof HTMLInputElement ? sideB.value.trim() : '');
    }
    var scale = document.querySelector('[data-tide-scale]');
    if (scale) scale.textContent = MARKS[tideSize()] || MARKS.skirmish;
    var open = document.querySelector('[data-tide-open]');
    if (open instanceof HTMLButtonElement) {
      var ready = sideA instanceof HTMLInputElement && sideB instanceof HTMLInputElement && sideA.value.trim() && sideB.value.trim();
      open.disabled = !ready;
    }
  }

  function lockTide(tide, note) {
    var studio = document.querySelector('[data-session-tide-open]');
    if (!studio) return;
    studio.setAttribute('data-tide-locked', '1');
    studio.querySelectorAll('input, button').forEach(function (el) {
      if (el.hasAttribute('data-tide-open')) {
        el.remove();
        return;
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement) {
        if (el instanceof HTMLInputElement && (el.type === 'text' || el.type === '')) el.readOnly = true;
        else el.disabled = true;
      }
    });
    if (tide && tide.dyeA) studio.style.setProperty('--tide-a', tide.dyeA);
    if (tide && tide.dyeB) studio.style.setProperty('--tide-b', tide.dyeB);
    var preview = document.querySelector('[data-tide-preview]');
    if (preview && tide) preview.innerHTML = barHtml(tide);
    if (!studio.querySelector('.tide-studio__note')) {
      var noteEl = document.createElement('p');
      noteEl.className = 'tide-studio__note';
      noteEl.textContent = note || 'The Tide is open.';
      var foot = studio.querySelector('.tide-studio__foot');
      if (foot) foot.appendChild(noteEl);
    }
  }

  function personRow(person) {
    var row = document.createElement('article');
    row.className = 'rest-soul';
    row.setAttribute('data-rest-person', '');
    row.setAttribute('data-slug', person.slug);
    row.setAttribute('data-kind', person.kind || 'pc');
    row.setAttribute('data-name', person.name);
    row.setAttribute('data-max', String(person.exertionMax));
    row.innerHTML =
      '<h3 class="rest-soul__name"><a href="/characters/' + esc(person.slug) + '/">' + esc(person.name) + '</a></h3>' +
      '<div class="rest-exertion"><span class="rest-exertion__k">Exertion</span><span class="stepper">' +
      '<button type="button" data-step="-1" data-exertion aria-label="Less exertion for ' + esc(person.name) + '">‹</button>' +
      '<b class="stepper__n" data-exertion-read>' + esc(person.exertion) + ' / ' + esc(person.exertionMax) + '</b>' +
      '<button type="button" data-step="1" data-exertion aria-label="More exertion for ' + esc(person.name) + '">›</button>' +
      '</span></div>' +
      '<div class="rest-soul__wells">' +
      '<span class="rest-supply rest-supply--food"><span class="rest-supply__label">Food</span><span class="stepper">' +
      '<button type="button" data-step="-1" data-supply="food" aria-label="Less food for ' + esc(person.name) + '">‹</button>' +
      '<span class="stepper__n" data-supply-value="food">' + esc(person.foodDays) + '</span>' +
      '<button type="button" data-step="1" data-supply="food" aria-label="More food for ' + esc(person.name) + '">›</button>' +
      '</span></span>' +
      '<span class="rest-supply rest-supply--water"><span class="rest-supply__label">Water</span><span class="stepper">' +
      '<button type="button" data-step="-1" data-supply="water" aria-label="Less water for ' + esc(person.name) + '">‹</button>' +
      '<span class="stepper__n" data-supply-value="water">' + esc(person.waterDays) + '</span>' +
      '<button type="button" data-step="1" data-supply="water" aria-label="More water for ' + esc(person.name) + '">›</button>' +
      '</span></span></div>';
    return row;
  }

  function applyPeople(people) {
    (people || []).forEach(function (person) {
      var row = document.querySelector('[data-rest-person][data-slug="' + CSS.escape(person.slug) + '"]');
      if (!row) return;
      row.setAttribute('data-max', String(person.exertionMax));
      var read = row.querySelector('[data-exertion-read]');
      if (read) read.textContent = person.exertion + ' / ' + person.exertionMax;
      var food = row.querySelector('[data-supply-value="food"]');
      var water = row.querySelector('[data-supply-value="water"]');
      if (food) food.textContent = String(person.foodDays);
      if (water) water.textContent = String(person.waterDays);
    });
  }

  function syncRoster(people) {
    if (!Array.isArray(people)) return;
    var known = {};
    people.forEach(function (person) { known[person.slug] = person; });
    var removedFromGroup = false;
    document.querySelectorAll('[data-rest-person]').forEach(function (row) {
      var slug = row.getAttribute('data-slug');
      if (!slug || known[slug]) return;
      if (row.closest('[data-rest-group]')) removedFromGroup = true;
      row.remove();
    });
    people.forEach(function (person) {
      if (document.querySelector('[data-rest-person][data-slug="' + CSS.escape(person.slug) + '"]')) return;
      var row = personRow(person);
      if (person.kind === 'pc') {
        var home = playersHome();
        if (home) home.appendChild(row);
      } else {
        var pool = document.querySelector('[data-npc-pool]');
        if (pool) pool.appendChild(row);
      }
    });
    applyPeople(people);
    fillAdds();
    if (removedFromGroup) saveGroups();
  }

  var board = document.querySelector('[data-session-poll]');
  if (board) {
    window.setInterval(function () {
      fetch('/api/session', { credentials: 'same-origin', headers: { accept: 'application/json' } })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) { if (data && !data.between) paint(data); })
        .catch(function () {});
    }, 4000);
  }

  if (deskOn()) {
    document.querySelectorAll('[data-rest-band]').forEach(paintAwards);
    fillAdds();
    paintTide();
    window.setInterval(function () {
      fetch('/api/desk/table', { credentials: 'same-origin', headers: { accept: 'application/json' } })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (!data) return;
          paintWhispers(data.whispers);
          paintBadge(data.pending);
          var studio = document.querySelector('[data-session-tide-open]');
          var preview = document.querySelector('[data-tide-preview]');
          if (data.tide && studio && studio.getAttribute('data-tide-locked') === '1' && preview) {
            preview.innerHTML = barHtml(data.tide);
          }
          syncRoster(data.people);
        })
        .catch(function () {});
    }, 4000);
  }

  function setApprovals(open) {
    var slide = document.querySelector('[data-slide="approvals"]');
    if (!slide) return;
    slide.setAttribute('data-open', open ? 'true' : 'false');
    var tab = slide.querySelector('[data-slide-toggle]');
    if (tab) tab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!(t instanceof Element)) return;

    if (t.closest('[data-slide-toggle="approvals"]')) {
      var slide = document.querySelector('[data-slide="approvals"]');
      setApprovals(!(slide && slide.getAttribute('data-open') === 'true'));
      return;
    }
    if (deskOn() && !t.closest('.session-approvals')) setApprovals(false);
    if (deskOn() && selectedFace() && !t.closest('[data-omen-lectern]') && !t.closest('[data-omen-open]')) {
      document.querySelectorAll('.omen-face.is-selected').forEach(function (open) { closeFace(open); });
      scheduleScene();
    }

    if (t.closest('[data-omen-open]')) {
      var li = t.closest('.omen-face');
      if (li && !li.classList.contains('is-locked')) openFace(li);
      return;
    }

    var tonePick = t.getAttribute('data-tone-pick');
    if (tonePick) {
      var face = selectedFace();
      if (face) {
        setTone(face, tonePick);
        scheduleScene();
      }
      return;
    }

    if (t.hasAttribute('data-whisper-clear')) {
      post('/api/desk/table', { op: 'whisperClear' }).then(function (data) {
        if (data) paintWhispers([]);
      });
      return;
    }

    var review = t.getAttribute('data-review');
    if (review) {
      var card = t.closest('[data-inbox-row]');
      if (!card) return;
      post('/api/desk/table', { op: 'review', slug: card.getAttribute('data-slug'), decision: review }).then(function (data) {
        if (!data) return;
        card.remove();
        var inbox = document.querySelector('[data-session-inbox]');
        var left = document.querySelectorAll('[data-inbox-row]').length;
        paintBadge(left);
        if (inbox && left === 0 && !inbox.querySelector('[data-inbox-empty]')) {
          var empty = document.createElement('p');
          empty.setAttribute('data-inbox-empty', '');
          empty.textContent = 'No one is waiting.';
          var cards = inbox.querySelector('.inbox-cards');
          if (cards) cards.replaceWith(empty);
        }
        if (data.person && !document.querySelector('[data-rest-person][data-slug="' + CSS.escape(data.person.slug) + '"]')) {
          var arrived = personRow(data.person);
          if (data.person.kind === 'pc') {
            var home = playersHome();
            if (home) home.appendChild(arrived);
          } else {
            var pool = document.querySelector('[data-npc-pool]');
            if (pool) pool.appendChild(arrived);
          }
          fillAdds();
        }
      });
      return;
    }

    if (t.hasAttribute('data-step')) {
      var row = t.closest('[data-rest-person]');
      if (!row) return;
      if (t.hasAttribute('data-exertion')) {
        var read = row.querySelector('[data-exertion-read]');
        var max = Number(row.getAttribute('data-max'));
        var current = read ? Number(String(read.textContent).split('/')[0]) : 0;
        var nextEx = current + Number(t.getAttribute('data-step'));
        if (!Number.isFinite(nextEx) || nextEx < 0 || nextEx > max) return;
        if (read) read.textContent = nextEx + ' / ' + max;
        post('/api/desk/table', {
          op: 'exertion',
          characterSlug: row.getAttribute('data-slug'),
          current: nextEx,
        }).then(function (data) {
          if (!data) {
            if (read) read.textContent = current + ' / ' + max;
            return;
          }
          if (data.person) applyPeople([data.person]);
        });
        return;
      }
      var kind = t.getAttribute('data-supply');
      var node = row.querySelector('[data-supply-value="' + kind + '"]');
      if (!node) return;
      var next = Number(node.textContent) + Number(t.getAttribute('data-step'));
      if (next < 0 || next > 99) return;
      var prev = node.textContent;
      node.textContent = String(next);
      var body = { op: 'supplies', characterSlug: row.getAttribute('data-slug') };
      body[kind === 'food' ? 'foodDays' : 'waterDays'] = next;
      post('/api/desk/table', body).then(function (data) {
        if (!data) {
          node.textContent = prev;
          return;
        }
        if (data.person) applyPeople([data.person]);
      });
      return;
    }

    var bump = t.getAttribute('data-group-exertion');
    if (bump) {
      var company = t.closest('[data-rest-band]');
      if (!company) return;
      var members = Array.from(company.querySelectorAll('[data-rest-people] [data-rest-person]'));
      if (!members.length) {
        note('No one is in this rest.');
        return;
      }
      var delta = Number(bump);
      var before = members.map(function (member) {
        var shown = member.querySelector('[data-exertion-read]');
        return shown ? shown.textContent : '';
      });
      members.forEach(function (member) {
        var shown = member.querySelector('[data-exertion-read]');
        var cap = Number(member.getAttribute('data-max'));
        var now = shown ? Number(String(shown.textContent).split('/')[0]) : 0;
        var stepped = Math.max(0, Math.min(cap, now + delta));
        if (shown) shown.textContent = stepped + ' / ' + cap;
      });
      post('/api/desk/table', {
        op: 'exertion',
        slugs: members.map(function (member) { return member.getAttribute('data-slug'); }),
        delta: delta,
      }).then(function (data) {
        if (!data) {
          members.forEach(function (member, index) {
            var shown = member.querySelector('[data-exertion-read]');
            if (shown) shown.textContent = before[index];
          });
          return;
        }
        if (data.people) applyPeople(data.people);
      });
      return;
    }

    var restKind = t.getAttribute('data-rest-kind');
    if (restKind) {
      var band = t.closest('[data-rest-band]');
      if (!band) return;
      var slugs = Array.from(band.querySelectorAll('[data-rest-people] [data-rest-person]')).map(function (person) {
        return person.getAttribute('data-slug');
      });
      if (!slugs.length) {
        note('No one is in this rest.');
        return;
      }
      var foodBox = band.querySelector('[data-ample="food"]');
      var waterBox = band.querySelector('[data-ample="water"]');
      post('/api/desk/table', {
        op: 'rest',
        slugs: slugs,
        kind: restKind,
        ampleFood: foodBox instanceof HTMLInputElement && foodBox.checked,
        ampleWater: waterBox instanceof HTMLInputElement && waterBox.checked,
      }).then(function (data) {
        if (data && data.people) applyPeople(data.people);
      });
      return;
    }

    if (t.hasAttribute('data-rest-out')) {
      var member = t.closest('[data-rest-person]');
      if (!member) return;
      dropOut(member);
      if (member.getAttribute('data-kind') === 'pc') {
        var home = playersHome();
        if (home) home.appendChild(member);
      } else {
        var pool = document.querySelector('[data-npc-pool]');
        if (pool) pool.appendChild(member);
      }
      fillAdds();
      saveGroups();
      return;
    }

    if (t.hasAttribute('data-group-dissolve')) {
      var group = t.closest('[data-rest-group]');
      if (!group) return;
      group.querySelectorAll('[data-rest-people] [data-rest-person]').forEach(function (member) {
        dropOut(member);
        var dest = member.getAttribute('data-kind') === 'pc'
          ? playersHome()
          : document.querySelector('[data-npc-pool]');
        if (dest) dest.appendChild(member);
      });
      group.remove();
      fillAdds();
      saveGroups();
      return;
    }

    if (t.hasAttribute('data-group-new')) {
      var host = document.querySelector('[data-rest-groups]');
      if (!host) return;
      var id = 'g' + Math.random().toString(36).slice(2, 8);
      var bandEl = document.createElement('section');
      bandEl.className = 'rest-company';
      bandEl.setAttribute('data-rest-band', '');
      bandEl.setAttribute('data-rest-group', '');
      bandEl.setAttribute('data-group-id', id);
      bandEl.innerHTML =
        '<header class="rest-company__bar">' +
        '<input class="rest-band__name" data-group-name value="Group" maxlength="40" aria-label="Group name">' +
        '<span class="rest-nudge">' +
        '<button type="button" data-group-exertion="-1" aria-label="Lower exertion for everyone here">‹</button>' +
        '<span class="rest-nudge__k">Exertion</span>' +
        '<button type="button" data-group-exertion="1" aria-label="Raise exertion for everyone here">›</button>' +
        '</span>' +
        '<button type="button" class="session-quiet" data-rest-kind="short">Short rest +0</button>' +
        '<button type="button" class="session-quiet" data-rest-kind="long">Long rest +1</button>' +
        '<label class="rest-ample"><input type="checkbox" data-ample="food"> Ample food</label>' +
        '<label class="rest-ample"><input type="checkbox" data-ample="water"> Ample water</label>' +
        '<button type="button" class="rest-out" data-group-dissolve aria-label="Dissolve Group">×</button>' +
        '</header><div class="rest-company__people" data-rest-people></div>' +
        '<label class="rest-add">Add <select class="rest-add__pick" data-rest-add aria-label="Add someone to this group"><option value="">Someone</option></select></label>';
      host.appendChild(bandEl);
      paintAwards(bandEl);
      fillAdds();
      var nameInput = bandEl.querySelector('[data-group-name]');
      if (nameInput instanceof HTMLInputElement) nameInput.focus();
      saveGroups();
      return;
    }

    if (t.hasAttribute('data-tide-dye')) {
      var side = t.getAttribute('data-tide-dye');
      document.querySelectorAll('[data-tide-dye="' + side + '"]').forEach(function (swatch) {
        swatch.setAttribute('aria-pressed', swatch === t ? 'true' : 'false');
      });
      paintTide();
      return;
    }

    var size = t.getAttribute('data-tide-size');
    if (size) {
      document.querySelectorAll('[data-tide-size]').forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip === t ? 'true' : 'false');
      });
      paintTide();
      return;
    }

    if (t.hasAttribute('data-tide-open')) {
      if (t instanceof HTMLButtonElement && t.disabled) return;
      if (t instanceof HTMLButtonElement) t.disabled = true;
      var sideA = document.querySelector('[data-tide-a]');
      var sideB = document.querySelector('[data-tide-b]');
      var range = document.querySelector('[data-tide-footing]');
      var stop = range instanceof HTMLInputElement ? Number(range.value) : 2;
      post('/api/desk/table', {
        op: 'tideOpen',
        post: true,
        size: tideSize(),
        footing: (FOOTINGS[stop] || FOOTINGS[2]).id,
        sideA: sideA instanceof HTMLInputElement ? sideA.value : '',
        sideB: sideB instanceof HTMLInputElement ? sideB.value : '',
        dyeA: tideHex('a'),
        dyeB: tideHex('b'),
      }).then(function (data) {
        if (!data || !data.reading) {
          if (t instanceof HTMLButtonElement) t.disabled = false;
          return;
        }
        var postedNote = data.posted
          ? 'Posted to the play channel.'
          : (data.postError || 'The Tide is open on this table. It posts to the play channel when the table is live.');
        lockTide(data.reading.tide, postedNote);
      });
      return;
    }

  });

  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (!(t instanceof Element)) return;
    if (t.hasAttribute('data-omen-line')) {
      var li = selectedFace();
      if (li && t instanceof HTMLTextAreaElement) syncLine(li, t.value.trim());
      scheduleScene();
      return;
    }
    if (t.hasAttribute('data-omen-whisper') && t instanceof HTMLInputElement) {
      var face = selectedFace();
      if (!face) return;
      if (t.checked) face.setAttribute('data-whisper', '1');
      else face.removeAttribute('data-whisper');
      face.classList.toggle('is-whisper', t.checked);
      syncVeil(face, t.checked);
      scheduleScene();
      return;
    }
    if (t.hasAttribute('data-ample')) {
      var band = t.closest('[data-rest-band]');
      if (band) paintAwards(band);
      return;
    }
    if (t.hasAttribute('data-tide-a') || t.hasAttribute('data-tide-b') || t.hasAttribute('data-tide-footing')) {
      paintTide();
    }
  });

  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!(t instanceof Element)) return;
    if (t.hasAttribute('data-rest-add') && t instanceof HTMLSelectElement) {
      var slug = t.value;
      t.value = '';
      if (!slug) return;
      var group = t.closest('[data-rest-group]');
      var row = document.querySelector('[data-rest-person][data-slug="' + CSS.escape(slug) + '"]');
      var people = group && group.querySelector('[data-rest-people]');
      if (!group || !row || !people) return;
      ensureOut(row);
      people.appendChild(row);
      fillAdds();
      saveGroups();
      return;
    }
    if (t.hasAttribute('data-group-name')) saveGroups();
    if (t.hasAttribute('data-discord-guild') || t.hasAttribute('data-discord-channel') || t.hasAttribute('data-discord-role')) {
      if (!(t instanceof HTMLInputElement) || t.value.trim() === t.defaultValue.trim()) return;
      var guild = document.querySelector('[data-discord-guild]');
      var channel = document.querySelector('[data-discord-channel]');
      var role = document.querySelector('[data-discord-role]');
      post('/api/desk/discord', {
        guildId: guild instanceof HTMLInputElement ? guild.value.trim() : '',
        channelId: channel instanceof HTMLInputElement ? channel.value.trim() : '',
        roleId: role instanceof HTMLInputElement ? role.value.trim() : '',
      }).then(function (data) {
        if (!data) return;
        [guild, channel, role].forEach(function (field) {
          if (field instanceof HTMLInputElement) field.defaultValue = field.value.trim();
        });
      });
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    document.querySelectorAll('.omen-face.is-selected').forEach(function (open) { closeFace(open); });
    setApprovals(false);
    scheduleScene();
  });
})();
