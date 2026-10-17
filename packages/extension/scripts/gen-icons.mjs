// Generates public/icons/icon-{16,32,48,128}.png from an inline SVG.
// Uses `sharp` when available; otherwise writes a minimal valid solid PNG so
// the build never blocks on icon tooling.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const SIZES = [16, 32, 48, 128];

// Teal rounded square with a white rising "cost bar" glyph.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#0f766e"/>
  <rect x="24" y="72" width="18" height="32" rx="4" fill="#ffffff" opacity=".85"/>
  <rect x="55" y="52" width="18" height="52" rx="4" fill="#ffffff" opacity=".92"/>
  <rect x="86" y="28" width="18" height="76" rx="4" fill="#ffffff"/>
  <circle cx="95" cy="20" r="9" fill="#f87171"/>
</svg>`;

const force = process.argv.includes('--force');
if (!force && SIZES.every((s) => existsSync(join(outDir, `icon-${s}.png`)))) {
  console.log('[icons] already present, skipping (use --force to regenerate)');
  process.exit(0);
}

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('[icons] sharp not available, writing solid placeholder PNGs');
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Minimal solid-colour RGBA PNG. */
function solidPng(size, [r, g, b]) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = Buffer.alloc(1 + size * 4);
  for (let x = 0; x < size; x++) row.set([r, g, b, 255], 1 + x * 4);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of SIZES) {
  const file = join(outDir, `icon-${size}.png`);
  if (sharp) {
    const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
    writeFileSync(file, png);
  } else {
    writeFileSync(file, solidPng(size, [15, 118, 110]));
  }
  console.log(`[icons] wrote ${file}`);
}
