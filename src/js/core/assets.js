let base = '';

/** Base URL for /assets and /data. Standalone: same origin. Embed: wherever the script was served from. */
export function setAssetBase(url) {
  base = url ? (url.endsWith('/') ? url : url + '/') : '';
}
export const assetUrl = (path) => (/^(https?:)?\/\//.test(path) || path.startsWith('/') ? path : base + path);

/**
 * Markup uses relative "assets/…" URLs. When injected into another origin (Squarespace) they must be
 * rewritten BEFORE the HTML is parsed, otherwise the browser requests them from the wrong host.
 */
export function rewriteAssetUrls(html, assetBase) {
  if (!assetBase) return html;
  // Only inside URL-bearing attributes (src, srcset, poster, data-src*), never in visible text.
  return html.replace(/\b(src|srcset|poster|data-src[\w-]*)="([^"]*)"/g, (_, attr, val) =>
    `${attr}="${val.replace(/(^|,\s*)assets\//g, `$1${assetBase}assets/`)}"`);
}
