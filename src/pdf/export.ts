import puppeteer from 'puppeteer-core';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter((p): p is string => !!p);

interface Browser {
  executablePath: string;
  args?: string[];
}

/**
 * A local Chrome/Chromium/Edge install if one exists (every dev machine and
 * most CI images); otherwise the serverless Chromium binary from
 * @sparticuz/chromium, which ships no browser of its own (e.g. Vercel).
 */
async function findChrome(): Promise<Browser> {
  const { access } = await import('node:fs/promises');
  for (const path of CHROME_CANDIDATES) {
    try {
      await access(path);
      return { executablePath: path };
    } catch { /* next candidate */ }
  }
  const chromium = (await import('@sparticuz/chromium')).default;
  return { executablePath: await chromium.executablePath(), args: chromium.args };
}

export async function htmlToPdf(html: string, outputPath: string): Promise<void> {
  const { executablePath, args } = await findChrome();
  const browser = await puppeteer.launch({ executablePath, args, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="width:100%; text-align:center; font-family:Helvetica, Arial, sans-serif;
                    font-size:8pt; color:#5d6d7e;">
          <span class="pageNumber"></span>
        </div>`,
      margin: { top: '20mm', right: '18mm', bottom: '22mm', left: '18mm' },
    });
  } finally {
    await browser.close();
  }
}
