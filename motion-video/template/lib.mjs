import { chromium } from 'playwright';

export async function openStage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DUR);
  // warm-up paints every scene once so background images are decoded before capture
  for (let t = 0.3; t < dur; t += 0.5) await page.evaluate((t) => window.seek(t), t);
  await page.waitForTimeout(300);
  return { browser, page, dur };
}

export async function frame(page, t, type = 'png') {
  await page.evaluate((t) => window.seek(t), t);
  return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 95 } : {}) });
}
