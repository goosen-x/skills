// Saves the page open in Playwright as self-contained HTML (CSS, fonts, images inlined; scripts, dev overlays
// and chat widgets removed) into assets/snap/<name>.js as window.SNAP[name]. Mount it with liveFrame(...).
// CLI: node snapshot.mjs <url> <name> [--state storage.json]   (storage state = logged-in session)
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

export async function snapshot(page, name) {
  const html = await page.evaluate(async () => {
    const toData = async (url) => {
      try {
        const r = await fetch(url);
        const b = await r.blob();
        return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
      } catch { return url; }
    };
    // dev-only chrome and third-party widgets
    document.querySelectorAll('nextjs-portal, script, noscript, jdiv, #jivo-iframe-container, [id^="jivo"], iframe').forEach((e) => e.remove());
    for (const e of [...document.querySelectorAll('body *')]) {
      const cs = getComputedStyle(e);
      if (cs.position === 'fixed' && /Localhost|tunnel|direct|поддержка/i.test(e.textContent || '')) e.remove();
    }
    // stylesheets -> inline <style>, with url(...) turned into data URLs
    let css = '';
    for (const sheet of [...document.styleSheets]) {
      let text = '';
      if (sheet.href) { try { text = await (await fetch(sheet.href)).text(); } catch {} }
      else if (sheet.ownerNode) text = sheet.ownerNode.textContent;
      const base = sheet.href || location.href;
      const urls = [...text.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map((m) => m[2]).filter((u) => !u.startsWith('data:'));
      for (const u of new Set(urls)) text = text.split(u).join(await toData(new URL(u, base).href));
      css += text + '\n';
    }
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((e) => e.remove());
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    for (const img of [...document.images]) { const src = img.currentSrc || img.src; img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.src = await toData(src); img.loading = 'eager'; }
    for (const el of [...document.querySelectorAll('[style*="url("]')]) {
      const m = el.getAttribute('style').match(/url\((['"]?)([^'")]+)\1\)/);
      if (m && !m[2].startsWith('data:')) el.setAttribute('style', el.getAttribute('style').split(m[2]).join(await toData(new URL(m[2], location.href).href)));
    }
    return '<!doctype html>' + document.documentElement.outerHTML;
  });
  mkdirSync('assets/snap', { recursive: true });
  writeFileSync(`assets/snap/${name}.js`, `window.SNAP = window.SNAP || {};\nwindow.SNAP[${JSON.stringify(name)}] = ${JSON.stringify(html)};\n`);
  return html.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [url, name] = process.argv.slice(2);
  const si = process.argv.indexOf('--state');
  if (!url || !name) { console.log('usage: node snapshot.mjs <url> <name> [--state storage.json]'); process.exit(1); }
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...(si > 0 ? { storageState: process.argv[si + 1] } : {}) });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(1500);
  console.log(`assets/snap/${name}.js`, await snapshot(p, name), 'chars');
  await b.close();
}
