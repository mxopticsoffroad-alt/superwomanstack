import * as THREE from './three-lite.js';

/**
 * Procedural pouch artwork. This is deliberately labelled PLACEHOLDER — it disappears the moment
 * /assets/superwoman-product.glb exists. Painted with canvas so there are zero image requests.
 */
const W = 1024, H = 1536;

function blob(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export async function paintLabels() {
  try { await Promise.all([document.fonts.load('400 120px "Instrument Serif"'), document.fonts.load('italic 400 120px "Instrument Serif"'), document.fonts.load('600 40px "Hanken Grotesk Variable"')]); } catch { /* fall back to system serif */ }

  const front = document.createElement('canvas'); front.width = W; front.height = H;
  const f = front.getContext('2d');
  const bg = f.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FFF9F7'); bg.addColorStop(0.5, '#F7DDE5'); bg.addColorStop(1, '#E9DFEE');
  f.fillStyle = bg; f.fillRect(0, 0, W, H);
  blob(f, 220, 260, 520, 'rgba(255,255,255,0.9)');
  blob(f, 840, 1180, 560, 'rgba(249,225,211,0.85)');
  blob(f, 760, 420, 380, 'rgba(233,223,238,0.8)');

  // top crimp seal
  f.fillStyle = 'rgba(23,20,23,0.05)'; f.fillRect(0, 0, W, 108);
  f.strokeStyle = 'rgba(23,20,23,0.13)'; f.lineWidth = 2;
  for (let y = 14; y < 104; y += 9) { f.beginPath(); f.moveTo(0, y); f.lineTo(W, y); f.stroke(); }
  f.fillStyle = 'rgba(23,20,23,0.18)'; f.fillRect(0, 108, W, 3);
  // tear notch
  f.fillStyle = 'rgba(23,20,23,0.4)'; f.beginPath(); f.moveTo(0, 150); f.lineTo(34, 160); f.lineTo(0, 170); f.fill();

  f.fillStyle = '#171417'; f.textAlign = 'center';
  f.font = '400 118px "Instrument Serif", serif';
  if ('letterSpacing' in f) f.letterSpacing = '14px';
  f.fillText('SUPERWOMAN', W / 2 + 7, 560);
  if ('letterSpacing' in f) f.letterSpacing = '0px';
  f.font = 'italic 400 300px "Instrument Serif", serif';
  f.fillStyle = '#9B4863';
  f.fillText('Stack', W / 2, 810);

  f.fillStyle = '#171417';
  f.font = '600 34px "Hanken Grotesk Variable", sans-serif';
  if ('letterSpacing' in f) f.letterSpacing = '10px';
  f.fillText('DAILY WELLNESS DRINK', W / 2 + 5, 940);
  f.strokeStyle = 'rgba(23,20,23,0.35)'; f.lineWidth = 2;
  f.beginPath(); f.moveTo(W / 2 - 90, 1000); f.lineTo(W / 2 + 90, 1000); f.stroke();
  f.font = '500 26px "Hanken Grotesk Variable", sans-serif';
  f.fillStyle = 'rgba(23,20,23,0.6)';
  f.fillText('[ PLACEHOLDER PACK ]', W / 2 + 4, 1080);
  f.fillText('REPLACE WITH superwoman-product.glb', W / 2 + 4, 1122);
  if ('letterSpacing' in f) f.letterSpacing = '0px';
  f.font = '500 24px "Hanken Grotesk Variable", sans-serif';
  f.fillText('NET WT [XX] · [XX] SERVINGS', W / 2, 1420);

  const back = document.createElement('canvas'); back.width = W; back.height = H;
  const b = back.getContext('2d');
  const bb = b.createLinearGradient(0, 0, W, H);
  bb.addColorStop(0, '#F7DDE5'); bb.addColorStop(1, '#FFF9F7');
  b.fillStyle = bb; b.fillRect(0, 0, W, H);
  b.fillStyle = 'rgba(23,20,23,0.05)'; b.fillRect(0, 0, W, 108);
  b.fillStyle = '#171417'; b.textAlign = 'center';
  b.font = 'italic 400 92px "Instrument Serif", serif'; b.fillText('Supplement Facts', W / 2, 420);
  b.font = '500 30px "Hanken Grotesk Variable", sans-serif'; b.fillStyle = 'rgba(23,20,23,0.55)';
  b.fillText('[ PANEL PENDING ]', W / 2, 500);
  b.strokeStyle = 'rgba(23,20,23,0.25)'; b.lineWidth = 3; b.strokeRect(200, 560, W - 400, 640);

  const tex = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  };
  return { front: tex(front), back: tex(back) };
}
