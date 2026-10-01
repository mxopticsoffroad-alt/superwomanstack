const mq = (q) => window.matchMedia(q);

export const DESKTOP_Q = '(min-width: 900px)';
export const isDesktop = () => mq(DESKTOP_Q).matches;
export const prefersReduced = () => mq('(prefers-reduced-motion: reduce)').matches;
export const isCoarse = () => mq('(pointer: coarse)').matches;
export const hasHover = () => mq('(hover: hover) and (pointer: fine)').matches;

/** Data-saver / very low-end signals → skip video + WebGL, keep the layout. */
export function isConstrained() {
  const c = navigator.connection || {};
  return !!c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
}
export function isLowPower() {
  return (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
}

export function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
