// Renders conf/github-profile-3d-contrib.json contribPatterns as flat pixel
// grids so the block textures can be eyeballed before pushing to Actions.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conf = JSON.parse(fs.readFileSync(path.join(ROOT, 'conf', 'github-profile-3d-contrib.json'), 'utf8'));

const SCALE = 10;
const LEVELS = ['L0 none', 'L1 first', 'L2 second', 'L3 third', 'L4 fourth'];

function renderPattern(pat, ox, oy) {
  const w = pat.width;
  const rows = pat.bitmap.map((r) => (typeof r === 'string' ? BigInt(r) : BigInt(r)));
  const bg = pat.backgroundColor || '#444';
  const fg = pat.foregroundColor || '#ccc';
  let out = `<rect x="${ox}" y="${oy}" width="${w * SCALE}" height="${rows.length * SCALE}" fill="${bg}" stroke="#333"/>`;
  rows.forEach((bits, ry) => {
    for (let c = 0; c < w; c++) {
      if ((bits >> BigInt(c)) & 1n) {
        out += `<rect x="${ox + c * SCALE}" y="${oy + ry * SCALE}" width="${SCALE}" height="${SCALE}" fill="${fg}"/>`;
      }
    }
  });
  return out;
}

let body = `<rect width="100%" height="100%" fill="#0a0f24"/>`;
conf.contribPatterns.forEach((p, i) => {
  const x = 30 + i * 380;
  body += `<text x="${x}" y="30" fill="#8a93b8" font-size="16" font-family="monospace">${LEVELS[i]}</text>`;
  body += renderPattern(p.top, x, 50);
  body += `<text x="${x}" y="${50 + 16 * SCALE + 24}" fill="#8a93b8" font-size="12" font-family="monospace">top</text>`;
  body += renderPattern(p.left, x, 50 + 16 * SCALE + 50);
  body += `<text x="${x}" y="${50 + 32 * SCALE + 74}" fill="#8a93b8" font-size="12" font-family="monospace">side</text>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1930" height="560">${body}</svg>`;
fs.writeFileSync(path.join(ROOT, 'pattern-preview.svg'), svg);
console.log('wrote pattern-preview.svg');
