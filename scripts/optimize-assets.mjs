/**
 * Turns your ORIGINAL photos into the responsive AVIF + WebP set the markup expects.
 *
 *   1. Drop originals in assets-src/  (JPG/PNG/WebP, as large as you have)
 *        assets-src/lifestyle-01.jpg   →  public/assets/lifestyle-01-{640,1280,1920}.{avif,webp} + lifestyle-01.webp
 *        assets-src/hero-poster-desktop.jpg, hero-poster-mobile.jpg  (poster frames of your hero videos)
 *   2. npm run assets:optimize
 *
 * Never upscales. Strips metadata. AVIF ≈ 40-50% smaller than JPEG at the same look.
 */
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { extname, basename } from 'node:path';

const SRC = 'assets-src', OUT = 'public/assets';
const WIDTHS = [480, 640, 960, 1280, 1920, 2560];
const files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f));
if (!files.length) { console.log(`No images in ${SRC}/ — add originals first.`); process.exit(0); }

for (const f of files) {
  const name = basename(f, extname(f));
  const img = sharp(`${SRC}/${f}`).rotate();
  const { width } = await img.metadata();
  const sizes = WIDTHS.filter((w) => w <= width);
  if (!sizes.length) sizes.push(width);
  for (const w of sizes) {
    const r = img.clone().resize({ width: w, withoutEnlargement: true });
    await r.clone().avif({ quality: 50, effort: 5 }).toFile(`${OUT}/${name}-${w}.avif`);
    await r.clone().webp({ quality: 76 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  await img.clone().resize({ width: Math.min(width, 1920), withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${OUT}/${name}.webp`);
  console.log(`${f} → ${sizes.join(', ')}px (avif+webp)`);
}
console.log('\nIf you used extra widths, update the srcset lists in src/body.html (they currently list 640/1280/1600 for lifestyle).');
