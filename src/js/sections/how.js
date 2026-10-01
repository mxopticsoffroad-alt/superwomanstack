export function initHow(root) {
  const steps = root.querySelectorAll('[data-step]');
  if (!steps.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { e.target.classList.toggle('is-in', e.isIntersecting); });
  }, { threshold: 0.45 });
  steps.forEach((s) => io.observe(s));
}
