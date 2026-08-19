/**
 * Objective Guidebook checks — the leaks we have already shipped once.
 * No visual guesses. Fail the build if they return.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const docs = 'src/content/docs';
const errors = [];

function walk(dir, acc = []) {
	for (const name of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, name.name);
		if (name.isDirectory()) walk(path, acc);
		else if (name.name.endsWith('.md')) acc.push(path);
	}
	return acc;
}

const files = walk(docs);
for (const file of files) {
	const text = readFileSync(file, 'utf8');
	if (/\{#[^}\s]+\}/.test(text)) {
		errors.push(`${file}: custom {#id} — Starlight prints it. Use the auto slug.`);
	}
	if (/docs\/plans\//.test(text)) {
		errors.push(`${file}: player-facing path to docs/plans/.`);
	}
}

const intro = readFileSync(join(docs, 'introduction.md'), 'utf8');
const echoes = intro.indexOf('[Echoes](/echoes/)');
const harm = intro.indexOf('[Harm](/harm/)');
if (echoes < 0 || harm < 0 || echoes > harm) {
	errors.push('introduction.md: organisation table must list Echoes before Harm.');
}

if (errors.length) {
	console.error('guidebook-integrity failed:\n' + errors.map((e) => '  - ' + e).join('\n'));
	process.exit(1);
}
console.log(`guidebook-integrity: ${files.length} chapters ok`);
