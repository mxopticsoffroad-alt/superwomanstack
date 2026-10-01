import { clamp, lerp, smooth } from '../core/env.js';

/**
 * "One scoop" — powder falls into a glass, water swirls, the drink turns pink, particles dissolve.
 *
 * Every frame is a PURE FUNCTION of scroll progress `p` (0→1) plus a little idle time, never an
 * accumulated simulation. That is what lets the animation scrub backwards smoothly and keeps it
 * cheap on iPhone: one 2D canvas, ~150 small arcs, no WebGL.
 */

// deterministic pseudo-random so every load/rewind looks identical
const rng = (() => { let s = 1337; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const N = 150;
const GRAINS = Array.from({ length: N }, (_, i) => ({
  b: 0.125 + (i / N) * 0.42,            // birth (progress)
  ft: 0.055 + rng() * 0.03,             // fall duration
  dx: (rng() - 0.5) * 0.9,              // horizontal drift (× grain spread)
  sx: (rng() - 0.5) * 2,                // start spread across the scoop lip
  r: 1.1 + rng() * 2.1,                 // radius
  a0: rng() * Math.PI * 2,              // swirl phase
  rho: 0.15 + rng() * 0.7,              // swirl radius (fraction of inner half-width)
  pink: rng() > 0.55,
}));

const WATER = [244, 241, 243], PINK = [244, 186, 205], DEEP = [236, 158, 188];
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function createScoopScene(canvas, { mobile }) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(p, t) {
    if (!w) resize();
    ctx.clearRect(0, 0, w, h);

    // ---- geometry ---------------------------------------------------------------------------
    const gh = mobile ? Math.min(h * 0.4, w * 0.95) : Math.min(h * 0.54, w * 0.42);
    const tw = gh * 0.64, bw = gh * 0.47, cx = w / 2;
    const gb = (mobile ? h * 0.72 : h * 0.8), gt = gb - gh;
    const tk = Math.max(3, gh * 0.022);
    const innerBot = gb - tk * 2.4;
    const halfAt = (y, inset) => lerp(bw / 2, tw / 2, clamp((gb - y) / gh)) - inset;

    const glassPath = (inset) => {
      const hwT = tw / 2 - inset, hwB = bw / 2 - inset, bot = inset ? innerBot : gb, r = bw * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx - hwT, gt); ctx.lineTo(cx - hwB, bot - r);
      ctx.quadraticCurveTo(cx - hwB, bot, cx - hwB + r, bot); ctx.lineTo(cx + hwB - r, bot);
      ctx.quadraticCurveTo(cx + hwB, bot, cx + hwB, bot - r); ctx.lineTo(cx + hwT, gt); ctx.closePath();
    };

    // liquid level (water is already in the glass; powder raises it a touch)
    const fillAt = (q) => lerp(0.5, 0.66, smooth(0.12, 0.6, q));
    const surfY = (q) => innerBot - fillAt(q) * (innerBot - gt - gh * 0.06);
    const ySurf = surfY(p);
    const mixT = smooth(0.26, 0.82, p);
    const col = mix(WATER, PINK, mixT), colDeep = mix(WATER, DEEP, mixT);
    const swirlI = smooth(0.22, 0.5, p) * (1 - smooth(0.86, 1, p) * 0.7);

    // ---- scoop pose -------------------------------------------------------------------------
    const R = gh * 0.115;
    const enter = smooth(0, 0.1, p), exit = smooth(0.64, 0.76, p);
    const theta = -(Math.PI * 0.36) * (smooth(0.1, 0.22, p) - smooth(0.52, 0.64, p));
    const scoopPos = (q) => {
      const e = smooth(0, 0.1, q), x = smooth(0.64, 0.76, q);
      return { x: cx + R * 1.1 + gh * 0.02, y: lerp(-R * 3, gt - gh * 0.2, e) - x * gh * 0.5 };
    };
    const lipAt = (q) => {
      const th = -(Math.PI * 0.36) * (smooth(0.1, 0.22, q) - smooth(0.52, 0.64, q));
      const s = scoopPos(q);
      return { x: s.x - R * Math.cos(th), y: s.y - R * Math.sin(th) };
    };

    // ---- floor shadow -----------------------------------------------------------------------
    const sh = ctx.createRadialGradient(cx, gb + 6, 0, cx, gb + 6, gh * 0.55);
    sh.addColorStop(0, 'rgba(155,72,99,.28)'); sh.addColorStop(1, 'rgba(155,72,99,0)');
    ctx.save(); ctx.translate(0, 0); ctx.scale(1, 1);
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(cx, gb + 6, gh * 0.55, gh * 0.09, 0, 0, 7); ctx.fill(); ctx.restore();

    // ---- glass back + liquid ----------------------------------------------------------------
    glassPath(0); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fill();

    ctx.save();
    glassPath(tk); ctx.clip();
    const lg = ctx.createLinearGradient(0, ySurf, 0, innerBot);
    lg.addColorStop(0, rgba(col, 0.82)); lg.addColorStop(1, rgba(colDeep, 0.92));
    ctx.fillStyle = lg; ctx.fillRect(cx - tw, ySurf, tw * 2, innerBot - ySurf + 4);

    // swirl: rotating translucent bands + a vortex dimple
    if (swirlI > 0.01) {
      const ang = p * 16 + t * 0.6, lh = innerBot - ySurf;
      for (let k = 0; k < 4; k++) {
        const cy = ySurf + lh * (0.16 + k * 0.2), rx = halfAt(cy, tk) * (0.86 - k * 0.07), ry = rx * 0.15;
        ctx.strokeStyle = `rgba(255,255,255,${(0.42 - k * 0.07) * swirlI})`;
        ctx.lineWidth = Math.max(1.2, gh * (0.012 - k * 0.0015));
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, ang + k * 1.7, ang + k * 1.7 + Math.PI * 1.15); ctx.stroke();
        ctx.strokeStyle = rgba(colDeep, 0.35 * swirlI);
        ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.4, rx, ry, 0, ang + k * 1.7 + 2.2, ang + k * 1.7 + 3.4); ctx.stroke();
      }
      const vg = ctx.createRadialGradient(cx, ySurf + 4, 0, cx, ySurf + 4, halfAt(ySurf, tk) * 0.9);
      vg.addColorStop(0, rgba(colDeep, 0.5 * swirlI)); vg.addColorStop(1, rgba(colDeep, 0));
      ctx.fillStyle = vg; ctx.fillRect(cx - tw / 2, ySurf - 6, tw, gh * 0.25);
    }

    // dissolving grains (inside the liquid)
    for (const g of GRAINS) {
      const d = (p - g.b - g.ft) / 0.17;
      if (d <= 0 || d >= 1) continue;
      const land = surfY(g.b + g.ft), lh = innerBot - land;
      const a = g.a0 + d * 4.2 + p * 6, rr = halfAt(land, tk) * g.rho * (0.4 + d * 0.6);
      const x = cx + Math.cos(a) * rr + g.dx * gh * 0.03, y = land + 6 + d * lh * (0.15 + g.rho * 0.6) + Math.sin(a) * rr * 0.12;
      ctx.fillStyle = g.pink ? `rgba(247,221,229,${(1 - d) * 0.9})` : `rgba(255,255,255,${(1 - d) * 0.9})`;
      ctx.beginPath(); ctx.arc(x, y, g.r * (1 + d * 1.6), 0, 7); ctx.fill();
    }
    ctx.restore();

    // surface ellipse
    const sw = halfAt(ySurf, tk);
    ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.45), 0.7);
    ctx.beginPath(); ctx.ellipse(cx, ySurf, sw, sw * 0.15, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2; ctx.stroke();

    // ---- falling powder ---------------------------------------------------------------------
    for (const g of GRAINS) {
      const tt = (p - g.b) / g.ft;
      if (tt <= 0 || tt >= 1) continue;
      const lip = lipAt(g.b), land = surfY(g.b + g.ft);
      const x = lip.x + g.sx * R * 0.12 + g.dx * gh * 0.16 * tt - tt * R * 0.4 + Math.sin(tt * 9 + g.a0) * 1.2;
      const y = lerp(lip.y, land, tt * tt);
      ctx.fillStyle = g.pink ? 'rgba(247,221,229,.98)' : 'rgba(255,252,250,.98)';
      ctx.beginPath(); ctx.arc(x, y, g.r * (1 - tt * 0.25), 0, 7); ctx.fill();
    }

    // ---- glass front: edges, highlights, rim ------------------------------------------------
    glassPath(0);
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.stroke();
    glassPath(tk); ctx.strokeStyle = 'rgba(23,20,23,.09)'; ctx.lineWidth = 1; ctx.stroke();
    const hl = ctx.createLinearGradient(cx - tw / 2, 0, cx - tw / 2 + tw * 0.2, 0);
    hl.addColorStop(0, 'rgba(255,255,255,.75)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath(); ctx.moveTo(cx - tw / 2 + 6, gt + gh * 0.04); ctx.lineTo(cx - bw / 2 + 6, gb - gh * 0.12);
    ctx.lineTo(cx - bw / 2 + 6 + gh * 0.05, gb - gh * 0.12); ctx.lineTo(cx - tw / 2 + 6 + gh * 0.06, gt + gh * 0.04); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.beginPath(); ctx.ellipse(cx + tw * 0.36, gt + gh * 0.3, 2.4, gh * 0.1, -0.07, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(cx, gt, tw / 2, tw * 0.055, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(23,20,23,.10)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, gt, tw / 2 - tk, tw * 0.05, 0, 0, 7); ctx.stroke();

    // ---- scoop ------------------------------------------------------------------------------
    const sa = enter * (1 - exit);
    if (sa > 0.01) {
      const s = scoopPos(p), mound = 1 - smooth(0.12, 0.56, p) * 0.96;
      ctx.save(); ctx.globalAlpha = sa; ctx.translate(s.x, s.y); ctx.rotate(theta);
      ctx.fillStyle = '#FFF9F7'; ctx.strokeStyle = 'rgba(23,20,23,.22)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
      // handle
      ctx.beginPath(); ctx.moveTo(R * 0.7, -R * 0.12); ctx.lineTo(R * 0.7 + gh * 0.34, -R * 0.2); ctx.lineTo(R * 0.7 + gh * 0.34, -R * 0.52); ctx.lineTo(R * 0.7, -R * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      // powder mound
      ctx.fillStyle = '#F7DDE5';
      ctx.beginPath(); ctx.moveTo(-R, 0); ctx.quadraticCurveTo(0, -R * 1.5 * mound - 1, R, 0); ctx.closePath(); ctx.fill();
      // bowl
      ctx.fillStyle = '#FFF9F7';
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // ---- finale twinkles --------------------------------------------------------------------
    const tw2 = smooth(0.84, 0.97, p);
    if (tw2 > 0.01) {
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4 + 0.5, rr = gh * (0.42 + (i % 3) * 0.09);
        const x = cx + Math.cos(a) * rr * 0.95, y = gt + gh * 0.45 + Math.sin(a) * rr * 0.8;
        const s = (Math.sin(t * 1.6 + i * 1.3) * 0.5 + 0.5) * tw2, len = 3 + s * 7;
        ctx.strokeStyle = `rgba(194,106,135,${0.55 * s})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x - len, y); ctx.lineTo(x + len, y); ctx.moveTo(x, y - len); ctx.lineTo(x, y + len); ctx.stroke();
      }
    }
  }

  return { draw, resize };
}
