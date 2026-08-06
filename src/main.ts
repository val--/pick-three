import { mkdir, writeFile } from 'node:fs/promises';
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
  entryPoints: [new URL('client/keyed.ts', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: new URL('keyed.js', SITE_DIR).pathname,
});
console.log(`Site: ${SITE_DIR.pathname}index.html`);

const pdfPath = new URL('triads.pdf', OUT_DIR);
await htmlToPdf(html, pdfPath.pathname);
console.log(`PDF : ${pdfPath.pathname}`);
