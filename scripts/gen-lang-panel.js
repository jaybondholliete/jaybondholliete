import fs from 'node:fs';
import path from 'node:path';
import { fetchProfile, loadTheme, languageStack, ASSETS_DIR } from './lib/github.js';
import { svgDoc, text, panel, glowFilter, FONT_MONO } from './lib/svg.js';

const W = 440, H = 286;
const t = loadTheme();
const user = await fetchProfile();
const langs = languageStack(user, 7);

const defs = `
  ${glowFilter('glow-green', t.green, 4)}
  ${glowFilter('glow-cyan', t.cyan, 3)}
  ${glowFilter('glow-gold', t.gold, 4)}`;

let rows = '';
const rowH = 30;
langs.forEach((l, i) => {
  const y = 62 + i * rowH;
  const barW = Math.max(4, Math.round((l.pct / 100) * (W - 60)));
  const star = l.best
    ? text(46 + l.name.length * 7.6 + 10, y - 1, '★', { size: 13, fill: t.gold, filter: 'url(#glow-gold)' })
      + text(46 + l.name.length * 7.6 + 24, y - 1, 'BEST', { size: 9, fill: t.gold, family: FONT_MONO, spacing: 1 })
    : '';
  rows += `
  <g>
    <rect x="26" y="${y - 10}" width="10" height="10" rx="2" fill="${l.color || t.dim}"/>
    ${text(46, y - 1, l.name, { size: 13, fill: t.text, weight: 600 })}
    ${star}
    ${text(W - 26, y - 1, `${l.pct.toFixed(1)}%`, { size: 12, fill: t.dim, family: FONT_MONO, anchor: 'end' })}
    <rect x="46" y="${y + 6}" width="${W - 72}" height="7" rx="3.5" fill="${t.grid}"/>
    <rect x="46" y="${y + 6}" width="${barW}" height="7" rx="3.5" fill="${l.color || t.cyan}" filter="url(#glow-cyan)"/>
  </g>`;
});

if (!langs.length) {
  rows = text(W / 2, 130, 'no language data yet — ship some code!', { size: 13, fill: t.dim, family: FONT_MONO, anchor: 'middle' });
}

const body = `
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  ${panel(10, 10, W - 20, H - 20, 'LANGUAGE STACK', '// skill chart', t)}
  ${rows}
`;

const out = svgDoc(W, H, defs, body);
const file = path.join(ASSETS_DIR, 'lang-panel.svg');
fs.writeFileSync(file, out);
console.log(`wrote ${path.relative(process.cwd(), file)} (${langs.length} langs)`);
