import fs from 'node:fs';
import path from 'node:path';
import { fetchProfile, loadTheme, ASSETS_DIR, CONF_DIR } from './lib/github.js';
import { svgDoc, text, cube, spikeRow, blockRow, glowFilter, FONT_MONO } from './lib/svg.js';

const W = 900, H = 240;
const t = loadTheme();
const user = await fetchProfile();

const name = (user.login || 'jaybondholliete').toUpperCase();
const bio = (user.bio || 'still jumping through the first level').slice(0, 64);
const followers = user.followers?.totalCount ?? 0;
const attempts = user.contributionsCollection?.contributionCalendar?.totalContributions ?? 0;

const GROUND_Y = 205;
const CUBE_X = 640, CUBE_Y = 128, CUBE_S = 46;

const AVATAR_PATH = [path.join(CONF_DIR, 'avatar_no_bg.png'), path.join(CONF_DIR, 'avatar.png')]
  .find((p) => fs.existsSync(p));
let avatar = '';
if (AVATAR_PATH) {
  const b64 = fs.readFileSync(AVATAR_PATH).toString('base64');
  const hasBg = !AVATAR_PATH.includes('no_bg');
  const img = hasBg
    ? `<image x="690" y="0" width="210" height="240" preserveAspectRatio="xMidYMin slice" href="data:image/png;base64,${b64}"/>
    <rect x="690" y="0" width="110" height="240" fill="url(#avfade)"/>`
    : `<image x="690" y="-3" width="210" height="215" preserveAspectRatio="xMidYMax meet" href="data:image/png;base64,${b64}"/>`;
  avatar = `<g clip-path="url(#avclip)">${img}</g>`;
}

function skyline() {
  const bars = [
    [520, 34, 40], [566, 22, 62], [594, 30, 30], [630, 26, 78],
    [662, 20, 55], [688, 28, 96], [722, 24, 48], [752, 30, 72],
    [788, 22, 38], [816, 28, 60], [850, 34, 46], [890, 20, 30],
  ];
  let out = '';
  for (const [x, w, h] of bars) {
    out += `<rect x="${x}" y="${GROUND_Y - h}" width="${w}" height="${h}" fill="#0d1130" stroke="${t.grid}" stroke-width="1"/>`;
    const cols = Math.floor(w / 12), rows = Math.floor(h / 16);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if ((c * 7 + r * 3 + x) % 5 === 0) {
          out += `<rect x="${x + 5 + c * 12}" y="${GROUND_Y - h + 6 + r * 16}" width="5" height="7" fill="${t.cyan}" opacity="0.28"/>`;
        }
      }
    }
  }
  return out;
}

function stars() {
  const pts = [[60, 30], [140, 18], [230, 42], [330, 24], [410, 40], [505, 20], [760, 18], [870, 34]];
  return pts.map(([x, y], i) =>
    `<rect x="${x}" y="${y}" width="3" height="3" fill="${i % 3 === 0 ? t.cyan : '#ffffff'}" opacity="0.5" transform="rotate(45 ${x + 1.5} ${y + 1.5})"/>`
  ).join('');
}

function floorGrid() {
  let out = '';
  for (const y of [154, 160, 168, 178, 190]) {
    out += `<line x1="0" y1="${y}" x2="900" y2="${y}" stroke="${t.grid}" stroke-width="0.8" opacity="0.6"/>`;
  }
  for (let i = -8; i <= 8; i++) {
    const xTop = 450 + i * 60;
    const xBot = 450 + i * 160;
    out += `<line x1="${xTop}" y1="150" x2="${xBot}" y2="204" stroke="${t.grid}" stroke-width="0.8" opacity="0.6"/>`;
  }
  return `<g opacity="0.55">${out}</g>`;
}

function trail() {
  const steps = [
    [CUBE_X - 30, CUBE_Y + 34, 34, 0.30],
    [CUBE_X - 56, CUBE_Y + 52, 26, 0.22],
    [CUBE_X - 78, CUBE_Y + 66, 20, 0.15],
    [CUBE_X - 96, CUBE_Y + 76, 14, 0.09],
  ];
  return steps.map(([cx, cy, s, op], i) => `
    <rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="${s * 0.15}" fill="${t.cyan}" opacity="${op}">
      <animate attributeName="opacity" values="${op};${op + 0.12};${op}" dur="1.2s" begin="${i * 0.12}s" repeatCount="indefinite"/>
    </rect>`).join('');
}

