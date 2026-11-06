import sharp from 'sharp';
import path from 'path';
const root = path.resolve(import.meta.dirname, '..');
const file = path.join(root, 'assets/img/logo/dishdor-logo.png');
const { data, info } = await sharp(file).resize(78, 78, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
let out = '';
const counts = {};
for (let y = 0; y < info.height; y++) {
  let line = '';
  for (let x = 0; x < info.width; x++) {
    const a = data[(y * info.width + x) * info.channels + 3];
    let k;
    if (a < 30) k = ' ';
    else if (a < 90) k = '.';
    else if (a < 170) k = '+';
    else {
      const i = (y * info.width + x) * info.channels;
      const r = data[i], g = data[i+1], b = data[i+2];
      const L = (r+g+b)/3;
      if (r > g + 25 && g > b + 20) k = 'O';
      else if (L < 90) k = '#';
      else if (L < 150) k = 'T';
      else k = 'o';
    }
    counts[k] = (counts[k] || 0) + 1;
    line += k;
  }
  out += line + '\n';
}
console.log(out);
console.log(counts);
