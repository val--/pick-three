import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderMethod } from './render/html.js';
import { renderSite } from './render/site.js';
import { htmlToPdf } from './pdf/export.js';
import { triadsMethod } from '../methods/triads.js';

const OUT_DIR = new URL('../output/', import.meta.url);
const SITE_DIR = new URL('site/', OUT_DIR);

const html = renderMethod(triadsMethod);
await mkdir(SITE_DIR, { recursive: true });

const htmlPath = new URL('triads.html', OUT_DIR);
await writeFile(htmlPath, html);
console.log(`HTML: ${htmlPath.pathname}`);

for (const file of renderSite(triadsMethod)) {
  await writeFile(new URL(file.path, SITE_DIR), file.content);
}

// Client bundle: the root-note picker reuses the domain code as-is
const { build } = await import('esbuild');
await build({
  entryPoints: [fileURLToPath(new URL('client/keyed.ts', import.meta.url))],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: fileURLToPath(new URL('keyed.js', SITE_DIR)),
});
console.log(`Site: ${SITE_DIR.pathname}index.html`);

// The full-method PDF ships with the site (downloadable from the home page)
const pdfPath = fileURLToPath(new URL('triads.pdf', SITE_DIR));
await htmlToPdf(html, pdfPath);
console.log(`PDF : ${pdfPath}`);
