/**
 * Unhashed tokens + primitives + ornament for the Pages portal.
 * Landing cannot consume Vite-hashed package URLs.
 */
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'packages/design');
const dest = join(root, 'public-root/design');
const ornamentSrc = join(src, 'ornament');
const ornamentDest = join(dest, 'ornament');

const cssFiles = ['tokens.css', 'primitives.css'];
const requiredOrnament = [
	'btn-glass.png',
	'btn-glass-mid.png',
	'btn-round.png',
	'btn-round-moon.png',
	'btn-end-l.png',
	'btn-end-r.png',
	'btn-bar-night.png',
	'btn-bar-moon.png',
	'title-cast.png',
];

for (const file of cssFiles) {
	if (!existsSync(join(src, file))) {
		console.error(`copy-design-root: missing ${file} in packages/design`);
		process.exit(1);
	}
}
if (!existsSync(ornamentSrc)) {
	console.error('copy-design-root: missing packages/design/ornament');
	process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(ornamentDest, { recursive: true });

function withRelativeOrnamentUrls(css) {
	return css.replace(
		/url\(\s*(['"]?)(?:\.\.?\/)?(?:[^'")]*\/)?ornament\/([^'")\s]+)\1\s*\)/g,
		(_m, _q, file) => `url('./ornament/${file}')`,
	);
}

for (const file of cssFiles) {
	const css = withRelativeOrnamentUrls(readFileSync(join(src, file), 'utf8'));
	if (file === 'primitives.css') {
		if (/@import\s+['"][^'"]*fonts\.css['"]/.test(css)) {
			console.error('copy-design-root: primitives.css must not import fonts');
			process.exit(1);
		}
		if (!/@import\s+['"][.\/]*tokens\.css['"]/.test(css)) {
			console.error('copy-design-root: primitives.css must @import tokens.css');
			process.exit(1);
		}
	}
	writeFileSync(join(dest, file), css);
}

function copyOrnament(src, dest) {
	mkdirSync(dest, { recursive: true });
	for (const entry of readdirSync(src, { withFileTypes: true })) {
		const from = join(src, entry.name);
		const to = join(dest, entry.name);
		if (entry.isDirectory()) copyOrnament(from, to);
		else if (/\.(svg|png|jpe?g)$/i.test(entry.name)) cpSync(from, to);
	}
}
copyOrnament(ornamentSrc, ornamentDest);

for (const file of requiredOrnament) {
	if (!existsSync(join(ornamentDest, file))) {
		console.error(`copy-design-root: missing ornament/${file}`);
		process.exit(1);
	}
}

const tokens = readFileSync(join(dest, 'tokens.css'), 'utf8');
if (!tokens.includes("url('./ornament/")) {
	console.error("copy-design-root: tokens.css ornament URLs must be url('./ornament/…')");
	process.exit(1);
}

console.log(`copy-design-root: wrote ${dest}`);
