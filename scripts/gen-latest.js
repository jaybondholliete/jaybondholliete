import fs from 'node:fs';
import path from 'node:path';
import { fetchLatestEvent, loadTheme, ASSETS_DIR } from './lib/github.js';
import { svgDoc, text, cube, glowFilter, FONT_MONO } from './lib/svg.js';

const W = 900;
const H = 100;
const t = loadTheme();
const ev = await fetchLatestEvent();

function rel(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(s) || s < 0) return 'just now';
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

let repo = '';
let msg = 'no jumps logged yet';
let when = '';
if (ev) {
  repo = ev.repo?.name || '';
  when = rel(ev.created_at);
  if (ev.type === 'PushEvent' && ev.payload?.commits?.length) {
    msg = ev.payload.commits[ev.payload.commits.length - 1].message.split('\n')[0];
  } else if (ev.type === 'CreateEvent') {
    msg = `spawned ${ev.payload.ref_type}${ev.payload.ref ? ' ' + ev.payload.ref : ''}`;
  } else {
    msg = ev.type.replace('Event', '').toLowerCase();
  }
}
if (msg.length > 56) msg = `${msg.slice(0, 55)}…`;

const content = `${repo}${repo ? ' — ' : ''}"${msg}"${when ? ` · ${when}` : ''}`;

const defs = glowFilter('g', t.cyan);
const body = `
<rect width="${W}" height="${H}" fill="${t.bg}"/>
<rect x="10" y="7" width="880" height="38" rx="8" fill="${t.panel}" stroke="${t.border}"/>
${cube(38, 26, 18, t.cyan, t.lime)}
${text(68, 31, 'LAST JUMP', { fill: t.lime, size: 11, family: FONT_MONO, spacing: 2 })}
${text(168, 31, content, { fill: t.text, size: 12.5, family: FONT_MONO })}
<circle cx="858" cy="26" r="4" fill="${t.magenta}"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
${text(844, 31, 'LIVE', { fill: t.magenta, size: 9, family: FONT_MONO, anchor: 'end', spacing: 1 })}

<rect x="10" y="55" width="880" height="38" rx="8" fill="${t.panel}" stroke="${t.border}" stroke-dasharray="4 4" opacity="0.75"/>
<g opacity="0.55">
  <rect x="30" y="66" width="16" height="16" rx="3" fill="none" stroke="${t.cyan}" stroke-width="1.6" stroke-dasharray="3 3"/>
</g>
${text(68, 79, 'NEXT JUMP', { fill: t.cyan, size: 11, family: FONT_MONO, spacing: 2, opacity: 0.8 })}
${text(168, 79, 'you — "create something new" · awaiting push', { fill: t.dim, size: 12.5, family: FONT_MONO })}
<text x="455" y="79" font-size="12.5" font-family="${FONT_MONO}" fill="${t.cyan}">_<animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></text>
${text(880, 79, 'PENDING', { fill: t.gold, size: 9, family: FONT_MONO, anchor: 'end', spacing: 1, opacity: 0.9 })}`;

fs.writeFileSync(path.join(ASSETS_DIR, 'latest.svg'), svgDoc(W, H, defs, body));
console.log('wrote assets/latest.svg');
