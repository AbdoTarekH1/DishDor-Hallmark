import sharp from 'sharp';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const p = path.join(root, process.argv[2] || 'DishDor-Logo.jpg');
const W = 64;

const { data, info } = await sharp(p).resize(W, W, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

// color label buckets
function classify(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const light = (r + g + b) / 3;
  const sat = max - min;
  // white / very light
  if (light > 225 && sat < 40) return { k: '.', c: [255, 255, 255] };
  if (light < 45) return { k: '#', c: [0, 0, 0] };
  // orange: r > g > b, warm
  if (r > g + 25 && g > b + 20 && light > 90) return { k: 'O', c: [230, 140, 40] };
  // dark teal/blue: b >= r, dark, cool
  if (b > r + 10 && light < 110) return { k: 'T', c: [20, 90, 90] };
  // dark green
  if (g >= r && g >= b && light < 95) return { k: 'D', c: [60, 100, 55] };
  // mid green
  if (g >= r && g >= b && light < 160) return { k: 'g', c: [120, 165, 105] };
  // light sage
  if (g >= r && g >= b) return { k: 's', c: [190, 215, 175] };
  if (r > g && g > b) return { k: 'y', c: [200, 170, 90] };
  return { k: '?', c: [150, 150, 150] };
}

const counts = {};
let out = '';
for (let y = 0; y < W; y++) {
  let line = '';
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    const { k, c } = classify(data[i], data[i + 1], data[i + 2]);
    counts[k] = (counts[k] || 0) + 1;
    line += k;
  }
  out += line + '\n';
}
console.log(out);
console.log('counts:', counts);

// exact top colors via histogram on full image
const full = await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const hist = new Map();
for (let i = 0; i < full.data.length; i += 3) {
  const r = Math.round(full.data[i] / 8) * 8, g = Math.round(full.data[i + 1] / 8) * 8, b = Math.round(full.data[i + 2] / 8) * 8;
  const key = `${r},${g},${b}`;
  hist.set(key, (hist.get(key) || 0) + 1);
}
const total = full.data.length / 3;
console.log('\ntop colors:');
[...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => {
  console.log(`  rgb(${k})  ${(100 * v / total).toFixed(2)}%`);
});
