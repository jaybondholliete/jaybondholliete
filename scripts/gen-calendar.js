import fs from 'node:fs';
import path from 'node:path';
import { fetchProfile, loadTheme, ASSETS_DIR, USE_MOCK } from './lib/github.js';
import { svgDoc, text, glowFilter, FONT_MONO } from './lib/svg.js';

const W = 900;
const H = 196;
const CELL = 12;
const GAP = 2;
const STEP = CELL + GAP;
const X0 = 48;
const Y0 = 62;
const t = loadTheme();

const RAMP = ['#151b3d', '#0f637d', '#22d3ee', '#a3ff12', '#ffc83d'];
const LEVEL_IDX = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

function synthWeeks() {
  let seed = 1337;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const weeks = [];
  const start = new Date(Date.now() - 364 * 864e5);
  start.setDate(start.getDate() - start.getDay());
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getTime() + (w * 7 + d) * 864e5);
      if (date > new Date()) break;
      const busy = rnd() > 0.72;
      const count = busy ? 1 + Math.floor(rnd() * 9) : 0;
      const lvl = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 6 ? 3 : 4;
      days.push({ date: date.toISOString().slice(0, 10), weekday: d, contributionCount: count, contributionLevel: lvl });
    }
    weeks.push({ contributionDays: days });
  }
  return weeks;
}

const user = await fetchProfile();
const cal = user.contributionsCollection?.contributionCalendar ?? {};
const weeks = cal.weeks?.length ? cal.weeks : USE_MOCK ? synthWeeks() : [];
const totalShown = cal.totalContributions ?? weeks.reduce((s, w) => s + w.contributionDays.reduce((a, d) => a + d.contributionCount, 0), 0);

let cells = '';
weeks.forEach((w, wi) => {
  for (const d of w.contributionDays) {
    const lvl = typeof d.contributionLevel === 'string' ? LEVEL_IDX[d.contributionLevel] ?? 0 : (d.contributionLevel ?? 0);
    const x = X0 + wi * STEP;
    const y = Y0 + d.weekday * STEP;
    const label = `${d.contributionCount} jump${d.contributionCount === 1 ? '' : 's'} · ${d.date}`;
    cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${RAMP[lvl]}"${lvl ? ` stroke="${RAMP[lvl]}" stroke-opacity="0.35"` : ''}><title>${label}</title></rect>`;
  }
});

const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
let months = '';
let prevMonth = -1;
weeks.forEach((w, wi) => {
  const first = w.contributionDays[0];
  if (!first) return;
  const m = new Date(first.date).getUTCMonth();
  if (m !== prevMonth) {
    if (wi > 0) months += text(X0 + wi * STEP, Y0 - 12, monthNames[m], { size: 9, fill: t.dim, family: FONT_MONO, spacing: 1 });
    prevMonth = m;
  }
});

const dayLabels = [[1, 'MON'], [3, 'WED'], [5, 'FRI']]
  .map(([wd, s]) => text(X0 - 8, Y0 + wd * STEP + CELL - 2, s, { size: 9, fill: t.dim, family: FONT_MONO, anchor: 'end' }))
  .join('');

const legendY = Y0 + 7 * STEP + 8;
const legend = text(794, legendY + CELL - 2, 'LESS', { size: 9, fill: t.dim, family: FONT_MONO, anchor: 'end' })
  + RAMP.map((c, i) => `<rect x="${800 + i * STEP}" y="${legendY}" width="${CELL}" height="${CELL}" rx="2" fill="${c}"/>`).join('')
  + text(874, legendY + CELL - 2, 'MORE', { size: 9, fill: t.dim, family: FONT_MONO });

const defs = `${glowFilter('glow-lime', t.lime, 4)}${glowFilter('glow-cyan', t.cyan, 5)}`;
const body = `
<rect width="${W}" height="${H}" fill="${t.bg}"/>
${text(24, 34, '◈ THE BLOCKS', { fill: t.lime, size: 16, spacing: 3, filter: 'url(#glow-lime)' })}
${text(876, 34, `${totalShown.toLocaleString()} JUMPS · LAST 365 DAYS`, { fill: t.dim, size: 11, family: FONT_MONO, anchor: 'end' })}
<rect x="12" y="46" width="876" height="140" rx="10" fill="${t.panel}" stroke="${t.border}"/>
${months}
${dayLabels}
${cells}
${legend}`;

fs.writeFileSync(path.join(ASSETS_DIR, 'calendar.svg'), svgDoc(W, H, defs, body));
console.log(`wrote assets/calendar.svg (${weeks.length} weeks, ${totalShown} contributions)`);
