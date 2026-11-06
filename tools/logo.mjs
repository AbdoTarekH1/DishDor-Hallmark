import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const root = path.resolve(import.meta.dirname, '..');
const SRC = path.join(root, 'DishDor-Logo.jpg');
const OUT = path.join(root, 'assets', 'img', 'logo');
fs.mkdirSync(OUT, { recursive: true });

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const idx = (x, y) => (y * W + x) * C;
const at = i => [data[i], data[i + 1], data[i + 2]];

const dist = (a, b) => {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

// 1) flood-fill from the borders with a LOCAL tolerance so the smooth
//    sage->green background gradient is consumed while the mark's hard edges stop it
const bg = new Uint8Array(W * H);
const queue = [];
const push = (x, y) => {
  const p = y * W + x;
  if (bg[p]) return;
  bg[p] = 1;
  queue.push(p);
};
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }

const T = 26;
let head = 0;
while (head < queue.length) {
  const p = queue[head++];
  const x = p % W, y = (p / W) | 0;
  const c = at(p * C);
  const nb = [];
  if (x > 0) nb.push(p - 1);
  if (x < W - 1) nb.push(p + 1);
  if (y > 0) nb.push(p - W);
  if (y < H - 1) nb.push(p + W);
  for (const q of nb) {
    if (bg[q]) continue;
    if (dist(c, at(q * C)) < T) push(q % W, (q / W) | 0);
  }
}

let bgCount = 0;
for (let i = 0; i < bg.length; i++) if (bg[i]) bgCount++;
console.log(`background pixels: ${bgCount} / ${W * H} (${(100 * bgCount / (W * H)).toFixed(1)}%)`);

// 2) estimate the local background colour next to every foreground pixel
const nearBg = new Uint8Array(W * H);       // within 3px of background
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (bg[p]) continue;
    let hit = false;
    for (let dy = -3; dy <= 3 && !hit; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (bg[ny * W + nx]) { hit = true; break; }
      }
    }
    if (hit) nearBg[p] = 1;
  }
}

// 3) build alpha: transparent on background, feathered on the anti-aliased rim, solid inside
const out = Buffer.alloc(W * H * 4);
let minx = W, miny = H, maxx = 0, maxy = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    const i = p * C, o = p * 4;
    let alpha = 255;
    if (bg[p]) alpha = 0;
    else if (nearBg[p]) {
      // colour distance to the nearest background pixel = how much of this pixel is "ink"
      let best = Infinity, bc = null;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const q = ny * W + nx;
          if (!bg[q]) continue;
          const sd = dx * dx + dy * dy;
          if (sd < best) { best = sd; bc = at(q * C); }
        }
      }
      const d = bc ? dist(at(i), bc) : 999;
      // sage -> teal ink spans ~219 in RGB space; a pixel that is x% ink sits
      // x% of that distance away from its background neighbour
      alpha = Math.max(0, Math.min(255, Math.round((d / 219) * 255)));
    }
    out[o] = data[i];
    out[o + 1] = data[i + 1];
    out[o + 2] = data[i + 2];
    out[o + 3] = alpha;
    if (alpha > 40) {
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
  }
}

const pad = 4;
minx = Math.max(0, minx - pad); miny = Math.max(0, miny - pad);
maxx = Math.min(W - 1, maxx + pad); maxy = Math.min(H - 1, maxy + pad);
const cw = maxx - minx + 1, ch = maxy - miny + 1;
console.log(`ink bbox: ${cw}x${ch} @ ${minx},${miny}`);

const base = sharp(out, { raw: { width: W, height: H, channels: 4 } });
await base.clone().png({ compressionLevel: 9 }).toFile(path.join(OUT, 'dishdor-logo.png'));
await base.clone().extract({ left: minx, top: miny, width: cw, height: ch })
  .png({ compressionLevel: 9 }).toFile(path.join(OUT, 'dishdor-logo-trimmed.png'));
await base.clone().extract({ left: minx, top: miny, width: cw, height: ch })
  .resize({ width: 320 }).webp({ quality: 92 }).toFile(path.join(OUT, 'dishdor-logo-trimmed.webp'));
await base.clone().resize({ width: 320 }).webp({ quality: 92 }).toFile(path.join(OUT, 'dishdor-logo.webp'));

// favicon: keep the original square tile (mark reads best as a solid green badge)
for (const s of [512, 192, 48, 32]) {
  await sharp(SRC).resize(s, s).png().toFile(path.join(OUT, `favicon-${s}.png`));
}

console.log('logo written to assets/img/logo/');
