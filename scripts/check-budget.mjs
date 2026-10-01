/** Fails if the first-load payload grows past budget. Run after `npm run build`:  npm run check */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const gz = (p) => gzipSync(readFileSync(p)).length;
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const html = readFileSync('dist/index.html', 'utf8');
const entry = html.match(/src="\/(sws\/[^"]+\.js)"/)?.[1];
const css = html.match(/href="\/(sws\/[^"]+\.css)"/)?.[1];
const all = readdirSync('dist/sws').filter((f) => f.endsWith('.js')).map((f) => `sws/${f}`);
const lazy = all.filter((f) => f !== entry);

const budget = [
  ['Initial JS (gz)', gz(`dist/${entry}`), 80 * 1024],
  ['CSS (gz)', gz(`dist/${css}`), 20 * 1024],
  ['HTML (gz)', gzipSync(html).length, 14 * 1024],
  ['Lazy 3D chunks (gz, after idle)', lazy.reduce((a, f) => a + gz(`dist/${f}`), 0), 200 * 1024],
  ['Hero poster desktop (avif)', statSync('dist/assets/hero-poster-desktop-1920.avif').size, 150 * 1024],
];
let fail = false;
for (const [label, size, max] of budget) {
  const ok = size <= max; fail ||= !ok;
  console.log(`${ok ? '✓' : '✗'} ${label.padEnd(34)} ${kb(size).padStart(10)}  / ${kb(max)}`);
}
process.exit(fail ? 1 : 0);
