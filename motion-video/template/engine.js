// Motion engine: every frame is a pure function of time. Scenes register an update(u) that sets
// inline styles for local time u; seek(t) paints any moment directly, so render and preview match.
const W = 1920, H = 1080;
const stage = document.getElementById('stage');
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const px = (v) => v + 'px';

// closed-form damped spring 0 → 1; stiff k + low d = snappy with overshoot, high d = no overshoot
function spring(t, k = 170, d = 26) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k), z = d / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}
const sp = (u, t0, k, d) => spring(u - t0, k, d);
// a value with several targets = one spring per change; continuous and still seekable
function track(t, keys, k, d) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d);
  return v;
}
// seeded noise: Math.random would make every render different
function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function el(tag, cls, parent, css, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) Object.assign(e.style, css);
  if (html != null) e.innerHTML = html;
  (parent || stage).appendChild(e);
  return e;
}

// ---------- building blocks

// kinetic type: each letter in its own clipping box, animate inner[i].style.transform
function letters(parent, text, css) {
  const line = el('div', 'abs ln', parent, css);
  const inner = [...text].map((ch) => el('span', '', el('span', '', line), null, ch === ' ' ? '&nbsp;' : ch));
  return { line, inner };
}
// frame with corner marks; set(cx, cy, w, h) every frame
function cropFrame(parent, fill = '#1a1a1a') {
  const w = el('div', 'abs', parent);
  const clip = el('div', 'abs', w, { inset: 0, overflow: 'hidden', background: fill, outline: '1px solid rgba(255,255,255,.07)' });
  [['left', 'top'], ['right', 'top'], ['left', 'bottom'], ['right', 'bottom']].forEach(([a, b]) => el('div', 'cm', w, { [a]: '-4px', [b]: '-4px' }));
  return { w, clip, set(cx, cy, ww, hh) { Object.assign(w.style, { left: px(cx - ww / 2), top: px(cy - hh / 2), width: px(ww), height: px(hh) }); } };
}
// browser window with a screenshot inside; scroll by moving .im
function browserCard(parent, src, url, width, dark = false) {
  const c = el('div', 'card', parent, { width: px(width), background: dark ? '#111' : '#fff' });
  const bar = el('div', 'bar', c, { background: dark ? '#1c1c1f' : '#f1f1f1', color: dark ? '#fff' : '#000' },
    '<i></i><i></i><i></i>' + (url ? `<span>${url}</span>` : ''));
  const vp = el('div', '', c, { overflow: 'hidden', position: 'relative' });
  const im = el('img', '', vp, { width: '100%', display: 'block' });
  im.src = src;
  return { c, bar, vp, im };
}
// live HTML page saved by snapshot.mjs (window.SNAP[name]); query its real DOM in setup(doc)
const IFRAMES = [];
function liveFrame(parent, name, css, setup) {
  const f = el('iframe', 'abs', parent, { border: '0', background: 'transparent', ...css });
  f.setAttribute('scrolling', 'no');
  const loaded = new Promise((res) => { f.onload = res; });
  f.srcdoc = window.SNAP[name];
  IFRAMES.push(loaded.then(async () => {
    const d = f.contentDocument;
    await d.fonts.ready;
    await Promise.all([...d.images].map((i) => i.decode().catch(() => {})));
    if (setup) setup(d);
  }));
  return f;
}
// realistic devices from devices.css; content is laid out in native screen pixels
function cssDevice(parent, cls, targetW, nativeW, color) {
  const wrap = el('div', 'abs', parent);
  const inner = el('div', 'abs', wrap, { left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${targetW / nativeW})` });
  const dev = el('div', `device ${cls} ${color}`, inner, null,
    '<div class="device-frame"><div class="device-screen" style="position:relative;overflow:hidden;background:#fff;isolation:isolate"></div></div><div class="device-stripe"></div><div class="device-header"></div><div class="device-sensors"></div><div class="device-btns"></div><div class="device-power"></div><div class="device-home"></div>');
  dev.style.filter = 'drop-shadow(0 50px 70px rgba(0,0,0,.55))';
  return { wrap, screen: dev.querySelector('.device-screen') };
}
const macbook = (parent, w) => ({ ...cssDevice(parent, 'device-macbook-pro', w, 740, 'device-spacegray'), W: 600, H: 375 });
const iphone = (parent, w) => ({ ...cssDevice(parent, 'device-iphone-14-pro', w, 428, 'device-black'), W: 390, H: 830 });
// cursor + click ring: call update(u, x, y, pressAt) each frame
function cursor(parent, ringColor = '#fff') {
  const ring = el('div', 'abs', parent, { border: `3px solid ${ringColor}`, borderRadius: '50%', zIndex: 20 });
  const cur = el('div', 'abs', parent, { width: '40px', height: '54px', transformOrigin: '0 0', zIndex: 21 },
    '<svg viewBox="0 0 22 32" width="40" height="54"><path d="M1 1 L1 25 L7 19.5 L11.5 30 L15.5 28.3 L11 18 L19 18 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>');
  return {
    update(u, x, y, clicks = [], visible = true) {
      Object.assign(cur.style, { left: px(x), top: px(y), opacity: visible ? 1 : 0 });
      cur.style.transform = `scale(${clicks.some((c) => u > c - .05 && u < c + .07) ? .84 : 1})`;
      const last = clicks.filter((c) => u >= c).pop();
      const r = last == null ? 1 : clamp((u - last) / .45), rr = lerp(12, 90, eo(r));
      Object.assign(ring.style, { left: px(x - rr), top: px(y - rr), width: px(rr * 2), height: px(rr * 2), opacity: last == null ? 0 : .9 * (1 - eo(r)) });
    },
  };
}

// ---------- timeline

const SCENES = [];
function scene(from, to, { bg = '#141414', grid = true } = {}) {
  const root = el('div', 'scene', stage, { background: bg });
  if (grid) el('div', 'grid', root);
  const s = { from, to, dur: to - from, root, update: () => {} };
  SCENES.push(s);
  return s;
}
function draw(t) {
  for (const s of SCENES) {
    const on = t >= s.from && t < s.to;
    s.root.style.display = on ? 'block' : 'none';
    if (on) s.update(t - s.from);
  }
}
// call once after all scenes are defined; extraImages = CSS background images to decode first
function start(DUR, extraImages = []) {
  window.DUR = DUR;
  window.seek = (t) => { draw(Math.min(t, DUR - 1e-6)); return true; };
  window.ready = (async () => {
    await document.fonts.ready;
    await Promise.all(extraImages.map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); }));
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    await Promise.all(IFRAMES);
    // scenes may measure real layout once everything is loaded
    SCENES.forEach((s) => { if (!s.measure) return; s.root.style.display = 'block'; s.measure(); s.root.style.display = 'none'; });
    return true;
  })();
}
