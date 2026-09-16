/** Guidebook client enhance. Called from Head.astro with chapter icon URLs. */
// @ts-nocheck — extracted runtime script; keep behaviour, do not retype the die tables.

export type SidebarIconMap = Record<string, string>;

export function boot(sidebarIconMap: SidebarIconMap): void {
	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function fadeIn(el, delayMs) {
		if (!el) return;
		el.classList.remove('is-in');
		if (prefersReduced) {
			el.classList.add('is-in');
			return;
		}
		const kick = () => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => el.classList.add('is-in'));
			});
		};
		if (delayMs) window.setTimeout(kick, delayMs);
		else kick();
	}

	function segmentFromHref(href) {
		try {
			const path = new URL(href, window.location.origin).pathname.replace(/\/+$/, '');
			const parts = path.split('/').filter(Boolean);
			if (parts[0] && parts[0].toLowerCase() === 'kodranni') parts.shift();
			if (parts[0] && parts[0].toLowerCase() === 'guidebook') parts.shift();
			if (parts[0] && parts[0].toLowerCase() === 'hu') parts.shift();
			return parts[0] || '';
		} catch {
			return '';
		}
	}

	function markEpigraph() {
		const main = document.querySelector('.sl-markdown-content');
		if (!main) return;
		const first = main.querySelector(':scope > blockquote');
		if (!first || first.classList.contains('kod-epigraph')) return;
		first.classList.add('kod-epigraph');
		first.classList.remove('kod-reveal', 'kod-type');
	}

	function injectSidebarIcons() {
		const root = document.getElementById('starlight__sidebar');
		if (!root) return;
		root.querySelectorAll('a[href]').forEach((a) => {
			if (a.querySelector('.kod-sidebar-icon')) return;
			const seg = segmentFromHref(a.getAttribute('href') || '');
			const src = sidebarIconMap[seg];
			if (!src) return;
			a.dataset.slug = seg;
			const mark = document.createElement('span');
			mark.className = 'kod-sidebar-icon';
			mark.setAttribute('aria-hidden', 'true');
			mark.style.setProperty('--kod-icon-mask', `url("${src}")`);
			a.insertBefore(mark, a.firstChild);
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

	function mountCartouche(el) {
		if (!el || el.querySelector(':scope > .kod-cn')) return;
		const skin = document.createElement('span');
		skin.className = 'kod-skin';
		skin.setAttribute('aria-hidden', 'true');
		const cs = getComputedStyle(el);
		skin.style.background = cs.background;
		skin.style.border = cs.border;
		skin.style.boxShadow = cs.boxShadow;
		el.style.background = 'none';
		el.style.borderColor = 'transparent';
		el.style.boxShadow = 'none';
		const cutTl = document.createElement('span');
		cutTl.className = 'kod-cut kod-cut--tl';
		const cutTr = document.createElement('span');
		cutTr.className = 'kod-cut kod-cut--tr';
		skin.append(cutTl, cutTr);
		const tl = document.createElement('span');
		tl.className = 'kod-cn kod-cn--tl';
		tl.setAttribute('aria-hidden', 'true');
		const tr = document.createElement('span');
		tr.className = 'kod-cn kod-cn--tr';
		tr.setAttribute('aria-hidden', 'true');
		el.insertBefore(tr, el.firstChild);
		el.insertBefore(tl, el.firstChild);
		el.insertBefore(skin, el.firstChild);
	}

	/** Ensure asides have accessible names; icons are CSS ::before on the aside */
	function normalizeBoxes() {
		const hu = document.documentElement.lang === 'hu';
		const labels = hu
			? { example: 'Példa', note: 'Jegyzet', counsel: 'Tanács' }
			: { example: 'Example', note: 'Note', counsel: 'Counsel' };
		document.querySelectorAll('aside.kod-example').forEach((el) => {
			if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', labels.example);
			el.querySelectorAll('.kod-example__label').forEach((n) => n.remove());
			mountCartouche(el);
		});
		document.querySelectorAll('aside.kod-note').forEach((el) => {
			if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', labels.note);
			el.querySelectorAll('.kod-note__label').forEach((n) => n.remove());
			mountCartouche(el);
		});
		document.querySelectorAll('aside.kod-counsel').forEach((el) => {
			if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', labels.counsel);
			el.querySelectorAll('.kod-counsel__label').forEach((n) => n.remove());
			mountCartouche(el);
		});
		document.querySelectorAll('.sl-markdown-content blockquote:not(.kod-epigraph)').forEach((el) => {
			mountCartouche(el);
		});
		document.querySelectorAll('.kod-widget, .kod-fortune-board, .kod-hier-ruler').forEach((el) => {
			mountCartouche(el);
		});
		markQuoteAuthors();
		markDefinedTerms();
	}

	function markDefinedTerms() {
		const terms =
			/^(Echoes?|Foundations?|Skills?|Traits?|Exertion|Harm|Tide|Omens?|Marks?|Hierarch(?:y|ies)|Fortunes?|Practice|Advantage|Disadvantage|Ruler|Decadence|Words?)$/i;
		document.querySelectorAll('.sl-markdown-content strong').forEach((el) => {
			if (el.closest('blockquote, a, table, .kod-seed, .kod-widget, .kod-hier-legend')) return;
			const t = (el.textContent || '').trim();
			if (!terms.test(t)) return;
			const dfn = document.createElement('dfn');
			dfn.textContent = t;
			el.replaceWith(dfn);
		});
	}

	function markQuoteAuthors() {
		const dashStart = /^\s*[—–−‒-]/;
		document.querySelectorAll('.sl-markdown-content blockquote').forEach((bq) => {
			const ps = [...bq.querySelectorAll(':scope > p')];
			const last = ps[ps.length - 1];
			if (!last || last.classList.contains('kod-quote-attr')) return;
			const html = last.innerHTML;
			const parts = html.split(/<br\s*\/?>|\n/i);
			if (parts.length > 1) {
				const tailRaw = parts[parts.length - 1];
				const tailText = tailRaw.replace(/<[^>]+>/g, '').trim();
				if (dashStart.test(tailText)) {
					last.innerHTML = parts.slice(0, -1).join('<br>');
					const attr = document.createElement('p');
					attr.className = 'kod-quote-attr';
					attr.innerHTML = tailRaw.trim();
					last.after(attr);
					return;
				}
			}
			const t = (last.textContent || '').trim();
			if (dashStart.test(t)) last.classList.add('kod-quote-attr');
		});
	}

	function wrapPanelStage(root) {
		const panels = [...root.querySelectorAll(':scope > .kod-widget__panel')];
		if (panels.length < 2) return;
		if (root.querySelector(':scope > .kod-widget__stage')) return;
		const stage = document.createElement('div');
		stage.className = 'kod-widget__stage';
		panels[0].parentNode.insertBefore(stage, panels[0]);
		panels.forEach((p) => stage.appendChild(p));
	}

	/** Exclusive archetype focus: hide siblings, full row, small ← back */
	function setupArchetypeFocus() {
		const root = document.querySelector('.kod-archetypes');
		if (!root || root.dataset.ready) return;
		root.dataset.ready = '1';

		let back = root.querySelector('.kod-archetypes__back');
		if (!back) {
			const hu = document.documentElement.lang === 'hu';
			back = document.createElement('button');
			back.type = 'button';
			back.className = 'kod-archetypes__back';
			back.setAttribute('aria-label', hu ? 'Vissza az őstípusokhoz' : 'Back to all archetypes');
			back.textContent = hu ? '← Vissza' : '← Back';
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
			wrapPanelStage(root);
			const buttons = [...root.querySelectorAll('[data-marks]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			function set(n) {
				const id = String(n);
				buttons.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.marks === id ? 'true' : 'false'),
				);
				panels.forEach((p) => {
					const show = p.getAttribute('data-panel-id') === id;
					if (show) {
						p.removeAttribute('hidden');
						fadeIn(p);
					} else {
						p.setAttribute('hidden', '');
						p.classList.remove('is-in');
					}
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
			wrapPanelStage(root);
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
					if (show) {
						p.removeAttribute('hidden');
						fadeIn(p);
					} else {
						p.setAttribute('hidden', '');
						p.classList.remove('is-in');
					}
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
	function setupPracticeAward() {
		document.querySelectorAll('[data-widget="practice-award"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			wrapPanelStage(root);
			const kindBtns = [...root.querySelectorAll('[data-practice-kind]')];
			const resultGroups = [...root.querySelectorAll('[data-practice-results]')];
			const exertBtns = [...root.querySelectorAll('[data-practice-exert]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			if (!kindBtns.length || !exertBtns.length || !panels.length) return;

			let kind = kindBtns.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset
				.practiceKind || 'opposed';
			let result = { opposed: 'won', unopposed: 'struggle' };
			let exert = exertBtns.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset
				.practiceExert || 'no';

			function resultBtns() {
				const group = resultGroups.find((g) => g.getAttribute('data-practice-results') === kind);
				return group ? [...group.querySelectorAll('[data-practice-result]')] : [];
			}

			function paint() {
				kindBtns.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.practiceKind === kind ? 'true' : 'false'),
				);
				resultGroups.forEach((g) => {
					const show = g.getAttribute('data-practice-results') === kind;
					if (show) g.removeAttribute('hidden');
					else g.setAttribute('hidden', '');
				});
				resultBtns().forEach((b) =>
					b.setAttribute(
						'aria-pressed',
						b.dataset.practiceResult === result[kind] ? 'true' : 'false',
					),
				);
				exertBtns.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.practiceExert === exert ? 'true' : 'false'),
				);
				const id = kind + '-' + result[kind] + '-' + exert;
				panels.forEach((p) => {
					const show = p.getAttribute('data-panel-id') === id;
					if (show) {
						p.removeAttribute('hidden');
						fadeIn(p);
					} else {
						p.setAttribute('hidden', '');
						p.classList.remove('is-in');
					}
				});
			}

			kindBtns.forEach((b) =>
				b.addEventListener('click', () => {
					kind = b.dataset.practiceKind || 'opposed';
					paint();
				}),
			);
			resultGroups.forEach((g) => {
				g.querySelectorAll('[data-practice-result]').forEach((b) => {
					b.addEventListener('click', () => {
						const k = g.getAttribute('data-practice-results');
						if (k) result[k] = b.dataset.practiceResult;
						paint();
					});
				});
			});
			exertBtns.forEach((b) =>
				b.addEventListener('click', () => {
					exert = b.dataset.practiceExert || 'no';
					paint();
				}),
			);
			paint();
		});
	}

	function setupContentTabs() {
		document.querySelectorAll('[data-widget="content-tabs"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			wrapPanelStage(root);
			const buttons = [...root.querySelectorAll('[data-tab]')];
			const panels = [...root.querySelectorAll('[data-panel-id]')];
			if (!buttons.length || !panels.length) return;
			function set(id) {
				buttons.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.tab === id ? 'true' : 'false'),
				);
				panels.forEach((p) => {
					const show = p.getAttribute('data-panel-id') === id;
					if (show) {
						p.removeAttribute('hidden');
						fadeIn(p);
					} else {
						p.setAttribute('hidden', '');
						p.classList.remove('is-in');
					}
				});
			}
			buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.tab)));
			const initial =
				buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.tab ||
				buttons[0].dataset.tab;
			set(initial);
		});
	}

	function setupChronicle() {
		document.querySelectorAll('[data-widget="chronicle"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const open = root.querySelector('.kod-chronicle-open');
			const spines = [...root.querySelectorAll('[data-chronicle]')];
			const books = [...root.querySelectorAll('[data-chronicle-book]')];
			const ladder = root.querySelector('.kod-chronicle-ladder');
			if (!open || !spines.length || !books.length) return;

			const picks = document.createElement('div');
			picks.className = 'kod-chronicle-picks';
			picks.hidden = true;
			picks.setAttribute('role', 'tablist');
			picks.setAttribute('aria-label', 'Examples');
			if (ladder && ladder.nextSibling) open.insertBefore(picks, ladder.nextSibling);
			else open.insertBefore(picks, open.querySelector('.kod-folio') || open.firstChild);

			const stage = document.createElement('div');
			stage.className = 'kod-chronicle-stage';
			const bookSlot = document.createElement('div');
			bookSlot.className = 'kod-chronicle-stage__book';
			books.forEach((b) => bookSlot.appendChild(b));
			const prevBtn = document.createElement('button');
			prevBtn.type = 'button';
			prevBtn.setAttribute('rel', 'prev');
			prevBtn.setAttribute('aria-label', 'Previous page');
			const nextBtn = document.createElement('button');
			nextBtn.type = 'button';
			nextBtn.setAttribute('rel', 'next');
			nextBtn.setAttribute('aria-label', 'Next page');
			stage.append(prevBtn, bookSlot, nextBtn);
			open.appendChild(stage);

			const states = new Map();

			function isNarrow() {
				return window.matchMedia('(max-width: 50rem)').matches;
			}

			function seedTitle(seed) {
				return (seed.querySelector('.kod-seed__title')?.textContent || '').trim();
			}

			function mountPage(page, seed, withTitle) {
				const wrap = document.createElement('div');
				wrap.className = seed.className;
				const title = seed.querySelector('.kod-seed__title');
				if (withTitle && title) wrap.appendChild(title.cloneNode(true));
				const ul = document.createElement('ul');
				ul.className = 'kod-seed__facts';
				wrap.appendChild(ul);
				page.replaceChildren(wrap);
				return ul;
			}

			function overflows(el) {
				return el.scrollHeight > el.clientHeight + 2;
			}

			function paintSpread(book) {
				const st = states.get(book);
				if (!st) return;
				const seed = st.seeds[st.seedIndex];
				if (!seed) return;
				const [verso, recto] = st.pages;
				const facts = [...seed.querySelectorAll('.kod-seed__facts > li')];

				if (isNarrow() || verso.clientHeight < 48) {
					const ul = mountPage(verso, seed, true);
					facts.forEach((li) => ul.appendChild(li.cloneNode(true)));
					if (isNarrow()) recto.replaceChildren();
					else {
						const mid = Math.ceil(facts.length / 2);
						ul.replaceChildren();
						const ulR = mountPage(recto, seed, false);
						facts.slice(0, mid).forEach((li) => ul.appendChild(li.cloneNode(true)));
						facts.slice(mid).forEach((li) => ulR.appendChild(li.cloneNode(true)));
					}
					st.spreadStarts = [0];
					st.spreadIndex = 0;
					return;
				}

				const starts = [0];
				let cursor = 0;
				while (cursor < facts.length) {
					const ulL = mountPage(verso, seed, true);
					const ulR = mountPage(recto, seed, false);
					let i = cursor;
					let placed = 0;
					for (; i < facts.length; i++) {
						const node = facts[i].cloneNode(true);
						ulL.appendChild(node);
						if (overflows(verso)) {
							ulL.removeChild(node);
							break;
						}
						placed++;
					}
					for (; i < facts.length; i++) {
						const node = facts[i].cloneNode(true);
						ulR.appendChild(node);
						if (overflows(recto)) {
							ulR.removeChild(node);
							break;
						}
						placed++;
					}
					if (placed === 0) {
						ulL.appendChild(facts[cursor].cloneNode(true));
						i = cursor + 1;
					}
					cursor = i;
					if (cursor < facts.length) starts.push(cursor);
					else break;
					if (starts.length > 8) break;
				}
				st.spreadStarts = starts;
				if (st.spreadIndex >= starts.length) st.spreadIndex = Math.max(0, starts.length - 1);

				const from = starts[st.spreadIndex] || 0;
				const until = starts[st.spreadIndex + 1] ?? facts.length;
				const ulL = mountPage(verso, seed, true);
				const ulR = mountPage(recto, seed, false);
				let i = from;
				for (; i < until; i++) {
					const node = facts[i].cloneNode(true);
					ulL.appendChild(node);
					if (overflows(verso)) {
						ulL.removeChild(node);
						break;
					}
				}
				for (; i < until; i++) ulR.appendChild(facts[i].cloneNode(true));
				if (!ulR.childElementCount) ulR.remove();
			}

			function renderPicks(book) {
				const st = states.get(book);
				picks.replaceChildren();
				if (!st) {
					picks.hidden = true;
					return;
				}
				st.seeds.forEach((seed, i) => {
					const b = document.createElement('button');
					b.type = 'button';
					b.className = 'kod-chronicle-pick';
					b.setAttribute('role', 'tab');
					b.setAttribute('aria-label', seedTitle(seed));
					b.setAttribute('aria-pressed', i === st.seedIndex ? 'true' : 'false');
					b.dataset.seed = String(i);
					const mark = document.createElement('span');
					mark.textContent = String(i + 1);
					b.appendChild(mark);
					b.addEventListener('click', () => {
						if (st.seedIndex === i) return;
						st.seedIndex = i;
						st.spreadIndex = 0;
						paintSpread(book);
						renderPicks(book);
						renderTurn(book);
						fadeIn(book, 0);
					});
					picks.appendChild(b);
				});
				picks.hidden = false;
			}

			function renderTurn(book) {
				const st = states.get(book);
				const n = st?.spreadStarts?.length || 1;
				prevBtn.disabled = !st || st.spreadIndex <= 0;
				nextBtn.disabled = !st || st.spreadIndex >= n - 1;
			}

			function relayout(book) {
				if (!book || book.hasAttribute('hidden')) return;
				paintSpread(book);
				renderPicks(book);
				renderTurn(book);
			}

			books.forEach((book) => {
				const pages = [...book.querySelectorAll(':scope > .kod-folio__board > .kod-folio__page')];
				const seeds = [...book.querySelectorAll('.kod-seed')];
				if (pages.length < 2 || !seeds.length) return;
				const source = document.createElement('div');
				source.className = 'kod-folio__source';
				source.hidden = true;
				seeds.forEach((s) => source.appendChild(s));
				book.appendChild(source);
				states.set(book, {
					seeds,
					pages,
					seedIndex: 0,
					spreadIndex: 0,
					spreadStarts: [0],
				});
			});

			function showShelf() {
				root.removeAttribute('data-open');
				spines.forEach((s) => s.setAttribute('aria-pressed', 'false'));
				books.forEach((b) => {
					b.setAttribute('hidden', '');
					b.classList.remove('is-in');
				});
				if (ladder) ladder.classList.remove('is-in');
				picks.hidden = true;
			}

			function openBook(id) {
				const fromShelf = !root.hasAttribute('data-open');
				root.setAttribute('data-open', id);
				if (ladder) {
					ladder.setAttribute('data-active', id);
					if (fromShelf) fadeIn(ladder, 80);
				}
				spines.forEach((s) =>
					s.setAttribute('aria-pressed', s.dataset.chronicle === id ? 'true' : 'false'),
				);
				let shown = null;
				books.forEach((b) => {
					if (b.getAttribute('data-chronicle-book') === id) {
						b.removeAttribute('hidden');
						shown = b;
						fadeIn(b, fromShelf ? 180 : 0);
					} else {
						b.setAttribute('hidden', '');
						b.classList.remove('is-in');
					}
				});
				const go = () => {
					if (!shown) return;
					relayout(shown);
				};
				requestAnimationFrame(() => {
					requestAnimationFrame(go);
				});
				if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
			}

			prevBtn.addEventListener('click', () => {
				const id = root.getAttribute('data-open');
				const book = books.find((b) => b.getAttribute('data-chronicle-book') === id);
				const st = book && states.get(book);
				if (!st || st.spreadIndex <= 0) return;
				st.spreadIndex -= 1;
				paintSpread(book);
				renderTurn(book);
				fadeIn(book, 0);
			});
			nextBtn.addEventListener('click', () => {
				const id = root.getAttribute('data-open');
				const book = books.find((b) => b.getAttribute('data-chronicle-book') === id);
				const st = book && states.get(book);
				if (!st || st.spreadIndex >= st.spreadStarts.length - 1) return;
				st.spreadIndex += 1;
				paintSpread(book);
				renderTurn(book);
				fadeIn(book, 0);
			});

			spines.forEach((s) =>
				s.addEventListener('click', () => {
					const id = s.dataset.chronicle;
					if (root.getAttribute('data-open') === id) showShelf();
					else openBook(id);
				}),
			);
			window.addEventListener('resize', () => {
				const id = root.getAttribute('data-open');
				if (!id) return;
				const book = books.find((b) => b.getAttribute('data-chronicle-book') === id);
				if (book) relayout(book);
			});
			showShelf();
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
					if (show) {
						p.removeAttribute('hidden');
						fadeIn(p);
					} else {
						p.setAttribute('hidden', '');
						p.classList.remove('is-in');
					}
				});
				if (labelEl) {
					const title =
						panels
							.find((p) => p.getAttribute('data-panel-id') === id)
							?.getAttribute('data-step-title') || '';
					labelEl.textContent = title
						? `${index + 1} / ${ids.length} — ${title}`
						: `${index + 1} / ${ids.length}`;
					fadeIn(labelEl);
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
			wrapPanelStage(root);
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
					const routA =
						root.getAttribute('data-tide-rout-a') || 'Imperial side routes (collective).';
					const routB =
						root.getAttribute('data-tide-rout-b') || 'Mongol side routes (collective).';
					const mid =
						root.getAttribute('data-tide-mid') ||
						'Imperial footing remaining · Mongol pressure growing as crimson shrinks.';
					const posLabel = root.getAttribute('data-tide-pos-label') || 'Position';
					const state = p <= 0 ? routA : p >= scale ? routB : mid;
					readout.textContent = note
						? note + ' — ' + state
						: posLabel + ' ' + p + ' / ' + scale + '. ' + state;
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
						fadeIn(panel);
						active = panel;
					} else {
						panel.setAttribute('hidden', '');
						panel.classList.remove('is-in');
					}
				});
				const pos = active?.getAttribute('data-tide-pos') ?? '6';
				const note = active?.getAttribute('data-tide-note') || '';
				paint(pos, note);
				if (labelEl) {
					const title = active?.getAttribute('data-step-title') || '';
					labelEl.textContent = title
						? `${index + 1} / ${ids.length} — ${title}`
						: `${index + 1} / ${ids.length}`;
					fadeIn(labelEl);
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
			if (bq.classList.contains('kod-epigraph')) return;
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

	function setupFortuneBoard() {
		document.querySelectorAll('[data-widget="fortune-board"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const cols = [...root.querySelectorAll('.kod-fortune[data-fortune]')];
			const frames = [...root.querySelectorAll('[data-frame]')];

			function paint() {
				cols.forEach((col) => {
					const level = Number(col.getAttribute('data-level') || '2');
					col.querySelectorAll('.kod-fortune__state').forEach((el) => {
						const on = Number(el.getAttribute('data-level')) === level;
						el.removeAttribute('hidden');
						el.classList.toggle('is-off', !on);
					});
					const n = col.querySelector('.kod-fortune__n');
					if (n) n.textContent = String(level);
				});
			}

			function showFrame(id) {
				let shown = false;
				frames.forEach((p) => {
					const show = p.getAttribute('data-frame') === id;
					if (show) {
						p.removeAttribute('hidden');
						fadeIn(p);
						shown = true;
					} else {
						p.setAttribute('hidden', '');
						p.classList.remove('is-in');
					}
				});
				if (!shown) {
					const fallback = frames.find((p) => p.getAttribute('data-frame') === 'board-steady');
					if (fallback) {
						fallback.removeAttribute('hidden');
						fadeIn(fallback);
					}
				}
			}

			const kicker = root.querySelector('.kod-fortune-board__kicker');
			const hint = root.querySelector('.kod-fortune-board__hint');
			if (kicker && hint && kicker.nextElementSibling !== hint) kicker.after(hint);
			root.querySelector('.kod-fortune-board__seals')?.remove();
			cols.forEach((col) => {
				col.querySelector('.kod-fortune__n')?.setAttribute('hidden', '');
				if (!col.querySelector('.kod-fortune__tree')) {
					const tree = document.createElement('span');
					tree.className = 'kod-fortune__tree';
					tree.setAttribute('aria-hidden', 'true');
					const name = col.querySelector('.kod-fortune__name');
					if (name && name.nextSibling) col.insertBefore(tree, name.nextSibling);
					else col.appendChild(tree);
				}
				col.addEventListener('click', () => {
					const next = (Number(col.getAttribute('data-level') || '2') + 1) % 4;
					col.setAttribute('data-level', String(next));
					paint();
					showFrame(`${col.dataset.fortune}-${next}`);
				});
			});
			paint();
			showFrame('board-steady');
		});
	}

	function setupHierarchyBoard() {
		document.querySelectorAll('[data-widget="hierarchy-board"]').forEach((root) => {
			if (root.dataset.ready) return;
			root.dataset.ready = '1';
			const modeBtns = [...root.querySelectorAll('[data-hier-mode]')];
			const notes = [...root.querySelectorAll('[data-person-note]')];
			const diagram = root.querySelector('.kod-hier-diagram');
			root.querySelector('.kod-hier-legend')?.remove();
			root.querySelector('.kod-hier-tiers')?.remove();
			const frame = root.querySelector('.kod-hier__frame');
			if (frame && diagram && frame.nextElementSibling !== diagram) diagram.before(frame);
			const axes = root.querySelector('.kod-hier-axes');
			root.querySelector('.kod-hier-row-rail')?.remove();
			axes?.querySelectorAll(':scope > .kod-hier-row-mark').forEach((m) => m.remove());
			root.querySelectorAll('.kod-hier-axis').forEach((ax) => {
				const domain = ax.querySelector('.kod-hier-axis__domain');
				ax.querySelectorAll('.kod-hier-rungs li > strong').forEach((st) => {
					st.classList.add('kod-hier-rung-label');
				});
				if (!ax.querySelector('.kod-hier-axis__plate')) {
					const plate = document.createElement('div');
					plate.className = 'kod-hier-axis__plate';
					const head = ax.querySelector('.kod-hier-axis__head');
					const rungs = ax.querySelector('.kod-hier-rungs');
					if (head) plate.appendChild(head);
					if (rungs) plate.appendChild(rungs);
					ax.appendChild(plate);
				}
				if (domain) {
					domain.removeAttribute('hidden');
					const plate = ax.querySelector('.kod-hier-axis__plate');
					ax.insertBefore(domain, plate || ax.firstChild);
				}
			});
			const porch = root.querySelector('.kod-hier-porch');
			if (porch) {
				let main = porch.querySelector('.kod-hier-porch__main');
				if (!main) {
					main = document.createElement('div');
					main.className = 'kod-hier-porch__main';
					porch.appendChild(main);
				}
				let head = main.querySelector('.kod-hier-porch__head');
				if (!head) {
					head = document.createElement('div');
					head.className = 'kod-hier-porch__head';
					main.insertBefore(head, main.firstChild);
				}
				const title = porch.querySelector('.kod-hier-porch__title');
				const note = porch.querySelector('.kod-hier-porch__note');
				if (title && title.parentElement !== head) head.appendChild(title);
				if (note && note.parentElement !== head) head.appendChild(note);
				[...porch.children].forEach((ch) => {
					if (ch !== main) main.appendChild(ch);
				});
			}
			root.querySelector('.kod-hier-ruler__note')?.removeAttribute('hidden');
			let svg = root.querySelector('.kod-hier-links');
			if (diagram && !svg) {
				svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				svg.setAttribute('class', 'kod-hier-links');
				svg.setAttribute('aria-hidden', 'true');
				diagram.insertBefore(svg, diagram.firstChild);
			}

			function setMode(mode) {
				root.setAttribute('data-mode', mode);
				modeBtns.forEach((b) =>
					b.setAttribute('aria-pressed', b.dataset.hierMode === mode ? 'true' : 'false'),
				);
				if (mode === 'setup') setPerson(null);
				else drawLinks();
			}

			function setPerson(id) {
				root.dataset.person = id || '';
				root.querySelectorAll('.kod-chip[data-person]').forEach((chip) => {
					const on = Boolean(id) && chip.dataset.person === id;
					chip.setAttribute('aria-pressed', on ? 'true' : 'false');
					chip.classList.toggle('is-lit', on);
				});
				root.querySelectorAll('.kod-hier-rungs li').forEach((li) => {
					const hit = Boolean(id) && li.querySelector(`.kod-chip[data-person="${id}"]`);
					li.classList.toggle('is-lit', Boolean(hit));
				});
				notes.forEach((p) => {
					const key = id || 'default';
					const show = p.getAttribute('data-person-note') === key;
					if (show) {
						p.removeAttribute('hidden');
						fadeIn(p);
					} else {
						p.setAttribute('hidden', '');
						p.classList.remove('is-in');
					}
				});
				drawLinks();
			}

			function drawLinks() {
				if (!svg || !diagram) return;
				svg.replaceChildren();
				if (root.getAttribute('data-mode') === 'setup') return;
				if (prefersReduced) return;
				const id = root.dataset.person;
				if (!id) return;
				const chips = [...root.querySelectorAll(`.kod-chip.is-lit[data-person="${id}"]`)];
				if (chips.length < 2) return;
				const box = diagram.getBoundingClientRect();
				if (box.width < 8 || box.height < 8) return;
				svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
				svg.setAttribute('width', String(box.width));
				svg.setAttribute('height', String(box.height));
				const pts = chips.map((c) => {
					const r = c.getBoundingClientRect();
					return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
				});
				for (let i = 0; i < pts.length - 1; i++) {
					const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
					line.setAttribute('x1', String(pts[i].x));
					line.setAttribute('y1', String(pts[i].y));
					line.setAttribute('x2', String(pts[i + 1].x));
					line.setAttribute('y2', String(pts[i + 1].y));
					svg.appendChild(line);
				}
			}

			modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.hierMode)));
			root.querySelectorAll('.kod-chip[data-person]').forEach((chip) => {
				chip.addEventListener('click', () => {
					if (root.getAttribute('data-mode') === 'setup') return;
					const id = chip.dataset.person;
					setPerson(root.dataset.person === id ? null : id);
				});
			});
			window.addEventListener('resize', drawLinks);
			setMode(root.getAttribute('data-mode') || 'play');
			setPerson(null);
		});
	}

	function enhance() {
		const steps = [
			injectSidebarIcons,
			markEpigraph,
			decorateDividers,
			normalizeBoxes,
			setupArchetypeFocus,
			setupDieChips,
			setupMarksLadder,
			setupTierDial,
			setupPracticeAward,
			setupContentTabs,
			setupChronicle,
			setupStepFlows,
			setupTideDemo,
			setupOmenFaces,
			setupFortuneBoard,
			setupHierarchyBoard,
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

