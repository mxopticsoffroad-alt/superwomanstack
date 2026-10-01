import * as THREE from './three-lite.js';
import { paintLabels } from './label.js';

/** Pouch height in world units. Every product (procedural or GLB) is normalised to this. */
export const PRODUCT_HEIGHT = 1.5;

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** One face of the stand-up pouch: a plane displaced into a soft pillow with sealed edges. */
function face(seg) {
  const w = 1.0, h = PRODUCT_HEIGHT, depth = 0.34;
  const g = new THREE.PlaneGeometry(w, h, seg.x, seg.y);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const u = x / (w / 2);                  // -1..1
    const v = (y + h / 2) / h;              // 0 bottom … 1 top
    const body = smoothstep(0.0, 0.07, v) * (1 - smoothstep(0.82, 0.93, v));
    const belly = 0.82 + 0.18 * Math.sin(Math.min(1, v / 0.85) * Math.PI * 0.9);
    const z = depth * body * belly * Math.pow(Math.max(0, 1 - u * u), 0.62);
    // pinch the sides slightly toward the top seal
    p.setX(i, x * (1 - 0.045 * smoothstep(0.7, 0.95, v)));
    p.setZ(i, z);
  }
  g.computeVertexNormals();
  return g;
}

export async function buildPouch({ mobile }) {
  const { front, back } = await paintLabels();
  const seg = mobile ? { x: 28, y: 44 } : { x: 44, y: 70 };

  const common = { roughness: 0.34, metalness: 0.06, clearcoat: 0.55, clearcoatRoughness: 0.3, envMapIntensity: 1.0 };
  const frontMat = new THREE.MeshPhysicalMaterial({ ...common, map: front });
  const backMat = new THREE.MeshPhysicalMaterial({ ...common, map: back });

  const group = new THREE.Group();
  const fm = new THREE.Mesh(face(seg), frontMat);
  const bm = new THREE.Mesh(face(seg), backMat);
  bm.rotation.y = Math.PI; // same shape, turned around: back artwork reads correctly
  group.add(fm, bm);

  return {
    object: group,
    dispose() { [fm, bm].forEach((m) => m.geometry.dispose()); [frontMat, backMat].forEach((m) => m.dispose()); front.dispose(); back.dispose(); },
  };
}
