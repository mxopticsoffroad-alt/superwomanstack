/**
 * Generates clearly-synthetic placeholder media so the site runs end-to-end before real assets exist.
 * Everything written here is REPLACED by dropping real files at the same names (see docs/ASSETS.md).
 *
 *   npm run assets
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = 'public/assets';
mkdirSync(OUT, { recursive: true });

/** Soft "window light" scene, tinted per-variant. Pure gradients: obviously not real photography. */
const scene = (w, h, [a, b, c, d], beam = 0.5) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>
    </linearGradient>
    <radialGradient id="sun" cx=".78" cy=".18" r=".55">
      <stop offset="0" stop-color="#fffdf9" stop-opacity=".95"/><stop offset="1" stop-color="#fffdf9" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow" cx=".25" cy=".85" r=".6">
      <stop offset="0" stop-color="${d}" stop-opacity=".9"/><stop offset="1" stop-color="${d}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="${beam}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="${Math.round(w / 60)}"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .45 0 0 0 0 .45 0 0 0 .07 0"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#sun)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <g filter="url(#soft)" opacity=".9">
    <polygon points="${w * 0.55},0 ${w * 0.78},0 ${w * 0.36},${h} ${w * 0.1},${h}" fill="url(#beam)"/>
    <polygon points="${w * 0.8},0 ${w * 0.9},0 ${w * 0.62},${h} ${w * 0.5},${h}" fill="url(#beam)" opacity=".6"/>
  </g>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;

const tints = {
  hero: ['#FFF3F0', '#F7DDE5', '#EBD9E6', '#F9D9C9'],
  l1: ['#FFF6F1', '#F9E0D0', '#F2D5DE', '#F7DDE5'],
  l2: ['#FCEEF2', '#F3D3DF', '#E4D6EC', '#F4E8DF'],
  l3: ['#F4E8DF', '#F6DCD2', '#F7DDE5', '#E9DFEE'],
};

const encode = async (svg, name, widths, ratio) => {
  const base = sharp(Buffer.from(svg));
  for (const w of widths) {
    const h = Math.round(w * ratio);
    const img = base.clone().resize(w, h, { fit: 'cover' });
    await img.clone().webp({ quality: 72 }).toFile(`${OUT}/${name}-${w}.webp`);
    await img.clone().avif({ quality: 48, effort: 4 }).toFile(`${OUT}/${name}-${w}.avif`);
  }
  // Canonical un-suffixed file the brief asks for (largest size).
  const big = widths[widths.length - 1];
  await base.clone().resize(big, Math.round(big * ratio)).webp({ quality: 78 }).toFile(`${OUT}/${name}.webp`);
};

// Hero posters (LCP fallback while the video loads) — portrait for mobile
await encode(scene(1920, 1080, tints.hero, 0.55), 'hero-poster-desktop', [960, 1920], 1080 / 1920);
await encode(scene(900, 1600, tints.hero, 0.5), 'hero-poster-mobile', [450, 900], 1600 / 900);

// Lifestyle stills (4:5 portrait cards)
await encode(scene(1600, 2000, tints.l1, 0.5), 'lifestyle-01', [640, 1280, 1600], 1.25);
await encode(scene(1600, 2000, tints.l2, 0.45), 'lifestyle-02', [640, 1280, 1600], 1.25);
await encode(scene(1600, 2000, tints.l3, 0.5), 'lifestyle-03', [640, 1280, 1600], 1.25);

// powder-particles.webp — transparent soft dust/bokeh layer
{
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const dots = Array.from({ length: 70 }, () => {
    const r = 3 + rnd() ** 2.4 * 38;
    const col = rnd() > 0.35 ? '#ffffff' : rnd() > 0.5 ? '#F7DDE5' : '#F9E1D3';
    return `<circle cx="${(rnd() * 1600).toFixed(0)}" cy="${(rnd() * 1600).toFixed(0)}" r="${r.toFixed(1)}" fill="${col}" opacity="${(0.25 + rnd() * 0.6).toFixed(2)}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1600"><defs><filter id="b"><feGaussianBlur stdDeviation="1.6"/></filter></defs><g filter="url(#b)">${dots}</g></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 80, alphaQuality: 90 }).toFile(`${OUT}/powder-particles.webp`);
}

// Placeholder videos: moving soft gradients (H.264, no audio, faststart). Real footage replaces these.
const vid = (file, w, h, secs, c0, c1, c2) =>
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `gradients=s=${w}x${h}:d=${secs}:r=24:c0=${c0}:c1=${c1}:c2=${c2}:x0=0:y0=0:x1=${w}:y1=${h}:speed=0.04:nb_colors=3`,
    '-vf', 'gblur=sigma=40,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-movflags', '+faststart', '-an',
    `${OUT}/${file}`,
  ]);
vid('hero-desktop.mp4', 1280, 720, 8, '0xFFF3F0', '0xF7DDE5', '0xE9DFEE');
vid('hero-mobile.mp4', 540, 960, 8, '0xFFF3F0', '0xF7DDE5', '0xF9E1D3');
vid('lifestyle-video.mp4', 720, 900, 8, '0xF9E1D3', '0xF2D5DE', '0xFFF6F1');

writeFileSync(`${OUT}/README.txt`,
`PLACEHOLDER MEDIA — generated by scripts/make-placeholders.mjs
Replace any file here with the real asset using the SAME filename. See docs/ASSETS.md.

superwoman-product.glb  <- NOT generated. Drop your 3D model here. Until then a procedural pouch renders.
`);
console.log('placeholders written to', OUT);
