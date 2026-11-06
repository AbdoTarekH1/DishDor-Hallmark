import sharp from 'sharp';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const p = path.join(root, 'DishDor-Logo.jpg');
const { data, info } = await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i+1], data[i+2]]; };

const buckets = new Map();
for (let i = 0; i < data.length; i += 3) {
  const r = data[i], g = data[i+1], b = data[i+2];
  const key = `${Math.round(r/6)*6},${Math.round(g/6)*6},${Math.round(b/6)*6}`;
  const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
  e.n++; e.r += r; e.g += g; e.b += b; buckets.set(key, e);
}
const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
console.log('TOP CLUSTERS (avg exact):');
sorted.slice(0, 20).forEach(e => {
  const c = { r: e.r/e.n, g: e.g/e.n, b: e.b/e.n };
  const L = (0.2126*c.r + 0.7152*c.g + 0.0722*c.b);
  console.log(`  ${hex(c)}  n=${e.n}  L=${L.toFixed(0)}`);
});

// teal-ish dark cool pixels (the mark ink)
const cool = sorted.filter(e => {
  const r = e.r/e.n, g = e.g/e.n, b = e.b/e.n;
  return (r+g+b)/3 < 130 && b + 25 >= r && g >= b - 40 && e.n > 200;
});
console.log('\nTEAL/INK candidates:');
cool.slice(0, 6).forEach(e => console.log('  ' + hex({ r: e.r/e.n, g: e.g/e.n, b: e.b/e.n }) + '  n=' + e.n));

const orange = sorted.filter(e => {
  const r = e.r/e.n, g = e.g/e.n, b = e.b/e.n;
  return r > g + 30 && g > b + 25 && e.n > 40;
});
console.log('\nORANGE candidates:');
orange.slice(0, 8).forEach(e => console.log('  ' + hex({ r: e.r/e.n, g: e.g/e.n, b: e.b/e.n }) + '  n=' + e.n));

// luminance of the ink vs sage bg for contrast check
function lum(c) {
  const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]);
}
function ratio(a, b) { const l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b)); return (l1+0.05)/(l2+0.05); }
const sage = px(5, 5), sageBR = px(W-6, H-6);
console.log('\nsage TL:', sage, ' sage BR:', sageBR);

// ---- emblem high-res map (crop) ----
console.log('\n\nEMBLEM / lower mark, cols 17-48 rows 30-48 -> 62 wide\n');
await sharp(p)
  .extract({ left: 60, top: 118, width: 150, height: 76 })
  .resize(74, 38, { fit: 'fill' })
  .removeAlpha().raw().toBuffer({ resolveWithObject: true })
  .then(({ data: d2, info: i2 }) => {
    for (let y = 0; y < i2.height; y++) {
      let line = '';
      for (let x = 0; x < i2.width; x++) {
        const i = (y * i2.width + x) * i2.channels;
        const r = d2[i], g = d2[i+1], b = d2[i+2];
        const L = (r + g + b) / 3;
        if (r > g + 25 && g > b + 20) line += 'O';
        else if (L < 70) line += '#';
        else if (L < 120) line += '+';
        else if (L < 165) line += '-';
        else if (L < 205) line += '.';
        else line += ' ';
      }
      console.log(line);
    }
  });
