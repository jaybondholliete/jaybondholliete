export const FONT_HEAD = "Verdana, 'DejaVu Sans', sans-serif";
export const FONT_MONO = "'Courier New', Consolas, monospace";

export function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

export function glowFilter(id, color, dev = 4) {
  return `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="${dev}" result="b"/>
      <feFlood flood-color="${color}" flood-opacity="0.8"/>
      <feComposite in2="b" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
}

export function text(x, y, str, o = {}) {
  const {
    size = 14, fill = '#fff', weight = 700, family = FONT_HEAD,
    spacing = 0, anchor = 'start', stroke, strokeWidth = 3, opacity = 1, filter,
  } = o;
  const st = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke" stroke-linejoin="round"` : '';
  const fi = filter ? ` filter="${filter}"` : '';
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" font-family="${family}" fill="${fill}" letter-spacing="${spacing}" text-anchor="${anchor}"${st}${fi} opacity="${opacity}">${esc(str)}</text>`;
}

export function panel(x, y, w, h, title, subtitle, t, r = 12) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${t.panel}" stroke="${t.border}" stroke-width="1.5"/>
  <line x1="${x + 14}" y1="${y + 40}" x2="${x + w - 14}" y2="${y + 40}" stroke="${t.border}" stroke-width="1"/>
  ${text(x + 16, y + 27, title, { size: 15, fill: t.green, spacing: 2.5, filter: 'url(#glow-green)' })}
  ${subtitle ? text(x + w - 16, y + 27, subtitle, { size: 11, fill: t.dim, family: FONT_MONO, anchor: 'end' }) : ''}`;
}

export function cube(cx, cy, s, primary, secondary, rot = 0, extra = '') {
  const x = cx - s / 2;
  const y = cy - s / 2;
  return `<g transform="rotate(${rot} ${cx} ${cy})" ${extra}>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.12}" fill="${primary}" stroke="#06081c" stroke-width="${s * 0.1}"/>
    <rect x="${x + s * 0.2}" y="${y + s * 0.2}" width="${s * 0.6}" height="${s * 0.6}" fill="${secondary}" stroke="#06081c" stroke-width="${s * 0.06}"/>
    <rect x="${x + s * 0.3}" y="${y + s * 0.32}" width="${s * 0.16}" height="${s * 0.22}" fill="#06081c"/>
    <rect x="${x + s * 0.54}" y="${y + s * 0.32}" width="${s * 0.16}" height="${s * 0.22}" fill="#06081c"/>
  </g>`;
}

export function spikeRow(x, yBase, s, n, fill, stroke) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const sx = x + i * s;
    out += `<path d="M ${sx} ${yBase} L ${sx + s / 2} ${yBase - s * 0.9} L ${sx + s} ${yBase} Z" fill="${fill}" stroke="${stroke}" stroke-width="${s * 0.05}"/>`;
  }
  return out;
}

export function blockRow(x, y, s, n, face, edge) {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<rect x="${x + i * s}" y="${y}" width="${s}" height="${s}" fill="${face}" stroke="${edge}" stroke-width="1"/>`;
  }
  return out;
}

const TIER_COLORS = {
  easy: '#39ff88',
  normal: '#22d3ee',
  hard: '#ffc83d',
  insane: '#a855f7',
  demon: '#ff2d78',
};

export function difficultyIcon(tier, cx, cy, s) {
  const c = TIER_COLORS[tier] || TIER_COLORS.easy;
  const x = cx - s / 2;
  const y = cy - s / 2;
  const horns = tier === 'insane' || tier === 'demon';
  const hornL = horns ? `<path d="M ${x + s * 0.12} ${y + s * 0.18} L ${x + s * 0.02} ${y - s * 0.12} L ${x + s * 0.3} ${y + s * 0.08} Z" fill="${c}" stroke="#06081c" stroke-width="${s * 0.06}"/>` : '';
  const hornR = horns ? `<path d="M ${x + s * 0.88} ${y + s * 0.18} L ${x + s * 0.98} ${y - s * 0.12} L ${x + s * 0.7} ${y + s * 0.08} Z" fill="${c}" stroke="#06081c" stroke-width="${s * 0.06}"/>` : '';
  const eyeY = y + s * 0.3;
  const mouth = tier === 'easy'
    ? `<path d="M ${x + s * 0.3} ${y + s * 0.68} Q ${cx} ${y + s * 0.82} ${x + s * 0.7} ${y + s * 0.68}" stroke="#06081c" stroke-width="${s * 0.07}" fill="none" stroke-linecap="round"/>`
    : `<line x1="${x + s * 0.3}" y1="${y + s * 0.72}" x2="${x + s * 0.7}" y2="${y + s * 0.72}" stroke="#06081c" stroke-width="${s * 0.07}" stroke-linecap="round"/>`;
  return `<g>
    ${hornL}${hornR}
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.14}" fill="${c}" stroke="#06081c" stroke-width="${s * 0.08}"/>
    <rect x="${x + s * 0.22}" y="${eyeY}" width="${s * 0.14}" height="${s * 0.2}" fill="#06081c"/>
    <rect x="${x + s * 0.64}" y="${eyeY}" width="${s * 0.14}" height="${s * 0.2}" fill="#06081c"/>
    ${mouth}
  </g>`;
}

export function svgDoc(w, h, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${defs}
  </defs>
  ${body}
</svg>
`;
}
