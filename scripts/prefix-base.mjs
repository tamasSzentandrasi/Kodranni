/**
 * Prefix root-absolute href/src in dist HTML with Astro `base`.
 * Keep BASE in sync with astro.config.mjs (project Pages path).
 * When moving to a custom domain with base: '/', set BASE to '' and this becomes a no-op.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE = '/Kodranni'; // '' when site is apex custom domain with base '/'

if (!BASE || BASE === '/') {
	console.log('prefix-base: no base prefix needed, skip');
	process.exit(0);
}

const bare = BASE.replace(/\/$/, '');

function walk(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path);
		else if (name.endsWith('.html')) rewrite(path);
	}
}

function rewrite(file) {
	let html = readFileSync(file, 'utf8');
	const next = html.replace(
		/(href|src)="\/(?!\/)/g,
		(match, attr) => {
			// already prefixed
			if (match.slice(attr.length + 2).startsWith(bare + '/') || match.slice(attr.length + 2) === bare + '"') {
				return match;
			}
			return `${attr}="${bare}/`;
		},
	);
	// collapse accidental double prefix
	const cleaned = next.replaceAll(`${bare}${bare}/`, `${bare}/`);
	if (cleaned !== html) writeFileSync(file, cleaned);
}

walk('dist');
console.log(`prefix-base: applied ${bare} to dist HTML`);
