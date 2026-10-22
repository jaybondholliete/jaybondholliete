import fs from 'node:fs';
import path from 'node:path';
import { fetchProfile, loadTheme, featuredRepos, repoTier, ASSETS_DIR } from './lib/github.js';
import { svgDoc, text, panel, difficultyIcon, glowFilter, FONT_MONO } from './lib/svg.js';

const W = 440, H = 230;
const t = loadTheme();
const user = await fetchProfile();
const repos = featuredRepos(user, 4);

const defs = `
  ${glowFilter('glow-green', t.green, 4)}
  ${glowFilter('glow-cyan', t.cyan, 3)}`;

function trunc(s = '', n = 44) {
  s = (s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

let rows = '';
const rowH = 42;
repos.forEach((r, i) => {
  const y = 58 + i * rowH;
  const tier = repoTier(r);
  const topics = (r.repositoryTopics?.nodes ?? []).slice(0, 2).map((n) => `#${n.topic.name}`).join(' ');
  const meta = [`★ ${r.stargazerCount}`];
  if (r.primaryLanguage?.name) meta.push(`● ${r.primaryLanguage.name}`);
  if (topics) meta.push(topics);
  rows += `
  <g>
    ${difficultyIcon(tier, 36, y + 14, 20)}
    ${text(52, y + 8, r.name, { size: 13, fill: t.text, weight: 700 })}
    ${text(W - 26, y + 8, tier.toUpperCase(), { size: 9, fill: t.dim, family: FONT_MONO, anchor: 'end', spacing: 1 })}
    ${text(52, y + 24, trunc(r.description, 34), { size: 10.5, fill: t.dim, weight: 400 })}
    ${text(W - 26, y + 24, meta.join('  '), { size: 9.5, fill: t.dim, family: FONT_MONO, anchor: 'end' })}
    ${i < repos.length - 1 ? `<line x1="26" y1="${y + 34}" x2="${W - 26}" y2="${y + 34}" stroke="${t.grid}" stroke-width="0.7"/>` : ''}
  </g>`;
});

if (!repos.length) {
  rows = text(W / 2, 130, 'no featured levels yet — pin some repos!', { size: 13, fill: t.dim, family: FONT_MONO, anchor: 'middle' });
}

const body = `
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  ${panel(10, 10, W - 20, H - 20, 'FEATURED LEVELS', '// auto-rated', t)}
  ${rows}
`;

const out = svgDoc(W, H, defs, body);
const file = path.join(ASSETS_DIR, 'projects-panel.svg');
fs.writeFileSync(file, out);
console.log(`wrote ${path.relative(process.cwd(), file)} (${repos.length} repos)`);
