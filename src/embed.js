/**
 * Squarespace embed entry.  Loaded as:  <script type="module" src="https://YOUR-CDN/sws-embed.js">
 *
 *  • Takeover mode (default): on cfg.takeoverPaths the experience replaces the whole page body.
 *  • Inline mode: if the page contains <div id="sws-root"></div> (e.g. in a Code Block) it mounts there.
 *
 * The markup ships inside this bundle (one request, no flash of unstyled content) and every
 * "assets/…" URL is rewritten to the CDN origin before the HTML is parsed.
 */
import body from './body.html?raw';
import { getConfig } from './config.js';
import { rewriteAssetUrls } from './js/core/assets.js';

const here = import.meta.url.replace(/[^/]*$/, '');      // directory this script was served from
const cfg = getConfig();
cfg.assetBase = cfg.assetBase || here;

const path = location.pathname.replace(/\/+$/, '') || '/';
const inline = document.getElementById('sws-root');

// Safety valves so the experience can never lock you out of Squarespace:
//  • inside the editor (the site is framed) → never take over
//  • ?sws=off on any URL → show the plain Squarespace page
const inEditor = window.top !== window.self;
const disabled = new URLSearchParams(location.search).get('sws') === 'off';
const takeover = !disabled && !inEditor && !inline && cfg.takeoverPaths.map((p) => p.replace(/\/+$/, '') || '/').includes(path);
if (!takeover) document.documentElement.classList.remove('sws-pre');

if (!disabled && (inline || takeover)) {
  const mount = inline || Object.assign(document.createElement('div'), { id: 'sws-root' });
  if (takeover) { document.documentElement.classList.add('sws-takeover'); document.body.append(mount); }

  // stylesheet (emitted next to this file by the embed build)
  if (!document.querySelector('link[data-sws-css]')) {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `${here}sws-embed.css` });
    link.dataset.swsCss = ''; document.head.append(link);
    await new Promise((res) => { link.onload = link.onerror = res; setTimeout(res, 2500); });   // avoid FOUC, never hang
  }
  document.documentElement.classList.add('sws-js');
  document.documentElement.classList.remove('sws-pre');
  mount.innerHTML = rewriteAssetUrls(body, cfg.assetBase);

  const { boot } = await import('./app.js');
  boot(mount.querySelector('#sws'), cfg);
}
