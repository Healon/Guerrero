// ============================================================
// 零依賴 PWA icon 產生器：pixel-string → PNG（內建 zlib）
// 執行：node scripts/gen-icons.mjs
// ============================================================
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');

const PAL = {
  h: [0x1c, 0x18, 0x26], H: [0x33, 0x2c, 0x48],
  P: [0x5c, 0x2f, 0xb0], p: [0x8a, 0x4d, 0xf2],
  w: [0xf2, 0xea, 0xd8], W: [0xff, 0xff, 0xff],
  b: [0xc8, 0xbd, 0xa0], k: [0x12, 0x10, 0x1c]
};
const BG = [0x06, 0x05, 0x0c];

// 禮帽骷髏 16×16
const ART = [
  '................',
  '....hhhhhhh.....',
  '....hHHhhhh.....',
  '....hHhhhhh.....',
  '....PpPPPPP.....',
  '..hhhhhhhhhhh...',
  '....wwwwwww.....',
  '...wwwwwwwww....',
  '...wkkwwwkkw....',
  '...wkWwwwkWw....',
  '...wwwwkwwww....',
  '...bwbwbwbww....',
  '....bbbbbbb.....',
  '................',
  '................',
  '................'
];

// ---- 最小 PNG 寫入器 ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function pngFromRGBA(rgba, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderIcon(size, scale) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = BG[0]; rgba[i * 4 + 1] = BG[1]; rgba[i * 4 + 2] = BG[2]; rgba[i * 4 + 3] = 255;
  }
  const artW = 16 * scale;
  const off = Math.floor((size - artW) / 2);
  for (let ay = 0; ay < 16; ay++) {
    for (let ax = 0; ax < 16; ax++) {
      const c = PAL[ART[ay][ax]];
      if (!c) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = off + ax * scale + dx;
          const py = off + ay * scale + dy;
          const idx = (py * size + px) * 4;
          rgba[idx] = c[0]; rgba[idx + 1] = c[1]; rgba[idx + 2] = c[2]; rgba[idx + 3] = 255;
        }
      }
    }
  }
  return pngFromRGBA(rgba, size, size);
}

mkdirSync(OUT, { recursive: true });
const jobs = [
  ['icon-192.png', 192, 11],
  ['icon-512.png', 512, 30],
  ['apple-touch-icon.png', 180, 10],
  ['favicon.png', 32, 2]
];
for (const [file, size, scale] of jobs) {
  writeFileSync(join(OUT, file), renderIcon(size, scale));
  console.log(`✓ ${file} (${size}x${size})`);
}
