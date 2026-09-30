// node shoot.mjs <url> <name> [--mobile] [--scale 2]
// Full-page screenshot of a live site into assets/shots/<name>.png:
// scrolls first so lazy images load, removes cookie banners / chat widgets, retries flaky hosts.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const [url, name] = process.argv.slice(2);
const mobile = process.argv.includes('--mobile');
const i = process.argv.indexOf('--scale'), scale = i > 0 ? Number(process.argv[i + 1]) : 2;
if (!url || !name) { console.log('usage: node shoot.mjs <url> <name> [--mobile]'); process.exit(1); }
mkdirSync('assets/shots', { recursive: true });

const b = await chromium.launch();
for (let attempt = 1; attempt <= 4; attempt++) {
  const ctx = await b.newContext(mobile ? { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 60000 });
    for (let y = 0; y < 15000; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(150); }
    await p.evaluate(() => {
      for (const e of [...document.querySelectorAll('body *')]) {
        const c = getComputedStyle(e);
        if (c.position !== 'fixed' && c.position !== 'sticky') continue;
        const r = e.getBoundingClientRect();
        if (r.top > 300 || /cookie|куки|jivo|чат|поддержк/i.test((e.textContent || '') + e.id + e.className)) e.remove();
      }
      document.querySelectorAll('nextjs-portal, [id^="jivo"], jdiv').forEach((e) => e.remove());
      scrollTo(0, 0);
    });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `assets/shots/${name}.png`, fullPage: true });
    console.log(`assets/shots/${name}.png`, await p.evaluate(() => document.body.scrollHeight), 'px tall');
    await ctx.close();
    break;
  } catch (e) {
    console.log('attempt', attempt, 'failed:', e.message.split('\n')[0]);
    await ctx.close();
  }
}
await b.close();
