import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const root = path.resolve(import.meta.dirname, '..');
const SRC = path.join(root, 'assets', 'originals');
const OUT = {
  gallery: path.join(root, 'assets', 'img', 'gallery'),
  hero: path.join(root, 'assets', 'img', 'hero'),
  menu: path.join(root, 'assets', 'img', 'menu'),
  misc: path.join(root, 'assets', 'img', 'misc'),
};
Object.values(OUT).forEach(d => fs.mkdirSync(d, { recursive: true }));

if (!fs.existsSync(SRC)) {
  fs.mkdirSync(SRC, { recursive: true });
  const srcFiles = [
    'ad-brochure.jpeg', 'DishDor-Logo.jpg', 'menu.jpeg', 'order-now-image.jpeg',
    'product1.jpeg', 'product2.jpeg', 'product3.jpeg', 'product4.jpeg', 'product5.jpeg',
  ];
  for (const f of srcFiles) {
    const s = path.join(root, f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(SRC, f));
  }
}

const analyze = async (file, abs) => {
  const { data, info } = await sharp(abs).removeAlpha().resize(40, 40, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  let sum = 0, sum2 = 0;
  const vals = [];
  for (let i = 0; i < data.length; i += 3) {
    const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    sum += L; sum2 += L * L; vals.push(L);
  }
  vals.sort((a, b) => a - b);
  const n = vals.length;
  const pct = x => vals[Math.min(n - 1, Math.floor(x * n))].toFixed(0);
  const mean = sum / n;
  const std = Math.sqrt(sum2 / n - mean * mean);
  return { file, w: info.width, h: info.height, aspect: (info.width / info.height).toFixed(3), mean: mean.toFixed(0), std: std.toFixed(0), p5: pct(0.05), p50: pct(0.5), p95: pct(0.95) };
};

const files = fs.readdirSync(SRC).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
const stats = [];
for (const f of files) stats.push(await analyze(f, path.join(SRC, f)));
console.table(stats);

const roles = {
  hero: ['order-now-image', 'product5'],
  menu: ['menu'],
  banner: ['product2'],
};
const roleDir = { hero: OUT.hero, menu: OUT.menu, banner: OUT.misc };

// convert everything to webp in gallery + role folders
const MAX_W = 1600, SM_W = 760;
for (const f of files) {
  if (/dishdor-logo/i.test(f)) continue;
  const base = path.basename(f, path.extname(f)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pipeline = sharp(path.join(SRC, f)).rotate().resize({ width: MAX_W, withoutEnlargement: true });
  const sm = sharp(path.join(SRC, f)).rotate().resize({ width: SM_W, withoutEnlargement: true });
  await pipeline.clone().webp({ quality: 80, effort: 4 }).toFile(path.join(OUT.gallery, `${base}.webp`));
  await sm.clone().webp({ quality: 74, effort: 4 }).toFile(path.join(OUT.gallery, `${base}-sm.webp`));
  for (const [role, names] of Object.entries(roles)) {
    if (names.some(nm => base.startsWith(nm))) {
      await sharp(path.join(SRC, f)).rotate().resize({ width: 1800, withoutEnlargement: true })
        .webp({ quality: 84, effort: 4 }).toFile(path.join(roleDir[role], `${base}.webp`));
    }
  }
}

// menu image: keep full fidelity + also a small version
const menuBase = 'menu';
await sharp(path.join(SRC, 'menu.jpeg')).rotate().resize({ width: 1400, withoutEnlargement: true })
  .webp({ quality: 84, effort: 4 }).toFile(path.join(OUT.menu, `${menuBase}.webp`));
await sharp(path.join(SRC, 'menu.jpeg')).rotate().resize({ width: 560 })
  .webp({ quality: 76, effort: 4 }).toFile(path.join(OUT.menu, `${menuBase}-sm.webp`));

// generate the JS media catalog so adding an image = drop file + rerun
const galleryItems = stats
  .filter(s => !['menu'].some(m => s.file.toLowerCase().startsWith(m)) && s.file.toLowerCase() !== 'dishdor-logo.jpg')
  .map(s => {
    const base = path.basename(s.file, path.extname(s.file)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const portrait = s.aspect < 0.95, landscape = s.aspect > 1.15;
    return { src: `assets/img/gallery/${base}.webp`, sm: `assets/img/gallery/${base}-sm.webp`, w: s.w, h: s.h, cls: landscape ? 'g-wide' : (portrait ? 'g-tall' : 'g-sq') };
  });
const catalog = `/* Auto-generated media catalog. Add a new photo to assets/originals/ then run: node tools/process-media.mjs */
window.DISH_MEDIA = ${JSON.stringify(galleryItems, null, 2)};
`;
fs.mkdirSync(path.join(root, 'assets', 'js'), { recursive: true });
fs.writeFileSync(path.join(root, 'assets', 'js', 'media-catalog.js'), catalog);
console.log('\nwrote', galleryItems.length, 'gallery items -> assets/js/media-catalog.js');