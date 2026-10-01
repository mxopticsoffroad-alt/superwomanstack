import * as THREE from './three-lite.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from '../core/motion.js';
import { clamp, lerp, smooth } from '../core/env.js';
import { buildPouch, PRODUCT_HEIGHT } from './pouch.js';
import { tryLoadModel } from './model.js';
import { makeParticles } from './particles.js';

/**
 * One persistent WebGL canvas for the whole page. The product's pose is a pure function of the
 * scroll state written by the sections (state.hero / state.stage / state.shop), so scrolling back
 * up always rewinds correctly. Rendering is skipped entirely whenever the product is invisible.
 *
 * Pose units: `h` = product height as a fraction of viewport height; x/y in -1..1 screen space.
 */
export async function createExperience({ container, canvas, state, cfg, device, anchorEl, heroSlotEl }) {
  const { mobile, lowPower } = device;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !lowPower, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NoToneMapping;   // ACES desaturates pastels; the brand palette must stay true
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const CAM_Z = 6;
  camera.position.set(0, 0, CAM_Z);

  // --- lighting: soft studio env + warm key + pink rim -------------------------------------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.5;
  const key = new THREE.DirectionalLight(0xfff1e8, 0.9); key.position.set(2.5, 3.2, 4);
  const rim = new THREE.DirectionalLight(0xffc4d6, 1.4); rim.position.set(-3, 1.2, -2.5);
  const fill = new THREE.HemisphereLight(0xffffff, 0xf7dde5, 0.55);
  scene.add(key, rim, fill);

  // --- product -------------------------------------------------------------------------------
  const product = new THREE.Group();   // pose target (position/scale/rotation)
  const pivot = new THREE.Group();     // idle sway / pointer
  product.add(pivot);
  scene.add(product);

  const glb = await tryLoadModel(new URL(cfg.modelUrl, cfg.assetBase || document.baseURI).href);
  const loaded = glb || (await buildPouch({ mobile }));
  const usingPlaceholder = !glb;
  pivot.add(loaded.object);
  container.dataset.model = usingPlaceholder ? 'placeholder' : 'glb';

  // soft contact shadow
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const sg = sc.getContext('2d');
  const rg = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(155,72,99,.38)'); rg.addColorStop(1, 'rgba(155,72,99,0)');
  sg.fillStyle = rg; sg.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.scale.set(1.5, 0.22, 1);
  product.add(shadow);

  const particles = makeParticles(mobile ? 70 : lowPower ? 90 : 190);
  scene.add(particles.object);

  // --- sizing --------------------------------------------------------------------------------
  let vw = 1, vh = 1, dpr = 1;
  const resize = () => {
    vw = container.clientWidth || window.innerWidth; vh = container.clientHeight || window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  // --- input: pointer parallax (desktop), scroll-velocity sway (touch), drag-to-spin (shop) ---
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => { if (e.pointerType === 'mouse') { pointer.tx = (e.clientX / window.innerWidth) * 2 - 1; pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1); } };
  window.addEventListener('pointermove', onMove, { passive: true });

  const drag = { on: false, x: 0, rot: 0, vel: 0 };
  if (anchorEl) {
    anchorEl.style.touchAction = 'pan-y';
    anchorEl.style.cursor = 'grab';
    anchorEl.addEventListener('pointerdown', (e) => { drag.on = true; drag.x = e.clientX; drag.vel = 0; anchorEl.setPointerCapture?.(e.pointerId); anchorEl.style.cursor = 'grabbing'; });
    anchorEl.addEventListener('pointermove', (e) => { if (!drag.on) return; const dx = e.clientX - drag.x; drag.x = e.clientX; drag.rot += dx * 0.012; drag.vel = dx * 0.012; });
    const end = () => { drag.on = false; anchorEl.style.cursor = 'grab'; };
    anchorEl.addEventListener('pointerup', end); anchorEl.addEventListener('pointercancel', end);
  }

  // --- pose ----------------------------------------------------------------------------------
  const pose = { x: 0, y: 0, h: 0.5, rotY: 0, rotX: 0, opacity: 0, fov: 28 };

  // Hero pose is measured from the layout (the free box under the headline) so it fits every viewport.
  const hero = { x: 0, y: -0.2, h: 0.5 };
  const heroEl = heroSlotEl?.closest('[data-hero]');
  const measureHero = () => {
    if (!heroSlotEl) return;
    const r = heroSlotEl.getBoundingClientRect(), top = heroEl.getBoundingClientRect().top;
    const ww = window.innerWidth, wh = window.innerHeight;
    hero.x = ((r.left + r.width / 2) / ww) * 2 - 1;
    hero.y = -((((r.top - top) + r.height / 2) / wh) * 2 - 1);
    hero.h = clamp((r.height * (mobile ? 0.94 : 1.2)) / wh, mobile ? 0.2 : 0.3, mobile ? 0.42 : 0.64);
  };
  const ro2 = new ResizeObserver(measureHero); if (heroSlotEl) ro2.observe(heroSlotEl);
  addEventListener('resize', measureHero); measureHero();
  const TAU = Math.PI * 2;

  function computePose(t) {
    // Hero → stage: the product grows slightly and starts turning.
    const hp = clamp(state.hero), sp = clamp(state.stage);
    const e = smooth(0, 1, hp);
    const centreH = mobile ? 0.4 : 0.62;
    let h = lerp(hero.h, centreH, e);
    let x = lerp(hero.x, 0, e), y = lerp(hero.y, mobile ? 0.1 : -0.02, e);
    let rotY = lerp(Math.sin(t * 0.5) * 0.12, 0.35, e);
    let rotX = 0, fov = 28, opacity = 1;

    // Stage: one full revolution with a gentle camera dolly + tilt.
    if (sp > 0) {
      rotY = 0.35 + sp * TAU * 1.0;
      rotX = Math.sin(sp * TAU) * 0.13;
      fov = 28 - 7 * Math.sin(sp * Math.PI);
      h *= 1 + 0.08 * Math.sin(sp * Math.PI);
      x = mobile ? 0 : Math.sin(sp * TAU) * 0.05;
      const out = smooth(0.93, 1, sp);       // leave toward the "One scoop" section
      opacity = 1 - out; y += out * 0.12; h *= 1 - out * 0.18;
    }

    // Shop: glue the product to its anchor element and let the shopper spin it.
    if (state.shop > 0 && anchorEl) {
      const r = anchorEl.getBoundingClientRect();
      const ww = window.innerWidth, wh = window.innerHeight;
      const s = smooth(0, 0.3, state.shop);
      x = ((r.left + r.width / 2) / ww) * 2 - 1;
      y = -(((r.top + r.height / 2) / wh) * 2 - 1);
      h = (r.height * (mobile ? 0.7 : 0.66)) / wh;
      rotY = t * 0.32 + drag.rot; rotX = 0; fov = 26;
      opacity = r.bottom > 0 && r.top < wh ? s : 0;   // off-screen anchor → stop rendering
    }
    return { x, y, h, rotY, rotX, fov, opacity };
  }

  let t = 0, first = true, running = false, lastScroll = 0, sway = 0;
  const target = new THREE.Vector3();
  const tick = (_, dtMs) => {
    const dt = Math.min(0.05, (dtMs || 16) / 1000);
    t += dt;
    const p = computePose(t);

    // damp toward target (scroll-scrubbed feel without jitter)
    const k = first ? 1 : 1 - Math.pow(0.0001, dt);
    for (const key of ['x', 'y', 'h', 'rotY', 'rotX', 'fov', 'opacity']) pose[key] = lerp(pose[key], p[key], key === 'opacity' ? 1 : k);
    first = false;

    const visible = pose.opacity > 0.01;
    canvas.style.opacity = visible ? pose.opacity.toFixed(3) : '0';   // cheapest possible fade: composited, no shader work
    container.classList.toggle('is-active', visible);
    if (!visible) return;        // nothing to see → no GPU work at all

    pointer.x = lerp(pointer.x, pointer.tx, 1 - Math.pow(0.001, dt));
    pointer.y = lerp(pointer.y, pointer.ty, 1 - Math.pow(0.001, dt));
    if (!drag.on) { drag.rot += drag.vel; drag.vel *= 0.94; }

    // touch devices: sway with scroll velocity instead of the mouse
    const sy = window.scrollY; sway = lerp(sway, clamp((sy - lastScroll) * 0.004, -0.4, 0.4), 0.15); lastScroll = sy;

    camera.fov = pose.fov; camera.updateProjectionMatrix();
    const visH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    const scale = (pose.h * visH) / PRODUCT_HEIGHT;
    product.scale.setScalar(scale);
    const bob = Math.sin(t * 0.9) * 0.012 * visH;
    product.position.set(pose.x * visW * 0.5, pose.y * visH * 0.5 + bob, 0);
    pivot.rotation.set(pose.rotX + pointer.y * 0.12, pose.rotY + pointer.x * 0.38 + sway, -pointer.x * 0.03, 'YXZ');
    pivot.rotation.order = 'YXZ';
    shadow.position.set(0, -PRODUCT_HEIGHT * 0.62 - bob / Math.max(scale, 0.001), 0);

    particles.update(t, dt, pointer);

    key.position.x = 2.5 + pointer.x * 1.2; rim.position.x = -3 - pointer.x * 0.8;
    renderer.render(scene, camera);
    if (first === false && !container.classList.contains('is-ready')) container.classList.add('is-ready');
  };

  const start = () => { if (!running) { running = true; gsap.ticker.add(tick); } };
  const stop = () => { if (running) { running = false; gsap.ticker.remove(tick); } };
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); container.classList.remove('is-ready'); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { start(); });

  start();
  return {
    start, stop, usingPlaceholder,
    destroy() {
      stop(); ro.disconnect(); ro2.disconnect(); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pointermove', onMove);
      loaded.dispose?.(); particles.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
