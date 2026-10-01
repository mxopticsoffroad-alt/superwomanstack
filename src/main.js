import { boot } from './app.js';

const start = () => boot(document.getElementById('sws'));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
