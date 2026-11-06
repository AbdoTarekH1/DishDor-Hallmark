import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const files = fs.readdirSync(root).filter(f => /\.(jpe?g|png|webp|mp4|mov|heic)$/i.test(f));

for (const f of files) {
  const p = path.join(root, f);
  try {
    const img = sharp(p);
    const meta = await img.metadata();
    const { dominant, vibrant, muted } = await img.stats().then(s => ({
      dominant: s.dominant,
      vibrant: s.channels.map(c => Math.round(c.max)),
      muted: s.channels.map(c => Math.round(c.mean)),
    }));
    // sample corners
    const raw = await img.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { data, info } = raw;
    const px = (x, y) => {
      const i = (y * info.width + x) * info.channels;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const w = info.width, h = info.height;
    console.log(`\n=== ${f}  ${w}x${h} ch=${info.channels} fmt=${meta.format}`);
    console.log('  corners TL/TR/BL/BR:', px(2,2), px(w-3,2), px(2,h-3), px(w-3,h-3));
    console.log('  dominant:', dominant, ' mean:', muted, ' max:', vibrant);
  } catch (e) {
    console.log(`\n=== ${f}  (not an image: ${e.message})`);
  }
}
