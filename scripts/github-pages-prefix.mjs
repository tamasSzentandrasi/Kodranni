/**
 * GitHub project Pages live under /Kodranni. The Astro book is built for
 * kodranni.com/Guidebook (base: /Guidebook). After nesting dist at
 * publish/Guidebook, rewrite root-absolute /Guidebook URLs so github.io
 * loads /Kodranni/Guidebook/_astro/… instead of /Guidebook/_astro/… (404).
 *
 * Canonical https://kodranni.com/Guidebook links are left alone.
 * The edge Worker maps /Kodranni/Guidebook back to /Guidebook on the apex.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TEXT_EXT = /\.(html|css|js|mjs|json|xml|svg|txt|map)$/i;

export function rewriteGithubPagesPaths(text) {
	return text.replace(
		/(^|[^A-Za-z0-9.])\/Guidebook(?=\/|"|'|\)|\?|#|$)/g,
		'$1/Kodranni/Guidebook',
	);
}

function walk(dir, files = []) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path, files);
		else if (TEXT_EXT.test(name)) files.push(path);
	}
	return files;
}

const selfTest = process.argv.includes('--self-test');
if (selfTest) {
	const samples = [
		['href="/Guidebook/_astro/x.css"', 'href="/Kodranni/Guidebook/_astro/x.css"'],
		["url(/Guidebook/fonts/a.woff2)", 'url(/Kodranni/Guidebook/fonts/a.woff2)'],
		['https://kodranni.com/Guidebook/introduction/', 'https://kodranni.com/Guidebook/introduction/'],
		['href="/Kodranni/Guidebook/x"', 'href="/Kodranni/Guidebook/x"'],
		['src="/Guidebook/scenes/falconer.jpg"', 'src="/Kodranni/Guidebook/scenes/falconer.jpg"'],
	];
	let failed = 0;
	for (const [input, expected] of samples) {
		const got = rewriteGithubPagesPaths(input);
		if (got !== expected) {
			console.error(`expected ${JSON.stringify(expected)}\n     got ${JSON.stringify(got)}`);
			failed++;
		}
	}
	if (failed) process.exit(1);
	console.log('github-pages-prefix: self-test ok');
	process.exit(0);
}

const root = process.argv[2] || 'publish/Guidebook';
let changed = 0;
for (const file of walk(root)) {
	const html = readFileSync(file, 'utf8');
	const next = rewriteGithubPagesPaths(html);
	if (next !== html) {
		writeFileSync(file, next);
		changed++;
	}
}
console.log(`github-pages-prefix: rewrote ${changed} files under ${root}`);
