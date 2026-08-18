/** Guidebook client enhance. Called from Head.astro with chapter icon URLs. */
// @ts-nocheck — extracted runtime script; keep behaviour, do not retype the die tables.

export type SidebarIconMap = Record<string, string>;

export function boot(sidebarIconMap: SidebarIconMap): void {
	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function segmentFromHref(href) {
		try {
			const path = new URL(href, window.location.origin).pathname.replace(/\/+$/, '');
			const parts = path.split('/').filter(Boolean);
			if (parts[0] && parts[0].toLowerCase() === 'kodranni') parts.shift();
			if (parts[0] && parts[0].toLowerCase() === 'guidebook') parts.shift();
			return parts[0] || '';
		} catch {
			return '';
		}
	}

	function injectSidebarIcons() {
		const root = document.getElementById('starlight__sidebar');
		if (!root) return;
		root.querySelectorAll('a[href]').forEach((a) => {
			if (a.querySelector('img.kod-sidebar-icon')) return;
			const seg = segmentFromHref(a.getAttribute('href') || '');
			const src = sidebarIconMap[seg];
			if (!src) return;
			const img = document.createElement('img');
			img.className = 'kod-sidebar-icon';
			img.src = src;
			img.alt = '';
			img.width = 18;
			img.height = 18;
			img.decoding = 'async';
			a.insertBefore(img, a.firstChild);
		});
	}

	const ELDER_FUTHARK = [
		'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ',
		'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ',
		'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ',
	];

	function pickRuneTriad() {
		const pool = ELDER_FUTHARK.slice();
		const out = [];
		for (let i = 0; i < 3; i++) {
			const idx = Math.floor(Math.random() * pool.length);
			out.push(pool.splice(idx, 1)[0]);
		}
		return out.join(' · ');
	}

	function decorateDividers() {
		document.querySelectorAll('.sl-markdown-content hr').forEach((hr) => {
			hr.setAttribute('data-runes', pickRuneTriad());
		});
	}

	/** Ensure asides have accessible names; icons are CSS ::before on the aside */
	function normalizeBoxes() {
		document.querySelectorAll('aside.kod-example').forEach((el) => {
			if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Example');
			el.querySelectorAll('.kod-example__label').forEach((n) => n.remove());
		});
		document.querySelectorAll('aside.kod-note').forEach((el) => {
			if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Note');
			el.querySelectorAll('.kod-note__label').forEach((n) => n.remove());
		});
		document.querySelectorAll('aside.kod-counsel').forEach((el) => {
			if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Counsel');
			el.querySelectorAll('.kod-counsel__label').forEach((n) => n.remove());
		});
	}

	/** Exclusive archetype focus: hide siblings, full row, small ← back */
	function setupArchetypeFocus() {
		const root = document.querySelector('.kod-archetypes');
		if (!root || root.dataset.ready) return;
		root.dataset.ready = '1';

		let back = root.querySelector('.kod-archetypes__back');
		if (!back) {
			back = document.createElement('button');
			back.type = 'button';
			back.className = 'kod-archetypes__back';
			back.setAttribute('aria-label', 'Back to all archetypes');
			back.textContent = '← Back';
			root.insertBefore(back, root.firstChild);
		}

		function exitFocus() {
			root.querySelectorAll('details.kod-archetype').forEach((d) => {
				d.open = false;
			});
			root.classList.remove('is-focus');
			if (!prefersReduced) {
				root.classList.add('is-exiting');
				window.setTimeout(() => root.classList.remove('is-exiting'), 240);
			}
		}

		back.addEventListener('click', (e) => {
			e.preventDefault();
			exitFocus();
		});

		root.querySelectorAll('details.kod-archetype').forEach((d) => {
			d.addEventListener('toggle', () => {
				if (d.open) {
					root.querySelectorAll('details.kod-archetype').forEach((other) => {
						if (other !== d) other.open = false;
					});
					root.classList.remove('is-exiting');
					root.classList.add('is-focus');
					if (!prefersReduced) {
						requestAnimationFrame(() => {
							d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
						});
					}
				} else if (!root.querySelector('details.kod-archetype[open]')) {
					root.classList.remove('is-focus');
					if (!prefersReduced) {
						root.classList.add('is-exiting');
						window.setTimeout(() => root.classList.remove('is-exiting'), 240);
					}
				}
			});
		});
	}

	/**
	 * Die icons: compact 3D-projection path data (no raw SVG markup in this file —
	 * avoids HTML/script parsing hazards). Built via createElementNS at runtime.
	 * d6 cube · d8 octahedron · d12 dodecahedron · d20 icosahedron (+ Omen eye).
	 */
	const DIE_ICON_DATA = {"d6":[{"t":"path","d":"M 16.00 3.20 L 28.80 9.60 L 16.00 16.00 L 3.20 9.60 Z","f":"c","fo":"0.22","s":"c","sw":"1.37","sj":"round"},{"t":"path","d":"M 3.20 22.40 L 16.00 28.80 L 16.00 16.00 L 3.20 9.60 Z","f":"c","fo":"0.18","s":"c","sw":"1.37","sj":"round"},{"t":"path","d":"M 28.80 22.40 L 16.00 28.80 L 16.00 16.00 L 28.80 9.60 Z","f":"c","fo":"0.15","s":"c","sw":"1.37","sj":"round"}],"d8":[{"t":"path","d":"M 16.00 28.45 L 22.25 16.94 L 26.83 15.46 Z","f":"c","fo":"0.16","s":"c","sw":"1.31","sj":"round"},{"t":"path","d":"M 16.00 3.55 L 26.83 15.46 L 22.25 16.94 Z","f":"c","fo":"0.2","s":"c","sw":"1.31","sj":"round"},{"t":"path","d":"M 16.00 28.45 L 5.17 16.54 L 22.25 16.94 Z","f":"c","fo":"0.14","s":"c","sw":"1.31","sj":"round"},{"t":"path","d":"M 16.00 3.55 L 22.25 16.94 L 5.17 16.54 Z","f":"c","fo":"0.12","s":"c","sw":"1.31","sj":"round"}],"d12":[{"t":"path","d":"M 3.18 14.26 L 7.71 6.23 L 12.60 4.74 L 21.60 4.74 L 25.65 11.85 L 28.82 17.74 L 24.29 25.77 L 19.40 27.26 L 10.40 27.26 L 6.35 20.15 Z","f":"c","fo":"0.14","s":"c","sw":"1.37","sj":"round"},{"t":"path","d":"M 21.60 4.74 L 25.65 11.85 L 19.14 16.25 L 11.08 11.85 L 12.60 4.74 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 9.72 25.77 L 10.40 27.26 L 6.35 20.15 L 3.18 14.26 L 5.26 17.74 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 19.40 27.26 L 24.29 25.77 L 18.30 24.85 L 9.72 25.77 L 10.40 27.26 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 19.14 16.25 L 18.30 24.85 L 9.72 25.77 L 5.26 17.74 L 11.08 11.85 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 24.29 25.77 L 28.82 17.74 L 25.65 11.85 L 19.14 16.25 L 18.30 24.85 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 11.08 11.85 L 12.60 4.74 L 7.71 6.23 L 3.18 14.26 L 5.26 17.74 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 6.35 20.15 L 10.40 27.26","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 6.35 20.15 L 3.18 14.26","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 9.72 25.77 L 18.30 24.85","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 9.72 25.77 L 10.40 27.26","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 9.72 25.77 L 5.26 17.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 7.71 6.23 L 12.60 4.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 7.71 6.23 L 3.18 14.26","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 11.08 11.85 L 19.14 16.25","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 11.08 11.85 L 12.60 4.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 11.08 11.85 L 5.26 17.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 24.29 25.77 L 18.30 24.85","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 24.29 25.77 L 19.40 27.26","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 24.29 25.77 L 28.82 17.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 25.65 11.85 L 19.14 16.25","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 25.65 11.85 L 21.60 4.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 25.65 11.85 L 28.82 17.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 18.30 24.85 L 19.14 16.25","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 10.40 27.26 L 19.40 27.26","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 12.60 4.74 L 21.60 4.74","f":"n","s":"c","sw":"1.21","sc":"round"},{"t":"path","d":"M 3.18 14.26 L 5.26 17.74","f":"n","s":"c","sw":"1.21","sc":"round"}],"d20":[{"t":"path","d":"M 4.77 9.06 L 16.00 4.77 L 27.23 9.06 L 27.23 22.94 L 16.00 27.23 L 4.77 22.94 Z","f":"c","fo":"0.14","s":"c","sw":"1.42","sj":"round"},{"t":"path","d":"M 16.00 27.23 L 9.06 16.00 L 22.94 16.00 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 16.00 27.23 L 9.06 16.00 L 4.77 22.94 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 16.00 27.23 L 22.94 16.00 L 27.23 22.94 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 16.00 4.77 L 9.06 16.00 L 22.94 16.00 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 16.00 4.77 L 9.06 16.00 L 4.77 9.06 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 16.00 4.77 L 22.94 16.00 L 27.23 9.06 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 9.06 16.00 L 4.77 22.94 L 4.77 9.06 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 22.94 16.00 L 27.23 22.94 L 27.23 9.06 Z","f":"c","fo":"0.12","s":"n"},{"t":"path","d":"M 16.00 27.23 L 9.06 16.00","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 16.00 27.23 L 22.94 16.00","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 16.00 27.23 L 4.77 22.94","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 16.00 27.23 L 27.23 22.94","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 16.00 4.77 L 9.06 16.00","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 16.00 4.77 L 22.94 16.00","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 16.00 4.77 L 4.77 9.06","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 16.00 4.77 L 27.23 9.06","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 9.06 16.00 L 22.94 16.00","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 9.06 16.00 L 4.77 22.94","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 9.06 16.00 L 4.77 9.06","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 22.94 16.00 L 27.23 22.94","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 22.94 16.00 L 27.23 9.06","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 4.77 22.94 L 4.77 9.06","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 27.23 22.94 L 27.23 9.06","f":"n","s":"c","sw":"1.26","sc":"round"},{"t":"path","d":"M 12.70 19.74 Q 16.00 17.64 19.30 19.74 Q 16.00 21.84 12.70 19.74 Z","f":"c","fo":"0.14","s":"c","sw":"1.16","sj":"round"},{"t":"circle","cx":"16.00","cy":"19.74","r":"1.15","f":"c"}]};

	function renderDieSvg(tier) {
		const els = DIE_ICON_DATA[tier];
		if (!els) return null;
		const ns = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(ns, 'svg');
		svg.setAttribute('class', 'kod-die__svg');
		svg.setAttribute('viewBox', '0 0 32 32');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('focusable', 'false');
		for (const spec of els) {
			const node = document.createElementNS(ns, spec.t === 'circle' ? 'circle' : 'path');
			if (spec.t === 'circle') {
				if (spec.cx != null) node.setAttribute('cx', spec.cx);
				if (spec.cy != null) node.setAttribute('cy', spec.cy);
				if (spec.r != null) node.setAttribute('r', spec.r);
			} else if (spec.d) {
				node.setAttribute('d', spec.d);
			}
			const fill = spec.f === 'c' ? 'currentColor' : spec.f === 'n' ? 'none' : spec.f;
			const stroke = spec.s === 'c' ? 'currentColor' : spec.s === 'n' ? 'none' : spec.s;
			if (fill) node.setAttribute('fill', fill);
			if (spec.fo != null) node.setAttribute('fill-opacity', spec.fo);
			if (stroke) node.setAttribute('stroke', stroke);
			if (spec.sw != null) node.setAttribute('stroke-width', spec.sw);
			if (spec.sj) node.setAttribute('stroke-linejoin', spec.sj);
			if (spec.sc) node.setAttribute('stroke-linecap', spec.sc);
			svg.appendChild(node);
		}
		return svg;
	}

	function fillDieHosts(root) {
		const scope = root || document;
		scope.querySelectorAll('.kod-die[data-die]').forEach((el) => {
			if (el.dataset.dieReady) return;
			const tier = el.getAttribute('data-die');
			const svg = renderDieSvg(tier);
			if (!svg) return;
			el.dataset.dieReady = '1';
			el.classList.add('kod-die--' + tier);
			el.replaceChildren(svg);
		});
	}


	/**
	 * Wrap standalone **d6** / **d8** / **d12** (and Nd6-style pools) in die chips
	 * so tiers stay visual across the guidebook without hand-editing every line.
	 */
	function setupDieChips() {
		const main = document.querySelector('.sl-markdown-content');
		if (!main) {
			fillDieHosts(document);
			return;
		}

		const wrapStrong = (el) => {
			if (el.closest('.kod-die-chip, .kod-die, button')) return;
			const raw = (el.textContent || '').trim();
			const pool = raw.match(/^(\d+)(d6|d8|d12|d20)$/i);
			const bare = raw.match(/^(d6|d8|d12|d20)$/i);
			if (!pool && !bare) return;
			const tier = (pool ? pool[2] : bare[1]).toLowerCase();
			const chip = document.createElement('span');
			chip.className = 'kod-die-chip kod-die-chip--' + tier;
			chip.title =
				tier === 'd6'
					? 'd6 — harder (Disadvantage)'
					: tier === 'd12'
						? 'd12 — easier (Advantage)'
						: tier === 'd20'
							? 'd20 — Omen die'
							: 'd8 — ordinary default';
			if (pool) {
				const count = document.createElement('span');
				count.className = 'kod-die-chip__count';
				count.textContent = pool[1];
				chip.appendChild(count);
			}
			const icon = document.createElement('span');
			icon.className = 'kod-die kod-die--' + tier;
			icon.setAttribute('data-die', tier);
			icon.setAttribute('aria-hidden', 'true');
			chip.appendChild(icon);
			const label = document.createElement('span');
			label.className = 'kod-die-chip__label';
			label.textContent = tier;
			chip.appendChild(label);
			el.replaceWith(chip);
		};

		main.querySelectorAll('strong').forEach(wrapStrong);
		fillDieHosts(document);
	}

	function setupMarksLadder() {
		document.querySelectorAll('[data-widget="marks-ladder"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const buttons = [...root.querySelectorAll('[data-marks]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			function set(n) {
				const id = String(n);
				buttons.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.marks === id ? 'true' : 'false'),
				);
				panels.forEach((p) => {
					const show = p.getAttribute('data-panel-id') === id;
					if (show) p.removeAttribute('hidden');
					else p.setAttribute('hidden', '');
				});
			}
			buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.marks)));
			const initial =
				buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.marks || '2';
			set(initial);
		});
	}

	function dieChipHtml(tier) {
		const t = String(tier).toLowerCase();
		const title =
			t === 'd6'
				? 'd6 — harder (Disadvantage)'
				: t === 'd12'
					? 'd12 — easier (Advantage)'
					: 'd8 — ordinary default';
		return (
			'<span class="kod-die-chip kod-die-chip--' +
			t +
			'" title="' +
			title +
			'">' +
			'<span class="kod-die kod-die--' +
			t +
			'" data-die="' +
			t +
			'" aria-hidden="true"></span>' +
			'<span class="kod-die-chip__label">' +
			t +
			'</span></span>'
		);
	}

	function setupTierDial() {
		document.querySelectorAll('[data-widget="tier-dial"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const ladder = root.querySelector('.kod-tier-ladder');
			const buttons = [...root.querySelectorAll('[data-tier]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			function set(t) {
				const tier = t || 'd8';
				buttons.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.tier === tier ? 'true' : 'false'),
				);
				if (ladder) ladder.setAttribute('data-active', tier);
				panels.forEach((p) => {
					const show = p.getAttribute('data-panel-id') === tier;
					if (show) p.removeAttribute('hidden');
					else p.setAttribute('hidden', '');
				});
				fillDieHosts(root);
			}
			buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.tier)));
			const initial =
				buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.tier || 'd8';
			set(initial);
		});
	}

	/** Generic tab panels: buttons [data-tab], panels [data-panel-id] in the same widget */
	function setupContentTabs() {
		document.querySelectorAll('[data-widget="content-tabs"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const buttons = [...root.querySelectorAll('[data-tab]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			if (!buttons.length || !panels.length) return;
			function set(id) {
				buttons.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.tab === id ? 'true' : 'false'),
				);
				panels.forEach((p) => {
					const show = p.getAttribute('data-panel-id') === id;
					if (show) p.removeAttribute('hidden');
					else p.setAttribute('hidden', '');
				});
			}
			buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.tab)));
			const initial =
				buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.tab ||
				buttons[0].dataset.tab;
			set(initial);
		});
	}

	/**
	 * Step-flow wizard: numbered buttons + prev/next + optional title labels.
	 * Markup: [data-widget="step-flow"] with [data-tab] buttons (ordered),
	 * [data-panel-id] panels, [data-step-prev]/[data-step-next], optional [data-step-label].
	 */
	function setupStepFlows() {
		document.querySelectorAll('[data-widget="step-flow"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const buttons = [...root.querySelectorAll('[data-tab]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			const prev = root.querySelector('[data-step-prev]');
			const next = root.querySelector('[data-step-next]');
			const labelEl = root.querySelector('[data-step-label]');
			if (!buttons.length || !panels.length) return;
			const ids = buttons.map((b) => b.dataset.tab);
			let index = Math.max(
				0,
				ids.indexOf(
					buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.tab ||
						ids[0],
				),
			);

			function setIndex(i) {
				index = Math.max(0, Math.min(ids.length - 1, i));
				const id = ids[index];
				buttons.forEach((b, bi) => {
					b.setAttribute('aria-pressed', bi === index ? 'true' : 'false');
					b.classList.toggle('is-done', bi < index);
				});
				panels.forEach((p) => {
					const show = p.getAttribute('data-panel-id') === id;
					if (show) p.removeAttribute('hidden');
					else p.setAttribute('hidden', '');
				});
				if (labelEl) {
					const title =
						panels
							.find((p) => p.getAttribute('data-panel-id') === id)
							?.getAttribute('data-step-title') || '';
					labelEl.textContent = title
						? `${index + 1} / ${ids.length} — ${title}`
						: `${index + 1} / ${ids.length}`;
				}
				if (prev) prev.disabled = index === 0;
				if (next) next.disabled = index === ids.length - 1;
			}

			buttons.forEach((b, bi) => b.addEventListener('click', () => setIndex(bi)));
			if (prev) prev.addEventListener('click', () => setIndex(index - 1));
			if (next) next.addEventListener('click', () => setIndex(index + 1));
			root.addEventListener('keydown', (e) => {
				if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
					e.preventDefault();
					setIndex(index + 1);
				} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
					e.preventDefault();
					setIndex(index - 1);
				}
			});
			if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');
			setIndex(index);
		});
	}

	/**
	 * Tide demo: step panels + live two-colour track.
	 * Markup: [data-widget="tide-demo"] with [data-tab], panels [data-panel-id]
	 * that carry data-tide-pos + data-tide-note, and [data-tide-visual] bar.
	 * Track length defaults to 17 (imperial 6 vs mongol 12).
	 */
	function setupTideDemo() {
		document.querySelectorAll('[data-widget="tide-demo"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const scale = Number(root.dataset.tideScale || 17);
			const buttons = [...root.querySelectorAll('[data-tab]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			const prev = root.querySelector('[data-step-prev]');
			const next = root.querySelector('[data-step-next]');
			const labelEl = root.querySelector('[data-step-label]');
			const fillA = root.querySelector('[data-tide-fill-a]');
			const fillB = root.querySelector('[data-tide-fill-b]');
			const marker = root.querySelector('[data-tide-marker]');
			const readout = root.querySelector('[data-tide-readout]');
			if (!buttons.length || !panels.length) return;
			const ids = buttons.map((b) => b.dataset.tab);
			let index = 0;

			function paint(pos, note) {
				const p = Math.max(0, Math.min(scale, Number(pos)));
				const pct = scale === 0 ? 0 : (p / scale) * 100;
				if (fillA) fillA.style.width = pct + '%';
				if (fillB) fillB.style.width = 100 - pct + '%';
				if (marker) marker.style.left = pct + '%';
				if (readout) {
					const state =
						p <= 0
							? 'Imperial side routes (collective).'
							: p >= scale
								? 'Mongol side routes (collective).'
								: 'Imperial footing remaining · Mongol pressure growing as crimson shrinks.';
					readout.textContent = note
						? note + ' — ' + state
						: 'Position ' + p + ' / ' + scale + '. ' + state;
				}
				root.setAttribute('data-tide-at', String(p));
			}

			function setIndex(i) {
				index = Math.max(0, Math.min(ids.length - 1, i));
				const id = ids[index];
				buttons.forEach((b, bi) => {
					b.setAttribute('aria-pressed', bi === index ? 'true' : 'false');
					b.classList.toggle('is-done', bi < index);
				});
				let active = panels[0];
				panels.forEach((panel) => {
					const show = panel.getAttribute('data-panel-id') === id;
					if (show) {
						panel.removeAttribute('hidden');
						active = panel;
					} else panel.setAttribute('hidden', '');
				});
				const pos = active?.getAttribute('data-tide-pos') ?? '6';
				const note = active?.getAttribute('data-tide-note') || '';
				paint(pos, note);
				if (labelEl) {
					const title = active?.getAttribute('data-step-title') || '';
					labelEl.textContent = title
						? `${index + 1} / ${ids.length} — ${title}`
						: `${index + 1} / ${ids.length}`;
				}
				if (prev) prev.disabled = index === 0;
				if (next) next.disabled = index === ids.length - 1;
			}

			buttons.forEach((b, bi) => b.addEventListener('click', () => setIndex(bi)));
			if (prev) prev.addEventListener('click', () => setIndex(index - 1));
			if (next) next.addEventListener('click', () => setIndex(index + 1));
			root.addEventListener('keydown', (e) => {
				if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
					e.preventDefault();
					setIndex(index + 1);
				} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
					e.preventDefault();
					setIndex(index - 1);
				}
			});
			if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');
			setIndex(0);
		});
	}

	function setupScrollReveal() {
		const root = document.querySelector('.sl-markdown-content');
		if (!root) return;

		root.querySelectorAll('blockquote').forEach((bq) => {
			bq.classList.add('kod-reveal', 'kod-type');
		});

		// Top-level and nested prose lists (skip widget / not-content shells)
		root
			.querySelectorAll(
				':scope > ul > li, :scope > ol > li, ul:not(:where(.not-content *)) > li, ol:not(:where(.not-content *)) > li',
			)
			.forEach((li) => {
				if (!li.classList.contains('kod-reveal-item')) li.classList.add('kod-reveal-item');
			});

		const targets = root.querySelectorAll('blockquote.kod-reveal, .kod-reveal-item');
		if (!targets.length) return;

		if (prefersReduced) {
			targets.forEach((el) => el.classList.add('is-in'));
			return;
		}

		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-in');
						io.unobserve(e.target);
					}
				});
			},
			{ rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
		);
		targets.forEach((el) => io.observe(el));
	}

	function isDicePage() {
		return /dice-mechanics|marks-and-tiers/i.test(location.pathname);
	}

	function setupTableStrip() {
		if (!isDicePage()) return;
		if (document.querySelector('.kod-table-strip')) return;
		const main = document.querySelector('.sl-markdown-content');
		if (!main) return;
		const strip = document.createElement('aside');
		strip.className = 'kod-table-strip';
		strip.setAttribute('aria-label', 'At the table');
		strip.innerHTML =
			'<div class="kod-table-strip__rules">' +
			'<span><strong>Mark</strong> ≥ 5</span>' +
			'<span class="kod-table-strip__tier">Default ' +
			'<span class="kod-die-chip kod-die-chip--d8" title="d8 — ordinary default">' +
			'<span class="kod-die kod-die--d8" data-die="d8" aria-hidden="true"></span>' +
			'<span class="kod-die-chip__label">d8</span></span></span>' +
			'<span><span class="kod-die kod-die--d6" data-die="d6" aria-hidden="true"></span> Disadv · ' +
			'<span class="kod-die kod-die--d12" data-die="d12" aria-hidden="true"></span> Adv</span>' +
			'<span>ST names pair + tier</span>' +
			'</div>';
		main.appendChild(strip);
		fillDieHosts(strip);
	}

	/** Equalize heights of grid children that should match (lanes, brick rows) */
	function equalizeHeights(selector, childSelector) {
		document.querySelectorAll(selector).forEach((parent) => {
			const kids = [...parent.querySelectorAll(childSelector)];
			if (kids.length < 2) return;
			kids.forEach((k) => {
				k.style.minHeight = '';
				k.style.height = '';
			});
			// force reflow before measure
			void parent.offsetHeight;
			const max = Math.max(...kids.map((k) => k.getBoundingClientRect().height));
			if (max > 0) {
				const px = Math.ceil(max) + 'px';
				kids.forEach((k) => {
					k.style.minHeight = px;
				});
			}
		});
	}

	function layoutEqualizers() {
		equalizeHeights('.kod-lanes', ':scope > .kod-lane');
		equalizeHeights('.kod-domain-lane__bricks', ':scope > .kod-brick');
		equalizeHeights('.kod-seed-grid', ':scope > .kod-seed');
		equalizeHeights('.kod-hier-axes', '.kod-hier-axis__head');
	}

	function setupOmenFaces() {
		document.querySelectorAll('ol.kod-omen-faces[data-a]').forEach((ol) => {
			if (ol.dataset.ready) return;
			ol.dataset.ready = '1';
			const parse = (s) => {
				const m = String(s || '').match(/^(\d+)\s*-\s*(\d+)$/);
				if (!m) return [0, -1];
				return [Number(m[1]), Number(m[2])];
			};
			const [a0, a1] = parse(ol.getAttribute('data-a'));
			const [b0, b1] = parse(ol.getAttribute('data-b'));
			const frag = document.createDocumentFragment();
			for (let i = 1; i <= 20; i++) {
				const li = document.createElement('li');
				li.textContent = String(i);
				if (i >= a0 && i <= a1) li.className = 'is-a';
				else if (i >= b0 && i <= b1) li.className = 'is-b';
				frag.appendChild(li);
			}
			ol.replaceChildren(frag);
		});
	}

	function enhance() {
		const steps = [
			injectSidebarIcons,
			decorateDividers,
			normalizeBoxes,
			setupArchetypeFocus,
			setupDieChips,
			setupMarksLadder,
			setupTierDial,
			setupContentTabs,
			setupStepFlows,
			setupTideDemo,
			setupOmenFaces,
			setupScrollReveal,
			setupTableStrip,
		];
		for (const step of steps) {
			try {
				step();
			} catch (err) {
				console.error('[kodranni] enhance step failed:', step.name, err);
			}
		}
		// after layout + fonts
		requestAnimationFrame(() => {
			layoutEqualizers();
			requestAnimationFrame(layoutEqualizers);
		});
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(() => layoutEqualizers()).catch(() => {});
		}
	}

	window.addEventListener('resize', () => {
		document.querySelectorAll('.kod-lane, .kod-brick, .kod-seed, .kod-hier-axis__head').forEach((el) => {
			el.style.minHeight = '';
			el.style.height = '';
		});
		requestAnimationFrame(layoutEqualizers);
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', enhance);
	} else {
		enhance();
	}
	document.addEventListener('astro:page-load', enhance);

}

