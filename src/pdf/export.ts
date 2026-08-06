import puppeteer from 'puppeteer-core';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter((p): p is string => !!p);

async function findChrome(): Promise<string> {
  const { access } = await import('node:fs/promises');
  for (const path of CHROME_CANDIDATES) {
    try {
      await access(path);
      return path;
    } catch { /* next candidate */ }
  }
  throw new Error('Chrome not found — set CHROME_PATH');
}

export async function htmlToPdf(html: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({
    executablePath: await findChrome(),
    headless: true,
  });
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
