/**
 * Prefix root-absolute href/src in dist HTML with Astro `base`.
 * Keep BASE in sync with astro.config.mjs `base`.
 * When using a custom domain with base: '/', set BASE to '' (no-op).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE = '/Guidebook'; // must match astro.config.mjs base

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

	// Only prefix root-absolute paths that are NOT already under the book base.
	const next = html.replace(/(href|src)="(\/[^"]*)"/g, (full, attr, path) => {
		if (path === bare || path.startsWith(bare + '/')) return full;
		// path is like "/icons/x.svg" or "/foundations/"
		return `${attr}="${bare}${path}"`;
	});

	if (next !== html) writeFileSync(file, next);
}

walk('dist');
console.log(`prefix-base: applied ${bare} to dist HTML`);
