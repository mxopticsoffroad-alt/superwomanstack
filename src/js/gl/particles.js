import * as THREE from './three-lite.js';

function sprite(soft = 0.4) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(soft, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const PALETTE = ['#ffffff', '#ffffff', '#F4BCCB', '#F7CFB9', '#E1D2EC'];

/** Three depth layers of floating "powder" motes (far / mid / near) for parallax. */
export function makeParticles(total) {
  const group = new THREE.Group();
  const layers = [
    { n: Math.round(total * 0.5), size: 0.045, z: [-1.6, -0.4], soft: 0.5, opacity: 0.85, speed: 0.018 },
    { n: Math.round(total * 0.35), size: 0.07, z: [-0.3, 0.7], soft: 0.4, opacity: 0.9, speed: 0.03 },
    { n: Math.round(total * 0.15), size: 0.16, z: [0.9, 1.8], soft: 0.15, opacity: 0.55, speed: 0.045 },
  ].map((L) => {
    const pos = new Float32Array(L.n * 3), col = new Float32Array(L.n * 3), seed = new Float32Array(L.n * 2);
    const c = new THREE.Color();
    for (let i = 0; i < L.n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      pos[i * 3 + 2] = L.z[0] + Math.random() * (L.z[1] - L.z[0]);
      c.set(PALETTE[(Math.random() * PALETTE.length) | 0]);
      col.set([c.r, c.g, c.b], i * 3);
      seed[i * 2] = Math.random() * 6.283; seed[i * 2 + 1] = 0.5 + Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: L.size, map: sprite(L.soft), vertexColors: true, transparent: true, opacity: L.opacity, depthWrite: false, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    group.add(pts);
    return { ...L, pos, seed, geo, mat, pts };
  });

  return {
    object: group,
    update(t, dt, pointer) {
      for (const L of layers) {
        const p = L.pos;
        for (let i = 0; i < L.n; i++) {
          const s = L.seed[i * 2], k = L.seed[i * 2 + 1];
          p[i * 3 + 1] += L.speed * k * dt * 6;
          p[i * 3] += Math.sin(t * 0.4 * k + s) * 0.0012;
          if (p[i * 3 + 1] > 2.2) p[i * 3 + 1] = -2.2;
        }
        L.geo.attributes.position.needsUpdate = true;
        L.pts.position.x = pointer.x * L.z[1] * -0.12;
        L.pts.position.y = pointer.y * L.z[1] * -0.08;
      }
    },
    dispose() { layers.forEach((L) => { L.geo.dispose(); L.mat.map?.dispose(); L.mat.dispose(); }); },
  };
}
