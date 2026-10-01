import * as THREE from './three-lite.js';
import { PRODUCT_HEIGHT } from './pouch.js';

/**
 * Tries to load the real product model. Returns null (→ procedural placeholder) when the file is
 * missing, so the page works before the GLB exists. Static hosts often answer 404s with index.html,
 * so we validate the response rather than trusting `ok`.
 *
 * Recommended export: GLB, < 2 MB, Meshopt-compressed (gltf-transform / gltfpack), PBR materials,
 * origin at the model's centre, +Y up, front facing +Z.  See docs/ASSETS.md.
 */
export async function tryLoadModel(url) {
  try {
    const head = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    const type = head.headers.get('content-type') || '';
    if (!head.ok || /text\/html/.test(type)) return null;

    const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
    ]);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    const root = gltf.scene;

    // Normalise: centre on origin, scale to PRODUCT_HEIGHT.
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const wrap = new THREE.Group();
    root.position.sub(centre);
    wrap.add(root);
    wrap.scale.setScalar(PRODUCT_HEIGHT / (size.y || 1));
    root.traverse((o) => { if (o.isMesh && o.material?.map) o.material.map.anisotropy = 8; });

    return { object: wrap, dispose() { root.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); } };
  } catch (err) {
    console.warn('[sws] GLB not loaded, using placeholder pouch:', err?.message || err);
    return null;
  }
}
