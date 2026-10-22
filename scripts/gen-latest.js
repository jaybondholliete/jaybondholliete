import fs from 'node:fs';
import path from 'node:path';
import { fetchLatestEvent, loadTheme, ASSETS_DIR } from './lib/github.js';
import { svgDoc, text, cube, glowFilter, FONT_MONO } from './lib/svg.js';

const W = 900;
const H = 56;
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
<rect x="10" y="7" width="880" height="42" rx="8" fill="${t.panel}" stroke="${t.border}"/>
${cube(40, 28, 20, t.cyan, t.lime)}
${text(72, 35, 'LAST JUMP', { fill: t.lime, size: 12, family: FONT_MONO, spacing: 2 })}
${text(172, 35, content, { fill: t.text, size: 12.5, family: FONT_MONO })}
<circle cx="858" cy="28" r="4" fill="${t.magenta}"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
${text(844, 33, 'LIVE', { fill: t.magenta, size: 9, family: FONT_MONO, anchor: 'end', spacing: 1 })}`;

fs.writeFileSync(path.join(ASSETS_DIR, 'latest.svg'), svgDoc(W, H, defs, body));
console.log('wrote assets/latest.svg');