const defs = `
  ${glowFilter('glow-cyan', t.cyan, 5)}
  ${glowFilter('glow-green', t.green, 4)}
  ${glowFilter('glow-magenta', t.magenta, 4)}
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#070b1d"/>
    <stop offset="1" stop-color="#0d1130"/>
  </linearGradient>
  <linearGradient id="avfade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0d1130" stop-opacity="1"/>
    <stop offset="1" stop-color="#0d1130" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="avclip"><rect x="690" y="0" width="210" height="240"/></clipPath>`;

const body = `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars()}
  ${floorGrid()}
  ${skyline()}
  ${avatar}

  <g>${blockRow(0, GROUND_Y, 20, 45, '#10142e', t.border)}</g>
  <rect x="0" y="${GROUND_Y + 20}" width="900" height="${H - GROUND_Y - 20}" fill="#0d1230"/>
  <line x1="0" y1="${GROUND_Y + 20}" x2="900" y2="${GROUND_Y + 20}" stroke="${t.border}" stroke-width="1"/>
  ${spikeRow(596, GROUND_Y + 20, 26, 3, '#161b3d', t.border)}
  ${spikeRow(742, GROUND_Y + 20, 26, 2, '#161b3d', t.border)}
  <path d="M 622 ${GROUND_Y + 20} L 630 ${GROUND_Y + 8} L 638 ${GROUND_Y + 20} Z" fill="#161b3d" stroke="${t.magenta}" stroke-width="0.8" opacity="0.9"/>
  <path d="M 766 ${GROUND_Y + 20} L 774 ${GROUND_Y + 8} L 782 ${GROUND_Y + 20} Z" fill="#161b3d" stroke="${t.cyan}" stroke-width="0.8" opacity="0.9"/>

  ${trail()}
  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -16; 0 0" keyTimes="0;0.5;1" dur="1.1s" repeatCount="indefinite"/>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 ${CUBE_X} ${CUBE_Y}" to="360 ${CUBE_X} ${CUBE_Y}" dur="1.1s" repeatCount="indefinite"/>
      ${cube(CUBE_X, CUBE_Y, CUBE_S, t.cyan, t.lime)}
    </g>
  </g>

  ${text(40, 34, `◈ ${followers} PLAYERS WATCHING`, { size: 11, fill: t.dim, family: FONT_MONO, spacing: 2 })}
  ${text(W - 40, 34, 'LVL 01 · NORMAL ★ 2', { size: 11, fill: t.dim, family: FONT_MONO, spacing: 2, anchor: 'end' })}

  ${text(40, 70, 'PLAYER 01', { size: 12, fill: t.magenta, family: FONT_MONO, spacing: 4, filter: 'url(#glow-magenta)' })}
  ${text(40, 108, name, { size: 34, fill: t.text, weight: 800, spacing: 4, stroke: '#06081c', strokeWidth: 5, filter: 'url(#glow-cyan)' })}
  ${text(40, 136, bio, { size: 14, fill: t.dim, weight: 400 })}

  <g>
    <rect x="40" y="154" width="150" height="24" rx="5" fill="${t.panel}" stroke="${t.border}"/>
    ${text(52, 171, `ATTEMPT #${attempts}`, { size: 12, fill: t.lime, family: FONT_MONO, spacing: 1, filter: 'url(#glow-green)' })}
  </g>
  ${text(40, 196, '> press start to continue', { size: 12, fill: t.cyan, family: FONT_MONO })}
  <text x="233" y="196" font-size="12" font-family="${FONT_MONO}" fill="${t.cyan}">_<animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></text>
`;

const out = svgDoc(W, H, defs, body);
const file = path.join(ASSETS_DIR, 'banner.svg');
fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.writeFileSync(file, out);
console.log(`wrote ${path.relative(process.cwd(), file)} (${out.length} bytes, attempt #${attempts})`);
