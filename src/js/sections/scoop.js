import { gsap, onProgress, whenVisible } from '../core/motion.js';
import { smooth, lerp } from '../core/env.js';
import { createScoopScene } from './scoop-scene.js';

export function initScoop(root, { device }) {
  const sec = root.querySelector('[data-scoop]');
  if (!sec) return;
  const canvas = sec.querySelector('[data-scoop-canvas]');
  const l1 = sec.querySelector('[data-scoop-l1]'), l2 = sec.querySelector('[data-scoop-l2]');
  const line = sec.querySelector('[data-scoop-line]');
  const dust = sec.querySelector('.scoop__dust');
  const scene = createScoopScene(canvas, { mobile: device.mobile });

  let target = device.reduced ? 1 : 0, cur = target, visible = false, t = 0;

  const paint = (p) => {
    scene.draw(p, t);
    const vw = window.innerWidth;
    const fade = 1 - smooth(0.8, 0.95, p) * 0.72;
    l1.style.transform = `translate3d(${lerp(0, -vw * 0.045, p)}px,0,0)`; l1.style.opacity = fade;
    l2.style.transform = `translate3d(${lerp(0, vw * 0.045, p)}px,0,0)`; l2.style.opacity = fade;
    const lo = smooth(0.84, 0.96, p);
    line.style.opacity = lo; line.style.transform = `translate3d(0,${(1 - lo) * 26}px,0)`;
    dust.style.transform = `translate3d(0,${lerp(4, -10, p)}%,0)`;
  };

  if (device.reduced) { paint(1); addEventListener('resize', () => { scene.resize(); paint(1); }); return; }

  onProgress(sec, {}, (p) => { target = p; });
  whenVisible(sec, (v) => { visible = v; }, '10% 0px');
  addEventListener('resize', () => scene.resize());

  gsap.ticker.add((_, dtMs) => {
    if (!visible) return;
    t += (dtMs || 16) / 1000;
    cur = lerp(cur, target, 1 - Math.pow(0.0002, (dtMs || 16) / 1000));   // frame-rate independent ease
    paint(cur);
  });
}
