/**
 * Objective Guidebook checks — the leaks we have already shipped once.
 * No visual guesses. Fail the build if they return.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

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

const english = files
	.filter((file) => !relative(docs, file).startsWith('hu' + (relative(docs, file).includes('\\') ? '\\' : '/')))
	.filter((file) => !relative(docs, file).startsWith('hu/'));

for (const file of english) {
	const rel = relative(docs, file);
	if (rel.startsWith('hu')) continue;
	const twin = join(docs, 'hu', rel);
	if (!existsSync(twin)) {
		errors.push(`${rel}: missing Hungarian twin at hu/${rel}`);
	}
}

function echoesBeforeHarm(path, label) {
	if (!existsSync(path)) {
		errors.push(`${label}: file missing`);
		return;
	}
	const intro = readFileSync(path, 'utf8');
	const echoes = intro.search(/\]\(\/?(hu\/)?echoes\/\)/);
	const harm = intro.search(/\]\(\/?(hu\/)?harm\/\)/);
	if (echoes < 0 || harm < 0 || echoes > harm) {
		errors.push(`${label}: organisation table must list Echoes before Harm.`);
	}
}

echoesBeforeHarm(join(docs, 'introduction.md'), 'introduction.md');
echoesBeforeHarm(join(docs, 'hu', 'introduction.md'), 'hu/introduction.md');

if (errors.length) {
	console.error('guidebook-integrity failed:\n' + errors.map((e) => '  - ' + e).join('\n'));
	process.exit(1);
}
console.log(`guidebook-integrity: ${files.length} chapters ok`);
