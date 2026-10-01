import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Two builds from one source:
 *   vite build               → dist/        standalone site (index.html, SEO-friendly markup)
 *   vite build --mode embed  → dist-embed/  sws-embed.js + sws-embed.css (loaded by Squarespace)
 */
const bodyFile = resolve('src/body.html');

/** Inlines src/body.html into index.html at <!--@body--> (standalone build + dev). */
const includeBody = () => ({
  name: 'sws-include-body',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replace('<!--@body-->', readFileSync(bodyFile, 'utf8')),
  },
  handleHotUpdate({ file, server }) {
    if (file === bodyFile) server.ws.send({ type: 'full-reload' });
  },
});

export default defineConfig(({ mode }) => {
  const embed = mode === 'embed';
  return {
    base: embed ? './' : '/',
    plugins: [includeBody()],
    publicDir: 'public',
    build: embed
      ? {
          // Not Vite "lib mode": lib mode force-inlines fonts as base64. A plain app build with a JS
          // entry gives one entry file + hashed chunks + cacheable font files.
          outDir: 'dist-embed',
          emptyOutDir: true,
          target: 'es2022',          // embed.js uses top-level await
          assetsDir: 'sws',
          cssCodeSplit: false,
          rollupOptions: {
            input: { 'sws-embed': resolve('src/embed.js') },
            preserveEntrySignatures: 'exports-only',
            output: {
              entryFileNames: 'sws-embed.js',
              chunkFileNames: 'sws/[name]-[hash].js',
              assetFileNames: (info) => ((info.names || [info.name || '']).some((n) => n.endsWith('.css')) ? 'sws-embed.css' : 'sws/[name]-[hash][extname]'),
            },
          },
        }
      : {
          outDir: 'dist',
          assetsDir: 'sws',
          emptyOutDir: true,
          target: 'es2020',
          rollupOptions: { output: { manualChunks: undefined } },
        },
    server: { host: true, port: 5173 },
  };
});
