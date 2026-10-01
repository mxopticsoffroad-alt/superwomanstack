export function initFaq(root) {
  root.querySelectorAll('.qa').forEach((qa) => {
    const btn = qa.querySelector('.qa__q'), panel = qa.querySelector('.qa__a');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('is-open', !open);
    });
  });
}
